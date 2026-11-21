import { describe, it, expect, beforeEach } from '@jest/globals';
import { seedDatabase } from '../backend/utils/seed.js';
import { usuarioService } from '../backend/services/usuarioService.js';
import { usuarioController } from '../backend/controllers/usuarioController.js';
import { actualizarPerfilSchema } from '../backend/validations/usuarioValidation.js';
import { ValidationError } from '../backend/errors/appError.js';

describe('Edición de perfil de usuario (nombre y apellido)', () => {
  beforeEach(async () => {
    await seedDatabase({ clearExisting: true });
  });

  it('permite que un comprador actualice su nombre y apellido sin exponer passwordHash', async () => {
    const res = await usuarioService.actualizarPerfil('usr-comprador-1', {
      nombre: '  Juanita  ',
      apellido: '  Pérez  '
    });

    expect(res.usuario.nombre).toBe('Juanita');
    expect(res.usuario.apellido).toBe('Pérez');
    expect(res.usuario.rol).toBe('comprador');
    expect(res.usuario.passwordHash).toBeUndefined();
  });

  it('permite que un organizador actualice su nombre', async () => {
    const req = {
      user: { id: 'usr-organizador-1' },
      body: { nombre: 'Carlos Nuevo' }
    };
    let statusCode;
    let body;
    const res = {
      status(code) { statusCode = code; return this; },
      json(payload) { body = payload; return this; }
    };

    await usuarioController.actualizarPerfil(req, res, (err) => { throw err; });

    expect(statusCode).toBe(200);
    expect(body.usuario.nombre).toBe('Carlos Nuevo');
    expect(body.usuario.apellido).toBe('Productor');
    expect(body.usuario.rol).toBe('organizador');
  });

  it('rechaza un nombre vacío en servicio y en validación Zod', async () => {
    await expect(
      usuarioService.actualizarPerfil('usr-comprador-1', { nombre: '   ' })
    ).rejects.toThrow(ValidationError);

    const parsed = actualizarPerfilSchema.safeParse({ nombre: '   ' });
    expect(parsed.success).toBe(false);
  });
});
