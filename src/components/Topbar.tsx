'use client';

import { UserSession } from '@/lib/auth';
import { Shield, Building, Menu } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  user: UserSession;
  onToggleMobileMenu?: () => void;
}

export function Topbar({ user, onToggleMobileMenu }: TopbarProps) {
  const profileHref = user.role === 'ADMIN' ? '/admin/profile' : '/client/profile';

  return (
    <header className="h-16 bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 lg:hidden transition-all"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 sm:gap-2">
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 animate-pulse"></span> IbraSoft LeadPortal
        </span>
        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700 hidden sm:inline-block">
          v1.0.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* User Role Badge & Profile Link */}
        <Link href={profileHref} className="flex items-center gap-2 hover:opacity-80 transition-all">
          <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
            {user.role === 'ADMIN' ? <Shield className="w-4 h-4 text-amber-600" /> : <Building className="w-4 h-4 text-blue-600" />}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase ${
            user.role === 'ADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {user.role}
          </span>
        </Link>
      </div>
    </header>
  );
}
