import { describe, it, expect } from '@jest/globals';
import { compraRoutes } from '../backend/routes/compraRoutes.js';
import { eventoRoutes } from '../backend/routes/eventoRoutes.js';
import { reseniaRoutes } from '../backend/routes/reseniaRoutes.js';
import { categoriaRoutes } from '../backend/routes/categoriaRoutes.js';
import { usuarioRoutes } from '../backend/routes/usuarioRoutes.js';
import { authRoutes } from '../backend/routes/authRoutes.js';
import { seedRoutes } from '../backend/routes/seedRoutes.js';
import { authMiddleware } from '../backend/middlewares/authMiddleware.js';

describe('Rutas y Seguridad - Delegación de Permisos en Routers', () => {
  const obtenerMiddlewaresDeRuta = (router, path, method) => {
    const layer = router.stack.find(
      l => l.route && l.route.path === path && l.route.methods[method.toLowerCase()]
    );
    if (!layer) return [];
    return layer.route.stack.map(s => s.handle);
  };

  describe('compraRoutes', () => {
    it('GET / debe incluir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(compraRoutes, '/', 'get');
      expect(handles).toContain(authMiddleware);
    });

    it('POST / debe incluir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(compraRoutes, '/', 'post');
      expect(handles).toContain(authMiddleware);
    });

    it('GET /:id debe incluir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(compraRoutes, '/:id', 'get');
      expect(handles).toContain(authMiddleware);
    });

    it('PATCH /:id/estado debe incluir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(compraRoutes, '/:id/estado', 'patch');
      expect(handles).toContain(authMiddleware);
    });

    it('PATCH /:id (modificación parcial) debe incluir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(compraRoutes, '/:id', 'patch');
      expect(handles).toContain(authMiddleware);
    });

    it('PATCH /:id/cancelar debe incluir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(compraRoutes, '/:id/cancelar', 'patch');
      expect(handles).toContain(authMiddleware);
    });

    it('PATCH /:id/utilizar debe incluir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(compraRoutes, '/:id/utilizar', 'patch');
      expect(handles).toContain(authMiddleware);
    });
  });

  describe('eventoRoutes', () => {
    it('GET / debe ser pública (NO debe incluir authMiddleware)', () => {
      const handles = obtenerMiddlewaresDeRuta(eventoRoutes, '/', 'get');
      expect(handles).not.toContain(authMiddleware);
    });

    it('GET /:id debe ser pública (NO debe incluir authMiddleware)', () => {
      const handles = obtenerMiddlewaresDeRuta(eventoRoutes, '/:id', 'get');
      expect(handles).not.toContain(authMiddleware);
    });

    it('POST / debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(eventoRoutes, '/', 'post');
      expect(handles).toContain(authMiddleware);
    });

    it('GET /:id/compras debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(eventoRoutes, '/:id/compras', 'get');
      expect(handles).toContain(authMiddleware);
    });
  });

  describe('reseniaRoutes', () => {
    it('POST / debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(reseniaRoutes, '/', 'post');
      expect(handles).toContain(authMiddleware);
    });

    it('GET /organizadores/:id debe ser pública (NO debe incluir authMiddleware)', () => {
      const handles = obtenerMiddlewaresDeRuta(reseniaRoutes, '/organizadores/:id', 'get');
      expect(handles).not.toContain(authMiddleware);
    });
  });

  describe('categoriaRoutes', () => {
    it('GET / debe ser pública (NO debe incluir authMiddleware)', () => {
      const handles = obtenerMiddlewaresDeRuta(categoriaRoutes, '/', 'get');
      expect(handles).not.toContain(authMiddleware);
    });

    it('POST / debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(categoriaRoutes, '/', 'post');
      expect(handles).toContain(authMiddleware);
    });
  });

  describe('usuarioRoutes', () => {
    it('GET /me/favoritos debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(usuarioRoutes, '/me/favoritos', 'get');
      expect(handles).toContain(authMiddleware);
    });

    it('POST /me/favoritos/:eventoId debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(usuarioRoutes, '/me/favoritos/:eventoId', 'post');
      expect(handles).toContain(authMiddleware);
    });

    it('DELETE /me/favoritos/:eventoId debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(usuarioRoutes, '/me/favoritos/:eventoId', 'delete');
      expect(handles).toContain(authMiddleware);
    });
  });

  describe('authRoutes', () => {
    it('POST /login debe ser pública (NO debe requerir authMiddleware)', () => {
      const handles = obtenerMiddlewaresDeRuta(authRoutes, '/login', 'post');
      expect(handles).not.toContain(authMiddleware);
    });

    it('POST /registro debe ser pública (NO debe requerir authMiddleware)', () => {
      const handles = obtenerMiddlewaresDeRuta(authRoutes, '/registro', 'post');
      expect(handles).not.toContain(authMiddleware);
    });

    it('GET /me debe requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(authRoutes, '/me', 'get');
      expect(handles).toContain(authMiddleware);
    });
  });

  describe('seedRoutes', () => {
    it('POST / (reinicio de base) DEBE requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(seedRoutes, '/', 'post');
      expect(handles).toContain(authMiddleware);
    });

    it('GET / (verificación de base) DEBE requerir authMiddleware', () => {
      const handles = obtenerMiddlewaresDeRuta(seedRoutes, '/', 'get');
      expect(handles).toContain(authMiddleware);
    });
  });
});
