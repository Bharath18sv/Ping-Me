'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMeThunk } from '@/features/auth.slice';
import { fetchConversationsThunk } from '@/features/chat.slice';
import { useSocket } from '@/hooks/useSocket';
import { Sidebar } from '@/components/chat/Sidebar';
import { Loader2 } from 'lucide-react';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);

  // Initialize Socket.IO event listeners
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100">
        <Loader2 className="w-7 h-7 animate-spin mb-2" />
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Loading Ping-Me...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#09090b] text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full bg-slate-100/50 dark:bg-zinc-950/40 relative">
        {children}
      </main>
    </div>
  );
}
