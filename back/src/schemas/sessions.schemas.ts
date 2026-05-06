import { z } from 'zod';

const ObjectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'ObjectId inválido');

export const CreateSessionSchema = z.object({
  institutionId: ObjectIdSchema,
  unitId: ObjectIdSchema,
  qrTtlMinutes: z.number().int().min(1).max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const SessionIdParamsSchema = z.object({
  sessionId: ObjectIdSchema,
});

export const TokenParamsSchema = z.object({
  token: z.string().min(8).max(120),
});

export const PublicRegisterSchema = z.object({
  documento: z.string().min(3).max(40),
  roomCode: z.string().min(3).max(10).optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type PublicRegisterInput = z.infer<typeof PublicRegisterSchema>;
