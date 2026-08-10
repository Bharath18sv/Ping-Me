'use client';

import { useAppSelector } from '@/store';
import { ConversationListItem } from '@/schemas/conversation.schema';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Menu, Info, Search } from 'lucide-react';

interface ChatHeaderProps {
  conversation: ConversationListItem;
  onToggleSidebar?: () => void;
  onToggleDetails?: () => void;
  isDetailsOpen?: boolean;
}

export function ChatHeader({
  conversation,
  onToggleSidebar,
  onToggleDetails,
  isDetailsOpen,
}: ChatHeaderProps) {
  const onlineUsers = useAppSelector((state) => state.presence.onlineUserIds);
  const typingMap = useAppSelector((state) => state.presence.typingUsers[conversation.id]);

  const otherUser = conversation.other_user;
  const displayName = conversation.is_group
    ? conversation.name || 'Group Chat'
    : otherUser?.name || 'User';

  const isOnline = otherUser ? Boolean(onlineUsers[otherUser.id]) : false;
  const isTyping = typingMap ? Object.values(typingMap).some(Boolean) : false;

  return (
    <div className="h-16 px-6 glass-panel border-b border-[var(--border)] flex items-center justify-between z-10 select-none">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-[var(--icon-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] flex items-center justify-center font-semibold text-xs shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--background)] absolute bottom-0 right-0" />
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{displayName}</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            {isTyping ? (
              <span className="text-[var(--text-primary)] font-medium animate-pulse">typing...</span>
            ) : isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          className="p-2 rounded-xl glass-card text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label="Search conversation"
        >
          <Search className="w-4 h-4" />
        </button>

        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDetailsOpen
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'glass-card text-[var(--icon-muted)] hover:text-[var(--text-primary)]'
            }`}
            aria-label="Toggle details panel"
          >
            <Info className="w-4 h-4" />
          </button>
        )}

        <ThemeToggle />
      </div>
    </div>
  );
}
