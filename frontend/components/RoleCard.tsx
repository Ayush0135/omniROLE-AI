'use client';

import React from 'react';
import Link from 'next/link';
import { Role } from '@/lib/api';
import { IconRenderer } from './IconRenderer';
import { MessageSquare, Edit3, Trash2, Cpu, Copy, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface RoleCardProps {
  role: Role;
  onDelete?: (id: string) => void;
  onDuplicate?: (role: Role) => void;
}

const providerThemes: Record<string, { badge: string; border: string; glow: string; text: string; dot: string }> = {
  groq: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'hover:border-amber-500/40',
    glow: 'from-amber-500/10 to-transparent',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  gemini: {
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    border: 'hover:border-cyan-500/40',
    glow: 'from-cyan-500/10 to-transparent',
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
  },
  openrouter: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    border: 'hover:border-purple-500/40',
    glow: 'from-purple-500/10 to-transparent',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
  },
  bedrock: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    border: 'hover:border-blue-500/40',
    glow: 'from-blue-500/10 to-transparent',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  default: {
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    border: 'hover:border-indigo-500/40',
    glow: 'from-indigo-500/10 to-transparent',
    text: 'text-indigo-400',
    dot: 'bg-indigo-400',
  },
};

export const RoleCard: React.FC<RoleCardProps> = ({ role, onDelete, onDuplicate }) => {
  const isSystemRole = !(role as any).user_id;
  const theme = providerThemes[role.provider?.toLowerCase()] ?? providerThemes.default;

  return (
    <div className={`relative group cyber-card p-6 flex flex-col justify-between transition-all duration-300 ${theme.border}`}>
      {/* Top ambient radial gradient */}
      <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${theme.glow} rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity`} />

      <div>
        {/* Header: Icon + Name + Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 group-hover:border-indigo-400/50 transition-all duration-300 shadow-lg">
              <IconRenderer name={role.icon} className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  {role.name}
                </h3>
                {isSystemRole && (
                  <span title="Official System Template" className="inline-flex">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  </span>
                )}
              </div>

              {/* Provider pill */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${theme.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                  {role.provider?.toUpperCase()} · {role.model_name}
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <span
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider ${
              role.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]'
            }`}
          >
            {role.status}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs text-slate-300/80 leading-relaxed line-clamp-2">
          {role.description}
        </p>

        {/* Expertise Tags */}
        {role.expertise && role.expertise.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {role.expertise.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 text-[10px] font-medium rounded-lg bg-white/[0.03] text-slate-300 border border-white/[0.08] group-hover:border-indigo-500/30 transition-colors"
              >
                {tag}
              </span>
            ))}
            {role.expertise.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-medium">
                +{role.expertise.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2.5">
        <Link
          href={`/roles/${role.id || role.slug}/chat`}
          className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 btn-cyber-primary group/btn"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Launch Persona</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href={`/roles/${role.id || role.slug}/edit`}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.1] transition-all"
            title="Edit Persona"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(role)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.1] transition-all"
              title="Duplicate to My Roles"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && !isSystemRole && (
            <button
              onClick={() => onDelete(role.id)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              title="Delete Persona"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
