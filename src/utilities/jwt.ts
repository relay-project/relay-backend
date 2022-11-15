import * as jwt from 'jsonwebtoken';

const DIVIDER = '%%';

export interface DecodedPayload {
  deviceId: string;
  userId: number;
}

export function composePayload(
  deviceId: string,
  userId: number,
): string {
  return `${deviceId}${DIVIDER}${userId}`;
}

export function composeSecret(
  passwordHash: string,
  secretHash: string,
): string {
  return `${passwordHash}-${secretHash}`;
}

export async function createToken(
  payload: string,
  secret: string,
): Promise<null | string> {
  if (!(payload && secret)) {
    throw new Error('Payload and secret are required for token creation!');
  }
  return new Promise<string>((resolve, reject): void => {
    jwt.sign(
      {
        sub: payload,
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

export function decodeToken(token: string): DecodedPayload {
  const decoded = jwt.decode(token);
  const { sub = null } = decoded;
  if (!sub) {
    throw new jwt.JsonWebTokenError('Token is invalid!');
  }
  const [deviceId = '', userId = ''] = (sub as string).split(DIVIDER);
  if (!(deviceId && userId)) {
    throw new jwt.JsonWebTokenError('Token is invalid!');
  }
  return {
    deviceId,
    userId: Number(userId),
  };
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<DecodedPayload> {
  if (!(secret && token)) {
    throw new Error('Token and secret are required for token verification!');
  }
  return new Promise<DecodedPayload>((resolve, reject): void => {
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
        const [deviceId = '', userId = ''] = (sub as string).split(DIVIDER);
        if (!(deviceId && userId)) {
          return reject(new jwt.JsonWebTokenError('Token is invalid!'));
        }
        return resolve({
          deviceId,
          userId: Number(userId),
        });
      },
    );
  });
}
