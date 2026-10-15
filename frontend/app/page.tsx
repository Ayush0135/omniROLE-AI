'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Terminal,
  Zap,
  ArrowRight,
  Lock,
  Wand2,
  ChevronRight,
  MessageSquare,
  Globe,
  Code2,
  Database,
} from 'lucide-react';
import { fetchRoles, enhanceSystemPrompt, Role } from '@/lib/api';
import { RoleCard } from '@/components/RoleCard';
import { useAuth } from '@clerk/nextjs';

const PROVIDER_TICKER = [
  { label: 'Gemini 2.5 Flash', color: '#34d399' },
  { label: 'Groq LPU', color: '#f59e0b' },
  { label: 'AWS Bedrock', color: '#60a5fa' },
  { label: 'pgvector RAG', color: '#a78bfa' },
  { label: 'Web Search', color: '#fb923c' },
  { label: 'Python REPL', color: '#4ade80' },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Interactive Live Prompt Enhancer Widget state
  const [promptInput, setPromptInput] = useState('');
  const [enhancedOutput, setEnhancedOutput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    async function loadSampleRoles() {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch (err) {
        console.error('Error loading roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    }
    loadSampleRoles();
  }, []);

  const handleQuickEnhance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const result = await enhanceSystemPrompt('Specialist Assistant', promptInput);
      setEnhancedOutput(result);
    } catch {
      setEnhancedOutput(
        'You are a high-precision AI Assistant specialized in rigorous analysis, contextual grounding, and production execution. You ground all responses in verified data, use structured reasoning, and produce actionable, expert-level outputs.'
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-20 sm:space-y-28 py-4 sm:py-8 max-w-6xl mx-auto">

      {/* ── Hero Section ── */}
      <section className="text-center space-y-7 pt-6 sm:pt-10 pb-4 relative">
        {/* Large ambient orb */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[500px] h-[400px] rounded-full pointer-events-none -z-10"
          style={{
            background:
              'radial-gradient(ellipse, rgba(245,158,11,0.13) 0%, rgba(245,158,11,0.04) 45%, transparent 70%)',
          }}
        />
        {/* Small secondary orb */}
        <div
          className="absolute top-1/2 right-0 w-[200px] h-[200px] rounded-full pointer-events-none -z-10"
          style={{
            background:
              'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Feature Pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.22)',
            color: '#fbbf24',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Tenant AI Studio · Central Data Isolation · Live Grounding</span>
        </div>

        {/* Main Title */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-sora tracking-tight max-w-4xl mx-auto leading-[1.1]"
          style={{ color: '#fef3c7' }}
        >
          Deploy Autonomous
          <br />
          <span className="gradient-text-ember">Specialist AI Personas</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-4"
          style={{ color: '#a8a29e' }}
        >
          Grounded with live Web Search, sandboxed Python REPL, and Vector pgvector RAG.
          Built for high-speed API execution with strict per-user data privacy.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 px-4">
          <Link
            href="/roles"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 btn-glow-amber"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              boxShadow: '0 8px 30px rgba(245,158,11,0.35)',
            }}
          >
            <span>Launch AI Studio</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>

          <Link
            href="/roles/new"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-white/[0.06]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: '#fef3c7',
            }}
          >
            <Bot className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <span>Create Custom Persona</span>
          </Link>
        </div>

        {/* Provider Trust Ticker */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 pt-3 text-xs font-mono">
          {PROVIDER_TICKER.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5" style={{ color: '#78716c' }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {[
          { label: 'AI Providers', value: '6+', color: '#f59e0b' },
          { label: 'Token Speed', value: '110ms', color: '#34d399' },
          { label: 'Connectors', value: '5', color: '#a78bfa' },
          { label: 'Data Isolation', value: '100%', color: '#60a5fa' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="text-center p-4 rounded-2xl"
            style={{
              background: 'rgba(17,17,27,0.75)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="text-2xl sm:text-3xl font-black font-sora" style={{ color }}>
              {value}
            </div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: '#78716c' }}>
              {label}
            </div>
          </div>
        ))}
      </section>

      {/* ── Featured AI Roles Grid ── */}
      <section className="space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
          <div>
            <div
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: '#f59e0b' }}
            >
              <Bot className="w-4 h-4" />
              <span>Specialized Roles</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-black font-sora mt-1"
              style={{ color: '#fef3c7' }}
            >
              Pre-Configured AI Personas
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#78716c' }}>
              Ready-to-chat personas. Click any card to launch an instant conversation.
            </p>
          </div>

          <Link
            href="/roles"
            className="text-xs font-bold flex items-center gap-1.5 hover:opacity-80 transition-opacity self-start sm:self-auto shrink-0"
            style={{ color: '#f59e0b' }}
          >
            <span>Explore All Roles ({roles.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingRoles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl animate-pulse"
                style={{
                  background: 'rgba(17,17,27,0.7)',
                  border: '1px solid rgba(245,158,11,0.07)',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.slice(0, 6).map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </section>

      {/* ── Live Interactive Prompt Engineer Widget ── */}
      <section
        className="p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden"
        style={{
          background: 'rgba(17,17,27,0.88)',
          border: '1px solid rgba(245,158,11,0.18)',
          boxShadow: '0 8px 40px rgba(12,12,20,0.6)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(245,158,11,0.10)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Interactive Persona Engine</span>
            </div>
            <h3 className="text-xl font-bold font-sora" style={{ color: '#fef3c7' }}>
              Test the AI Prompt Enhancer Live
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: '#78716c' }}>
              Type a short concept below and watch OmniRole AI transform it into a production system prompt.
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickEnhance} className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Senior Security Auditor or Legal Researcher"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(245,158,11,0.15)',
                color: '#fef3c7',
              }}
            />
            <button
              type="submit"
              disabled={isEnhancing || !promptInput.trim()}
              className="px-7 py-3 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}
            >
              <Sparkles className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Engineering...' : 'Enhance Prompt'}</span>
            </button>
          </div>

          {enhancedOutput && (
            <div
              className="p-5 rounded-2xl space-y-2 text-xs font-mono leading-relaxed"
              style={{
                background: 'rgba(10,10,16,0.9)',
                border: '1px solid rgba(52,211,153,0.2)',
                color: '#34d399',
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-2">
                <span>Production AI System Prompt:</span>
                <span className="text-[10px] text-stone-500 font-medium">Auto-Generated by OmniRole Engine</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{enhancedOutput}</p>
            </div>
          )}
        </form>
      </section>

      {/* ── Feature Pillar Highlights ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: Lock,
            title: 'Central Multi-Tenant Isolation',
            desc: 'Your custom personas, private conversations, and API credentials are tied strictly to your account. Zero cross-user data leakage.',
            color: '#f59e0b',
          },
          {
            icon: Zap,
            title: 'Live Grounding Engines',
            desc: 'Personas don\'t hallucinate. Connect Web Search, sandboxed Python code execution, and pgvector knowledge bases with a single toggle.',
            color: '#34d399',
          },
          {
            icon: Terminal,
            title: 'Developer REST API',
            desc: 'Integrate your personas into any external backend, CLI, or frontend with secured SHA-256 tokens and streaming responses.',
            color: '#a78bfa',
          },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div
            key={title}
            className="p-6 rounded-3xl space-y-3 shine-hover transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'rgba(17,17,27,0.75)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 2px 16px rgba(12,12,20,0.4)',
            }}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `${color}18`, color }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold font-sora" style={{ color: '#fef3c7' }}>
              {title}
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
              {desc}
            </p>
          </div>
        ))}
      </section>

      {/* ── Final Call to Action ── */}
      <section
        className="text-center py-14 sm:py-20 rounded-3xl space-y-5 px-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(20,20,32,0.95), rgba(12,12,20,0.98))',
          border: '1px solid rgba(245,158,11,0.15)',
          boxShadow: '0 8px 48px rgba(12,12,20,0.6)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(245,158,11,0.09) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-10 space-y-5 max-w-xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: '#fbbf24',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Free · No Credit Card Required</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black font-sora" style={{ color: '#fef3c7' }}>
            Ready to Build Your AI Workforce?
          </h3>
          <p className="text-sm sm:text-base" style={{ color: '#a8a29e' }}>
            Start with our verified system templates or architect your first bespoke AI persona right now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/roles/new"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-black shadow-xl transition-all hover:scale-105 btn-glow-amber"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 8px 28px rgba(245,158,11,0.35)',
              }}
            >
              <Bot className="w-4 h-4" />
              <span>Create Your First Role</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:bg-white/[0.07]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#d6d3d1',
              }}
            >
              <span>View Pricing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
