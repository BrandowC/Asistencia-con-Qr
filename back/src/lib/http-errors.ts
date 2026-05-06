export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (msg = 'Solicitud inválida', details?: unknown) =>
  new HttpError(400, 'VALIDATION_ERROR', msg, details);

export const Unauthorized = (msg = 'No autorizado') =>
  new HttpError(401, 'UNAUTHORIZED', msg);

export const Forbidden = (msg = 'Acceso prohibido') =>
  new HttpError(403, 'FORBIDDEN', msg);

export const NotFound = (msg = 'Recurso no encontrado') =>
  new HttpError(404, 'NOT_FOUND', msg);

export const Conflict = (msg = 'Conflicto de estado') =>
  new HttpError(409, 'CONFLICT', msg);

export const Gone = (msg = 'Recurso expirado') =>
  new HttpError(410, 'GONE', msg);
