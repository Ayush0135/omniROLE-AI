'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { submitPaymentRequest } from '@/lib/api';
import { Zap, Check, Copy, QrCode, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const userEmail = isLoaded && user ? user.primaryEmailAddress?.emailAddress || '' : '';

  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number } | null>(null);
  const [customPlans, setCustomPlans] = useState<any[]>([]);
  const [utrNumber, setUtrNumber] = useState('');
  const [emailInput, setEmailInput] = useState(userEmail);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const UPI_ID = '9693932656-2@ybl';

  useEffect(() => {
    import('@/lib/api').then(({ fetchCustomPlans }) => {
      fetchCustomPlans().then((plans) => setCustomPlans(plans)).catch(() => {});
    });
  }, []);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPaymentModal = (planName: string, amountInr: number) => {
    setSelectedPlan({ name: planName, amount: amountInr });
    setEmailInput(user?.primaryEmailAddress?.emailAddress || '');
    setUtrNumber('');
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      setErrorMsg('Please enter a valid 12-Digit Transaction UTR Number.');
      return;
    }
    if (!emailInput.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await submitPaymentRequest({
        user_email: emailInput.trim(),
        plan_name: selectedPlan?.name || 'Pro Developer',
        amount_inr: selectedPlan?.amount || 2499,
        utr_number: utrNumber.trim(),
      });
      setSuccessMsg('🎉 Payment Proof Submitted! Your account will be upgraded within 5-15 minutes after admin verification.');
      setUtrNumber('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit payment request.');
    } finally {
      setSubmitting(false);
    }
  };

  const upiIntentString = selectedPlan
    ? `upi://pay?pa=${UPI_ID}&pn=OmniRole%20AI&am=${selectedPlan.amount}&cu=INR&tn=${encodeURIComponent(selectedPlan.name + ' Plan')}`
    : `upi://pay?pa=${UPI_ID}&pn=OmniRole%20AI`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntentString)}`;

  const plans = [
    {
      id: 'free',
      label: 'Free Starter',
      price: '₹0',
      period: '/ forever',
      desc: 'Perfect for exploring AI Expert roles and lightweight web search interactions.',
      color: '#78716c',
      borderColor: 'rgba(120,113,108,0.2)',
      features: [
        { text: '20,000 Daily Tokens (20k/day)', highlight: true },
        { text: 'Up to 2 Active AI Roles' },
        { text: 'Gemini 2.5 Flash Engine' },
        { text: 'Web Search Connector Only' },
        { text: '1 REST API Key' },
      ],
      cta: 'Current Free Plan',
      disabled: true,
      amount: 0,
    },
    {
      id: 'pro',
      label: 'Pro Developer',
      price: '₹2,499',
      period: '/ month ($29)',
      desc: 'Full access to Groq LPUs, Code Execution, Drive RAG, and 500k tokens.',
      color: '#f59e0b',
      borderColor: 'rgba(245,158,11,0.5)',
      popular: true,
      features: [
        { text: '500,000 Monthly Tokens', highlight: true },
        { text: 'Up to 25 Active AI Roles' },
        { text: 'Groq LPU Sub-110ms Speed', highlight: true },
        { text: 'All 6 Multi-Connectors Suite' },
        { text: '10 REST API Keys' },
        { text: 'AI Prompt Auto-Enhancer' },
      ],
      cta: 'Upgrade via UPI QR',
      amount: 2499,
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      price: '₹7,999',
      period: '/ month ($99)',
      desc: 'High-volume API execution for production teams, agencies, and enterprise AI bots.',
      color: '#a78bfa',
      borderColor: 'rgba(167,139,250,0.3)',
      features: [
        { text: '5,000,000 Monthly Tokens', highlight: true },
        { text: 'Unlimited Active AI Roles' },
        { text: 'Dedicated SLA Queue' },
        { text: 'Unlimited API Keys' },
        { text: 'Custom Private Webhooks' },
      ],
      cta: 'Upgrade via UPI QR',
      amount: 7999,
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Flexible Subscription Plans</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-sora tracking-tight" style={{ color: '#fef3c7' }}>
          Supercharge Your AI Workflow with{' '}
          <span className="gradient-text-ember">OmniRole Pro</span>
        </h1>
        <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: '#78716c' }}>
          Unlock sub-110ms Groq LPU speeds, all 6 Multi-Connectors, Unlimited API Keys, and 500,000 monthly tokens.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col justify-between p-7 rounded-3xl glass-card transition-all relative overflow-hidden ${plan.popular ? 'scale-[1.03] z-10' : ''}`}
            style={{ borderColor: plan.borderColor, borderWidth: plan.popular ? '2px' : '1px', borderStyle: 'solid', background: 'rgba(18,18,28,0.85)' }}
          >
            {plan.popular && (
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-widest text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                Most Popular
              </div>
            )}

            <div className="space-y-4 mt-3">
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: plan.color }}>{plan.label}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-sora" style={{ color: '#fef3c7' }}>{plan.price}</span>
                <span className="text-xs" style={{ color: '#78716c' }}>{plan.period}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>{plan.desc}</p>

              <div className="pt-4 space-y-2.5 text-xs" style={{ borderTop: `1px solid ${plan.borderColor}` }}>
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" style={{ color: plan.color }} />
                    <span style={{ color: f.highlight ? '#fef3c7' : '#a8a29e', fontWeight: f.highlight ? '600' : '400' }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={plan.disabled}
              onClick={() => !plan.disabled && handleOpenPaymentModal(plan.label, plan.amount)}
              className="mt-8 w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              style={
                plan.disabled
                  ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#57534e', cursor: 'default' }
                  : plan.popular
                  ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }
                  : { background: `rgba(167,139,250,0.15)`, border: `1px solid rgba(167,139,250,0.3)`, color: '#a78bfa' }
              }
            >
              <span>{plan.cta}</span>
              {!plan.disabled && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>

      {/* Custom Plans */}
      {customPlans.length > 0 && (
        <div className="space-y-6 pt-6" style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}>
          <div className="text-center space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full" style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚡ Special Exclusive Offers
            </span>
            <h2 className="text-xl font-extrabold font-sora" style={{ color: '#fef3c7' }}>Custom Tiers & Deals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customPlans.map((cp) => (
              <div key={cp.id} className="flex flex-col justify-between p-6 rounded-3xl glass-card" style={{ border: '2px solid rgba(245,158,11,0.3)' }}>
                <div className="space-y-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                    {cp.badge_text || 'EXCLUSIVE'}
                  </span>
                  <h3 className="font-extrabold text-lg font-sora" style={{ color: '#fef3c7' }}>{cp.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-sora" style={{ color: '#fbbf24' }}>₹{cp.price_inr.toLocaleString()}</span>
                    <span className="text-xs" style={{ color: '#78716c' }}>/ month</span>
                  </div>
                  <div className="pt-3 space-y-2 text-xs" style={{ borderTop: '1px solid rgba(245,158,11,0.1)' }}>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0" style={{ color: '#fbbf24' }} /><span style={{ color: '#a8a29e' }}>{cp.monthly_token_limit.toLocaleString()} Tokens / month</span></div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0" style={{ color: '#fbbf24' }} /><span style={{ color: '#a8a29e' }}>{cp.max_roles} Active AI Roles</span></div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0" style={{ color: '#fbbf24' }} /><span style={{ color: '#a8a29e' }}>Connectors: {cp.connectors_allowed?.join(', ')}</span></div>
                  </div>
                </div>
                <button onClick={() => handleOpenPaymentModal(cp.name, cp.price_inr)} className="mt-6 w-full py-2.5 rounded-2xl font-extrabold text-xs text-black flex items-center justify-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <span>Claim via UPI</span><ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPI Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl" style={{ background: '#12121c', border: '1px solid rgba(245,158,11,0.2)' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg font-sora" style={{ color: '#fef3c7' }}>Scan UPI QR Code</h3>
                  <p className="text-xs" style={{ color: '#78716c' }}>Pay <span className="font-bold" style={{ color: '#fef3c7' }}>₹{selectedPlan.amount.toLocaleString()}</span> for {selectedPlan.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="p-1.5 rounded-lg transition-colors text-lg" style={{ color: '#78716c', background: 'rgba(255,255,255,0.04)' }}>✕</button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <div className="w-44 h-44 rounded-xl bg-white p-2 shrink-0 shadow-lg">
                <img src={qrImageUrl} alt="UPI QR" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#78716c' }}>UPI VPA ID</span>
                  <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)' }}>
                    <span className="text-xs font-mono font-bold" style={{ color: '#fbbf24' }}>{UPI_ID}</span>
                    <button onClick={handleCopyUpi} className="p-1 transition-colors" style={{ color: '#78716c' }} title="Copy">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copied && <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>}
                </div>
                <div className="text-[11px] space-y-1" style={{ color: '#78716c' }}>
                  <p>✔ Open GPay, PhonePe, Paytm, BHIM, or CRED.</p>
                  <p>✔ Scan QR or enter UPI ID above.</p>
                  <p>✔ Enter amount <span className="font-bold" style={{ color: '#fef3c7' }}>₹{selectedPlan.amount}</span> & pay.</p>
                </div>
              </div>
            </div>

            {/* UTR Form */}
            <form onSubmit={handleSubmitUtr} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: '#a8a29e' }}>Account Email</label>
                <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="your.email@example.com" className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)', color: '#fef3c7' }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: '#a8a29e' }}>12-Digit Payment UTR / Reference ID</label>
                <input type="text" required value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} placeholder="e.g. 423981048201" className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)', color: '#fef3c7' }} />
                <p className="text-[10px]" style={{ color: '#57534e' }}>Found in your GPay / PhonePe payment receipt.</p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl flex items-center gap-2 text-xs" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                  {successMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid rgba(245,158,11,0.08)' }}>
                <button type="button" onClick={() => setSelectedPlan(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors" style={{ background: 'rgba(255,255,255,0.04)', color: '#78716c' }}>
                  Close
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  {submitting ? 'Submitting UTR...' : 'Submit Payment Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
