'use client';

import React, { useEffect, useState } from 'react';
import { fetchCustomPlans, createCustomPlan, deleteCustomPlan, CustomPlan } from '@/lib/api';
import { Sparkles, Plus, Trash2, Tag, ShieldCheck, Cpu, Check, Layers, Users } from 'lucide-react';

export default function AdminCustomPlansPage() {
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [priceInr, setPriceInr] = useState<number>(1499);
  const [tokenLimit, setTokenLimit] = useState<number>(750000);
  const [maxRoles, setMaxRoles] = useState<number>(30);
  const [badgeText, setBadgeText] = useState('SPECIAL OFFER');
  const [offerUserEmail, setOfferUserEmail] = useState('');
  const [connectors, setConnectors] = useState<string[]>(['web_search', 'code_executor', 'vector_rag']);

  const allAvailableConnectors = [
    { id: 'web_search', label: 'Web Search Grounding' },
    { id: 'code_executor', label: 'Code REPL Execution' },
    { id: 'vector_rag', label: 'Vector RAG Storage' },
    { id: 'database_query', label: 'Database Query' },
    { id: 'google_drive_rag', label: 'Google Drive RAG' },
    { id: 'email_dispatcher', label: 'Email Dispatcher' },
  ];

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleToggleConnector = (connId: string) => {
    if (connectors.includes(connId)) {
      setConnectors(connectors.filter((c) => c !== connId));
    } else {
      setConnectors([...connectors, connId]);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Plan Name is required.');
    setSubmitting(true);

    try {
      const newPlan = await createCustomPlan({
        name: name.trim(),
        price_inr: Number(priceInr),
        monthly_token_limit: Number(tokenLimit),
        max_roles: Number(maxRoles),
        connectors_allowed: connectors,
        badge_text: badgeText.trim() || 'CUSTOM OFFER',
        offer_user_email: offerUserEmail.trim() || undefined,
      });

      setPlans([newPlan, ...plans]);
      setName('');
      setOfferUserEmail('');
      alert('🎉 Custom Plan / Offer Created Successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create custom plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (confirm(`Delete custom plan '${planName}'?`)) {
      try {
        await deleteCustomPlan(planId);
        setPlans(plans.filter((p) => p.id !== planId));
      } catch (err: any) {
        alert('Failed to delete plan.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <span>Custom Plans & User Offers Manager</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Create bespoke subscription tiers, special pricing deals, or targeted user offers that dynamically appear on the Pricing page.
        </p>
      </div>

      {/* Plan Creator Form */}
      <form onSubmit={handleCreatePlan} className="p-6 rounded-2xl bg-[#09090e] border border-[#1e1e28] space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Custom Plan / Offer
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Startup Growth Bundle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Price (₹ INR)</label>
            <input
              type="number"
              required
              value={priceInr}
              onChange={(e) => setPriceInr(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Badge Banner Text</label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="e.g. 50% OFF SPECIAL"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Monthly Token Quota</label>
            <input
              type="number"
              value={tokenLimit}
              onChange={(e) => setTokenLimit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Max AI Roles Allowed</label>
            <input
              type="number"
              value={maxRoles}
              onChange={(e) => setMaxRoles(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Target User Email (Optional)</label>
            <input
              type="email"
              placeholder="user@example.com (Leave blank for public)"
              value={offerUserEmail}
              onChange={(e) => setOfferUserEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Connectors Allowed Toggles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Allowed Connectors Suite</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allAvailableConnectors.map((c) => {
              const isSelected = connectors.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => handleToggleConnector(c.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      : 'bg-[#12121c] text-zinc-400 border-[#222230] hover:text-white'
                  }`}
                >
                  <span>{c.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Publishing Plan...' : 'Publish Custom Plan / Offer'}
          </button>
        </div>
      </form>

      {/* Active Plans List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Active Custom Plans & Offers</h2>

        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-xs">Loading custom plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#09090e] border border-[#1e1e28] text-xs text-zinc-500">
            No custom plans created yet. Use the form above to publish offers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div key={p.id} className="flex flex-col justify-between p-5 rounded-2xl bg-[#09090e] border border-[#1e1e28] space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] uppercase">
                      {p.badge_text || 'CUSTOM PLAN'}
                    </span>
                    <button
                      onClick={() => handleDeletePlan(p.id, p.name)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-base text-white mt-2">{p.name}</h3>
                  <div className="text-2xl font-black text-amber-400 mt-1">₹{p.price_inr.toLocaleString()}</div>

                  <div className="mt-3 pt-3 border-t border-[#1e1e28] space-y-1.5 text-xs text-zinc-300">
                    <div>• Tokens: <span className="font-bold text-white">{p.monthly_token_limit.toLocaleString()} / mo</span></div>
                    <div>• Max Roles: <span className="font-bold text-white">{p.max_roles} Roles</span></div>
                    {p.offer_user_email && (
                      <div className="text-amber-400 font-mono text-[11px]">
                        Targeted: {p.offer_user_email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-zinc-500 font-mono">
                  Connectors: {p.connectors_allowed?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
