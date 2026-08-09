export const SOCKET_EVENTS = {
  // Client -> Server
  MESSAGE_SEND: 'message_send',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  CONVERSATION_READ: 'conversation_read',
  MESSAGE_DELIVERED: 'message_delivered',

  // Server -> Client
  MESSAGE_NEW: 'message_new',
  TYPING: 'typing',
  MESSAGE_READ: 'message_read',
  MESSAGES_DELIVERED: 'messages_delivered',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
