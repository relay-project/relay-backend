import { type Transaction } from 'sequelize';

import database from '../../database';

interface Condition {
  [key: string]: number | string;
}

interface QueryParameters {
  transaction?: Transaction;
  where: Condition;
}

type SingleRecordActions = 'destroy' | 'findOne';

interface SingleRecordOptions {
  action: SingleRecordActions,
  condition: Condition;
  table: string;
  transaction?: Transaction;
}

export async function createTransaction(): Promise<Transaction> {
  return database.Instance.transaction();
}

export async function singleRecordAction({
  action,
  condition,
  table,
  transaction = null,
}: SingleRecordOptions): Promise<number> {
  const parameters: QueryParameters = {
    where: condition,
  };
  if (transaction) {
    parameters.transaction = transaction;
  }
  return database.Instance[table][action](parameters);
}
