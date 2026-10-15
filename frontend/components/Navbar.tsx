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
  Sparkles,
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
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      <div
        className="w-full transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(4, 5, 13, 0.92)'
            : 'rgba(4, 5, 13, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.16)',
          boxShadow: scrolled
            ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.05) inset'
            : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/30 group-hover:shadow-cyan-400/30 transition-all duration-300 flex items-center justify-center">
                <div className="w-full h-full bg-[#0a0d1a] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <span className="font-extrabold text-lg tracking-tight font-heading text-white">
                OmniRole <span className="gradient-text-cyan font-black">AI</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/[0.02] p-1 rounded-2xl border border-white/[0.05]">
              {navLinks.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      color: isActive ? '#ffffff' : '#94a3b8',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.15))'
                        : 'transparent',
                      border: isActive
                        ? '1px solid rgba(99, 102, 241, 0.35)'
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
            <div className="flex items-center gap-3">
              {/* Telemetry Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold font-mono bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE · 110ms</span>
              </div>

              {/* Create Role CTA */}
              <Link
                href="/roles/new"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold btn-cyber-primary"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Persona</span>
              </Link>

              {/* Auth Controls */}
              {isLoaded && !isSignedIn && (
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all">
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
                        'w-8 h-8 rounded-xl border border-indigo-500/40 shadow-md shadow-indigo-500/20',
                    },
                  }}
                />
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0a0d1a]/98 backdrop-blur-3xl border-b border-indigo-500/20 shadow-2xl">
          <nav className="max-w-7xl mx-auto px-5 py-4 space-y-1.5">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-white bg-indigo-500/20 border border-indigo-500/35'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-indigo-400" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/roles/new"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-bold btn-cyber-primary mt-3"
            >
              <Plus className="w-4 h-4" />
              Create Custom Persona
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
