'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMessagesThunk, clearUnreadCount } from '@/features/chat.slice';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { VirtualizedMessageList } from '@/components/chat/VirtualizedMessageList';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ChatInput } from '@/components/chat/ChatInput';
import { ConversationDetails } from '@/components/chat/ConversationDetails';
import { EmptyConversation } from '@/components/chat/EmptyConversation';
import { Sidebar } from '@/components/chat/Sidebar';
import { getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/constants/socket-events';

export default function ChatDashboardPage() {
  const dispatch = useAppDispatch();
  const { activeConversationId, conversations, messages, pagination } = useAppSelector((state) => state.chat);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const pageState = activeConversationId ? pagination[activeConversationId] : null;

  useEffect(() => {
    if (!activeConversationId) return;

    // Fetch history if not loaded yet for this conversation
    if (!pagination[activeConversationId]) {
      dispatch(fetchMessagesThunk({ conversationId: activeConversationId }));
    }

    // Clear unread count & inform backend of read status
    dispatch(clearUnreadCount(activeConversationId));
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.CONVERSATION_READ, { conversation_id: activeConversationId });
    }
  }, [activeConversationId, dispatch, pagination]);

  const handleLoadMore = useCallback(() => {
    if (activeConversationId && pageState?.nextCursor && !pageState.isLoading) {
      dispatch(fetchMessagesThunk({ conversationId: activeConversationId, cursor: pageState.nextCursor }));
    }
  }, [activeConversationId, pageState, dispatch]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--background)] relative">
      {/* Region 1: Conversations Sidebar */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectMobileConversation={() => setIsMobileSidebarOpen(false)}
      />

      {/* Region 2: Central Active Conversation Panel */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[var(--surface-panel)] relative overflow-hidden">
        {activeConversationId && activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              onToggleSidebar={() => setIsMobileSidebarOpen(true)}
              onToggleDetails={() => setIsDetailsOpen((prev) => !prev)}
              isDetailsOpen={isDetailsOpen}
            />

            {currentUser && (
              <VirtualizedMessageList
                messages={activeMessages}
                currentUserId={currentUser.id}
                hasMore={pageState?.hasMore ?? false}
                isLoadingMore={pageState?.isLoading ?? false}
                onLoadMore={handleLoadMore}
              />
            )}

            {currentUser && activeConversationId && (
              <TypingIndicator
                conversationId={activeConversationId}
                currentUserId={currentUser.id}
              />
            )}

            <ChatInput conversationId={activeConversationId} />
          </>
        ) : (
          <EmptyConversation />
        )}
      </main>

      {/* Region 3: Right Details & Profile Panel */}
      {activeConversationId && activeConversation && isDetailsOpen && (
        <ConversationDetails
          conversation={activeConversation}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
}
