import { describe, it, expect } from '@jest/globals';
import {
  Categoria,
  Compra,
  CambioEstadoCompra,
  Evento,
  Mensaje,
  Resenia,
  TipoEntrada,
  Usuario
} from '../backend/models/index.js';

describe('Generación de ID en el Dominio (crypto.randomUUID)', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it('Categoria debe generar su propio id UUID automáticamente', () => {
    const categoria = new Categoria({ nombre: 'Teatro' });
    expect(categoria.id).toBeDefined();
    expect(categoria.id).toMatch(UUID_REGEX);
  });

  it('Compra debe generar su propio id UUID automáticamente', () => {
    const compra = new Compra({ cantidad: 2 });
    expect(compra.id).toBeDefined();
    expect(compra.id).toMatch(UUID_REGEX);
  });

  it('CambioEstadoCompra debe generar su propio id UUID automáticamente', () => {
    const cambio = new CambioEstadoCompra({ estado: 'CONFIRMADA' });
    expect(cambio.id).toBeDefined();
    expect(cambio.id).toMatch(UUID_REGEX);
  });

  it('Evento debe generar su propio id UUID automáticamente', () => {
    const evento = new Evento({ nombre: 'Recital' });
    expect(evento.id).toBeDefined();
    expect(evento.id).toMatch(UUID_REGEX);
  });

  it('Mensaje debe generar su propio id UUID automáticamente', () => {
    const mensaje = new Mensaje({ mensaje: 'Hola' });
    expect(mensaje.id).toBeDefined();
    expect(mensaje.id).toMatch(UUID_REGEX);
  });

  it('Resenia debe generar su propio id UUID automáticamente', () => {
    const resenia = new Resenia({ puntuacion: 5 });
    expect(resenia.id).toBeDefined();
    expect(resenia.id).toMatch(UUID_REGEX);
  });

  it('TipoEntrada debe generar su propio id UUID automáticamente', () => {
    const tipo = new TipoEntrada({ nombre: 'General', precio: 1000 });
    expect(tipo.id).toBeDefined();
    expect(tipo.id).toMatch(UUID_REGEX);
  });

  it('Usuario debe generar su propio id UUID automáticamente', () => {
    const usuario = new Usuario({ nombre: 'Juan' });
    expect(usuario.id).toBeDefined();
    expect(usuario.id).toMatch(UUID_REGEX);
  });

  it('debe respetar el id cuando es provisto explícitamente (rehidratación/testing)', () => {
    const cat = new Categoria({ id: 'cat-custom-1', nombre: 'Cine' });
    expect(cat.id).toBe('cat-custom-1');

    const comp = new Compra({ id: 'comp-custom-1' });
    expect(comp.id).toBe('comp-custom-1');
  });
});
