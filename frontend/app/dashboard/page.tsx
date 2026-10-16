'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchUserDashboardStats, UserDashboardData } from '@/lib/api';
import { 
  Bot, 
  Search, 
  MessageSquare, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  RefreshCw, 
  ExternalLink,
  Zap,
  Activity,
  ShieldCheck
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await fetchUserDashboardStats();
      setData(stats);
    } catch (err: any) {
      console.error('Failed to load user dashboard data:', err);
      setError('Unable to load personal dashboard. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userName = data?.user?.name || user?.name || 'Developer';
  const userEmail = data?.user?.email || user?.email || '';
  const tokenUsed = data?.token_metrics?.used || 0;
  const tokenLimit = data?.token_metrics?.limit || 100000;
  const tokenPercent = data?.token_metrics?.percentage || 0;
  const tokenRemaining = data?.token_metrics?.remaining || (tokenLimit - tokenUsed);
  const planTier = data?.token_metrics?.tier || user?.plan || 'Free';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header / Welcome Banner */}
      <div className="cyber-card p-6 sm:p-8 relative overflow-hidden border-indigo-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono cyber-pill shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CENTRAL MULTI-TENANCY &middot; PERSONAL WORKSPACE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="gradient-text-cyber">{userName}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your personal dashboard is private to your account (<span className="font-mono text-cyan-300">{userEmail}</span>). Your custom AI roles, search history, and token quotas are strictly isolated.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-xl border border-indigo-500/30 hover:border-indigo-400/60 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 transition-all"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <Link
              href="/roles/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl btn-cyber-primary text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Role</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Token Quota Card */}
        <div className="cyber-card p-6 space-y-4 sm:col-span-2 border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Monthly Token Quota</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-white">
                    {tokenUsed.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {tokenLimit.toLocaleString()}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {planTier.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="text-xs font-bold font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="w-full bg-black/50 border border-white/[0.08] rounded-full h-3 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-purple-500/50"
                style={{ width: `${Math.max(tokenPercent, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="text-indigo-300">{tokenPercent}% consumed</span>
              <span className="text-slate-300">{tokenRemaining.toLocaleString()} tokens remaining</span>
            </div>
          </div>
        </div>

        {/* My Custom Roles */}
        <div className="cyber-card p-6 flex flex-col justify-between border-purple-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">My Custom Roles</p>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-white">{data?.counts?.my_roles ?? 0}</span>
            <p className="text-xs text-slate-400 mt-1 font-mono">Private AI personas</p>
          </div>
        </div>

        {/* Web & RAG Searches */}
        <div className="cyber-card p-6 flex flex-col justify-between border-emerald-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Search & RAG Queries</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-white">{data?.counts?.my_searches ?? 0}</span>
            <p className="text-xs text-slate-400 mt-1 font-mono">Live queries executed</p>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Search History & My Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Personal Search & RAG History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Recent Search & RAG History</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Private to your account</span>
          </div>

          <div className="cyber-card divide-y divide-white/[0.06] overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                Loading your search history...
              </div>
            ) : !data?.search_history || data.search_history.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No search queries yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you ask questions with Web Search or Vector RAG enabled in chat, your grounded sources and queries will appear here.
                  </p>
                </div>
                <Link
                  href="/roles"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 pt-2"
                >
                  Start a grounded chat <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              data.search_history.map((search) => (
                <div key={search.id} className="p-5 hover:bg-white/[0.02] transition-colors space-y-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {search.query_text}
                    </p>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      {search.search_type === 'web_search' ? 'WEB SEARCH' : 'RAG VECTOR'}
                    </span>
                  </div>

                  {/* Sources Preview */}
                  {search.sources_cited && search.sources_cited.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-mono text-slate-400">Cited Sources:</span>
                      {search.sources_cited.slice(0, 3).map((source: any, idx: number) => {
                        const title = source.title || source.name || `Source ${idx + 1}`;
                        const url = source.url || source.link;
                        return url ? (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-2 py-0.5 rounded-lg transition-colors"
                          >
                            <span className="max-w-[150px] truncate">{title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span key={idx} className="text-[11px] text-slate-300 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-lg">
                            {title}
                          </span>
                        );
                      })}
                      {search.sources_cited.length > 3 && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          +{search.sources_cited.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {search.created_at && (
                    <p className="text-[10px] font-mono text-slate-500 pt-0.5">
                      {new Date(search.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 col): My Custom Roles & Recent Chats */}
        <div className="space-y-6">
          {/* Custom Roles Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-white">My Custom Roles</h2>
              <Link href="/roles/new" className="text-xs font-bold font-mono text-cyan-400 hover:text-cyan-300">
                + CREATE
              </Link>
            </div>

            <div className="cyber-card p-4 space-y-3">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading roles...</div>
              ) : !data?.my_roles || data.my_roles.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">You haven't created any custom AI roles yet.</p>
                  <Link
                    href="/roles/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold hover:bg-indigo-500/25 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Role
                  </Link>
                </div>
              ) : (
                data.my_roles.map((r) => (
                  <Link
                    key={r.id}
                    href={`/roles/${r.id}/chat`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{r.icon || '🤖'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {r.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 truncate">{r.model_name}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-white">Recent Chats</h2>
              <Link href="/roles" className="text-xs font-bold font-mono text-cyan-400 hover:text-cyan-300">
                VIEW ALL
              </Link>
            </div>

            <div className="cyber-card p-4 space-y-2">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading chats...</div>
              ) : !data?.recent_conversations || data.recent_conversations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active conversations yet.
                </div>
              ) : (
                data.recent_conversations.map((c) => (
                  <Link
                    key={c.id}
                    href={`/roles/${c.role_id}/chat?cid=${c.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300">
                          {c.title}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">{c.role_name} &middot; {c.message_count} msgs</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
