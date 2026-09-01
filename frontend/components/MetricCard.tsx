import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'positive',
}) => {
  return (
    <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#78716c' }}>{title}</span>
        <div className="p-2.5 rounded-2xl group-hover:scale-105 transition-transform duration-200" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="text-3xl font-black tracking-tight font-sora" style={{ color: '#fef3c7' }}>{value}</span>
        {trend && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trendType === 'positive'
                ? 'text-emerald-400'
                : trendType === 'negative'
                ? 'text-rose-400'
                : 'text-stone-400'
            }`}
            style={{ background: trendType === 'positive' ? 'rgba(52,211,153,0.1)' : trendType === 'negative' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.05)', border: trendType === 'positive' ? '1px solid rgba(52,211,153,0.2)' : trendType === 'negative' ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(255,255,255,0.08)' }}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs font-medium" style={{ color: '#78716c' }}>{subtitle}</p>}
    </div>
  );
};
