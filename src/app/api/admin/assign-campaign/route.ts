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
    const { clientId, campaignId, allowedDomains } = body;

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
        allowedDomains: allowedDomains ? allowedDomains.trim() : null,
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

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { assignmentId, allowedDomains, isActive } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const updated = await prisma.clientCampaign.update({
      where: { id: assignmentId },
      data: {
        ...(allowedDomains !== undefined ? { allowedDomains: allowedDomains ? allowedDomains.trim() : null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      include: {
        client: true,
        campaign: true,
      },
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Failed to update assignment settings' }, { status: 500 });
  }
}
