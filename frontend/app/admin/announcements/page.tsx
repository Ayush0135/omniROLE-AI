'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  Announcement,
} from '@/lib/api';
import {
  Megaphone,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [bannerType, setBannerType] = useState('promo');
  const [actionUrl, setActionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = () => {
    setLoading(true);
    getAdminAnnouncements()
      .then((data) => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await createAdminAnnouncement({
        title,
        message,
        banner_type: bannerType,
        action_url: actionUrl || undefined,
        is_active: true,
      });

      setTitle('');
      setMessage('');
      setActionUrl('');
      loadAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminAnnouncement(id);
      loadAnnouncements();
    } catch (err: any) {
      alert('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <span>Global Announcements & Promotional Banners</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create, publish, and toggle platform-wide announcements, ads, feature updates, and promotional banners.
          </p>
        </div>

        <Link
          href="/admin"
          className="px-3.5 py-1.5 rounded-xl bg-[#141418] hover:bg-[#1a1a20] border border-[#27272a] text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Control Tower</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Form: Create New Banner / Announcement */}
      <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Platform Announcement / Promotional Banner
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Banner Title *</label>
            <input
              type="text"
              placeholder="e.g. 🎉 New Groq LPU & Google Drive Connectors Now Live!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Banner Type</label>
            <select
              value={bannerType}
              onChange={(e) => setBannerType(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-200 focus:outline-none"
            >
              <option value="promo">🎁 Promotional / Feature Release (Amber / Purple)</option>
              <option value="info">ℹ️ System Information (Blue)</option>
              <option value="warning">⚠️ System Alert / Maintenance (Yellow)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Message Content *</label>
          <textarea
            rows={3}
            placeholder="Enter announcement description..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="w-full p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 font-sans focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Call to Action URL (Optional)</label>
          <input
            type="url"
            placeholder="https://localhost:3000/roles/new"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !message.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{submitting ? 'Publishing...' : 'Publish Banner'}</span>
          </button>
        </div>
      </form>

      {/* Form: Send Direct Email Campaign via SMTP (23tec2cs758@vgu.ac.in) */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const targetEmail = (e.target as any).promo_email.value;
          const promoTitle = (e.target as any).promo_title.value;
          const promoBody = (e.target as any).promo_body.value;
          const promoLink = (e.target as any).promo_link.value;

          if (!promoTitle || !promoBody) return alert('Subject and Body are required.');
          try {
            const { sendAdminPromoEmail } = await import('@/lib/api');
            const res = await sendAdminPromoEmail({
              recipient_email: targetEmail.trim() || undefined,
              title: promoTitle.trim(),
              message_body: promoBody.trim(),
              action_url: promoLink.trim() || undefined,
            });
            alert(`🎉 ${res.message}`);
          } catch (err: any) {
            alert(err.message || 'Failed to dispatch email.');
          }
        }}
        className="p-6 rounded-2xl bg-[#09090e] border border-blue-500/30 space-y-4"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Send Email Campaign via SMTP (23tec2cs758@vgu.ac.in)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Email Title / Subject *</label>
            <input
              name="promo_title"
              type="text"
              required
              placeholder="e.g. ⚡ Exclusive Offer: Upgrade to Pro Developer for 500k Tokens"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#272738] text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Target Email (Leave blank to email ALL users)</label>
            <input
              name="promo_email"
              type="email"
              placeholder="user@example.com (or all registered users)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#272738] text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Email Message Body *</label>
          <textarea
            name="promo_body"
            rows={3}
            required
            placeholder="Enter promotional message content..."
            className="w-full p-3.5 rounded-xl bg-[#14141d] border border-[#272738] text-xs text-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Action Button Link (Optional)</label>
          <input
            name="promo_link"
            type="url"
            placeholder="http://localhost:3000/pricing"
            className="w-full px-3.5 py-2 rounded-xl bg-[#14141d] border border-[#272738] text-xs text-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <span>Dispatch SMTP Email Campaign</span>
          </button>
        </div>
      </form>

      {/* Roster of Published Banners */}
      <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Active Platform Announcements ({announcements.length})
        </h2>

        {loading ? (
          <div className="py-8 flex items-center justify-center text-xs text-zinc-400 gap-2">
            <Activity className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No announcements created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ann.banner_type === 'promo'
                        ? 'bg-amber-500/20 text-amber-400'
                        : ann.banner_type === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ann.banner_type}
                    </span>
                    <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{ann.message}</p>

                  {ann.action_url && (
                    <a
                      href={ann.action_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold pt-1"
                    >
                      <span>Explore Feature</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
