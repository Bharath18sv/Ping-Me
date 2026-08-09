import { z } from 'zod';

export const userPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
});

export type UserPublic = z.infer<typeof userPublicSchema>;

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  email: z.string().email(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
