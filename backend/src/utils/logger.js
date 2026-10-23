import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
});

export const logError = (req, error, message) => {
  (req.log || logger).error({ err: error }, message);
};
