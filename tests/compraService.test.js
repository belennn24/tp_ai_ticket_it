import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CompraService } from '../backend/services/compraService.js';
import { Evento, TipoEntrada, Compra, CambioEstadoCompra, estadoCompra } from '../backend/models/index.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../backend/errors/appError.js';
import { CompraRepository } from '../backend/repositories/compraRepository.js';
import { EventoRepository } from '../backend/repositories/eventoRepository.js';
import { CambioEstadoCompraRepository } from '../backend/repositories/cambioEstadoCompraRepository.js';

describe('CompraService (Pruebas Unitarias)', () => {
  let compraRepo;
  let eventoRepo;
  let cambioEstadoRepo;
  let service;

  // Fecha simulada fija: 2026-11-07T12:00:00Z
  const fechaFija = new Date('2026-11-07T12:00:00Z');
  // Evento futuro: exactamente 5 días después (2026-11-12T12:00:00Z)
  const fechaEventoFuturo = new Date('2026-11-12T12:00:00Z');
  // Evento pasado: 2 días antes (2026-11-05T12:00:00Z)
  const fechaEventoPasado = new Date('2026-11-05T12:00:00Z');

  beforeEach(() => {
    compraRepo = new CompraRepository();
    eventoRepo = new EventoRepository();
    cambioEstadoRepo = new CambioEstadoCompraRepository();

    service = new CompraService({
      compraRepository: compraRepo,
      eventoRepository: eventoRepo,
      cambioEstadoCompraRepository: cambioEstadoRepo,
      fechaActualProvider: () => fechaFija
    });
  });

  describe('Creación de compras (create / crearCompra)', () => {
    it('debe crear una compra exitosamente, descontar cupo, registrar auditoría y calcular diasFaltantes', async () => {
      const tipoEntrada = new TipoEntrada({
        id: 'tipo-1',
        nombre: 'General',
        precio: 1000,
        cupo: 10
      });
      const evento = new Evento({
        id: 'evento-1',
        nombre: 'Concierto Rock',
        fecha: fechaEventoFuturo,
        tiposEntrada: [tipoEntrada]
      });
      await eventoRepo.save(evento);

      const resultado = await service.create({
        eventoId: 'evento-1',
        tipoEntradaId: 'tipo-1',
        cantidad: 3,
        compradorId: 'user-123'
      });

      expect(resultado).toBeDefined();
      expect(resultado.estado).toBe(estadoCompra.CONFIRMADA);
      expect(resultado.cantidad).toBe(3);
      expect(resultado.total).toBe(3000);
      expect(resultado.comprador).toBe('user-123');
      expect(resultado.diasFaltantes).toBe(5);

      // Verificación de decremento de cupo en el tipo de entrada
      expect(tipoEntrada.cupo).toBe(7);

      // Verificación de registro histórico en CambioEstadoCompra
      const historial = await cambioEstadoRepo.findByCompraId(resultado.id);
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.CONFIRMADA);
      expect(historial[0].quien).toBe('user-123');
    });

    it('debe lanzar ValidationError si faltan campos obligatorios o la cantidad es inválida', async () => {
      await expect(service.create({ eventoId: 'evento-1' }))
        .rejects.toThrow(ValidationError);

      await expect(service.create({ eventoId: 'evento-1', tipoEntradaId: 't-1', cantidad: 0 }))
        .rejects.toThrow(ValidationError);

      await expect(service.create({ eventoId: 'evento-1', tipoEntradaId: 't-1', cantidad: -2 }))
        .rejects.toThrow(ValidationError);
    });

    it('debe lanzar NotFoundError (404) si el evento no existe', async () => {
      await expect(service.create({
        eventoId: 'evento-inexistente',
        tipoEntradaId: 'tipo-1',
        cantidad: 1,
        compradorId: 'user-1'
      })).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar NotFoundError (404) si el tipo de entrada no existe en el evento', async () => {
      const evento = new Evento({
        id: 'evento-1',
        nombre: 'Teatro',
        fecha: fechaEventoFuturo,
        tiposEntrada: []
      });
      await eventoRepo.save(evento);

      await expect(service.create({
        eventoId: 'evento-1',
        tipoEntradaId: 'tipo-inexistente',
        cantidad: 1,
        compradorId: 'user-1'
      })).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ConflictError (409) cuando no hay cupo suficiente disponible', async () => {
      const tipoEntrada = new TipoEntrada({
        id: 'tipo-1',
        nombre: 'VIP',
        precio: 5000,
        cupo: 2
      });
      const evento = new Evento({
        id: 'evento-1',
        nombre: 'Opera',
        fecha: fechaEventoFuturo,
        tiposEntrada: [tipoEntrada]
      });
      await eventoRepo.save(evento);

      await expect(service.create({
        eventoId: 'evento-1',
        tipoEntradaId: 'tipo-1',
        cantidad: 3,
        compradorId: 'user-1'
      })).rejects.toThrow(ConflictError);

      // El cupo no debe haberse modificado
      expect(tipoEntrada.cupo).toBe(2);
    });
  });

  describe('Consultas (getAll, getById, getByEventoId, getHistorial)', () => {
    it('getAll debe retornar compras y calcular diasFaltantes para las confirmadas', async () => {
      const evento = new Evento({
        id: 'evento-1',
        nombre: 'Festival',
        fecha: fechaEventoFuturo
      });
      await eventoRepo.save(evento);

      const compra1 = new Compra({
        id: 'compra-1',
        comprador: 'user-1',
        evento,
        estado: estadoCompra.CONFIRMADA
      });
      const compra2 = new Compra({
        id: 'compra-2',
        comprador: 'user-2',
        evento,
        estado: estadoCompra.CANCELADA
      });
      await compraRepo.save(compra1);
      await compraRepo.save(compra2);

      const todas = await service.getAll();
      expect(todas).toHaveLength(2);

      const encontrada1 = todas.find(c => c.id === 'compra-1');
      const encontrada2 = todas.find(c => c.id === 'compra-2');

      expect(encontrada1.diasFaltantes).toBe(5);
      expect(encontrada2.diasFaltantes).toBeNull();
    });

    it('getById debe retornar la compra con diasFaltantes o lanzar NotFoundError', async () => {
      const evento = new Evento({
        id: 'evento-1',
        fecha: fechaEventoFuturo
      });
      const compra = new Compra({
        id: 'compra-10',
        comprador: 'user-1',
        evento,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const encontrada = await service.getById('compra-10', { usuarioActual: 'user-1' });
      expect(encontrada.id).toBe('compra-10');
      expect(encontrada.diasFaltantes).toBe(5);

      await expect(service.getById('inexistente', { usuarioActual: 'user-1' })).rejects.toThrow(NotFoundError);
    });

    it('getHistorial debe retornar la lista cronológica de transiciones de estado', async () => {
      const compra = new Compra({ id: 'compra-1', comprador: 'user-1' });
      await compraRepo.save(compra);

      await cambioEstadoRepo.save(new CambioEstadoCompra({
        compra: 'compra-1',
        estado: estadoCompra.CONFIRMADA,
        fechaHora: new Date('2026-11-01T10:00:00Z')
      }));
      await cambioEstadoRepo.save(new CambioEstadoCompra({
        compra: 'compra-1',
        estado: estadoCompra.UTILIZADA,
        fechaHora: new Date('2026-11-02T15:00:00Z')
      }));

      const historial = await service.getHistorial('compra-1', { usuarioActual: 'user-1' });
      expect(historial).toHaveLength(2);
      expect(historial[0].estado).toBe(estadoCompra.CONFIRMADA);
      expect(historial[1].estado).toBe(estadoCompra.UTILIZADA);
    });

    it('getHistorial debe lanzar NotFoundError si la compra no existe', async () => {
      await expect(service.getHistorial('no-existe', { usuarioActual: 'user-1' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('Búsqueda de compra por ID (buscarCompraOError)', () => {
    it('debe retornar la compra cuando existe por su id', async () => {
      const compra = new Compra({ id: 'compra-existente', comprador: 'user-1' });
      await compraRepo.save(compra);

      const encontrada = await service.buscarCompraOError('compra-existente');
      expect(encontrada).toBeDefined();
      expect(encontrada.id).toBe('compra-existente');
    });

    it('debe soportar recibir un objeto con propiedad id', async () => {
      const compra = new Compra({ id: 'compra-obj-id', comprador: 'user-1' });
      await compraRepo.save(compra);

      const encontrada = await service.buscarCompraOError({ id: 'compra-obj-id' });
      expect(encontrada).toBeDefined();
      expect(encontrada.id).toBe('compra-obj-id');
    });

    it('debe lanzar NotFoundError con mensaje "Compra no encontrada." si no existe', async () => {
      await expect(service.buscarCompraOError('id-inexistente'))
        .rejects.toThrow(NotFoundError);
      await expect(service.buscarCompraOError('id-inexistente'))
        .rejects.toThrow('Compra no encontrada.');
    });
  });

  describe('Métodos auxiliares para eliminar duplicación', () => {
    it('extraerId debe obtener el identificador string a partir de cadenas, objetos con .id o vacíos', () => {
      expect(service.extraerId('123')).toBe('123');
      expect(service.extraerId({ id: '456' })).toBe('456');
      expect(service.extraerId({ id: 789 })).toBe('789');
      expect(service.extraerId(null)).toBe('');
      expect(service.extraerId(undefined)).toBe('');
    });
  });

  describe('Cancelación de compras (cancelar / cancelarCompra)', () => {
    it('debe cancelar compra confirmada de evento futuro, restituir cupo y auditar', async () => {
      const tipoEntrada = new TipoEntrada({
        id: 'tipo-1',
        cupo: 5
      });
      const evento = new Evento({
        id: 'ev-1',
        fecha: fechaEventoFuturo,
        tiposEntrada: [tipoEntrada]
      });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-1',
        evento,
        tipoEntrada,
        cantidad: 3,
        comprador: 'user-1',
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const cancelada = await service.cancelar('compra-1', { motivo: 'Problemas de agenda', usuarioActual: 'user-1' });

      expect(cancelada.estado).toBe(estadoCompra.CANCELADA);
      expect(tipoEntrada.cupo).toBe(8); // 5 + 3 restituidos
      expect(cancelada.diasFaltantes).toBeNull();

      const historial = await cambioEstadoRepo.findByCompraId('compra-1');
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.CANCELADA);
    });

    it('debe lanzar ConflictError si la compra ya fue cancelada o utilizada', async () => {
      const evento = new Evento({ fecha: fechaEventoFuturo });
      const compraCancelada = new Compra({ id: 'c-canc', comprador: 'user-1', evento, estado: estadoCompra.CANCELADA });
      const compraUtilizada = new Compra({ id: 'c-util', comprador: 'user-1', evento, estado: estadoCompra.UTILIZADA });

      await compraRepo.save(compraCancelada);
      await compraRepo.save(compraUtilizada);

      await expect(service.cancelar('c-canc', { usuarioActual: 'user-1' })).rejects.toThrow(ConflictError);
      await expect(service.cancelar('c-util', { usuarioActual: 'user-1' })).rejects.toThrow(ConflictError);
    });

    it('debe lanzar ConflictError si el evento ya expiró/finalizó', async () => {
      const eventoPasado = new Evento({
        id: 'ev-pasado',
        fecha: fechaEventoPasado
      });
      await eventoRepo.save(eventoPasado);

      const compra = new Compra({
        id: 'c-pasada',
        comprador: 'user-1',
        evento: eventoPasado,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      await expect(service.cancelar('c-pasada', { usuarioActual: 'user-1' })).rejects.toThrow(ConflictError);
    });

    it('debe lanzar NotFoundError si la compra a cancelar no existe', async () => {
      await expect(service.cancelar('inexistente', { usuarioActual: 'user-1' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('Uso de compra (utilizar / utilizarCompra)', () => {
    it('debe marcar como UTILIZADA una compra CONFIRMADA para evento no finalizado', async () => {
      const evento = new Evento({
        id: 'ev-1',
        organizador: 'org-1',
        fecha: fechaEventoFuturo
      });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-1',
        comprador: 'user-1',
        evento,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const utilizada = await service.utilizar('compra-1', { usuarioActual: 'org-1' });

      expect(utilizada.estado).toBe(estadoCompra.UTILIZADA);
      expect(utilizada.diasFaltantes).toBeNull();

      const historial = await cambioEstadoRepo.findByCompraId('compra-1');
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.UTILIZADA);
      expect(historial[0].quien).toBe('org-1');
    });

    it('debe lanzar ConflictError si la compra no está en estado CONFIRMADA', async () => {
      const evento = new Evento({ fecha: fechaEventoFuturo, organizador: 'org-1' });
      const compra = new Compra({
        id: 'c-1',
        evento,
        estado: estadoCompra.CANCELADA
      });
      await compraRepo.save(compra);

      await expect(service.utilizar('c-1', { usuarioActual: 'org-1' })).rejects.toThrow(ConflictError);
    });

    it('debe lanzar ConflictError si el evento ya finalizó', async () => {
      const eventoPasado = new Evento({
        id: 'ev-pasado',
        organizador: 'org-1',
        fecha: fechaEventoPasado
      });
      await eventoRepo.save(eventoPasado);

      const compra = new Compra({
        id: 'c-expirada',
        evento: eventoPasado,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      await expect(service.utilizar('c-expirada', { usuarioActual: 'org-1' })).rejects.toThrow(ConflictError);
    });

    it('debe lanzar NotFoundError si la compra a utilizar no existe', async () => {
      await expect(service.utilizar('inexistente', { usuarioActual: 'org-1' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('Modificación de estado unificada (cambiarEstado)', () => {
    it('debe cancelar compra con estado CANCELADA y motivo, restituyendo cupo', async () => {
      const tipoEntrada = new TipoEntrada({ id: 't-1', cupo: 2 });
      const evento = new Evento({ id: 'ev-1', fecha: fechaEventoFuturo, tiposEntrada: [tipoEntrada] });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-patch-1',
        evento,
        tipoEntrada,
        cantidad: 2,
        comprador: 'user-comprador',
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const resultado = await service.cambiarEstado('compra-patch-1', {
        estado: 'CANCELADA',
        motivo: 'Inconveniente personal',
        usuarioActual: { id: 'user-comprador', role: 'comprador' }
      });

      expect(resultado.estado).toBe(estadoCompra.CANCELADA);
      expect(tipoEntrada.cupo).toBe(4);
      const historial = await cambioEstadoRepo.findByCompraId('compra-patch-1');
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.CANCELADA);
    });

    it('debe marcar compra como UTILIZADA cuando el organizador lo solicita', async () => {
      const evento = new Evento({
        id: 'ev-org-1',
        organizador: 'org-123',
        fecha: fechaEventoFuturo
      });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-patch-2',
        evento,
        comprador: 'user-comp',
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const resultado = await service.cambiarEstado('compra-patch-2', {
        estado: 'UTILIZADA',
        usuarioActual: { id: 'org-123', role: 'organizador' }
      });

      expect(resultado.estado).toBe(estadoCompra.UTILIZADA);
      const historial = await cambioEstadoRepo.findByCompraId('compra-patch-2');
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.UTILIZADA);
    });

    it('debe lanzar ForbiddenError si el usuario no es el comprador al cancelar', async () => {
      const evento = new Evento({ id: 'ev-1', fecha: fechaEventoFuturo });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-403',
        evento,
        comprador: 'user-1',
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      // Comprador ajeno
      await expect(service.cambiarEstado('compra-403', {
        estado: 'CANCELADA',
        usuarioActual: { id: 'user-hacker' }
      })).rejects.toThrow(ForbiddenError);
    });

    it('debe lanzar ForbiddenError si el usuario no es el organizador dueño del evento al utilizar', async () => {
      const evento = new Evento({
        id: 'ev-org',
        organizador: 'org-real',
        fecha: fechaEventoFuturo
      });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-util-403',
        evento,
        comprador: 'user-1',
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      // Organizador ajeno
      await expect(service.cambiarEstado('compra-util-403', {
        estado: 'UTILIZADA',
        usuarioActual: { id: 'org-impostor' }
      })).rejects.toThrow(ForbiddenError);
    });

    it('debe registrar el motivo de cancelación tanto en la compra como en el cambio de estado', async () => {
      const evento = new Evento({
        id: 'ev-motivo',
        nombre: 'Teatro',
        organizador: 'org-1',
        fecha: fechaEventoFuturo
      });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-con-motivo',
        evento,
        comprador: 'user-1',
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const cancelada = await service.cancelar('compra-con-motivo', {
        motivo: 'Enfermedad y fuerza mayor',
        usuarioActual: 'user-1'
      });

      expect(cancelada.estado).toBe(estadoCompra.CANCELADA);
      expect(cancelada.motivo).toBe('Enfermedad y fuerza mayor');

      const historial = await cambioEstadoRepo.findByCompraId('compra-con-motivo');
      const cambioCancelacion = historial.find(h => h.estado === estadoCompra.CANCELADA);
      expect(cambioCancelacion).toBeDefined();
      expect(cambioCancelacion.motivo).toBe('Enfermedad y fuerza mayor');
    });

    it('debe lanzar ValidationError si el estado solicitado no es soportado', async () => {
      await expect(service.cambiarEstado('c-1', {
        estado: 'INVALIDO'
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('Límite de 5 entradas por persona (create)', () => {
    it('debe rechazar una compra de más de 5 entradas', async () => {
      await eventoRepo.save(new Evento({
        id: 'ev-1',
        nombre: 'Concierto',
        fecha: new Date('2027-01-01T20:00:00Z'),
        tiposEntrada: [new TipoEntrada({ id: 'te-1', nombre: 'General', precio: 1000, cupo: 20 })]
      }));

      await expect(service.create({
        eventoId: 'ev-1',
        tipoEntradaId: 'te-1',
        cantidad: 6,
        compradorId: 'usr-1'
      })).rejects.toThrow(ValidationError);
    });

    it('debe rechazar si la suma de compras activas previas y la nueva supera 5 entradas para el mismo evento', async () => {
      const evento = new Evento({
        id: 'ev-limite',
        nombre: 'Concierto',
        fecha: new Date('2027-01-01T20:00:00Z'),
        tiposEntrada: [new TipoEntrada({ id: 'te-1', nombre: 'General', precio: 1000, cupo: 20 })]
      });
      await eventoRepo.save(evento);

      await service.create({
        eventoId: 'ev-limite',
        tipoEntradaId: 'te-1',
        cantidad: 3,
        compradorId: 'usr-limite'
      });

      await expect(service.create({
        eventoId: 'ev-limite',
        tipoEntradaId: 'te-1',
        cantidad: 3,
        compradorId: 'usr-limite'
      })).rejects.toThrow(ConflictError);
    });

    it('debe permitir comprar hasta 5 entradas si una compra previa fue cancelada', async () => {
      const evento = new Evento({
        id: 'ev-cancel-limite',
        nombre: 'Festival',
        fecha: new Date('2027-01-01T20:00:00Z'),
        tiposEntrada: [new TipoEntrada({ id: 'te-1', nombre: 'General', precio: 1000, cupo: 20 })]
      });
      await eventoRepo.save(evento);

      const previa = await service.create({
        eventoId: 'ev-cancel-limite',
        tipoEntradaId: 'te-1',
        cantidad: 4,
        compradorId: 'usr-cancel'
      });
      await service.cancelar(previa.id, { usuarioActual: { id: 'usr-cancel', rol: 'comprador' } });

      const nueva = await service.create({
        eventoId: 'ev-cancel-limite',
        tipoEntradaId: 'te-1',
        cantidad: 5,
        compradorId: 'usr-cancel'
      });
      expect(nueva.cantidad).toBe(5);
    });
  });
});
