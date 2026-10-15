'use client';

import React, { useState, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div
        className="transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(12,12,20,0.94)'
            : 'rgba(12,12,20,0.72)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: scrolled
            ? '1px solid rgba(245,158,11,0.14)'
            : '1px solid rgba(245,158,11,0.07)',
          boxShadow: scrolled ? '0 4px 32px rgba(12,12,20,0.5)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between h-15" style={{ height: '60px' }}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <Logo size="md" showText={true} />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 group"
                    style={{
                      color: isActive ? '#fbbf24' : '#a8a29e',
                      background: isActive ? 'rgba(245,158,11,0.09)' : 'transparent',
                    }}
                  >
                    {/* Active underline */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                        style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
                      />
                    )}
                    <span className="group-hover:text-amber-200 transition-colors">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2.5">
              {/* Live Badge */}
              <div
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'rgba(52,211,153,0.08)',
                  border: '1px solid rgba(52,211,153,0.2)',
                  color: '#34d399',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </div>

              {/* New Role CTA */}
              <Link
                href="/roles/new"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-black text-xs font-bold shadow-lg transition-all hover:scale-105 btn-glow-amber"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                }}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Role</span>
              </Link>

              {/* Auth Controls */}
              {isLoaded && !isSignedIn && (
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(245,158,11,0.12)',
                        color: '#d6d3d1',
                      }}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      className="px-3.5 py-1.5 rounded-xl text-black text-xs font-bold transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}

              {isLoaded && isSignedIn && (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        'w-8 h-8 rounded-xl border border-amber-500/30 shadow-md shadow-amber-500/10',
                    },
                  }}
                />
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ color: '#a8a29e' }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div
          style={{
            background: 'rgba(12,12,20,0.97)',
            backdropFilter: 'blur(28px)',
            borderBottom: '1px solid rgba(245,158,11,0.12)',
          }}
        >
          <nav className="max-w-7xl mx-auto px-5 py-4 space-y-1">
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
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    color: isActive ? '#fbbf24' : '#a8a29e',
                    background: isActive ? 'rgba(245,158,11,0.09)' : 'transparent',
                    border: isActive ? '1px solid rgba(245,158,11,0.18)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/roles/new"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black text-sm font-bold mt-2"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Plus className="w-4 h-4" />
              Create New Role
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
