import { compare, hash } from 'scryptwrap';

import database, { TABLES } from '../../database';

interface Condition {
  [key: string]: number | string;
}

export async function compareHashes(
  plaintext: string,
  hashed: string,
): Promise<boolean> {
  return compare(hashed, plaintext);
}

export async function createHash(plaintext: string): Promise<string> {
  return hash(plaintext);
}

export async function getSecret(userId: number): Promise<any> {
  return database.singleRecordAction({
    action: 'findOne',
    condition: {
      userId,
    },
    table: TABLES.secrets,
  });
}

export async function getSingleRecord(
  table: string,
  condition: Condition,
): Promise<any> {
  return database.singleRecordAction({
    action: 'findOne',
    condition,
    table,
  });
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
