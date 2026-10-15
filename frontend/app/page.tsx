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
  Code2,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { fetchRoles, enhanceSystemPrompt, Role } from '@/lib/api';
import { RoleCard } from '@/components/RoleCard';
import { useAuth } from '@clerk/nextjs';

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
      setEnhancedOutput('You are a high-precision AI Assistant specialized in rigorous analysis, contextual grounding, and production execution.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4 sm:pt-8 pb-4 relative">
        {/* Warm Ambient Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] sm:w-[640px] h-[300px] rounded-full pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Tenant AI Studio · Central Data Isolation</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-sora tracking-tight max-w-4xl mx-auto leading-[1.15]" style={{ color: '#fef3c7' }}>
          Deploy Autonomous <br />
          <span className="gradient-text-ember">Specialist AI Personas</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-4" style={{ color: '#a8a29e' }}>
          Grounded with live Web Search, sandboxed Python REPL, and Vector pgvector RAG. Built for high-speed API execution with multi-user privacy.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 px-4">
          <Link
            href="/roles"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              boxShadow: '0 8px 30px rgba(245,158,11,0.3)',
            }}
          >
            <span>Launch AI Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/roles/new"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:bg-white/[0.06]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(245,158,11,0.18)',
              color: '#fef3c7',
            }}
          >
            <Bot className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <span>Create Custom Persona</span>
          </Link>
        </div>

        {/* Provider Trust Ticker */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs font-mono" style={{ color: '#78716c' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini 2.5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Groq LPU</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>AWS Bedrock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Supabase pgvector</span>
          </div>
        </div>
      </section>

      {/* Featured AI Roles Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>
              <Bot className="w-4 h-4" />
              <span>Specialized Roles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-sora mt-1" style={{ color: '#fef3c7' }}>
              Pre-Configured AI Personas
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#78716c' }}>
              Ready-to-chat personas. Click any card to launch an instant conversation.
            </p>
          </div>

          <Link
            href="/roles"
            className="text-xs font-bold flex items-center gap-1.5 hover:opacity-80 transition-opacity self-start sm:self-auto"
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
                className="h-56 rounded-3xl animate-pulse"
                style={{
                  background: 'rgba(18,18,28,0.7)',
                  border: '1px solid rgba(245,158,11,0.08)',
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

      {/* Live Interactive Prompt Engineer Widget */}
      <section
        className="p-6 sm:p-8 rounded-3xl glass-card space-y-6 relative overflow-hidden"
        style={{
          border: '1px solid rgba(245,158,11,0.18)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
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

        <form onSubmit={handleQuickEnhance} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Senior Security Auditor or Legal Researcher"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl text-xs focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(245,158,11,0.15)',
                color: '#fef3c7',
              }}
            />
            <button
              type="submit"
              disabled={isEnhancing || !promptInput.trim()}
              className="px-6 py-3 rounded-2xl font-bold text-xs text-black flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
              }}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Engineering...' : 'Enhance Prompt'}</span>
            </button>
          </div>

          {enhancedOutput && (
            <div
              className="p-4 sm:p-5 rounded-2xl space-y-2 text-xs font-mono leading-relaxed transition-all"
              style={{
                background: 'rgba(10,10,16,0.85)',
                border: '1px solid rgba(52,211,153,0.2)',
                color: '#34d399',
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                <span>Production AI System Prompt:</span>
                <span className="text-[10px] text-stone-500">Auto-Generated</span>
              </div>
              <p className="whitespace-pre-wrap">{enhancedOutput}</p>
            </div>
          )}
        </form>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold font-sora" style={{ color: '#fef3c7' }}>Central Multi-Tenant Isolation</h4>
          <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
            Your custom personas, private conversations, and API credentials are tied strictly to your account. No cross-user data leakage.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold font-sora" style={{ color: '#fef3c7' }}>Live Grounding Engines</h4>
          <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
            Personas don't hallucinate. Connect Web Search, sandboxed Python code execution, and pgvector knowledge bases with a single toggle.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
            <Terminal className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold font-sora" style={{ color: '#fef3c7' }}>Developer REST API</h4>
          <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
            Integrate your personas into any external backend, CLI, or frontend with secured SHA-256 tokens and streaming responses.
          </p>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="text-center py-10 sm:py-14 rounded-3xl glass-card space-y-4 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(245,158,11,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 space-y-4 max-w-xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-black font-sora" style={{ color: '#fef3c7' }}>
            Ready to Build Your AI Workforce?
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: '#a8a29e' }}>
            Start with our verified system templates or architect your first bespoke AI persona right now.
          </p>
          <div className="pt-2">
            <Link
              href="/roles/new"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-black shadow-xl transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
              }}
            >
              <Bot className="w-4 h-4" />
              <span>Create Your First Role</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
