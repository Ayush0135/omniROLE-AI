import React from 'react';
import { SignIn } from '@clerk/nextjs';
import { Zap, ShieldCheck, Cpu, Globe } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="fixed inset-0 bg-[#07070a] flex items-center justify-center p-4 z-50 overflow-hidden font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-[#0d0d12] border border-[#22222e] shadow-2xl overflow-hidden min-h-[600px]">
        {/* Left Side: Branded Showcase */}
        <div className="p-8 bg-gradient-to-br from-[#0f111a] via-[#121424] to-[#0d0e17] border-r border-[#22222e] flex flex-col justify-between hidden md:flex relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                OmniRole <span className="text-blue-500">AI</span>
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                Enterprise Multi-Agent Platform
              </h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Deploy specialized AI expert personas with Grounded Web Search, Python Code REPL, pgvector RAG, and multi-model inference.
              </p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161826]/70 border border-[#282b3d] text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-300">Supabase PostgreSQL & Clerk Real-Time Sync</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161826]/70 border border-[#282b3d] text-xs">
              <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-zinc-300">Groq LPU (110ms) & Gemini 2.5 Flash Grid</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161826]/70 border border-[#282b3d] text-xs">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-zinc-300">Active Multi-Connectors Architecture</span>
            </div>
          </div>
        </div>

        {/* Right Side: Custom Styled Clerk Sign In */}
        <div className="p-6 md:p-8 flex items-center justify-center bg-[#0d0d12]">
          <SignIn />
        </div>
      </div>
    </div>
  );
}
