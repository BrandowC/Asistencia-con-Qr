import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const AcademicUnitSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['FICHA', 'MATERIA'], required: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'academic_units' },
);

AcademicUnitSchema.index({ institutionId: 1, code: 1 }, { unique: true });

export type AcademicUnit = InferSchemaType<typeof AcademicUnitSchema> & { _id: Schema.Types.ObjectId };
export const AcademicUnitModel: Model<AcademicUnit> = model<AcademicUnit>('AcademicUnit', AcademicUnitSchema);
