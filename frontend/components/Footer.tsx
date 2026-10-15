'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Zap, Cpu, Shield, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

export function Footer() {
  const [showTokenGuide, setShowTokenGuide] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);

  return (
    <>
      <footer className="mt-auto border-t py-14 px-6" style={{ borderColor: 'rgba(99, 102, 241, 0.15)', background: '#04050d' }}>
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Col */}
            <div className="space-y-4 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0a0d1a] rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <span className="font-extrabold text-lg tracking-tight font-heading text-white">
                  OmniRole <span className="gradient-text-cyan font-black">AI</span>
                </span>
              </Link>
              <p className="text-xs leading-relaxed text-slate-400">
                Autonomous AI Persona Orchestration Platform. Sub-110ms execution powered by Groq LPUs, Gemini 2.5 Flash, and isolated tenant storage.
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Cloud Sync Active</span>
              </div>
            </div>

            {/* Token Quota */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 text-cyan-400">
                <Zap className="w-3.5 h-3.5" />
                Token Quota
              </h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Tokens computed in real-time for every prompt + grounded tool response.
              </p>
              <button
                onClick={() => setShowTokenGuide(true)}
                className="text-xs font-bold flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>Read Token Guide</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* About */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 text-cyan-400">
                <Cpu className="w-3.5 h-3.5" />
                Architecture
              </h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Engineered for developers, production teams, and autonomous AI requiring high-throughput multi-agent execution.
              </p>
              <button
                onClick={() => setShowAboutUs(true)}
                className="text-xs font-bold flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>View System Specs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 text-cyan-400">
                <Shield className="w-3.5 h-3.5" />
                Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/admin" className="font-bold flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                    <span>👑 Admin Panel</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing & Plans</Link></li>
                <li><Link href="/analytics" className="text-slate-400 hover:text-white transition-colors">Token Analytics</Link></li>
                <li><Link href="/roles" className="text-slate-400 hover:text-white transition-colors">AI Personas Catalog</Link></li>
                <li><Link href="/api-keys" className="text-slate-400 hover:text-white transition-colors">Developer API Keys</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 border-t border-indigo-500/15 text-slate-500">
            <div>© {new Date().getFullYear()} OmniRole AI. Autonomous AI Persona Studio.</div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-500">
              <span>Groq LPU (110ms)</span>
              <span>•</span>
              <span>Gemini 2.5</span>
              <span>•</span>
              <span>pgvector 768d</span>
              <span>•</span>
              <span>UPI: 9693932656-2@ybl</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Token Guide Modal */}
      {showTokenGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto cyber-card border-indigo-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Token Quota Calculation Guide
              </h3>
              <button onClick={() => setShowTokenGuide(false)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.04]">
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              {[
                { title: '1. How Tokens Are Counted', content: 'Tokens are the basic units of text processed by LLMs. Every character sequence is split into tokens (~4 chars or 0.75 words per token).', formula: 'Total Tokens = Prompt Tokens (Input + System + Grounding) + Completion Tokens (AI Output)' },
                { title: '2. Free Starter Tier — 20,000 Daily Tokens', content: 'Free Starter users receive 20,000 Daily Tokens. Once the daily limit is hit, the service returns 429 until UTC midnight.' },
                { title: '3. Pro — 500K/mo · Enterprise — 5M/mo', content: 'Pro users get 500,000 Monthly Tokens. Enterprise users get 5,000,000. Daily caps are removed and all 6 multi-connectors are unlocked.' },
                { title: '4. Multi-Connector Grounding Cost', content: 'Web Search and Vector RAG snippets are injected into prompt context, slightly increasing prompt token count for higher analytical precision.' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl space-y-2 bg-black/40 border border-white/[0.08]">
                  <h4 className="font-bold text-sm text-white font-heading">{item.title}</h4>
                  <p>{item.content}</p>
                  {item.formula && <div className="font-mono text-[11px] p-2.5 rounded-lg bg-black/60 text-cyan-400 border border-cyan-500/20">{item.formula}</div>}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.08]">
              <button onClick={() => setShowTokenGuide(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs btn-cyber-primary">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutUs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto cyber-card border-indigo-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="text-lg font-extrabold text-white font-heading flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                About OmniRole AI Architecture
              </h3>
              <button onClick={() => setShowAboutUs(false)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.04]">
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 rounded-xl space-y-2 bg-black/40 border border-white/[0.08]">
                <h4 className="font-bold text-sm text-white font-heading">Mission</h4>
                <p>OmniRole AI provides a platform to create, fine-tune, orchestrate, and deploy domain-specific AI Expert Agents with multi-connector grounding, real-time WebSocket telemetry, and sub-110ms response latency.</p>
              </div>
              <div className="p-4 rounded-xl space-y-2 bg-black/40 border border-white/[0.08]">
                <h4 className="font-bold text-sm text-white font-heading">Infrastructure</h4>
                <ul className="space-y-1.5">
                  <li>• <strong className="text-white">Groq LPU:</strong> Sub-110ms execution for OSS 120B models.</li>
                  <li>• <strong className="text-white">Amazon Bedrock:</strong> Llama 3 8B inference via managed AWS infra.</li>
                  <li>• <strong className="text-white">Supabase PostgreSQL + pgvector:</strong> Real-time 768-dim vector embeddings.</li>
                  <li>• <strong className="text-white">RLHF Contextual Bandit:</strong> Autonomous policy optimizing role accuracy over time.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.08]">
              <button onClick={() => setShowAboutUs(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs btn-cyber-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
