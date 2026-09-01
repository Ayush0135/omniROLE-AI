'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Sparkles, Bell, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: any;
  sendJson: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastEvent: null,
  sendJson: () => {},
});

export const useWebSocketStream = () => useContext(WebSocketContext);

export default function RealtimeWebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  useEffect(() => {
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'anonymous';
    const clientType = window.location.pathname.startsWith('/admin') ? 'admin' : 'user';
    const wsUrl = `ws://localhost:8000/ws/live?client_type=${clientType}&user_id=${encodeURIComponent(userEmail)}`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWs = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          console.log(`⚡ WebSocket Connected (${clientType})`);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastEvent(data);

            if (data.event === 'PAYMENT_APPROVED') {
              if (data.data?.user_email === userEmail || clientType === 'admin') {
                addToast('🎉 Payment Approved!', `Subscription tier upgraded to ${data.data?.plan_name || 'Pro Developer'}.`, 'success');
              }
            } else if (data.event === 'NEW_PAYMENT_SUBMITTED') {
              if (clientType === 'admin') {
                addToast('🔔 New Payment UTR', `Payment submitted by ${data.data?.user_email} (₹${data.data?.amount_inr}).`, 'info');
              }
            } else if (data.event === 'PAYMENT_REJECTED') {
              if (data.data?.user_email === userEmail) {
                addToast('❌ Payment Rejected', 'Your transaction UTR could not be verified. Please check UTR details.', 'warning');
              }
            } else if (data.event === 'ANNOUNCEMENT_PUBLISHED') {
              addToast('📢 Platform Update', data.data?.title || 'New announcement published.', 'info');
            }
          } catch (err) {
            console.error('WebSocket parse error:', err);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        socket.onerror = (err) => {
          setIsConnected(false);
        };
      } catch (e) {
        setIsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, [user, isLoaded]);

  const sendJson = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, sendJson }}>
      {children}

      {/* Floating Real-Time Notifications Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-100'
                : 'bg-blue-950/90 border-blue-500/50 text-blue-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Bell className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <h4 className="text-xs font-extrabold text-white">{toast.title}</h4>
              <p className="text-[11px] opacity-90 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </WebSocketContext.Provider>
  );
}
