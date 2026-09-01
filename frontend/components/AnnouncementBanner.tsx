'use client';

import React, { useEffect, useState } from 'react';
import { getAdminAnnouncements, Announcement } from '@/lib/api';
import { Sparkles, X, ExternalLink } from 'lucide-react';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    getAdminAnnouncements()
      .then((data) => {
        const active = data.filter((a) => a.is_active);
        setAnnouncements(active);
      })
      .catch(() => {});
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[0];

  return (
    <div className="bg-gradient-to-r from-amber-600/20 via-blue-600/20 to-violet-600/20 border-b border-amber-500/30 px-4 py-2.5 text-xs text-white flex items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1 rounded-md bg-amber-500/20 text-amber-300 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <div className="truncate">
          <span className="font-bold text-amber-300">{current.title}: </span>
          <span className="text-zinc-200">{current.message}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {current.action_url && (
          <a
            href={current.action_url}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] flex items-center gap-1 transition-colors"
          >
            <span>Learn More</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={() => handleDismiss(current.id)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
