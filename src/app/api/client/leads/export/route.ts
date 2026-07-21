import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { generateLeadsCSV } from '@/lib/csv';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || undefined;

  // STRICT TENANT ISOLATION
  const leads = await prisma.lead.findMany({
    where: {
      clientId: session.clientId,
      ...(campaignId && { campaignId }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      campaign: { select: { name: true } },
    },
  });

  const csvContent = generateLeadsCSV(leads);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="client_leads_export_${session.clientId}_${Date.now()}.csv"`,
    },
  });
}
