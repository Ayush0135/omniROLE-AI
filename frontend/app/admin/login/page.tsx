'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API = `${BASE}/api/v1`;
const ADMIN_EMAIL = 'ayush.kashyap7155@gmail.com';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError('This email is not authorized to access the admin panel.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin-auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setStep('otp');
      startCountdown(300);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin-auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid OTP');
      localStorage.setItem('omni_admin_token', data.token);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-[#050507] flex flex-col items-center justify-center p-6 overflow-y-auto">
      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase font-mono" style={{ color: '#f59e0b' }}>
            OmniAdmin Portal
          </h1>
          <p className="text-sm mt-2" style={{ color: '#78716c' }}>
            {step === 'email'
              ? 'Enter your admin email to receive a one-time password.'
              : `OTP sent to ${ADMIN_EMAIL}. Check your inbox.`}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 space-y-6"
          style={{ background: 'rgba(18,18,28,0.9)', border: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(20px)' }}>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'email' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>
                {step === 'email' ? '1' : '✓'}
              </div>
              <span className="text-xs font-semibold" style={{ color: step === 'email' ? '#fbbf24' : '#34d399' }}>Email</span>
            </div>
            <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.2)' }} />
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-amber-500 text-black' : 'bg-white/10 text-zinc-500'}`}>
                2
              </div>
              <span className="text-xs font-semibold" style={{ color: step === 'otp' ? '#fbbf24' : '#57534e' }}>OTP</span>
            </div>
          </div>

          {/* ── Email Step ── */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a29e' }}>
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#f59e0b' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ayush.kashyap7155@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      color: '#fef3c7',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(245,158,11,0.2)')}
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {loading ? 'Sending OTP...' : 'Send OTP to Email'}
              </button>
            </form>
          )}

          {/* ── OTP Step ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a29e' }}>
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                  className="w-full px-4 py-4 rounded-xl text-2xl font-mono font-black tracking-[16px] text-center outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: '#f59e0b',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(245,158,11,0.2)')}
                  autoFocus
                />
                {countdown > 0 && (
                  <p className="text-xs text-center mt-2" style={{ color: '#78716c' }}>
                    Expires in <span style={{ color: '#fbbf24' }}>{formatTime(countdown)}</span>
                  </p>
                )}
                {countdown === 0 && (
                  <p className="text-xs text-center mt-2" style={{ color: '#f87171' }}>
                    OTP expired. Please{' '}
                    <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="underline" style={{ color: '#fbbf24' }}>
                      request a new one.
                    </button>
                  </p>
                )}
              </div>

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', opacity: (loading || otp.length < 6) ? 0.6 : 1 }}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify & Enter Admin Panel'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="w-full py-2 text-xs font-semibold transition-all"
                style={{ color: '#57534e' }}
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        {/* Back to dashboard */}
        <div className="text-center mt-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold transition-all" style={{ color: '#57534e' }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
