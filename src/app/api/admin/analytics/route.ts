import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const [
    totalClients,
    totalCampaigns,
    totalLeads,
    leadsByStatusRaw,
    leadsBySourceRaw,
    recentLeads,
    clientsWithLeadCount,
    totalWebhookLogs,
    successWebhookLogs,
    campaignsWithLeadCount,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.campaign.count(),
    prisma.lead.count(),
    prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.lead.groupBy({
      by: ['source'],
      _count: { source: true },
    }),
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, companyCode: true } },
        campaign: { select: { name: true, code: true } },
      },
    }),
    prisma.client.findMany({
      include: {
        _count: { select: { leads: true } },
      },
      orderBy: {
        leads: { _count: 'desc' },
      },
    }),
    prisma.webhookLog.count(),
    prisma.webhookLog.count({ where: { status: 'SUCCESS' } }),
    prisma.campaign.findMany({
      include: {
        _count: { select: { leads: true } },
      },
    }),
  ]);

  const webhookSuccessRate = totalWebhookLogs > 0
    ? `${((successWebhookLogs / totalWebhookLogs) * 100).toFixed(1)}%`
    : '100.0%';

  const leadsByCampaign = campaignsWithLeadCount.map((c) => ({
    name: c.name,
    code: c.code,
    count: c._count.leads,
  }));

  const leadsByClient = clientsWithLeadCount.map((c) => ({
    name: c.name,
    code: c.companyCode,
    count: c._count.leads,
    isActive: c.isActive,
  }));

  const leadsByStatus = leadsByStatusRaw.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));

  const leadsBySource = leadsBySourceRaw.map((item) => ({
    source: item.source,
    count: item._count.source,
  }));

  return NextResponse.json({
    totalClients,
    totalCampaigns,
    totalLeads,
    leadsByCampaign,
    leadsByClient,
    leadsByStatus,
    leadsBySource,
    recentLeads,
    webhookSuccessRate,
  });
}
