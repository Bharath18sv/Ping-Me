import { MessageItem } from '@/schemas/message.schema';

export interface ServerToClientEvents {
  message_new: (payload: MessageItem) => void;
  typing: (payload: { conversation_id: string; user_id: string; is_typing: boolean }) => void;
  message_read: (payload: { conversation_id: string; message_id: string; user_id: string }) => void;
  messages_delivered: (payload: { conversation_id: string; user_id: string }) => void;
  user_online: (payload: { user_id: string }) => void;
  user_offline: (payload: { user_id: string }) => void;
}

export interface ClientToServerEvents {
  message_send: (payload: { conversation_id: string; content: string; temp_id?: string }) => void;
  typing_start: (payload: { conversation_id: string }) => void;
  typing_stop: (payload: { conversation_id: string }) => void;
  conversation_read: (payload: { conversation_id: string }) => void;
  message_delivered: (payload: { message_id: string; conversation_id: string }) => void;
}
