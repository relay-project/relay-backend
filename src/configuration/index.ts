const { env: ev } = process;

export const ALLOWED_ORIGINS: string[] = ev.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((value: string): string => value.trim())
  : [];

export const DATABASE = {
  dialect: 'postgres',
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

export const EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  SIGN_IN: 'sign-in',
};

export const {
  NODE_ENV = ENVS.development,
  TOKEN_SECRET,
} = ev;

export const PORT = Number(ev.PORT) || 5000;

export const RESPONSE_MESSAGES = {
  internalServerError: 'INTERNAL_SERVER_ERROR',
  ok: 'OK',
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
  Passwords: 'Passwords',
  Users: 'Users',
};
