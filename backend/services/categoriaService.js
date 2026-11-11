import { Categoria } from '../models/categoria.js';
import { categoriaRepository as defaultCategoriaRepository } from '../repositories/categoriaRepository.js';
import {
    NotFoundError,
    ValidationError,
    ConflictError
} from '../errors/appError.js';

export class CategoriaService {
    constructor(categoriaRepo = defaultCategoriaRepository) {
        this.categoriaRepository = categoriaRepo || defaultCategoriaRepository;
    }

    buscarCategoriaOError = async (id) => {
        if (!id) throw new ValidationError('El ID de categoría es obligatorio.');
        const categoria = await this.categoriaRepository.findById(id);
        if (!categoria) throw new NotFoundError('Categoría no encontrada.');
        return categoria;
    };

    getAll = async () => {
        return await this.categoriaRepository.findAll();
    };

    getById = async (id) => {
        return await this.buscarCategoriaOError(id);
    };

    create = async ({ nombre, descripcion = '', id } = {}) => {
        if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
            throw new ValidationError('El nombre de la categoría es obligatorio.');
        }

        const nombreLimpio = nombre.trim();
        const categorias = await this.categoriaRepository.findAll();

        const existente = categorias.find(
            c => c.nombre && c.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
        );

        if (existente) {
            throw new ConflictError('Ya existe una categoría con ese nombre.');
        }

        const nuevaCategoria = new Categoria({
            id,
            nombre: nombreLimpio,
            descripcion: typeof descripcion === 'string' ? descripcion.trim() : ''
        });

        return await this.categoriaRepository.save(nuevaCategoria);
    };
}

export const categoriaService = new CategoriaService();
