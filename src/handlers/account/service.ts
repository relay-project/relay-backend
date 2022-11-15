import { compare, hash } from 'scryptwrap';
import type { Transaction } from 'sequelize';

import {
  composePayload,
  composeSecret,
  createToken,
} from '../../utilities/jwt';
import database, { type Result, TABLES } from '../../database';

export async function compareHashes(
  plaintext: string,
  hashed: string,
): Promise<boolean> {
  return compare(hashed, plaintext);
}

export async function createHash(plaintext: string): Promise<string> {
  return hash(plaintext);
}

export async function createNewToken(
  userId: number,
  passwordHash: string,
  secretHash: string,
  deviceId: string,
): Promise<string> {
  return createToken(
    composePayload(deviceId, userId),
    composeSecret(passwordHash, secretHash),
  );
}

export async function createTransaction(): Promise<Transaction> {
  return database.createTransaction();
}

export async function deleteAccount(userId: number): Promise<void> {
  return database.singleRecordAction<void>({
    action: 'destroy',
    condition: {
      id: userId,
    },
    table: TABLES.users,
  });
}

export async function getPasswordAndSecret(
  userId: number,
  transaction: Transaction,
): Promise<Result[]> {
  return Promise.all([
    database.singleRecordAction<Result>({
      action: 'findOne',
      condition: {
        userId,
      },
      table: TABLES.passwords,
      transaction,
    }),
    database.singleRecordAction<Result>({
      action: 'findOne',
      condition: {
        userId,
      },
      table: TABLES.secrets,
      transaction,
    }),
  ]);
}

export async function updatePassword(
  userId: number,
  newPasswordHash: string,
  transaction: Transaction,
): Promise<void> {
  return database.Instance[TABLES.passwords].update(
    {
      hash: newPasswordHash,
    },
    {
      transaction,
      where: {
        userId,
      },
    },
  );
}

export async function updateRecoveryData(
  userId: number,
  newRecoveryAnswerHash: string,
  newRecoveryQuestion: string,
): Promise<void> {
  return database.Instance[TABLES.users].update(
    {
      recoveryAnswer: newRecoveryAnswerHash,
      recoveryQuestion: newRecoveryQuestion,
    },
    {
      where: {
        id: userId,
      },
    },
  );
}
