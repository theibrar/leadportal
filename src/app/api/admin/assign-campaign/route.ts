import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { clientId, campaignId } = body;

    if (!clientId || !campaignId) {
      return NextResponse.json({ error: 'Client ID and Campaign ID are required' }, { status: 400 });
    }

    // Unlimited campaign assignments supported! Generate unique webhook token
    const webhookToken = `whk_${randomBytes(8).toString('hex')}`;
    const secretKey = `sec_${randomBytes(12).toString('hex')}`;

    const assignment = await prisma.clientCampaign.create({
      data: {
        clientId,
        campaignId,
        webhookToken,
        secretKey,
      },
      include: {
        client: true,
        campaign: true,
      },
    });

    return NextResponse.json({
      success: true,
      assignment,
      webhookUrl: `/api/webhooks/ingest/${webhookToken}`,
    });
  } catch (error: any) {
    console.error('Error assigning campaign:', error);
    return NextResponse.json({ error: 'Failed to assign campaign' }, { status: 500 });
  }
}
