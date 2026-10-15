'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Server, Save, Check, Zap, Key, Brain, Shield,
  Bell, Sliders, Globe, Cpu, MessageSquare, RefreshCw,
  Eye, EyeOff, AlertTriangle, Wifi, Clock, BarChart2,
} from 'lucide-react';

const BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://54.196.14.199');
const API = `${BASE}/api/v1`;

const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(245,158,11,0.12)',
  color: '#fef3c7',
};
const focusInputStyle = { borderColor: 'rgba(245,158,11,0.5)' };
const labelStyle: React.CSSProperties = { color: '#a8a29e', fontSize: 12, fontWeight: 600 };
const cardStyle = {
  background: 'rgba(18,18,28,0.85)',
  border: '1px solid rgba(245,158,11,0.1)',
  backdropFilter: 'blur(20px)',
};
const sectionHeadStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-3xl space-y-5" style={cardStyle}>
      <h2 className="flex items-center gap-2" style={sectionHeadStyle}>
        <Icon className="w-4 h-4" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block" style={labelStyle}>{label}</label>
      {children}
      {hint && <p className="text-xs" style={{ color: '#57534e' }}>{hint}</p>}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2.5 px-4 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.1)' }}
    >
      <span className="text-xs font-semibold" style={{ color: '#d6d3d1' }}>{label}</span>
      <div
        className="relative w-10 h-5 rounded-full transition-all duration-300"
        style={{ background: value ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow"
          style={{ background: '#fff', left: value ? '22px' : '2px' }}
        />
      </div>
    </button>
  );
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none transition-all pr-10"
        style={inputStyle}
        onFocus={e => Object.assign(e.target.style, focusInputStyle)}
        onBlur={e => (e.target.style.borderColor = 'rgba(245,158,11,0.12)')}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: '#78716c' }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  // ── LLM Provider ─────────────────────────────────────────────────────────
  const [provider, setProvider] = useState('gemini');
  const [groqKey, setGroqKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customModel, setCustomModel] = useState('');

  // ── AI Behaviour ──────────────────────────────────────────────────────────
  const [defaultTemp, setDefaultTemp] = useState(0.7);
  const [defaultMaxTokens, setDefaultMaxTokens] = useState(2048);
  const [defaultStyle, setDefaultStyle] = useState('Analytical & Precise');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [contextWindow, setContextWindow] = useState(10);

  // ── Connectors ────────────────────────────────────────────────────────────
  const [webSearch, setWebSearch] = useState(true);
  const [codeExecutor, setCodeExecutor] = useState(true);
  const [vectorRag, setVectorRag] = useState(true);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [emailNotif, setEmailNotif] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(true);
  const [paymentNotif, setPaymentNotif] = useState(true);
  const [usageThreshold, setUsageThreshold] = useState(80);

  // ── Privacy & Security ────────────────────────────────────────────────────
  const [saveHistory, setSaveHistory] = useState(true);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const [rateLimit, setRateLimit] = useState(60);

  // ── API Health ────────────────────────────────────────────────────────────
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    try {
      const stored = localStorage.getItem('omni_user_settings');
      if (stored) {
        const s = JSON.parse(stored);
        if (s.provider) setProvider(s.provider);
        if (s.defaultTemp !== undefined) setDefaultTemp(s.defaultTemp);
        if (s.defaultMaxTokens) setDefaultMaxTokens(s.defaultMaxTokens);
        if (s.defaultStyle) setDefaultStyle(s.defaultStyle);
        if (s.memoryEnabled !== undefined) setMemoryEnabled(s.memoryEnabled);
        if (s.streamingEnabled !== undefined) setStreamingEnabled(s.streamingEnabled);
        if (s.contextWindow) setContextWindow(s.contextWindow);
        if (s.webSearch !== undefined) setWebSearch(s.webSearch);
        if (s.codeExecutor !== undefined) setCodeExecutor(s.codeExecutor);
        if (s.vectorRag !== undefined) setVectorRag(s.vectorRag);
        if (s.emailNotif !== undefined) setEmailNotif(s.emailNotif);
        if (s.usageAlerts !== undefined) setUsageAlerts(s.usageAlerts);
        if (s.usageThreshold) setUsageThreshold(s.usageThreshold);
        if (s.saveHistory !== undefined) setSaveHistory(s.saveHistory);
        if (s.analyticsOptIn !== undefined) setAnalyticsOptIn(s.analyticsOptIn);
        if (s.rateLimit) setRateLimit(s.rateLimit);
        if (s.customEndpoint) setCustomEndpoint(s.customEndpoint);
        if (s.customModel) setCustomModel(s.customModel);
        // API keys — only load from localStorage, never hardcoded in source
        if (s.groqKey) setGroqKey(s.groqKey);
        if (s.geminiKey) setGeminiKey(s.geminiKey);
        if (s.openRouterKey) setOpenRouterKey(s.openRouterKey);
      }
    } catch {}
  }, []);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${BASE}/health`);
      const data = await res.json();
      setHealth({ ...data, ok: res.ok });
    } catch {
      setHealth({ ok: false, status: 'unreachable' });
    } finally {
      setHealthLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const settings = {
      provider, defaultTemp, defaultMaxTokens, defaultStyle,
      memoryEnabled, streamingEnabled, contextWindow,
      webSearch, codeExecutor, vectorRag,
      emailNotif, usageAlerts, paymentNotif, usageThreshold,
      saveHistory, analyticsOptIn, rateLimit,
      customEndpoint, customModel,
      // Keys stored only in user's own browser — never sent to any server
      groqKey, geminiKey, openRouterKey,
    };
    localStorage.setItem('omni_user_settings', JSON.stringify(settings));
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>
          Platform <span className="gradient-text-ember">Settings</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#78716c' }}>
          Customize your AI experience — providers, behaviour, connectors, notifications & privacy.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── 1. LLM Provider ── */}
        <SectionCard icon={Server} title="LLM Provider & API Keys">
          <FieldRow label="Default Global Provider">
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl text-xs focus:outline-none"
              style={inputStyle}
            >
              <option value="groq">⚡ Groq LPU — GPT-OSS 120B (Fastest, ~110ms)</option>
              <option value="gemini">✨ Google Gemini 2.5 Flash (Smartest)</option>
              <option value="openrouter">🌐 OpenRouter — Qwen 2.5 72B / Llama 3.1</option>
              <option value="bedrock">☁️ Amazon Bedrock — Llama 3 8B</option>
              <option value="openai_compatible">🔧 Custom OpenAI-Compatible Endpoint</option>
            </select>
          </FieldRow>

          <FieldRow label="Groq API Key" hint="Used for lightning-fast inference on Groq LPU hardware.">
            <PasswordInput value={groqKey} onChange={setGroqKey} placeholder="gsk_..." />
          </FieldRow>
          <FieldRow label="Google Gemini API Key" hint="Used for Gemini 2.5 Flash via Google AI Studio.">
            <PasswordInput value={geminiKey} onChange={setGeminiKey} placeholder="AIza..." />
          </FieldRow>
          <FieldRow label="OpenRouter API Key" hint="Access 200+ models through a unified API.">
            <PasswordInput value={openRouterKey} onChange={setOpenRouterKey} placeholder="sk-or-v1-..." />
          </FieldRow>

          {provider === 'openai_compatible' && (
            <>
              <FieldRow label="Custom Base URL" hint="e.g. http://localhost:11434/v1 for Ollama">
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={e => setCustomEndpoint(e.target.value)}
                  placeholder="https://your-endpoint/v1"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all"
                  style={inputStyle}
                />
              </FieldRow>
              <FieldRow label="Custom Model ID" hint="e.g. llama3, mistral, phi3">
                <input
                  type="text"
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                  placeholder="model-name"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all"
                  style={inputStyle}
                />
              </FieldRow>
            </>
          )}
        </SectionCard>

        {/* ── 2. AI Behaviour ── */}
        <SectionCard icon={Brain} title="AI Behaviour & Defaults">
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label={`Default Temperature: ${defaultTemp}`} hint="Higher = more creative">
              <input
                type="range" min={0} max={2} step={0.05}
                value={defaultTemp}
                onChange={e => setDefaultTemp(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </FieldRow>
            <FieldRow label={`Max Tokens: ${defaultMaxTokens.toLocaleString()}`} hint="Max response length">
              <input
                type="range" min={256} max={8192} step={256}
                value={defaultMaxTokens}
                onChange={e => setDefaultMaxTokens(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </FieldRow>
          </div>

          <FieldRow label="Default Response Style">
            <select
              value={defaultStyle}
              onChange={e => setDefaultStyle(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl text-xs focus:outline-none"
              style={inputStyle}
            >
              <option>Analytical & Precise</option>
              <option>Conversational & Friendly</option>
              <option>Concise & Bullet-Point</option>
              <option>Creative & Expansive</option>
              <option>Technical & Formal</option>
              <option>Socratic & Questioning</option>
            </select>
          </FieldRow>

          <FieldRow label={`Conversation Context Window: last ${contextWindow} messages`} hint="How many past messages the AI remembers per session">
            <input
              type="range" min={4} max={50} step={2}
              value={contextWindow}
              onChange={e => setContextWindow(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </FieldRow>

          <div className="space-y-2 pt-1">
            <Toggle value={memoryEnabled} onChange={setMemoryEnabled} label="🧠 Enable Conversation Memory (persist across sessions)" />
            <Toggle value={streamingEnabled} onChange={setStreamingEnabled} label="⚡ Enable Streaming Responses (real-time token output)" />
          </div>
        </SectionCard>

        {/* ── 3. Connectors ── */}
        <SectionCard icon={Globe} title="Active Connectors">
          <p className="text-xs pb-1" style={{ color: '#57534e' }}>
            Control which tools your AI roles can use. Disabling reduces latency but limits capability.
          </p>
          <div className="space-y-2">
            <Toggle value={webSearch} onChange={setWebSearch} label="🔍 Web Search — Live internet access for up-to-date answers" />
            <Toggle value={codeExecutor} onChange={setCodeExecutor} label="💻 Code Executor — Run and test code snippets inline" />
            <Toggle value={vectorRag} onChange={setVectorRag} label="📚 Vector RAG — Retrieval-augmented generation from your docs" />
          </div>
        </SectionCard>

        {/* ── 4. Notifications ── */}
        <SectionCard icon={Bell} title="Notifications & Usage Alerts">
          <div className="space-y-2">
            <Toggle value={emailNotif} onChange={setEmailNotif} label="📧 Email Notifications (new features, updates)" />
            <Toggle value={paymentNotif} onChange={setPaymentNotif} label="💳 Payment & Plan Status Alerts" />
            <Toggle value={usageAlerts} onChange={setUsageAlerts} label="⚠️ Token Usage Alerts (warn before limit reached)" />
          </div>

          {usageAlerts && (
            <FieldRow label={`Alert Threshold: ${usageThreshold}% of monthly limit`} hint="You'll get notified when you cross this usage mark">
              <input
                type="range" min={50} max={99} step={5}
                value={usageThreshold}
                onChange={e => setUsageThreshold(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </FieldRow>
          )}
        </SectionCard>

        {/* ── 5. Privacy & Security ── */}
        <SectionCard icon={Shield} title="Privacy & Security">
          <div className="space-y-2">
            <Toggle value={saveHistory} onChange={setSaveHistory} label="💬 Save Chat History (stored in Supabase)" />
            <Toggle value={analyticsOptIn} onChange={setAnalyticsOptIn} label="📊 Share Anonymous Usage Analytics (helps improve AI)" />
          </div>

          <FieldRow label={`API Rate Limit: ${rateLimit} requests / minute`} hint="Protects your quota from runaway automations">
            <input
              type="range" min={10} max={300} step={10}
              value={rateLimit}
              onChange={e => setRateLimit(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </FieldRow>

          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
            <p className="text-xs" style={{ color: '#78716c' }}>
              Your API keys are stored only in your browser's localStorage and are never sent to our servers. They are used directly by the backend you control.
            </p>
          </div>
        </SectionCard>

        {/* ── 6. Backend Health ── */}
        <SectionCard icon={Wifi} title="Backend Health Check">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={checkHealth}
              disabled={healthLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}
            >
              {healthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
              {healthLoading ? 'Checking...' : 'Check Backend Status'}
            </button>

            {health && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: health.ok ? '#34d399' : '#f87171' }} />
                  <span style={{ color: health.ok ? '#34d399' : '#f87171' }}>
                    {health.ok ? 'Online' : 'Offline'}
                  </span>
                </span>
                {health.version && <span style={{ color: '#78716c' }}>v{health.version}</span>}
                {health.llm_provider && <span style={{ color: '#fbbf24' }}>{health.llm_provider}</span>}
                {health.database && (
                  <span style={{ color: '#a78bfa' }}>{health.database}</span>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Save ── */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs" style={{ color: '#57534e' }}>
            Settings are saved to your browser and applied across all sessions.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl font-bold text-xs text-black flex items-center gap-1.5 transition-all"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #34d399, #10b981)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: saved
                ? '0 4px 20px rgba(52,211,153,0.3)'
                : '0 4px 20px rgba(245,158,11,0.3)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : saved ? 'All Settings Saved ✓' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
