import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { hashPassword, comparePassword } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true, client: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.profile?.fullName || user.client?.name || '',
      phone: user.profile?.phone || user.client?.contactPhone || '',
      companyName: user.client?.name || '',
      companyCode: user.client?.companyCode || '',
      timezone: user.profile?.timezone || 'UTC',
    },
  });
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { fullName, phone, timezone, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Password Update logic
    if (newPassword && newPassword.trim().length > 0) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }
      const isValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      const hashed = await hashPassword(newPassword.trim());
      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash: hashed },
      });
    }

    // Update Profile
    await prisma.profile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        fullName: fullName || user.email,
        phone: phone || null,
        companyName: session.companyName || '',
        timezone: timezone || 'UTC',
      },
      update: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(timezone && { timezone }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating client profile:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
