'use client';

import React from 'react';
import Link from 'next/link';
import { Role } from '@/lib/api';
import { IconRenderer } from './IconRenderer';
import { MessageSquare, Edit3, Trash2, Cpu, Copy, ShieldCheck, Sparkles } from 'lucide-react';

interface RoleCardProps {
  role: Role;
  onDelete?: (id: string) => void;
  onDuplicate?: (role: Role) => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, onDelete, onDuplicate }) => {
  const isSystemRole = !(role as any).user_id;

  return (
    <div className="relative group rounded-2xl bg-gradient-to-b from-[#14141e]/90 to-[#0d0d14]/90 border border-white/[0.08] hover:border-amber-500/40 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-28 h-28 rounded-full bg-amber-500/5 group-hover:bg-amber-500/15 blur-2xl transition-all duration-500 pointer-events-none" />

      <div>
        {/* Header: Icon, Name, and Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/25 text-amber-400 group-hover:scale-105 transition-transform duration-300 shadow-md">
              <IconRenderer name={role.icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-stone-100 group-hover:text-amber-300 transition-colors tracking-tight">
                  {role.name}
                </h3>
                {isSystemRole && (
                  <span title="Official System Template" className="inline-flex text-amber-400/80">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-amber-500" />
                  {role.model_name}
                </span>
                <span className="text-stone-600">•</span>
                <span className="text-[10px] text-stone-400 font-medium capitalize">{role.provider}</span>
              </div>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
              role.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-white/[0.04] text-stone-400 border-white/[0.08]'
            }`}
          >
            {role.status}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-stone-400 line-clamp-2 leading-relaxed">
          {role.description}
        </p>

        {/* Expertise Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {role.expertise?.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white/[0.04] text-stone-300 border border-white/[0.06] group-hover:border-amber-500/20 transition-colors"
            >
              {tag}
            </span>
          ))}
          {role.expertise && role.expertise.length > 4 && (
            <span className="px-1.5 py-0.5 text-[10px] text-stone-500 font-medium">
              +{role.expertise.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <Link
          href={`/roles/${role.id || role.slug}/chat`}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-transparent border border-amber-500/30 text-amber-300 hover:from-amber-500 hover:to-amber-600 hover:text-black transition-all duration-200 shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Launch Workspace</span>
        </Link>

        <div className="flex items-center gap-0.5">
          <Link
            href={`/roles/${role.id || role.slug}/edit`}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Edit Role Settings"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(role)}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Duplicate into My Roles"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && !isSystemRole && (
            <button
              onClick={() => onDelete(role.id)}
              className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Role"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
