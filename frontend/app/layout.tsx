import './globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import RealtimeWebSocketProvider from '@/components/RealtimeWebSocketProvider';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'OmniRole AI — Specialized AI Roles for Real-World Work',
  description: 'Deploy domain-expert AI roles with live web search grounding, vector knowledge memory, and multimodal vision.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fafafa] text-slate-900 flex flex-col min-h-screen selection:bg-blue-500/20 selection:text-blue-900 antialiased font-sans">
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
