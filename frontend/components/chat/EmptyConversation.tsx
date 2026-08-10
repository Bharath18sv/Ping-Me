'use client';

import { useState } from 'react';
import { MessageSquare, Plus, ShieldCheck, Zap } from 'lucide-react';
import { UserSearchModal } from '@/components/search/UserSearchModal';

export function EmptyConversation() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center select-none bg-[var(--background)]">
      <div className="max-w-sm flex flex-col items-center space-y-4">
        {/* Icon Badge */}
        <div className="p-4 rounded-2xl glass-card border border-[var(--border)] text-[var(--text-primary)] shadow-xs">
          <MessageSquare className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Your conversations will appear here
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Select an existing conversation from the sidebar or start a new chat with anyone on Ping-Me.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="py-2.5 px-4 rounded-xl btn-primary text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer transition-transform active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Start New Conversation</span>
        </button>

        {/* Feature Hints */}
        <div className="pt-8 grid grid-cols-2 gap-4 text-[11px] text-[var(--text-tertiary)] border-t border-[var(--border-muted)] w-full">
          <div className="flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Real-time Socket.IO</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HttpOnly Cookies</span>
          </div>
        </div>
      </div>

      <UserSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
