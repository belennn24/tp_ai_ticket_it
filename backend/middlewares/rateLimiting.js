import rateLimit from 'express-rate-limit';

// Limitador general para la API
export const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // Máximo 100 peticiones por IP
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
  limit: 10, // Máximo 10 intentos de login cada 15 min
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