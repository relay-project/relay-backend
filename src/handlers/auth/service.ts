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

export async function createDevice(
  deviceId: string,
  deviceName: string,
  userId: number,
  transaction?: Transaction,
): Promise<Result> {
  const options = transaction
    ? {
      transaction,
    }
    : {};
  return database.Instance[TABLES.devices].create(
    {
      deviceId,
      deviceName,
      userId,
    },
    options,
  );
}

export async function createHash(plaintext: string): Promise<string> {
  return hash(plaintext);
}

export async function createNewToken(
  passwordHash: string,
  secretHash: string,
  userId: number,
  deviceId: string,
): Promise<string> {
  return createToken(
    composePayload(deviceId, userId),
    composeSecret(passwordHash, secretHash),
  );
}

export async function createTransaction(): Promise<Transaction> {
  return database.Instance.transaction();
}

export async function createPassword(
  hashed: string,
  userId: number,
  transaction: Transaction,
): Promise<Result> {
  return database.Instance[TABLES.passwords].create(
    {
      hash: hashed,
      userId,
    },
    {
      transaction,
    },
  );
}

export async function createSecret(
  hashedSecret: string,
  userId: number,
  transaction: Transaction,
): Promise<Result> {
  return database.Instance[TABLES.secrets].create(
    {
      secret: hashedSecret,
      userId,
    },
    {
      transaction,
    },
  );
}

export async function createUser(
  login: string,
  recoveryAnswerHash: string,
  recoveryQuestion: string,
  transaction: Transaction,
): Promise<Result> {
  return database.Instance[TABLES.users].create(
    {
      login: login.toLowerCase(),
      recoveryAnswer: recoveryAnswerHash,
      recoveryQuestion,
    },
    {
      transaction,
    },
  );
}

export async function getDevice(userId: number, deviceId: string): Promise<Result> {
  return database.singleRecordAction<Result>({
    action: 'findOne',
    condition: {
      deviceId,
      userId,
    },
    table: TABLES.devices,
  });
}

export async function getPassword(userId: number): Promise<Result> {
  return database.singleRecordAction<Result>({
    action: 'findOne',
    condition: {
      userId,
    },
    table: TABLES.passwords,
  });
}

export async function getSecret(userId: number): Promise<Result> {
  return database.singleRecordAction<Result>({
    action: 'findOne',
    condition: {
      userId,
    },
    table: TABLES.secrets,
  });
}

export async function getUser(
  identifier: number | string,
  useId = false,
): Promise<Result> {
  const condition = useId
    ? {
      id: identifier,
    }
    : {
      login: identifier,
    };
  return database.singleRecordAction<Result>({
    action: 'findOne',
    condition,
    table: TABLES.users,
  });
}

export async function recoveryFinalUpdateData(
  newPasswordHash: string,
  newSecretHash: string,
  passwordId: number,
  secretId: number,
  userId: number,
  transaction: Transaction,
): Promise<void[]> {
  return Promise.all([
    database.Instance[TABLES.passwords].update(
      {
        hash: newPasswordHash,
      },
      {
        transaction,
        where: {
          id: passwordId,
        },
      },
    ),
    database.Instance[TABLES.secrets].update(
      {
        secret: newSecretHash,
      },
      {
        transaction,
        where: {
          id: secretId,
        },
      },
    ),
    database.Instance[TABLES.users].update(
      {
        failedLoginAttempts: 0,
      },
      {
        transaction,
        where: {
          id: userId,
        },
      },
    ),
  ]);
}

export async function setFailedAttempts(userId: number, attempts: number): Promise<void> {
  return database.Instance[TABLES.users].update(
    {
      failedLoginAttempts: attempts,
    },
    {
      where: {
        id: userId,
      },
    },
  );
}

export async function updateSecret(userId: number, newSecretHash: string): Promise<void> {
  return database.Instance[TABLES.secrets].update(
    {
      secret: newSecretHash,
    },
    {
      where: {
        userId,
      },
    },
  );
}
