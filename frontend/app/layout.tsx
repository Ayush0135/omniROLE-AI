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
  title: 'OmniRole AI - Specialized AI Expert Platform',
  description: 'Create, configure, test, and integrate specialized AI roles via REST API.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f0f17] text-amber-50 flex flex-col min-h-screen font-sans selection:bg-amber-500/20 selection:text-amber-200">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorPrimary: '#f59e0b',
              colorBackground: '#12121c',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'bg-[#12121c] border border-amber-500/15 shadow-2xl rounded-2xl p-6',
              headerTitle: 'text-amber-50 font-extrabold text-xl tracking-tight',
              headerSubtitle: 'text-stone-400 text-xs',
              socialButtonsBlockButton:
                'bg-[#1a1a28] hover:bg-[#222230] border border-amber-500/10 text-white text-xs font-semibold rounded-xl transition-colors',
              socialButtonsBlockButtonText: 'text-stone-200 font-semibold',
              formButtonPrimary:
                'bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all py-2.5',
              formFieldInput:
                'bg-[#1a1a28] border border-amber-500/10 text-stone-100 rounded-xl text-xs focus:border-amber-500/40 py-2 px-3',
              footerActionLink: 'text-amber-400 hover:text-amber-300 font-semibold',
              userButtonPopoverCard: 'bg-[#12121c] border border-amber-500/15 shadow-2xl rounded-2xl',
              userButtonPopoverActionButton: 'hover:bg-[#1a1a28] text-stone-200 text-xs font-medium',
              userButtonPopoverActionButtonText: 'text-stone-200',
              userButtonPopoverFooter: 'hidden',
            },
          }}
        >
          <RealtimeWebSocketProvider>
            <UserSync />
            <div className="flex flex-col min-h-screen">
              <AnnouncementBanner />
              <Navbar />
              <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 py-6 md:py-8">{children}</main>
              <Footer />
            </div>
          </RealtimeWebSocketProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
