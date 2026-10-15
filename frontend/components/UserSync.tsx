'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { syncUserWithSupabase } from '@/lib/api';
import Link from 'next/link';
import { Sparkles, Check, ArrowRight, Bot, Zap } from 'lucide-react';

export default function UserSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const syncedRef = useRef<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    const name = user.fullName || user.username || user.firstName || 'Developer';
    const clerkId = user.id;

    // Store user ID centrally in localStorage for API requests
    localStorage.setItem('omni_current_user_id', clerkId);

    // Check if new user registration needs plan onboarding prompt
    const hasChosenPlan = localStorage.getItem(`omni_plan_chosen_${clerkId}`);
    if (!hasChosenPlan) {
      setShowPlanModal(true);
    }

    // Prevent duplicate sync calls for same user session
    if (syncedRef.current === clerkId) return;

    if (email && clerkId) {
      syncedRef.current = clerkId;
      syncUserWithSupabase({
        clerk_id: clerkId,
        email: email,
        name: name,
      }).catch((err) => console.error('User sync error:', err));
    }

  }, [user, isSignedIn, isLoaded]);

  const handleSelectPlan = (planName: string) => {
    if (user?.id) {
      localStorage.setItem(`omni_plan_chosen_${user.id}`, planName);
    }
    setShowPlanModal(false);
  };

  return (
    <>
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0d0d10] border border-[#27272a] p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Welcome to OmniRole AI</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Select Your Starting Plan</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Choose how you want to build and orchestrate specialized AI Expert Agents.
              </p>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FREE STARTER */}
              <div className="flex flex-col justify-between p-5 rounded-xl bg-[#141418] border border-[#27272a] hover:border-zinc-700 transition-all space-y-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Free Starter</span>
                  <div className="text-2xl font-black text-white">₹0 / mo</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Ideal for testing 2 AI Roles with 20,000 daily tokens and Web Search connector.
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[#27272a] text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>20,000 Daily Tokens (20k/day)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Max 2 Active AI Roles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Web Search Connector Only</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan('Free Starter')}
                  className="w-full py-2.5 rounded-xl bg-[#1f1f26] hover:bg-[#272730] text-white font-bold text-xs transition-colors"
                >
                  Continue with Free Starter
                </button>
              </div>

              {/* PRO DEVELOPER */}
              <div className="relative flex flex-col justify-between p-5 rounded-xl bg-[#131218] border-2 border-blue-500/60 shadow-xl shadow-blue-500/10 hover:border-blue-500 transition-all space-y-4">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest">
                  RECOMMENDED
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Pro Developer</span>
                  <div className="text-2xl font-black text-white">₹2,499 / mo</div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Sub-110ms Groq LPU speed, 25 AI Roles, All 6 Multi-Connectors, and 500k tokens.
                  </p>

                  <div className="space-y-2 pt-2 border-t border-blue-500/20 text-xs text-zinc-200">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="font-semibold text-white">500,000 Monthly Tokens</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Up to 25 Active AI Roles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>All 6 Multi-Connectors Suite</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/pricing"
                  onClick={() => handleSelectPlan('Pro Developer')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity"
                >
                  <span>Select Pro Plan (UPI QR)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
