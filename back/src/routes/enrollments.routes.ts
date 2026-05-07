import { Router } from 'express';
import { EnrollmentModel } from '../models/enrollment.js';
import { AcademicUnitModel } from '../models/academic-unit.js';
import { PersonModel } from '../models/person.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateEnrollmentSchema, IdParamSchema } from '../schemas/management.schemas.js';
import { Conflict, NotFound } from '../lib/http-errors.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN', 'DOCENTE', 'INSTRUCTOR'));

router.post('/', validate(CreateEnrollmentSchema), async (req, res, next) => {
  try {
    const unit = await AcademicUnitModel.findById(req.body.unitId);
    if (!unit) throw NotFound('Unidad académica no encontrada.');
    const person = await PersonModel.findById(req.body.personId);
    if (!person) throw NotFound('Persona no encontrada.');
    if (String(person.institutionId) !== String(unit.institutionId)) {
      throw Conflict('La persona y la unidad pertenecen a instituciones distintas.');
    }
    const existing = await EnrollmentModel.findOne({ unitId: unit._id, personId: person._id });
    if (existing) {
      if (existing.active) throw Conflict('La persona ya está inscrita en esta unidad.');
      existing.active = true;
      await existing.save();
      res.status(200).json({ data: serializeEnrollment(existing) });
      return;
    }
    const created = await EnrollmentModel.create({
      institutionId: unit.institutionId,
      unitId: unit._id,
      personId: person._id,
    });
    res.status(201).json({ data: serializeEnrollment(created) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', validate(IdParamSchema, 'params'), async (req, res, next) => {
  try {
    const updated = await EnrollmentModel.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );
    if (!updated) throw NotFound('Inscripción no encontrada.');
    res.json({ data: { id: String(updated._id), active: updated.active } });
  } catch (err) {
    next(err);
  }
});

function serializeEnrollment(e: { _id: unknown; institutionId: unknown; unitId: unknown; personId: unknown; active?: boolean }) {
  return {
    id: String(e._id),
    institutionId: String(e.institutionId),
    unitId: String(e.unitId),
    personId: String(e.personId),
    active: e.active ?? true,
  };
}

export default router;
