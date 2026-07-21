import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const assignments = await prisma.clientCampaign.findMany({
    where: { clientId: session.clientId, isActive: true },
    orderBy: { assignedAt: 'desc' },
    include: {
      campaign: true,
      _count: { select: { leads: true, webhookLogs: true } },
    },
  });

  const campaignsWithUrls = assignments.map((a) => ({
    id: a.id,
    campaignId: a.campaignId,
    name: a.campaign.name,
    code: a.campaign.code,
    description: a.campaign.description,
    webhookToken: a.webhookToken,
    secretKey: a.secretKey,
    webhookUrl: `/api/webhooks/ingest/${a.webhookToken}`,
    assignedAt: a.assignedAt,
    leadCount: a._count.leads,
    logCount: a._count.webhookLogs,
  }));

  return NextResponse.json({ campaigns: campaignsWithUrls });
}
