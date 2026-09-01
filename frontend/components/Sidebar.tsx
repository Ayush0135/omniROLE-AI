'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  Terminal,
  Key,
  BarChart2,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

import { Logo } from '@/components/Logo';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const displayName = isLoaded && user ? user.fullName || user.username || 'User' : 'Guest Account';
  const displayEmail = isLoaded && user ? user.primaryEmailAddress?.emailAddress || 'Pro Plan' : 'Free Tier';
  const initials = isLoaded && user ? (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '') : 'AI';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'My Roles', icon: Bot, href: '/roles' },
    { label: 'Create Role', icon: PlusCircle, href: '/roles/new' },
    { label: 'API Playground', icon: Terminal, href: '/playground' },
    { label: 'API Keys', icon: Key, href: '/api-keys' },
    { label: 'Usage & Analytics', icon: BarChart2, href: '/analytics' },
    { label: 'Pricing & Plans', icon: Zap, href: '/pricing' },
    { label: 'Documentation', icon: BookOpen, href: '/docs' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 flex flex-col h-screen bg-[#030712]/90 backdrop-blur-2xl border-r border-cyan-500/20 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-cyan-500/15 bg-[#070e20]/60">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <Logo size="md" showText={!collapsed} />
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-cyan-500/10 transition-colors border border-transparent hover:border-cyan-500/20"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/15 to-purple-500/10 text-cyan-300 border border-cyan-500/35 shadow-lg shadow-cyan-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-cyan-500/15 bg-[#070e20]/40">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/25 to-indigo-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 uppercase">
                {initials}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-100 truncate">{displayName}</div>
                <div className="text-[10px] text-slate-400 truncate">{displayEmail}</div>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/35">
              PRO
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/25 to-indigo-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs uppercase"
              title={displayName}
            >
              {initials}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
