import * as jwt from 'jsonwebtoken';
import { TABLES } from '../configuration';
import database from '../database';

export function composeSecret(
  passwordHash: string,
  secretHash: string,
): string {
  return `${passwordHash}-${secretHash}`;
}

export async function createToken(
  userId: number,
  secret: string,
): Promise<null | string> {
  if (!(secret && userId)) {
    throw new Error('User ID and secret are required for token creation!');
  }
  return new Promise<string>((resolve, reject): void => {
    jwt.sign(
      {
        sub: userId,
      },
      secret,
      (error: jwt.JsonWebTokenError, encoded: string): void => {
        if (error) {
          return reject(error);
        }
        return resolve(encoded);
      },
    );
  });
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<string> {
  if (!(secret && token)) {
    throw new Error('Token and secret are required for token verification!');
  }
  // const decoded = jwt.decode(token);
  // const { sub: userId = null } = decoded;
  // if (!userId) {
  //   throw new jwt.JsonWebTokenError('Invalid token');
  // }

  // const [passwordRecord, secretRecord] = await Promise.all([
  //   database.Instance[TABLES]
  // ])
  return '';
}
