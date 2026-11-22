import crypto from 'crypto';
import { ValidationError, NotFoundError, ConflictError } from '../errors/appError.js';
import { estadoCompra } from './estadoCompra.js';
import { Compra } from './compra.js';
import { extraerId } from '../utils/idUtils.js';

const inicioDelDia = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();

export class Evento {
    constructor({
        id,
        nombre,
        descripcion = '',
        categoria = null,
        fecha = null,
        tiposEntrada = [],
        multimedia = [],
        ubicacion = null,
        organizador = null
    } = {}) {
        this.validar({ nombre, fecha });

        this.id = id || crypto.randomUUID();
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.fecha = fecha ? new Date(fecha) : null;
        this.tiposEntrada = Array.isArray(tiposEntrada) ? tiposEntrada : [];
        this.multimedia = Array.isArray(multimedia) ? multimedia : [];
        this.ubicacion = ubicacion || null;
        this.organizador = organizador;

        // Estados iniciales y trazabilidad
        this.activo = true;
        this.borrado = false;
        this.fechaBaja = null;
        this.fechaCreacion = new Date();
        this.fechaModificacion = null;
    }

    validar({ nombre, fecha } = {}) {
        if (nombre !== undefined && typeof nombre === 'string' && nombre.trim().length === 0) {
            throw new ValidationError('El nombre del evento no puede estar vacío');
        }
        if (fecha !== undefined && fecha !== null && !(fecha instanceof Date) && isNaN(Date.parse(fecha))) {
            throw new ValidationError('La fecha del evento es inválida');
        }
    }

    modificar({ nombre, descripcion, categoria, fecha, tiposEntrada, multimedia, ubicacion } = {}) {
        const nuevoNombre = nombre ?? this.nombre;
        const nuevaFecha = fecha !== undefined ? new Date(fecha) : this.fecha;

        this.validar({ nombre: nuevoNombre, fecha: nuevaFecha });
        this.nombre = nuevoNombre;
        this.descripcion = descripcion ?? this.descripcion;
        this.categoria = categoria ?? this.categoria;
        this.fecha = nuevaFecha;
        if (Array.isArray(tiposEntrada)) {
            this.tiposEntrada = tiposEntrada;
        }
        if (Array.isArray(multimedia)) {
            this.multimedia = multimedia;
        }
        if (ubicacion !== undefined) {
            this.ubicacion = ubicacion;
        }
        this.fechaModificacion = new Date();
    }

    tuPrecioEstaEntre(min, max) {
        if (!this.tiposEntrada || this.tiposEntrada.length === 0) {
            return false;
        }

        return this.tiposEntrada.some((tipo) => {
            const precio = tipo.precio;
            return precio >= min && precio <= max;
        });
    }

    precioMinimo() {
        if (!this.tiposEntrada || this.tiposEntrada.length === 0) {
            return Infinity;
        }
        return Math.min(
            ...this.tiposEntrada.map(t => Number(t.precio) || Infinity)
        );
    }

