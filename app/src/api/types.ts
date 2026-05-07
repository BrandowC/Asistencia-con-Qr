export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    trace_id: string;
  };
}

export interface AuthPerson {
  id: string;
  institutionId: string;
  nombre: string;
  documento: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  person: AuthPerson;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  context: 'SENA' | 'UNIVERSIDAD';
  labels: { formador: string; aprendiz: string; unidad: string };
  theme: { primary: string; secondary: string };
}

export interface AcademicUnit {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  type: 'FICHA' | 'MATERIA';
  description: string;
}

export interface EnrolledPerson {
  id: string;
  documento: string;
  nombre: string;
  matricula?: string | null;
  enrollmentId?: string | null;
}

export interface Person {
  id: string;
  institutionId: string;
  documento: string;
  nombre: string;
  matricula?: string | null;
  email?: string | null;
  roles: string[];
}

export type SessionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';

export interface AttendanceSession {
  id: string;
  institutionId: string;
  unitId: string;
  status: SessionStatus;
  qrToken: string | null;
  qrExpiresAt: string | null;
  roomCode: string | null;
  roomCodeExpiresAt: string | null;
  activatedAt: string | null;
  closedAt: string | null;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
  qrUrl?: string;
  qrPng?: string;
}

export interface PresentRecord {
  id: string;
  documento: string;
  nombre: string | null;
  registeredAt: string;
}

export interface AbsentRecord {
  id: string;
  documento: string;
  nombre: string;
}

export interface RejectionRecord {
  id: string;
  documento: string;
  reason: string | null;
  rejectedAt: string;
}
