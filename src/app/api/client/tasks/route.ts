import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  const filter = searchParams.get('filter'); // 'pending' | 'completed' | 'all'

  const whereClause: any = {
    clientId: session.clientId,
  };

  if (leadId) {
    whereClause.leadId = leadId;
  }

  if (filter === 'pending') {
    whereClause.isCompleted = false;
  } else if (filter === 'completed') {
    whereClause.isCompleted = true;
  }

  const tasks = await prisma.leadTask.findMany({
    where: whereClause,
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
    orderBy: [
      { isCompleted: 'asc' },
      { dueDate: 'asc' },
    ],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized: Client context required' }, { status: 403 });
  }

  const body = await request.json();
  const { title, taskType, dueDate, dueTime, notes, leadId } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
  }

  if (!dueDate) {
    return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
  }

  // Validate lead ownership if leadId provided
  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { clientId: true },
    });
    if (!lead || lead.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Associated lead not found or unauthorized' }, { status: 404 });
    }
  }

  const task = await prisma.leadTask.create({
    data: {
      clientId: session.clientId,
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

  return NextResponse.json({ success: true, task }, { status: 201 });
}
