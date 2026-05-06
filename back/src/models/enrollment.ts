import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const EnrollmentSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'AcademicUnit', required: true, index: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'enrollments' },
);

EnrollmentSchema.index({ unitId: 1, personId: 1 }, { unique: true });

export type Enrollment = InferSchemaType<typeof EnrollmentSchema> & { _id: Schema.Types.ObjectId };
export const EnrollmentModel: Model<Enrollment> = model<Enrollment>('Enrollment', EnrollmentSchema);
