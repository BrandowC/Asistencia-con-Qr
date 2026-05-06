import bcrypt from 'bcryptjs';
import { PersonModel } from '../models/person.js';
import { InstitutionModel } from '../models/institution.js';
import { signToken } from '../lib/jwt.js';
import { Unauthorized } from '../lib/http-errors.js';
import type { LoginInput } from '../schemas/auth.schemas.js';

const STAFF_ROLES = ['ADMIN', 'DOCENTE', 'INSTRUCTOR'];

export async function loginWithDocumento(input: LoginInput) {
  let institutionId: unknown = null;
  if (input.institutionCode) {
    const inst = await InstitutionModel.findOne({ code: input.institutionCode.toUpperCase(), active: true });
    if (!inst) throw Unauthorized('Institución no encontrada o inactiva.');
    institutionId = inst._id;
  }

  const filter: Record<string, unknown> = { documento: input.documento, active: true };
  if (institutionId) filter.institutionId = institutionId;

  const person = await PersonModel.findOne(filter).select('+passwordHash');
  if (!person || !person.passwordHash) throw Unauthorized('Credenciales inválidas.');

  const ok = await bcrypt.compare(input.password, person.passwordHash);
  if (!ok) throw Unauthorized('Credenciales inválidas.');

  const hasStaff = person.roles.some((r) => STAFF_ROLES.includes(r));
  if (!hasStaff) throw Unauthorized('El usuario no tiene rol administrativo.');

  const token = signToken({
    sub: String(person._id),
    institutionId: String(person.institutionId),
    roles: person.roles,
    documento: person.documento,
    nombre: person.nombre,
  });

  return {
    token,
    person: {
      id: String(person._id),
      institutionId: String(person.institutionId),
      nombre: person.nombre,
      documento: person.documento,
      roles: person.roles,
    },
  };
}
