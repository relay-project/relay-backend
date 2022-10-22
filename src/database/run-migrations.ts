import { exec } from 'child_process';

import log from '../utilities/logger';

export default async function runMigrations(): Promise<void> {
  await new Promise<void>((resolve, reject): void => {
    const migrationProcess = exec(
      'npx sequelize-cli db:migrate',
      {
        env: process.env,
      },
      (error: Error): void => {
        if (error) {
          return reject(error);
        }
        return resolve();
      },
    );

    migrationProcess.stdout.pipe(process.stdout);
    migrationProcess.stderr.pipe(process.stderr);
  });

  return log('migrations applied');
}
