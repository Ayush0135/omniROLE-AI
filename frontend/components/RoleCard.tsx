'use client';

import React from 'react';
import Link from 'next/link';
import { Role } from '@/lib/api';
import { IconRenderer } from './IconRenderer';
import { MessageSquare, Edit3, Trash2, Cpu, Copy, ShieldCheck, Zap } from 'lucide-react';

interface RoleCardProps {
  role: Role;
  onDelete?: (id: string) => void;
  onDuplicate?: (role: Role) => void;
}

const providerColors: Record<string, { bg: string; text: string; dot: string }> = {
  groq:       { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', dot: '#f59e0b' },
  gemini:     { bg: 'rgba(52,211,153,0.10)',  text: '#34d399', dot: '#10b981' },
  openrouter: { bg: 'rgba(167,139,250,0.10)', text: '#a78bfa', dot: '#8b5cf6' },
  bedrock:    { bg: 'rgba(96,165,250,0.10)',  text: '#60a5fa', dot: '#3b82f6' },
  openai:     { bg: 'rgba(52,211,153,0.10)',  text: '#34d399', dot: '#10b981' },
};

export const RoleCard: React.FC<RoleCardProps> = ({ role, onDelete, onDuplicate }) => {
  const isSystemRole = !(role as any).user_id;
  const pc = providerColors[role.provider?.toLowerCase()] ?? {
    bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', dot: '#f59e0b',
  };

  return (
    <div
      className="relative group rounded-2xl flex flex-col justify-between shine-hover transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: 'linear-gradient(160deg, rgba(20,20,32,0.95) 0%, rgba(12,12,20,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 16px rgba(12,12,20,0.5)',
        padding: '20px',
      }}
    >
      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'transparent',
          border: '1px solid rgba(245,158,11,0.35)',
          boxShadow: '0 0 32px rgba(245,158,11,0.08)',
        }}
      />

      {/* Corner ambient glow */}
      <div
        className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full transition-all duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${pc.dot}12 0%, transparent 70%)`,
          opacity: 0.7,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Role icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300"
              style={{
                background: `linear-gradient(135deg, ${pc.dot}25, ${pc.dot}10)`,
                border: `1px solid ${pc.dot}35`,
                color: pc.text,
                boxShadow: `0 4px 12px ${pc.dot}20`,
              }}
            >
              <IconRenderer name={role.icon} className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3
                  className="font-bold text-sm tracking-tight transition-colors duration-200 group-hover:text-amber-300"
                  style={{ color: '#e7e5e4' }}
                >
                  {role.name}
                </h3>
                {isSystemRole && (
                  <span title="Official System Template" className="inline-flex">
                    <ShieldCheck
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: '#fbbf24', opacity: 0.75 }}
                    />
                  </span>
                )}
              </div>
              {/* Provider pill */}
              <span
                className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold font-mono"
                style={{ background: pc.bg, color: pc.text }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: pc.dot }}
                />
                {role.provider?.toUpperCase() || 'AI'} · {role.model_name}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <span
            className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0"
            style={
              role.status === 'active'
                ? {
                    background: 'rgba(52,211,153,0.10)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    color: '#34d399',
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#78716c',
                  }
            }
          >
            {role.status}
          </span>
        </div>

        {/* Description */}
        <p
          className="mt-3 text-xs leading-relaxed line-clamp-2"
          style={{ color: '#a8a29e' }}
        >
          {role.description}
        </p>

        {/* Expertise Tags */}
        {role.expertise && role.expertise.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {role.expertise.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[10px] font-medium rounded-lg transition-colors duration-200 group-hover:border-amber-500/20"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#a8a29e',
                }}
              >
                {tag}
              </span>
            ))}
            {role.expertise.length > 4 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-medium"
                style={{ color: '#57534e' }}
              >
                +{role.expertise.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        className="relative z-10 mt-5 pt-3.5 flex items-center justify-between gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link
          href={`/roles/${role.id || role.slug}/chat`}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 group/btn"
          style={{
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#fbbf24',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              'linear-gradient(135deg, #f59e0b, #d97706)';
            (e.currentTarget as HTMLElement).style.color = '#000';
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 20px rgba(245,158,11,0.35)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.10)';
            (e.currentTarget as HTMLElement).style.color = '#fbbf24';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.25)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Launch Workspace</span>
        </Link>

        <div className="flex items-center gap-0.5">
          <Link
            href={`/roles/${role.id || role.slug}/edit`}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#78716c' }}
            title="Edit Role"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#e7e5e4';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#78716c';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(role)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#78716c' }}
              title="Duplicate into My Roles"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#e7e5e4';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#78716c';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && !isSystemRole && (
            <button
              onClick={() => onDelete(role.id)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#78716c' }}
              title="Delete Role"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#f87171';
                (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.10)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#78716c';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
