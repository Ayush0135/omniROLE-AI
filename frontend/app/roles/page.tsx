'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RoleCard } from '@/components/RoleCard';
import { fetchRoles, deleteRole, createRole, Role } from '@/lib/api';
import { Search, Plus, User, ShieldCheck, Sparkles, Bot, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MyRolesPage() {
  const { user, loading: authLoading } = useAuth(); const isLoaded = !authLoading;
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
    if (confirm('Are you sure you want to delete this custom AI Persona?')) {
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 sm:p-9 rounded-3xl cyber-card relative overflow-hidden border-indigo-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase cyber-pill">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI PERSONA CATALOG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Autonomous <span className="gradient-text-cyber">AI Expert Personas</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-xl font-normal">
            Domain-specialized personas engineered with isolated user storage, custom system instructions, and vector search retrieval.
          </p>
        </div>

        <Link
          href="/roles/new"
          className="relative z-10 px-6 py-3.5 rounded-xl font-bold text-xs btn-cyber-primary flex items-center justify-center gap-2 shrink-0 self-start md:self-auto shadow-xl"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Custom Persona</span>
        </Link>
      </div>

      {/* Tabs & Search Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl cyber-card">
        {/* Workspace Scope Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06] shrink-0">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabFilter === 'all'
                ? 'bg-indigo-500/25 text-white border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Roles ({roles.length})
          </button>
          <button
            onClick={() => setTabFilter('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tabFilter === 'custom'
                ? 'bg-indigo-500/25 text-white border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>My Private Roles ({customCount})</span>
          </button>
          <button
            onClick={() => setTabFilter('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tabFilter === 'templates'
                ? 'bg-indigo-500/25 text-white border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>System Templates ({templateCount})</span>
          </button>
        </div>

        {/* Search and Sorters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by role name, model, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-black/40 border border-indigo-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl text-xs bg-black/40 border border-indigo-500/20 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 rounded-xl text-xs bg-black/40 border border-indigo-500/20 text-slate-200 focus:outline-none focus:border-cyan-400"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : sortedRoles.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl cyber-card space-y-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 mx-auto border border-indigo-500/20">
            <Bot className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white font-heading">No AI Personas Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {tabFilter === 'custom'
              ? "You haven't created any custom AI Personas yet. Click 'Create Custom Persona' above to deploy your private agent."
              : 'Try adjusting your search query or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRoles.map((role) => (
            <RoleCard key={role.id} role={role} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          ))}
        </div>
      )}
    </div>
  );
}
