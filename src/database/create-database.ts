import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default async function createDatabase(name: string): Promise<void> {
  if (!name) {
    throw new Error('Database name is required!');
  }

  const { stderr } = await execPromise(
    `if [[ -z \`psql -Atqc '\\list ${name}' postgres\` ]]; then createdb ${name}; fi`,
  );

  if (stderr) {
    throw new Error(stderr.toString());
  }
}
