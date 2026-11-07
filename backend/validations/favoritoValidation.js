import { z } from "zod";

export const favoritoEventoIdParamSchema = z.object({
  eventoId: z.string().trim().min(1, 'El ID de evento no puede estar vacío.')
});
