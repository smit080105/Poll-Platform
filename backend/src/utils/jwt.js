import jwt from 'jsonwebtoken';

const getConfiguredSecrets = () => {
  const activeSecret = process.env.JWT_SECRET;
  if (!activeSecret) {
    throw new Error('JWT_SECRET must be configured.');
  }

  const previousSecrets = (process.env.JWT_PREVIOUS_SECRETS || '')
    .split(',')
    .map((secret) => secret.trim())
    .filter(Boolean);
  const secrets = [activeSecret, ...previousSecrets];

  if (new Set(secrets).size !== secrets.length) {
    throw new Error('JWT_PREVIOUS_SECRETS must not contain duplicate signing secrets.');
  }

  return secrets;
};

export const validateJwtConfiguration = () => {
  const secrets = getConfiguredSecrets();

  if (process.env.NODE_ENV === 'production' && secrets.some((secret) => Buffer.byteLength(secret, 'utf8') < 32)) {
    throw new Error('JWT signing secrets must be at least 32 bytes in production.');
  }
};

export const signJwt = (payload, options) => jwt.sign(payload, getConfiguredSecrets()[0], {
  ...options,
  algorithm: 'HS256'
});

export const verifyJwt = (token) => {
  let lastError;

  for (const secret of getConfiguredSecrets()) {
    try {
      return jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
};
