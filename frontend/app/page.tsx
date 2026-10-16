'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Terminal,
  Zap,
  ArrowRight,
  ShieldCheck,
  Layers,
  Cpu,
  Globe,
  Database,
  Lock,
  Wand2,
  ChevronRight,
  Code2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { fetchRoles, enhanceSystemPrompt, Role } from '@/lib/api';
import { RoleCard } from '@/components/RoleCard';
import { useAuth } from '@/context/AuthContext';

const PROVIDER_TAGS = [
  { name: 'Gemini 2.5 Flash', icon: '✨', speed: '240ms', color: '#06b6d4' },
  { name: 'Groq LPU (OSS 120B)', icon: '⚡', speed: '110ms', color: '#f59e0b' },
  { name: 'AWS Bedrock', icon: '☁️', speed: '310ms', color: '#3b82f6' },
  { name: 'pgvector RAG', icon: '📚', speed: '768-dim', color: '#a855f7' },
  { name: 'Python Sandbox', icon: '💻', speed: 'REPL', color: '#10b981' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Live Interactive Prompt Enhancer Widget state
  const [promptInput, setPromptInput] = useState('');
  const [enhancedOutput, setEnhancedOutput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch (err) {
        console.error('Error loading roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    }
    loadRoles();
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
        'You are an autonomous Senior AI Persona specialized in deep analytical rigor, real-time contextual grounding, and multi-tool execution. You reason step-by-step, verify assertions against ground truth, and deliver production-ready outputs.'
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-28 py-4 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── 1. Hero Section ── */}
      <section className="text-center space-y-6 sm:space-y-8 pt-6 sm:pt-14 pb-2 relative">
        {/* Subtle top spotlight glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[650px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Human-Toned Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium precision-badge shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Grounded with live web search &amp; private document citations</span>
        </div>

        {/* Main Title (Fluid & Phone Friendly) */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.12] text-white">
          AI roles built for real work, <br className="hidden sm:inline" />
          <span className="gradient-text-accent">not just generic chat.</span>
        </h1>

        {/* Human Subtitle */}
        <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-slate-300/90 font-normal">
          Deploy specialized AI teammates that verify facts with real-time web search, run Python code, and remember your private docs. Fast, private to your account, and ready in seconds.
        </p>

        {/* Call to Actions (Mobile Responsive Stacking) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md sm:max-w-none mx-auto w-full">
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm btn-precision-primary flex items-center justify-center gap-2"
          >
            <span>{user ? 'Go to My Dashboard' : 'Start Building Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/roles"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm btn-precision-secondary flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Browse 10+ Prebuilt Roles</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>500,000 monthly starter tokens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verifiable source citations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict per-user data isolation</span>
          </div>
        </div>

        {/* Supported Engines Ticker */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-4">
          {PROVIDER_TAGS.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs font-medium hover:border-indigo-500/40 transition-all"
            >
              <span>{tag.icon}</span>
              <span className="text-slate-300 text-[11px] sm:text-xs">{tag.name}</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: tag.color, background: `${tag.color}15` }}>
                {tag.speed}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Metric Telemetry Banner ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {[
          { label: 'Latency', value: '110 ms', desc: 'Sub-second streaming execution', color: '#06b6d4' },
          { label: 'LLM Engines', value: '6+ Providers', desc: 'Gemini, Groq, Bedrock & more', color: '#818cf8' },
          { label: 'Live Grounding', value: 'Search + RAG', desc: 'Web search & 768-dim vector memory', color: '#c084fc' },
          { label: 'Privacy', value: '100% Isolated', desc: 'Encrypted per-user data partitions', color: '#10b981' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="precision-card p-4 sm:p-6 space-y-1"
          >
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              {stat.label}
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 leading-snug">
              {stat.desc}
            </div>
          </div>
        ))}
      </section>

      {/* ── 3. Featured Roles Catalog Preview ── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Bot className="w-4 h-4" />
              <span>Production AI Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Curated Specialist Roles
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Select any role to start a grounded chat, or create your own custom persona.
            </p>
          </div>

          <Link
            href="/roles"
            className="text-xs font-semibold flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
          >
            <span>View All ({roles.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingRoles ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-60 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.slice(0, 6).map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Interactive Persona Engine Terminal ── */}
      <section className="precision-card p-6 sm:p-8 space-y-5 relative overflow-hidden border-indigo-500/25">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold precision-badge">
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Prompt Enhancer</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Have a role in mind? Watch our engine polish it.
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Type any simple concept below (e.g. "Python API Architect" or "SEO Content Strategist") and see how OmniRole crafts a structured system prompt with clear boundaries.
          </p>
        </div>

        <form onSubmit={handleQuickEnhance} className="relative z-10 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="e.g. Senior Smart Contract Auditor or Quantitative Research Analyst"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-sm bg-black/40 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 transition-all font-sans min-h-[44px]"
            />
            <button
              type="submit"
              disabled={isEnhancing || !promptInput.trim()}
              className="px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm btn-precision-primary flex items-center justify-center gap-2 transition-all disabled:opacity-40 min-h-[44px] shrink-0"
            >
              <Sparkles className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Engineering...' : 'Enhance Prompt'}</span>
            </button>
          </div>

          {enhancedOutput && (
            <div className="p-4 sm:p-5 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2 text-xs leading-relaxed text-emerald-300 font-mono">
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 pb-1.5 border-b border-white/[0.08]">
                <span>GENERATED SYSTEM PROMPT:</span>
                <span className="text-slate-400">Ready to copy</span>
              </div>
              <p className="whitespace-pre-wrap">{enhancedOutput}</p>
            </div>
          )}
        </form>
      </section>

      {/* ── 5. Core Pillars ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: Globe,
            title: 'Live Web Grounding',
            desc: 'Every answer is verified against real-time web results and cited clearly with sources. Zero made-up facts or outdated numbers.',
            color: '#06b6d4',
          },
          {
            icon: Lock,
            title: 'Private to Your Account',
            desc: 'Your custom AI roles, chat history, and search logs are partitioned strictly to your user ID. What happens in your workspace stays in your workspace.',
            color: '#a855f7',
          },
          {
            icon: Terminal,
            title: 'High-Throughput API Access',
            desc: 'Connect your roles to external scripts, bots, or apps via clean REST endpoints and secure API keys with server-sent event streaming.',
            color: '#10b981',
          },
        ].map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="precision-card p-6 sm:p-7 space-y-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: `${pillar.color}15`, border: `1px solid ${pillar.color}35`, color: pillar.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                {pillar.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          );
        })}
      </section>

      {/* ── 6. Final Call to Action ── */}
      <section className="text-center py-12 sm:py-20 rounded-2xl precision-card space-y-5 px-6 relative overflow-hidden border-indigo-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold precision-badge">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ready in under 30 seconds &middot; No credit card required</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Build your first specialized AI role today.
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Start free with 500,000 monthly tokens. Explore prebuilt experts or design your own custom persona.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={user ? '/roles/new' : '/signup'}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-xs sm:text-sm btn-precision-primary flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Create Your First Role</span>
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-xs sm:text-sm btn-precision-secondary flex items-center justify-center gap-2"
            >
              <span>View Plans</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
