import { describe, it, expect, beforeEach } from '@jest/globals';
import { MensajeService } from '../backend/services/mensajeService.js';
import { MensajeRepository } from '../backend/repositories/mensajeRepository.js';
import { CompraRepository } from '../backend/repositories/compraRepository.js';
import { Compra } from '../backend/models/compra.js';
import { Evento } from '../backend/models/evento.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../backend/errors/appError.js';

describe('MensajeService (Pruebas Unitarias)', () => {
  let mensajeRepo;
  let compraRepo;
  let service;

  beforeEach(() => {
    mensajeRepo = new MensajeRepository();
    compraRepo = new CompraRepository();
    service = new MensajeService({ mensajeRepository: mensajeRepo, compraRepository: compraRepo });
  });

  describe('Chat de la compra', () => {
    it('debe permitir enviar y listar mensajes al comprador y al organizador del evento', async () => {
      const evento = new Evento({ id: 'ev-1', organizador: 'org-1' });
      const compra = new Compra({
        id: 'compra-1',
        comprador: 'comprador-1',
        evento
      });
      await compraRepo.save(compra);

      // Comprador envía mensaje
      const m1 = await service.enviarMensaje('compra-1', {
        texto: 'Hola, ¿dónde retiro las entradas?',
        usuarioActual: { id: 'comprador-1' }
      });
      expect(m1.mensaje).toBe('Hola, ¿dónde retiro las entradas?');

      // Organizador responde
      const m2 = await service.enviarMensaje('compra-1', {
        texto: 'En la boletería principal con tu DNI.',
        usuarioActual: { id: 'org-1' }
      });
      expect(m2.mensaje).toBe('En la boletería principal con tu DNI.');

      // Listar mensajes para el comprador
      const mensajes = await service.obtenerMensajes('compra-1', {
        usuarioActual: { id: 'comprador-1' }
      });
      expect(mensajes).toHaveLength(2);
    });

    it('debe lanzar ForbiddenError (403) si un usuario ajeno intenta leer o enviar mensajes', async () => {
      const evento = new Evento({ id: 'ev-1', organizador: 'org-1' });
      const compra = new Compra({
        id: 'compra-1',
        comprador: 'comprador-1',
        evento
      });
      await compraRepo.save(compra);

      await expect(service.obtenerMensajes('compra-1', {
        usuarioActual: { id: 'hacker' }
      })).rejects.toThrow(ForbiddenError);

      await expect(service.enviarMensaje('compra-1', {
        texto: 'Intruso',
        usuarioActual: { id: 'hacker' }
      })).rejects.toThrow(ForbiddenError);
    });

    it('debe lanzar NotFoundError (404) si la compra no existe', async () => {
      await expect(service.obtenerMensajes('no-existe', {
        usuarioActual: { id: 'user-1' }
      })).rejects.toThrow(NotFoundError);

      await expect(service.enviarMensaje('no-existe', {
        texto: 'Hola',
        usuarioActual: { id: 'user-1' }
      })).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError (400) si el mensaje está vacío', async () => {
      const compra = new Compra({ id: 'c-1', comprador: 'user-1' });
      await compraRepo.save(compra);

      await expect(service.enviarMensaje('c-1', {
        texto: '    ',
        usuarioActual: { id: 'user-1' }
      })).rejects.toThrow(ValidationError);
    });
  });
});
