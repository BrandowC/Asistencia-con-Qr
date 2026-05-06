import { Router } from 'express';
import { LoginSchema } from '../schemas/auth.schemas.js';
import { validate } from '../middleware/validate.js';
import { loginWithDocumento } from '../services/auth.service.js';

const router = Router();

router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const data = await loginWithDocumento(req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
