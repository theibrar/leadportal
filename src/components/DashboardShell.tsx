'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { UserSession } from '@/lib/auth';
import { X } from 'lucide-react';

interface DashboardShellProps {
  user: UserSession;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased relative">
      {/* Desktop Sidebar (visible on lg screens and up) */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar userRole={user.role} companyName={user.companyName} />
      </div>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 font-bold rounded-lg"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>

            <Sidebar
              userRole={user.role}
              companyName={user.companyName}
              onNavClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          user={user}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
