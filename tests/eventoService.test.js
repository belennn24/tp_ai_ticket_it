import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EventoService } from '../backend/services/eventoService.js';
import { Evento } from '../backend/models/evento.js';
import { TipoEntrada } from '../backend/models/tipoEntrada.js';
import { Categoria } from '../backend/models/categoria.js';
import { Usuario } from '../backend/models/usuario.js';
import { Compra } from '../backend/models/compra.js';
import { EventoRepository } from '../backend/repositories/eventoRepository.js';
import { CategoriaRepository } from '../backend/repositories/categoriaRepository.js';
import { CompraRepository } from '../backend/repositories/compraRepository.js';
import { UsuarioRepository } from '../backend/repositories/usuarioRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../backend/errors/appError.js';

describe('EventoService (Pruebas Unitarias)', () => {
  let eventoRepo;
  let categoriaRepo;
  let compraRepo;
  let usuarioRepo;
  let service;

  beforeEach(() => {
    eventoRepo = new EventoRepository();
    categoriaRepo = new CategoriaRepository();
    compraRepo = new CompraRepository();
    usuarioRepo = new UsuarioRepository();

    service = new EventoService({
      eventoRepository: eventoRepo,
      categoriaRepository: categoriaRepo,
      compraRepository: compraRepo,
      usuarioRepository: usuarioRepo
    });
  });

  describe('Búsqueda y Catálogo (getAll / buscarEventos)', () => {
    it('debe filtrar eventos por texto en nombre o descripción', async () => {
      const ev1 = new Evento({
        id: '1',
        nombre: 'Recital de Rock Nacional',
        descripcion: 'Bandas en vivo'
      });
      const ev2 = new Evento({
        id: '2',
        nombre: 'Teatro Clásico',
        descripcion: 'Obra de Shakespeare'
      });
      await eventoRepo.save(ev1);
      await eventoRepo.save(ev2);

      const resNombre = await service.getAll({ texto: 'rock' });
      expect(resNombre).toHaveLength(1);
      expect(resNombre[0].id).toBe('1');

      const resDesc = await service.getAll({ texto: 'shakespeare' });
      expect(resDesc).toHaveLength(1);
      expect(resDesc[0].id).toBe('2');
    });

    it('debe filtrar eventos por categoriaId', async () => {
      const ev1 = new Evento({ id: '1', nombre: 'Música', categoria: 'cat-rock' });
      const ev2 = new Evento({ id: '2', nombre: 'Cine', categoria: 'cat-cine' });
      await eventoRepo.save(ev1);
      await eventoRepo.save(ev2);

      const resultados = await service.getAll({ categoriaId: 'cat-rock' });
      expect(resultados).toHaveLength(1);
      expect(resultados[0].id).toBe('1');
    });

    it('debe filtrar por rango de precios utilizando el método de dominio tuPrecioEstaEntre', async () => {
      const evBarato = new Evento({
        id: '1',
        nombre: 'Barato',
        tiposEntrada: [new TipoEntrada({ precio: 500, cupo: 10 })]
      });
      const evCaro = new Evento({
        id: '2',
        nombre: 'Caro',
        tiposEntrada: [new TipoEntrada({ precio: 5000, cupo: 10 })]
      });
      await eventoRepo.save(evBarato);
      await eventoRepo.save(evCaro);

      const filtrados = await service.getAll({ precioMin: 400, precioMax: 1000 });
      expect(filtrados).toHaveLength(1);
      expect(filtrados[0].id).toBe('1');
    });

    it('debe ordenar eventos por fecha, precio y reputación', async () => {
      const ev1 = new Evento({
        id: '1',
        fecha: new Date('2026-12-01'),
        tiposEntrada: [new TipoEntrada({ precio: 2000 })],
        organizador: { reputacion: 4.8 }
      });
      const ev2 = new Evento({
        id: '2',
        fecha: new Date('2026-11-15'),
        tiposEntrada: [new TipoEntrada({ precio: 1000 })],
        organizador: { reputacion: 3.5 }
      });
      await eventoRepo.save(ev1);
      await eventoRepo.save(ev2);

      const porFecha = await service.getAll({ orden: 'fecha' });
      expect(porFecha[0].id).toBe('2'); // más próximo primero

      const porPrecio = await service.getAll({ orden: 'precio' });
      expect(porPrecio[0].id).toBe('2'); // más barato primero

      const porReputacion = await service.getAll({ orden: 'reputacion' });
      expect(porReputacion[0].id).toBe('1'); // mayor reputación primero
    });

    it('debe ordenar por reputación resolviendo organizador cuando es un string ID', async () => {
      const mockUsuarioRepo = {
        findById: jest.fn(async (id) => {
          if (id === 'org-alto') return { id: 'org-alto', nombre: 'Top Org', reputacion: 4.9 };
          if (id === 'org-bajo') return { id: 'org-bajo', nombre: 'Low Org', reputacion: 2.1 };
          return null;
        })
      };

      service.usuarioRepository = mockUsuarioRepo;

      const evA = new Evento({ id: 'ev-a', organizador: 'org-bajo' });
      const evB = new Evento({ id: 'ev-b', organizador: 'org-alto' });

      await eventoRepo.save(evA);
      await eventoRepo.save(evB);

      const ordenados = await service.getAll({ orden: 'reputacion' });
      expect(ordenados[0].id).toBe('ev-b'); // org-alto (4.9) primero
      expect(ordenados[1].id).toBe('ev-a'); // org-bajo (2.1) segundo
    });
  });

  describe('Detalle de Evento (getById / obtenerEventoPorId)', () => {
    it('debe retornar el detalle de un evento existente', async () => {
      const ev = new Evento({ id: 'ev-100', nombre: 'Jazz Night' });
      await eventoRepo.save(ev);

      const encontrado = await service.getById('ev-100');
      expect(encontrado.id).toBe('ev-100');
      expect(encontrado.nombre).toBe('Jazz Night');
    });

    it('debe lanzar NotFoundError (404) si el evento no existe', async () => {
      await expect(service.getById('no-existe')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Creación de Eventos (create / crearEvento)', () => {
    it('debe crear un evento exitosamente con sus tipos de entrada instanciados y referencias como objetos', async () => {
      await categoriaRepo.save(new Categoria({ id: 'cat-musica', nombre: 'Música' }));
      await usuarioRepo.save(new Usuario({ id: 'org-1', nombre: 'Carlos Productor', rol: 'organizador' }));

      const nuevo = await service.create({
        nombre: 'Festival de Verano',
        descripcion: 'Playa y música',
        categoriaId: 'cat-musica',
        fecha: '2026-12-20T20:00:00Z',
        tiposEntrada: [
          { nombre: 'General', precio: 1500, cupo: 100 }
        ],
        organizadorId: 'org-1',
        userRole: 'organizador'
      });

      expect(nuevo).toBeDefined();
      expect(nuevo.id).toBeDefined();
      expect(nuevo.nombre).toBe('Festival de Verano');
      expect(nuevo.categoria).toBeInstanceOf(Categoria);
      expect(nuevo.categoria.id).toBe('cat-musica');
      expect(nuevo.organizador).toBeInstanceOf(Usuario);
      expect(nuevo.organizador.id).toBe('org-1');
      expect(nuevo.tiposEntrada[0]).toBeInstanceOf(TipoEntrada);
      expect(nuevo.tiposEntrada[0].cupo).toBe(100);
    });

    it('debe lanzar NotFoundError (404) si la categoría indicada no existe', async () => {
      await categoriaRepo.save(new Categoria({ id: 'cat-existente', nombre: 'Cultura' }));
      await usuarioRepo.save(new Usuario({ id: 'org-1', nombre: 'Carlos', rol: 'organizador' }));

      await expect(service.create({
        nombre: 'Evento',
        categoriaId: 'cat-inexistente',
        organizadorId: 'org-1',
        fecha: new Date(),
        tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }]
      })).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar NotFoundError (404) si el organizador no existe', async () => {
      await categoriaRepo.save(new Categoria({ id: 'cat-musica', nombre: 'Música' }));

      await expect(service.create({
        nombre: 'Evento',
        categoriaId: 'cat-musica',
        organizadorId: 'org-fantasma',
        fecha: new Date(),
        tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }]
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('Compras y Balance de Cupos (getCompras / obtenerComprasEvento)', () => {
    it('debe retornar compras y el balance de cupos disponibles y vendidos por tipo de entrada', async () => {
      const tipoGeneral = new TipoEntrada({ id: 't-gen', nombre: 'General', cupo: 50, precio: 1000 });
      const tipoVIP = new TipoEntrada({ id: 't-vip', nombre: 'VIP', cupo: 10, precio: 3000 });
      const evento = new Evento({
        id: 'ev-1',
        nombre: 'Concierto',
        organizador: 'org-1',
        tiposEntrada: [tipoGeneral, tipoVIP]
      });
      await eventoRepo.save(evento);

      const compra1 = new Compra({
        id: 'c-1',
        evento: 'ev-1',
        tipoEntrada: 't-gen',
        cantidad: 5,
        estado: 'CONFIRMADA'
      });
      const compraCancelada = new Compra({
        id: 'c-2',
        evento: 'ev-1',
        tipoEntrada: 't-gen',
        cantidad: 2,
        estado: 'CANCELADA'
      });
      await compraRepo.save(compra1);
      await compraRepo.save(compraCancelada);

      const resultado = await service.getCompras('ev-1', {
        organizadorId: 'org-1'
      });

      expect(resultado.eventoId).toBe('ev-1');
      expect(resultado.balanceCupos).toHaveLength(2);

      const balanceGen = resultado.balanceCupos.find(b => b.tipoEntradaId === 't-gen');
      expect(balanceGen.entradasVendidas).toBe(5); // la cancelada no cuenta
      expect(balanceGen.cupoDisponible).toBe(50);
    });

    it('debe lanzar ForbiddenError (403) si el organizador no coincide con el dueño del evento', async () => {
      const evento = new Evento({
        id: 'ev-1',
        organizador: 'org-real'
      });
      await eventoRepo.save(evento);

      await expect(service.getCompras('ev-1', {
        organizadorId: 'org-impostor'
      })).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Métodos auxiliares para eliminar duplicación', () => {
    it('extraerId debe obtener el ID como string tanto de cadenas como de objetos polimórficos', () => {
      expect(service.extraerId('cat-1')).toBe('cat-1');
      expect(service.extraerId({ id: 'org-99' })).toBe('org-99');
      expect(service.extraerId({ id: 123 })).toBe('123');
      expect(service.extraerId(null)).toBe('');
      expect(service.extraerId(undefined)).toBe('');
    });

    it('calcularPrecioMinimo debe obtener el precio mínimo entre los tipos de entrada', () => {
      const eventoConEntradas = {
        tiposEntrada: [
          { precio: 2500 },
          { precio: 1000 },
          { precio: 3000 }
        ]
      };
      expect(service.calcularPrecioMinimo(eventoConEntradas)).toBe(1000);

      const eventoSinEntradas = { tiposEntrada: [] };
      expect(service.calcularPrecioMinimo(eventoSinEntradas)).toBe(Infinity);
    });

    it('armarTiposEntrada delega en TipoEntrada.crear: convierte precio y cupo, y exige que sean mayores a 0', () => {
      const [tipo] = service.armarTiposEntrada([{ nombre: 'General', precio: '150', cupo: 20 }]);
      expect(tipo).toBeInstanceOf(TipoEntrada);
      expect(tipo.precio).toBe(150);
      expect(tipo.cupo).toBe(20);

      expect(() => service.armarTiposEntrada([{ nombre: 'General', precio: 0, cupo: 10 }]))
        .toThrow('El precio del tipo de entrada debe ser mayor a 0.');
      expect(() => service.armarTiposEntrada([{ nombre: 'General', precio: -5, cupo: 10 }])).toThrow(ValidationError);
      expect(() => service.armarTiposEntrada([{ nombre: 'General', precio: 'abc', cupo: 10 }])).toThrow(ValidationError);
      expect(() => service.armarTiposEntrada([{ nombre: 'General', precio: 100, cupo: 0 }]))
        .toThrow('El cupo del tipo de entrada debe ser mayor a 0.');
    });
  });
});
