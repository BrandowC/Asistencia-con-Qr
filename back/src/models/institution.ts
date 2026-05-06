import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const InstitutionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    context: { type: String, enum: ['SENA', 'UNIVERSIDAD'], required: true },
    labels: {
      formador: { type: String, default: 'Formador' },
      aprendiz: { type: String, default: 'Aprendiz' },
      unidad: { type: String, default: 'Ficha' },
    },
    theme: {
      primary: { type: String, default: '#2563eb' },
      secondary: { type: String, default: '#0ea5e9' },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'institutions' },
);

export type Institution = InferSchemaType<typeof InstitutionSchema> & { _id: Schema.Types.ObjectId };
export const InstitutionModel: Model<Institution> = model<Institution>('Institution', InstitutionSchema);
