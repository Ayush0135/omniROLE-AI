'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Logo } from '@/components/Logo';

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Roles', icon: Bot, href: '/roles' },
  { label: 'Playground', icon: Terminal, href: '/playground' },
  { label: 'API Keys', icon: Key, href: '/api-keys' },
  { label: 'Analytics', icon: BarChart2, href: '/analytics' },
  { label: 'Pricing', icon: Zap, href: '/pricing' },
  { label: 'Docs', icon: BookOpen, href: '/docs' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export const Navbar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-[#0f0f17]/85 backdrop-blur-2xl border-b border-amber-500/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Logo size="md" showText={true} />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
                        : 'text-stone-400 hover:text-amber-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Live Badge */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </div>

              {/* New Role CTA */}
              <Link
                href="/roles/new"
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Role</span>
              </Link>

              {/* Auth Controls */}
              {isLoaded && !isSignedIn && (
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button className="px-4 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-amber-500/10 text-stone-200 text-xs font-semibold transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}

              {isLoaded && isSignedIn && (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8 rounded-xl border border-amber-500/25 shadow-md',
                    },
                  }}
                />
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-white/[0.04] transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#12121c]/95 backdrop-blur-2xl border-b border-amber-500/10">
          <nav className="max-w-7xl mx-auto px-6 py-4 space-y-1">
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
                      : 'text-stone-400 hover:text-amber-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/roles/new"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black text-sm font-bold mt-2"
            >
              <Plus className="w-4 h-4" />
              New Role
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
