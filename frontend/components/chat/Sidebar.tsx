'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveConversationId, clearUnreadCount } from '@/features/chat.slice';
import { logoutThunk } from '@/features/auth.slice';
import { UserSearchModal } from '@/components/search/UserSearchModal';
import { MessageSquare, Plus, LogOut, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/constants/socket-events';

interface SidebarProps {
  onSelectMobileConversation?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  onSelectMobileConversation,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
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

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.CONVERSATION_READ, { conversation_id: convId });
    }

    if (onSelectMobileConversation) onSelectMobileConversation();
  };

  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 z-40 w-full md:w-80 lg:w-96 h-full glass-panel border-r border-[var(--border)] flex flex-col justify-between select-none transition-transform duration-200 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Ping-Me
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="py-1.5 px-3 rounded-xl btn-primary text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-[var(--icon-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--icon-muted)]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter chats..."
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-[var(--text-secondary)] font-medium">No conversations found</p>
            <p className="text-[11px] text-[var(--text-tertiary)] max-w-xs mx-auto">
              Click "New" above to search for users and start a chat.
            </p>
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
                  ? 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-primary)] font-medium shadow-xs'
                  : 'hover:bg-[var(--surface-muted)] border-transparent text-[var(--text-secondary)]'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border-muted)] flex items-center justify-center font-semibold text-xs shadow-xs">
                  {name.charAt(0).toUpperCase()}
                </div>
                {isOnline && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--background)] absolute bottom-0 right-0" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold truncate text-[var(--text-primary)]">{name}</h3>
                  {conv.last_message && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {formatDate(conv.last_message.created_at)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {conv.last_message ? conv.last_message.content : 'No messages yet'}
                  </p>

                  {conv.unread_count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold">
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
        <div className="p-3 glass-panel border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-semibold text-xs flex-shrink-0 shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">{currentUser.name}</h4>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">@{currentUser.username}</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(logoutThunk())}
            title="Log out"
            className="p-1.5 rounded-lg text-[var(--icon-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
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
