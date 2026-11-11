import { esEntornoLocal } from './entorno.js';

// Solo se usa en test/desarrollo. Nunca en un servidor publicado.
export const JWT_SECRET_DEFAULT = 'ticketit_jwt_secret_key_2026';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (esEntornoLocal()) return JWT_SECRET_DEFAULT;
  throw new Error('JWT_SECRET no configurado en ambiente de producción.');
};
