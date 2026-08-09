'use client';

import { useAppSelector } from '@/store';
import { ConversationListItem } from '@/schemas/conversation.schema';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Menu } from 'lucide-react';

interface ChatHeaderProps {
  conversation: ConversationListItem;
  onToggleSidebar?: () => void;
}

export function ChatHeader({ conversation, onToggleSidebar }: ChatHeaderProps) {
  const onlineUsers = useAppSelector((state) => state.presence.onlineUserIds);
  const typingMap = useAppSelector((state) => state.presence.typingUsers[conversation.id]);

  const otherUser = conversation.other_user;
  const displayName = conversation.is_group
    ? conversation.name || 'Group Chat'
    : otherUser?.name || 'User';

  const isOnline = otherUser ? Boolean(onlineUsers[otherUser.id]) : false;

  // Check if anyone is typing
  const isTyping = typingMap ? Object.values(typingMap).some(Boolean) : false;

  return (
    <div className="h-16 px-6 glass-panel border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300/50 dark:border-zinc-700 flex items-center justify-center font-semibold text-xs shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#09090b] absolute bottom-0 right-0" />
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{displayName}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {isTyping ? (
              <span className="text-slate-900 dark:text-zinc-100 font-medium">typing...</span>
            ) : isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
