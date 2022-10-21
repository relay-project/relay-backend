import { Sequelize } from 'sequelize';

import createDatabase from './create-database';
import {
  DATABASE,
  ENVS,
  NODE_ENV,
} from '../configuration';
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
      logging: NODE_ENV === ENVS.development
        ? (sql: string, timing: number): void => log(sql, JSON.stringify(timing))
        : false,
      password: DATABASE.password,
      port: DATABASE.port,
      username: DATABASE.user,
    });

    await this.Instance.authenticate();
    log('database connected');

    return this.Instance;
  }
}

export default new Database();
