import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { generateLeadsCSV } from '@/lib/csv';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || undefined;
  const campaignId = searchParams.get('campaignId') || undefined;

  const leads = await prisma.lead.findMany({
    where: {
      ...(clientId && { clientId }),
      ...(campaignId && { campaignId }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      campaign: { select: { name: true, code: true } },
    },
  });

  const csvContent = generateLeadsCSV(leads);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leadflow_admin_all_leads_${Date.now()}.csv"`,
    },
  });
}
