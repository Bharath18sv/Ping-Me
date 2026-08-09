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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 rounded-2xl glass-card border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl backdrop-blur-xl relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-zinc-100 animate-spin" />
          )}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {query.trim().length >= 2 && results.length === 0 && !isSearching && (
            <p className="text-xs text-center text-slate-500 dark:text-zinc-400 py-6">No users found</p>
          )}

          {query.trim().length < 2 && (
            <p className="text-xs text-center text-slate-400 dark:text-zinc-500 py-4">Type at least 2 characters to search</p>
          )}

          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-800/40 transition-colors border border-transparent cursor-pointer"
              onClick={() => handleStartChat(user)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300/50 dark:border-zinc-700 flex items-center justify-center font-semibold text-xs shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">{user.name}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">@{user.username}</p>
                </div>
              </div>

              <button
                disabled={creatingUserId === user.id}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-xs"
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
