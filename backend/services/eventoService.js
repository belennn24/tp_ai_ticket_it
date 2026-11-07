import crypto from 'crypto';
import { Evento } from '../models/evento.js';
import { TipoEntrada } from '../models/tipoEntrada.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/eventoRepository.js';
import { categoriaRepository as defaultCategoriaRepository } from '../repositories/categoriaRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/compraRepository.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError
} from '../errors/appError.js';

/**
 * Service de Eventos.
 * Responsabilidad: Orquestar casos de uso del catálogo de eventos, búsqueda,
 * creación con tipos de entrada y balance de cupos.
 */
export class EventoService {
  constructor(
    eventoRepoOrOptions = defaultEventoRepository,
    categoriaRepo = defaultCategoriaRepository,
    compraRepo = defaultCompraRepository
  ) {
    if (
      eventoRepoOrOptions &&
      typeof eventoRepoOrOptions === 'object' &&
      ('eventoRepository' in eventoRepoOrOptions ||
        'categoriaRepository' in eventoRepoOrOptions ||
        'compraRepository' in eventoRepoOrOptions)
    ) {
      this.eventoRepository =
        eventoRepoOrOptions.eventoRepository || defaultEventoRepository;
      this.categoriaRepository =
        eventoRepoOrOptions.categoriaRepository || defaultCategoriaRepository;
      this.compraRepository =
        eventoRepoOrOptions.compraRepository || defaultCompraRepository;
    } else {
      this.eventoRepository = eventoRepoOrOptions || defaultEventoRepository;
      this.categoriaRepository = categoriaRepo || defaultCategoriaRepository;
      this.compraRepository = compraRepo || defaultCompraRepository;
    }
  }

