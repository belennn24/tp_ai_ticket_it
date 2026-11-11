import { describe, it, expect } from '@jest/globals';
import {
  buscarEventosQuerySchema,
  eventoIdParamSchema,
  crearEventoSchema,
  tipoEntradaInputSchema
} from '../backend/validations/eventoValidation.js';

describe('EventoValidation (Pruebas de Schemas Zod)', () => {
  describe('buscarEventosQuerySchema', () => {
    it('debe aceptar objeto vacío sin filtros', () => {
      const resultado = buscarEventosQuerySchema.safeParse({});
      expect(resultado.success).toBe(true);
    });

    it('debe validar y transformar tipos válidos', () => {
      const resultado = buscarEventosQuerySchema.safeParse({
        texto: 'rock',
        categoriaId: '1',
        precioMin: '100',
        precioMax: '500',
        orden: 'precio'
      });
      expect(resultado.success).toBe(true);
      expect(resultado.data.precioMin).toBe(100);
      expect(resultado.data.precioMax).toBe(500);
      expect(resultado.data.orden).toBe('precio');
    });

    it('debe fallar si precioMin es mayor que precioMax', () => {
      const resultado = buscarEventosQuerySchema.safeParse({
        precioMin: '600',
        precioMax: '200'
      });
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toContain('precioMin no puede ser mayor que precioMax');
    });

    it('debe fallar si precioMin o precioMax son negativos', () => {
      const resultado1 = buscarEventosQuerySchema.safeParse({ precioMin: -50 });
      expect(resultado1.success).toBe(false);

      const resultado2 = buscarEventosQuerySchema.safeParse({ precioMax: -10 });
      expect(resultado2.success).toBe(false);
    });

    it('debe fallar si el orden no es uno de los permitidos', () => {
      const resultado = buscarEventosQuerySchema.safeParse({ orden: 'alfabetico' });
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toContain('El orden debe ser fecha, precio o reputacion');
    });
  });

  describe('eventoIdParamSchema', () => {
    it('debe aceptar un id no vacío', () => {
      const resultado = eventoIdParamSchema.safeParse({ id: 'evento-123' });
      expect(resultado.success).toBe(true);
      expect(resultado.data.id).toBe('evento-123');
    });

    it('debe fallar si el id está vacío o son espacios', () => {
      const resultado = eventoIdParamSchema.safeParse({ id: '   ' });
      expect(resultado.success).toBe(false);
    });
  });

  describe('tipoEntradaInputSchema', () => {
    it('debe validar un tipo de entrada correcto', () => {
      const resultado = tipoEntradaInputSchema.safeParse({
        nombre: 'General',
        precio: '1500',
        cupo: '50'
      });
      expect(resultado.success).toBe(true);
      expect(resultado.data.precio).toBe(1500);
      expect(resultado.data.cupo).toBe(50);
    });

    it('debe fallar si el precio o cupo son menores o iguales a cero', () => {
      const resPrecioCero = tipoEntradaInputSchema.safeParse({
        nombre: 'VIP',
        precio: 0,
        cupo: 10
      });
      expect(resPrecioCero.success).toBe(false);

      const resCupoCero = tipoEntradaInputSchema.safeParse({
        nombre: 'VIP',
        precio: 100,
        cupo: 0
      });
      expect(resCupoCero.success).toBe(false);
    });
  });

  describe('crearEventoSchema', () => {
    const payloadValido = {
      nombre: 'Festival Primavera',
      descripcion: 'Música en vivo',
      categoriaId: 'cat-1',
      fecha: '2026-11-20T21:00:00Z',
      tiposEntrada: [
        { nombre: 'Campo', precio: 2000, cupo: 100 }
      ]
    };

    it('debe validar un evento con datos correctos', () => {
      const resultado = crearEventoSchema.safeParse(payloadValido);
      expect(resultado.success).toBe(true);
      expect(resultado.data.nombre).toBe('Festival Primavera');
    });

    it('debe fallar si falta el nombre o está vacío', () => {
      const resultado = crearEventoSchema.safeParse({
        ...payloadValido,
        nombre: '  '
      });
      expect(resultado.success).toBe(false);
    });

    it('debe fallar si falta categoriaId', () => {
      const resultado = crearEventoSchema.safeParse({
        ...payloadValido,
        categoriaId: undefined
      });
      expect(resultado.success).toBe(false);
    });

    it('debe fallar si el formato de fecha es inválido', () => {
      const resultado = crearEventoSchema.safeParse({
        ...payloadValido,
        fecha: 'fecha-invalida'
      });
      expect(resultado.success).toBe(false);
    });

    it('debe fallar si tiposEntrada está vacío', () => {
      const resultado = crearEventoSchema.safeParse({
        ...payloadValido,
        tiposEntrada: []
      });
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toContain('al menos un tipo de entrada');
    });
  });
});
