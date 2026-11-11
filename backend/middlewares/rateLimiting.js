import rateLimit from 'express-rate-limit';

// En desarrollo local los límites son más altos: la app mobile hace varias
// peticiones por pantalla y una demo larga superaría los valores productivos.
const esDesarrollo = () => process.env.NODE_ENV === 'development';

export const LIMITE_GENERAL = 100;
export const LIMITE_GENERAL_DESARROLLO = 1000;
export const LIMITE_AUTH = 10;
export const LIMITE_AUTH_DESARROLLO = 100;

// Limitador general para la API
export const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  // Máximo de peticiones por IP en la ventana
  limit: () => (esDesarrollo() ? LIMITE_GENERAL_DESARROLLO : LIMITE_GENERAL),
  standardHeaders: 'draft-7', // Devuelve RateLimit-* headers
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // No bloquear ejecuciones de Jest
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      statusCode: 429,
      message: 'Demasiadas solicitudes, intente de nuevo más tarde.',
      timestamp: new Date().toISOString()
    });
  }
});

// Limitador estricto para autenticación (anti fuerza bruta)
export const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Máximo de intentos de autenticación por IP en la ventana
  limit: () => (esDesarrollo() ? LIMITE_AUTH_DESARROLLO : LIMITE_AUTH),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      statusCode: 429,
      message: 'Demasiados intentos de autenticación. Por favor, intente más tarde.',
      timestamp: new Date().toISOString()
    });
  }
});

export const limiteRefresh = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => res.status(429).json({ status: 'fail', statusCode: 429, message: 'Demasiadas renovaciones de sesión.' })
});