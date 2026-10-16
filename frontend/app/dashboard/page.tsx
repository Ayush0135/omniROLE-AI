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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. Header / Welcome Banner */}
      <div className="precision-card p-5 sm:p-8 relative overflow-hidden border-indigo-500/25">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium precision-badge shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Personal Workspace &middot; Isolated Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Your roles, search logs, and token quotas are private to <span className="text-slate-100 font-medium">{userEmail}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Refresh Stats"
              aria-label="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <Link
              href="/roles/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl btn-precision-primary text-xs sm:text-sm font-semibold shadow-sm transition-all min-h-[44px] flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span>New Role</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Token Quota Card */}
        <div className="precision-card p-5 sm:p-6 space-y-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Token Quota</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-white">
                    {tokenUsed.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {tokenLimit.toLocaleString()}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {planTier}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors min-h-[44px] flex items-center"
            >
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-black/40 border border-white/[0.08] rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                style={{ width: `${Math.max(tokenPercent, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span className="text-indigo-300">{tokenPercent}% consumed</span>
              <span>{tokenRemaining.toLocaleString()} tokens remaining</span>
            </div>
          </div>
        </div>

        {/* My Custom Roles */}
        <div className="precision-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Custom Roles</p>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{data?.counts?.my_roles ?? 0}</span>
            <p className="text-xs text-slate-400 mt-0.5">Private AI personas</p>
          </div>
        </div>

        {/* Web & RAG Searches */}
        <div className="precision-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search &amp; RAG Queries</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{data?.counts?.my_searches ?? 0}</span>
            <p className="text-xs text-slate-400 mt-0.5">Live queries executed</p>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Search History & My Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column (2 cols): Personal Search & RAG History */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">Recent Search &amp; RAG History</h2>
            </div>
            <span className="text-xs text-slate-400">Private to your account</span>
          </div>

          <div className="precision-card divide-y divide-white/[0.06] overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading your search history...
              </div>
            ) : !data?.search_history || data.search_history.length === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">No search queries yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you ask questions with Web Search or Vector RAG enabled in chat, your grounded sources and queries will appear here.
                  </p>
                </div>
                <Link
                  href="/roles"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-2 min-h-[44px]"
                >
                  Start a grounded chat <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              data.search_history.map((search) => (
                <div key={search.id} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white leading-snug line-clamp-2">
                      {search.query_text}
                    </p>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {search.search_type === 'web_search' ? 'Web Search' : 'RAG Vector'}
                    </span>
                  </div>

                  {/* Sources Preview */}
                  {search.sources_cited && search.sources_cited.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400">Sources:</span>
                      {search.sources_cited.slice(0, 3).map((source: any, idx: number) => {
                        const title = source.title || source.name || `Source ${idx + 1}`;
                        const url = source.url || source.link;
                        return url ? (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-0.5 rounded transition-colors"
                          >
                            <span className="max-w-[140px] truncate">{title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span key={idx} className="text-[11px] text-slate-300 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded">
                            {title}
                          </span>
                        );
                      })}
                      {search.sources_cited.length > 3 && (
                        <span className="text-[11px] text-slate-400">
                          +{search.sources_cited.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {search.created_at && (
                    <p className="text-[10px] text-slate-500 pt-0.5">
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
              <h2 className="text-base sm:text-lg font-bold text-white">My Custom Roles</h2>
              <Link href="/roles/new" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 min-h-[44px] flex items-center">
                + Create
              </Link>
            </div>

            <div className="precision-card p-3 sm:p-4 space-y-2.5">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading roles...</div>
              ) : !data?.my_roles || data.my_roles.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">You haven't created any custom AI roles yet.</p>
                  <Link
                    href="/roles/new"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/25 transition-colors min-h-[44px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Role
                  </Link>
                </div>
              ) : (
                data.my_roles.map((r) => (
                  <Link
                    key={r.id}
                    href={`/roles/${r.id}/chat`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{r.icon || '🤖'}</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {r.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{r.model_name}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base sm:text-lg font-bold text-white">Recent Chats</h2>
              <Link href="/roles" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 min-h-[44px] flex items-center">
                View All
              </Link>
            </div>

            <div className="precision-card p-3 sm:p-4 space-y-2">
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
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.04] transition-colors group min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300">
                          {c.title}
                        </p>
                        <p className="text-[10px] text-slate-400">{c.role_name} &middot; {c.message_count} msgs</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
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
