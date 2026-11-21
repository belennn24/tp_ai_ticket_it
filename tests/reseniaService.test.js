import { describe, it, expect, beforeEach } from '@jest/globals';
import { ReseniaService } from '../backend/services/reseniaService.js';
import { Evento } from '../backend/models/evento.js';
import { Compra } from '../backend/models/compra.js';
import { Usuario } from '../backend/models/usuario.js';
import { estadoCompra } from '../backend/models/estadoCompra.js';
import { ReseniaRepository } from '../backend/repositories/reseniaRepository.js';
import { CompraRepository } from '../backend/repositories/compraRepository.js';
import { EventoRepository } from '../backend/repositories/eventoRepository.js';
import { UsuarioRepository } from '../backend/repositories/usuarioRepository.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../backend/errors/appError.js';

describe('ReseniaService (Pruebas Unitarias)', () => {
  let reseniaRepo;
  let compraRepo;
  let eventoRepo;
  let usuarioRepo;
  let service;

  beforeEach(async () => {
    reseniaRepo = new ReseniaRepository();
    compraRepo = new CompraRepository();
    eventoRepo = new EventoRepository();
    usuarioRepo = new UsuarioRepository();
    // Los compradores tienen que existir: la reseña guarda la entidad Usuario, no un id suelto.
    for (const id of ['user-1', 'u1', 'u2']) {
      await usuarioRepo.save(new Usuario({ id, nombre: id, rol: 'comprador' }));
    }

    service = new ReseniaService({
      reseniaRepository: reseniaRepo,
      compraRepository: compraRepo,
      eventoRepository: eventoRepo,
      usuarioRepository: usuarioRepo
    });
  });

  describe('Creación de Reseñas (create / crearResenia)', () => {
    it('debe crear una reseña exitosamente si el comprador tiene una compra UTILIZADA y actualizar reputación', async () => {
      const organizador = new Usuario({ id: 'org-1', nombre: 'Live Events', reputacion: 0 });
      await usuarioRepo.save(organizador);

      const evento = new Evento({
        id: 'ev-1',
        nombre: 'Concierto Rock',
        organizador: 'org-1'
      });
      await eventoRepo.save(evento);

      const compraUtilizada = new Compra({
        id: 'compra-1',
        comprador: 'user-1',
        evento: 'ev-1',
        estado: estadoCompra.UTILIZADA
      });
      await compraRepo.save(compraUtilizada);

      const reseniaCreada = await service.create({
        eventoId: 'ev-1',
        puntuacion: 5,
        detalle: 'Increíble experiencia',
        compradorId: 'user-1'
      });

      expect(reseniaCreada).toBeDefined();
      expect(reseniaCreada.puntuacion).toBe(5);
      expect(reseniaCreada.comprador).toBeInstanceOf(Usuario);
      expect(reseniaCreada.comprador.id).toBe('user-1');
      expect(reseniaCreada.organizador).toBe('org-1');

      // Verifica actualización de reputación del organizador
      const orgActualizado = await usuarioRepo.findById('org-1');
      expect(orgActualizado.reputacion).toBe(5);
    });

    it('debe lanzar ConflictError (409) si el comprador no tiene ninguna compra en estado UTILIZADA', async () => {
      const evento = new Evento({ id: 'ev-1', nombre: 'Teatro', organizador: 'org-1' });
      await eventoRepo.save(evento);

      // Compra confirmada pero NO utilizada
      const compraConfirmada = new Compra({
        id: 'compra-2',
        comprador: 'user-1',
        evento: 'ev-1',
        estado: estadoCompra.CONFIRMADA
      });
      await compraRepo.save(compraConfirmada);

      await expect(service.create({
        eventoId: 'ev-1',
        puntuacion: 4,
        compradorId: 'user-1'
      })).rejects.toThrow(ConflictError);
    });

    it('debe lanzar ConflictError (409) si el comprador ya tiene una reseña registrada para este evento', async () => {
      const evento = new Evento({ id: 'ev-1', nombre: 'Festival', organizador: 'org-1' });
      await eventoRepo.save(evento);

      const compra = new Compra({
        id: 'c-1',
        comprador: 'user-1',
        evento: 'ev-1',
        estado: estadoCompra.UTILIZADA
      });
      await compraRepo.save(compra);

      // Primera reseña exitosa
      await service.create({
        eventoId: 'ev-1',
        puntuacion: 5,
        compradorId: 'user-1'
      });

      // Segunda reseña debe fallar
      await expect(service.create({
        eventoId: 'ev-1',
        puntuacion: 3,
        compradorId: 'user-1'
      })).rejects.toThrow(ConflictError);
    });

    it('debe lanzar NotFoundError (404) si el evento no existe', async () => {
      await expect(service.create({
        eventoId: 'ev-inexistente',
        puntuacion: 5,
        compradorId: 'user-1'
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('Consultas por Organizador (getByOrganizadorId / obtenerReseniasPorOrganizador)', () => {
    it('debe calcular la reputación promedio exacta de múltiples reseñas', async () => {
      const organizador = new Usuario({ id: 'org-1', nombre: 'Productora' });
      await usuarioRepo.save(organizador);

      const evento = new Evento({ id: 'ev-1', organizador: 'org-1' });
      await eventoRepo.save(evento);

      // Simular 2 compras utilizadas de diferentes usuarios
      await compraRepo.save(new Compra({ id: 'c-1', comprador: 'u1', evento: 'ev-1', estado: estadoCompra.UTILIZADA }));
      await compraRepo.save(new Compra({ id: 'c-2', comprador: 'u2', evento: 'ev-1', estado: estadoCompra.UTILIZADA }));

      await service.create({ eventoId: 'ev-1', puntuacion: 4, compradorId: 'u1' });
      await service.create({ eventoId: 'ev-1', puntuacion: 5, compradorId: 'u2' });

      const resultado = await service.getByOrganizadorId('org-1');
      expect(resultado.organizadorId).toBe('org-1');
      expect(resultado.totalResenias).toBe(2);
      expect(resultado.reputacionPromedio).toBe(4.5);
    });

    it('debe retornar reputación 0 si el organizador no tiene reseñas registradas', async () => {
      const organizador = new Usuario({ id: 'org-nuevo', nombre: 'Nuevo Organizador' });
      await usuarioRepo.save(organizador);

      const resultado = await service.getByOrganizadorId('org-nuevo');
      expect(resultado.totalResenias).toBe(0);
      expect(resultado.reputacionPromedio).toBe(0);
    });

    it('debe lanzar NotFoundError (404) si el organizador no existe en el repositorio', async () => {
      await usuarioRepo.save(new Usuario({ id: 'org-registrado' }));

      await expect(service.getByOrganizadorId('org-fantasma')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Métodos auxiliares para eliminar duplicación', () => {
    it('extraerId debe obtener el ID como string tanto de cadenas como de objetos polimórficos', () => {
      expect(service.extraerId('org-123')).toBe('org-123');
      expect(service.extraerId({ id: 'org-456' })).toBe('org-456');
      expect(service.extraerId(null)).toBe('');
      expect(service.extraerId(undefined)).toBe('');
    });

    it('calcularReputacionPromedio debe calcular el promedio con 2 decimales o usar valor por defecto', () => {
      const resenias = [{ puntuacion: 4 }, { puntuacion: 5 }, { puntuacion: 4 }];
      expect(service.calcularReputacionPromedio(resenias)).toBe(4.33);

      expect(service.calcularReputacionPromedio([], 5)).toBe(5);
      expect(service.calcularReputacionPromedio(null, 0)).toBe(0);
    });
  });
});
