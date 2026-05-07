import { Router } from 'express';
import { InstitutionModel } from '../models/institution.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  CreateInstitutionSchema,
  IdParamSchema,
  UpdateInstitutionSchema,
} from '../schemas/management.schemas.js';
import { Conflict, NotFound } from '../lib/http-errors.js';

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

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(CreateInstitutionSchema),
  async (req, res, next) => {
    try {
      const code = String(req.body.code).toUpperCase();
      const exists = await InstitutionModel.findOne({ code });
      if (exists) throw Conflict('Ya existe una institución con ese código.');
      const created = await InstitutionModel.create({ ...req.body, code });
      res.status(201).json({
        data: {
          id: String(created._id),
          code: created.code,
          name: created.name,
          context: created.context,
          labels: created.labels,
          theme: created.theme,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(IdParamSchema, 'params'),
  validate(UpdateInstitutionSchema),
  async (req, res, next) => {
    try {
      const update: Record<string, unknown> = { ...req.body };
      if (typeof update.code === 'string') update.code = update.code.toUpperCase();
      const updated = await InstitutionModel.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!updated) throw NotFound('Institución no encontrada.');
      res.json({
        data: {
          id: String(updated._id),
          code: updated.code,
          name: updated.name,
          context: updated.context,
          labels: updated.labels,
          theme: updated.theme,
          active: updated.active,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(IdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const updated = await InstitutionModel.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true },
      );
      if (!updated) throw NotFound('Institución no encontrada.');
      res.json({ data: { id: String(updated._id), active: updated.active } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
