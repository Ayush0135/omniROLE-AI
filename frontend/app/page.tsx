'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles, Bot, Terminal, Zap, ArrowRight, Shield, Layers, Cpu, Code2,
} from 'lucide-react';

export default function LandingPage() {
  const featuredRoles = [
    { title: 'Research Scientist', desc: 'Hypothesis testing, literature synthesis & empirical analysis.', icon: '🧠', tags: ['Research', 'ML', 'Python'] },
    { title: 'Code Architect', desc: 'Software architecture design patterns, clean code & scalability.', icon: '⚡', tags: ['System Design', 'FastAPI', 'Microservices'] },
    { title: 'Data Analyst', desc: 'Quantitative statistical metrics, predictive modeling & trends.', icon: '📊', tags: ['SQL', 'Statistics', 'Analytics'] },
    { title: 'Legal Research Assistant', desc: 'Statutory compliance auditing, precedent review & brief drafting.', icon: '⚖️', tags: ['Compliance', 'Risk Audit', 'Contracts'] },
  ];

  const features = [
    {
      icon: Layers,
      title: '1. Role & Expertise Injection',
      desc: 'Define system instructions, domain tags, response styles, and memory parameters to shape model persona.',
      accent: '#f59e0b',
    },
    {
      icon: Cpu,
      title: '2. Modular Provider Abstraction',
      desc: 'Plug into Amazon Bedrock, Groq, Gemini, or any OpenAI-compatible server with zero code changes.',
      accent: '#f59e0b',
    },
    {
      icon: Terminal,
      title: '3. Developer REST API Keys',
      desc: 'Generate secure API keys to integrate role endpoints into your backend services or frontend apps.',
      accent: '#f59e0b',
    },
  ];

  return (
    <div className="space-y-20 py-4">
      {/* Hero Section */}
      <section className="text-center space-y-7 pt-6 pb-2 relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>OmniRole AI Engine v1.0 Released</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black font-sora tracking-tight max-w-4xl mx-auto leading-tight" style={{ color: '#fef3c7' }}>
          Transform General LLMs into <br />
          <span className="gradient-text-ember">Specialized AI Experts</span>
        </h1>

        <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#a8a29e' }}>
          Configure domain expertise, system instructions, model parameters, and access tailored AI role agents through a developer-grade REST API.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="px-7 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xl transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/roles/new"
            className="px-7 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all hover:border-amber-500/30"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', color: '#a8a29e' }}
          >
            <Bot className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <span>Create Custom Role</span>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
          {['Amazon Bedrock', 'Groq LPU', 'Gemini 2.5', 'Supabase'].map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#57534e' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }}></span>
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Feature Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="p-7 rounded-3xl space-y-4 group glass-card glass-card-hover">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-sora" style={{ color: '#fef3c7' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>{f.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Featured Roles Showcase */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>Pre-Configured AI Experts</h2>
            <p className="text-xs mt-1" style={{ color: '#78716c' }}>Ready-to-use roles configured for high-precision tasks.</p>
          </div>
          <Link href="/roles" className="text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#f59e0b' }}>
            View all roles
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredRoles.map((role, idx) => (
            <div key={idx} className="p-5 rounded-3xl flex items-start gap-4 glass-card glass-card-hover">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                {role.icon}
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="text-sm font-bold font-sora" style={{ color: '#fef3c7' }}>{role.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>{role.desc}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {role.tags.map((t, i) => (
                    <span key={i} className="px-2.5 py-0.5 text-[10px] font-semibold rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#d97706' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 rounded-3xl glass-card relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.05) 0%, transparent 70%)' }} />
        <div className="relative z-10 space-y-5">
          <h2 className="text-3xl font-black font-sora" style={{ color: '#fef3c7' }}>Ready to build your AI workforce?</h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#78716c' }}>Start free. Upgrade when you need more tokens, connectors, and enterprise features.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-black shadow-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 32px rgba(245,158,11,0.25)' }}>
            <Zap className="w-4 h-4" />
            View Pricing Plans
          </Link>
        </div>
      </section>
    </div>
  );
}
