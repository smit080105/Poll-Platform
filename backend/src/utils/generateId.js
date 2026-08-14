import crypto from 'crypto';

export const generateShortId = () => {
  return crypto.randomBytes(4).toString('hex');
};
