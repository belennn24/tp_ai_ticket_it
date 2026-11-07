import { describe, it, expect } from '@jest/globals';
import {
  Usuario,
  Compra,
  TipoEntrada,
  Evento,
  Categoria,
  Mensaje,
  Resenia,
  estadoCompra
} from '../backend/models/index.js';
import { ValidationError, ConflictError } from '../backend/errors/appError.js';

describe('Entidades de Dominio Rico (Estilo 2026-2c-lu-sa-grupo-2)', () => {
  describe('Usuario', () => {
    it('debe autovalidar que el nombre no sea una cadena vacía', () => {
      expect(() => new Usuario({ nombre: '   ' })).toThrow(ValidationError);
    });

    it('debe gestionar favoritos mediante métodos de dominio con trazabilidad', () => {
      const usuario = new Usuario({ nombre: 'Belen', apellido: 'Perez' });
      expect(usuario.fechaCreacion).toBeInstanceOf(Date);
      expect(usuario.fechaModificacion).toBeNull();

      usuario.agregarFavorito('ev-10');
      expect(usuario.tieneFavorito('ev-10')).toBe(true);
      expect(usuario.fechaModificacion).toBeInstanceOf(Date);

      // No debe duplicar favoritos existentes
      usuario.agregarFavorito('ev-10');
      expect(usuario.favoritos).toHaveLength(1);

      // Remover favorito
      usuario.eliminarFavorito('ev-10');
      expect(usuario.tieneFavorito('ev-10')).toBe(false);
    });
  });

  describe('TipoEntrada', () => {
    it('debe validar que precio y cupo no sean negativos', () => {
      expect(() => new TipoEntrada({ nombre: 'VIP', precio: -10, cupo: 100 })).toThrow(ValidationError);
      expect(() => new TipoEntrada({ nombre: 'VIP', precio: 50, cupo: -5 })).toThrow(ValidationError);
    });

    it('debe descontar cupo de forma atómica y lanzar ConflictError si no alcanza', () => {
      const tipo = new TipoEntrada({ nombre: 'General', precio: 100, cupo: 5 });
      expect(tipo.hayCupoPara(3)).toBe(true);
      expect(tipo.hayCupoPara(10)).toBe(false);

      tipo.descontarCupo(3);
      expect(tipo.cupo).toBe(2);
      expect(tipo.fechaModificacion).toBeInstanceOf(Date);

      expect(() => tipo.descontarCupo(3)).toThrow(ConflictError);
    });

    it('debe restituir cupo válidamente', () => {
      const tipo = new TipoEntrada({ nombre: 'General', precio: 100, cupo: 2 });
      tipo.restituirCupo(3);
      expect(tipo.cupo).toBe(5);

      expect(() => tipo.restituirCupo(-1)).toThrow(ValidationError);
    });
  });

  describe('Evento', () => {
    it('debe validar que el nombre no sea una cadena vacía', () => {
      expect(() => new Evento({ nombre: '   ' })).toThrow(ValidationError);
    });

    it('debe comprobar si ya ocurrió según la fecha de referencia', () => {
      const eventoPasado = new Evento({ nombre: 'Recital Pasado', fecha: new Date('2020-01-01') });
      expect(eventoPasado.yaOcurrio()).toBe(true);

      const eventoFuturo = new Evento({ nombre: 'Recital Futuro', fecha: new Date('2030-01-01') });
      expect(eventoFuturo.yaOcurrio()).toBe(false);
    });

    it('debe buscar y agregar tipos de entrada con métodos de dominio', () => {
      const evento = new Evento({ nombre: 'Festival' });
      const tipo = new TipoEntrada({ id: 't-1', nombre: 'Campo', precio: 200, cupo: 50 });

      evento.agregarTipoEntrada(tipo);
      expect(evento.buscarTipoEntrada('t-1')).toBe(tipo);
      expect(evento.buscarTipoEntrada('inexistente')).toBeNull();
    });
  });

  describe('Compra', () => {
    it('debe autocalcular el total según cantidad y precio del tipo de entrada', () => {
      const tipo = new TipoEntrada({ precio: 250, cupo: 10 });
      const compra = new Compra({
        tipoEntrada: tipo,
        cantidad: 3
      });

      expect(compra.total).toBe(750);
      expect(compra.fechaCompra).toBeInstanceOf(Date);
      expect(compra.fechaModificacion).toBeNull();
      expect(compra.estado).toBe(estadoCompra.PENDIENTE);
    });

    it('debe gestionar transiciones de estado de forma segura', () => {
      const compra = new Compra({ cantidad: 1, estado: estadoCompra.CONFIRMADA });
      expect(compra.estado).toBe(estadoCompra.CONFIRMADA);

      compra.utilizar();
      expect(compra.estado).toBe(estadoCompra.UTILIZADA);
      expect(compra.fechaModificacion).toBeInstanceOf(Date);

      // Una compra utilizada no puede ser cancelada
      expect(() => compra.cancelar()).toThrow(ConflictError);
    });

    it('cancelar debe setear estado CANCELADA y registrar fechaBaja', () => {
      const compra = new Compra({ cantidad: 1, estado: estadoCompra.CONFIRMADA });
      compra.cancelar();

      expect(compra.estado).toBe(estadoCompra.CANCELADA);
      expect(compra.fechaBaja).toBeInstanceOf(Date);

      // No se puede cancelar dos veces
      expect(() => compra.cancelar()).toThrow(ConflictError);
    });

    it('debe permitir agregar mensajes mediante método de dominio', () => {
      const compra = new Compra({ cantidad: 1 });
      const mensaje = new Mensaje({ mensaje: '¿A qué hora empieza?' });

      compra.agregarMensaje(mensaje);
      expect(compra.mensajes).toHaveLength(1);
      expect(compra.mensajes[0].mensaje).toBe('¿A qué hora empieza?');
      expect(compra.fechaModificacion).toBeInstanceOf(Date);
    });
  });

  describe('Resenia y Mensaje', () => {
    it('Resenia debe validar puntuación entre 0 y 5', () => {
      expect(() => new Resenia({ puntuacion: 6 })).toThrow(ValidationError);
      expect(() => new Resenia({ puntuacion: -1 })).toThrow(ValidationError);
      expect(new Resenia({ puntuacion: 4.5 }).puntuacion).toBe(4.5);
    });

    it('Mensaje debe validar que el texto no esté vacío', () => {
      expect(() => new Mensaje({ mensaje: '   ' })).toThrow(ValidationError);
    });
  });
});
