'use client';

import { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { sendMessageThunk } from '@/features/chat.slice';
import { getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/constants/socket-events';
import { sendMessageSchema } from '@/schemas/message.schema';

interface ChatInputProps {
  conversationId: string;
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.TYPING_START, { conversation_id: conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversation_id: conversationId });
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    const validation = sendMessageSchema.safeParse({ content: content.trim() });
    if (!validation.success) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    dispatch(
      sendMessageThunk({
        conversationId,
        content: content.trim(),
        tempId,
        currentUserId: currentUser.id,
      })
    );

    setContent('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      getSocket().emit(SOCKET_EVENTS.TYPING_STOP, { conversation_id: conversationId });
    }
  };

  return (
    <form onSubmit={handleSend} className="p-4 glass-panel border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-3">
      <button
        type="button"
        className="p-2.5 rounded-xl glass-input text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
      >
        <Smile className="w-5 h-5" />
      </button>

      <input
        type="text"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          handleTyping();
        }}
        placeholder="Type a message..."
        className="flex-1 py-2.5 px-4 rounded-xl glass-input text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
      />

      <button
        type="submit"
        disabled={!content.trim()}
        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
