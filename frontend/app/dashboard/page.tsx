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
  Zap
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Workspace &middot; Isolated Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Your personal dashboard is private to your account (<span className="font-medium text-slate-700">{userEmail}</span>). Your custom AI roles, search history, and token quotas are strictly isolated.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <Link
              href="/roles/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all"
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly Token Quota</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {tokenUsed.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {tokenLimit.toLocaleString()}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {planTier}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Upgrade <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${tokenPercent > 90 ? 'bg-red-500' : tokenPercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${Math.max(tokenPercent, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{tokenPercent}% consumed</span>
              <span>{tokenRemaining.toLocaleString()} tokens remaining</span>
            </div>
          </div>
        </div>

        {/* My Custom Roles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">My Custom Roles</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">{data?.counts?.my_roles ?? 0}</span>
            <p className="text-xs text-slate-500 mt-1">Private AI personas</p>
          </div>
        </div>

        {/* Web & RAG Searches */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Search & RAG Queries</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">{data?.counts?.my_searches ?? 0}</span>
            <p className="text-xs text-slate-500 mt-1">Live searches executed</p>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Search History & My Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Personal Search & RAG History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Recent Search & RAG History</h2>
            </div>
            <span className="text-xs text-slate-500">Private to your account</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading your search history...
              </div>
            ) : !data?.search_history || data.search_history.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">No search queries yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you ask questions with Web Search or Vector RAG enabled in chat, your grounded sources and queries will appear here.
                  </p>
                </div>
                <Link
                  href="/roles"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-2"
                >
                  Start a grounded chat <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              data.search_history.map((search) => (
                <div key={search.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                      {search.query_text}
                    </p>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {search.search_type === 'web_search' ? 'Web Search' : 'RAG Vector'}
                    </span>
                  </div>

                  {/* Sources Preview */}
                  {search.sources_cited && search.sources_cited.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-medium text-slate-400">Cited Sources:</span>
                      {search.sources_cited.slice(0, 3).map((source: any, idx: number) => {
                        const title = source.title || source.name || `Source ${idx + 1}`;
                        const url = source.url || source.link;
                        return url ? (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                          >
                            <span className="max-w-[140px] truncate">{title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span key={idx} className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {title}
                          </span>
                        );
                      })}
                      {search.sources_cited.length > 3 && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          +{search.sources_cited.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {search.created_at && (
                    <p className="text-[11px] text-slate-400 pt-1">
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">My Custom AI Roles</h2>
              <Link href="/roles/new" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                + Create
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading roles...</div>
              ) : !data?.my_roles || data.my_roles.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-slate-500">You haven't created any custom AI roles yet.</p>
                  <Link
                    href="/roles/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Role
                  </Link>
                </div>
              ) : (
                data.my_roles.map((r) => (
                  <Link
                    key={r.id}
                    href={`/roles/${r.id}/chat`}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{r.icon || '🤖'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {r.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{r.model_name}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Chats</h2>
              <Link href="/roles" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-2">
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
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                          {c.title}
                        </p>
                        <p className="text-[10px] text-slate-400">{c.role_name} &middot; {c.message_count} msgs</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
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
