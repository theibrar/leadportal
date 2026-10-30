import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.leadTask.findUnique({
    where: { id },
  });

  if (!existing || existing.clientId !== session.clientId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await request.json();
  const updateData: any = {};

  if (typeof body.isCompleted === 'boolean') {
    updateData.isCompleted = body.isCompleted;
    updateData.completedAt = body.isCompleted ? new Date() : null;
  }
  if (body.title) updateData.title = body.title.trim();
  if (body.taskType) updateData.taskType = body.taskType;
  if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
  if (body.dueTime !== undefined) updateData.dueTime = body.dueTime;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const updatedTask = await prisma.leadTask.update({
    where: { id },
    data: updateData,
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          campaign: {
            select: { name: true, code: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ success: true, task: updatedTask });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.leadTask.findUnique({
    where: { id },
  });

  if (!existing || existing.clientId !== session.clientId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  await prisma.leadTask.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: 'Task deleted successfully' });
}
