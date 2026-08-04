'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Filter,
  Webhook,
  Send,
  LogOut,
  ShieldAlert,
  Building2,
  Activity,
  User,
} from 'lucide-react';

interface SidebarProps {
  userRole: 'ADMIN' | 'CLIENT';
  companyName?: string;
  onNavClick?: () => void;
}

export function Sidebar({ userRole, companyName, onNavClick }: SidebarProps) {
  const pathname = usePathname();

  const adminNav = [
    { label: 'Overview Analytics', href: '/admin', icon: LayoutDashboard },
    { label: 'Clients Management', href: '/admin/clients', icon: Users },
    { label: 'Campaigns & Webhooks', href: '/admin/campaigns', icon: Megaphone },
    { label: 'Client Activity Stream', href: '/admin/activity', icon: Activity },
    { label: 'Master Lead Directory', href: '/admin/leads', icon: Filter },
    { label: 'Webhook Logs', href: '/admin/webhooks', icon: Webhook },
    { label: 'Live Webhook Tester', href: '/admin/simulator', icon: Send },
    { label: 'My Account Settings', href: '/admin/profile', icon: User },
  ];

  const clientNav = [
    { label: 'Dashboard Overview', href: '/client', icon: LayoutDashboard },
    { label: 'Assigned Campaigns', href: '/client/campaigns', icon: Megaphone },
    { label: 'My Lead Records', href: '/client/leads', icon: Filter },
    { label: 'Account Profile', href: '/client/profile', icon: User },
  ];

  const navItems = userRole === 'ADMIN' ? adminNav : clientNav;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col h-full lg:h-screen sticky top-0 shadow-xs">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-100">
        <a
          href="http://ibrasoft.com/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavClick}
          className="flex flex-col gap-2.5 hover:opacity-80 transition-opacity"
        >
          <img src="/ibrasoft-full-logo.svg" alt="IbraSoft Logo" className="h-11 w-auto object-contain object-left" />
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono font-semibold text-slate-800" style={{ letterSpacing: '-0.03em' }}>Leads Portal</span>
            <span className="text-[9px] font-mono font-semibold tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
              v1.0.1
            </span>
          </div>
        </a>
      </div>

      {/* Role & Context Badge */}
      <div className="mx-4 my-4 p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${userRole === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
          {userRole === 'ADMIN' ? <ShieldAlert className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-slate-900 truncate">
            {userRole === 'ADMIN' ? 'Platform Admin' : (companyName || 'Client Tenant')}
          </p>
          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
            userRole === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {userRole} Role
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Navigation</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Credit & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <p className="text-[11px] font-semibold text-slate-400 text-center">
          Designed and developed by{' '}
          <a
            href="http://ibrasoft.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-bold hover:underline"
          >
            IbraSoft
          </a>
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
