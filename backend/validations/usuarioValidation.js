import { z } from 'zod';

export const actualizarPerfilSchema = z.object({
  nombre: z.string({ message: 'El nombre es obligatorio.' })
    .trim()
    .min(1, 'El nombre no puede estar vacío.')
    .max(80, 'El nombre no puede superar los 80 caracteres.'),
  apellido: z.string()
    .trim()
    .max(80, 'El apellido no puede superar los 80 caracteres.')
    .optional()
});
