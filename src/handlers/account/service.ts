import { compare, hash } from 'scryptwrap';

import database, { TABLES } from '../../database';

export async function compareHashes(
  plaintext: string,
  hashed: string,
): Promise<boolean> {
  return compare(hashed, plaintext);
}

export async function createHash(plaintext: string): Promise<string> {
  return hash(plaintext);
}

export async function deleteAccount(userId: number): Promise<void> {
  return database.singleRecordAction({
    action: 'destroy',
    condition: {
      id: userId,
    },
    table: TABLES.users,
  });
}
