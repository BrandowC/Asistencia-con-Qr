import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const SESSION_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED', 'EXPIRED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

const AttendanceSessionSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'AcademicUnit', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    status: { type: String, enum: SESSION_STATUSES, default: 'DRAFT', index: true },
    qrToken: { type: String, default: null },
    qrExpiresAt: { type: Date, default: null },
    roomCode: { type: String, default: null },
    roomCodeExpiresAt: { type: Date, default: null },
    activatedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'attendance_sessions' },
);

AttendanceSessionSchema.index(
  { qrToken: 1 },
  { unique: true, sparse: true, partialFilterExpression: { qrToken: { $type: 'string' } } },
);

export type AttendanceSession = InferSchemaType<typeof AttendanceSessionSchema> & { _id: Schema.Types.ObjectId };
export const AttendanceSessionModel: Model<AttendanceSession> = model<AttendanceSession>(
  'AttendanceSession',
  AttendanceSessionSchema,
);
