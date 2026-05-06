import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { PublicRegisterSchema, TokenParamsSchema } from '../schemas/sessions.schemas.js';
import { getPublicSessionView, registerByQrToken } from '../services/attendance.service.js';

const router = Router();

router.get('/attendance/:token', validate(TokenParamsSchema, 'params'), async (req, res, next) => {
  try {
    const data = await getPublicSessionView(req.params.token);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/attendance/:token/register',
  validate(TokenParamsSchema, 'params'),
  validate(PublicRegisterSchema),
  async (req, res, next) => {
    try {
      const data = await registerByQrToken({
        token: req.params.token,
        documento: req.body.documento,
        roomCode: req.body.roomCode,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
