import dotenv from 'dotenv';

(async () => {
  dotenv.config();

  return import('./app').then(
    ({ default: createServer }): Promise<void> => createServer(),
  );
})();
