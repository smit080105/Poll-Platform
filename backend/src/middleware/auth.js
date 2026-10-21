import jwt from 'jsonwebtoken';

const getToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) return null;

  return authHeader.slice('Bearer '.length);
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

export const optionalAuthenticate = (req, res, next) => {
  const token = getToken(req);
  if (token === null) return next();

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const authenticate = (req, res, next) => {
  const token = getToken(req);

  if (token === null) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};