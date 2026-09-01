'use client';

import React, { useEffect, useState } from 'react';
import { fetchAPIKeys, createAPIKey, revokeAPIKey, APIKey } from '@/lib/api';
import { Key, Plus, Copy, Check, Trash2, Lock, AlertTriangle } from 'lucide-react';

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await fetchAPIKeys();
      setKeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKeys(); }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const created = await createAPIKey(newKeyName);
      setCreatedRawKey(created.raw_key || null);
      setNewKeyName('');
      loadKeys();
    } catch {
      alert('Failed to generate API Key.');
    }
  };

  const handleRevoke = async (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? Applications using this key will immediately lose access.')) {
      try {
        await revokeAPIKey(id);
        setKeys(keys.map((k) => (k.id === id ? { ...k, status: 'revoked' } : k)));
      } catch {
        alert('Failed to revoke API key.');
      }
    }
  };

  const handleCopyRawKey = () => {
    if (createdRawKey) {
      navigator.clipboard.writeText(createdRawKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>
            API <span className="gradient-text-ember">Key Credentials</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#78716c' }}>
            Manage authentication keys to access your specialized AI role endpoints securely.
          </p>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setCreatedRawKey(null); }}
          className="px-4 py-2.5 rounded-2xl font-bold text-xs text-black flex items-center gap-1.5 transition-all shadow-lg self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
        <div className="text-xs space-y-0.5">
          <h4 className="font-bold" style={{ color: '#fbbf24' }}>Production Key Hashing Security</h4>
          <p className="leading-relaxed" style={{ color: '#a8a29e' }}>
            API secrets are hashed using SHA-256 upon creation and stored securely. Your API key will only be shown <span className="font-bold" style={{ color: '#fef3c7' }}>ONCE</span> during creation.
          </p>
        </div>
      </div>

      {/* Keys Table */}
      <div className="rounded-3xl overflow-hidden glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
              <tr>
                {['Key Name', 'Masked Secret', 'Created', 'Last Used', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`py-3.5 px-5 font-bold uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`} style={{ color: '#78716c' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center" style={{ color: '#57534e' }}>Loading credentials...</td></tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Key className="w-8 h-8" style={{ color: '#44403c' }} />
                      <p style={{ color: '#57534e' }}>No API keys yet. Click <span className="font-bold" style={{ color: '#fbbf24' }}>Generate New Key</span> to create one.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} style={{ borderBottom: '1px solid rgba(245,158,11,0.05)' }}>
                    <td className="py-4 px-5 font-semibold" style={{ color: '#fef3c7' }}>{key.name}</td>
                    <td className="py-4 px-5 font-mono" style={{ color: '#78716c' }}>{key.key_prefix}</td>
                    <td className="py-4 px-5" style={{ color: '#78716c' }}>{new Date(key.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-5" style={{ color: '#78716c' }}>{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase" style={
                        key.status === 'active'
                          ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
                          : { background: 'rgba(244,63,94,0.1)', color: '#f87171', border: '1px solid rgba(244,63,94,0.2)' }
                      }>
                        {key.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {key.status === 'active' && (
                        <button onClick={() => handleRevoke(key.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#78716c' }} title="Revoke Key">
                          <Trash2 className="w-4 h-4 hover:text-rose-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-5" style={{ background: '#12121c', border: '1px solid rgba(245,158,11,0.15)' }}>
            {!createdRawKey ? (
              <>
                <h3 className="text-base font-bold font-sora" style={{ color: '#fef3c7' }}>Generate New API Key</h3>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: '#a8a29e' }}>Key Name / Descriptor</label>
                    <input
                      type="text"
                      placeholder="e.g. Production Backend Service"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)', color: '#fef3c7' }}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.04)', color: '#78716c' }}>
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      Generate Key
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#34d399' }}>
                  <AlertTriangle className="w-5 h-5" />
                  <span>API Key Created — Copy Now!</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
                  Please copy your API key now. For security, you will <span className="font-bold" style={{ color: '#fef3c7' }}>not</span> be able to view it again.
                </p>
                <div className="p-3.5 rounded-xl flex items-center justify-between font-mono text-xs" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', color: '#34d399' }}>
                  <span className="truncate mr-2">{createdRawKey}</span>
                  <button onClick={handleCopyRawKey} className="p-1.5 rounded-lg shrink-0 transition-colors" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }} title="Copy">
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="pt-2 flex justify-end">
                  <button onClick={() => { setIsModalOpen(false); setCreatedRawKey(null); }} className="px-5 py-2 rounded-xl text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    Done & Saved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
