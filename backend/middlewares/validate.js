import { ValidationError } from "../errors/appError.js";

/**
 * Middleware para validar datos con un esquema de Zod.
 * @param {import('zod').ZodType} schema - Esquema de Zod.
 * @param {'body'|'params'|'query'} target - Parte de la request a validar.
 */
export function validate(schema, target = 'body') {
    return (req, res, next) => {
        const resultado = schema.safeParse(req[target]);

        if (!resultado.success) {
            const mensaje = resultado.error.issues
                .map((i) => i.message)
                .join(' | ');
            return next(new ValidationError(mensaje));
        }

        try {
            req[target] = resultado.data;
        } catch {
            Object.defineProperty(req, target, {
                value: resultado.data,
                writable: true,
                enumerable: true,
                configurable: true
            });
        }
        next();
    };
}