  generarId() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  }

  extraerId(ref) {
    if (!ref) return '';
    return String(ref.id !== undefined ? ref.id : ref);
  }

  validarRolOrganizador(
    userRole,
    mensajeError = 'Solo los usuarios con rol de organizador están autorizados.'
  ) {
    if (userRole && userRole.toLowerCase() !== 'organizador') {
      throw new ForbiddenError(mensajeError);
    }
  }

  calcularPrecioMinimo(evento) {
    return Math.min(
      ...(evento.tiposEntrada || []).map(t => Number(t.precio) || Infinity)
    );
  }

  validarNumeroPositivo(valor, mensajeError) {
    const num = Number(valor);
    if (isNaN(num) || num <= 0) {
      throw new ValidationError(mensajeError);
    }
    return num;
  }

  /**
   * Caso de uso: Listar y buscar eventos con filtros textuales, de categoría, rango de precios y orden
   */
  async getAll({
    texto,
    categoriaId,
    precioMin,
    precioMax,
    orden
  } = {}) {
    let eventos = await this.eventoRepository.findAll();

    // Filtro textual (en nombre o descripción)
    if (texto && typeof texto === 'string' && texto.trim().length > 0) {
      const termino = texto.trim().toLowerCase();
      eventos = eventos.filter(ev => {
        const nombreCoincide = ev.nombre && ev.nombre.toLowerCase().includes(termino);
        const descCoincide = ev.descripcion && ev.descripcion.toLowerCase().includes(termino);
        return nombreCoincide || descCoincide;
      });
    }

    // Filtro por categoría
    if (categoriaId !== undefined && categoriaId !== null && String(categoriaId).trim() !== '') {
      const catIdStr = String(categoriaId).trim();
      eventos = eventos.filter(ev => {
        const idCat = this.extraerId(ev.categoria);
        return idCat === catIdStr;
      });
    }

    // Filtro por rango de precios utilizando el método de dominio tuPrecioEstaEntre
    const tieneMin = precioMin !== undefined && precioMin !== null;
    const tieneMax = precioMax !== undefined && precioMax !== null;

    if (tieneMin || tieneMax) {
      const min = tieneMin ? Number(precioMin) : 0;
      const max = tieneMax ? Number(precioMax) : Infinity;

      eventos = eventos.filter(ev => {
        if (typeof ev.tuPrecioEstaEntre === 'function') {
          return ev.tuPrecioEstaEntre(min, max);
        }
        // Fallback si no es instancia completa
        return (ev.tiposEntrada || []).some(t => t.precio >= min && t.precio <= max);
      });
    }

    // Ordenamiento opcional: fecha, precio, reputacion
    if (orden) {
      eventos = [...eventos].sort((a, b) => {
        if (orden === 'fecha') {
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        }
        if (orden === 'precio') {
          return this.calcularPrecioMinimo(a) - this.calcularPrecioMinimo(b);
        }
        if (orden === 'reputacion') {
          const repA = Number(a.organizador?.reputacion ?? a.reputacion ?? 0);
          const repB = Number(b.organizador?.reputacion ?? b.reputacion ?? 0);
          return repB - repA;
        }
        return 0;
      });
    }

    return eventos;
  }

  buscarEventos(criterios) {
    return this.getAll(criterios);
  }

  /**
   * Caso de uso: Obtener detalle completo de un evento por ID
   */
  async getById(id) {
    if (!id) {
      throw new ValidationError('El ID de evento es obligatorio.');
    }
    const evento = await this.eventoRepository.findById(id);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado.');
    }
    return evento;
  }

  obtenerEventoPorId(id) {
    return this.getById(id);
  }

  /**
   * Caso de uso: Crear un nuevo evento con sus tipos de entrada
   */
  async create({
    nombre,
    descripcion = '',
    categoriaId,
    fecha,
    tiposEntrada = [],
    multimedia = [],
    organizadorId,
    userRole,
    ...resto
  } = {}) {
    // Verificación de autorización de rol
    this.validarRolOrganizador(
      userRole,
      'Solo los usuarios con rol de organizador pueden crear eventos.'
    );

    // Validar categoría en el repositorio de categorías si existe
    if (this.categoriaRepository && categoriaId) {
      const categoriasRegistradas = await this.categoriaRepository.findAll();
      // Si el repositorio tiene categorías cargadas, valida que exista
      if (categoriasRegistradas.length > 0) {
        const categoria = await this.categoriaRepository.findById(categoriaId);
        if (!categoria) {
          throw new NotFoundError('La categoría seleccionada no existe.');
        }
      }
    }

    // Mapear tipos de entrada a entidades del dominio TipoEntrada
    const tiposEntradaInstancias = (tiposEntrada || []).map(t => {
      const precio = this.validarNumeroPositivo(
        t.precio,
        'El precio del tipo de entrada debe ser mayor a 0.'
      );
      const cupo = this.validarNumeroPositivo(
        t.cupo,
        'El cupo del tipo de entrada debe ser mayor a 0.'
      );

      return new TipoEntrada({
        id: t.id || this.generarId(),
        nombre: t.nombre,
        descripcion: t.descripcion || '',
        precio,
        cupo
      });
    });

    if (!organizadorId) {
      throw new ValidationError('El organizadorId es obligatorio.');
    }

    const nuevoEvento = new Evento({
      id: resto.id || this.generarId(),
      nombre,
      descripcion,
      categoria: categoriaId,
      fecha: new Date(fecha),
      tiposEntrada: tiposEntradaInstancias,
      multimedia: Array.isArray(multimedia) ? multimedia : [],
      organizador: organizadorId
    });

    return await this.eventoRepository.save(nuevoEvento);
  }

  crearEvento(datos) {
    return this.create(datos);
  }

  /**
   * Caso de uso: Obtener compras del evento y balance de cupos por tipo de entrada
   */
  async getCompras(id, { organizadorId, userRole } = {}) {
    const evento = await this.getById(id);

    // Verificación de pertenencia del evento al organizador
    this.validarRolOrganizador(
      userRole,
      'Rol no autorizado para acceder a las compras de este evento.'
    );

    if (organizadorId && evento.organizador) {
      const orgEventoId = this.extraerId(evento.organizador);

      if (orgEventoId !== String(organizadorId)) {
        throw new ForbiddenError('El evento no pertenece al organizador autenticado.');
      }
    }

    const compras = await this.compraRepository.findByEventoId(id);

    // Cálculo del balance de cupos restantes y entradas vendidas por tipo de entrada
    const balanceCupos = (evento.tiposEntrada || []).map(tipo => {
      const tipoId = this.extraerId(tipo);
      const vendidas = compras
        .filter(c => {
          const cTipoId = this.extraerId(c.tipoEntrada);
          return c.estado !== 'CANCELADA' && cTipoId === tipoId;
        })
        .reduce((acum, c) => acum + (Number(c.cantidad) || 0), 0);

      return {
        tipoEntradaId: tipo.id,
        nombre: tipo.nombre,
        cupoDisponible: tipo.cupo,
        entradasVendidas: vendidas
      };
    });

    return {
      eventoId: evento.id,
      balanceCupos,
      compras
    };
  }

  obtenerComprasEvento(id, opciones) {
    return this.getCompras(id, opciones);
  }
}

export const eventoService = new EventoService();
