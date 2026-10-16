'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  User,
  LogOut,
} from 'lucide-react';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const displayName = !loading && user ? user.name : 'Guest';
  const displayEmail = !loading && user ? user.email : 'Free Tier';
  const initials = !loading && user && user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AI';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'My Roles', icon: Bot, href: '/roles' },
    { label: 'Create Role', icon: PlusCircle, href: '/roles/new' },
    { label: 'Playground', icon: Terminal, href: '/playground' },
    { label: 'API Keys', icon: Key, href: '/api-keys' },
    { label: 'Analytics', icon: BarChart2, href: '/analytics' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-slate-200 bg-white transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      {/* Top Section */}
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              Studio Workspace
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors mx-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User Info */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
              <div className="text-[11px] text-slate-500 truncate">{displayEmail}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
