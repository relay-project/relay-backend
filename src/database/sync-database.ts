import database from './index';

async function syncDatabase(): Promise<void> {
  await database.connect();
  await database.registerModels(true);
  await database.disconnect();
  return process.exit(0);
}

syncDatabase();
