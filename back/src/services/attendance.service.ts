import { AttendanceSessionModel } from '../models/attendance-session.js';
import { AttendanceRecordModel } from '../models/attendance-record.js';
import { EnrollmentModel } from '../models/enrollment.js';
import { PersonModel } from '../models/person.js';
import { BadRequest, Gone, NotFound } from '../lib/http-errors.js';

interface RegisterParams {
  token: string;
  documento: string;
  roomCode?: string;
  ip?: string | null;
  userAgent?: string | null;
}

export async function registerByQrToken(params: RegisterParams) {
  const session = await AttendanceSessionModel.findOne({ qrToken: params.token });
  if (!session) throw NotFound('Sesión no encontrada para el token QR.');

  if (session.status !== 'ACTIVE') {
    await recordRejection({ session, ...params, reason: 'SESSION_CLOSED' });
    throw Gone('La sesión no está activa.');
  }

  if (session.qrExpiresAt && session.qrExpiresAt.getTime() <= Date.now()) {
    session.status = 'EXPIRED';
    await session.save();
    await recordRejection({ session, ...params, reason: 'QR_EXPIRED' });
    throw Gone('El QR ha expirado.');
  }

  const person = await PersonModel.findOne({
    institutionId: session.institutionId,
    documento: params.documento,
    active: true,
  });

  if (!person) {
    await AttendanceRecordModel.create({
      sessionId: session._id,
      institutionId: session.institutionId,
      unitId: session.unitId,
      documento: params.documento,
      status: 'REJECTED',
      rejectReason: 'NOT_FOUND',
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });
    throw BadRequest('Documento no registrado en la institución.');
  }

  const enrolled = await EnrollmentModel.exists({ unitId: session.unitId, personId: person._id, active: true });
  if (!enrolled) {
    await AttendanceRecordModel.create({
      sessionId: session._id,
      institutionId: session.institutionId,
      unitId: session.unitId,
      personId: person._id,
      documento: person.documento,
      status: 'REJECTED',
      rejectReason: 'NOT_ENROLLED',
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });
    throw BadRequest('La persona no está inscrita en esta unidad académica.');
  }

  const existing = await AttendanceRecordModel.findOne({
    sessionId: session._id,
    personId: person._id,
    status: 'ACCEPTED',
  });
  if (existing) {
    await AttendanceRecordModel.create({
      sessionId: session._id,
      institutionId: session.institutionId,
      unitId: session.unitId,
      personId: person._id,
      documento: person.documento,
      status: 'REJECTED',
      rejectReason: 'DUPLICATE',
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });
    throw BadRequest('La asistencia ya fue registrada anteriormente.');
  }

  const record = await AttendanceRecordModel.create({
    sessionId: session._id,
    institutionId: session.institutionId,
    unitId: session.unitId,
    personId: person._id,
    documento: person.documento,
    status: 'ACCEPTED',
    ip: params.ip ?? null,
    userAgent: params.userAgent ?? null,
  });

  return {
    id: String(record._id),
    documento: person.documento,
    nombre: person.nombre,
    sessionId: String(session._id),
    registeredAt: record.createdAt,
  };
}

async function recordRejection(args: {
  session: { _id: unknown; institutionId: unknown; unitId: unknown };
  documento: string;
  ip?: string | null;
  userAgent?: string | null;
  reason: string;
}) {
  await AttendanceRecordModel.create({
    sessionId: args.session._id,
    institutionId: args.session.institutionId,
    unitId: args.session.unitId,
    documento: args.documento,
    status: 'REJECTED',
    rejectReason: args.reason,
    ip: args.ip ?? null,
    userAgent: args.userAgent ?? null,
  });
}

export async function getPublicSessionView(token: string) {
  const session = await AttendanceSessionModel.findOne({ qrToken: token });
  if (!session) throw NotFound('Sesión no encontrada.');
  return {
    id: String(session._id),
    status: session.status,
    qrExpiresAt: session.qrExpiresAt,
    unitId: String(session.unitId),
    institutionId: String(session.institutionId),
  };
}
