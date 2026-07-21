import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || undefined;
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const whereClause: any = {};
  if (clientId) whereClause.clientId = clientId;

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      whereClause.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  // 1. Fetch Client Submission Statistics
  const clientsWithSubmissions = await prisma.client.findMany({
    include: {
      _count: {
        select: { leads: true, webhookLogs: true },
      },
      assignments: {
        include: {
          campaign: true,
        },
      },
    },
  });

  const clientsSummary = clientsWithSubmissions.map((c) => ({
    id: c.id,
    name: c.name,
    companyCode: c.companyCode,
    contactEmail: c.contactEmail,
    isActive: c.isActive,
    totalLeads: c._count.leads,
    totalWebhookLogs: c._count.webhookLogs,
    activeCampaigns: c.assignments.length,
  }));

  // 2. Fetch Detailed Submission Logs Feed
  const recentLogs = await prisma.webhookLog.findMany({
    where: {
      ...(clientId && { clientId }),
      ...(startDate || endDate ? {
        receivedAt: {
          ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
          ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
        }
      } : {}),
    },
    orderBy: { receivedAt: 'desc' },
    take: 150,
    include: {
      client: { select: { id: true, name: true, companyCode: true } },
      clientCampaign: {
        include: {
          campaign: { select: { name: true, code: true } },
        },
      },
    },
  });

  return NextResponse.json({
    totalSubmissions: recentLogs.length,
    clientsSummary,
    recentLogs,
  });
}
