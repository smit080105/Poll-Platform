import { afterEach, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { signJwt, validateJwtConfiguration, verifyJwt } from './jwt.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;
const originalPreviousSecrets = process.env.JWT_PREVIOUS_SECRETS;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
  if (originalPreviousSecrets === undefined) delete process.env.JWT_PREVIOUS_SECRETS;
  else process.env.JWT_PREVIOUS_SECRETS = originalPreviousSecrets;
});

describe('JWT signing-key rotation', () => {
  it('signs with the active key and accepts tokens signed by a previous key', () => {
    process.env.JWT_SECRET = 'current-signing-secret';
    process.env.JWT_PREVIOUS_SECRETS = 'previous-signing-secret';

    const activeToken = signJwt({ id: 'user-1' }, { expiresIn: '1h' });
    const previousToken = jwt.sign({ id: 'user-2' }, 'previous-signing-secret', { algorithm: 'HS256' });

    expect(jwt.verify(activeToken, 'current-signing-secret')).toMatchObject({ id: 'user-1' });
    expect(verifyJwt(activeToken)).toMatchObject({ id: 'user-1' });
    expect(verifyJwt(previousToken)).toMatchObject({ id: 'user-2' });
  });

  it('rejects duplicate secrets and weak production secrets', () => {
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.JWT_PREVIOUS_SECRETS = `${process.env.JWT_SECRET},${process.env.JWT_SECRET}`;
    process.env.NODE_ENV = 'production';
    expect(validateJwtConfiguration).toThrow(/duplicate/i);

    process.env.JWT_SECRET = 'too-short';
    process.env.JWT_PREVIOUS_SECRETS = '';
    expect(validateJwtConfiguration).toThrow(/32 bytes/i);
  });

  it('stops accepting a previous key after it is removed from rotation', () => {
    process.env.JWT_PREVIOUS_SECRETS = 'retired-signing-secret';
    process.env.JWT_SECRET = 'current-signing-secret';

    const retiredToken = jwt.sign({ id: 'retired-user' }, 'retired-signing-secret', {
      algorithm: 'HS256'
    });
    expect(verifyJwt(retiredToken)).toMatchObject({ id: 'retired-user' });

    process.env.JWT_PREVIOUS_SECRETS = '';
    expect(() => verifyJwt(retiredToken)).toThrow();
  });
});
