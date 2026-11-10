import { describe, it, expect, jest } from '@jest/globals';
import express from 'express';
import { z } from 'zod';
import { validate } from '../backend/middlewares/validate.js';
import { ValidationError } from '../backend/errors/appError.js';

describe('validate Middleware', () => {
  it('debe validar y mutar req.body exitosamente', () => {
    const schema = z.object({ nombre: z.string().trim() });
    const middleware = validate(schema, 'body');

    const req = { body: { nombre: '  Rock  ' } };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ nombre: 'Rock' });
  });

  it('debe validar req.query sin fallar cuando query es solo getter (Express 5)', () => {
    const schema = z.object({ q: z.string().optional() });
    const middleware = validate(schema, 'query');

    // Emular prototipo de Express 5 / IncomingMessage donde query es solo un getter
    const proto = {};
    Object.defineProperty(proto, 'query', {
      get() {
        return this._query || {};
      },
      configurable: true
    });

    const req = Object.create(proto);
    req._query = { q: 'musica' };

    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ q: 'musica' });
  });

  it('debe pasar ValidationError al next si los datos no cumplen el esquema', () => {
    const schema = z.object({ edad: z.number() });
    const middleware = validate(schema, 'body');

    const req = { body: { edad: 'no-numero' } };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ValidationError);
  });
});
