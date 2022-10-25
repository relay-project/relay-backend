import * as jwt from 'jsonwebtoken';

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

export function decodeToken(token: string): number {
  const decoded = jwt.decode(token);
  const { sub = null } = decoded;
  if (!sub) {
    throw new jwt.JsonWebTokenError('Token is invalid!');
  }
  return Number(sub);
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<number> {
  if (!(secret && token)) {
    throw new Error('Token and secret are required for token verification!');
  }
  return new Promise<number>((resolve, reject): void => {
    jwt.verify(
      token,
      secret,
      (error, decoded): void => {
        if (error) {
          return reject(error);
        }
        const { sub = null } = decoded;
        if (!sub) {
          return reject(new jwt.JsonWebTokenError('Token is invalid!'));
        }
        return resolve(Number(sub));
      },
    );
  });
}
