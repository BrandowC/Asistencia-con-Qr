import { Router } from 'express';
import { AcademicUnitModel } from '../models/academic-unit.js';
import { EnrollmentModel } from '../models/enrollment.js';
import { PersonModel } from '../models/person.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateUnitSchema, IdParamSchema, UpdateUnitSchema } from '../schemas/management.schemas.js';
import { Conflict, NotFound } from '../lib/http-errors.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { institutionId } = req.query;
    const filter: Record<string, unknown> = { active: true };
    if (typeof institutionId === 'string') filter.institutionId = institutionId;
    const units = await AcademicUnitModel.find(filter).sort({ code: 1 });
    res.json({
      data: units.map((u) => ({
        id: String(u._id),
        institutionId: String(u.institutionId),
        code: u.code,
        name: u.name,
        type: u.type,
        description: u.description,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:unitId/enrollments', requireAuth, async (req, res, next) => {
  try {
    const unit = await AcademicUnitModel.findById(req.params.unitId);
    if (!unit) throw NotFound('Unidad académica no encontrada.');

    const enrollments = await EnrollmentModel.find({ unitId: unit._id, active: true });
    const personIds = enrollments.map((e) => e.personId);
    const people = await PersonModel.find({ _id: { $in: personIds } }).sort({ nombre: 1 });
    const enrollmentByPerson = new Map(enrollments.map((e) => [String(e.personId), e]));
    res.json({
      data: people.map((p) => {
        const en = enrollmentByPerson.get(String(p._id));
        return {
          id: String(p._id),
          documento: p.documento,
          nombre: p.nombre,
          matricula: p.matricula,
          enrollmentId: en ? String(en._id) : null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'DOCENTE', 'INSTRUCTOR'),
  validate(CreateUnitSchema),
  async (req, res, next) => {
    try {
      const code = String(req.body.code).toUpperCase();
      const exists = await AcademicUnitModel.findOne({ institutionId: req.body.institutionId, code });
      if (exists) throw Conflict('Ya existe una unidad con ese código en la institución.');
      const created = await AcademicUnitModel.create({ ...req.body, code });
      res.status(201).json({
        data: {
          id: String(created._id),
          institutionId: String(created.institutionId),
          code: created.code,
          name: created.name,
          type: created.type,
          description: created.description,
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
  requireRole('ADMIN', 'DOCENTE', 'INSTRUCTOR'),
  validate(IdParamSchema, 'params'),
  validate(UpdateUnitSchema),
  async (req, res, next) => {
    try {
      const update: Record<string, unknown> = { ...req.body };
      if (typeof update.code === 'string') update.code = update.code.toUpperCase();
      const updated = await AcademicUnitModel.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!updated) throw NotFound('Unidad académica no encontrada.');
      res.json({
        data: {
          id: String(updated._id),
          institutionId: String(updated.institutionId),
          code: updated.code,
          name: updated.name,
          type: updated.type,
          description: updated.description,
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
  requireRole('ADMIN', 'DOCENTE', 'INSTRUCTOR'),
  validate(IdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const updated = await AcademicUnitModel.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true },
      );
      if (!updated) throw NotFound('Unidad académica no encontrada.');
      await EnrollmentModel.updateMany({ unitId: updated._id }, { $set: { active: false } });
      res.json({ data: { id: String(updated._id), active: updated.active } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
