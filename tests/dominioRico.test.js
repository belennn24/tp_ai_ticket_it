import { describe, it, expect } from '@jest/globals';
import {
  Usuario,
  Compra,
  TipoEntrada,
  Evento,
  Categoria,
  Mensaje,
  Resenia,
  CambioEstadoCompra,
  estadoCompra
} from '../backend/models/index.js';
import { ValidationError, ConflictError } from '../backend/errors/appError.js';

describe('Entidades de Dominio Rico (Estilo 2026-2c-lu-sa-grupo-2)', () => {
  describe('Usuario', () => {
    it('debe autovalidar que el nombre no sea una cadena vacía', () => {
      expect(() => new Usuario({ nombre: '   ' })).toThrow(ValidationError);
    });

    it('debe gestionar favoritos mediante métodos de dominio con trazabilidad', () => {
      const usuario = new Usuario({ nombre: 'Belen', apellido: 'Perez' });
      expect(usuario.fechaCreacion).toBeInstanceOf(Date);
      expect(usuario.fechaModificacion).toBeNull();

      usuario.agregarFavorito('ev-10');
      expect(usuario.tieneFavorito('ev-10')).toBe(true);
      expect(usuario.fechaModificacion).toBeInstanceOf(Date);

      // No debe duplicar favoritos existentes
      usuario.agregarFavorito('ev-10');
      expect(usuario.favoritos).toHaveLength(1);

      // Remover favorito
      usuario.eliminarFavorito('ev-10');
      expect(usuario.tieneFavorito('ev-10')).toBe(false);
    });

    it('debe recalcular su reputación y actualizar fechaModificacion en el dominio', () => {
      const organizador = new Usuario({ nombre: 'Carlos', rol: 'organizador' });
      const promedio = organizador.recalcularReputacion([{ puntuacion: 4 }, { puntuacion: 5 }]);

      expect(promedio).toBe(4.5);
      expect(organizador.reputacion).toBe(4.5);
      expect(organizador.fechaModificacion).toBeInstanceOf(Date);
    });

    it('debe permitir modificar sus datos validando invariantes', () => {
      const usuario = new Usuario({ nombre: 'Juan' });
      usuario.modificar({ nombre: 'Juan Carlos', apellido: 'Gomez' });

      expect(usuario.nombre).toBe('Juan Carlos');
      expect(usuario.apellido).toBe('Gomez');
      expect(usuario.fechaModificacion).toBeInstanceOf(Date);
      expect(() => usuario.modificar({ nombre: '  ' })).toThrow(ValidationError);
    });

    it('debe almacenar rol como atributo informativo y permitir modificarlo', () => {
      const uDefault = new Usuario({ nombre: 'x' });
      expect(uDefault.rol).toBe('comprador');

      const uOrg = new Usuario({ nombre: 'Organizador Uno', rol: 'organizador' });
      expect(uOrg.rol).toBe('organizador');

      const uAdmin = new Usuario({ nombre: 'Admin Uno', rol: 'admin' });
      expect(uAdmin.rol).toBe('admin');

      uDefault.modificar({ rol: 'organizador' });
      expect(uDefault.rol).toBe('organizador');
    });
  });

  describe('TipoEntrada', () => {
    it('debe validar que precio y cupo no sean negativos', () => {
      expect(() => new TipoEntrada({ nombre: 'VIP', precio: -10, cupo: 100 })).toThrow(ValidationError);
      expect(() => new TipoEntrada({ nombre: 'VIP', precio: 50, cupo: -5 })).toThrow(ValidationError);
    });

    it('debe descontar cupo de forma atómica y lanzar ConflictError si no alcanza', () => {
      const tipo = new TipoEntrada({ nombre: 'General', precio: 100, cupo: 5 });
      expect(tipo.hayCupoPara(3)).toBe(true);
      expect(tipo.hayCupoPara(10)).toBe(false);

      tipo.descontarCupo(3);
      expect(tipo.cupo).toBe(2);
      expect(tipo.fechaModificacion).toBeInstanceOf(Date);

      expect(() => tipo.descontarCupo(3)).toThrow(ConflictError);
    });

    it('debe restituir cupo válidamente', () => {
      const tipo = new TipoEntrada({ nombre: 'General', precio: 100, cupo: 2 });
      tipo.restituirCupo(3);
      expect(tipo.cupo).toBe(5);

      expect(() => tipo.restituirCupo(-1)).toThrow(ValidationError);
    });
  });

  describe('Evento', () => {
    it('debe validar que el nombre no sea una cadena vacía', () => {
      expect(() => new Evento({ nombre: '   ' })).toThrow(ValidationError);
    });

    it('debe comprobar si ya ocurrió según la fecha de referencia', () => {
      const eventoPasado = new Evento({ nombre: 'Recital Pasado', fecha: new Date('2020-01-01') });
      expect(eventoPasado.yaOcurrio()).toBe(true);

      const eventoFuturo = new Evento({ nombre: 'Recital Futuro', fecha: new Date('2030-01-01') });
      expect(eventoFuturo.yaOcurrio()).toBe(false);
    });

    it('finalizo debe comparar por día calendario y no por hora de inicio', () => {
      const evento = new Evento({ nombre: 'Recital', fecha: new Date(2026, 10, 21, 21, 0) });
      expect(evento.finalizo(new Date(2026, 10, 21, 20, 0))).toBe(false);
      expect(evento.finalizo(new Date(2026, 10, 21, 23, 30))).toBe(false);
      expect(evento.yaOcurrio(new Date(2026, 10, 21, 23, 30))).toBe(true);
      expect(evento.finalizo(new Date(2026, 10, 22, 0, 1))).toBe(true);
    });

    it('debe buscar, descontar cupo, calcular precio mínimo y balance de cupos en el dominio', () => {
      const evento = new Evento({ nombre: 'Festival' });
      const tipo1 = new TipoEntrada({ id: 't-1', nombre: 'Campo', precio: 200, cupo: 50 });
      const tipo2 = new TipoEntrada({ id: 't-2', nombre: 'VIP', precio: 500, cupo: 10 });

      evento.agregarTipoEntrada(tipo1);
      evento.agregarTipoEntrada(tipo2);

      expect(evento.buscarTipoEntrada('t-1')).toBe(tipo1);
      expect(evento.buscarTipoEntrada('inexistente')).toBeNull();
      expect(evento.precioMinimo()).toBe(200);

      evento.descontarCupo('t-1', 4);
      expect(tipo1.cupo).toBe(46);

      const balance = evento.calcularBalanceCupos([
        { tipoEntrada: 't-1', cantidad: 4, estado: estadoCompra.CONFIRMADA },
        { tipoEntrada: 't-1', cantidad: 2, estado: estadoCompra.CANCELADA },
        { tipoEntrada: 't-1', cantidad: 1, estado: estadoCompra.REEMBOLSADA },
        { tipoEntrada: 't-1', cantidad: 3, estado: estadoCompra.PENDIENTE }
      ]);
      const balanceT1 = balance.find(b => b.id === 't-1');
      expect(balanceT1.entradasVendidas).toBe(4);
      expect(balanceT1.cupoTotal).toBe(50);
      expect(balanceT1.cupoDisponible).toBe(46);
    });
  });

  describe('Compra', () => {
    it('debe autocalcular el total según cantidad y precio del tipo de entrada', () => {
      const tipo = new TipoEntrada({ precio: 250, cupo: 10 });
      const compra = new Compra({
        tipoEntrada: tipo,
        cantidad: 3
      });

      expect(compra.total).toBe(750);
      expect(compra.fechaCompra).toBeInstanceOf(Date);
      expect(compra.fechaModificacion).toBeNull();
      expect(compra.estado).toBe(estadoCompra.PENDIENTE);
    });

    it('debe validar transiciones permitidas mediante la tabla de transiciones (puedePasarA y actualizarEstado)', () => {
      const compra = new Compra({ cantidad: 1, estado: estadoCompra.PENDIENTE });
      expect(compra.puedePasarA(estadoCompra.CONFIRMADA)).toBe(true);
      expect(compra.puedePasarA(estadoCompra.CANCELADA)).toBe(true);
      expect(compra.puedePasarA(estadoCompra.UTILIZADA)).toBe(false);

      compra.actualizarEstado(estadoCompra.CONFIRMADA);
      expect(compra.estado).toBe(estadoCompra.CONFIRMADA);
      expect(compra.puedePasarA(estadoCompra.UTILIZADA)).toBe(true);
      expect(compra.puedePasarA(estadoCompra.CANCELADA)).toBe(true);
      expect(compra.puedePasarA(estadoCompra.PENDIENTE)).toBe(false);
      expect(compra.puedePasarA(estadoCompra.REEMBOLSADA)).toBe(false);

      // Pasar a UTILIZADA y verificar que es estado terminal
      compra.actualizarEstado(estadoCompra.UTILIZADA);
      expect(compra.estado).toBe(estadoCompra.UTILIZADA);
      expect(compra.puedePasarA(estadoCompra.CONFIRMADA)).toBe(false);
      expect(compra.puedePasarA(estadoCompra.CANCELADA)).toBe(false);
      expect(() => compra.actualizarEstado(estadoCompra.CONFIRMADA)).toThrow(ConflictError);
    });

    it('debe gestionar transiciones de estado de forma segura', () => {
      const compra = new Compra({ cantidad: 1, estado: estadoCompra.CONFIRMADA });
      expect(compra.estado).toBe(estadoCompra.CONFIRMADA);

      compra.utilizar();
      expect(compra.estado).toBe(estadoCompra.UTILIZADA);
      expect(compra.fechaModificacion).toBeInstanceOf(Date);

      // Una compra utilizada no puede ser cancelada
      expect(() => compra.cancelar()).toThrow(ConflictError);
    });

    it('utilizar debe permitirse durante el día del evento aunque ya haya empezado, y no al día siguiente', () => {
      const evento = new Evento({ id: 'ev-hoy', nombre: 'Recital', fecha: new Date(2026, 10, 21, 21, 0) });
      const enLaPuerta = new Compra({ evento, cantidad: 1, estado: estadoCompra.CONFIRMADA });
      enLaPuerta.utilizar({ fechaReferencia: new Date(2026, 10, 21, 21, 15) });
      expect(enLaPuerta.estado).toBe(estadoCompra.UTILIZADA);

      const tarde = new Compra({ evento, cantidad: 1, estado: estadoCompra.CONFIRMADA });
      expect(() => tarde.utilizar({ fechaReferencia: new Date(2026, 10, 22, 10, 0) })).toThrow(ConflictError);
    });

    it('cancelar debe setear estado CANCELADA, registrar fechaBaja y restituir cupo al evento desde el modelo', () => {
      const tipoEntrada = new TipoEntrada({ id: 't-canc', cupo: 8, precio: 100 });
      const evento = new Evento({ id: 'ev-canc', tiposEntrada: [tipoEntrada] });
      const compra = new Compra({
        evento,
        tipoEntrada,
        cantidad: 2,
        estado: estadoCompra.CONFIRMADA
      });

      const cambio = compra.cancelar({ quien: 'usuario-1', motivo: 'Cambio de planes' });

      expect(compra.estado).toBe(estadoCompra.CANCELADA);
      expect(compra.fechaBaja).toBeInstanceOf(Date);
      expect(tipoEntrada.cupo).toBe(10); // 8 + 2 devueltas por el modelo
      expect(cambio).toBeInstanceOf(CambioEstadoCompra);
      expect(cambio.estado).toBe(estadoCompra.CANCELADA);
      expect(cambio.quien).toBe('usuario-1');
      expect(cambio.motivo).toBe('Cambio de planes');

      // No se puede cancelar dos veces ni confirmar una cancelada
      expect(() => compra.cancelar()).toThrow(ConflictError);
      expect(() => compra.confirmar()).toThrow(ConflictError);

      // Desde CANCELADA solo se puede pasar a REEMBOLSADA
      const cambioReembolso = compra.reembolsar('admin-1', new Date(), 'Devolución de dinero');
      expect(compra.estado).toBe(estadoCompra.REEMBOLSADA);
      expect(cambioReembolso.estado).toBe(estadoCompra.REEMBOLSADA);

      // Desde REEMBOLSADA ya no se puede confirmar
      expect(() => compra.confirmar()).toThrow(ConflictError);
    });

    it('debe verificar pertenencia de comprador, organizador y cálculo de días faltantes en el dominio', () => {
      const evento = new Evento({
        id: 'ev-1',
        nombre: 'Concierto',
        organizador: 'org-1',
        fecha: new Date('2026-11-12T12:00:00Z')
      });
      const compra = new Compra({
        comprador: 'comp-1',
        evento,
        cantidad: 2,
        estado: estadoCompra.CONFIRMADA
      });

      expect(compra.calcularDiasFaltantes(new Date('2026-11-07T12:00:00Z'))).toBe(5);
      expect(compra.esDeComprador('comp-1')).toBe(true);
      expect(compra.esDeComprador({ id: 'comp-1' })).toBe(true);
      expect(compra.esDeComprador('otro')).toBe(false);

      expect(compra.esDeOrganizador('org-1')).toBe(true);
      expect(compra.esDeOrganizador({ id: 'org-1' })).toBe(true);
      expect(compra.esDeOrganizador('comp-1')).toBe(false);

      expect(compra.puedeAcceder('comp-1')).toBe(true);
      expect(compra.puedeAcceder('org-1')).toBe(true);
      expect(compra.puedeAcceder('ajeno')).toBe(false);
      expect(compra.puedeAcceder(null)).toBe(false);
      expect(compra.puedeAcceder(undefined)).toBe(false);
    });

    it('Usuario toJSON no debe exponer passwordHash ni campos internos al serializar', () => {
      const u = new Usuario({ nombre: 'Ana', passwordHash: 'hash_secreto_123' });
      const json = JSON.parse(JSON.stringify(u));
      expect(json.passwordHash).toBeUndefined();
      expect(json.borrado).toBeUndefined();
      expect(json.nombre).toBe('Ana');
    });

    it('Compra toJSON debe exponer diasFaltantes y no variables privadas', () => {
      const c = new Compra({ cantidad: 1 });
      const json = JSON.parse(JSON.stringify(c));
      expect(json._diasFaltantes).toBeUndefined();
      expect(json._cupoRestituido).toBeUndefined();
      expect(json.cantidad).toBe(1);
    });

    it('debe permitir agregar mensajes mediante método de dominio', () => {
      const compra = new Compra({ cantidad: 1 });
      const mensaje = new Mensaje({ mensaje: '¿A qué hora empieza?' });

      compra.agregarMensaje(mensaje);
      expect(compra.mensajes).toHaveLength(1);
      expect(compra.mensajes[0].mensaje).toBe('¿A qué hora empieza?');
      expect(compra.fechaModificacion).toBeInstanceOf(Date);
    });
  });

  describe('Categoria, Resenia y Mensaje', () => {
    it('Categoria debe permitir modificarse con autovalidación', () => {
      const cat = new Categoria({ nombre: 'Música' });
      cat.modificar({ nombre: 'Música en Vivo', descripcion: 'Recitales' });
      expect(cat.nombre).toBe('Música en Vivo');
      expect(cat.fechaModificacion).toBeInstanceOf(Date);
      expect(() => cat.modificar({ nombre: '  ' })).toThrow(ValidationError);
    });

    it('Resenia debe validar puntuación entre 0 y 5', () => {
      expect(() => new Resenia({ puntuacion: 6 })).toThrow(ValidationError);
      expect(() => new Resenia({ puntuacion: -1 })).toThrow(ValidationError);
      expect(new Resenia({ puntuacion: 4.5 }).puntuacion).toBe(4.5);
    });

    it('Mensaje debe validar que el texto no esté vacío', () => {
      expect(() => new Mensaje({ mensaje: '   ' })).toThrow(ValidationError);
    });
  });
});
