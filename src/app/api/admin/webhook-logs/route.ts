import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const whereClause: any = {};

  if (startDate || endDate) {
    whereClause.receivedAt = {};
    if (startDate) {
      whereClause.receivedAt.gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      whereClause.receivedAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  const logs = await prisma.webhookLog.findMany({
    where: whereClause,
    orderBy: { receivedAt: 'desc' },
    take: 200,
    include: {
      client: { select: { id: true, name: true, companyCode: true } },
      clientCampaign: {
        include: {
          campaign: { select: { name: true, code: true } },
        },
      },
    },
  });

  return NextResponse.json({ logs });
}
