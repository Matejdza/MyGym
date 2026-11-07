// Runs the app's repository against Node's built-in SQLite, so SQL, migrations
// and transactions are tested without a phone. Mirrors the expo-sqlite methods in `Db`.

import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { Db } from '@/data/db';

type Param = SQLInputValue | boolean;

const norm = (params: unknown[]): SQLInputValue[] => {
  const flat = params.length === 1 && Array.isArray(params[0]) ? (params[0] as Param[]) : (params as Param[]);
  return flat.map((p) => (typeof p === 'boolean' ? (p ? 1 : 0) : p));
};

export function memoryDb(): Db {
  const db = new DatabaseSync(':memory:');
  const api = {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: unknown[]) {
      const r = db.prepare(sql).run(...norm(params));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getAllAsync(sql: string, ...params: unknown[]) {
      return db.prepare(sql).all(...norm(params)).map((row: object) => ({ ...row }));
    },
    async getFirstAsync(sql: string, ...params: unknown[]) {
      const row = db.prepare(sql).get(...norm(params));
      return row ? { ...row } : null;
    },
    async withTransactionAsync(fn: () => Promise<void>) {
      db.exec('BEGIN');
      try {
        await fn();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return api as unknown as Db;
}
