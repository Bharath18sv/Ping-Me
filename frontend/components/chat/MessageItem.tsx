"use client";

import { memo } from "react";
import { MessageItem as MessageItemType } from "@/schemas/message.schema";
import { formatDate } from "@/lib/utils";
import { CheckCheck, Clock } from "lucide-react";

interface MessageItemProps {
  message: MessageItemType;
  isCurrentUser: boolean;
}

export const MessageItem = memo(function MessageItem({
  message,
  isCurrentUser,
}: MessageItemProps) {
  const isOptimistic = Boolean(message.temp_id);

  return (
    <div
      className={`flex my-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
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
        <span className="whitespace-pre-wrap break-words">
          {message.content}
        </span>

        <span
          className={`
            inline-flex
            items-center
            gap-0.5
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
          <span>{formatDate(message.created_at)}</span>

          {isCurrentUser &&
            (isOptimistic ? (
              <Clock className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3" />
            ))}
        </span>
      </div>
    </div>
  );
});
