import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractLeadFields } from '@/lib/payloadParser';
import { analyzeLeadQuality } from '@/lib/leadQuality';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Handle CORS Preflight OPTIONS requests for cross-origin browser form submissions
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ webhookToken: string }> }) {
  const startTime = Date.now();
  const { webhookToken } = await params;
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  let rawPayload: any = {};
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const obj: Record<string, any> = {};
      formData.forEach((value, key) => {
        obj[key] = value;
      });
      rawPayload = obj;
    } else {
      const text = await request.text();
      try {
        rawPayload = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        const obj: Record<string, any> = {};
        let keysCount = 0;
        params.forEach((val, key) => {
          obj[key] = val;
          keysCount++;
        });
        if (keysCount > 0 && Object.keys(obj).some((k) => k !== text)) {
          rawPayload = obj;
        } else {
          rawPayload = { rawBody: text || 'Empty Body' };
        }
      }
    }
  } catch (err: any) {
    rawPayload = { rawBody: 'Error parsing body: ' + err.message };
  }

  // 1. Lookup ClientCampaign assignment
  const assignment = await prisma.clientCampaign.findUnique({
    where: { webhookToken },
    include: {
      client: {
        include: {
          users: {
            include: { profile: true },
          },
        },
      },
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
    return NextResponse.json({ error: 'Invalid or inactive webhook endpoint' }, { status: 404, headers: corsHeaders });
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
        { status: 403, headers: corsHeaders }
      );
    }
  }

  // 2. Extract payload fields with flexible fallbacks
  const { firstName, lastName, email, phone, source } = extractLeadFields(rawPayload);

  // 2b. Lead Quality, Spam & Deduplication Engine
  const clientTimezone = assignment.client.users?.[0]?.profile?.timezone || 'UTC';
  const quality = await analyzeLeadQuality({
    prisma,
    clientId: assignment.clientId,
    email,
    phone,
    firstName,
    lastName,
    rawPayload,
    clientTimezone,
  });

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
        status: quality.isSpam ? 'UNQUALIFIED' : 'NEW',
        score: quality.score,
        qualityGrade: quality.qualityGrade,
        isDuplicate: quality.isDuplicate,
        duplicateCount: quality.duplicateCount,
        isSpam: quality.isSpam,
        spamReason: quality.spamReason,
        timezone: quality.detectedTimezone,
        customData: JSON.stringify(rawPayload),
        ipAddress,
        userAgent: request.headers.get('user-agent') || undefined,
        notes:
          quality.isDuplicate || quality.isSpam
            ? {
                create: {
                  authorName: 'Quality Bot',
                  authorRole: 'ADMIN',
                  content: quality.isSpam
                    ? `⚠️ Flagged as SPAM: ${quality.spamReason}`
                    : `⚠️ Duplicate Lead: ${quality.duplicateCount} existing submission(s) found.`,
                },
              }
            : undefined,
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
        quality: {
          score: lead.score,
          grade: lead.qualityGrade,
          isDuplicate: lead.isDuplicate,
          duplicateCount: lead.duplicateCount,
          isSpam: lead.isSpam,
          timezone: lead.timezone,
        },
      },
      { status: 201, headers: corsHeaders }
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

    return NextResponse.json({ error: 'Failed to process lead ingestion' }, { status: 500, headers: corsHeaders });
  }
}
