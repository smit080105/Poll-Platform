import { verifyJwt } from '../utils/jwt.js';

const getToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) return null;

  return authHeader.slice('Bearer '.length);
};

export const optionalAuthenticate = (req, res, next) => {
  const token = getToken(req);
  if (token === null) return next();

  try {
    req.user = verifyJwt(token);
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
    req.user = verifyJwt(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};