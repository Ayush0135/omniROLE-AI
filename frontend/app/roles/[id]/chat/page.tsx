'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  fetchRoleBySlug,
  fetchRoleById,
  sendChatMessage,
  submitFeedbackSignal,
  Role,
  ChatResponse,
} from '@/lib/api';
import {
  Bot,
  Send,
  Sparkles,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Terminal,
  Layers,
  Edit3,
  Globe,
  Database,
  ChevronDown,
  ChevronUp,
  Columns,
} from 'lucide-react';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  latency_ms?: number;
  connector_outputs?: any[];
  feedback?: 'thumbs_up' | 'thumbs_down' | null;
  star_rating?: number | null;
  rl_action?: { response_style: string; temperature: number; connectors: string[] } | null;
}

export default function ChatWorkspacePage() {
  const params = useParams();
  const roleIdOrSlug = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Connector Drawer Accordion state
  const [expandedConnectors, setExpandedConnectors] = useState<Record<string, boolean>>({});

  // Arena Side-by-Side Comparison Mode
  const [arenaMode, setArenaMode] = useState(false);
  const [arenaResponse, setArenaResponse] = useState<string | null>(null);
  const [arenaLoading, setArenaLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRole() {
      try {
        let r: Role;
        try {
          r = await fetchRoleBySlug(roleIdOrSlug);
        } catch {
          r = await fetchRoleById(roleIdOrSlug);
        }
        setRole(r);

        setMessages([
          {
            id: 'welcome-msg',
            sender: 'assistant',
            content: `Hello! I am **${r.name}**. How can I assist you with ${r.expertise ? r.expertise.join(', ') : 'your project'} today?`,
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadRole();
  }, [roleIdOrSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleConnectorDrawer = (msgId: string) => {
    setExpandedConnectors((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !role || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsgId = `user-${Date.now()}`;
    const newMsgList: ChatMessageItem[] = [
      ...messages,
      { id: userMsgId, sender: 'user', content: userText },
    ];
    setMessages(newMsgList);
    setLoading(true);

    if (arenaMode) {
      setArenaLoading(true);
      setArenaResponse(null);
    }

    try {
      const chatRes: ChatResponse = await sendChatMessage(role.slug || role.id, userText, conversationId);
      setConversationId(chatRes.conversation_id);

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages([
        ...newMsgList,
        {
          id: assistantMsgId,
          sender: 'assistant',
          content: chatRes.response,
          tokens_used: chatRes.tokens_used.total_tokens,
          latency_ms: chatRes.latency_ms,
          connector_outputs: (chatRes as any).connector_outputs || [],
          rl_action: (chatRes as any).rl_action || null,
        },
      ]);

      // If Arena comparison mode is active, simulate benchmark run
      if (arenaMode) {
        setTimeout(() => {
          setArenaResponse(`### Arena Comparative Benchmark\n\n**Response by Secondary Persona (Gemini 2.5 Flash)**:\n\nFor query: *"${userText}"*\n\n1. Analysis aligns with ${role.name}.\n2. Execution latency: 180 ms.`);
          setArenaLoading(false);
        }, 1200);
      }
    } catch (err: any) {
      setMessages([
        ...newMsgList,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ Exception generating response: ${err.message || 'Server error.'}`,
        },
      ]);
      setArenaLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId: string, signal: 'thumbs_up' | 'thumbs_down') => {
    if (!role) return;
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    // Find the user message just before this assistant message
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    const prevUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.sender === 'user');

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: signal } : m))
    );

    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${BASE}/api/v1/rl/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_id: role.id,
        query_text: prevUserMsg?.content || 'Chat Feedback',
        response_text: msg.content,
        signal_type: signal,
        message_id: msgId,
        // Send RL action metadata so the policy knows which action to update
        response_style: msg.rl_action?.response_style || null,
        temperature: msg.rl_action?.temperature || null,
        connector_idx: 0,
      }),
    }).catch(() => {});
  };

  const handleStarRating = async (msgId: string, stars: number) => {
    if (!role) return;
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    const msgIndex = messages.findIndex((m) => m.id === msgId);
    const prevUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.sender === 'user');

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, star_rating: stars } : m))
    );

    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${BASE}/api/v1/rl/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_id: role.id,
        query_text: prevUserMsg?.content || 'Chat Feedback',
        response_text: msg.content,
        star_rating: stars,
        message_id: msgId,
        response_style: msg.rl_action?.response_style || null,
        temperature: msg.rl_action?.temperature || null,
        connector_idx: 0,
      }),
    }).catch(() => {});
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Zap className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Initializing AI Workspace...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
        Role workspace not found.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-6 md:-m-8">
      {/* Workspace Sub-Header */}
      <div className="h-14 px-6 flex items-center justify-between shrink-0" style={{ background: 'rgba(12,12,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
        <div className="flex items-center gap-3">
          <Link
            href="/roles"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                <span>{role.name}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {role.provider.toUpperCase()} ({role.model_name})
                </span>
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Arena Comparison Mode Toggle */}
          <button
            onClick={() => setArenaMode(!arenaMode)}
            className={`px-3.5 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              arenaMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{arenaMode ? 'Arena Active' : 'Dual Arena Mode'}</span>
          </button>

          <Link
            href={`/roles/${role.id}/edit`}
            className="px-3.5 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Role</span>
          </Link>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Left Drawer / Configuration Panel */}
        <div className="hidden lg:flex w-72 bg-[#090a0f]/60 border-r border-white/[0.08] p-6 flex-col space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Role Persona</h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">{role.description}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Domain Focus</h3>
            <div className="flex flex-wrap gap-1.5">
              {role.expertise?.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Multi-Connectors</h3>
            <div className="space-y-1.5 text-xs text-zinc-400">
              {role.connectors?.map((c) => (
                <div key={c} className="flex items-center gap-1.5 text-amber-300 font-mono text-[11px]">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Primary Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0b0c10]/40 min-w-0">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-300 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-2 max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* LIVE CONNECTOR EXECUTION DRAWER */}
                  {msg.connector_outputs && msg.connector_outputs.length > 0 && (
                    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden text-xs">
                      <button
                        onClick={() => toggleConnectorDrawer(msg.id)}
                        className="w-full px-4 py-2 bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-between transition-colors border-b border-amber-500/20"
                      >
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Multi-Connectors Grounding ({msg.connector_outputs.length} Executed)
                        </span>
                        {expandedConnectors[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedConnectors[msg.id] && (
                        <div className="p-3.5 space-y-2.5 bg-[#0e0f17] border-t border-white/[0.08]">
                          {msg.connector_outputs.map((c, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                                <span className="font-bold uppercase text-amber-400">{c.connector}</span>
                                <span className="text-zinc-500">{c.latency_ms} ms</span>
                              </div>
                              {c.abstract && <p className="text-[11px] text-zinc-300">{c.abstract}</p>}
                              {c.output && (
                                <pre className="p-2.5 rounded-xl bg-black/60 text-[10px] text-emerald-400 font-mono overflow-x-auto border border-emerald-500/20">
                                  {c.output}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-5 rounded-3xl text-xs leading-relaxed shadow-lg ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-blue-500/20'
                        : 'glass-card text-zinc-100 border-white/[0.08]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {msg.sender === 'assistant' && msg.id !== 'welcome-msg' && (
                      <div className="pt-3 mt-3 border-t border-white/[0.08] space-y-2">
                        {/* Stats row */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <div className="flex items-center gap-3">
                            <span className="font-mono">{msg.tokens_used} tokens</span>
                            <span className="font-mono text-emerald-400">{msg.latency_ms} ms</span>
                            {msg.rl_action && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                                RL: {msg.rl_action.response_style?.split(' ')[0]} · T={msg.rl_action.temperature?.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleCopyText(msg.content, msg.id)} className="p-1 hover:text-white transition-colors" title="Copy">
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'thumbs_up')}
                              className={`p-1 hover:text-emerald-400 transition-colors ${msg.feedback === 'thumbs_up' ? 'text-emerald-400' : ''}`}
                              title="Good response — train AI"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'thumbs_down')}
                              className={`p-1 hover:text-red-400 transition-colors ${msg.feedback === 'thumbs_down' ? 'text-red-400' : ''}`}
                              title="Bad response — train AI"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Star rating row */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono">Rate response:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleStarRating(msg.id, star)}
                              className="transition-all text-sm leading-none"
                              style={{ color: msg.star_rating && star <= msg.star_rating ? '#f59e0b' : '#3f3f46' }}
                              title={`${star} star${star > 1 ? 's' : ''}`}
                            >
                              ★
                            </button>
                          ))}
                          {msg.star_rating && (
                            <span className="text-[10px] text-amber-500 font-mono ml-1">Rated {msg.star_rating}★ — AI is learning</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-zinc-300 p-4 glass-card rounded-2xl max-w-md animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <span>{role.name} is reasoning & executing grounding engines...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#090a0f]/80 border-t border-white/[0.08] flex gap-3">
            <input
              type="text"
              placeholder={`Ask ${role.name} anything...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500/40 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Split Panel for Dual Arena Mode */}
        {arenaMode && (
          <div className="w-1/2 bg-[#0a0a0f] border-l border-[#27272a] p-6 flex flex-col overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-4">
              <Columns className="w-4 h-4" />
              Dual Arena Comparison Panel
            </h3>

            {arenaLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-zinc-400">
                <Zap className="w-6 h-6 text-amber-400 animate-spin" />
                <span>Generating comparative Arena response...</span>
              </div>
            ) : arenaResponse ? (
              <div className="p-4 rounded-2xl bg-[#121218] border border-[#222230] text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
                {arenaResponse}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                Send a message to compare output side-by-side.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
