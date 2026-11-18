import { Evento } from '../models/evento.js';
import { TipoEntrada } from '../models/tipoEntrada.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { categoriaRepository as defaultCategoriaRepository } from '../repositories/categoriaRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import { extraerId } from '../utils/idUtils.js';
import {
    NotFoundError,
    ValidationError,
    ForbiddenError
} from '../errors/appError.js';

export class EventoService {
    constructor({
        eventoRepository = defaultEventoRepository,
        categoriaRepository = defaultCategoriaRepository,
        compraRepository = defaultCompraRepository,
        usuarioRepository = defaultUsuarioRepository
    } = {}) {
        this.eventoRepository = eventoRepository;
        this.categoriaRepository = categoriaRepository;
        this.compraRepository = compraRepository;
        this.usuarioRepository = usuarioRepository;
    }

    extraerId = extraerId;

    buscarEventoOError = async (id) => {
        if (!id) throw new ValidationError('El ID de evento es obligatorio.');
        const evento = await this.eventoRepository.findById(id);
        if (!evento) throw new NotFoundError('Evento no encontrado.');
        return evento;
    };

    calcularPrecioMinimo = (evento) => {
        if (typeof evento?.precioMinimo === 'function') {
            return evento.precioMinimo();
        }
        if (!evento?.tiposEntrada || evento.tiposEntrada.length === 0) return Infinity;
        return Math.min(...evento.tiposEntrada.map(t => Number(t?.precio) || Infinity));
    };

    validarNumeroPositivo = (valor, mensajeError) => {
        const num = Number(valor);
        if (isNaN(num) || num <= 0) {
            throw new ValidationError(mensajeError);
        }
        return num;
    };

    armarTiposEntrada = (tiposEntrada = []) => {
        return (tiposEntrada || []).map(t => {
            const precio = this.validarNumeroPositivo(
                t.precio,
                'El precio del tipo de entrada debe ser mayor a 0.'
            );
            const cupo = this.validarNumeroPositivo(
                t.cupo,
                'El cupo del tipo de entrada debe ser mayor a 0.'
            );

            return new TipoEntrada({
                id: t.id,
                nombre: t.nombre,
                descripcion: t.descripcion || '',
                precio,
                cupo
            });
        });
    };

    getAll = async ({
        texto,
        categoriaId,
        precioMin,
        precioMax,
        orden
    } = {}) => {
        let eventos = await this.eventoRepository.findAll();

        if (texto && typeof texto === 'string' && texto.trim().length > 0) {
            eventos = eventos.filter(ev => ev.coincideConTexto(texto));
        }

        if (categoriaId !== undefined && categoriaId !== null && String(categoriaId).trim() !== '') {
            eventos = eventos.filter(ev => ev.perteneceACategoria(categoriaId));
        }

        const tieneMin = precioMin !== undefined && precioMin !== null;
        const tieneMax = precioMax !== undefined && precioMax !== null;
        if (tieneMin || tieneMax) {
            const min = tieneMin ? Number(precioMin) : 0;
            const max = tieneMax ? Number(precioMax) : Infinity;
            eventos = eventos.filter(ev => ev.tuPrecioEstaEntre(min, max));
        }

        if (orden === 'reputacion') {
            const reputaciones = new Map();
            for (const ev of eventos) {
                if (ev.organizador && typeof ev.organizador === 'object' && ev.organizador.reputacion !== undefined) {
                    reputaciones.set(ev.id, Number(ev.organizador.reputacion) || 0);
                } else if (typeof ev.organizador === 'string' && this.usuarioRepository) {
                    const org = await this.usuarioRepository.findById(ev.organizador);
                    reputaciones.set(ev.id, Number(org?.reputacion ?? ev.reputacion ?? 0));
                } else {
                    reputaciones.set(ev.id, Number(ev.reputacion ?? 0));
                }
            }
            return [...eventos].sort((a, b) => (reputaciones.get(b.id) ?? 0) - (reputaciones.get(a.id) ?? 0));
        }

        const ORDENES = {
            fecha: (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
            precio: (a, b) => this.calcularPrecioMinimo(a) - this.calcularPrecioMinimo(b)
        };

        if (orden && ORDENES[orden]) {
            return [...eventos].sort(ORDENES[orden]);
        }

        return eventos;
    };

    getById = async (id) => {
        return await this.buscarEventoOError(id);
    };

    create = async ({
        nombre,
        descripcion = '',
        categoriaId,
        fecha,
        tiposEntrada = [],
        multimedia = [],
        ubicacion = null,
        organizadorId,
        ...resto
    } = {}) => {
        if (this.categoriaRepository && categoriaId) {
            const categoriasRegistradas = await this.categoriaRepository.findAll();
            if (categoriasRegistradas.length > 0) {
                const categoria = await this.categoriaRepository.findById(categoriaId);
                if (!categoria) throw new NotFoundError('La categoría seleccionada no existe.');
            }
        }

        const tiposEntradaInstancias = this.armarTiposEntrada(tiposEntrada);

        if (!organizadorId) {
            throw new ValidationError('El organizadorId es obligatorio.');
        }

        const nuevoEvento = new Evento({
            id: resto.id,
            nombre,
            descripcion,
            categoria: categoriaId,
            fecha: new Date(fecha),
            tiposEntrada: tiposEntradaInstancias,
            multimedia: Array.isArray(multimedia) ? multimedia : [],
            ubicacion: ubicacion || null,
            organizador: organizadorId
        });

        return await this.eventoRepository.save(nuevoEvento);
    };

    getCompras = async (id, { organizadorId } = {}) => {
        const evento = await this.buscarEventoOError(id);

        if (!evento.esOrganizadoPor(organizadorId)) {
            throw new ForbiddenError('El evento no pertenece al organizador autenticado.');
        }

        const compras = await this.compraRepository.findByEventoId(id);
        const balanceCupos = evento.calcularBalanceCupos(compras);

        return {
            eventoId: evento.id,
            balanceCupos,
            cuposDisponibles: balanceCupos,
            compras
        };
    };
}

export const eventoService = new EventoService();
