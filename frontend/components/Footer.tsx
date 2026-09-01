'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Zap, Cpu, Shield, ArrowRight, ExternalLink } from 'lucide-react';

export function Footer() {
  const [showTokenGuide, setShowTokenGuide] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);

  return (
    <>
      <footer className="mt-auto border-t py-12 px-6" style={{ borderColor: 'rgba(245,158,11,0.08)', background: '#0c0c14' }}>
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Col */}
            <div className="space-y-4 md:col-span-1">
              <Logo size="md" showText={true} />
              <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                Specialized AI Expert Agent Creation & Multi-Connector Orchestration Platform. Sub-110ms execution powered by Groq LPUs & Gemini.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-medium text-emerald-400">Supabase Cloud Sync Active</span>
              </div>
            </div>

            {/* Token Quota */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#fef3c7' }}>
                <Zap className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                Token Quota
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                Tokens computed in real-time for every prompt + response.
              </p>
              <button
                onClick={() => setShowTokenGuide(true)}
                className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: '#f59e0b' }}
              >
                <span>Read Token Guide</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* About */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#fef3c7' }}>
                <Cpu className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                About Platform
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                Engineered for developers, production teams, and enterprise AI requiring high-throughput multi-agent execution.
              </p>
              <button
                onClick={() => setShowAboutUs(true)}
                className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: '#f59e0b' }}
              >
                <span>View Architecture</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#fef3c7' }}>
                <Shield className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                Quick Links
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/admin" className="font-bold flex items-center gap-1 hover:opacity-80" style={{ color: '#f59e0b' }}>
                    <span>👑 Admin Panel</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </li>
                <li><Link href="/pricing" className="hover:text-amber-300 transition-colors" style={{ color: '#78716c' }}>Pricing & Plans</Link></li>
                <li><Link href="/analytics" className="hover:text-amber-300 transition-colors" style={{ color: '#78716c' }}>Token Analytics</Link></li>
                <li><Link href="/roles" className="hover:text-amber-300 transition-colors" style={{ color: '#78716c' }}>AI Roles Catalog</Link></li>
                <li><Link href="/api-keys" className="hover:text-amber-300 transition-colors" style={{ color: '#78716c' }}>Developer API Keys</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4" style={{ borderTop: '1px solid rgba(245,158,11,0.08)', color: '#44403c' }}>
            <div>© {new Date().getFullYear()} OmniRole AI. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]" style={{ color: '#57534e' }}>
              <span>Amazon Bedrock (meta.llama3-8b)</span>
              <span>•</span>
              <span>PostgreSQL Vector 768d</span>
              <span>•</span>
              <span>UPI: 9693932656-2@ybl</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Token Guide Modal */}
      {showTokenGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl" style={{ background: '#12121c', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
              <h3 className="text-lg font-extrabold font-sora flex items-center gap-2" style={{ color: '#fef3c7' }}>
                <Zap className="w-5 h-5" style={{ color: '#f59e0b' }} />
                Token Quota Calculation Guide
              </h3>
              <button onClick={() => setShowTokenGuide(false)} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:text-amber-300" style={{ background: 'rgba(255,255,255,0.04)', color: '#78716c' }}>
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
              {[
                { title: '1. How Tokens Are Counted', content: 'Tokens are the basic units of text processed by LLMs. Every character sequence is split into tokens (~4 chars or 0.75 words per token).', formula: 'Total Tokens = Prompt Tokens (Input + System + Grounding) + Completion Tokens (AI Output)' },
                { title: '2. Free Starter Tier — 20,000 Daily Tokens', content: 'Free Starter users receive 20,000 Daily Tokens. Once the daily limit is hit, the service returns 429 until UTC midnight.' },
                { title: '3. Pro — 500K/mo · Enterprise — 5M/mo', content: 'Pro users get 500,000 Monthly Tokens. Enterprise users get 5,000,000. Daily caps are removed and all 6 multi-connectors are unlocked.' },
                { title: '4. Multi-Connector Grounding Cost', content: 'Web Search and Vector RAG snippets are injected into prompt context, slightly increasing prompt token count for higher analytical precision.' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <h4 className="font-bold text-sm font-sora" style={{ color: '#fef3c7' }}>{item.title}</h4>
                  <p>{item.content}</p>
                  {item.formula && <div className="font-mono text-[11px] p-2.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)' }}>{item.formula}</div>}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}>
              <button onClick={() => setShowTokenGuide(false)} className="px-5 py-2 rounded-xl font-bold text-xs text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutUs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl" style={{ background: '#12121c', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
              <h3 className="text-lg font-extrabold font-sora flex items-center gap-2" style={{ color: '#fef3c7' }}>
                <Cpu className="w-5 h-5" style={{ color: '#f59e0b' }} />
                About OmniRole AI
              </h3>
              <button onClick={() => setShowAboutUs(false)} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.04)', color: '#78716c' }}>
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
              <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                <h4 className="font-bold text-sm font-sora" style={{ color: '#fef3c7' }}>Mission</h4>
                <p>OmniRole AI provides a platform to create, fine-tune, orchestrate, and deploy domain-specific AI Expert Agents with multi-connector grounding, real-time WebSocket telemetry, and sub-110ms response latency.</p>
              </div>
              <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                <h4 className="font-bold text-sm font-sora" style={{ color: '#fef3c7' }}>Infrastructure</h4>
                <ul className="space-y-1.5">
                  <li>• <strong style={{ color: '#fef3c7' }}>Groq LPU:</strong> Sub-110ms execution for OSS 120B models.</li>
                  <li>• <strong style={{ color: '#fef3c7' }}>Amazon Bedrock:</strong> Llama 3 8B inference via managed AWS infra.</li>
                  <li>• <strong style={{ color: '#fef3c7' }}>Supabase PostgreSQL + pgvector:</strong> Real-time 768-dim vector embeddings.</li>
                  <li>• <strong style={{ color: '#fef3c7' }}>RLHF Contextual Bandit:</strong> Autonomous policy optimizing role accuracy over time.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}>
              <button onClick={() => setShowAboutUs(false)} className="px-5 py-2 rounded-xl font-bold text-xs text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
