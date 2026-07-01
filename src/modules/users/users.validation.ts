import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
