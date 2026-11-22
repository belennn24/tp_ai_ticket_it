import { describe, it, expect } from '@jest/globals';
import { Compra, TipoEntrada, Evento, Resenia, Usuario, estadoCompra } from '../backend/models/index.js';
import { ValidationError, ConflictError, NotFoundError } from '../backend/errors/appError.js';

const ahora = new Date('2026-11-07T12:00:00Z');
const fechaFutura = new Date('2026-12-01T21:00:00Z');
const fechaPasada = new Date('2026-11-01T21:00:00Z');

const crearEvento = ({ fecha = fechaFutura, cupo = 10 } = {}) => {
  const tipo = new TipoEntrada({ id: 'te-1', nombre: 'General', precio: 1000, cupo });
  const organizador = new Usuario({ id: 'org-1', nombre: 'Carlos', rol: 'organizador' });
  const evento = new Evento({ id: 'ev-1', nombre: 'Recital', fecha, tiposEntrada: [tipo], organizador });
  return { evento, tipo };
};

const comprador = new Usuario({ id: 'usr-1', nombre: 'Juan', rol: 'comprador' });

const compraCon = (estado, cantidad) => new Compra({ comprador, cantidad, estado });

describe('Reglas de venta en el dominio', () => {
  describe('Evento.venderEntradas', () => {
    it('reserva el cupo, crea la compra pendiente de pago y devuelve su registro de alta', () => {
      const { evento, tipo } = crearEvento();

      const { compra, cambio } = evento.venderEntradas({
        comprador, tipoEntradaId: 'te-1', cantidad: 3, fechaReferencia: ahora
      });

      expect(tipo.cupo).toBe(7);
      expect(compra.estado).toBe(estadoCompra.PENDIENTE);
      expect(compra.evento).toBe(evento);
      expect(compra.comprador).toBe(comprador);
      expect(compra.total).toBe(3000);
      expect(cambio.estado).toBe(estadoCompra.PENDIENTE);
      expect(cambio.quien).toBe('usr-1');
      expect(cambio.fechaHora).toEqual(ahora);
    });

    it('rechaza la venta si el evento ya ocurrió, sin tocar el cupo', () => {
      const { evento, tipo } = crearEvento({ fecha: fechaPasada });

      expect(() => evento.venderEntradas({ comprador, tipoEntradaId: 'te-1', cantidad: 1, fechaReferencia: ahora }))
        .toThrow(ConflictError);
      expect(tipo.cupo).toBe(10);
    });

    it('rechaza un tipo de entrada que no pertenece al evento', () => {
      const { evento } = crearEvento();

      expect(() => evento.venderEntradas({ comprador, tipoEntradaId: 'otro', cantidad: 1, fechaReferencia: ahora }))
        .toThrow(NotFoundError);
    });

    it('rechaza la venta si no hay cupo suficiente', () => {
      const { evento, tipo } = crearEvento({ cupo: 2 });

      expect(() => evento.venderEntradas({ comprador, tipoEntradaId: 'te-1', cantidad: 3, fechaReferencia: ahora }))
        .toThrow(ConflictError);
      expect(tipo.cupo).toBe(2);
    });

    it('valida el límite de entradas por evento antes de descontar cupo', () => {
      const { evento, tipo } = crearEvento();
      const comprasPrevias = [compraCon(estadoCompra.CONFIRMADA, 3)];

      expect(() => evento.venderEntradas({
        comprador, tipoEntradaId: 'te-1', cantidad: 3, comprasPrevias, fechaReferencia: ahora
      })).toThrow(ConflictError);
      expect(tipo.cupo).toBe(10);
    });
  });

  describe('Compra.validarLimitePorEvento', () => {
    it('rechaza más de 5 entradas en una sola compra', () => {
      expect(() => Compra.validarLimitePorEvento([], 6)).toThrow(ValidationError);
    });

    it('suma las compras vigentes previas', () => {
      const previas = [compraCon(estadoCompra.CONFIRMADA, 2), compraCon(estadoCompra.UTILIZADA, 2)];

      expect(() => Compra.validarLimitePorEvento(previas, 1)).not.toThrow();
      expect(() => Compra.validarLimitePorEvento(previas, 2)).toThrow(ConflictError);
    });

    it('no cuenta las compras canceladas ni reembolsadas', () => {
      const previas = [compraCon(estadoCompra.CANCELADA, 4), compraCon(estadoCompra.REEMBOLSADA, 4)];

      expect(() => Compra.validarLimitePorEvento(previas, 5)).not.toThrow();
    });
  });

  describe('Compra.estaVigente y Compra.puedeSerCalificada', () => {
    it.each([
      [estadoCompra.PENDIENTE, true, false],
      [estadoCompra.CONFIRMADA, true, false],
      [estadoCompra.UTILIZADA, true, true],
      [estadoCompra.CANCELADA, false, false],
      [estadoCompra.REEMBOLSADA, false, false]
    ])('estado %s: vigente=%s, calificable=%s', (estado, vigente, calificable) => {
      const compra = compraCon(estado, 1);
      expect(compra.estaVigente()).toBe(vigente);
      expect(compra.puedeSerCalificada()).toBe(calificable);
    });
  });

  describe('Resenia.crear', () => {
    it('rechaza la reseña si el comprador no tiene compras utilizadas del evento', () => {
      const { evento } = crearEvento();
      const comprasDelComprador = [compraCon(estadoCompra.CONFIRMADA, 1), compraCon(estadoCompra.CANCELADA, 1)];

      expect(() => Resenia.crear({ comprador, evento, comprasDelComprador, puntuacion: 5 }))
        .toThrow(ConflictError);
    });

    it('crea la reseña tomando el organizador del evento', () => {
      const { evento } = crearEvento();
      const comprasDelComprador = [compraCon(estadoCompra.UTILIZADA, 1)];

      const resenia = Resenia.crear({ comprador, evento, comprasDelComprador, puntuacion: '4', detalle: 'Muy bueno' });

      expect(resenia).toBeInstanceOf(Resenia);
      expect(resenia.organizador).toBe('org-1');
      expect(resenia.puntuacion).toBe(4);
      expect(resenia.detalle).toBe('Muy bueno');
    });

    it('sigue validando la puntuación', () => {
      const { evento } = crearEvento();
      const comprasDelComprador = [compraCon(estadoCompra.UTILIZADA, 1)];

      expect(() => Resenia.crear({ comprador, evento, comprasDelComprador, puntuacion: 7 }))
        .toThrow(ValidationError);
    });
  });
});
