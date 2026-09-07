import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { clientId: true },
  });

  if (!lead || lead.clientId !== session.clientId) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const notes = await prisma.leadNote.findMany({
    where: { leadId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ notes });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { clientId: true },
  });

  if (!lead || lead.clientId !== session.clientId) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const note = await prisma.leadNote.create({
    data: {
      leadId: id,
      authorName: session.fullName || 'Client User',
      authorRole: 'CLIENT',
      content: content.trim(),
    },
  });

  return NextResponse.json({ success: true, note });
}
