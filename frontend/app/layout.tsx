import './globals.css';
import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Navbar } from '@/components/Navbar';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import UserSync from '@/components/UserSync';

import RealtimeWebSocketProvider from '@/components/RealtimeWebSocketProvider';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'OmniRole AI - Autonomous Multi-Agent Studio',
  description: 'Design, configure, and orchestrate autonomous AI personas with live grounding and sub-110ms execution.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#04050d] text-slate-100 flex flex-col min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorPrimary: '#6366f1',
              colorBackground: '#0a0d1a',
              borderRadius: '0.85rem',
            },
            elements: {
              card: 'bg-[#0a0d1a] border border-indigo-500/20 shadow-2xl rounded-2xl p-6',
              headerTitle: 'text-white font-extrabold text-xl tracking-tight',
              headerSubtitle: 'text-slate-400 text-xs',
              socialButtonsBlockButton:
                'bg-[#121629] hover:bg-[#1a2038] border border-indigo-500/20 text-white text-xs font-semibold rounded-xl transition-colors',
              socialButtonsBlockButtonText: 'text-slate-200 font-semibold',
              formButtonPrimary:
                'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all py-2.5',
              formFieldInput:
                'bg-[#121629] border border-indigo-500/20 text-slate-100 rounded-xl text-xs focus:border-indigo-500/50 py-2 px-3',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-semibold',
              userButtonPopoverCard: 'bg-[#0a0d1a] border border-indigo-500/20 shadow-2xl rounded-2xl',
              userButtonPopoverActionButton: 'hover:bg-[#121629] text-slate-200 text-xs font-medium',
              userButtonPopoverActionButtonText: 'text-slate-200',
              userButtonPopoverFooter: 'hidden',
            },
          }}
        >
          <RealtimeWebSocketProvider>
            <UserSync />
            <div className="flex flex-col min-h-screen">
              <AnnouncementBanner />
              <Navbar />
              <main className="flex-1 w-full max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-8">{children}</main>
              <Footer />
            </div>
          </RealtimeWebSocketProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
