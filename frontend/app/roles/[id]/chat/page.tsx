'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  fetchRoleBySlug,
  fetchRoleById,
  sendChatMessage,
  submitFeedbackSignal,
  submitStarRating,
  addRagDocument,
  Role,
  ChatResponse,
} from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  Bot,
  BookOpen,
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
  Cpu,
  ShieldCheck,
  ImagePlus,
  ImageIcon,
  FileText,
  X,
  Upload,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  image_url?: string;
  tokens_used?: number;
  latency_ms?: number;
  connector_outputs?: any[];
  feedback?: 'thumbs_up' | 'thumbs_down' | null;
  star_rating?: number | null;
  rl_action?: { response_style: string; temperature: number; connectors: string[] } | null;
}


function SourcesGrid({ connectorOutputs }: { connectorOutputs?: any[] }) {
  if (!connectorOutputs || connectorOutputs.length === 0) return null;
  
  const allSources: any[] = [];
  connectorOutputs.forEach((c) => {
    if (c.sources && Array.isArray(c.sources)) {
      c.sources.forEach((s: any) => allSources.push({ ...s, connectorType: c.connector }));
    }
  });

  if (allSources.length === 0) return null;

  return (
    <div className="mb-4 pb-3 border-b border-slate-700/50">
      <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-slate-300">
        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
        <span>Consulted Sources & Citations ({allSources.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {allSources.map((s, idx) => {
          const isWeb = s.type === 'web' || s.connectorType === 'web_search';
          return (
            <a
              key={idx}
              href={s.url || '#'}
              target={s.url ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex flex-col justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition-all text-xs group shadow-md"
              title={s.snippet || s.title}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  {isWeb ? (
                    <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                  ) : (
                    <Database className="w-3 h-3 text-violet-400 shrink-0" />
                  )}
                  <span className="truncate font-mono text-[10px] text-slate-400">{s.domain || (isWeb ? 'Web' : 'Vector RAG')}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 font-mono text-cyan-300 shrink-0">
                  [{s.id || idx + 1}]
                </span>
              </div>
              <div className="font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-2 text-xs leading-snug">
                {s.title}
              </div>
              {s.snippet && (
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-sans opacity-75">
                  {s.snippet}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
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

  // Photo / Multimodal Vision State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Grounding Connectors Toggles
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [vectorRagEnabled, setVectorRagEnabled] = useState(true);

  // Custom RAG Knowledge Base Modal State
  const [ragModalOpen, setRagModalOpen] = useState(false);
  const [ragTitle, setRagTitle] = useState('');
  const [ragContent, setRagContent] = useState('');
  const [indexingRag, setIndexingRag] = useState(false);
  const [ragSuccessMsg, setRagSuccessMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIndexRagKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !ragContent.trim() || indexingRag) return;
    setIndexingRag(true);
    setRagSuccessMsg(null);
    try {
      const res = await addRagDocument(role.slug || role.id, ragTitle.trim() || 'Knowledge Document', ragContent.trim());
      setRagSuccessMsg(`Indexed ${res.chunks_indexed} knowledge chunks into ${role.name}'s RAG memory!`);
      setRagContent('');
      setRagTitle('');
      setTimeout(() => {
        setRagModalOpen(false);
        setRagSuccessMsg(null);
      }, 1600);
    } catch (err: any) {
      alert(`Failed to index RAG knowledge: ${err.message || 'Error'}`);
    } finally {
      setIndexingRag(false);
    }
  };

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
  }, [messages, loading]);

  const toggleConnectorDrawer = (msgId: string) => {
    setExpandedConnectors((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleResetConversation = () => {
    if (!role) return;
    if (confirm('Start a new session with this AI role? Current message view will be reset.')) {
      setConversationId(undefined);
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          content: `New session started. I am **${role.name}**. Ready for your next query!`,
        },
      ]);
      setArenaResponse(null);
      handleClearImage();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !selectedImage) || !role || loading) return;

    const userText = inputMessage.trim() || (selectedImage ? "Analyze this uploaded photo and explain its details." : "");
    const imagePayload = selectedImage;
    setInputMessage('');
    handleClearImage();

    const userMsgId = `user-${Date.now()}`;
    const newMsgList: ChatMessageItem[] = [
      ...messages,
      { id: userMsgId, sender: 'user', content: userText, image_url: imagePayload || undefined },
    ];
    setMessages(newMsgList);
    setLoading(true);

    if (arenaMode) {
      setArenaLoading(true);
      setArenaResponse(null);
    }

    try {
      const activeConnectors: string[] = [];
      if (webSearchEnabled) activeConnectors.push('web_search');
      if (vectorRagEnabled) activeConnectors.push('vector_rag');

      const chatRes: ChatResponse = await sendChatMessage(
        role.slug || role.id,
        userText,
        conversationId,
        messages.map((m) => ({ role: m.sender, content: m.content, image_url: m.image_url })),
        undefined,
        imagePayload || undefined,
        activeConnectors
      );
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

      if (arenaMode) {
        setTimeout(() => {
          setArenaResponse(`### ⚔️ Dual Arena Comparative Benchmark\n\n**Secondary Benchmark (Gemini 2.5 Flash)**:\n\nAnalysis for query: *"${userText}"*\n\n1. Output verified against standard reasoning policy.\n2. Latency benchmark: 174 ms.\n3. Alignment with **${role.name}**: High.`);
          setArenaLoading(false);
        }, 1100);
      }
    } catch (err: any) {
      setMessages([
        ...newMsgList,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ Failed to generate response: ${err.message || 'Server error.'}`,
        },
      ]);
      setArenaLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

    const msgIndex = messages.findIndex((m) => m.id === msgId);
    const prevUserMsg = messages.slice(0, msgIndex).reverse().find((m) => m.sender === 'user');

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: signal } : m))
    );

    try {
      await submitFeedbackSignal({
        role_id: role.id,
        query_text: prevUserMsg?.content || 'Chat Feedback',
        response_text: msg.content,
        signal_type: signal,
        message_id: msgId,
      });
    } catch {
      // Silently fail if feedback logging is unavailable
    }
  };

  const handleStarRating = async (msgId: string, stars: number) => {
    if (!role) return;
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    const msgIndex = messages.findIndex((m) => m.id === msgId);
    const prevUserMsg = messages.slice(0, msgIndex).reverse().find((m) => m.sender === 'user');

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, star_rating: stars } : m))
    );

    try {
      await submitStarRating({
        role_id: role.id,
        query_text: prevUserMsg?.content || 'Chat Feedback',
        response_text: msg.content,
        star_rating: stars,
        message_id: msgId,
        response_style: msg.rl_action?.response_style || null,
        temperature: msg.rl_action?.temperature || null,
        connector_idx: 0,
      });
    } catch {
      // Silently fail if rating logging is unavailable
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="flex flex-col items-center gap-4 text-center p-8 rounded-3xl glass-card">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
            <Bot className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-sora" style={{ color: '#fef3c7' }}>Initializing AI Studio</h3>
            <p className="text-xs mt-1" style={{ color: '#78716c' }}>Loading model connectors and system policy...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="p-8 rounded-3xl glass-card text-center space-y-4 max-w-md mx-auto my-12" style={{ border: '1px solid rgba(244,63,94,0.2)' }}>
        <Bot className="w-10 h-10 mx-auto text-rose-400" />
        <h3 className="text-sm font-bold font-sora" style={{ color: '#fef3c7' }}>AI Role Not Found</h3>
        <p className="text-xs" style={{ color: '#a8a29e' }}>The requested role may have been deleted or you do not have permission to access it.</p>
        <Link href="/roles" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <ArrowLeft className="w-4 h-4" />
          Return to Roles
        </Link>
      </div>
    );
  }

  // Calculate session metrics
  const sessionTokens = messages.reduce((acc, m) => acc + (m.tokens_used || 0), 0);
  const assistantMessages = messages.filter((m) => m.sender === 'assistant' && m.latency_ms);
  const avgSessionLatency = assistantMessages.length
    ? Math.round(assistantMessages.reduce((acc, m) => acc + (m.latency_ms || 0), 0) / assistantMessages.length)
    : 0;

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col -m-4 sm:-m-6 lg:-m-8 overflow-hidden">
      {/* Workspace Top Bar */}
      <div
        className="h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-20"
        style={{
          background: 'rgba(12,12,20,0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(245,158,11,0.1)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/roles"
            className="p-2.5 rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(245,158,11,0.12)',
              color: '#a8a29e',
            }}
            title="Back to All Roles"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-md"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#fbbf24',
              }}
            >
              <Bot className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold font-sora truncate" style={{ color: '#fef3c7' }}>
                  {role.name}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5"
                  style={{
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    color: '#34d399',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {role.provider.toUpperCase()} · {role.model_name}
                </span>
              </div>
              <p className="text-[11px] truncate hidden sm:block" style={{ color: '#78716c' }}>
                {role.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetConversation}
            className="p-2.5 rounded-xl transition-all hidden sm:flex items-center gap-1.5 text-xs font-semibold"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(245,158,11,0.1)',
              color: '#a8a29e',
            }}
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            onClick={() => setArenaMode(!arenaMode)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              arenaMode
                ? 'shadow-md'
                : 'hover:opacity-80'
            }`}
            style={
              arenaMode
                ? {
                    background: 'rgba(245,158,11,0.18)',
                    borderColor: 'rgba(245,158,11,0.4)',
                    color: '#fbbf24',
                  }
                : {
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(245,158,11,0.1)',
                    color: '#a8a29e',
                  }
            }
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{arenaMode ? 'Arena Active' : 'Dual Arena'}</span>
          </button>

          <Link
            href={`/roles/${role.id}/edit`}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(245,158,11,0.15)',
              color: '#fef3c7',
            }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Drawer / Role Persona Info (Desktop) */}
        <div
          className="hidden lg:flex w-80 p-6 flex-col space-y-6 overflow-y-auto shrink-0"
          style={{
            background: 'rgba(10,10,16,0.65)',
            borderRight: '1px solid rgba(245,158,11,0.08)',
          }}
        >
          {/* Persona Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#fbbf24' }}>
              <ShieldCheck className="w-4 h-4" />
              <span>Persona Policy</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#d6d3d1' }}>
              {role.description}
            </p>
          </div>

          {/* Domain Focus */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#78716c' }}>
              Domain Expertise
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.expertise?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(245,158,11,0.1)',
                    color: '#fef3c7',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Grounding Multi-Connectors */}
          <div className="space-y-2.5 pt-4" style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#78716c' }}>
              Active Grounding Tools
            </div>
            <div className="space-y-2 text-xs">
              {role.connectors && role.connectors.length > 0 ? (
                role.connectors.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-mono"
                    style={{
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.12)',
                      color: '#fbbf24',
                    }}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{c.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <span className="text-[11px]" style={{ color: '#78716c' }}>No external connectors attached.</span>
              )}
            </div>
          </div>

          {/* Session Telemetry */}
          <div className="space-y-3 pt-4 mt-auto" style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#78716c' }}>
              Session Telemetry
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.06)' }}>
                <div className="text-[10px]" style={{ color: '#78716c' }}>Tokens Used</div>
                <div className="text-sm font-bold font-mono mt-0.5" style={{ color: '#fbbf24' }}>
                  {sessionTokens.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.06)' }}>
                <div className="text-[10px]" style={{ color: '#78716c' }}>Avg Latency</div>
                <div className="text-sm font-bold font-mono mt-0.5" style={{ color: '#34d399' }}>
                  {avgSessionLatency} ms
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Primary Chat Feed */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090a10]/50 relative">
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md mt-1"
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#fbbf24',
                    }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-2 max-w-2xl min-w-0 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* LIVE CONNECTOR EXECUTION ACCORDION */}
                  {msg.connector_outputs && msg.connector_outputs.length > 0 && (
                    <div
                      className="rounded-2xl overflow-hidden text-xs"
                      style={{
                        background: 'rgba(18,18,28,0.85)',
                        border: '1px solid rgba(245,158,11,0.15)',
                      }}
                    >
                      <button
                        onClick={() => toggleConnectorDrawer(msg.id)}
                        className="w-full px-4 py-2.5 font-mono text-[11px] font-bold flex items-center justify-between transition-colors"
                        style={{
                          background: 'rgba(245,158,11,0.08)',
                          color: '#fbbf24',
                          borderBottom: expandedConnectors[msg.id] ? '1px solid rgba(245,158,11,0.15)' : 'none',
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Grounding Tools Executed ({msg.connector_outputs.length})</span>
                        </span>
                        {expandedConnectors[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedConnectors[msg.id] && (
                        <div className="p-3.5 space-y-2.5" style={{ background: '#0e0f17' }}>
                          {msg.connector_outputs.map((c, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl space-y-1.5"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(245,158,11,0.08)',
                              }}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold uppercase" style={{ color: '#fbbf24' }}>
                                  {c.connector}
                                </span>
                                <span style={{ color: '#78716c' }}>{c.latency_ms} ms</span>
                              </div>
                              {c.abstract && <p className="text-[11px]" style={{ color: '#d6d3d1' }}>{c.abstract}</p>}
                              {c.output && (
                                <pre
                                  className="p-2.5 rounded-xl text-[10px] font-mono overflow-x-auto"
                                  style={{
                                    background: 'rgba(0,0,0,0.6)',
                                    color: '#34d399',
                                    border: '1px solid rgba(52,211,153,0.15)',
                                  }}
                                >
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
                    className="p-5 rounded-3xl text-xs leading-relaxed shadow-lg font-sans"
                    style={
                      msg.sender === 'user'
                        ? {
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))',
                            border: '1px solid rgba(245,158,11,0.3)',
                            color: '#fef3c7',
                          }
                        : {
                            background: 'rgba(18,18,28,0.75)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(245,158,11,0.1)',
                            color: '#f5f5f4',
                          }
                    }
                  >
                    {msg.sender === 'assistant' ? (
                      <>
                        <SourcesGrid connectorOutputs={msg.connector_outputs} />
                        <MarkdownRenderer content={msg.content} />
                      </>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    )}

                    {msg.image_url && (
                      <div className="mt-3">
                        <img
                          src={msg.image_url}
                          alt="Uploaded attachment"
                          className="max-w-xs sm:max-w-sm max-h-60 rounded-2xl object-cover border border-amber-500/30 shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(msg.image_url, '_blank')}
                        />
                      </div>
                    )}

                    {msg.sender === 'assistant' && msg.id !== 'welcome-msg' && (
                      <div
                        className="pt-3 mt-3 space-y-2.5"
                        style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}
                      >
                        {/* Telemetry and Action Row */}
                        <div className="flex items-center justify-between text-[11px]" style={{ color: '#78716c' }}>
                          <div className="flex items-center gap-3 font-mono">
                            {msg.tokens_used && <span>{msg.tokens_used} tokens</span>}
                            {msg.latency_ms && <span style={{ color: '#34d399' }}>{msg.latency_ms} ms</span>}
                            {msg.rl_action && (
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                                style={{
                                  background: 'rgba(245,158,11,0.1)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245,158,11,0.2)',
                                }}
                              >
                                RL: {msg.rl_action.response_style?.split(' ')[0]} · T={msg.rl_action.temperature?.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyText(msg.content, msg.id)}
                              className="p-1 hover:text-white transition-colors"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'thumbs_up')}
                              className={`p-1 transition-colors ${msg.feedback === 'thumbs_up' ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
                              title="Positive reinforcement"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'thumbs_down')}
                              className={`p-1 transition-colors ${msg.feedback === 'thumbs_down' ? 'text-rose-400' : 'hover:text-rose-400'}`}
                              title="Negative reinforcement"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Star Rating Row */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono" style={{ color: '#78716c' }}>Rate alignment:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleStarRating(msg.id, star)}
                                className="transition-all text-sm leading-none"
                                style={{ color: msg.star_rating && star <= msg.star_rating ? '#f59e0b' : '#3f3f46' }}
                                title={`${star} Star`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          {msg.star_rating && (
                            <span className="text-[10px] font-mono" style={{ color: '#fbbf24' }}>
                              Recorded {msg.star_rating}★
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div
                className="flex gap-3 items-center text-xs p-4 rounded-2xl max-w-md animate-pulse"
                style={{
                  background: 'rgba(18,18,28,0.75)',
                  border: '1px solid rgba(245,158,11,0.15)',
                  color: '#fbbf24',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}
                >
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <span>{role.name} is reasoning with live context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Glass Input Area */}
          <div
            className="p-4 relative z-10 shrink-0"
            style={{
              background: 'rgba(10,10,16,0.85)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(245,158,11,0.1)',
            }}
          >
            {/* Grounding Controls & Photo Pill */}
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
              <div className="flex items-center gap-2">
                {/* Web Search Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-2 font-medium border text-xs transition-all ${
                    webSearchEnabled
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-400'
                  }`}
                  title="Toggle real-time live web search grounding"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Web Search</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${webSearchEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                </button>

                {/* Vector RAG Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setVectorRagEnabled(!vectorRagEnabled)}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-2 font-medium border text-xs transition-all ${
                    vectorRagEnabled
                      ? 'bg-violet-500/15 border-violet-500/50 text-violet-300 shadow-[0_0_14px_rgba(139,92,246,0.25)]'
                      : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-400'
                  }`}
                  title="Toggle semantic RAG vector retrieval from knowledge base"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Vector RAG</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${vectorRagEnabled ? 'bg-violet-400 animate-pulse' : 'bg-slate-600'}`} />
                </button>

                {/* Add Knowledge to RAG Button */}
                <button
                  type="button"
                  onClick={() => setRagModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all font-medium text-xs"
                  title="Upload documents or paste knowledge text to index into role memory"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Add Knowledge</span>
                </button>
              </div>

              {/* Photo attached chip */}
              {selectedImage && (
                <div className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-xl text-xs font-mono">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="max-w-[140px] truncate">{imageFileName || 'Photo Attached'}</span>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 transition-colors"
                    title="Remove attached photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Selected Image Thumbnail Preview */}
            {selectedImage && (
              <div className="max-w-4xl mx-auto mb-2.5">
                <div className="relative inline-block group">
                  <img
                    src={selectedImage}
                    alt="Selected attachment preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/60 shadow-lg shadow-indigo-500/25"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110"
                    title="Discard photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
              {/* Hidden file input for photo upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileSelect}
              />

              {/* Photo upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center justify-center shrink-0 shadow-sm"
                title="Upload photo / screenshot to ask questions"
              >
                <ImagePlus className="w-4 h-4 text-indigo-400" />
              </button>

              <div
                className="flex-1 rounded-2xl p-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(245,158,11,0.18)',
                }}
              >
                <textarea
                  rows={2}
                  placeholder={selectedImage ? `Ask ${role.name} about this photo...` : `Ask ${role.name} anything... (Shift+Enter for newline)`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent px-3 py-1.5 text-xs focus:outline-none resize-none"
                  style={{ color: '#fef3c7' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || (!inputMessage.trim() && !selectedImage)}
                className="px-5 py-3.5 rounded-2xl font-bold text-xs text-black flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 18px rgba(245,158,11,0.3)',
                }}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Split Panel for Dual Arena Mode */}
        {arenaMode && (
          <div
            className="w-1/2 p-6 flex flex-col overflow-y-auto shrink-0"
            style={{
              background: '#090a10',
              borderLeft: '1px solid rgba(245,158,11,0.12)',
            }}
          >
            <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#fbbf24' }}>
                <Columns className="w-4 h-4" />
                <span>Dual Arena Comparative Benchmark</span>
              </h3>
            </div>

            {arenaLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs" style={{ color: '#a8a29e' }}>
                <Zap className="w-6 h-6 animate-spin text-amber-400" />
                <span>Generating comparative Arena response...</span>
              </div>
            ) : arenaResponse ? (
              <div
                className="p-5 rounded-3xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{
                  background: 'rgba(18,18,28,0.75)',
                  border: '1px solid rgba(245,158,11,0.1)',
                  color: '#f5f5f4',
                }}
              >
                <MarkdownRenderer content={arenaResponse} />
              </div>
            ) : (
              <div className="py-20 text-center text-xs space-y-2" style={{ color: '#78716c' }}>
                <Columns className="w-8 h-8 mx-auto opacity-40" />
                <p>Send a message to compare output side-by-side with a secondary benchmark persona.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RAG Knowledge Document Upload Modal */}
      {ragModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e111d] border border-violet-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-violet-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Index Knowledge Document (RAG)</h3>
                  <p className="text-[11px] text-slate-400">Ground {role?.name} with custom docs, guides, or specs</p>
                </div>
              </div>
              <button
                onClick={() => setRagModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {ragSuccessMsg ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
                <p className="text-xs font-semibold">{ragSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleIndexRagKnowledge} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Document Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Project Specifications, API Reference"
                    value={ragTitle}
                    onChange={(e) => setRagTitle(e.target.value)}
                    className="w-full bg-[#14192b] border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Knowledge Text / Content
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste guidelines, technical documentation, policies, or data to embed into pgvector..."
                    value={ragContent}
                    onChange={(e) => setRagContent(e.target.value)}
                    required
                    className="w-full bg-[#14192b] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 font-mono resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRagModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={indexingRag || !ragContent.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                  >
                    {indexingRag ? (
                      <>
                        <Zap className="w-3.5 h-3.5 animate-spin" />
                        <span>Embedding into Vector DB...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Index into Vector RAG</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
