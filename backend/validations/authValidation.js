import { z } from 'zod';

export const registroSchema = z.object({
  nombre: z.string({ message: 'El nombre es obligatorio.' })
    .trim()
    .min(1, 'El nombre no puede estar vacío.'),
  apellido: z.string().trim().optional(),
  email: z.string({ message: 'El email es obligatorio.' })
    .trim()
    .email('El formato del email no es válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.').optional(),
  contrasenia: z.string().min(1, 'La contraseña es obligatoria.').optional(),
  rol: z.enum(['comprador', 'organizador'], {
    message: 'El rol debe ser comprador u organizador.'
  }).optional()
}).refine(data => Boolean(data.password || data.contrasenia), {
  message: 'La contraseña es obligatoria.',
  path: ['password']
});

export const loginSchema = z.object({
  email: z.string().trim().optional(),
  password: z.string().optional(),
  contrasenia: z.string().optional(),
  id: z.string().optional()
}).passthrough();
