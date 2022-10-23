const { env: ev } = process;

export const ALLOWED_ORIGINS: string[] = ev.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((value: string): string => value.trim())
  : [];

export const DATABASE = {
  dialect: 'postgres',
  host: process.env.DATABASE_HOST,
  logging: false,
  name: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
};

export const ENVS = {
  development: 'development',
  production: 'production',
};

export const {
  APPLICATION_NAME = 'RELAY',
  MIGRATIONS_ON_STARTUP = 'enabled',
  NODE_ENV = ENVS.development,
} = ev;

export const EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
};

export const MAX_LOGIN_LENGTH = 32;

export const MAX_RECOVERY_ANSWER_LENGTH = 256;

export const MAX_RECOVERY_QUESTION_LENGTH = 256;

export const PORT = Number(ev.PORT) || 5000;

export const RESPONSE_MESSAGES = {
  internalServerError: 'INTERNAL_SERVER_ERROR',
  loginAlreadyInUse: 'LOGIN_ALREADY_IN_USE',
  ok: 'OK',
  unauthorized: 'UNAUTHORIZED',
  validationError: 'VALIDATION_ERROR',
};

export const RESPONSE_STATUSES = {
  badRequest: 400,
  internalServerError: 500,
  ok: 200,
  unauthorized: 401,
};

export const ROLES = {
  admin: 'admin',
  user: 'user',
};

export const TABLES = {
  devices: 'devices',
  passwords: 'passwords',
  secrets: 'secrets',
  users: 'users',
};
