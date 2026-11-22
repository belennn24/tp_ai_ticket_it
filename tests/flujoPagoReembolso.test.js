import { describe, it, expect, beforeEach } from '@jest/globals';
import { CompraService } from '../backend/services/compraService.js';
import { Evento, TipoEntrada, Compra, Usuario, estadoCompra } from '../backend/models/index.js';
import { ConflictError, ForbiddenError } from '../backend/errors/appError.js';
import { CompraRepository } from '../backend/repositories/compraRepository.js';
import { EventoRepository } from '../backend/repositories/eventoRepository.js';
import { UsuarioRepository } from '../backend/repositories/usuarioRepository.js';
import { CambioEstadoCompraRepository } from '../backend/repositories/cambioEstadoCompraRepository.js';

const ahora = new Date('2026-11-07T12:00:00Z');
const enCincoDias = new Date('2026-11-12T12:00:00Z');
const ayer = new Date('2026-11-06T12:00:00Z');

const organizador = new Usuario({ id: 'org-1', nombre: 'Carlos', rol: 'organizador' });
const otroOrganizador = new Usuario({ id: 'org-2', nombre: 'Ana', rol: 'organizador' });
const comprador = new Usuario({ id: 'usr-1', nombre: 'Juan', rol: 'comprador' });

const crearEvento = (fecha = enCincoDias) => new Evento({
  id: 'ev-1',
  nombre: 'Recital',
  fecha,
  organizador,
  tiposEntrada: [new TipoEntrada({ id: 'te-1', nombre: 'General', precio: 1000, cupo: 10 })]
});

