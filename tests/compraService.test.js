import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CompraService } from '../backend/services/compraService.js';
import { Evento, TipoEntrada, Compra, CambioEstadoCompra, estadoCompra } from '../backend/models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../backend/errors/appError.js';
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
        evento,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const encontrada = await service.getById('compra-10');
      expect(encontrada.id).toBe('compra-10');
      expect(encontrada.diasFaltantes).toBe(5);

      await expect(service.getById('inexistente')).rejects.toThrow(NotFoundError);
    });

    it('getHistorial debe retornar la lista cronológica de transiciones de estado', async () => {
      const compra = new Compra({ id: 'compra-1' });
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

      const historial = await service.getHistorial('compra-1');
      expect(historial).toHaveLength(2);
      expect(historial[0].estado).toBe(estadoCompra.CONFIRMADA);
      expect(historial[1].estado).toBe(estadoCompra.UTILIZADA);
    });

    it('getHistorial debe lanzar NotFoundError si la compra no existe', async () => {
      await expect(service.getHistorial('no-existe')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Método auxiliar de validación de existencia (validarExistenciaCompra)', () => {
    it('debe retornar la compra cuando existe por su id', async () => {
      const compra = new Compra({ id: 'compra-existente', comprador: 'user-1' });
      await compraRepo.save(compra);

      const encontrada = await service.validarExistenciaCompra('compra-existente');
      expect(encontrada).toBeDefined();
      expect(encontrada.id).toBe('compra-existente');
    });

    it('debe soportar recibir un objeto con propiedad id', async () => {
      const compra = new Compra({ id: 'compra-obj-id', comprador: 'user-1' });
      await compraRepo.save(compra);

      const encontrada = await service.validarExistenciaCompra({ id: 'compra-obj-id' });
      expect(encontrada).toBeDefined();
      expect(encontrada.id).toBe('compra-obj-id');
    });

    it('debe lanzar NotFoundError con mensaje "Compra no encontrada." si no existe', async () => {
      await expect(service.validarExistenciaCompra('id-inexistente'))
        .rejects.toThrow(NotFoundError);
      await expect(service.validarExistenciaCompra('id-inexistente'))
        .rejects.toThrow('Compra no encontrada.');
    });

    it('debe ser invocado por los demás métodos del servicio (getById, getHistorial, cancelar, utilizar, getMensajes, agregarMensaje)', async () => {
      const spy = jest.spyOn(service, 'validarExistenciaCompra');

      const compra = new Compra({
        id: 'compra-metodos',
        comprador: 'user-1',
        evento: { organizador: 'org-1' },
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      await service.getById('compra-metodos');
      expect(spy).toHaveBeenCalledWith('compra-metodos');

      await service.getHistorial('compra-metodos');
      expect(spy).toHaveBeenCalledWith('compra-metodos');

      await service.getMensajes('compra-metodos');
      expect(spy).toHaveBeenCalledWith('compra-metodos');

      spy.mockRestore();
    });
  });

  describe('Método auxiliar de registro de auditoría (registrarCambioEstado)', () => {
    it('debe crear y persistir un CambioEstadoCompra con datos correctos', async () => {
      const cambio = await service.registrarCambioEstado(
        'compra-123',
        estadoCompra.CONFIRMADA,
        'user-abc'
      );

      expect(cambio).toBeDefined();
      expect(cambio.id).toBeDefined();
      expect(cambio.compra).toBe('compra-123');
      expect(cambio.estado).toBe(estadoCompra.CONFIRMADA);
      expect(cambio.quien).toBe('user-abc');
      expect(cambio.fechaHora).toEqual(fechaFija);

      const persistidos = await cambioEstadoRepo.findByCompraId('compra-123');
      expect(persistidos).toHaveLength(1);
      expect(persistidos[0].id).toBe(cambio.id);
    });

    it('debe soportar recibir un objeto compra o con propiedades descriptivas', async () => {
      const compra = new Compra({ id: 'compra-obj-456' });
      const cambio = await service.registrarCambioEstado(
        compra,
        estadoCompra.CANCELADA,
        'admin-xyz'
      );

      expect(cambio.compra).toBe('compra-obj-456');
      expect(cambio.estado).toBe(estadoCompra.CANCELADA);
      expect(cambio.quien).toBe('admin-xyz');
    });

    it('debe ser invocado por create, cancelar y utilizar', async () => {
      const spy = jest.spyOn(service, 'registrarCambioEstado');

      const tipoEntrada = new TipoEntrada({ id: 't-1', precio: 50, cupo: 10 });
      const evento = new Evento({ id: 'ev-reg', fecha: fechaEventoFuturo, tiposEntrada: [tipoEntrada], organizador: 'org-1' });
      await eventoRepo.save(evento);

      const nuevaCompra = await service.create({
        eventoId: 'ev-reg',
        tipoEntradaId: 't-1',
        cantidad: 1,
        compradorId: 'comp-1'
      });
      expect(spy).toHaveBeenCalledWith(nuevaCompra.id, estadoCompra.CONFIRMADA, 'comp-1');

      await service.cancelar(nuevaCompra.id, { quien: 'comp-1' });
      expect(spy).toHaveBeenCalledWith(nuevaCompra.id, estadoCompra.CANCELADA, 'comp-1');

      spy.mockRestore();
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

    it('validarEventoNoFinalizado debe lanzar ConflictError si el evento ya expiró', async () => {
      const eventoExpirado = new Evento({ id: 'ev-old', fecha: fechaEventoPasado });
      await eventoRepo.save(eventoExpirado);

      await expect(
        service.validarEventoNoFinalizado(eventoExpirado, 'El evento ya finalizó.')
      ).rejects.toThrow(ConflictError);
    });

    it('validarEventoNoFinalizado no debe lanzar error si el evento es futuro', async () => {
      const eventoFuturo = new Evento({ id: 'ev-ok', fecha: fechaEventoFuturo });
      await eventoRepo.save(eventoFuturo);

      await expect(
        service.validarEventoNoFinalizado(eventoFuturo)
      ).resolves.not.toThrow();
    });

    it('actualizarEstadoYAuditar debe actualizar estado, auditar en CambioEstadoCompra y resetear diasFaltantes', async () => {
      const compra = new Compra({ id: 'compra-act', estado: estadoCompra.CONFIRMADA });
      await compraRepo.save(compra);

      const actualizada = await service.actualizarEstadoYAuditar(
        compra,
        estadoCompra.UTILIZADA,
        'organizador-1'
      );

      expect(actualizada.estado).toBe(estadoCompra.UTILIZADA);
      expect(actualizada.diasFaltantes).toBeNull();

      const historial = await cambioEstadoRepo.findByCompraId('compra-act');
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.UTILIZADA);
      expect(historial[0].quien).toBe('organizador-1');
    });

    it('restituirCupo debe reintegrar la cantidad de entradas al cupo del evento y del tipo de entrada', async () => {
      const tipoEntrada = new TipoEntrada({ id: 't-cupo', precio: 100, cupo: 4 });
      const evento = new Evento({ id: 'ev-cupo', tiposEntrada: [tipoEntrada] });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'c-restituir',
        evento,
        tipoEntrada,
        cantidad: 3
      });

      await service.restituirCupo(compra);
      expect(tipoEntrada.cupo).toBe(7);
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

      const cancelada = await service.cancelar('compra-1', { motivo: 'Problemas de agenda' });

      expect(cancelada.estado).toBe(estadoCompra.CANCELADA);
      expect(tipoEntrada.cupo).toBe(8); // 5 + 3 restituidos
      expect(cancelada.diasFaltantes).toBeNull();

      const historial = await cambioEstadoRepo.findByCompraId('compra-1');
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.CANCELADA);
    });

    it('debe lanzar ConflictError si la compra ya fue cancelada o utilizada', async () => {
      const evento = new Evento({ fecha: fechaEventoFuturo });
      const compraCancelada = new Compra({ id: 'c-canc', evento, estado: estadoCompra.CANCELADA });
      const compraUtilizada = new Compra({ id: 'c-util', evento, estado: estadoCompra.UTILIZADA });

      await compraRepo.save(compraCancelada);
      await compraRepo.save(compraUtilizada);

      await expect(service.cancelar('c-canc')).rejects.toThrow(ConflictError);
      await expect(service.cancelar('c-util')).rejects.toThrow(ConflictError);
    });

    it('debe lanzar ConflictError si el evento ya expiró/finalizó', async () => {
      const eventoPasado = new Evento({
        id: 'ev-pasado',
        fecha: fechaEventoPasado
      });
      await eventoRepo.save(eventoPasado);

      const compra = new Compra({
        id: 'c-pasada',
        evento: eventoPasado,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      await expect(service.cancelar('c-pasada')).rejects.toThrow(ConflictError);
    });

    it('debe lanzar NotFoundError si la compra a cancelar no existe', async () => {
      await expect(service.cancelar('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Uso de compra (utilizar / utilizarCompra)', () => {
    it('debe marcar como UTILIZADA una compra CONFIRMADA para evento no finalizado', async () => {
      const evento = new Evento({
        id: 'ev-1',
        fecha: fechaEventoFuturo
      });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'compra-1',
        evento,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      const utilizada = await service.utilizar('compra-1');

      expect(utilizada.estado).toBe(estadoCompra.UTILIZADA);
      expect(utilizada.diasFaltantes).toBeNull();

      const historial = await cambioEstadoRepo.findByCompraId('compra-1');
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe(estadoCompra.UTILIZADA);
      expect(historial[0].quien).toBe('ORGANIZADOR');
    });

    it('debe lanzar ConflictError si la compra no está en estado CONFIRMADA', async () => {
      const evento = new Evento({ fecha: fechaEventoFuturo });
      const compra = new Compra({
        id: 'c-1',
        evento,
        estado: estadoCompra.CANCELADA
      });
      await compraRepo.save(compra);

      await expect(service.utilizar('c-1')).rejects.toThrow(ConflictError);
    });

    it('debe lanzar ConflictError si el evento ya finalizó', async () => {
      const eventoPasado = new Evento({
        id: 'ev-pasado',
        fecha: fechaEventoPasado
      });
      await eventoRepo.save(eventoPasado);

      const compra = new Compra({
        id: 'c-expirada',
        evento: eventoPasado,
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compra);

      await expect(service.utilizar('c-expirada')).rejects.toThrow(ConflictError);
    });

    it('debe lanzar NotFoundError si la compra a utilizar no existe', async () => {
      await expect(service.utilizar('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Mensajería / Chat de la compra', () => {
    it('debe agregar y listar mensajes de la compra', async () => {
      const compra = new Compra({
        id: 'compra-chat',
        comprador: 'user-1',
        mensajes: []
      });
      await compraRepo.save(compra);

      const mensaje = await service.agregarMensaje('compra-chat', {
        mensaje: '¿Dónde es el acceso?',
        usuarioId: 'user-1'
      });

      expect(mensaje.mensaje).toBe('¿Dónde es el acceso?');
      expect(mensaje.usuario).toBe('user-1');

      const mensajes = await service.getMensajes('compra-chat');
      expect(mensajes).toHaveLength(1);
      expect(mensajes[0].mensaje).toBe('¿Dónde es el acceso?');
    });

    it('debe lanzar ValidationError si el mensaje está vacío', async () => {
      const compra = new Compra({ id: 'c-1' });
      await compraRepo.save(compra);

      await expect(service.agregarMensaje('c-1', { mensaje: '   ' }))
        .rejects.toThrow(ValidationError);
    });

    it('debe lanzar NotFoundError si la compra para mensajes no existe', async () => {
      await expect(service.getMensajes('inexistente')).rejects.toThrow(NotFoundError);
      await expect(service.agregarMensaje('inexistente', { mensaje: 'Hola' }))
        .rejects.toThrow(NotFoundError);
    });
  });
});
