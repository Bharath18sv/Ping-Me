import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/constants/socket-events';
import { handleIncomingMessage, handleMessageRead } from '@/features/chat.slice';
import { setUserOnline, setUserOffline, setTypingStatus } from '@/features/presence.slice';
import { MessageItem } from '@/schemas/message.schema';

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    connectSocket();
    const socket = getSocket();

    const onMessageNew = (payload: MessageItem) => {
      dispatch(handleIncomingMessage(payload));
    };

    const onMessageRead = (payload: { conversation_id: string; message_ids: string[]; read_by: string }) => {
      dispatch(handleMessageRead(payload));
    };

    const onTyping = (payload: { conversation_id: string; user_id: string; is_typing: boolean }) => {
      dispatch(setTypingStatus(payload));
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
    socket.on(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
      socket.off(SOCKET_EVENTS.TYPING, onTyping);
      socket.off(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
    };
  }, [isAuthenticated, dispatch]);
};
