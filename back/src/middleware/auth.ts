import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type JwtPayload } from '../lib/jwt.js';
import { Forbidden, Unauthorized } from '../lib/http-errors.js';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: JwtPayload;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(Unauthorized('Falta cabecera Authorization: Bearer <token>.'));
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(Unauthorized('Token JWT inválido o expirado.'));
  }
}

export function requireRole(...allowed: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(Unauthorized());
    const ok = req.auth.roles.some((r) => allowed.includes(r));
    if (!ok) return next(Forbidden('Rol insuficiente para esta operación.'));
    next();
  };
}
