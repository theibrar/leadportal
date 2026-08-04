import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const assignments = await prisma.clientCampaign.findMany({
    where: { clientId: session.clientId },
    orderBy: { assignedAt: 'desc' },
    include: {
      campaign: true,
      _count: { select: { leads: true, webhookLogs: true } },
    },
  });

  const campaignsWithUrls = assignments.map((a) => ({
    id: a.id,
    campaignId: a.campaignId,
    name: a.campaign.name,
    code: a.campaign.code,
    description: a.campaign.description,
    webhookToken: a.webhookToken,
    secretKey: a.secretKey,
    webhookUrl: `/api/webhooks/ingest/${a.webhookToken}`,
    assignedAt: a.assignedAt,
    isActive: a.isActive,
    allowedDomains: a.allowedDomains,
    leadCount: a._count.leads,
    logCount: a._count.webhookLogs,
  }));

  return NextResponse.json({ campaigns: campaignsWithUrls });
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { assignmentId, allowedDomains, isActive } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Security check: verify ownership
    const assignment = await prisma.clientCampaign.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this campaign assignment' }, { status: 403 });
    }

    const updated = await prisma.clientCampaign.update({
      where: { id: assignmentId },
      data: {
        ...(allowedDomains !== undefined ? { allowedDomains: allowedDomains ? allowedDomains.trim() : null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('Error updating client campaign assignment:', error);
    return NextResponse.json({ error: 'Failed to update campaign settings' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Security check: verify ownership
    const assignment = await prisma.clientCampaign.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this campaign assignment' }, { status: 403 });
    }

    await prisma.clientCampaign.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true, message: 'Campaign assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting client campaign assignment:', error);
    return NextResponse.json({ error: 'Failed to delete campaign assignment' }, { status: 500 });
  }
}
