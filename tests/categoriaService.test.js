import { describe, it, expect, beforeEach } from '@jest/globals';
import { CategoriaService } from '../backend/services/categoriaService.js';
import { CategoriaRepository } from '../backend/repositories/categoriaRepository.js';
import { Categoria } from '../backend/models/categoria.js';
import { NotFoundError, ConflictError, ValidationError } from '../backend/errors/appError.js';

describe('CategoriaService (Pruebas Unitarias)', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = new CategoriaRepository();
    service = new CategoriaService(repo);
  });

  it('getAll debe retornar todas las categorías', async () => {
    await repo.save(new Categoria({ id: '1', nombre: 'Teatro' }));
    await repo.save(new Categoria({ id: '2', nombre: 'Música' }));

    const todas = await service.getAll();
    expect(todas).toHaveLength(2);
  });

  it('getById debe retornar la categoría existente o lanzar NotFoundError (404)', async () => {
    await repo.save(new Categoria({ id: '1', nombre: 'Teatro' }));

    const encontrada = await service.getById('1');
    expect(encontrada.nombre).toBe('Teatro');

    await expect(service.getById('999')).rejects.toThrow(NotFoundError);
  });

  it('create debe crear una categoría exitosamente', async () => {
    const creada = await service.create({
      nombre: 'Stand Up',
      descripcion: 'Comedia en vivo'
    });

    expect(creada.id).toBeDefined();
    expect(creada.nombre).toBe('Stand Up');
    expect(creada.descripcion).toBe('Comedia en vivo');
  });

  it('create debe lanzar ConflictError (409) si ya existe una categoría con el mismo nombre', async () => {
    await service.create({ nombre: 'Deportes' });

    await expect(service.create({ nombre: 'deportes' })).rejects.toThrow(ConflictError);
  });

  it('create debe lanzar ValidationError (400) si el nombre está vacío', async () => {
    await expect(service.create({ nombre: '   ' })).rejects.toThrow(ValidationError);
  });
});
