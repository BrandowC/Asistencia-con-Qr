import { z } from 'zod';

export const ObjectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'ObjectId inválido');

export const CreateInstitutionSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120),
  context: z.enum(['SENA', 'UNIVERSIDAD']),
  labels: z
    .object({
      formador: z.string().min(2).max(40),
      aprendiz: z.string().min(2).max(40),
      unidad: z.string().min(2).max(40),
    })
    .partial()
    .optional(),
  theme: z
    .object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido'),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido'),
    })
    .partial()
    .optional(),
});

export const UpdateInstitutionSchema = CreateInstitutionSchema.partial().extend({
  active: z.boolean().optional(),
});

export const CreateUnitSchema = z.object({
  institutionId: ObjectIdSchema,
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  type: z.enum(['FICHA', 'MATERIA']),
  description: z.string().max(500).optional(),
});

export const UpdateUnitSchema = CreateUnitSchema.partial().extend({
  active: z.boolean().optional(),
});

export const CreatePersonSchema = z.object({
  institutionId: ObjectIdSchema,
  documento: z.string().min(2).max(40),
  nombre: z.string().min(2).max(120),
  matricula: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable(),
  password: z.string().min(4).max(100).optional(),
  roles: z
    .array(z.enum(['ADMIN', 'DOCENTE', 'INSTRUCTOR', 'ESTUDIANTE', 'APRENDIZ']))
    .min(1)
    .default(['ESTUDIANTE']),
  unitIds: z.array(ObjectIdSchema).optional(),
});

export const UpdatePersonSchema = CreatePersonSchema.partial().extend({
  active: z.boolean().optional(),
});

export const CreateEnrollmentSchema = z.object({
  unitId: ObjectIdSchema,
  personId: ObjectIdSchema,
});

export const IdParamSchema = z.object({ id: ObjectIdSchema });
