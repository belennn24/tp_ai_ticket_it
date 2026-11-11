import { describe, it, expect, beforeEach } from '@jest/globals';
import { UsuarioService } from '../backend/services/usuarioService.js';
import { UsuarioRepository } from '../backend/repositories/usuarioRepository.js';
import { EventoRepository } from '../backend/repositories/eventoRepository.js';
import { Evento } from '../backend/models/evento.js';
import { Usuario } from '../backend/models/usuario.js';
import { NotFoundError, ConflictError, ValidationError } from '../backend/errors/appError.js';

describe('UsuarioService (Pruebas Unitarias)', () => {
  let usuarioRepo;
  let eventoRepo;
  let service;

  beforeEach(async () => {
    usuarioRepo = new UsuarioRepository();
    eventoRepo = new EventoRepository();
    service = new UsuarioService(usuarioRepo, eventoRepo);

    await usuarioRepo.save(new Usuario({ id: 'user-1', nombre: 'Juan' }));
  });

  describe('Favoritos (obtenerFavoritos, agregarFavorito, eliminarFavorito)', () => {
    it('debe agregar y listar eventos favoritos exitosamente', async () => {
      const evento = new Evento({ id: 'ev-1', nombre: 'Festival Jazz' });
      await eventoRepo.save(evento);

      await service.agregarFavorito('user-1', 'ev-1');

      const favoritos = await service.obtenerFavoritos('user-1');
      expect(favoritos).toHaveLength(1);
      expect(favoritos[0].id).toBe('ev-1');
    });

    it('agregarFavorito debe lanzar NotFoundError (404) si el evento no existe', async () => {
      await expect(service.agregarFavorito('user-1', 'ev-fantasma')).rejects.toThrow(NotFoundError);
    });

    it('agregarFavorito debe lanzar ConflictError (409) si el evento ya estaba en favoritos', async () => {
      const evento = new Evento({ id: 'ev-1', nombre: 'Festival Jazz' });
      await eventoRepo.save(evento);

      await service.agregarFavorito('user-1', 'ev-1');

      await expect(service.agregarFavorito('user-1', 'ev-1')).rejects.toThrow(ConflictError);
    });

    it('eliminarFavorito debe remover el evento de favoritos exitosamente', async () => {
      const evento = new Evento({ id: 'ev-1', nombre: 'Festival Jazz' });
      await eventoRepo.save(evento);

      await service.agregarFavorito('user-1', 'ev-1');
      await service.eliminarFavorito('user-1', 'ev-1');

      const favoritos = await service.obtenerFavoritos('user-1');
      expect(favoritos).toHaveLength(0);
    });

    it('eliminarFavorito debe lanzar NotFoundError (404) si el evento no existe o no estaba en favoritos', async () => {
      const evento = new Evento({ id: 'ev-1', nombre: 'Festival Jazz' });
      await eventoRepo.save(evento);

      await expect(service.eliminarFavorito('user-1', 'ev-1')).rejects.toThrow(NotFoundError);
      await expect(service.eliminarFavorito('user-1', 'ev-inexistente')).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError (400) ante parámetros faltantes', async () => {
      await expect(service.obtenerFavoritos('')).rejects.toThrow(ValidationError);
      await expect(service.agregarFavorito('', 'ev-1')).rejects.toThrow(ValidationError);
      await expect(service.eliminarFavorito('user-1', '')).rejects.toThrow(ValidationError);
    });

    it('obtenerFavoritos debe lanzar NotFoundError (404) si el usuario no existe', async () => {
      await expect(service.obtenerFavoritos('usuario-inexistente')).rejects.toThrow(NotFoundError);
    });
  });
});
