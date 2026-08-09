import { z } from 'zod';

export const messageItemSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string(),
  is_edited: z.boolean(),
  edited_at: z.string().nullable().optional(),
  is_deleted: z.boolean(),
  deleted_at: z.string().nullable().optional(),
  created_at: z.string(),
  temp_id: z.string().optional(), // for optimistic updates
});

export type MessageItem = z.infer<typeof messageItemSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
