import { z } from "zod";
import { Compra } from "../models/compra.js";

export const idSchema = z.union([
    z.string().trim().min(1, 'El ID no puede estar vacío.'),
    z.number().int().positive('El ID debe ser un número válido.')
], { message: 'El ID es obligatorio y debe ser válido.' });

export const MAX_ENTRADAS_POR_PERSONA = Compra.MAX_POR_PERSONA;

export const cantidadSchema = z.coerce.number({ message: 'La cantidad debe ser un número válido.' })
    .int('La cantidad debe ser un número entero.')
    .positive('La cantidad debe ser mayor a 0.')
    .max(MAX_ENTRADAS_POR_PERSONA, `Solo se pueden comprar hasta ${MAX_ENTRADAS_POR_PERSONA} entradas por persona.`);

export const totalSchema = z.coerce.number({ message: 'El total debe ser un número válido.' })
    .nonnegative('El total debe ser mayor o igual a 0.');

export const compraBaseSchema = z.object({
    cantidad: cantidadSchema,
    total: totalSchema.optional(),
    eventoId: idSchema,
    tipoEntradaId: idSchema,
    compradorId: idSchema.optional(),
});

export const crearCompraSchema = compraBaseSchema;

export const actualizarCompraSchema = compraBaseSchema.partial();

export const cambiarEstadoCompraSchema = z.object({
    estado: z.enum(['CANCELADA', 'UTILIZADA'], {
        message: 'El estado es obligatorio y debe ser CANCELADA o UTILIZADA.'
    }),
    motivo: z.string().trim().optional()
});

export const cancelarCompraSchema = z.object({
    motivo: z.string().trim().optional(),
}).optional();

export const utilizarCompraSchema = z.object({}).passthrough().optional();

export const agregarMensajeSchema = z.object({
    mensaje: z.string({ message: 'El mensaje debe ser una cadena de texto.' })
        .trim()
        .min(1, 'El mensaje no puede estar vacío.'),
    usuarioId: idSchema.optional(),
});
