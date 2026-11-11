import { z } from "zod";

export const crearReseniaSchema = z.object({
  eventoId: z.union([
    z.string().trim().min(1, 'El ID de evento no puede estar vacío.'),
    z.number().int().positive('El ID de evento debe ser válido.')
  ], { message: 'El ID de evento es obligatorio.' }),
  puntuacion: z.coerce.number({ message: 'La puntuación debe ser un número válido.' })
    .min(1, 'La puntuación mínima es 1.')
    .max(5, 'La puntuación máxima es 5.'),
  detalle: z.string().trim().optional().default(''),
  compradorId: z.union([
    z.string().trim().min(1),
    z.number().int().positive()
  ]).optional()
});

export const organizadorIdParamSchema = z.object({
  id: z.string().trim().min(1, 'El ID de organizador no puede estar vacío.')
});
