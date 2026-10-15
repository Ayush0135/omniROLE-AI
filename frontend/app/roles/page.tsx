'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RoleCard } from '@/components/RoleCard';
import { fetchRoles, deleteRole, createRole, Role } from '@/lib/api';
import { Search, Plus, Filter, SlidersHorizontal, Bot, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function MyRolesPage() {
  const { user, isLoaded } = useUser();
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tabFilter, setTabFilter] = useState<'all' | 'custom' | 'templates'>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [loading, setLoading] = useState(true);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchRoles(searchQuery, statusFilter === 'all' ? undefined : statusFilter, user?.id);
      setRoles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadRoles();
    }
  }, [searchQuery, statusFilter, user?.id, isLoaded]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom AI Role?')) {
      try {
        await deleteRole(id);
        setRoles(roles.filter((r) => r.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete role');
      }
    }
  };

  const handleDuplicate = async (role: Role) => {
    try {
      const newRole = await createRole({
        name: `${role.name} (Custom)`,
        description: role.description,
        icon: role.icon,
        system_prompt: role.system_prompt,
        expertise: role.expertise,
        provider: role.provider,
        model_name: role.model_name,
        temperature: role.temperature,
        max_tokens: role.max_tokens,
        response_style: role.response_style,
        memory_enabled: role.memory_enabled,
        status: 'active',
      });
      setRoles([newRole, ...roles]);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate role');
    }
  };

  const filteredRoles = roles.filter((role) => {
    const isCustom = Boolean((role as any).user_id);
    if (tabFilter === 'custom') return isCustom;
    if (tabFilter === 'templates') return !isCustom;
    return true;
  });

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'temp') return b.temperature - a.temperature;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const customCount = roles.filter((r) => Boolean((r as any).user_id)).length;
  const templateCount = roles.filter((r) => !Boolean((r as any).user_id)).length;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#161622]/90 via-[#12121c]/90 to-[#0e0e15]/90 border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Specialized <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">AI Expert Roles</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
            Orchestrate domain-specialized personas with custom system prompts, vector search knowledge bases, and multi-tool execution.
          </p>
        </div>

        <Link
          href="/roles/new"
          className="relative z-10 px-5 py-2.5 rounded-xl font-bold text-xs text-black flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Custom Role</span>
        </Link>
      </div>

      {/* Tabs & Search Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#12121c]/80 border border-white/[0.06]">
        {/* Workspace Scope Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06] shrink-0">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All Roles ({roles.length})
          </button>
          <button
            onClick={() => setTabFilter('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tabFilter === 'custom'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Private Roles ({customCount})</span>
          </button>
          <button
            onClick={() => setTabFilter('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tabFilter === 'templates'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>System Templates ({templateCount})</span>
          </button>
        </div>

        {/* Search and Sorters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Search by role name, model, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-black/30 border border-white/[0.08] text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl text-xs bg-black/30 border border-white/[0.08] text-stone-300 focus:outline-none focus:border-amber-500/40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl text-xs bg-black/30 border border-white/[0.08] text-stone-300 focus:outline-none focus:border-amber-500/40"
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="temp">Temperature</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-[#14141e]/50 border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : sortedRoles.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#12121c]/60 border border-white/[0.06] space-y-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.04] text-stone-500 mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-200">No AI Roles Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {tabFilter === 'custom'
              ? "You haven't created any custom AI Roles yet. Click 'Create Custom Role' above to build your private agent."
              : 'Try adjusting your search query or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedRoles.map((role) => (
            <RoleCard key={role.id} role={role} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          ))}
        </div>
      )}
    </div>
  );
}
