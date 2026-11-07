import { compraService } from '../services/compraService.js';

export class CompraController {
    constructor(service = compraService) {
        this.service = service;
    }

    getAll = async (req, res, next) => {
        try {
            const { compradorId, eventoId, estado } = req.query;
            const compras = await this.service.getAll({ compradorId, eventoId, estado });
            res.status(200).json(compras);
        } catch (error) {
            next(error);
        }
    };

    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const compra = await this.service.getById(id);
            res.status(200).json(compra);
        } catch (error) {
            next(error);
        }
    };

    getByEventoId = async (req, res, next) => {
        try {
            const { id } = req.params;
            const compras = await this.service.getByEventoId(id);
            res.status(200).json(compras);
        } catch (error) {
            next(error);
        }
    };

    getHistorial = async (req, res, next) => {
        try {
            const { id } = req.params;
            const historial = await this.service.getHistorial(id);
            res.status(200).json(historial);
        } catch (error) {
            next(error);
        }
    };


    getMensajes = async (req, res, next) => {
        try {
            const { id } = req.params;
            const mensajes = await this.service.getMensajes(id);
            res.status(200).json(mensajes);
        } catch (error) {
            next(error);
        }
    };


    create = async (req, res, next) => {
        try {
            const { eventoId, tipoEntradaId, cantidad, compradorId } = req.body;
            const nuevaCompra = await this.service.create({
                eventoId,
                tipoEntradaId,
                cantidad,
                compradorId,
                ...req.body
            });
            res.status(201).json(nuevaCompra);
        } catch (error) {
            next(error);
        }
    };


    cancelar = async (req, res, next) => {
        try {
            const { id } = req.params;
            const compraCancelada = await this.service.cancelar(id, req.body);
            res.status(200).json(compraCancelada);
        } catch (error) {
            next(error);
        }
    };


    utilizar = async (req, res, next) => {
        try {
            const { id } = req.params;
            const compraUtilizada = await this.service.utilizar(id);
            res.status(200).json(compraUtilizada);
        } catch (error) {
            next(error);
        }
    };

    agregarMensaje = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { mensaje, usuarioId } = req.body;
            const nuevoMensaje = await this.service.agregarMensaje(id, {
                mensaje,
                usuarioId,
                ...req.body
            });
            res.status(201).json(nuevoMensaje);
        } catch (error) {
            next(error);
        }
    };

    enviarMensaje = this.agregarMensaje;
}

export const compraController = new CompraController();
