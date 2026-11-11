import { z } from "zod";

export const tipoEntradaInputSchema = z.object({
  id: z.union([
    z.string().trim().min(1),
    z.number().int().positive()
  ]).optional(),
  nombre: z.string({ message: 'El nombre del tipo de entrada es obligatorio.' })
    .trim()
    .min(1, 'El nombre del tipo de entrada no puede estar vacío.'),
  descripcion: z.string().trim().optional().default(''),
  precio: z.coerce.number({ message: 'El precio debe ser un número válido.' })
    .positive('El precio debe ser mayor a 0.'),
  cupo: z.coerce.number({ message: 'El cupo debe ser un número válido.' })
    .int('El cupo debe ser un número entero.')
    .positive('El cupo debe ser mayor a 0.')
});

export const crearEventoSchema = z.object({
  nombre: z.string({ message: 'El nombre del evento es obligatorio.' })
    .trim()
    .min(1, 'El nombre del evento no puede estar vacío.'),
  descripcion: z.string().trim().optional().default(''),
  categoriaId: z.union([
    z.string().trim().min(1, 'El ID de categoría no puede estar vacío.'),
    z.number().int().positive('El ID de categoría debe ser válido.')
  ], { message: 'El ID de categoría es obligatorio.' }),
  fecha: z.union([
    z.string().datetime({ message: 'La fecha debe tener un formato ISO válido.' }),
    z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'El formato de fecha es inválido.' }),
    z.date()
  ], { message: 'La fecha es obligatoria y debe ser válida.' }),
  tiposEntrada: z.array(tipoEntradaInputSchema, {
    message: 'Debe especificar los tipos de entrada como un arreglo.'
  }).min(1, 'Debe incluir al menos un tipo de entrada.'),
  multimedia: z.array(z.string().trim()).optional().default([]),
  organizadorId: z.union([
    z.string().trim().min(1),
    z.number().int().positive()
  ]).optional()
});

export const buscarEventosQuerySchema = z.object({
  texto: z.string().trim().optional(),
  categoriaId: z.union([
    z.string().trim().min(1),
    z.coerce.number().int().positive()
  ]).optional(),
  precioMin: z.coerce.number({ message: 'precioMin debe ser un número válido.' })
    .nonnegative('precioMin no puede ser negativo.')
    .optional(),
  precioMax: z.coerce.number({ message: 'precioMax debe ser un número válido.' })
    .nonnegative('precioMax no puede ser negativo.')
    .optional(),
  orden: z.enum(['fecha', 'precio', 'reputacion'], {
    message: 'El orden debe ser fecha, precio o reputacion.'
  }).optional()
}).refine((data) => {
  if (data.precioMin !== undefined && data.precioMax !== undefined) {
    return data.precioMin <= data.precioMax;
  }
  return true;
}, {
  message: 'precioMin no puede ser mayor que precioMax.',
  path: ['precioMin']
});

export const eventoIdParamSchema = z.object({
  id: z.string().trim().min(1, 'El ID de evento no puede estar vacío.')
});
