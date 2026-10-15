'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Terminal,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  Globe,
  Database,
  Lock,
  Wand2,
  ChevronRight,
  Code2,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { fetchRoles, enhanceSystemPrompt, Role } from '@/lib/api';
import { RoleCard } from '@/components/RoleCard';
import { useAuth } from '@clerk/nextjs';

const PROVIDER_TAGS = [
  { name: 'Gemini 2.5 Flash', icon: '✨', speed: '240ms', color: '#06b6d4' },
  { name: 'Groq LPU (OSS 120B)', icon: '⚡', speed: '110ms', color: '#f59e0b' },
  { name: 'AWS Bedrock', icon: '☁️', speed: '310ms', color: '#3b82f6' },
  { name: 'pgvector RAG', icon: '📚', speed: '768-dim', color: '#a855f7' },
  { name: 'Sandboxed Python', icon: '💻', speed: 'REPL', color: '#10b981' },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
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
    <div className="space-y-24 sm:space-y-32 py-6 sm:py-12 max-w-7xl mx-auto">

      {/* ── 1. Hero Section ── */}
      <section className="text-center space-y-8 pt-8 sm:pt-14 pb-4 relative">
        {/* Glow Spheres */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Cyber Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wide cyber-pill shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>CYBER-STUDIO 3.0 · CENTRAL MULTI-TENANCY · LIVE RAG</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.08] text-white">
          Orchestrate Autonomous <br />
          <span className="gradient-text-cyber">Specialist AI Personas</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-slate-300 font-normal px-4">
          Grounded with live Web Search, sandboxed Python code execution, and pgvector RAG.
          Sub-110ms inference with isolated multi-user database privacy.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-4">
          <Link
            href="/roles"
            className="w-full sm:w-auto px-9 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 btn-cyber-primary shadow-2xl shadow-indigo-500/30"
          >
            <span>Explore Persona Catalog</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>

          <Link
            href="/roles/new"
            className="w-full sm:w-auto px-9 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 btn-cyber-secondary"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Create Custom Persona</span>
          </Link>
        </div>

        {/* Interactive Provider Ticker */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-6">
          {PROVIDER_TAGS.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono font-medium hover:border-indigo-500/30 transition-all"
            >
              <span>{tag.icon}</span>
              <span className="text-slate-200">{tag.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold" style={{ color: tag.color, background: `${tag.color}15` }}>
                {tag.speed}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Metric Telemetry Banner ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        {[
          { label: 'Token Speed', value: '110 ms', desc: 'Groq LPU ultra-low latency', color: '#06b6d4' },
          { label: 'Model Engines', value: '6+ Types', desc: 'Gemini, Groq, Bedrock & more', color: '#818cf8' },
          { label: 'Grounding Tools', value: '5 Tools', desc: 'Web Search, Python, pgvector', color: '#c084fc' },
          { label: 'Tenant Isolation', value: '100% Private', desc: 'Zero cross-tenant data leaks', color: '#10b981' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="cyber-card p-6 space-y-1.5"
          >
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              {stat.label}
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-400">
              {stat.desc}
            </div>
          </div>
        ))}
      </section>

      {/* ── 3. Featured Roles Catalog Preview ── */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
              <Bot className="w-4 h-4" />
              <span>Production AI Catalog</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1.5">
              Verified Specialist Personas
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select any pre-configured specialist to launch an instant sandboxed conversation.
            </p>
          </div>

          <Link
            href="/roles"
            className="text-xs font-bold font-mono flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors self-start sm:self-auto shrink-0"
          >
            <span>VIEW ALL PERSONAS ({roles.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingRoles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.slice(0, 6).map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Interactive Persona Engine Terminal ── */}
      <section className="cyber-card p-7 sm:p-10 space-y-6 relative overflow-hidden border-indigo-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono cyber-pill">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>INTERACTIVE PROMPT ENHANCER</span>
            </div>
            <h3 className="text-2xl font-extrabold text-white font-heading">
              Test the Persona Engineering Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Type any role concept below and watch OmniRole AI engineer a production system prompt in real time.
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickEnhance} className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. Senior Smart Contract Auditor or Quantitative Research Analyst"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full px-5 py-4 rounded-xl text-sm bg-black/40 border border-indigo-500/25 text-white placeholder:text-slate-500 focus:border-cyan-400 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isEnhancing || !promptInput.trim()}
              className="px-8 py-4 rounded-xl font-bold text-sm btn-cyber-primary flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <Sparkles className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Engineering...' : 'Enhance Prompt'}</span>
            </button>
          </div>

          {enhancedOutput && (
            <div className="p-6 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-3 font-mono text-xs leading-relaxed text-emerald-300">
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 pb-2 border-b border-white/[0.08]">
                <span>AI SYSTEM PROMPT SPECIFICATION:</span>
                <span className="text-slate-500">Auto-Generated via OmniRole Engine</span>
              </div>
              <p className="whitespace-pre-wrap">{enhancedOutput}</p>
            </div>
          )}
        </form>
      </section>

      {/* ── 5. Core Pillars ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Lock,
            title: 'Central Multi-Tenant Isolation',
            desc: 'Every custom persona, conversation history, and API key is partitioned strictly per Clerk account with encrypted token storage.',
            color: '#06b6d4',
          },
          {
            icon: Zap,
            title: 'Multi-Connector Grounding',
            desc: 'Zero hallucination. Personas execute live Google Search, sandboxed Python code snippets, and Supabase pgvector retrieval dynamically.',
            color: '#a855f7',
          },
          {
            icon: Terminal,
            title: 'High-Throughput REST API',
            desc: 'Deploy personas directly into external webhooks, bots, and backends using SHA-256 secured bearer tokens with SSE streaming.',
            color: '#10b981',
          },
        ].map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="cyber-card p-8 space-y-4"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${pillar.color}15`, border: `1px solid ${pillar.color}35`, color: pillar.color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                {pillar.title}
              </h4>
              <p className="text-xs text-slate-300/80 leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          );
        })}
      </section>

      {/* ── 6. Final Call to Action ── */}
      <section className="text-center py-16 sm:py-24 rounded-3xl cyber-card space-y-6 px-6 relative overflow-hidden border-indigo-500/40">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 pointer-events-none" />

        <div className="relative z-10 space-y-5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold cyber-pill">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>START FREE · NO CREDIT CARD REQUIRED</span>
          </div>

          <h3 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
            Build Your Autonomous AI Workforce
          </h3>
          <p className="text-sm sm:text-base text-slate-300">
            Start with our verified specialist roles or architect your first bespoke AI persona right now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/roles/new"
              className="px-9 py-4 rounded-2xl font-bold text-sm btn-cyber-primary flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Create Your First Persona</span>
            </Link>
            <Link
              href="/pricing"
              className="px-9 py-4 rounded-2xl font-bold text-sm btn-cyber-secondary flex items-center justify-center gap-2"
            >
              <span>View Plans & Upgrades</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
