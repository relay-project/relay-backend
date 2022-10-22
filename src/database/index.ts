import {
  Model,
  ModelStatic,
  Sequelize,
} from 'sequelize';
import { readdir } from 'fs/promises';

import createDatabase from './create-database';
import { DATABASE } from '../configuration';
import log from '../utilities/logger';

class Database {
  Instance: null | Sequelize;

  constructor() {
    this.Instance = null;
  }

  async connect(): Promise<Sequelize> {
    if (this.Instance) {
      return this.Instance;
    }

    await createDatabase(DATABASE.name);

    this.Instance = new Sequelize({
      database: DATABASE.name,
      dialect: 'postgres',
      logging: log,
      password: DATABASE.password,
      port: DATABASE.port,
      username: DATABASE.user,
    });

    await this.Instance.authenticate();
    log('database connected');

    return this.Instance;
  }

  async disconnect(): Promise<void> {
    if (!this.Instance) {
      return null;
    }

    await this.Instance.close();
    return log('database connection closed');
  }

  async registerModels(): Promise<null | void[]> {
    if (!this.Instance) {
      throw new Error('Database is not connected!');
    }

    const files = await readdir(`${process.cwd()}/build/database/models`);
    if (files.length === 0) {
      return null;
    }
    const models = files.filter(
      (file): boolean => file.includes('model') && !file.includes('map'),
    );
    if (models.length === 0) {
      return null;
    }

    const imports = models.map(
      async (model): Promise<void> => {
        const {
          createModel,
          tableName,
        } = await import(`${process.cwd()}/build/database/models/${model}`);
        if (!(createModel && tableName)) {
          throw new Error('Invalid model file structure!');
        }

        const connectedModel: ModelStatic<Model> = createModel(this.Instance);
        this.Instance[tableName] = connectedModel;
        return log(`- connected table ${tableName}`);
      },
    );
    return Promise.all(imports);
  }
}

export default new Database();
