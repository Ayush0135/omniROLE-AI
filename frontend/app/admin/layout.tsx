'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Megaphone,
  Activity,
  ArrowLeft,
  Cpu,
  Lock,
  CreditCard,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { Footer } from '@/components/Footer';

const BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://54.196.14.199');
const API = `${BASE}/api/v1`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  const adminNavItems = [
    { label: 'Control Tower', icon: Activity, href: '/admin' },
    { label: 'User Management', icon: Users, href: '/admin/users' },
    { label: 'Custom Plans & Offers', icon: Sparkles, href: '/admin/plans' },
    { label: 'Payment Verifications', icon: CreditCard, href: '/admin/payments' },
    { label: 'Announcements & Ads', icon: Megaphone, href: '/admin/announcements' },
  ];

  // Skip auth check on the login page itself
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    const token = localStorage.getItem('omni_admin_token');
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    // Verify token with backend
    fetch(`${API}/admin-auth/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) {
          setAuthState('authorized');
        } else {
          localStorage.removeItem('omni_admin_token');
          router.replace('/admin/login');
        }
      })
      .catch(() => {
        // If backend unreachable, fail safe — redirect to login
        localStorage.removeItem('omni_admin_token');
        router.replace('/admin/login');
      });
  }, [pathname, isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem('omni_admin_token');
    router.push('/admin/login');
  };

  // The login page renders its own full-screen layout — no admin chrome needed
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 bg-[#050507] flex items-center justify-center font-mono text-sm z-50" style={{ color: '#f59e0b' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          Verifying Admin Credentials...
        </div>
      </div>
    );
  }

  // Authorized — render full admin layout
  return (
    <div className="fixed inset-0 bg-[#050507] text-zinc-100 flex z-50 overflow-hidden font-sans">
      {/* Dedicated Admin Command Sidebar */}
      <aside className="w-64 bg-[#09090e] border-r border-[#1e1e28] flex flex-col justify-between select-none shrink-0">
        <div>
          {/* Admin Header */}
          <div className="h-16 px-5 border-b border-[#1e1e28] flex items-center justify-between bg-[#07070b]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-sm tracking-wide text-white uppercase font-mono">
                  Omni<span className="text-amber-400">Admin</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">Control Center v1.0</div>
              </div>
            </div>
          </div>

          {/* Admin Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-3">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Admin Command Console
            </div>

            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/5'
                      : 'text-zinc-400 hover:text-white hover:bg-[#12121c]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Exit Admin Portal Footer */}
        <div className="p-4 border-t border-[#1e1e28] bg-[#07070b] space-y-2">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full py-2.5 px-3 rounded-xl bg-[#12121a] hover:bg-[#1c1c28] border border-[#222230] text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Main App</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#07070c]">
        {/* Dedicated Admin Header */}
        <header className="h-16 border-b border-[#1e1e28] bg-[#09090e]/90 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold uppercase">
              Isolated Admin Session
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Database: <span className="text-emerald-400 font-semibold">Supabase PostgreSQL (Live)</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Groq LPU / Gemini Grid</span>
            </div>

            <div className="p-2 rounded-xl bg-[#12121a] border border-[#222230] text-zinc-400 text-xs font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Key Active</span>
            </div>
          </div>
        </header>

        {/* Admin Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
}
