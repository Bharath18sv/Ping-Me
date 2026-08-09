'use client';

import { useEffect, use } from 'react';
import { useAppDispatch } from '@/store';
import { setActiveConversationId } from '@/features/chat.slice';
import ChatDashboardPage from '../page';

export default function ConversationRoutePage({ params }: { params: Promise<{ conversationId: string }> }) {
  const resolvedParams = use(params);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (resolvedParams.conversationId) {
      dispatch(setActiveConversationId(resolvedParams.conversationId));
    }
  }, [resolvedParams.conversationId, dispatch]);

  return <ChatDashboardPage />;
}
