import { describe, it, expect } from '@jest/globals';
import {
  crearReseniaSchema,
  organizadorIdParamSchema
} from '../backend/validations/reseniaValidation.js';

describe('ReseniaValidation (Pruebas de Schemas Zod)', () => {
  describe('crearReseniaSchema', () => {
    it('debe validar exitosamente una reseña con datos correctos', () => {
      const resultado = crearReseniaSchema.safeParse({
        eventoId: 'ev-1',
        puntuacion: 4,
        detalle: 'Excelente organización y sonido'
      });
      expect(resultado.success).toBe(true);
      expect(resultado.data.puntuacion).toBe(4);
    });

    it('debe coaccionar puntuación expresada como string', () => {
      const resultado = crearReseniaSchema.safeParse({
        eventoId: 'ev-1',
        puntuacion: '5'
      });
      expect(resultado.success).toBe(true);
      expect(resultado.data.puntuacion).toBe(5);
    });

    it('debe fallar si falta el eventoId o está vacío', () => {
      const resultado = crearReseniaSchema.safeParse({
        puntuacion: 4
      });
      expect(resultado.success).toBe(false);

      const resultadoVacio = crearReseniaSchema.safeParse({
        eventoId: '   ',
        puntuacion: 4
      });
      expect(resultadoVacio.success).toBe(false);
    });

    it('debe fallar si la puntuación es menor a 1 o mayor a 5', () => {
      const resBaja = crearReseniaSchema.safeParse({
        eventoId: 'ev-1',
        puntuacion: 0
      });
      expect(resBaja.success).toBe(false);
      expect(resBaja.error.issues[0].message).toContain('La puntuación mínima es 1');

      const resAlta = crearReseniaSchema.safeParse({
        eventoId: 'ev-1',
        puntuacion: 6
      });
      expect(resAlta.success).toBe(false);
      expect(resAlta.error.issues[0].message).toContain('La puntuación máxima es 5');
    });

    it('debe fallar si la puntuación no es un valor numérico válido', () => {
      const resultado = crearReseniaSchema.safeParse({
        eventoId: 'ev-1',
        puntuacion: 'excelente'
      });
      expect(resultado.success).toBe(false);
    });
  });

  describe('organizadorIdParamSchema', () => {
    it('debe aceptar un id válido', () => {
      const resultado = organizadorIdParamSchema.safeParse({ id: 'org-123' });
      expect(resultado.success).toBe(true);
    });

    it('debe fallar si el id está vacío', () => {
      const resultado = organizadorIdParamSchema.safeParse({ id: '   ' });
      expect(resultado.success).toBe(false);
    });
  });
});
