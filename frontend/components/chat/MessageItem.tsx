"use client";

import { memo, useState, useRef, useEffect } from "react";
import { MessageItem as MessageItemType } from "@/schemas/message.schema";
import { formatDate } from "@/lib/utils";
import {
  CheckCheck,
  Clock,
  ChevronDown,
  Edit2,
  Trash2,
  Reply,
  Forward,
  Copy,
  Smile,
} from "lucide-react";
import { useAppDispatch } from "@/store";
import { editMessageThunk, deleteMessageThunk } from "@/features/chat.slice";
import { sendMessageSchema } from "@/schemas/message.schema";

interface MessageItemProps {
  message: MessageItemType;
  isCurrentUser: boolean;
}

export const MessageItem = memo(function MessageItem({
  message,
  isCurrentUser,
}: MessageItemProps) {
  const dispatch = useAppDispatch();
  const isOptimistic = Boolean(message.temp_id);
  const isDeleted = Boolean(message.is_deleted);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!menuPosition) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPosition(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPosition(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuPosition]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleOpenChevronMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: isCurrentUser ? Math.max(10, rect.right - 160) : rect.left,
      y: rect.bottom + 4,
    });
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDeleted || isOptimistic) return;
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleSaveEdit = () => {
    const validation = sendMessageSchema.safeParse({
      content: editContent.trim(),
    });
    if (!validation.success) return;

    if (editContent.trim() !== message.content) {
      dispatch(
        editMessageThunk({
          messageId: message.id,
          conversationId: message.conversation_id,
          content: editContent.trim(),
        })
      );
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setMenuPosition(null);
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    setMenuPosition(null);
    dispatch(
      deleteMessageThunk({
        messageId: message.id,
        conversationId: message.conversation_id,
      })
    );
  };

  return (
    <div
      className={`flex my-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        onContextMenu={handleContextMenu}
        className={`
          group relative
          max-w-[75%] md:max-w-[65%]
          px-3 py-2
          rounded-2xl
          text-sm leading-relaxed
          transition-opacity
          ${
            isCurrentUser
              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-xs shadow-xs"
              : "bg-white/90 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-bl-xs shadow-xs"
          }
          ${isOptimistic ? "opacity-70" : "opacity-100"}
        `}
      >
        {/* Hover Chevron Button */}
        {!isDeleted && !isOptimistic && (
          <button
            type="button"
            onClick={handleOpenChevronMenu}
            className={`
              absolute top-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full cursor-pointer
              ${
                isCurrentUser
                  ? "-left-7 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  : "-right-7 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }
            `}
            aria-label="Message options"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Content / Inline Edit */}
        {isEditing ? (
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <input
              ref={editInputRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              className="w-full py-1 px-2.5 rounded-lg glass-input text-sm text-[var(--text-primary)] focus:outline-none"
            />
            <div className="flex items-center justify-end gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2 py-0.5 rounded hover:underline cursor-pointer opacity-80"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="px-2 py-0.5 rounded bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold cursor-pointer disabled:opacity-40"
              >
                Save (Enter)
              </button>
            </div>
          </div>
        ) : isDeleted ? (
          <span className="italic text-[var(--text-tertiary)] opacity-80 select-none">
            This message was deleted
          </span>
        ) : (
          <span className="whitespace-pre-wrap break-words">
            {message.content}
          </span>
        )}

        {/* Timestamp & Status */}
        <span
          className={`
            inline-flex
            items-center
            gap-1
            ml-2
            align-baseline
            text-[10px]
            leading-none
            whitespace-nowrap
            ${
              isCurrentUser
                ? "text-slate-300 dark:text-zinc-500"
                : "text-slate-500 dark:text-zinc-400"
            }
          `}
        >
          {message.is_edited && !isDeleted && (
            <span className="italic opacity-80">(edited)</span>
          )}

          <span>{formatDate(message.created_at)}</span>

          {isCurrentUser &&
            (isOptimistic ? (
              <Clock className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3" />
            ))}
        </span>
      </div>

      {/* Context / Dropdown Menu Modal */}
      {menuPosition && (
        <div
          ref={menuRef}
          style={{ top: menuPosition.y, left: menuPosition.x }}
          className="fixed z-50 w-40 glass-panel border border-[var(--border)] rounded-xl shadow-xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {isCurrentUser && !isDeleted && (
            <>
              <button
                type="button"
                onClick={handleEditClick}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[var(--text-primary)] hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteClick}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-red-500 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="my-1 border-t border-[var(--border)]" />
            </>
          )}

          {/* Placeholders for future features */}
          <div className="opacity-40 pointer-events-none cursor-not-allowed">
            <button
              type="button"
              tabIndex={-1}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[var(--text-primary)]"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[var(--text-primary)]"
            >
              <Forward className="w-3.5 h-3.5" />
              <span>Forward</span>
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[var(--text-primary)]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[var(--text-primary)]"
            >
              <Smile className="w-3.5 h-3.5" />
              <span>React</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
