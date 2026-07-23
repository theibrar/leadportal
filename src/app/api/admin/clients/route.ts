import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { hashPassword, generateRandomPassword } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        select: { id: true, email: true, isActive: true, role: true },
      },
      assignments: {
        include: {
          campaign: true,
        },
      },
      _count: {
        select: { leads: true, webhookLogs: true },
      },
    },
  });

  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, companyCode, contactEmail, contactPhone, password, allowedIps } = body;

    if (!name || !companyCode || !contactEmail) {
      return NextResponse.json({ error: 'Name, company code, and email are required' }, { status: 400 });
    }

    const existingCode = await prisma.client.findUnique({ where: { companyCode: companyCode.toUpperCase() } });
    if (existingCode) {
      return NextResponse.json({ error: 'Company code already exists' }, { status: 400 });
    }

    // Custom specified password or generated default
    const chosenPassword = password && password.trim().length > 0 ? password.trim() : generateRandomPassword(12);
    const hashedPassword = await hashPassword(chosenPassword);

    const newClient = await prisma.client.create({
      data: {
        name,
        companyCode: companyCode.toUpperCase(),
        contactEmail,
        contactPhone: contactPhone || null,
        allowedIps: allowedIps ? allowedIps.trim() : null,
        users: {
          create: {
            email: contactEmail,
            passwordHash: hashedPassword,
            role: 'CLIENT',
            profile: {
              create: {
                fullName: name,
                companyName: name,
                phone: contactPhone || null,
              },
            },
          },
        },
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json({
      success: true,
      client: newClient,
      generatedCredentials: {
        email: contactEmail,
        temporaryPassword: chosenPassword,
      },
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}
