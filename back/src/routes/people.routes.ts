import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { env } from '../config/env.js';
import { PersonModel } from '../models/person.js';
import { EnrollmentModel } from '../models/enrollment.js';
import { AcademicUnitModel } from '../models/academic-unit.js';
import { AttendanceRecordModel } from '../models/attendance-record.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  CreatePersonSchema,
  IdParamSchema,
  UpdatePersonSchema,
} from '../schemas/management.schemas.js';
import { BadRequest, Conflict, NotFound } from '../lib/http-errors.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN', 'DOCENTE', 'INSTRUCTOR'));

router.get('/', async (req, res, next) => {
  try {
    const { institutionId, role, q } = req.query;
    const filter: Record<string, unknown> = { active: true };
    if (typeof institutionId === 'string') filter.institutionId = institutionId;
    if (typeof role === 'string') filter.roles = role;
    if (typeof q === 'string' && q.trim().length > 0) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ nombre: regex }, { documento: regex }, { matricula: regex }];
    }
    const people = await PersonModel.find(filter).sort({ nombre: 1 }).limit(500);
    res.json({
      data: people.map((p) => ({
        id: String(p._id),
        institutionId: String(p.institutionId),
        documento: p.documento,
        nombre: p.nombre,
        matricula: p.matricula,
        email: p.email,
        roles: p.roles,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(CreatePersonSchema), async (req, res, next) => {
  try {
    const exists = await PersonModel.findOne({
      institutionId: req.body.institutionId,
      documento: req.body.documento,
    });
    if (exists) throw Conflict('Ya existe una persona con ese documento en la institución.');

    const passwordHash = req.body.password
      ? await bcrypt.hash(req.body.password, env.BCRYPT_ROUNDS)
      : null;

    const created = await PersonModel.create({
      institutionId: req.body.institutionId,
      documento: req.body.documento,
      nombre: req.body.nombre,
      matricula: req.body.matricula ?? null,
      email: req.body.email ?? null,
      passwordHash,
      roles: req.body.roles,
    });

    if (Array.isArray(req.body.unitIds) && req.body.unitIds.length > 0) {
      const units = await AcademicUnitModel.find({
        _id: { $in: req.body.unitIds },
        institutionId: req.body.institutionId,
        active: true,
      });
      if (units.length !== req.body.unitIds.length) {
        throw BadRequest('Algunas unidades académicas no existen o no pertenecen a la institución.');
      }
      await EnrollmentModel.insertMany(
        units.map((u) => ({
          institutionId: req.body.institutionId,
          unitId: u._id,
          personId: created._id,
        })),
      );
    }

    res.status(201).json({
      data: {
        id: String(created._id),
        institutionId: String(created.institutionId),
        documento: created.documento,
        nombre: created.nombre,
        matricula: created.matricula,
        email: created.email,
        roles: created.roles,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id',
  validate(IdParamSchema, 'params'),
  validate(UpdatePersonSchema),
  async (req, res, next) => {
    try {
      const update: Record<string, unknown> = {
        ...req.body,
      };
      delete update.unitIds;
      if (typeof req.body.password === 'string' && req.body.password.length > 0) {
        update.passwordHash = await bcrypt.hash(req.body.password, env.BCRYPT_ROUNDS);
        delete update.password;
      } else {
        delete update.password;
      }
      const updated = await PersonModel.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!updated) throw NotFound('Persona no encontrada.');
      res.json({
        data: {
          id: String(updated._id),
          documento: updated.documento,
          nombre: updated.nombre,
          matricula: updated.matricula,
          email: updated.email,
          roles: updated.roles,
          active: updated.active,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/:id', validate(IdParamSchema, 'params'), async (req, res, next) => {
  try {
    const updated = await PersonModel.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );
    if (!updated) throw NotFound('Persona no encontrada.');
    await EnrollmentModel.updateMany({ personId: updated._id }, { $set: { active: false } });
    res.json({ data: { id: String(updated._id), active: updated.active } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/hard', validate(IdParamSchema, 'params'), async (req, res, next) => {
  try {
    const records = await AttendanceRecordModel.exists({ personId: req.params.id });
    if (records) {
      throw Conflict(
        'No se puede borrar definitivamente: la persona tiene registros de asistencia. Usa el borrado lógico.',
      );
    }
    await EnrollmentModel.deleteMany({ personId: req.params.id });
    const deleted = await PersonModel.findByIdAndDelete(req.params.id);
    if (!deleted) throw NotFound('Persona no encontrada.');
    res.json({ data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
