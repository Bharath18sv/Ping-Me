export const SOCKET_EVENTS = {
  // Client -> Server
  MESSAGE_SEND: "message_send",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  CONVERSATION_READ: "conversation_read",
  MESSAGE_DELIVERED: "message_delivered",

  // Server -> Client
  MESSAGE_NEW: "message_new",
  MESSAGE_UPDATED: "message_updated",
  MESSAGE_DELETED: "message_deleted",
  CONVERSATION_NEW: "conversation_new",
  TYPING: "typing",
  MESSAGE_READ: "message_read",
  MESSAGES_DELIVERED: "messages_delivered",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  PRESENCE_SYNC: "presence_sync",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
