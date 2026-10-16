'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCode = otp.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email.trim(), cleanCode);
      setSuccessMsg('Verification successful! Entering your workspace...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      await sendOtp(email.trim());
      setSuccessMsg('A new verification code has been dispatched to your email.');
      setResendCooldown(45);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="cyber-card p-8 sm:p-10 border-indigo-500/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              We sent a 6-digit verification code to <br />
              <strong className="text-white font-semibold">{email || 'your email'}</strong>
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-5 flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs mb-5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 text-center">
                Enter 6-digit verification code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full py-3.5 text-center font-mono text-2xl font-bold tracking-[0.5em] bg-slate-50 border border-white/[0.08] rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length !== 6}
              className="w-full py-3 px-4 rounded-xl btn-cyber-primary text-white font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying code...</span>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center">
            {resendCooldown > 0 ? (
              <p className="text-xs text-slate-400">
                Resend code in <span className="font-semibold text-slate-600">{resendCooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>Didn't receive the email? Resend code</span>
              </button>
            )}
          </div>

          {/* Footer Back */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            Wrong email address?{' '}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Use a different email
            </Link>
          </div>
        </div>

        {/* Security footnote */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Code sent via Gmail App Password SMTP dispatch</span>
        </div>
      </div>
    </div>
  );
}


export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-slate-400">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
