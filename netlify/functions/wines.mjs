import { getDatabase } from "@netlify/database";

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export default async function handler(request) {
  const database = getDatabase();

  if (request.method === "GET") {
    const rows = await database.sql`
      SELECT data
      FROM wines
      ORDER BY updated_at ASC, id ASC
    `;
    return json(rows.map((row) => row.data));
  }

  if (request.method === "PUT") {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.wines)) {
      return json({ error: "A wines array is required." }, { status: 400 });
    }

    const wines = body.wines.filter((wine) => wine && typeof wine.id === "string" && wine.id.trim());
    if (wines.length !== body.wines.length) {
      return json({ error: "Every wine requires a valid id." }, { status: 400 });
    }

    const client = await database.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM wines");
      for (const wine of wines) {
        await client.query(
          "INSERT INTO wines (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())",
          [wine.id, JSON.stringify(wine)],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return json({ saved: wines.length });
  }

  return json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "GET, PUT" } });
}

export const config = {
  path: "/api/wines",
};
