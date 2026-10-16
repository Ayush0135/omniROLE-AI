import './globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import RealtimeWebSocketProvider from '@/components/RealtimeWebSocketProvider';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'OmniRole AI — Autonomous AI Persona Studio',
  description: 'Design, configure, and orchestrate autonomous AI personas with live web search grounding, pgvector memory, and sub-110ms execution.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#04050d] text-slate-100 flex flex-col min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200 antialiased font-sans">
        <AuthProvider>
          <RealtimeWebSocketProvider>
            <div className="flex flex-col min-h-screen">
              <AnnouncementBanner />
              <Navbar />
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
              <Footer />
            </div>
          </RealtimeWebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
