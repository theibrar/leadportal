import { getSession } from '@/lib/getSession';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  return <DashboardShell user={session}>{children}</DashboardShell>;
}
