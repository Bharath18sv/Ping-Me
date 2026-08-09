'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveConversationId, clearUnreadCount } from '@/features/chat.slice';
import { logout } from '@/features/auth.slice';
import { UserSearchModal } from '@/components/search/UserSearchModal';
import { MessageSquare, Plus, LogOut, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const { conversations, activeConversationId } = useAppSelector((state) => state.chat);
  const currentUser = useAppSelector((state) => state.auth.user);
  const onlineUsers = useAppSelector((state) => state.presence.onlineUserIds);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.is_group ? conv.name : conv.other_user?.name;
    return name?.toLowerCase().includes(filterQuery.toLowerCase());
  });

  const handleSelectConversation = (convId: string) => {
    dispatch(setActiveConversationId(convId));
    dispatch(clearUnreadCount(convId));
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full glass-panel border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Ping-Me
            </h1>
          </div>

          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter chats..."
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 && (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs font-medium">
            No conversations found
          </div>
        )}

        {filteredConversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          const otherUser = conv.other_user;
          const name = conv.is_group ? conv.name || 'Group' : otherUser?.name || 'User';
          const isOnline = otherUser ? Boolean(onlineUsers[otherUser.id]) : false;

          return (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors border ${
                isActive
                  ? 'bg-slate-200/80 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-medium shadow-xs'
                  : 'hover:bg-slate-200/50 dark:hover:bg-zinc-800/40 border-transparent text-slate-700 dark:text-zinc-300'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300/50 dark:border-zinc-700 flex items-center justify-center font-semibold text-xs shadow-xs">
                  {name.charAt(0).toUpperCase()}
                </div>
                {isOnline && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#09090b] absolute bottom-0 right-0" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold truncate text-slate-900 dark:text-zinc-100">{name}</h3>
                  {conv.last_message && (
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {formatDate(conv.last_message.created_at)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                    {conv.last_message ? conv.last_message.content : 'No messages yet'}
                  </p>

                  {conv.unread_count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      {currentUser && (
        <div className="p-3 glass-panel border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-semibold text-xs flex-shrink-0 shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{currentUser.name}</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">@{currentUser.username}</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(logout())}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search User Modal */}
      <UserSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </aside>
  );
}
