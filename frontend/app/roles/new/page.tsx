'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createRole, enhanceSystemPrompt } from '@/lib/api';
import {
  Plus, ArrowLeft, Bot, Sparkles, Cpu, ShieldCheck, Check, X,
  Globe, Terminal, Database, Layers, Zap, Wand2, ChevronRight, ChevronLeft,
} from 'lucide-react';

const AVAILABLE_CONNECTORS = [
  { id: 'web_search', name: 'Web Search Grounding', icon: Globe, desc: 'Real-time Google/DuckDuckGo search context' },
  { id: 'code_executor', name: 'Code Executor REPL', icon: Terminal, desc: 'Sandboxed Python & Math script execution' },
  { id: 'vector_rag', name: 'Vector RAG Search', icon: Layers, desc: '768-dim pgvector knowledge chunk retrieval' },
  { id: 'database_query', name: 'Database Query Tool', icon: Database, desc: 'Supabase PostgreSQL schema and data query' },
  { id: 'google_drive', name: 'Google Drive Connector', icon: Zap, desc: 'Search and read Google Drive docs for RAG' },
  { id: 'email', name: 'Email / Resend Connector', icon: Zap, desc: 'Read email threads and send AI-generated reports' },
];

const cardStyle = {
  background: 'rgba(18,18,28,0.85)',
  border: '1px solid rgba(245,158,11,0.12)',
  backdropFilter: 'blur(20px)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(245,158,11,0.12)',
  color: '#fef3c7',
};

const labelStyle: React.CSSProperties = { color: '#a8a29e' };

