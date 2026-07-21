import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignments: {
        include: {
          client: { select: { id: true, name: true, companyCode: true } },
        },
      },
      _count: {
        select: { leads: true },
      },
    },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ error: 'Campaign code already exists or invalid data' }, { status: 400 });
  }
}
