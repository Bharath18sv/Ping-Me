'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMessagesThunk } from '@/features/chat.slice';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { VirtualizedMessageList } from '@/components/chat/VirtualizedMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageSquare } from 'lucide-react';

export default function ChatDashboardPage() {
  const dispatch = useAppDispatch();
  const { activeConversationId, conversations, messages, pagination } = useAppSelector((state) => state.chat);
  const currentUser = useAppSelector((state) => state.auth.user);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const pageState = activeConversationId ? pagination[activeConversationId] : null;

  useEffect(() => {
    if (activeConversationId && (!messages[activeConversationId] || messages[activeConversationId].length === 0)) {
      dispatch(fetchMessagesThunk({ conversationId: activeConversationId }));
    }
  }, [activeConversationId, dispatch, messages]);

  const handleLoadMore = useCallback(() => {
    if (activeConversationId && pageState?.nextCursor && !pageState.isLoading) {
      dispatch(fetchMessagesThunk({ conversationId: activeConversationId, cursor: pageState.nextCursor }));
    }
  }, [activeConversationId, pageState, dispatch]);

  if (!activeConversationId || !activeConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="p-4 rounded-2xl bg-slate-200/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-300/50 dark:border-zinc-700 mb-3 shadow-xs">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Select a conversation</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mt-1">
          Choose a chat from the sidebar or click "New" to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatHeader conversation={activeConversation} />

      {currentUser && (
        <VirtualizedMessageList
          messages={activeMessages}
          currentUserId={currentUser.id}
          hasMore={pageState?.hasMore ?? false}
          isLoadingMore={pageState?.isLoading ?? false}
          onLoadMore={handleLoadMore}
        />
      )}

      <ChatInput conversationId={activeConversationId} />
    </div>
  );
}
