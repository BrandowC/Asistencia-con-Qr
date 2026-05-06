import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const ROLES = ['ADMIN', 'DOCENTE', 'INSTRUCTOR', 'ESTUDIANTE', 'APRENDIZ'] as const;
export type Role = (typeof ROLES)[number];

const PersonSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    documento: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    matricula: { type: String, default: null, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    passwordHash: { type: String, default: null, select: false },
    roles: { type: [String], enum: ROLES, default: ['ESTUDIANTE'] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'people' },
);

PersonSchema.index({ institutionId: 1, documento: 1 }, { unique: true });

export type Person = InferSchemaType<typeof PersonSchema> & { _id: Schema.Types.ObjectId };
export const PersonModel: Model<Person> = model<Person>('Person', PersonSchema);
