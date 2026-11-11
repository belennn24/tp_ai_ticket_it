import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtConfig.js';
import { UnauthorizedError, ForbiddenError } from '../errors/appError.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    return next(new UnauthorizedError('No token provided'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = parts[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (decoded.tipo === 'refresh') {
      return next(new UnauthorizedError('Invalid token'));
    }
    req.user = decoded;
    return next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid token'));
  }
}

export function requireRole(...roles) {
  const rolesPermitidos = roles.map(r => String(r).toLowerCase().trim());
  return (req, res, next) => {
    const userRol = req.user?.rol;
    if (!userRol || !rolesPermitidos.includes(String(userRol).toLowerCase().trim())) {
      return next(new ForbiddenError('Forbidden'));
    }
    return next();
  };
}

export const requireAuth = authMiddleware;
export default authMiddleware;
