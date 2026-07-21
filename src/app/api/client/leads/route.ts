import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const campaignId = searchParams.get('campaignId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const whereClause: any = {
    clientId: session.clientId, // Mandatory Tenant Isolation
  };

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  if (status) whereClause.status = status;
  if (campaignId) whereClause.campaignId = campaignId;

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      whereClause.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      campaign: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json({ leads, count: leads.length });
}
