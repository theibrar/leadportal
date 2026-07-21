import { cookies } from 'next/headers';
import { verifyToken, UserSession } from '@/lib/auth';

export async function getSession(request?: Request): Promise<UserSession | null> {
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = verifyToken(token);
      if (session) return session;
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('leadflow_session')?.value;
  if (!token) return null;
  return verifyToken(token);
}
