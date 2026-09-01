'use client';

import React, { useEffect, useState } from 'react';
import {
  fetchPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  PaymentRequest,
} from '@/lib/api';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Check,
  X,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string, email: string, plan: string) => {
    if (confirm(`Approve UTR payment for ${email} and activate ${plan} Plan?`)) {
      setProcessingId(id);
      try {
        await approvePaymentRequest(id);
        setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
      } catch (err: any) {
        alert(err.message || 'Failed to approve payment request.');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (id: string, email: string) => {
    if (confirm(`Reject payment request for ${email}?`)) {
      setProcessingId(id);
      try {
        await rejectPaymentRequest(id);
        setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
      } catch (err: any) {
        alert(err.message || 'Failed to reject payment request.');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.utr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.plan_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <span>UPI Payment Verification Tower</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review incoming UTR Numbers, verify bank deposits, and activate Pro / Enterprise user tiers with 1 click.
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="px-3.5 py-2 rounded-xl bg-[#12121c] border border-[#222230] text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0a0a10] border border-[#1e1e28] space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending Review</div>
          <div className="text-2xl font-black text-white">{pendingCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0a10] border border-[#1e1e28] space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Approved Payments</div>
          <div className="text-2xl font-black text-white">{approvedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0a10] border border-[#1e1e28] space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Total Requests Received</div>
          <div className="text-2xl font-black text-white">{requests.length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#09090e] border border-[#1e1e28]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by email, UTR number, or plan name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-[#12121c] border border-[#222230] text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Payment Requests Table */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-xs">Loading payment verification queue...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#09090e] border border-[#1e1e28] space-y-2">
          <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">No Payment Requests Found</h3>
          <p className="text-xs text-zinc-500">
            When users submit their UPI UTR Transaction IDs, they will appear here for verification.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#09090e] border border-[#1e1e28] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e1e28] bg-[#07070b] text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4">User Email</th>
                  <th className="py-3.5 px-4">Plan Requested</th>
                  <th className="py-3.5 px-4">Amount (₹)</th>
                  <th className="py-3.5 px-4">UTR Number</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e28] text-xs text-zinc-300">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#11111a] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{req.user_email}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[11px]">
                        {req.plan_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{req.amount_inr.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">{req.utr_number}</td>
                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(req.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : req.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleApprove(req.id, req.user_email, req.plan_name)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleReject(req.id, req.user_email)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
