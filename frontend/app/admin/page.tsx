'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminOverview, AdminOverview } from '@/lib/api';
import {
  ShieldAlert,
  Users,
  Bot,
  Zap,
  Activity,
  Cpu,
  Layers,
  Database,
  Megaphone,
  ArrowRight,
  TrendingUp,
  Clock,
  Key,
  Sparkles,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then((data) => {
        setOverview(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Loading Enterprise Admin Control Tower...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
        Failed to load Admin Control Tower. Ensure FastAPI backend server is running on port 8000.
      </div>
    );
  }

  const { kpi, system_status } = overview;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Admin Portal v1.0
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
            <span>Platform Enterprise Control Tower</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor real-time token consumption, manage user subscriptions, inspect connector telemetry, and issue global announcements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            href="/admin/announcements"
            className="px-4 py-2 rounded-xl bg-[#141418] hover:bg-[#1c1c22] border border-[#27272a] text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Promos & Ads</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Registered Users</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{kpi.total_users}</div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Clerk & Supabase Synced</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Tokens Burned</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{kpi.total_tokens_burned.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-500">
            Prompt: {kpi.prompt_tokens.toLocaleString()} | Completion: {kpi.completion_tokens.toLocaleString()}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">AI Roles Created</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{kpi.total_roles}</div>
          <div className="text-[11px] text-zinc-500">
            {kpi.total_api_keys} Active Developer API Keys
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Avg Response Latency</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{kpi.average_latency_ms} ms</div>
          <div className="text-[11px] text-zinc-500">
            {kpi.total_connector_runs} Connector Executions Logged
          </div>
        </div>
      </div>

      {/* System Status & LLM Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database & Vector Engine Health
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Supabase PostgreSQL Connection</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                {system_status.database.toUpperCase()}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Vector Embedding Engine</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[11px]">
                {system_status.supabase_vector}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
              <span className="text-zinc-300 font-medium">RLHF Contextual Bandit Policy</span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-mono text-[11px]">
                Active (+1.0 / -1.0 Reward Matrix)
              </span>
            </div>
          </div>
        </div>

        {/* Active LLM Infrastructure */}
        <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Active Multi-LLM Provider Grid
          </h2>

          <div className="space-y-2.5">
            {system_status.active_providers.map((p, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">{p}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
                  Online (100% SLA)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="p-6 rounded-2xl bg-[#121215] hover:bg-[#18181c] border border-[#27272a] transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>User Profile & Search Connector Control</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Toggle web search, code executor, and vector RAG connector permissions per user.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/plans"
          className="p-6 rounded-2xl bg-[#121215] hover:bg-[#18181c] border border-[#27272a] transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Custom Plans & User Offers Manager</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Publish custom subscription tiers and targeted user deals synced to Supabase PostgreSQL.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
