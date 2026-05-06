import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const RECORD_STATUSES = ['ACCEPTED', 'REJECTED'] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const REJECT_REASONS = [
  'NOT_FOUND',
  'NOT_ENROLLED',
  'DUPLICATE',
  'SESSION_CLOSED',
  'QR_EXPIRED',
  'INVALID_ROOM_CODE',
] as const;

const AttendanceRecordSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'AttendanceSession', required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'AcademicUnit', required: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person', default: null },
    documento: { type: String, required: true, trim: true, index: true },
    status: { type: String, enum: RECORD_STATUSES, required: true },
    rejectReason: { type: String, enum: REJECT_REASONS, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true, collection: 'attendance_records' },
);

AttendanceRecordSchema.index(
  { sessionId: 1, personId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACCEPTED', personId: { $type: 'objectId' } } },
);

export type AttendanceRecord = InferSchemaType<typeof AttendanceRecordSchema> & { _id: Schema.Types.ObjectId };
export const AttendanceRecordModel: Model<AttendanceRecord> = model<AttendanceRecord>(
  'AttendanceRecord',
  AttendanceRecordSchema,
);
