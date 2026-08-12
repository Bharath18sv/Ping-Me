'use client';

import { useAppSelector } from '@/store';

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
}

export function TypingIndicator({ conversationId, currentUserId }: TypingIndicatorProps) {
  const typingMap = useAppSelector(
    (state) => state.presence.typingUsers[conversationId]
  );

  if (!typingMap) return null;

  // Filter user IDs where is_typing === true, excluding currentUserId defensively
  const typingUserIds = Object.keys(typingMap).filter(
    (userId) => userId !== currentUserId && typingMap[userId] === true
  );

  if (typingUserIds.length === 0) return null;

  return (
    <div className="px-4 py-1.5 text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 z-10 select-none">
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      <span>typing...</span>
    </div>
  );
}
