import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NETLIFY_DATABASE_URL;
if (!connectionString) {
  console.error("NETLIFY_DATABASE_URL is not set. Run this via `netlify exec node scripts/migrate-db.mjs` after `netlify db init`.");
  process.exit(1);
}

const sql = neon(connectionString);
const force = process.argv.includes("--force");

async function loadJson(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  return JSON.parse(await readFile(fileURLToPath(url), "utf8"));
}

async function seed(key, list) {
  const [existing] = await sql`SELECT data FROM cellar_store WHERE key = ${key}`;
  if (existing && Array.isArray(existing.data) && existing.data.length && !force) {
    console.log(`Skipping "${key}": ${existing.data.length} record(s) already in the database. Pass --force to overwrite.`);
    return;
  }
  await sql`
    INSERT INTO cellar_store (key, data, updated_at)
    VALUES (${key}, ${JSON.stringify(list)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  console.log(`Seeded "${key}" with ${list.length} record(s).`);
}

await sql`
  CREATE TABLE IF NOT EXISTS cellar_store (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const wines = await loadJson("../src/data/wines.json");
const archive = await loadJson("../src/data/archive.json");

await seed("wines", wines);
await seed("archive", archive);

console.log("Migration complete.");
