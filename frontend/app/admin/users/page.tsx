'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminUsers, updateAdminUser, AdminUser } from '@/lib/api';
import {
  Users,
  ArrowLeft,
  Search,
  Filter,
  Shield,
  Edit3,
  CheckCircle,
  XCircle,
  Zap,
  Activity,
  X,
  Bot,
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Edit Modal States
  const [editPlan, setEditPlan] = useState('');
  const [editTokenLimit, setEditTokenLimit] = useState(500000);
  const [editStatus, setEditStatus] = useState('active');
  const [webSearchAllowed, setWebSearchAllowed] = useState(true);
  const [codeExecutorAllowed, setCodeExecutorAllowed] = useState(true);
  const [vectorRagAllowed, setVectorRagAllowed] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    getAdminUsers(searchQuery, planFilter)
      .then((data) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery, planFilter]);

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    setEditPlan(u.plan);
    setEditTokenLimit(u.monthly_token_limit);
    setEditStatus(u.status);
    setWebSearchAllowed(u.web_search_allowed !== false);
    setCodeExecutorAllowed(u.code_executor_allowed !== false);
    setVectorRagAllowed(u.vector_rag_allowed !== false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || updating) return;

    setUpdating(true);
    try {
      await updateAdminUser(selectedUser.id, {
        plan: editPlan,
        monthly_token_limit: editTokenLimit,
        status: editStatus,
        web_search_allowed: webSearchAllowed,
        code_executor_allowed: codeExecutorAllowed,
        vector_rag_allowed: vectorRagAllowed,
      } as any);

      setMessage(`User ${selectedUser.name} updated successfully!`);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setMessage(err.message || 'Failed to update user.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>User Profile & Token Control</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage user plan tiers, adjust monthly token limits, view API keys, and suspend accounts.
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

      {message && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-300 focus:outline-none"
          >
            <option value="">All Plan Tiers</option>
            <option value="Free">Free Plan</option>
            <option value="Pro Developer">Pro Developer</option>
            <option value="Enterprise Unlimited">Enterprise Unlimited</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] overflow-x-auto">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-xs text-zinc-400 gap-2">
            <Activity className="w-4 h-4 animate-spin text-blue-500" />
            <span>Loading user profiles...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No registered users found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Monthly Token Limit</th>
                <th className="py-3 px-4">AI Roles</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e24] text-xs text-zinc-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#18181c]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{u.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      u.plan === 'Enterprise Unlimited'
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                        : u.plan === 'Pro Developer'
                        ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}>
                      {u.plan}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-zinc-200">
                    {u.monthly_token_limit.toLocaleString()} / mo
                  </td>

                  <td className="py-3.5 px-4 font-mono text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-zinc-500" />
                      {u.roles_count} Roles
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {u.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" /> Suspended
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openEditModal(u)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1 ml-auto"
                    >
                      <Edit3 className="w-3 h-3" /> Edit User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Edit User: {selectedUser.name}</span>
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Plan Tier</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="Free">Free Plan</option>
                  <option value="Pro Developer">Pro Developer</option>
                  <option value="Enterprise Unlimited">Enterprise Unlimited</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Monthly Token Quota</label>
                <input
                  type="number"
                  step="50000"
                  value={editTokenLimit}
                  onChange={(e) => setEditTokenLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* User Search & Connector Controls */}
              <div className="space-y-2 pt-2 border-t border-[#27272a]">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">Search & Connector Permissions</label>
                <div className="space-y-2 text-xs text-zinc-300">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                    <span>Web Search Connector</span>
                    <input
                      type="checkbox"
                      checked={webSearchAllowed}
                      onChange={(e) => setWebSearchAllowed(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                    <span>Code Execution Connector</span>
                    <input
                      type="checkbox"
                      checked={codeExecutorAllowed}
                      onChange={(e) => setCodeExecutorAllowed(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                    <span>Vector RAG Connector</span>
                    <input
                      type="checkbox"
                      checked={vectorRagAllowed}
                      onChange={(e) => setVectorRagAllowed(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#18181c] text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  {updating ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
