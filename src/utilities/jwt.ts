import * as jwt from 'jsonwebtoken';

export async function createToken(
  userId: string,
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
  return '';
}
