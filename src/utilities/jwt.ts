import * as jwt from 'jsonwebtoken';

import { TOKEN_SECRET } from '../configuration';

export async function createToken(userId: string): Promise<null | string> {
  return new Promise<string>((resolve, reject): void => {
    jwt.sign(
      {
        sub: userId,
      },
      TOKEN_SECRET,
      (error: jwt.JsonWebTokenError, encoded: string): void => {
        if (error) {
          return reject(error);
        }
        return resolve(encoded);
      },
    );
  });
}

export async function verifyToken(): Promise<string> {
  return '';
}
