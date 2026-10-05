import { createClient, type InValue } from '@libsql/client';
let client: ReturnType<typeof createClient> | undefined;
export function databaseClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('Database is not configured');
    if (process.env.VERCEL && url.startsWith('file:')) throw new Error('Vercel requires a remote database');
    client = createClient({url, authToken: process.env.TURSO_AUTH_TOKEN});
  }
  return client;
}
class Statement {
  constructor(public sql: string, public args: InValue[] = []) {}
  bind(...args: InValue[]) { return new Statement(this.sql, args); }
  async all<T = Record<string, any>>() { const r = await databaseClient().execute(this); return {results: r.rows as unknown as T[]}; }
  async first<T = Record<string, any>>() { return (await this.all<T>()).results[0] ?? null; }
  async run() { const r = await databaseClient().execute(this); return {meta: {changes: r.rowsAffected}}; }
}
export function database() { return {
  prepare: (sql: string) => new Statement(sql),
  // A single write transaction preserves the slot lock + booking insert invariant.
  batch: async (statements: Statement[]) => (await databaseClient().batch(statements, 'write')).map(r => ({results: r.rows, meta: {changes: r.rowsAffected}})),
}; }
