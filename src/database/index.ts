import {
  type Model,
  type ModelStatic,
  Sequelize,
  type Transaction,
} from 'sequelize';
import { readdir } from 'fs/promises';

import createDatabase from './create-database';
import {
  DATABASE,
  ENVS,
  MIGRATIONS_ON_STARTUP,
  NODE_ENV,
} from '../configuration';
import log from '../utilities/logger';
import runMigrations from './run-migrations';

export { TABLES } from '../configuration';

const connectionError = new Error('Database is not connected!');

interface Condition {
  [key: string]: any;
}

export interface CountResult {
  count: number;
}

export interface PaginatedResult {
  currentPage: number;
  limit: number;
  results: Result[];
  totalCount: number;
  totalPages: number;
}

interface QueryParameters {
  transaction?: Transaction;
  where: Condition;
}

export interface Result {
  [key: string]: any;
  createdAt: string;
  id: number;
  updatedAt: string;
}

type SingleRecordActions = 'destroy' | 'findOne';

interface SingleRecordOptions {
  action: SingleRecordActions,
  condition: Condition;
  table: string;
  transaction?: Transaction;
}

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
    if (MIGRATIONS_ON_STARTUP === 'enabled') {
      await runMigrations();
    }

    this.Instance = new Sequelize({
      database: DATABASE.name,
      dialect: 'postgres',
      host: DATABASE.host,
      logging: NODE_ENV === ENVS.development
        ? log
        : false,
      password: DATABASE.password,
      port: DATABASE.port,
      username: DATABASE.user,
    });

    await this.Instance.authenticate();
    log('database connected');

    return this.Instance;
  }

  async createTransaction(): Promise<Transaction> {
    if (!this.Instance) {
      throw connectionError;
    }
    return this.Instance.transaction();
  }

  async disconnect(): Promise<void> {
    if (!this.Instance) {
      return null;
    }

    await this.Instance.close();
    return log('database connection closed');
  }

  async registerModels(): Promise<null | void> {
    if (!this.Instance) {
      throw connectionError;
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

    let counter = 0;
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
        counter += 1;
      },
    );
    await Promise.all(imports);
    return log(`database models loaded: ${counter}`);
  }

  async singleRecordAction({
    action,
    condition,
    table,
    transaction = null,
  }: SingleRecordOptions): Promise<Result | void> {
    if (!this.Instance) {
      throw connectionError;
    }
    const parameters: QueryParameters = {
      where: condition,
    };
    if (transaction) {
      parameters.transaction = transaction;
    }
    return this.Instance[table][action](parameters);
  }
}

export default new Database();
