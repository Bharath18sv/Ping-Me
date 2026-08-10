'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMeThunk } from '@/features/auth.slice';
import { fetchConversationsThunk } from '@/features/chat.slice';
import { useSocket } from '@/hooks/useSocket';
import { Loader2, MessageSquare } from 'lucide-react';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);

  // Initialize Socket.IO real-time event listeners
  useSocket();

  useEffect(() => {
    dispatch(fetchMeThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      dispatch(fetchConversationsThunk());
    }
  }, [isInitializing, isAuthenticated, router, dispatch]);

  if (isInitializing) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] select-none">
        <div className="p-3.5 rounded-2xl glass-card border border-[var(--border)] mb-3 shadow-xs animate-pulse">
          <MessageSquare className="w-6 h-6 text-[var(--text-primary)]" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Connecting to Ping-Me...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
      {children}
    </div>
  );
}
