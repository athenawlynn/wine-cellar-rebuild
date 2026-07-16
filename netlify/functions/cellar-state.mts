import { getDatabase } from "@netlify/database";
import type { Config } from "@netlify/functions";

const STATE_KEY = "wine-inventory";
const MAX_WINES = 1000;

export default async (request: Request) => {
  const database = getDatabase();

  if (request.method === "GET") {
    const rows = await database.sql`
      SELECT payload, version
      FROM cellar_state
      WHERE state_key = ${STATE_KEY}
    `;
    const state = rows[0];
    return Response.json(
      {
        wines: state?.payload ?? null,
        version: Number(state?.version ?? 0),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (request.method === "PUT") {
    const body = await request.json();
    const wines = body?.wines;
    const version = Number(body?.version);

    if (!Array.isArray(wines) || wines.length > MAX_WINES || !Number.isSafeInteger(version) || version <= 0) {
      return Response.json({ error: "Invalid cellar state." }, { status: 400 });
    }

    await database.sql`
      INSERT INTO cellar_state (state_key, payload, version)
      VALUES (${STATE_KEY}, ${JSON.stringify(wines)}::jsonb, ${version})
      ON CONFLICT (state_key) DO UPDATE
      SET payload = EXCLUDED.payload,
          version = EXCLUDED.version,
          updated_at = NOW()
      WHERE cellar_state.version <= EXCLUDED.version
    `;

    return Response.json({ saved: true, version });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/cellar-state",
  method: ["GET", "PUT"],
};
