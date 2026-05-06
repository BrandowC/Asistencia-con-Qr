import { Router } from 'express';
import { InstitutionModel } from '../models/institution.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const items = await InstitutionModel.find({ active: true }).sort({ name: 1 });
    res.json({
      data: items.map((i) => ({
        id: String(i._id),
        code: i.code,
        name: i.name,
        context: i.context,
        labels: i.labels,
        theme: i.theme,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
