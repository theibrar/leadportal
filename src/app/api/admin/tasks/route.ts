import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const filter = searchParams.get('filter'); // 'pending' | 'completed' | 'all'

  const whereClause: any = {};
  if (clientId) whereClause.clientId = clientId;
  if (filter === 'pending') whereClause.isCompleted = false;
  if (filter === 'completed') whereClause.isCompleted = true;

  const tasks = await prisma.leadTask.findMany({
    where: whereClause,
    include: {
      client: {
        select: { id: true, name: true, companyCode: true },
      },
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
    orderBy: [
      { isCompleted: 'asc' },
      { dueDate: 'asc' },
    ],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const body = await request.json();
  const { clientId, title, taskType, dueDate, dueTime, notes, leadId } = body;

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
  }
  if (!dueDate) {
    return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
  }

  const task = await prisma.leadTask.create({
    data: {
      clientId,
      leadId: leadId || null,
      userId: session.userId || null,
      title: title.trim(),
      taskType: taskType || 'FOLLOW_UP',
      dueDate: new Date(dueDate),
      dueTime: dueTime || null,
      notes: notes ? notes.trim() : null,
      isCompleted: false,
    },
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

  return NextResponse.json({ success: true, task }, { status: 201 });
}
