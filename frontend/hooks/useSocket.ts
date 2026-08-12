import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants/socket-events";
import {
  handleIncomingMessage,
  handleMessageRead,
} from "@/features/chat.slice";
import {
  setUserOnline,
  setUserOffline,
  setTypingStatus,
  setOnlineUsers,
} from "@/features/presence.slice";
import { MessageItem } from "@/schemas/message.schema";

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    connectSocket();
    const socket = getSocket();

    // message events
    const onMessageNew = (payload: MessageItem) => {
      dispatch(handleIncomingMessage(payload));
    };

    const onMessageRead = (payload: {
      conversation_id: string;
      message_ids: string[];
      read_by: string;
    }) => {
      dispatch(handleMessageRead(payload));
    };

    // typing with stale safety net
    const onTyping = (payload: {
      conversation_id: string;
      user_id: string;
      is_typing: boolean;
    }) => {
      dispatch(setTypingStatus(payload));

      const key = `${payload.conversation_id}:${payload.user_id}`;
      if (typingTimeoutsRef.current.has(key)) {
        clearTimeout(typingTimeoutsRef.current.get(key)!);
        typingTimeoutsRef.current.delete(key);
      }

      if (payload.is_typing) {
        const timeout = setTimeout(() => {
          dispatch(
            setTypingStatus({
              conversation_id: payload.conversation_id,
              user_id: payload.user_id,
              is_typing: false,
            }),
          );
          typingTimeoutsRef.current.delete(key);
        }, 5000);
        typingTimeoutsRef.current.set(key, timeout);
      }
    };

    // presence
    const onPresenceSync = (payload: { user_ids: string[] }) => {
      dispatch(setOnlineUsers(payload.user_ids));
    };

    const onUserOnline = (payload: { user_id: string }) => {
      dispatch(setUserOnline(payload));
    };

    const onUserOffline = (payload: { user_id: string }) => {
      dispatch(setUserOffline(payload));
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
    socket.on(SOCKET_EVENTS.TYPING, onTyping);
    socket.on(SOCKET_EVENTS.PRESENCE_SYNC, onPresenceSync);
    socket.on(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);

    return () => {
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();

      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
      socket.off(SOCKET_EVENTS.TYPING, onTyping);
      socket.off(SOCKET_EVENTS.PRESENCE_SYNC, onPresenceSync);
      socket.off(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
    };
  }, [isAuthenticated, dispatch]);
};
