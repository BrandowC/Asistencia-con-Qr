import { Router } from 'express';
import { AcademicUnitModel } from '../models/academic-unit.js';
import { EnrollmentModel } from '../models/enrollment.js';
import { PersonModel } from '../models/person.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFound } from '../lib/http-errors.js';

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
    res.json({
      data: people.map((p) => ({
        id: String(p._id),
        documento: p.documento,
        nombre: p.nombre,
        matricula: p.matricula,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
