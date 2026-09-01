'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/MetricCard';
import { RoleCard } from '@/components/RoleCard';
import { fetchRoles, fetchUsageMetrics, Role, AnalyticsData } from '@/lib/api';
import { Bot, Terminal, Zap, Clock, Plus, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [rolesData, usageData] = await Promise.all([
        fetchRoles(),
        fetchUsageMetrics(),
      ]);
      setRoles(rolesData);
      setAnalytics(usageData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalRequests = analytics?.total_requests ?? analytics?.metrics?.total_api_requests ?? 0;
  const totalTokens = analytics?.total_tokens ?? analytics?.metrics?.total_tokens_used ?? 0;
  const avgLatency = analytics?.average_latency_ms ?? analytics?.metrics?.avg_response_time_ms ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="p-8 rounded-3xl relative overflow-hidden glass-card">
        {/* Warm glow orb */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Connector AI Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>
              Welcome back to{' '}
              <span className="gradient-text-ember">OmniRole AI</span> 👋
            </h1>
            <p className="text-sm max-w-2xl leading-relaxed" style={{ color: '#a8a29e' }}>
              Deploy specialized AI personas grounded with Web Search, Code REPL, and Vector RAG context via high-speed API execution.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadDashboardData}
              className="p-3 rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)', color: '#a8a29e' }}
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <Link
              href="/roles/new"
              className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Create AI Role</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Active AI Roles" value={roles.length} subtitle="Configured expert personas" icon={Bot} trend="Live DB Synced" trendType="positive" />
        <MetricCard title="Total API Requests" value={totalRequests.toLocaleString()} subtitle="Processed via backend" icon={Terminal} trend="Live Telemetry" trendType="positive" />
        <MetricCard title="Tokens Used" value={totalTokens.toLocaleString()} subtitle="Prompt + completion tokens" icon={Zap} />
        <MetricCard title="Avg Response Time" value={`${avgLatency} ms`} subtitle="Latency across providers" icon={Clock} trend="Optimized" trendType="positive" />
      </div>

      {/* Recent Roles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-sora" style={{ color: '#fef3c7' }}>Recent AI Roles</h2>
            <p className="text-xs mt-0.5" style={{ color: '#78716c' }}>Launch chat workspaces or edit system configurations.</p>
          </div>
          <Link href="/roles" className="text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#f59e0b' }}>
            View All ({roles.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-3xl animate-pulse" style={{ background: 'rgba(18,18,28,0.75)', border: '1px solid rgba(245,158,11,0.08)' }} />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-16 rounded-3xl space-y-4 glass-card">
            <Bot className="w-12 h-12 mx-auto" style={{ color: '#44403c' }} />
            <h3 className="text-sm font-bold font-sora" style={{ color: '#a8a29e' }}>No AI Roles Yet</h3>
            <p className="text-xs" style={{ color: '#78716c' }}>Create your first specialized role agent to get started.</p>
            <Link href="/roles/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Plus className="w-4 h-4" />
              Create AI Role
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.slice(0, 6).map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
