'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageItem as MessageItemType } from '@/schemas/message.schema';
import { MessageItem } from './MessageItem';
import { Loader2 } from 'lucide-react';

interface VirtualizedMessageListProps {
  messages: MessageItemType[];
  currentUserId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function VirtualizedMessageList({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  // Handle auto-scroll to bottom on initial load or new incoming messages
  useEffect(() => {
    if (!parentRef.current) return;

    const element = parentRef.current;
    if (isInitialLoadRef.current && messages.length > 0) {
      element.scrollTop = element.scrollHeight;
      isInitialLoadRef.current = false;
    } else if (messages.length > prevMessagesLengthRef.current) {
      // If user is near bottom, scroll down to show new message
      const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 200;
      if (isNearBottom) {
        element.scrollTop = element.scrollHeight;
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Handle Scroll to Top -> Trigger Cursor Pagination
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop } = parentRef.current;

    if (scrollTop < 80 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1 relative"
    >
      {isLoadingMore && (
        <div className="flex items-center justify-center py-2 text-indigo-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs ml-2">Loading older messages...</span>
        </div>
      )}

      {messages.length === 0 && !isLoadingMore && (
        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
          No messages yet. Say hello!
        </div>
      )}

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index];
          const isCurrentUser = message.sender_id === currentUserId;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageItem message={message} isCurrentUser={isCurrentUser} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
