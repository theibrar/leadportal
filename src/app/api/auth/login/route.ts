import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

function isIpAllowed(requestIp: string, allowedIpsRaw: string | null | undefined): boolean {
  if (!allowedIpsRaw || !allowedIpsRaw.trim()) return true;

  const allowedList = allowedIpsRaw
    .split(/[\n,\s]+/)
    .map((ip) => ip.trim())
    .filter(Boolean);

  if (allowedList.length === 0) return true;

  const reqIpClean = requestIp.trim();
  const isReqLocalhost = reqIpClean === '127.0.0.1' || reqIpClean === '::1' || reqIpClean === '::ffff:127.0.0.1';

  return allowedList.some((allowed) => {
    if (allowed === reqIpClean) return true;
    if (isReqLocalhost && (allowed === '127.0.0.1' || allowed === '::1' || allowed === 'localhost')) return true;
    if (reqIpClean.endsWith(allowed) || allowed.endsWith(reqIpClean)) return true;
    return false;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        client: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    // IP Whitelist enforcement for Client tenant users
    if (user.role === 'CLIENT' && user.client?.allowedIps) {
      const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const clientIp = rawIp.split(',')[0].trim();

      if (!isIpAllowed(clientIp, user.client.allowedIps)) {
        return NextResponse.json(
          {
            error: `Access Denied: Your IP address (${clientIp}) is not whitelisted for client "${user.client.name}". Please contact administrator.`,
          },
          { status: 403 }
        );
      }
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionData = {
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'CLIENT',
      clientId: user.clientId,
      fullName: user.profile?.fullName || user.email,
      companyName: user.client?.name || user.profile?.companyName || 'LeadFlow Platform',
    };

    const token = signToken(sessionData);

    const response = NextResponse.json({
      success: true,
      user: sessionData,
      token,
    });

    response.cookies.set('leadflow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
