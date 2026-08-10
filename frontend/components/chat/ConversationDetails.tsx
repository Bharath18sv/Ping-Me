'use client';

import { useState } from 'react';
import { ConversationListItem } from '@/schemas/conversation.schema';
import { useAppSelector } from '@/store';
import { X, Bell, Search, Shield, Image as ImageIcon, FileText, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ConversationDetailsProps {
  conversation: ConversationListItem;
  onClose: () => void;
}

export function ConversationDetails({ conversation, onClose }: ConversationDetailsProps) {
  const onlineUsers = useAppSelector((state) => state.presence.onlineUserIds);
  const [activeTab, setActiveTab] = useState<'media' | 'files'>('media');

  const otherUser = conversation.other_user;
  const displayName = conversation.is_group
    ? conversation.name || 'Group Conversation'
    : otherUser?.name || 'User Profile';

  const username = otherUser?.username ? `@${otherUser.username}` : 'group';
  const isOnline = otherUser ? Boolean(onlineUsers[otherUser.id]) : false;

  return (
    <aside className="w-80 h-full glass-panel border-l border-[var(--border)] flex flex-col justify-between select-none z-20 transition-all duration-200">
      {/* Header */}
      <div className="h-16 px-5 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--icon-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
          aria-label="Close details panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Details Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] flex items-center justify-center font-bold text-2xl shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {isOnline && (
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--background)] absolute bottom-0 right-1" />
            )}
          </div>

          <div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">{displayName}</h4>
            <p className="text-xs text-[var(--text-secondary)]">{username}</p>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {isOnline ? 'Active now' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-muted)]">
          <button className="p-2.5 rounded-xl glass-input text-xs font-medium text-[var(--text-primary)] flex flex-col items-center gap-1.5 hover:bg-[var(--surface-muted)] transition-colors cursor-pointer">
            <Bell className="w-4 h-4 text-[var(--icon-muted)]" />
            <span>Mute</span>
          </button>
          <button className="p-2.5 rounded-xl glass-input text-xs font-medium text-[var(--text-primary)] flex flex-col items-center gap-1.5 hover:bg-[var(--surface-muted)] transition-colors cursor-pointer">
            <Search className="w-4 h-4 text-[var(--icon-muted)]" />
            <span>Search</span>
          </button>
        </div>

        {/* Shared Media & Files Section */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-muted)]">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span>Shared Content</span>
            <div className="flex bg-[var(--surface-muted)] p-0.5 rounded-lg border border-[var(--border)]">
              <button
                onClick={() => setActiveTab('media')}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  activeTab === 'media'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  activeTab === 'files'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Files
              </button>
            </div>
          </div>

          {activeTab === 'media' ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-lg bg-[var(--surface-muted)] border border-[var(--border-muted)] flex items-center justify-center text-[var(--icon-muted)]">
                <ImageIcon className="w-5 h-5 opacity-40" />
              </div>
              <div className="aspect-square rounded-lg bg-[var(--surface-muted)] border border-[var(--border-muted)] flex items-center justify-center text-[var(--icon-muted)]">
                <ImageIcon className="w-5 h-5 opacity-40" />
              </div>
              <div className="aspect-square rounded-lg bg-[var(--surface-muted)] border border-[var(--border-muted)] flex items-center justify-center text-[var(--icon-muted)]">
                <ImageIcon className="w-5 h-5 opacity-40" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl glass-input flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[var(--icon-muted)] flex-shrink-0" />
                  <span className="truncate text-[var(--text-primary)]">document.pdf</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--icon-muted)] flex-shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* Security & Info Footer */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-muted)] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
            <Shield className="w-4 h-4 text-[var(--icon-muted)]" />
            <span>Encrypted Session</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            HttpOnly cookie authentication with real-time WebSocket sync.
          </p>
          <div className="text-[10px] text-[var(--text-tertiary)] pt-1">
            Created: {formatDate(conversation.updated_at)}
          </div>
        </div>
      </div>
    </aside>
  );
}
