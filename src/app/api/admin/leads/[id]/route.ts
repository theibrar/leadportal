import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin required' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CONVERTED', 'UNQUALIFIED'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!existingLead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const previousStatus = existingLead.status;

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
    },
    include: {
      client: { select: { id: true, name: true, companyCode: true } },
      campaign: { select: { id: true, name: true, code: true } },
    },
  });

  if (status && status !== previousStatus) {
    try {
      await prisma.leadNote.create({
        data: {
          leadId: id,
          authorName: session.fullName || 'Admin',
          authorRole: 'ADMIN',
          content: `Status updated from ${previousStatus} to ${status}`,
        },
      });
    } catch {
      // Ignore if notes table is not yet migrated
    }
  }

  return NextResponse.json({ success: true, lead: updatedLead });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin required' }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, companyCode: true } },
      campaign: { select: { id: true, name: true, code: true } },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
