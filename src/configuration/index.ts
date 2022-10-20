const { env: ev } = process;

export const ALLOWED_ORIGINS: string[] = ev.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((value: string): string => value.trim())
  : [];

export const ENVS = {
  development: 'development',
  production: 'production',
};

export const EVENTS = {
  CONNECTION: 'connection',
};

export const { NODE_ENV = ENVS.development } = ev;

export const PORT = Number(ev.PORT) || 5000;
