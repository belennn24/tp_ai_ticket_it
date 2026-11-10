import { describe, it, expect, beforeEach } from '@jest/globals';
import { seedDatabase } from '../backend/utils/seed.js';
import { usuarioRepository } from '../backend/repositories/usuarioRepository.js';
import { categoriaRepository } from '../backend/repositories/categoriaRepository.js';
import { eventoRepository } from '../backend/repositories/eventoRepository.js';
import { compraRepository } from '../backend/repositories/compraRepository.js';
import { cambioEstadoCompraRepository } from '../backend/repositories/cambioEstadoCompraRepository.js';
import { mensajeRepository } from '../backend/repositories/mensajeRepository.js';
import { reseniaRepository } from '../backend/repositories/reseniaRepository.js';
import { estadoCompra } from '../backend/models/estadoCompra.js';
import { seedRoutes } from '../backend/routes/seedRoutes.js';

describe('Seed de Datos de Prueba (seedDatabase)', () => {
  beforeEach(async () => {
    await seedDatabase({ clearExisting: true });
  });

  it('debe sembrar correctamente todas las entidades y devolver el resumen esperado', async () => {
    const summary = await seedDatabase({ clearExisting: true });

    expect(summary).toEqual({
      usuarios: 5,
      categorias: 4,
      eventos: 4,
      compras: 3,
      mensajes: 2,
      resenias: 1
    });
  });

  describe('Usuarios sembrados', () => {
    it('debe contener los usuarios clave alineados con Postman (organizador, compradores, admin)', async () => {
      const organizador = await usuarioRepository.findById('usr-organizador-1');
      expect(organizador).toBeDefined();
      expect(organizador.rol).toBe('organizador');
      expect(organizador.nombre).toBe('Carlos');
      expect(organizador.reputacion).toBe(5.0);

      const comprador1 = await usuarioRepository.findById('usr-comprador-1');
      expect(comprador1).toBeDefined();
      expect(comprador1.rol).toBe('comprador');
      expect(comprador1.nombre).toBe('Juan');

      const comprador2 = await usuarioRepository.findById('usr-comprador-2');
      expect(comprador2).toBeDefined();
      expect(comprador2.rol).toBe('comprador');
      expect(comprador2.nombre).toBe('María');

      const admin = await usuarioRepository.findById('usr-admin-1');
      expect(admin).toBeDefined();
      expect(admin.rol).toBe('admin');
    });
  });

  describe('Categorías sembradas', () => {
    it('debe cargar las 4 categorías del catálogo temático', async () => {
      const categorias = await categoriaRepository.findAll();
      expect(categorias).toHaveLength(4);

      const nombres = categorias.map(c => c.nombre);
      expect(nombres).toContain('Música y Recitales');
      expect(nombres).toContain('Teatro y Comedia');
      expect(nombres).toContain('Deportes y Torneos');
      expect(nombres).toContain('Conferencias y Charlas');
    });
  });

  describe('Eventos y Tipos de Entrada sembrados', () => {
    it('debe persistir eventos futuros y pasados con sus respectivos tipos de entrada y cupos', async () => {
      const eventos = await eventoRepository.findAll();
      expect(eventos).toHaveLength(4);

      const rockFest = await eventoRepository.findById('evt-rock-fest-1');
      expect(rockFest).toBeDefined();
      expect(rockFest.tiposEntrada).toHaveLength(3);
      expect(rockFest.organizador.id).toBe('usr-organizador-1');

      // Comprobación de método de dominio en los eventos sembrados
      expect(rockFest.tuPrecioEstaEntre(10000, 20000)).toBe(true);
      expect(rockFest.yaOcurrio()).toBe(false);

      const eventoPasado = await eventoRepository.findById('evt-clasico-pasado-4');
      expect(eventoPasado).toBeDefined();
      expect(eventoPasado.yaOcurrio()).toBe(true);
    });
  });

  describe('Favoritos sembrados', () => {
    it('Juan Comprador debe tener guardado en favoritos el evento Gran Festival de Rock', async () => {
      const juan = await usuarioRepository.findById('usr-comprador-1');
      expect(juan.favoritos).toHaveLength(1);
      expect(juan.tieneFavorito('evt-rock-fest-1')).toBe(true);
    });
  });

  describe('Compras, Chats y Trazabilidad de Estados', () => {
    it('debe precargar compra activa en estado CONFIRMADA con mensajes de chat y auditoría', async () => {
      const compraActiva = await compraRepository.findById('cmp-activa-1');
      expect(compraActiva).toBeDefined();
      expect(compraActiva.estado).toBe(estadoCompra.CONFIRMADA);
      expect(compraActiva.cantidad).toBe(2);
      expect(compraActiva.total).toBe(30000);
      expect(compraActiva.mensajes).toHaveLength(2);

      const historial = await cambioEstadoCompraRepository.findByCompraId('cmp-activa-1');
      expect(historial.length).toBeGreaterThanOrEqual(1);
      expect(historial[0].estado).toBe(estadoCompra.CONFIRMADA);
    });

    it('debe precargar compras en estado UTILIZADA que habiliten reseñas', async () => {
      const compraUtilizada = await compraRepository.findById('cmp-utilizada-1');
      expect(compraUtilizada).toBeDefined();
      expect(compraUtilizada.estado).toBe(estadoCompra.UTILIZADA);
    });
  });

  describe('Reseñas y Reputación', () => {
    it('debe persistir la reseña de María y vincularla a la reputación del organizador', async () => {
      const resenias = await reseniaRepository.findByOrganizadorId('usr-organizador-1');
      expect(resenias).toHaveLength(1);
      expect(resenias[0].puntuacion).toBe(5.0);
      expect(resenias[0].detalle).toContain('Sonido excelente');
    });
  });

  describe('Rutas HTTP de Seed (seedRoutes)', () => {
    it('debe proteger POST / y GET / con authMiddleware y requireRole("admin")', () => {
      const postLayer = seedRoutes.stack.find(
        l => l.route && l.route.path === '/' && l.route.methods.post
      );
      const getLayer = seedRoutes.stack.find(
        l => l.route && l.route.path === '/' && l.route.methods.get
      );

      expect(postLayer).toBeDefined();
      expect(getLayer).toBeDefined();

      // Debe contener al menos el authMiddleware y requireRole antes del handler final
      expect(postLayer.route.stack.length).toBeGreaterThanOrEqual(3);
      expect(getLayer.route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it('POST / debe responder 200 y reiniciar el seed con clearExisting al ser invocado por admin', async () => {
      const req = { user: { id: 'admin-1', rol: 'admin' } };
      const res = {
        statusCode: null,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          this.data = body;
          return this;
        }
      };

      const layer = seedRoutes.stack.find(
        l => l.route && l.route.path === '/' && l.route.methods.post
      );

      expect(layer).toBeDefined();
      const mainHandler = layer.route.stack[layer.route.stack.length - 1].handle;
      await mainHandler(req, res, () => {});

      expect(res.statusCode).toBe(200);
      expect(res.data.resumen.usuarios).toBe(5);
      expect(res.data.resumen.eventos).toBe(4);
      expect(res.data.mensaje).toContain('reinicializada exitosamente');
    });

    it('GET / debe responder 200 y reportar el estado del seed sin destruir datos existentes', async () => {
      const req = { user: { id: 'admin-1', rol: 'admin' } };
      const res = {
        statusCode: null,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          this.data = body;
          return this;
        }
      };

      const layer = seedRoutes.stack.find(
        l => l.route && l.route.path === '/' && l.route.methods.get
      );

      expect(layer).toBeDefined();
      const mainHandler = layer.route.stack[layer.route.stack.length - 1].handle;
      await mainHandler(req, res, () => {});

      expect(res.statusCode).toBe(200);
      expect(res.data.resumen.usuarios).toBe(5);
      expect(res.data.mensaje).toContain('Seed verificado');
    });
  });
});
