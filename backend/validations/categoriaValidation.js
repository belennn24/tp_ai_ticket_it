import { z } from "zod";

export const crearCategoriaSchema = z.object({
  nombre: z.string({ message: 'El nombre de la categoría es obligatorio.' })
    .trim()
    .min(1, 'El nombre de la categoría no puede estar vacío.'),
  descripcion: z.string().trim().optional().default('')
});

export const categoriaIdParamSchema = z.object({
  id: z.string().trim().min(1, 'El ID de categoría no puede estar vacío.')
});
