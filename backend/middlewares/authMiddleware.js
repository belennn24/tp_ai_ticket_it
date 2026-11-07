import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token provided");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send("Invalid token");
  }
}


export function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role || req.user?.rol;
    if (
      !userRole ||
      (!roles.includes(userRole) &&
        !roles.some(
          r =>
            typeof r === 'string' &&
            typeof userRole === 'string' &&
            r.toLowerCase() === userRole.toLowerCase()
        ))
    ) {
      return res.status(403).send('Forbidden');
    }
    next();
  };
}

export function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    return res.status(401).send("Auth required");
  }
  try {
    const base64Credentials = auth.split(" ")[1];
    const [username, password] = atob(base64Credentials).split(":");
    // Validar usuario y contraseña (ejemplo simple)
    if (username === "admin" && password === "1234") {
      next();
    } else {
      res.status(403).send("Invalid credentials");
    }
  } catch (err) {
    res.status(403).send("Invalid credentials");
  }
}

export default authMiddleware;
