import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { randomUUID } from 'node:crypto';
import { HttpError } from '../lib/http-errors.js';

export const notFoundHandler = (_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Ruta no encontrada.',
      trace_id: randomUUID(),
    },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const trace_id = randomUUID();

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La solicitud no cumple el contrato esperado.',
        details: err.flatten(),
        trace_id,
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? [],
        trace_id,
      },
    });
    return;
  }

  console.error('[error]', trace_id, err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error inesperado del servidor.',
      trace_id,
    },
  });
};
