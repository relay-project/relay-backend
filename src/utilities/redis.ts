import { createClient, type RedisClientType } from 'redis';

import log from './logger';
import { REDIS } from '../configuration';

const CONNECTION_ERROR = new Error('Redis is not connected!');

interface ConnectionOptions {
  host: string;
  password?: string;
  port: number;
}

interface ValueAsObject<T> {
  value: T;
}

class RedisClient {
  Client: RedisClientType = null;

  DEFAULT_EXPIRATION = 60 * 60 * 8;

  keyFormatter: (prefix: string, value: number | string) => string;

  PREFIXES = {
    passwordHash: 'password-hash',
    secretHash: 'secret-hash',
    userDevice: 'user-device',
  };

  constructor() {
    this.Client = null;
    this.keyFormatter = (
      prefix: string,
      value: number | string,
    ): string => `${prefix}-${value}`;
  }

  async connect(): Promise<void> {
    const options: ConnectionOptions = {
      host: REDIS.host,
      port: Number(REDIS.port),
    };
    if (REDIS.password) {
      options.password = REDIS.password;
    }
    this.Client = createClient(options);
    await this.Client.connect();
    return log('redis connected');
  }

  async deleteValue(key: string): Promise<number> {
    if (!(this.Client && this.Client.isOpen)) {
      throw CONNECTION_ERROR;
    }
    return this.Client.del([key]);
  }

  async disconnect(): Promise<void> {
    if (!(this.Client && this.Client.isOpen)) {
      return null;
    }

    await this.Client.quit();
    return log('redis connection closed');
  }

  async expire(key: string, expires = this.DEFAULT_EXPIRATION): Promise<boolean> {
    if (!(this.Client && this.Client.isOpen)) {
      throw CONNECTION_ERROR;
    }
    return this.Client.expire(key, expires);
  }

  async getValue<T>(key: string): Promise<null | T> {
    if (!(this.Client && this.Client.isOpen)) {
      throw CONNECTION_ERROR;
    }
    const string = await this.Client.get(key);
    if (!string) {
      return null;
    }
    try {
      const parsed: ValueAsObject<T> = JSON.parse(string);
      return parsed.value;
    } catch {
      return null;
    }
  }

  async setValue(
    key: string,
    value: unknown,
    expires = this.DEFAULT_EXPIRATION,
  ): Promise<string> {
    if (!(this.Client && this.Client.isOpen)) {
      throw CONNECTION_ERROR;
    }
    const string = JSON.stringify({ value });
    return this.Client.set(
      key,
      string,
      {
        EX: expires,
      },
    );
  }
}

export default new RedisClient();