    coincideConTexto(texto) {
        if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
            return true;
        }
        const termino = texto.trim().toLowerCase();
        const nombreCoincide = Boolean(this.nombre && this.nombre.toLowerCase().includes(termino));
        const descCoincide = Boolean(this.descripcion && this.descripcion.toLowerCase().includes(termino));
        return nombreCoincide || descCoincide;
    }

    perteneceACategoria(categoriaId) {
        if (categoriaId === undefined || categoriaId === null || String(categoriaId).trim() === '') {
            return true;
        }
        return String(extraerId(this.categoria) || '') === String(categoriaId).trim();
    }

    esOrganizadoPor(usuarioRef) {
        if (!usuarioRef || !this.organizador) return false;
        return extraerId(this.organizador) === extraerId(usuarioRef);
    }

    reputacionOrganizador() {
        return Number(this.organizador?.reputacion) || 0;
    }

    yaOcurrio(fechaReferencia = new Date()) {
        if (!this.fecha || isNaN(this.fecha.getTime())) return false;
        const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
        return this.fecha.getTime() < ref.getTime();
    }

    // A diferencia de yaOcurrio, compara por día calendario: el evento sigue vigente
    // durante todo el día de su realización (por ejemplo, para validar ingresos en la puerta).
    finalizo(fechaReferencia = new Date()) {
        if (!this.fecha || isNaN(this.fecha.getTime())) return false;
        const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
        return inicioDelDia(ref) > inicioDelDia(this.fecha);
    }

    diasFaltantes(fechaReferencia = new Date()) {
        if (!this.fecha || isNaN(this.fecha.getTime())) return null;
        const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
        const diffMs = this.fecha.getTime() - ref.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    buscarTipoEntrada(tipoEntradaId) {
        if (!tipoEntradaId || !this.tiposEntrada) return null;
        const idBuscado = String(extraerId(tipoEntradaId));
        return this.tiposEntrada.find(t => String(extraerId(t)) === idBuscado) || null;
    }

    obtenerTipoEntrada(tipoEntradaId) {
        const tipo = this.buscarTipoEntrada(tipoEntradaId);
        if (!tipo) {
            throw new NotFoundError('El tipo de entrada solicitado no existe en este evento.');
        }
        return tipo;
    }

    descontarCupo(tipoEntradaId, cantidad) {
        const tipo = this.obtenerTipoEntrada(tipoEntradaId);
        tipo.descontarCupo(cantidad);
        this.fechaModificacion = new Date();
        return tipo;
    }

    restituirCupo(tipoEntradaId, cantidad) {
        const tipo = this.buscarTipoEntrada(tipoEntradaId);
        if (!tipo) return null;
        tipo.restituirCupo(cantidad);
        this.fechaModificacion = new Date();
        return tipo;
    }

    // Venta de entradas: valida todas las reglas antes de modificar nada y después
    // reserva el cupo y crea la compra como una única operación. La compra queda
    // PENDIENTE hasta que el organizador confirme el pago.
    // Devuelve la compra y su registro de alta para el historial.
    venderEntradas({ comprador, tipoEntradaId, cantidad, comprasPrevias = [], fechaReferencia = new Date() } = {}) {
        if (this.yaOcurrio(fechaReferencia)) {
            throw new ConflictError('No se pueden comprar entradas para un evento que ya ocurrió.');
        }
        Compra.validarLimitePorPersona(comprasPrevias, cantidad);
        const tipoEntrada = this.obtenerTipoEntrada(tipoEntradaId);
        const compra = new Compra({ comprador, evento: this, tipoEntrada, cantidad });

        this.descontarCupo(tipoEntrada.id, cantidad);
        const cambio = compra.registrarAlta(comprador, fechaReferencia);
        return { compra, cambio };
    }

    agregarTipoEntrada(tipoEntrada) {
        if (!tipoEntrada) {
            throw new ValidationError('El tipo de entrada es requerido');
        }
        this.tiposEntrada.push(tipoEntrada);
        this.fechaModificacion = new Date();
    }

    calcularBalanceCupos(compras = []) {
        return (this.tiposEntrada || []).map(tipo => {
            const tipoId = String(extraerId(tipo));
            const delTipo = compras.filter(c => String(extraerId(c.tipoEntrada)) === tipoId);
            const sumar = (estados) => delTipo
                .filter(c => estados.includes(c?.estado))
                .reduce((acum, c) => acum + (Number(c.cantidad) || 0), 0);
            // Vendidas: pago confirmado. Reservadas: pendientes de pago, que ya ocupan cupo.
            const vendidas = sumar([estadoCompra.CONFIRMADA, estadoCompra.UTILIZADA]);
            const reservadas = sumar([estadoCompra.PENDIENTE]);

            const cupoTotal = tipo.cupoTotal !== undefined ? tipo.cupoTotal : (tipo.cupo + vendidas);
            const cupoDisponible = typeof tipo.cupoDisponible === 'number' ? tipo.cupoDisponible : tipo.cupo;

            return {
                id: tipo.id,
                tipoEntradaId: tipo.id,
                nombre: tipo.nombre,
                cupo: cupoTotal,
                cupoTotal: cupoTotal,
                cupoDisponible: cupoDisponible,
                entradasVendidas: vendidas,
                entradasReservadas: reservadas
            };
        });
    }
}
