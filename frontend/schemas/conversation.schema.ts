import { z } from 'zod';
import { userPublicSchema } from './user.schema';
import { messageItemSchema } from './message.schema';

export const conversationListItemSchema = z.object({
  id: z.string().uuid(),
  is_group: z.boolean(),
  name: z.string().nullable().optional(),
  other_user: userPublicSchema.nullable().optional(),
  last_message: messageItemSchema.nullable().optional(),
  unread_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ConversationListItem = z.infer<typeof conversationListItemSchema>;
