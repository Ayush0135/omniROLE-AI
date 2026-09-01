'use client';

import React from 'react';
import Link from 'next/link';
import { Role } from '@/lib/api';
import { IconRenderer } from './IconRenderer';
import { MessageSquare, Edit3, Trash2, Cpu, Copy } from 'lucide-react';

interface RoleCardProps {
  role: Role;
  onDelete?: (id: string) => void;
  onDuplicate?: (role: Role) => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, onDelete, onDuplicate }) => {
  return (
    <div className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between group relative overflow-hidden">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-md"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.15))', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}
            >
              <IconRenderer name={role.icon} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base font-sora group-hover:text-amber-300 transition-colors" style={{ color: '#fef3c7' }}>
                {role.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: '#a8a29e' }}>
                  <Cpu className="w-3 h-3" style={{ color: '#f59e0b' }} />
                  {role.model_name}
                </span>
                <span style={{ color: '#44403c' }}>•</span>
                <span className="text-[11px] font-medium" style={{ color: '#78716c' }}>{role.response_style}</span>
              </div>
            </div>
          </div>
          <span
            className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider"
            style={
              role.status === 'active'
                ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }
                : { background: 'rgba(255,255,255,0.03)', color: '#78716c', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {role.status}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs line-clamp-2 leading-relaxed" style={{ color: '#a8a29e' }}>{role.description}</p>

        {/* Expertise Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {role.expertise?.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 text-[10px] font-semibold rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#d97706' }}
            >
              {tag}
            </span>
          ))}
          {role.expertise && role.expertise.length > 4 && (
            <span className="px-2 py-0.5 text-[10px] font-medium" style={{ color: '#78716c' }}>
              +{role.expertise.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(245,158,11,0.1)' }}>
        <Link
          href={`/roles/${role.id || role.slug}/chat`}
          className="flex-1 mr-2 py-2.5 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Launch Workspace</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href={`/roles/${role.id || role.slug}/edit`}
            className="p-2.5 rounded-xl transition-colors"
            style={{ color: '#78716c' }}
            title="Edit Role"
          >
            <Edit3 className="w-4 h-4 hover:text-amber-300" />
          </Link>
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(role)}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: '#78716c' }}
              title="Duplicate Role"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(role.id)}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: '#78716c' }}
              title="Delete Role"
            >
              <Trash2 className="w-4 h-4 hover:text-rose-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
