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

  // 2. Validate payload fields
  const firstName = rawPayload.firstName || rawPayload.first_name || rawPayload.name || 'Anonymous';
  const lastName = rawPayload.lastName || rawPayload.last_name || '';
  const email = rawPayload.email || rawPayload.contact_email;
  const phone = rawPayload.phone || rawPayload.contact_phone || rawPayload.mobile || '';
  const source = rawPayload.source || rawPayload.utm_source || 'WEBHOOK_LANDING_PAGE';

  if (!email) {
    const executionTimeMs = Date.now() - startTime;
    await prisma.webhookLog.create({
      data: {
        clientId: assignment.clientId,
        clientCampaignId: assignment.id,
        status: 'FAILED',
        httpStatusCode: 400,
        payload: JSON.stringify(rawPayload),
        errorMessage: 'Validation error: Missing required "email" field',
        ipAddress,
        executionTimeMs,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed: "email" field is required in payload',
      },
      { status: 400 }
    );
  }

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
