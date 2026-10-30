import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const { id } = await params;
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
      client: { select: { id: true, name: true, companyCode: true } },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          campaign: { select: { name: true, code: true } },
        },
      },
    },
  });

  return NextResponse.json({ success: true, task: updatedTask });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.leadTask.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: 'Task deleted successfully' });
}
