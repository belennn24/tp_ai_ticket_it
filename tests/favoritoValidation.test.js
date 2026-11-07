import { describe, it, expect } from '@jest/globals';
import { favoritoEventoIdParamSchema } from '../backend/validations/favoritoValidation.js';

describe('FavoritoValidation (Pruebas de Schemas Zod)', () => {
  it('debe validar un eventoId no vacío', () => {
    const res = favoritoEventoIdParamSchema.safeParse({ eventoId: 'ev-123' });
    expect(res.success).toBe(true);
    expect(res.data.eventoId).toBe('ev-123');
  });

  it('debe fallar si el eventoId está vacío o son espacios', () => {
    const res = favoritoEventoIdParamSchema.safeParse({ eventoId: '   ' });
    expect(res.success).toBe(false);
  });
});
