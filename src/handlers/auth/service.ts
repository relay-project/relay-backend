import { compare, hash } from 'scryptwrap';

import database from '../../database';

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

export async function getSingleRecord(
  table: string,
  condition: Condition,
): Promise<any> {
  return database.Instance[table].findOne(condition);
}