describe('Flujo de pago y reembolso manual', () => {
  describe('Dominio', () => {
    it('una compra pendiente no puede marcarse como utilizada sin confirmar el pago', () => {
      const compra = new Compra({ comprador, evento: crearEvento(), cantidad: 1 });
      expect(compra.estado).toBe(estadoCompra.PENDIENTE);
      expect(() => compra.utilizar({ quien: organizador, fechaReferencia: ahora })).toThrow(ConflictError);
    });

    it('confirmar pasa la compra a CONFIRMADA y registra quién y cuándo', () => {
      const compra = new Compra({ comprador, evento: crearEvento(), cantidad: 1 });
      const cambio = compra.confirmar(organizador, ahora);
      expect(compra.estado).toBe(estadoCompra.CONFIRMADA);
      expect(cambio.estado).toBe(estadoCompra.CONFIRMADA);
      expect(cambio.quien).toBe('org-1');
      expect(cambio.fechaHora).toEqual(ahora);
    });

    it('no se puede confirmar el pago si el evento ya finalizó', () => {
      const compra = new Compra({ comprador, evento: crearEvento(ayer), cantidad: 1 });
      expect(() => compra.confirmar(organizador, ahora)).toThrow(ConflictError);
      expect(compra.estado).toBe(estadoCompra.PENDIENTE);
    });

    it('solo una compra cancelada puede pasar a reembolsada', () => {
      const compra = new Compra({ comprador, evento: crearEvento(), cantidad: 1 });
      compra.confirmar(organizador, ahora);
      expect(() => compra.reembolsar(organizador, ahora)).toThrow(ConflictError);

      compra.cancelar({ quien: comprador, fechaReferencia: ahora });
      const cambio = compra.reembolsar(organizador, ahora, 'Transferencia devuelta');
      expect(compra.estado).toBe(estadoCompra.REEMBOLSADA);
      expect(cambio.motivo).toBe('Transferencia devuelta');
    });

    it('una compra cancelada antes de confirmar el pago no se puede reembolsar', () => {
      const compra = new Compra({ comprador, evento: crearEvento(), cantidad: 1 });
      expect(compra.pagoConfirmado).toBe(false);
      compra.cancelar({ quien: comprador, fechaReferencia: ahora });

      expect(() => compra.reembolsar(organizador, ahora)).toThrow(ConflictError);
      expect(compra.estado).toBe(estadoCompra.CANCELADA);
      expect(compra.toJSON().pagoConfirmado).toBe(false);
    });

    it('confirmar registra la fecha del pago, y una compra rehidratada ya confirmada se considera pagada', () => {
      const compra = new Compra({ comprador, evento: crearEvento(), cantidad: 1 });
      compra.confirmar(organizador, ahora);
      expect(compra.fechaPago).toEqual(ahora);
      expect(compra.toJSON().pagoConfirmado).toBe(true);

      expect(new Compra({ cantidad: 1, estado: estadoCompra.CONFIRMADA }).pagoConfirmado).toBe(true);
      expect(new Compra({ cantidad: 1, estado: estadoCompra.CANCELADA }).pagoConfirmado).toBe(false);
      expect(new Compra({ cantidad: 1, estado: estadoCompra.CANCELADA, fechaPago: ahora }).pagoConfirmado).toBe(true);
    });

    it('el balance de cupos distingue vendidas (pago confirmado) de reservadas (pendientes)', () => {
      const evento = crearEvento();
      const pendiente = evento.venderEntradas({ comprador, tipoEntradaId: 'te-1', cantidad: 2, fechaReferencia: ahora }).compra;
      const pagada = evento.venderEntradas({ comprador, tipoEntradaId: 'te-1', cantidad: 3, comprasPrevias: [pendiente], fechaReferencia: ahora }).compra;
      pagada.confirmar(organizador, ahora);

      const [balance] = evento.calcularBalanceCupos([pendiente, pagada]);
      expect(balance.entradasVendidas).toBe(3);
      expect(balance.entradasReservadas).toBe(2);
      expect(balance.cupoDisponible).toBe(5);
      expect(balance.cupoTotal).toBe(10);
    });
  });

  describe('CompraService (PATCH /compras/:id/estado)', () => {
    let service;
    let eventoRepo;
    let historialRepo;

    beforeEach(async () => {
      eventoRepo = new EventoRepository();
      historialRepo = new CambioEstadoCompraRepository();
      const usuarioRepo = new UsuarioRepository();
      for (const u of [organizador, otroOrganizador, comprador]) await usuarioRepo.save(u);
      await eventoRepo.save(crearEvento());
      service = new CompraService({
        compraRepository: new CompraRepository(),
        eventoRepository: eventoRepo,
        cambioEstadoCompraRepository: historialRepo,
        usuarioRepository: usuarioRepo,
        fechaActualProvider: () => ahora
      });
    });

    const comprar = () => service.create({ eventoId: 'ev-1', tipoEntradaId: 'te-1', cantidad: 2, compradorId: 'usr-1' });

    it('el organizador confirma el pago y la compra pasa a mostrar los días faltantes', async () => {
      const compra = await comprar();
      expect(compra.estado).toBe(estadoCompra.PENDIENTE);

      const confirmada = await service.cambiarEstado(compra.id, { estado: 'CONFIRMADA', usuarioActual: { id: 'org-1' } });

      expect(confirmada.estado).toBe(estadoCompra.CONFIRMADA);
      expect(confirmada.diasFaltantes).toBe(5);
      const historial = await historialRepo.findByCompraId(compra.id);
      expect(historial.map(h => h.estado)).toEqual([estadoCompra.PENDIENTE, estadoCompra.CONFIRMADA]);
    });

    it('ni el comprador ni otro organizador pueden confirmar el pago', async () => {
      const compra = await comprar();
      await expect(service.cambiarEstado(compra.id, { estado: 'CONFIRMADA', usuarioActual: { id: 'usr-1' } }))
        .rejects.toThrow(ForbiddenError);
      await expect(service.cambiarEstado(compra.id, { estado: 'CONFIRMADA', usuarioActual: { id: 'org-2' } }))
        .rejects.toThrow(ForbiddenError);
    });

    it('el comprador cancela, el cupo se libera y el organizador registra el reembolso', async () => {
      const compra = await comprar();
      await service.cambiarEstado(compra.id, { estado: 'CONFIRMADA', usuarioActual: { id: 'org-1' } });
      await service.cambiarEstado(compra.id, { estado: 'CANCELADA', usuarioActual: { id: 'usr-1' }, motivo: 'No puedo ir' });
      expect((await eventoRepo.findById('ev-1')).tiposEntrada[0].cupo).toBe(10);

      const reembolsada = await service.cambiarEstado(compra.id, {
        estado: 'REEMBOLSADA', usuarioActual: { id: 'org-1' }, motivo: 'Transferencia devuelta'
      });

      expect(reembolsada.estado).toBe(estadoCompra.REEMBOLSADA);
      expect((await eventoRepo.findById('ev-1')).tiposEntrada[0].cupo).toBe(10);
      const historial = await historialRepo.findByCompraId(compra.id);
      expect(historial.map(h => h.estado)).toEqual([
        estadoCompra.PENDIENTE, estadoCompra.CONFIRMADA, estadoCompra.CANCELADA, estadoCompra.REEMBOLSADA
      ]);
    });

    it('el comprador puede cancelar una compra pendiente, y como no pagó no hay reembolso', async () => {
      const compra = await comprar();
      const cancelada = await service.cambiarEstado(compra.id, { estado: 'CANCELADA', usuarioActual: { id: 'usr-1' } });
      expect(cancelada.estado).toBe(estadoCompra.CANCELADA);
      expect(cancelada.pagoConfirmado).toBe(false);
      expect((await eventoRepo.findById('ev-1')).tiposEntrada[0].cupo).toBe(10);

      await expect(service.cambiarEstado(compra.id, { estado: 'REEMBOLSADA', usuarioActual: { id: 'org-1' } }))
        .rejects.toThrow(ConflictError);
    });

    it('no se puede reembolsar una compra que no fue cancelada, ni el comprador puede registrar el reembolso', async () => {
      const compra = await comprar();
      await expect(service.cambiarEstado(compra.id, { estado: 'REEMBOLSADA', usuarioActual: { id: 'org-1' } }))
        .rejects.toThrow(ConflictError);

      await service.cambiarEstado(compra.id, { estado: 'CANCELADA', usuarioActual: { id: 'usr-1' } });
      await expect(service.cambiarEstado(compra.id, { estado: 'REEMBOLSADA', usuarioActual: { id: 'usr-1' } }))
        .rejects.toThrow(ForbiddenError);
    });
  });
});