export default function CreateRolePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Bot');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [expertise, setExpertise] = useState<string[]>(['AI Architecture', 'Problem Solving']);
  const [enabledConnectors, setEnabledConnectors] = useState<string[]>(['web_search', 'code_executor', 'vector_rag']);
  const [provider, setProvider] = useState('groq');
  const [modelName, setModelName] = useState('openai/gpt-oss-120b');
  const [temperature, setTemperature] = useState(0.4);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [responseStyle, setResponseStyle] = useState('Analytical & Precise');
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !expertise.includes(tagInput.trim())) {
      setExpertise([...expertise, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => setExpertise(expertise.filter((t) => t !== tag));

  const toggleConnector = (id: string) => {
    setEnabledConnectors(
      enabledConnectors.includes(id) ? enabledConnectors.filter((c) => c !== id) : [...enabledConnectors, id]
    );
  };

  const handleAutoEnhancePrompt = async () => {
    if (!name.trim() && !systemPrompt.trim()) {
      alert('Please enter a Role Name or initial prompt first.');
      return;
    }
    setEnhancing(true);
    try {
      const enhanced = await enhanceSystemPrompt(name || 'AI Expert', systemPrompt || 'Analyze queries accurately.');
      setSystemPrompt(enhanced);
    } catch {
      alert('Failed to enhance prompt. Using template fallback.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const newRole = await createRole({
        name, description: description || `Specialized AI Expert focused on ${name}.`, icon,
        system_prompt: systemPrompt, expertise, connectors: enabledConnectors,
        provider, model_name: modelName, temperature, max_tokens: maxTokens,
        response_style: responseStyle, memory_enabled: true,
      });
      router.push(`/roles/${newRole.id}/chat`);
    } catch (err: any) {
      setError(err.message || 'Failed to create AI role.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Profile Persona', icon: Bot },
    { num: 2, label: 'System Directive', icon: ShieldCheck },
    { num: 3, label: 'Connectors Suite', icon: Zap },
    { num: 4, label: 'Model Grid', icon: Cpu },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>
            Create <span className="gradient-text-ember">AI Expert Role</span>
          </h1>
          <p className="text-xs mt-1" style={{ color: '#78716c' }}>
            Configure system prompts, expertise focus, multi-connectors, and LLM hyperparameters.
          </p>
        </div>
        <Link
          href="/roles"
          className="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.1)', color: '#78716c' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roles</span>
        </Link>
      </div>

      {/* Step Wizard */}
      <div className="p-4 rounded-3xl flex items-center justify-between" style={cardStyle}>
        {steps.map((s, idx) => {
          const IconComp = s.icon;
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <React.Fragment key={s.num}>
              <div
                onClick={() => setCurrentStep(s.num)}
                className="flex items-center gap-2.5 cursor-pointer transition-all"
                style={{ color: isCurrent ? '#fbbf24' : isDone ? '#34d399' : '#57534e', fontWeight: isCurrent || isDone ? '700' : '400' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                  style={
                    isCurrent
                      ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }
                      : isDone
                      ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.08)', color: '#57534e' }
                  }
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="hidden sm:inline text-xs">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-px mx-3 hidden sm:block" style={{ background: 'rgba(245,158,11,0.1)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-2xl text-xs font-medium" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="p-6 rounded-3xl space-y-5" style={cardStyle}>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
              <Bot className="w-4 h-4" />
              1. Role Profile & Persona
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={labelStyle}>Role Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Machine Learning Engineer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={labelStyle}>Icon Identifier</label>
                <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full py-2.5 px-3 rounded-xl text-xs focus:outline-none" style={inputStyle}>
                  <option value="Bot">Bot (Default AI)</option>
                  <option value="Zap">Zap (Ultra Fast)</option>
                  <option value="Atom">Atom (Research / Science)</option>
                  <option value="Cpu">Cpu (Software / Architecture)</option>
                  <option value="BarChart3">BarChart3 (Data Analytics)</option>
                  <option value="Scale">Scale (Legal Compliance)</option>
                  <option value="Target">Target (Marketing Strategy)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold" style={labelStyle}>Role Summary / Description</label>
              <input
                type="text"
                placeholder="Brief summary of what this specialized role accomplishes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold" style={labelStyle}>Domain Expertise Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                  style={inputStyle}
                />
                <button type="button" onClick={handleAddTag} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                  Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {expertise.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#d97706' }}>
                    <span>{tag}</span>
                    <button type="button" onClick={() => handleRemoveTag(tag)} style={{ color: '#78716c' }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="p-6 rounded-3xl space-y-4" style={cardStyle}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
                <ShieldCheck className="w-4 h-4" />
                2. System Directive & Persona Prompt
              </h2>
              <button
                type="button"
                onClick={handleAutoEnhancePrompt}
                disabled={enhancing}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}
              >
                <Wand2 className={`w-3.5 h-3.5 ${enhancing ? 'animate-spin' : ''}`} />
                <span>{enhancing ? 'Enhancing...' : '✨ AI Auto-Enhance'}</span>
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold" style={labelStyle}>System Prompt Directive *</label>
              <textarea
                rows={8}
                placeholder="Define the precise expert behavior, response methodology, and domain boundary..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                required
                className="w-full p-4 rounded-xl text-xs font-mono leading-relaxed focus:outline-none transition-all"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="p-6 rounded-3xl space-y-4" style={cardStyle}>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
              <Zap className="w-4 h-4" />
              3. Multi-Connectors Suite
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_CONNECTORS.map((c) => {
                const IconComp = c.icon;
                const isEnabled = enabledConnectors.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleConnector(c.id)}
                    className="p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3"
                    style={
                      isEnabled
                        ? { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }
                        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.06)', color: '#57534e' }
                    }
                  >
                    <div className="p-2 rounded-xl" style={isEnabled ? { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' } : { background: 'rgba(255,255,255,0.04)', color: '#44403c' }}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold" style={{ color: isEnabled ? '#fef3c7' : '#78716c' }}>{c.name}</h4>
                        {isEnabled && <Check className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />}
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: '#57534e' }}>{c.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div className="p-6 rounded-3xl space-y-5" style={cardStyle}>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
              <Cpu className="w-4 h-4" />
              4. Model Hyperparameters & Execution Engine
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={labelStyle}>Model Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProvider(val);
                    if (val === 'bedrock') setModelName('meta.llama3-8b-instruct-v1:0');
                    if (val === 'groq') setModelName('openai/gpt-oss-120b');
                    if (val === 'openrouter') setModelName('qwen/qwen-2.5-72b-instruct');
                    if (val === 'gemini' || val === 'openai_compatible') setModelName('gemini-2.5-flash');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs focus:outline-none"
                  style={inputStyle}
                >
                  <option value="bedrock">Amazon Bedrock (meta.llama3-8b-instruct-v1:0)</option>
                  <option value="groq">Groq LPU Ultra-Fast (GPT-OSS 120B / 110ms)</option>
                  <option value="gemini">Google Gemini 2.5 Flash</option>
                  <option value="openrouter">OpenRouter (Qwen 2.5 72B / Llama 3.1)</option>
                  <option value="openai_compatible">OpenAI Compatible Endpoint</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold" style={labelStyle}>Model Name</label>
                <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none" style={inputStyle} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center justify-between" style={labelStyle}>
                  <span>Temperature</span>
                  <span className="font-mono" style={{ color: '#fbbf24' }}>{temperature}</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-amber-500" />
                <div className="flex justify-between text-[10px]" style={{ color: '#57534e' }}>
                  <span>Precise (0.0)</span><span>Creative (1.0)</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center justify-between" style={labelStyle}>
                  <span>Max Tokens</span>
                  <span className="font-mono" style={{ color: '#fbbf24' }}>{maxTokens}</span>
                </label>
                <input type="range" min={256} max={8192} step={256} value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="w-full accent-amber-500" />
                <div className="flex justify-between text-[10px]" style={{ color: '#57534e' }}>
                  <span>256</span><span>8192</span>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold" style={labelStyle}>Response Style</label>
                <select value={responseStyle} onChange={(e) => setResponseStyle(e.target.value)} className="w-full py-2.5 px-3 rounded-xl text-xs focus:outline-none" style={inputStyle}>
                  <option>Analytical & Precise</option>
                  <option>Concise & Direct</option>
                  <option>Detailed & Educational</option>
                  <option>Creative & Expansive</option>
                  <option>Formal & Professional</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-1">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.1)', color: '#a8a29e' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs text-black flex items-center gap-1.5 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || !name.trim() || !systemPrompt.trim()}
              className="px-6 py-2.5 rounded-2xl font-bold text-xs text-black flex items-center gap-2 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
            >
              <span>{submitting ? 'Creating Role...' : 'Create & Save AI Expert'}</span>
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
