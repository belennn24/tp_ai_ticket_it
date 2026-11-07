import { describe, it, expect } from '@jest/globals';
import { compraRoutes } from '../backend/routes/compraRoutes.js';
import { eventoRoutes } from '../backend/routes/eventoRoutes.js';
import { reseniaRoutes } from '../backend/routes/reseniaRoutes.js';
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
});
