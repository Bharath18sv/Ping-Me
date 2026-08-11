'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, X, UserPlus, Loader2 } from 'lucide-react';
import { UserPublic } from '@/schemas/user.schema';
import { userService } from '@/services/user.service';
import { chatService } from '@/services/chat.service';
import { useAppDispatch } from '@/store';
import { addConversation, setActiveConversationId } from '@/features/chat.slice';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserPublic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);

  const cancelTokenRef = useRef<any>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      // Cancel previous request if pending
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Stale search request');
      }
      cancelTokenRef.current = axios.CancelToken.source();

      try {
        const users = await userService.searchUsers(query, cancelTokenRef.current.token);
        setResults(users);
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          console.error('Search failed:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  if (!isOpen) return null;

  const handleStartChat = async (user: UserPublic) => {
    setCreatingUserId(user.id);
    try {
      const conv = await chatService.createConversation(user.id);
      dispatch(addConversation(conv));
      dispatch(setActiveConversationId(conv.id));
      onClose();
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setCreatingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md p-6 rounded-2xl glass-card border border-[var(--border)] shadow-2xl backdrop-blur-xl relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--icon-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--icon-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-primary)] animate-spin" />
          )}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {query.trim().length >= 2 && results.length === 0 && !isSearching && (
            <p className="text-xs text-center text-[var(--text-secondary)] font-medium py-6">No users found</p>
          )}

          {query.trim().length < 2 && (
            <p className="text-xs text-center text-[var(--text-tertiary)] font-medium py-4">Type at least 2 characters to search</p>
          )}

          {results.map((user) => (
            <div
              key={user.id}
              onClick={() => handleStartChat(user)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface-muted)] transition-colors border border-transparent hover:border-[var(--border-muted)] cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name}</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">@{user.username}</p>
                </div>
              </div>

              <button
                disabled={creatingUserId === user.id}
                className="px-3 py-1.5 rounded-xl btn-primary transition-all text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {creatingUserId === user.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
