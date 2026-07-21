import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { hashPassword } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { name, contactEmail, contactPhone, isActive, newPassword } = body;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(contactEmail && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Find users related to this client tenant
    const clientUsers = await prisma.user.findMany({
      where: { clientId: id },
    });

    let newHash: string | null = null;
    if (newPassword && newPassword.trim().length > 0) {
      newHash = await hashPassword(newPassword.trim());
    }

    for (const u of clientUsers) {
      const userUpdate: any = {};
      if (contactEmail && contactEmail !== u.email) userUpdate.email = contactEmail;
      if (isActive !== undefined) userUpdate.isActive = isActive;
      if (newHash) userUpdate.passwordHash = newHash;

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: u.id },
          data: userUpdate,
        });
      }
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'CLIENT_UPDATED',
        details: JSON.stringify({ clientId: id, name, passwordChanged: !!newHash }),
      },
    });

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error: any) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
