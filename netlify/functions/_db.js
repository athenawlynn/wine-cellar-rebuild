import { neon } from "@neondatabase/serverless";

let sqlClient;

export function getSql() {
  if (!sqlClient) {
    const connectionString = process.env.NETLIFY_DATABASE_URL;
    if (!connectionString) {
      throw new Error("NETLIFY_DATABASE_URL is not set. Run `netlify db init` and redeploy.");
    }
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

let schemaReady;

export function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS cellar_store (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }
  return schemaReady;
}

export async function readList(sql, key) {
  const rows = await sql`SELECT data FROM cellar_store WHERE key = ${key}`;
  return rows[0]?.data ?? [];
}

export async function writeList(sql, key, list) {
  await sql`
    INSERT INTO cellar_store (key, data, updated_at)
    VALUES (${key}, ${JSON.stringify(list)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}
