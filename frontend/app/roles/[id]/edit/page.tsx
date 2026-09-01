'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { fetchRoleById, updateRole, Role } from '@/lib/api';
import { IconRenderer } from '@/components/IconRenderer';
import { Bot, ArrowLeft, X, Cpu, Layers, Sparkles } from 'lucide-react';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Atom');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [provider, setProvider] = useState('mock');
  const [modelName, setModelName] = useState('qwen-2.5-72b-instruct');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [responseStyle, setResponseStyle] = useState('Analytical & Precise');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [status, setStatus] = useState('active');

  const availableIcons = ['Atom', 'Cpu', 'BarChart3', 'Scale', 'Target', 'Brain', 'Sparkles', 'ShieldCheck', 'Database', 'FileText', 'Bot'];

  useEffect(() => {
    if (roleId) {
      fetchRoleById(roleId)
        .then((role) => {
          setName(role.name);
          setDescription(role.description);
          setIcon(role.icon || 'Atom');
          setSystemPrompt(role.system_prompt);
          setExpertise(role.expertise || []);
          setProvider(role.provider || 'mock');
          setModelName(role.model_name || 'qwen-2.5-72b-instruct');
          setTemperature(role.temperature);
          setMaxTokens(role.max_tokens);
          setResponseStyle(role.response_style);
          setMemoryEnabled(role.memory_enabled);
          setStatus(role.status);
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [roleId]);

  const handleAddTag = () => {
    if (tagInput.trim() && !expertise.includes(tagInput.trim())) {
      setExpertise([...expertise, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setExpertise(expertise.filter((t) => t !== tag));
  };

  const handleUpdate = async () => {
    if (!name.trim()) return setErrorMsg('Role Name is required.');
    setSubmitting(true);
    setErrorMsg('');

    try {
      await updateRole(roleId, {
        name,
        description,
        icon,
        system_prompt: systemPrompt,
        expertise,
        provider,
        model_name: modelName,
        temperature: Number(temperature),
        max_tokens: Number(maxTokens),
        response_style: responseStyle,
        memory_enabled: memoryEnabled,
        status,
      });
      router.push('/roles');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-zinc-400">Loading AI Role details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/roles"
            className="p-2 rounded-xl bg-[#141418] hover:bg-[#1f1f26] border border-[#27272a] text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Edit AI Expert: {name}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Modify system prompt, expertise tags, or parameters.</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Role Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Role Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Icon Avatar</label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <IconRenderer name={icon} className="w-5 h-5" />
                </div>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-200 focus:outline-none"
                >
                  {availableIcons.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            System Instructions
          </h2>
          <textarea
            rows={6}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 font-mono focus:outline-none"
          />
        </div>

        <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Expertise & Domain Tags
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 text-xs font-semibold"
            >
              Add Tag
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {expertise.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-lg bg-[#1c1c22] border border-[#2c2c34] text-xs text-zinc-200 flex items-center gap-1.5">
                <span>{tag}</span>
                <button onClick={() => handleRemoveTag(tag)} className="text-zinc-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
        <button
          type="button"
          disabled={submitting}
          onClick={async () => {
            if (confirm('Are you sure you want to permanently delete this AI Role?')) {
              setSubmitting(true);
              try {
                const { deleteRole } = await import('@/lib/api');
                await deleteRole(roleId);
                router.push('/roles');
              } catch (err: any) {
                alert('Failed to delete role: ' + err.message);
                setSubmitting(false);
              }
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors"
        >
          Delete AI Role
        </button>

        <div className="flex items-center gap-3">
          <Link href="/roles" className="px-5 py-2.5 rounded-xl bg-[#141418] text-zinc-400 text-xs font-semibold">
            Cancel
          </Link>
          <button
            type="button"
            disabled={submitting}
            onClick={handleUpdate}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg"
          >
            {submitting ? 'Saving Changes...' : 'Update AI Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
