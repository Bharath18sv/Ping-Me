'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
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

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-4 glass-panel border-t border-[var(--border)] flex items-center gap-2.5 z-10"
    >
      <button
        type="button"
        className="p-2.5 rounded-xl glass-input text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        aria-label="Add attachment"
      >
        <Paperclip className="w-4 h-4" />
      </button>

      <button
        type="button"
        className="p-2.5 rounded-xl glass-input text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer hidden sm:flex"
        aria-label="Add emoji"
      >
        <Smile className="w-4 h-4" />
      </button>

      <input
        type="text"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          handleTyping();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 py-2.5 px-4 rounded-xl glass-input text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
      />

      <button
        type="submit"
        disabled={!content.trim()}
        className="py-2.5 px-4 rounded-xl btn-primary font-medium text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 transition-all active:scale-98"
        aria-label="Send message"
      >
        <span>Send</span>
        <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
