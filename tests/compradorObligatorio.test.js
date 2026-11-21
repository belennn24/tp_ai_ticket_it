import { describe, it, expect } from '@jest/globals';
import { CompraService } from '../backend/services/compraService.js';
import { ReseniaService } from '../backend/services/reseniaService.js';
import { Evento, TipoEntrada, Compra, Usuario, estadoCompra } from '../backend/models/index.js';
import { NotFoundError, ValidationError } from '../backend/errors/appError.js';
import { CompraRepository } from '../backend/repositories/compraRepository.js';
import { EventoRepository } from '../backend/repositories/eventoRepository.js';
import { UsuarioRepository } from '../backend/repositories/usuarioRepository.js';
import { ReseniaRepository } from '../backend/repositories/reseniaRepository.js';
import { CambioEstadoCompraRepository } from '../backend/repositories/cambioEstadoCompraRepository.js';

const organizador = new Usuario({ id: 'org-1', nombre: 'Carlos', rol: 'organizador', reputacion: 4.5 });

const armar = async () => {
  const eventoRepo = new EventoRepository();
  const compraRepo = new CompraRepository();
  const usuarioRepo = new UsuarioRepository();
  await usuarioRepo.save(organizador);
  await eventoRepo.save(new Evento({
    id: 'ev-1',
    nombre: 'Recital',
    fecha: new Date('2027-01-01T21:00:00Z'),
    organizador,
    tiposEntrada: [new TipoEntrada({ id: 'te-1', nombre: 'General', precio: 1000, cupo: 10 })]
  }));
  return { eventoRepo, compraRepo, usuarioRepo };
};

describe('Las compras y reseñas guardan siempre al comprador como Usuario', () => {
  it('CompraService.create rechaza un comprador inexistente sin descontar cupo', async () => {
    const { eventoRepo, compraRepo, usuarioRepo } = await armar();
    const service = new CompraService({
      eventoRepository: eventoRepo,
      compraRepository: compraRepo,
      usuarioRepository: usuarioRepo,
      cambioEstadoCompraRepository: new CambioEstadoCompraRepository()
    });

    await expect(service.create({ eventoId: 'ev-1', tipoEntradaId: 'te-1', cantidad: 1, compradorId: 'fantasma' }))
      .rejects.toThrow(NotFoundError);
    expect((await eventoRepo.findById('ev-1')).tiposEntrada[0].cupo).toBe(10);
    expect(await compraRepo.findAll()).toHaveLength(0);
  });

  it('CompraService.create exige el compradorId', async () => {
    const { eventoRepo, compraRepo, usuarioRepo } = await armar();
    const service = new CompraService({ eventoRepository: eventoRepo, compraRepository: compraRepo, usuarioRepository: usuarioRepo });

    await expect(service.create({ eventoId: 'ev-1', tipoEntradaId: 'te-1', cantidad: 1 }))
      .rejects.toThrow(ValidationError);
  });

  it('ReseniaService.create rechaza un comprador inexistente', async () => {
    const { eventoRepo, compraRepo, usuarioRepo } = await armar();
    await compraRepo.save(new Compra({ id: 'c-1', comprador: 'fantasma', evento: 'ev-1', estado: estadoCompra.UTILIZADA }));
    const reseniaRepo = new ReseniaRepository();
    const service = new ReseniaService({
      reseniaRepository: reseniaRepo,
      compraRepository: compraRepo,
      eventoRepository: eventoRepo,
      usuarioRepository: usuarioRepo
    });

    await expect(service.create({ eventoId: 'ev-1', puntuacion: 5, compradorId: 'fantasma' }))
      .rejects.toThrow(NotFoundError);
    expect(await reseniaRepo.findAll()).toHaveLength(0);
  });
});

describe('Evento.reputacionOrganizador', () => {
  it('devuelve la reputación del organizador, o 0 si no tiene', () => {
    expect(new Evento({ nombre: 'A', organizador }).reputacionOrganizador()).toBe(4.5);
    expect(new Evento({ nombre: 'B' }).reputacionOrganizador()).toBe(0);
  });
});
