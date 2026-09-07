import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin required' }, { status: 403 });
  }

  const { id } = await params;
  const notes = await prisma.leadNote.findMany({
    where: { leadId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ notes });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin required' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const note = await prisma.leadNote.create({
    data: {
      leadId: id,
      authorName: session.fullName || 'Admin',
      authorRole: 'ADMIN',
      content: content.trim(),
    },
  });

  return NextResponse.json({ success: true, note });
}
