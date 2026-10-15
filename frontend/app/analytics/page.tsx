'use client';

import React, { useEffect, useState } from 'react';
import { fetchUsageMetrics, fetchRoles, AnalyticsData } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { BarChart2, Terminal, Zap, Clock, Activity, RefreshCw, Cpu, Gauge } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [rolesCount, setRolesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [rlData, setRlData] = useState<any>(null);

  const BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://54.196.14.199');

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [res, rolesData, rlRes] = await Promise.all([
        fetchUsageMetrics(),
        fetchRoles(),
        fetch(`${BASE}/api/v1/rl/dashboard`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setData(res);
      setRolesCount(rolesData.length);
      setRlData(rlRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const totalRequests = data?.total_requests ?? data?.metrics?.total_api_requests ?? 0;
  const totalTokens = data?.total_tokens ?? data?.metrics?.tokens_used ?? 0;
  const promptTokens = data?.prompt_tokens ?? Math.round(totalTokens * 0.35);
  const completionTokens = data?.completion_tokens ?? Math.round(totalTokens * 0.65);
  const avgLatency = data?.average_latency_ms ?? data?.metrics?.average_response_time_ms ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>
            Usage & <span className="gradient-text-ember">Analytics</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#78716c' }}>
            Real-time inference performance, latency metrics, and token execution logs.
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="p-2.5 rounded-xl transition-colors self-start"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', color: '#78716c' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Total API Executions" value={totalRequests.toLocaleString()} subtitle="Processed API requests" icon={Terminal} trend="Live Telemetry" trendType="positive" />
        <MetricCard title="Tokens Processed" value={totalTokens.toLocaleString()} subtitle="Prompt + Completion tokens" icon={Zap} />
        <MetricCard title="Average Latency" value={`${avgLatency} ms`} subtitle="Provider execution latency" icon={Clock} trend="Optimized" trendType="positive" />
        <MetricCard title="Active AI Roles" value={rolesCount} subtitle="Engaged AI role agents" icon={Activity} />
      </div>

      {/* Token Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl space-y-4 glass-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
              <Zap className="w-4 h-4" /> Token Quota Gauge
            </h2>
            <span className="text-[10px] font-mono uppercase" style={{ color: '#78716c' }}>Live Usage</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black font-sora" style={{ color: '#fef3c7' }}>{totalTokens.toLocaleString()}</span>
              <span className="text-xs" style={{ color: '#78716c' }}>/ {totalTokens > 50000 ? '500,000 Mo' : '20,000 Daily'}</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, (totalTokens / (totalTokens > 50000 ? 500000 : 20000)) * 100))}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono" style={{ color: '#78716c' }}>
              <span>0</span>
              <span>{Math.round((totalTokens / (totalTokens > 50000 ? 500000 : 20000)) * 100)}% Used</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl space-y-4 glass-card lg:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
            <BarChart2 className="w-4 h-4" /> Prompt vs Completion Token Ratio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Prompt Tokens', value: promptTokens, pct: totalTokens > 0 ? (promptTokens / totalTokens) * 100 : 35, color: '#f59e0b', desc: 'System instructions & grounding' },
              { label: 'Completion Tokens', value: completionTokens, pct: totalTokens > 0 ? (completionTokens / totalTokens) * 100 : 65, color: '#34d399', desc: 'AI Expert response tokens' },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.08)' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#a8a29e' }}>{item.label}</span>
                  <span className="font-mono font-bold" style={{ color: item.color }}>{item.value.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
                <div className="text-[10px]" style={{ color: '#57534e' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provider Benchmarks */}
      <div className="p-6 rounded-3xl space-y-4 glass-card">
        <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
          <Gauge className="w-4 h-4" /> Provider Speed Benchmarks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { provider: 'Groq LPU Engine', ms: '110 ms', desc: 'GPT-OSS 120B Ultra-Fast', color: '#f59e0b' },
            { provider: 'Gemini 2.5 Flash', ms: '240 ms', desc: 'Multimodal Reasoning', color: '#34d399' },
            { provider: 'Amazon Bedrock', ms: '310 ms', desc: 'Llama 3 8B Instruct', color: '#a78bfa' },
          ].map((p) => (
            <div key={p.provider} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.08)' }}>
              <div className="text-[11px] font-mono" style={{ color: '#78716c' }}>{p.provider}</div>
              <div className="text-xl font-black font-sora mt-1" style={{ color: p.color }}>{p.ms}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#57534e' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-sora" style={{ color: '#fef3c7' }}>API Execution Audit Logs</h2>
          <span className="text-xs font-mono" style={{ color: '#57534e' }}>Synced to Supabase</span>
        </div>
        <div className="rounded-3xl overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
                <tr>
                  {['Target Endpoint', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Latency', 'Timestamp'].map((h) => (
                    <th key={h} className="py-3.5 px-5 font-bold uppercase tracking-wider" style={{ color: '#78716c' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center" style={{ color: '#57534e' }}>Loading telemetry logs...</td></tr>
                ) : !data || !data.recent_records || data.recent_records.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center" style={{ color: '#57534e' }}>No logs yet. Send requests via Playground or REST API.</td></tr>
                ) : (
                  data.recent_records.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid rgba(245,158,11,0.05)' }}>
                      <td className="py-4 px-5 font-mono" style={{ color: '#fbbf24' }}>{rec.endpoint}</td>
                      <td className="py-4 px-5 font-mono" style={{ color: '#a8a29e' }}>{rec.tokens_prompt}</td>
                      <td className="py-4 px-5 font-mono" style={{ color: '#a8a29e' }}>{rec.tokens_completion}</td>
                      <td className="py-4 px-5 font-mono font-bold" style={{ color: '#fef3c7' }}>{rec.tokens_total}</td>
                      <td className="py-4 px-5 font-mono text-emerald-400">{rec.latency_ms} ms</td>
                      <td className="py-4 px-5" style={{ color: '#78716c' }}>{new Date(rec.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ── RL Self-Learning Dashboard ── */}
      <div className="rounded-3xl p-6 space-y-5" style={{ background: 'rgba(18,18,28,0.75)', border: '1px solid rgba(245,158,11,0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
            <Activity className="w-4 h-4" />
            RL Self-Learning Engine — Live Policy State
          </h2>
          {rlData && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span style={{ color: '#34d399' }}>⬤ Learning Active</span>
              <span style={{ color: '#78716c' }}>{rlData.total_feedback_signals} signals collected</span>
              <span style={{ color: '#78716c' }}>{rlData.total_episodes_stored} episodes stored</span>
            </div>
          )}
        </div>

        {!rlData ? (
          <p className="text-xs text-center py-6" style={{ color: '#57534e' }}>No feedback collected yet. Start chatting and rate responses to train the AI.</p>
        ) : (
          <>
            {/* Signal breakdown */}
            {rlData.signal_breakdown && Object.keys(rlData.signal_breakdown).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(rlData.signal_breakdown).map(([signal, count]: [string, any]) => {
                  const color = signal === 'thumbs_up' || signal.startsWith('star_4') || signal.startsWith('star_5') ? '#34d399'
                    : signal === 'thumbs_down' || signal.startsWith('star_1') || signal.startsWith('star_2') ? '#f87171'
                    : '#fbbf24';
                  const emoji = signal === 'thumbs_up' ? '👍' : signal === 'thumbs_down' ? '👎' : signal === 'copy' ? '📋' : signal === 'regenerate' ? '🔄' : signal.startsWith('star') ? '⭐' : '📡';
                  return (
                    <span key={signal} className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}30`, color }}>
                      {emoji} {signal}: {count}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Per-role policy table */}
            {rlData.role_policies && rlData.role_policies.length > 0 && (
              <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(245,158,11,0.08)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                      {['Role', 'Feedback', 'Avg Reward', 'EMA Reward', 'Best Style', 'Temp', 'Explorations'].map(h => (
                        <th key={h} className="py-3 px-4 text-left font-bold" style={{ color: '#fbbf24' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rlData.role_policies.map((rp: any) => {
                      const reward = rp.average_reward ?? 0;
                      const rewardColor = reward >= 0.5 ? '#34d399' : reward >= 0 ? '#fbbf24' : '#f87171';
                      return (
                        <tr key={rp.role_id} style={{ borderBottom: '1px solid rgba(245,158,11,0.05)' }}>
                          <td className="py-3 px-4 font-semibold" style={{ color: '#fef3c7' }}>{rp.role_name}</td>
                          <td className="py-3 px-4 font-mono" style={{ color: '#a8a29e' }}>{rp.total_feedback}</td>
                          <td className="py-3 px-4 font-mono font-bold" style={{ color: rewardColor }}>{reward.toFixed(3)}</td>
                          <td className="py-3 px-4 font-mono" style={{ color: '#78716c' }}>{(rp.reward_ema ?? 0).toFixed(3)}</td>
                          <td className="py-3 px-4 text-[11px]" style={{ color: '#d6d3d1' }}>{rp.best_style || '—'}</td>
                          <td className="py-3 px-4 font-mono" style={{ color: '#fbbf24' }}>{rp.optimized_temperature?.toFixed(1) ?? '—'}</td>
                          <td className="py-3 px-4 font-mono" style={{ color: '#78716c' }}>{rp.exploration_count ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-[11px]" style={{ color: '#44403c' }}>
              UCB1 Contextual Bandit · EMA α=0.15 · Daily batch refit at midnight · {rlData.total_episodes_stored} episodes in replay buffer
            </p>
          </>
        )}
      </div>
    </div>
  );
}
