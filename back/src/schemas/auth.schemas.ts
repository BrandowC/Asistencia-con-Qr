import { z } from 'zod';

export const LoginSchema = z.object({
  documento: z.string().min(3).max(40),
  password: z.string().min(4).max(100),
  institutionCode: z.string().min(2).max(20).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
