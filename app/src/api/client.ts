import type {
  AbsentRecord,
  AcademicUnit,
  ApiEnvelope,
  ApiError,
  AttendanceSession,
  AuthResponse,
  EnrolledPerson,
  Institution,
  Person,
  PresentRecord,
  RejectionRecord,
} from './types';

const TOKEN_KEY = 'app-attendance.token';
const BACKEND_URL_KEY = 'app-attendance.backend';

export function getBackendUrl(): string {
  const stored = localStorage.getItem(BACKEND_URL_KEY);
  if (stored && stored.length > 0) return stored;
  const fromEnv = import.meta.env.VITE_BACKEND_URL as string | undefined;
  return fromEnv && fromEnv.length > 0 ? fromEnv : 'http://localhost:4000';
}

export function setBackendUrl(url: string): void {
  localStorage.setItem(BACKEND_URL_KEY, url);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as ApiEnvelope<T> | ApiError) : ({} as ApiEnvelope<T>);

  if (!response.ok) {
    const err = json as ApiError;
    throw new Error(err.error?.message ?? `HTTP ${response.status}`);
  }
  return (json as ApiEnvelope<T>).data;
}

export const api = {
  login: (documento: string, password: string, institutionCode?: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ documento, password, institutionCode }),
    }),

  getInstitutions: () => request<Institution[]>('/api/institutions'),

  getUnits: (institutionId: string) =>
    request<AcademicUnit[]>(`/api/units?institutionId=${encodeURIComponent(institutionId)}`),

  getEnrollments: (unitId: string) =>
    request<EnrolledPerson[]>(`/api/units/${encodeURIComponent(unitId)}/enrollments`),

  createSession: (institutionId: string, unitId: string, qrTtlMinutes?: number) =>
    request<AttendanceSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ institutionId, unitId, qrTtlMinutes }),
    }),

  activateSession: (sessionId: string, qrTtlMinutes?: number) =>
    request<AttendanceSession>(`/api/sessions/${encodeURIComponent(sessionId)}/activate`, {
      method: 'POST',
      body: JSON.stringify({ qrTtlMinutes }),
    }),

  rotateRoomCode: (sessionId: string) =>
    request<{ roomCode: string; roomCodeExpiresAt: string }>(
      `/api/sessions/${encodeURIComponent(sessionId)}/room-code/rotate`,
      { method: 'POST' },
    ),

  closeSession: (sessionId: string) =>
    request<AttendanceSession>(`/api/sessions/${encodeURIComponent(sessionId)}/close`, { method: 'POST' }),

  getPresent: (sessionId: string) =>
    request<PresentRecord[]>(`/api/sessions/${encodeURIComponent(sessionId)}/present`),

  getAbsent: (sessionId: string) =>
    request<AbsentRecord[]>(`/api/sessions/${encodeURIComponent(sessionId)}/absent`),

  getRejections: (sessionId: string) =>
    request<RejectionRecord[]>(`/api/sessions/${encodeURIComponent(sessionId)}/rejections`),

  getSessionsByUnit: (unitId: string) =>
    request<AttendanceSession[]>(`/api/sessions/by-unit/${encodeURIComponent(unitId)}`),

  publicGetSession: (token: string) =>
    request<{ id: string; status: string; qrExpiresAt: string | null; unitId: string; institutionId: string }>(
      `/public/attendance/${encodeURIComponent(token)}`,
    ),

  publicRegister: (token: string, documento: string) =>
    request<{ id: string; documento: string; nombre: string; sessionId: string; registeredAt: string }>(
      `/public/attendance/${encodeURIComponent(token)}/register`,
      {
        method: 'POST',
        body: JSON.stringify({ documento }),
      },
    ),

  createInstitution: (input: {
    code: string;
    name: string;
    context: 'SENA' | 'UNIVERSIDAD';
    labels?: { formador?: string; aprendiz?: string; unidad?: string };
    theme?: { primary?: string; secondary?: string };
  }) =>
    request<Institution>('/api/institutions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteInstitution: (id: string) =>
    request<{ id: string; active: boolean }>(`/api/institutions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createUnit: (input: {
    institutionId: string;
    code: string;
    name: string;
    type: 'FICHA' | 'MATERIA';
    description?: string;
  }) =>
    request<AcademicUnit>('/api/units', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteUnit: (id: string) =>
    request<{ id: string; active: boolean }>(`/api/units/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getPeople: (params: { institutionId?: string; role?: string; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.institutionId) sp.set('institutionId', params.institutionId);
    if (params.role) sp.set('role', params.role);
    if (params.q) sp.set('q', params.q);
    const qs = sp.toString();
    return request<Person[]>(`/api/people${qs ? `?${qs}` : ''}`);
  },

  createPerson: (input: {
    institutionId: string;
    documento: string;
    nombre: string;
    matricula?: string | null;
    email?: string | null;
    password?: string;
    roles: string[];
    unitIds?: string[];
  }) =>
    request<Person>('/api/people', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deletePerson: (id: string) =>
    request<{ id: string; active: boolean }>(`/api/people/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  enroll: (unitId: string, personId: string) =>
    request<{ id: string; unitId: string; personId: string; active: boolean }>(
      '/api/enrollments',
      {
        method: 'POST',
        body: JSON.stringify({ unitId, personId }),
      },
    ),

  unenroll: (enrollmentId: string) =>
    request<{ id: string; active: boolean }>(`/api/enrollments/${encodeURIComponent(enrollmentId)}`, {
      method: 'DELETE',
    }),
};
