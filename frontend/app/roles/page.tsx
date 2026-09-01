'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RoleCard } from '@/components/RoleCard';
import { fetchRoles, deleteRole, createRole, Role } from '@/lib/api';
import { Search, Plus, Filter, SlidersHorizontal, Bot } from 'lucide-react';

export default function MyRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [loading, setLoading] = useState(true);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchRoles(searchQuery, statusFilter === 'all' ? undefined : statusFilter);
      setRoles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, [searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this AI Role?')) {
      try {
        await deleteRole(id);
        setRoles(roles.filter((r) => r.id !== id));
      } catch {
        alert('Failed to delete role');
      }
    }
  };

  const handleDuplicate = async (role: Role) => {
    try {
      const newRole = await createRole({
        name: `${role.name} (Copy)`,
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
        status: 'draft',
      });
      setRoles([newRole, ...roles]);
    } catch {
      alert('Failed to duplicate role');
    }
  };

  const sortedRoles = [...roles].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'temp') return b.temperature - a.temperature;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>
            My <span className="gradient-text-ember">AI Roles</span> Catalog
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#78716c' }}>
            Browse, manage, duplicate, or launch dedicated expert workspaces.
          </p>
        </div>
        <Link
          href="/roles/new"
          className="px-5 py-2.5 rounded-2xl font-extrabold text-xs text-black flex items-center gap-2 shadow-lg self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Create AI Role</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-5 rounded-3xl glass-card">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#f59e0b', opacity: 0.7 }} />
          <input
            type="text"
            placeholder="Search roles by name, expertise, or prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', color: '#fef3c7' }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl text-xs focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)', color: '#a8a29e' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 rounded-xl text-xs focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)', color: '#a8a29e' }}
            >
              <option value="newest">Newest First</option>
              <option value="name">By Name</option>
              <option value="temp">By Temperature</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-3xl animate-pulse" style={{ background: 'rgba(18,18,28,0.75)', border: '1px solid rgba(245,158,11,0.08)' }} />
          ))}
        </div>
      ) : sortedRoles.length === 0 ? (
        <div className="text-center py-16 rounded-3xl space-y-3 glass-card">
          <Bot className="w-12 h-12 mx-auto" style={{ color: '#44403c' }} />
          <h3 className="text-sm font-bold font-sora" style={{ color: '#a8a29e' }}>No Matching Roles</h3>
          <p className="text-xs" style={{ color: '#78716c' }}>Try clearing search filters or create a new role.</p>
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
