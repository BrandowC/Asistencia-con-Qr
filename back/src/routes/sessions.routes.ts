import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateSessionSchema, SessionIdParamsSchema } from '../schemas/sessions.schemas.js';
import {
  activateSession,
  closeSession,
  createSession,
  listAbsent,
  listPresent,
  listRejections,
  listSessionsByUnit,
  rotateRoomCode,
} from '../services/sessions.service.js';
import { Unauthorized } from '../lib/http-errors.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN', 'DOCENTE', 'INSTRUCTOR'));

router.post('/', validate(CreateSessionSchema), async (req, res, next) => {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await createSession(req.body, req.auth.sub);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/:sessionId/activate', validate(SessionIdParamsSchema, 'params'), async (req, res, next) => {
  try {
    const ttl = typeof req.body?.qrTtlMinutes === 'number' ? req.body.qrTtlMinutes : undefined;
    const data = await activateSession(req.params.sessionId, ttl);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/:sessionId/room-code/rotate', validate(SessionIdParamsSchema, 'params'), async (req, res, next) => {
  try {
    const data = await rotateRoomCode(req.params.sessionId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/:sessionId/close', validate(SessionIdParamsSchema, 'params'), async (req, res, next) => {
  try {
    const data = await closeSession(req.params.sessionId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/:sessionId/present', validate(SessionIdParamsSchema, 'params'), async (req, res, next) => {
  try {
    const data = await listPresent(req.params.sessionId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/:sessionId/absent', validate(SessionIdParamsSchema, 'params'), async (req, res, next) => {
  try {
    const data = await listAbsent(req.params.sessionId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/:sessionId/rejections', validate(SessionIdParamsSchema, 'params'), async (req, res, next) => {
  try {
    const data = await listRejections(req.params.sessionId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/by-unit/:unitId', async (req, res, next) => {
  try {
    const data = await listSessionsByUnit(req.params.unitId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
