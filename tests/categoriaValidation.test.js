import { describe, it, expect } from '@jest/globals';
import {
  crearCategoriaSchema,
  categoriaIdParamSchema
} from '../backend/validations/categoriaValidation.js';

describe('CategoriaValidation (Pruebas de Schemas Zod)', () => {
  describe('crearCategoriaSchema', () => {
    it('debe validar exitosamente con nombre y descripción', () => {
      const res = crearCategoriaSchema.safeParse({
        nombre: 'Conciertos',
        descripcion: 'Eventos musicales'
      });
      expect(res.success).toBe(true);
      expect(res.data.nombre).toBe('Conciertos');
    });

    it('debe admitir omisión de descripción y asignar string vacío por default', () => {
      const res = crearCategoriaSchema.safeParse({
        nombre: 'Deportes'
      });
      expect(res.success).toBe(true);
      expect(res.data.descripcion).toBe('');
    });

    it('debe fallar si falta el nombre', () => {
      const res = crearCategoriaSchema.safeParse({
        descripcion: 'Sin nombre'
      });
      expect(res.success).toBe(false);
    });

    it('debe fallar si el nombre está compuesto solo por espacios', () => {
      const res = crearCategoriaSchema.safeParse({
        nombre: '    '
      });
      expect(res.success).toBe(false);
    });
  });

  describe('categoriaIdParamSchema', () => {
    it('debe aceptar un id válido', () => {
      const res = categoriaIdParamSchema.safeParse({ id: 'cat-1' });
      expect(res.success).toBe(true);
    });

    it('debe fallar si el id está vacío', () => {
      const res = categoriaIdParamSchema.safeParse({ id: '   ' });
      expect(res.success).toBe(false);
    });
  });
});
