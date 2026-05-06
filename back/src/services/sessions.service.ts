import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import QRCode from 'qrcode';
import { env } from '../config/env.js';
import { AcademicUnitModel } from '../models/academic-unit.js';
import { AttendanceRecordModel } from '../models/attendance-record.js';
import { AttendanceSessionModel, type SessionStatus } from '../models/attendance-session.js';
import { EnrollmentModel } from '../models/enrollment.js';
import { PersonModel } from '../models/person.js';
import { Conflict, NotFound } from '../lib/http-errors.js';
import { generateRoomCode, roomCodeExpiresAt } from '../lib/room-code.js';
import type { CreateSessionInput } from '../schemas/sessions.schemas.js';

export async function createSession(input: CreateSessionInput, createdBy: string) {
  const unit = await AcademicUnitModel.findOne({
    _id: input.unitId,
    institutionId: input.institutionId,
    active: true,
  });
  if (!unit) throw NotFound('Unidad académica no encontrada.');

  const session = await AttendanceSessionModel.create({
    institutionId: input.institutionId,
    unitId: input.unitId,
    createdBy,
    status: 'DRAFT',
    notes: input.notes ?? '',
  });

  return serializeSession(session);
}

export async function activateSession(sessionId: string, qrTtlMinutes?: number) {
  const session = await AttendanceSessionModel.findById(sessionId);
  if (!session) throw NotFound('Sesión no encontrada.');
  if (session.status === 'CLOSED' || session.status === 'EXPIRED') {
    throw Conflict('La sesión ya está cerrada o expirada.');
  }

  const ttl = qrTtlMinutes ?? env.QR_DEFAULT_TTL_MINUTES;
  const now = new Date();
  session.status = 'ACTIVE';
  session.qrToken = randomUUID();
  session.qrExpiresAt = new Date(now.getTime() + ttl * 60 * 1000);
  session.roomCode = generateRoomCode();
  session.roomCodeExpiresAt = roomCodeExpiresAt(now);
  session.activatedAt = now;
  await session.save();

  const publicUrl = `${env.PUBLIC_BASE_URL}/attendance/${session.qrToken}`;
  const qrPng = await QRCode.toDataURL(publicUrl, { errorCorrectionLevel: 'M', margin: 1, width: 320 });

  return { ...serializeSession(session), qrUrl: publicUrl, qrPng };
}

export async function rotateRoomCode(sessionId: string) {
  const session = await AttendanceSessionModel.findById(sessionId);
  if (!session) throw NotFound('Sesión no encontrada.');
  if (session.status !== 'ACTIVE') throw Conflict('La sesión no está activa.');

  const now = new Date();
  session.roomCode = generateRoomCode();
  session.roomCodeExpiresAt = roomCodeExpiresAt(now);
  await session.save();

  return {
    roomCode: session.roomCode,
    roomCodeExpiresAt: session.roomCodeExpiresAt,
  };
}

export async function closeSession(sessionId: string) {
  const session = await AttendanceSessionModel.findById(sessionId);
  if (!session) throw NotFound('Sesión no encontrada.');
  if (session.status === 'CLOSED') return serializeSession(session);

  session.status = 'CLOSED';
  session.closedAt = new Date();
  await session.save();
  return serializeSession(session);
}

export async function listPresent(sessionId: string) {
  const records = await AttendanceRecordModel.find({ sessionId, status: 'ACCEPTED' }).sort({ createdAt: 1 });
  const personIds = records.map((r) => r.personId).filter(Boolean) as Types.ObjectId[];
  const people = await PersonModel.find({ _id: { $in: personIds } });
  const byId = new Map(people.map((p) => [String(p._id), p]));
  return records.map((r) => {
    const person = r.personId ? byId.get(String(r.personId)) : null;
    return {
      id: String(r._id),
      documento: r.documento,
      nombre: person?.nombre ?? null,
      registeredAt: r.createdAt,
    };
  });
}

export async function listAbsent(sessionId: string) {
  const session = await AttendanceSessionModel.findById(sessionId);
  if (!session) throw NotFound('Sesión no encontrada.');

  const enrollments = await EnrollmentModel.find({ unitId: session.unitId, active: true });
  const enrolledPersonIds = enrollments.map((e) => e.personId);
  const presentRecords = await AttendanceRecordModel.find({ sessionId, status: 'ACCEPTED' });
  const presentIds = new Set(presentRecords.map((r) => String(r.personId)));

  const absentIds = enrolledPersonIds.filter((id) => !presentIds.has(String(id)));
  const people = await PersonModel.find({ _id: { $in: absentIds } });
  return people.map((p) => ({
    id: String(p._id),
    documento: p.documento,
    nombre: p.nombre,
  }));
}

export async function listRejections(sessionId: string) {
  const records = await AttendanceRecordModel.find({ sessionId, status: 'REJECTED' }).sort({ createdAt: -1 });
  return records.map((r) => ({
    id: String(r._id),
    documento: r.documento,
    reason: r.rejectReason,
    rejectedAt: r.createdAt,
  }));
}

export async function listSessionsByUnit(unitId: string) {
  const sessions = await AttendanceSessionModel.find({ unitId }).sort({ createdAt: -1 }).limit(100);
  return sessions.map(serializeSession);
}

export async function expireOverdueSessions() {
  const now = new Date();
  const result = await AttendanceSessionModel.updateMany(
    { status: 'ACTIVE', qrExpiresAt: { $lte: now } },
    { $set: { status: 'EXPIRED' } },
  );
  return result.modifiedCount;
}

export function serializeSession(session: {
  _id: unknown;
  institutionId: unknown;
  unitId: unknown;
  status: SessionStatus;
  qrToken: string | null;
  qrExpiresAt: Date | null;
  roomCode: string | null;
  roomCodeExpiresAt: Date | null;
  activatedAt: Date | null;
  closedAt: Date | null;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(session._id),
    institutionId: String(session.institutionId),
    unitId: String(session.unitId),
    status: session.status,
    qrToken: session.qrToken,
    qrExpiresAt: session.qrExpiresAt,
    roomCode: session.roomCode,
    roomCodeExpiresAt: session.roomCodeExpiresAt,
    activatedAt: session.activatedAt,
    closedAt: session.closedAt,
    notes: session.notes,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function buildPublicUrl(token: string): string {
  return `${env.PUBLIC_BASE_URL}/attendance/${token}`;
}

