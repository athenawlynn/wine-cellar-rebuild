import { getDatabase } from "@netlify/database";
import type { Config } from "@netlify/functions";

type WineRecord = {
  id: number;
  [key: string]: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export default async function handler(request: Request) {
  const database = getDatabase();

  if (request.method === "GET") {
    const rows = await database.sql`
      SELECT data
      FROM wines
      ORDER BY id
    `;
    return jsonResponse({ wines: rows.map((row) => row.data) });
  }

  if (request.method === "PUT") {
    const body = await request.json().catch(() => null) as { wines?: WineRecord[] } | null;
    if (!body || !Array.isArray(body.wines) || body.wines.length > 2000) {
      return jsonResponse({ error: "A valid wine collection is required." }, 400);
    }

    const wines = body.wines.filter((wine) => wine && Number.isSafeInteger(Number(wine.id)));
    if (wines.length !== body.wines.length) {
      return jsonResponse({ error: "Every wine requires a valid numeric ID." }, 400);
    }

    const client = await database.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM wines");
      if (wines.length) {
        await client.query(
          `INSERT INTO wines (id, data, updated_at)
           SELECT (item->>'id')::bigint, item, NOW()
           FROM jsonb_array_elements($1::jsonb) AS item`,
          [JSON.stringify(wines)],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return jsonResponse({ wines });
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
}

export const config: Config = {
  path: "/api/wines",
};
