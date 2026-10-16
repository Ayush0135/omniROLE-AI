'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Terminal,
  Key,
  BarChart2,
  Zap,
  BookOpen,
  Settings,
  Plus,
  Menu,
  X,
  Sparkles,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { label: 'Explore Roles', href: '/roles', icon: Bot },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Playground', href: '/playground', icon: Terminal },
  { label: 'API Keys', href: '/api-keys', icon: Key },
  { label: 'Pricing', href: '/pricing', icon: Zap },
  { label: 'Docs', href: '/docs', icon: BookOpen },
];

export const Navbar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'ME';
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      <div
        className="w-full transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(8, 9, 13, 0.94)'
            : 'rgba(8, 9, 13, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: scrolled
            ? '0 8px 30px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.04) inset'
            : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:bg-indigo-500 transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white font-heading">
                OmniRole <span className="text-indigo-400 font-semibold text-xs ml-0.5 px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30">AI</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/[0.06]">
              {navLinks.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      color: isActive ? '#ffffff' : '#94a3b8',
                      background: isActive
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'transparent',
                      border: isActive
                        ? '1px solid rgba(255, 255, 255, 0.12)'
                        : '1px solid transparent',
                    }}
                  >
                    <span className="hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5">
              {/* Telemetry Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>110ms</span>
              </div>

              {/* Create Role CTA */}
              <Link
                href="/roles/new"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold btn-precision-primary shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Role</span>
              </Link>

              {/* In-House Auth Controls (Desktop) */}
              {!loading && !user && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.1] transition-all min-h-[36px] flex items-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 shadow-sm shadow-indigo-500/20 transition-all min-h-[36px] flex items-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {!loading && user && (
                <div className="relative hidden sm:block" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.06] border border-white/[0.1] transition-all min-h-[36px]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {getInitials(user.name, user.email)}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0e111a]/98 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2 space-y-1 text-xs z-50">
                      <div className="px-3 py-2 border-b border-white/[0.08]">
                        <p className="font-semibold text-white truncate">{user.name || 'Developer'}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {user.plan || 'Free Starter'}
                        </span>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                        <span>My Dashboard</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <User className="w-4 h-4 text-purple-400" />
                        <span>Account &amp; Quota</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle (44px Minimum Touch Target) */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle mobile menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-indigo-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer (Full Touch Optimization) */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#08090d]/98 backdrop-blur-2xl border-b border-white/[0.1] shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                    isActive
                      ? 'text-white bg-white/[0.08] border border-white/[0.12]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Actions */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <Link
                href="/roles/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold btn-precision-primary w-full min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Custom Role</span>
              </Link>

              {!loading && !user && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium text-slate-200 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] min-h-[44px]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 min-h-[44px]"
                  >
                    Sign Up Free
                  </Link>
                </div>
              )}

              {!loading && user && (
                <div className="space-y-1 pt-1">
                  <div className="px-4 py-2 text-xs text-slate-400">
                    Logged in as <span className="text-white font-medium">{user.email}</span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] min-h-[44px]"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <span>My Profile &amp; Token Quota</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 min-h-[44px] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
