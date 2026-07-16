import { getDatabase } from "@netlify/database";
import type { Config } from "@netlify/functions";

const STATE_ID = "primary";
const MAX_STATE_BYTES = 1_500_000;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export default async function handler(request: Request) {
  try {
    if (request.method === "GET") {
      const database = getDatabase();
      const rows = await database.sql`
        SELECT payload, updated_at
        FROM cellar_state
        WHERE id = ${STATE_ID}
        LIMIT 1
      `;
      const record = rows[0];
      return json({
        state: record?.payload ?? null,
        updatedAt: record?.updated_at ?? null,
      });
    }

    if (request.method === "PUT") {
      const database = getDatabase();
      const body = await request.json();
      const state = body?.state;
      if (!state || typeof state !== "object" || Array.isArray(state)) {
        return json({ error: "A state object is required." }, { status: 400 });
      }
      if (JSON.stringify(state).length > MAX_STATE_BYTES) {
        return json({ error: "The cellar state is too large to save." }, { status: 413 });
      }

      const rows = await database.sql`
        INSERT INTO cellar_state (id, payload, updated_at)
        VALUES (${STATE_ID}, ${JSON.stringify(state)}::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        RETURNING updated_at
      `;
      return json({ saved: true, updatedAt: rows[0]?.updated_at ?? null });
    }

    return json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "GET, PUT" } });
  } catch (error) {
    console.error("Cellar state request failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Cloud state is temporarily unavailable." }, { status: 500 });
  }
}

export const config: Config = {
  path: "/api/cellar-state",
};
