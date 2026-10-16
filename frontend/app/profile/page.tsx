'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Calendar,
  Zap,
  Shield,
  Key,
  Bot,
  LogOut,
  Edit2,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>Loading user profile...</p>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const tokenLimit = user.monthly_token_limit || 500000;
  const tokenUsed = user.tokens_used_this_month || 0;
  const usedPercent = Math.min(100, Math.round((tokenUsed / tokenLimit) * 100));

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === user.name) {
      setEditingName(false);
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateProfile({ name: newName.trim() });
      setSuccessMsg('Profile name updated successfully.');
      setEditingName(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Banner */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Account Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal details, workspace tier, and authentication credentials.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="cyber-card rounded-3xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 mb-4">
              {initials}
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight">
              {user.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full cyber-pill text-xs font-semibold mt-3">
              <Zap className="w-3 h-3 text-blue-600" />
              <span>{user.plan || 'Free Starter'}</span>
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.08] flex flex-col gap-2">
              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="cyber-card rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Workspace Shortcuts
            </h3>
            <Link
              href="/roles"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-indigo-500/30 transition-all text-xs font-medium text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-blue-600" />
                <span>My Specialized Roles</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/api-keys"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-indigo-500/30 transition-all text-xs font-medium text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Developer API Keys</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/pricing"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-indigo-500/30 transition-all text-xs font-medium text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Upgrade Plan / Quota</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Right Column: User Details & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="cyber-card rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-slate-200">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Personal Information</h3>
                  <p className="text-xs text-slate-400">Your profile credentials and display settings</p>
                </div>
              </div>

              {!editingName && (
                <button
                  type="button"
                  onClick={() => {
                    setNewName(user.name);
                    setEditingName(true);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-indigo-500/30 hover:bg-white/[0.03] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Name</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {editingName ? (
                <form onSubmit={handleSaveName} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-indigo-500/30 rounded-xl text-sm text-white focus:outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className="px-4 py-2 rounded-xl border border-indigo-500/30 text-slate-300 hover:bg-white/[0.03] text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Full Name
                    </span>
                    <span className="block text-sm font-bold text-white mt-1">
                      {user.name}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Email Address
                    </span>
                    <span className="block text-sm font-bold text-white mt-1 truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Account Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-white capitalize">
                      {user.status || 'Active'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Member Since
                  </span>
                  <span className="block text-sm font-bold text-white mt-1">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan & Monthly Usage */}
          <div className="cyber-card rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Plan Quota & Token Usage</h3>
                  <p className="text-xs text-slate-400">Your current billing cycle quota</p>
                </div>
              </div>

              <Link
                href="/pricing"
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                Upgrade
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-200">Monthly Tokens Used</span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-white">{tokenUsed.toLocaleString()}</strong> / {tokenLimit.toLocaleString()} tokens
                  </span>
                </div>
                <div className="w-full h-3 bg-white/[0.05] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, usedPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Resets on the 1st of every month. Standard rate: 500k starter tokens included free.
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Web Search</span>
                  <span className="block text-xs font-bold text-white mt-0.5 text-emerald-600">Enabled</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Vector RAG</span>
                  <span className="block text-xs font-bold text-white mt-0.5 text-emerald-600">Enabled</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Code Exec</span>
                  <span className="block text-xs font-bold text-white mt-0.5 text-emerald-600">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
