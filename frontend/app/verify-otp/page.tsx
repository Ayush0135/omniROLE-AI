'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ArrowRight, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const redirectPath = searchParams.get('redirect') || '/roles';

  const { verifyOtp, sendOtp } = useAuth();
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Email address is missing.');
      return;
    }
    if (!otp.trim() || otp.trim().length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp.trim());
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resending) return;
    setError(null);
    setResending(true);
    setResendSuccess(false);
    try {
      await sendOtp(email.trim());
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch new OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="precision-card p-7 sm:p-9 border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4 font-bold text-xl">
              🔐
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Enter Verification Code
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
              We sent a 6-digit code to{' '}
              <span className="text-white font-medium break-all">{email || 'your email'}</span>
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs mb-5 flex items-start gap-2 relative z-10">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs mb-5 flex items-center gap-2 relative z-10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>A fresh 6-digit code was dispatched to your inbox.</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center uppercase tracking-wider font-mono">
                6-Digit Security Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3.5 text-center font-mono text-2xl font-bold tracking-[0.5em] bg-black/60 border border-white/20 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all min-h-[52px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 px-4 rounded-xl btn-precision-primary text-white font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <span>Verifying code...</span>
              ) : (
                <>
                  <span>Verify & Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend actions */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span>Didn't receive it?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending...' : 'Resend Code'}</span>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="hover:text-white transition-colors">
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08090d] flex items-center justify-center text-slate-400">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
