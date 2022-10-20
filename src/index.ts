import dotenv from 'dotenv';

(async () => {
  dotenv.config();

  return import('./app').then(({ default: createServer }): void => createServer());
})();
