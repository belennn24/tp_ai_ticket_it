import { describe, it, expect } from '@jest/globals';
import { Compra, Evento, TipoEntrada, Usuario, Mensaje } from '../backend/models/index.js';
import { ValidationError, ForbiddenError } from '../backend/errors/appError.js';

const comprador = new Usuario({ id: 'usr-1', nombre: 'Juan', rol: 'comprador' });
const organizador = new Usuario({ id: 'org-1', nombre: 'Carlos', rol: 'organizador' });
const ajeno = new Usuario({ id: 'usr-2', nombre: 'Otro', rol: 'comprador' });

const crearCompra = () => new Compra({
  id: 'cmp-1',
  comprador,
  evento: new Evento({ id: 'ev-1', nombre: 'Recital', organizador }),
  cantidad: 1
});

describe('Reglas de dominio: mensajes, tipos de entrada, favoritos y roles', () => {
  describe('Compra.enviarMensaje', () => {
    it('registra el mensaje del comprador, asociado a la compra y con el texto recortado', () => {
      const compra = crearCompra();
      const fecha = new Date('2026-11-07T12:00:00Z');

      const mensaje = compra.enviarMensaje({ autor: comprador, texto: '  Hola  ', fechaReferencia: fecha });

      expect(mensaje).toBeInstanceOf(Mensaje);
      expect(mensaje.mensaje).toBe('Hola');
      expect(mensaje.compra).toBe('cmp-1');
      expect(mensaje.usuario).toBe(comprador);
      expect(mensaje.fechaHora).toEqual(fecha);
      expect(compra.mensajes).toEqual([mensaje]);
    });

    it('permite escribir al organizador del evento, también identificado solo por id', () => {
      const compra = crearCompra();
      compra.enviarMensaje({ autor: 'org-1', texto: 'Las puertas abren a las 18' });
      expect(compra.mensajes).toHaveLength(1);
    });

    it('rechaza a quien no participa de la compra, sin agregar el mensaje', () => {
      const compra = crearCompra();
      expect(() => compra.enviarMensaje({ autor: ajeno, texto: 'Hola' })).toThrow(ForbiddenError);
      expect(() => compra.enviarMensaje({ autor: undefined, texto: 'Hola' })).toThrow(ForbiddenError);
      expect(compra.mensajes).toHaveLength(0);
    });

    it('rechaza un mensaje vacío', () => {
      expect(() => crearCompra().enviarMensaje({ autor: comprador, texto: '   ' })).toThrow(ValidationError);
    });
  });

  describe('TipoEntrada.crear', () => {
    it('crea un tipo nuevo convirtiendo precio y cupo a número', () => {
      const tipo = TipoEntrada.crear({ nombre: 'VIP', precio: '5000', cupo: '20' });
      expect(tipo).toBeInstanceOf(TipoEntrada);
      expect(tipo.precio).toBe(5000);
      expect(tipo.cupo).toBe(20);
      expect(tipo.cupoTotal).toBe(20);
    });

    it('exige cupo mayor a 0 en el alta, aunque el constructor sí acepte tipos agotados', () => {
      expect(() => TipoEntrada.crear({ nombre: 'VIP', precio: 5000, cupo: 0 })).toThrow(ValidationError);
      expect(() => new TipoEntrada({ nombre: 'VIP', precio: 5000, cupo: 0 })).not.toThrow();
    });

    it('exige precio mayor a 0', () => {
      expect(() => TipoEntrada.crear({ nombre: 'VIP', precio: 0, cupo: 10 })).toThrow(ValidationError);
    });
  });

  describe('Usuario: favoritos y roles', () => {
    it('agregarFavorito informa si agregó o si el evento ya estaba', () => {
      const usuario = new Usuario({ nombre: 'Belen' });
      expect(usuario.agregarFavorito('ev-1')).toBe(true);
      expect(usuario.agregarFavorito('ev-1')).toBe(false);
      expect(usuario.favoritos).toHaveLength(1);
    });

    it('eliminarFavorito informa si el evento estaba', () => {
      const usuario = new Usuario({ nombre: 'Belen', favoritos: ['ev-1'] });
      expect(usuario.eliminarFavorito('ev-1')).toBe(true);
      expect(usuario.eliminarFavorito('ev-1')).toBe(false);
    });

    it('expone los roles válidos y los que se pueden elegir al registrarse', () => {
      expect(Usuario.ROLES).toEqual(['comprador', 'organizador', 'admin']);
      expect(Usuario.ROLES_REGISTRABLES).toEqual(['comprador', 'organizador']);
      expect(() => new Usuario({ nombre: 'X', rol: 'superusuario' })).toThrow(ValidationError);
    });
  });
});
