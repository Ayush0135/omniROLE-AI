'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Zap,
  Globe,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Terminal,
  Columns,
  ImagePlus,
  BookOpen,
  Code2,
  Cpu,
  BarChart3,
  Layers,
} from 'lucide-react';
import { fetchRoles, Role } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [featuredRoles, setFeaturedRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoles() {
      try {
        const roles = await fetchRoles();
        setFeaturedRoles(roles.slice(0, 4));
      } catch (err) {
        console.error('Failed to load featured roles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  return (
    <div className="space-y-20 sm:space-y-28 py-6 sm:py-10">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Grounded AI Roles with Live Web & Vector Citations</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
          Specialized AI Personas for <br className="hidden sm:inline" />
          <span className="text-blue-600">Your Real-World Work</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Deploy expert AI roles equipped with dedicated domain directives, real-time live web search, pgvector memory, and vision capabilities. Built for teams who need accurate answers, not generic chat.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            href={user ? '/roles' : '/signup'}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            <span>{user ? 'Go to My Workspace' : 'Get Started for Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/roles"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <span>Explore Roles</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>500k monthly starter tokens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Live DuckDuckGo search citations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Private knowledge embeddings</span>
          </div>
        </div>
      </section>

      {/* ── 2. Featured Roles Showcase ────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              Pre-Configured Personas
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Curated Domain Experts
            </h2>
          </div>

          <Link
            href="/roles"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>View all roles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 font-bold text-lg">
                  ✦
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {role.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {role.description}
                </p>

                {role.expertise && role.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {role.expertise.slice(0, 2).map((exp, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-600"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {role.model_name || 'Gemini 2.5'}
                </span>
                <Link
                  href={`/roles/${role.slug || role.id}/chat`}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Core Capabilities Grid ──────────────────────────────── */}
      <section className="space-y-10 py-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Engine Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How OmniRole Empowers Your Team
          </h2>
          <p className="text-sm text-slate-500">
            Engineered with verifiable citations, custom memory, and multi-model routing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Live Web Search Grounding</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every query can tap into real-time DuckDuckGo web search. Outputs feature clickable numbered references and source cards for transparency.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Custom Vector RAG Memory</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload your company documents, specifications, or guidelines. OmniRole chunks and embeds knowledge for precise cosine-similarity retrieval.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <ImagePlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multimodal Photo & Vision</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Attach diagrams, charts, or screenshots directly in the chat. Vision models analyze the image and ground the answers with technical depth.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Columns className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Dual Arena Benchmarking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compare your custom persona output side-by-side with secondary benchmark models to verify consistency, tone, and reasoning policy.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Developer API Keys</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Integrate any configured role directly into your applications, terminal scripts, or internal workflows using our standard OpenAI-compatible API.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Isolated & Secure</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Data isolation per user with self-hosted OTP authentication. Your API keys, custom roles, and knowledge files remain private.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Call to Action Banner ───────────────────────────────── */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-sm">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Ready to experience specialized AI intelligence?
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Create your account in under a minute with email verification. No credit card required.
        </p>
        <div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
