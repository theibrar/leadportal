'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        if (data.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/client');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 overflow-hidden font-sans bg-slate-900">
      {/* Premium Background Artwork Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition-transform duration-1000"
        style={{ backgroundImage: "url('/login-bg.webp')" }}
      />

      {/* Radiant Gradient Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-blue-600/30 to-indigo-500/20 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/60 to-slate-950/90 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10 relative">
        {/* Single White Floating Card Container holding Logo, Branding & Form */}
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl border border-white/80 space-y-6 shadow-2xl">
          {/* Logo & Branding INSIDE Form Container */}
          <div className="text-center space-y-3 pb-2 border-b border-slate-100">
            <a
              href="http://ibrasoft.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              <img src="/ibrasoft-full-logo.svg" alt="IbraSoft Logo" className="h-12 sm:h-14 w-auto object-contain" />
            </a>
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                version 1.0.2
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
              Enterprise Multi-Tenant Lead Management System & Auto Webhook Engine
            </p>
          </div>

          {/* Login Form Fields */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Account Email Address
              </label>

              <input
                type="email"
                required
                placeholder="e.g. hussain@ibrasoft.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition-all font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition-all font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-[12px] text-slate-300 font-semibold tracking-wide drop-shadow-sm">
          Designed and developed by{' '}
          <a
            href="http://ibrasoft.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-bold hover:underline"
          >
            IbraSoft
          </a>
        </p>
      </div>
    </div>
  );
}
