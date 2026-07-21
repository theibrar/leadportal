import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || (session.role !== 'CLIENT' && session.role !== 'ADMIN') || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const clientId = session.clientId;

  const [totalLeads, totalAssignedCampaigns, leadsByStatusRaw, recentLeads, assignedCampaigns] = await Promise.all([
    prisma.lead.count({ where: { clientId } }),
    prisma.clientCampaign.count({ where: { clientId, isActive: true } }),
    prisma.lead.groupBy({
      by: ['status'],
      where: { clientId },
      _count: { status: true },
    }),
    prisma.lead.findMany({
      where: { clientId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: { select: { name: true, code: true } },
      },
    }),
    prisma.clientCampaign.findMany({
      where: { clientId, isActive: true },
      include: {
        campaign: { select: { id: true, name: true, code: true } },
        _count: { select: { leads: true } },
      },
    }),
  ]);

  const leadsByStatus = leadsByStatusRaw.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));

  const leadsByCampaign = assignedCampaigns.map((ac) => ({
    name: ac.campaign.name,
    code: ac.campaign.code,
    count: ac._count.leads,
    webhookToken: ac.webhookToken,
  }));

  return NextResponse.json({
    totalLeads,
    totalAssignedCampaigns,
    leadsByStatus,
    leadsByCampaign,
    recentLeads,
  });
}
