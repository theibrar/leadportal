import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ webhookToken: string }> }) {
  const startTime = Date.now();
  const { webhookToken } = await params;
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  let rawPayload: any = {};
  try {
    rawPayload = await request.json();
  } catch (err) {
    rawPayload = { rawBody: 'Invalid JSON' };
  }

  // 1. Lookup ClientCampaign assignment
  const assignment = await prisma.clientCampaign.findUnique({
    where: { webhookToken },
    include: {
      client: true,
      campaign: true,
    },
  });

  if (!assignment || !assignment.isActive || !assignment.client.isActive) {
    const executionTimeMs = Date.now() - startTime;
    if (assignment) {
      await prisma.webhookLog.create({
        data: {
          clientId: assignment.clientId,
          clientCampaignId: assignment.id,
          status: 'REJECTED',
          httpStatusCode: 403,
          payload: JSON.stringify(rawPayload),
          errorMessage: 'Campaign assignment or client is inactive',
          ipAddress,
          executionTimeMs,
        },
      });
    }
    return NextResponse.json({ error: 'Invalid or inactive webhook endpoint' }, { status: 404 });
  }

  // 1b. Domain Whitelist Validation
  if (assignment.allowedDomains && assignment.allowedDomains.trim() !== '') {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    const extractHost = (urlStr: string) => {
      if (!urlStr) return '';
      try {
        const u = new URL(urlStr);
        return u.hostname.toLowerCase();
      } catch {
        return urlStr.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
      }
    };

    const originHost = extractHost(origin);
    const refererHost = extractHost(referer);

    const allowedList = assignment.allowedDomains
      .split(/[\n,\s]+/)
      .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0])
      .filter(Boolean);

    const isDomainAllowed = allowedList.some((allowed) => {
      if (originHost && (originHost === allowed || originHost.endsWith('.' + allowed))) return true;
      if (refererHost && (refererHost === allowed || refererHost.endsWith('.' + allowed))) return true;
      return false;
    });

    if (!isDomainAllowed) {
      const executionTimeMs = Date.now() - startTime;
      await prisma.webhookLog.create({
        data: {
          clientId: assignment.clientId,
          clientCampaignId: assignment.id,
          status: 'REJECTED',
          httpStatusCode: 403,
          payload: JSON.stringify(rawPayload),
          errorMessage: `Domain not whitelisted. Request Origin: "${originHost || 'None'}", Referer: "${refererHost || 'None'}"`,
          ipAddress,
          executionTimeMs,
        },
      });
      return NextResponse.json(
        { error: 'Forbidden: Webhook ingestion request origin domain is not whitelisted' },
        { status: 403 }
      );
    }
  }

  // 2. Extract payload fields with flexible fallbacks
  const firstName = rawPayload.firstName || rawPayload.first_name || rawPayload.name || 'Anonymous';
  const lastName = rawPayload.lastName || rawPayload.last_name || '';
  const email = rawPayload.email || rawPayload.contact_email || rawPayload.mail || 'N/A';
  const phone = rawPayload.phone || rawPayload.contact_phone || rawPayload.mobile || rawPayload.phoneNumber || '';
  const source = rawPayload.source || rawPayload.utm_source || 'WEBHOOK_LANDING_PAGE';

  // 3. Create Lead and WebhookLog in database
  try {
    const lead = await prisma.lead.create({
      data: {
        clientId: assignment.clientId,
        campaignId: assignment.campaignId,
        clientCampaignId: assignment.id,
        firstName,
        lastName,
        email,
        phone,
        source,
        status: 'NEW',
        customData: JSON.stringify(rawPayload),
        ipAddress,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    const executionTimeMs = Date.now() - startTime;

    await prisma.webhookLog.create({
      data: {
        clientId: assignment.clientId,
        clientCampaignId: assignment.id,
        status: 'SUCCESS',
        httpStatusCode: 201,
        payload: JSON.stringify(rawPayload),
        ipAddress,
        executionTimeMs,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lead successfully ingested',
        leadId: lead.id,
        tenant: assignment.client.name,
        campaign: assignment.campaign.name,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    await prisma.webhookLog.create({
      data: {
        clientId: assignment.clientId,
        clientCampaignId: assignment.id,
        status: 'FAILED',
        httpStatusCode: 500,
        payload: JSON.stringify(rawPayload),
        errorMessage: error.message || 'Database insertion error',
        ipAddress,
        executionTimeMs,
      },
    });

    return NextResponse.json({ error: 'Failed to process lead ingestion' }, { status: 500 });
  }
}
