import { getDatabase } from "@netlify/database";

const STATE_ID = "primary-cellar";

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function isValidState(state) {
  return state
    && typeof state === "object"
    && Array.isArray(state.wines)
    && Array.isArray(state.archive)
    && Array.isArray(state.wishlist)
    && Array.isArray(state.vendors)
    && Array.isArray(state.maintenance)
    && Array.isArray(state.events);
}

export default async (request) => {
  const database = getDatabase();

  if (request.method === "GET") {
    const rows = await database.sql`
      SELECT payload, updated_at
      FROM cellar_state
      WHERE id = ${STATE_ID}
      LIMIT 1
    `;
    const row = rows[0];
    return json({
      state: row?.payload || null,
      updatedAt: row?.updated_at || null,
    });
  }

  if (request.method === "PUT") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!isValidState(body?.state)) {
      return json({ error: "Invalid cellar state." }, { status: 400 });
    }

    const payload = JSON.stringify(body.state);
    const rows = await database.sql`
      INSERT INTO cellar_state (id, payload, updated_at)
      VALUES (${STATE_ID}, ${payload}::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      RETURNING updated_at
    `;

    return json({ saved: true, updatedAt: rows[0]?.updated_at || new Date().toISOString() });
  }

  return json({ error: "Method not allowed." }, { status: 405, headers: { allow: "GET, PUT" } });
};

export const config = {
  path: "/api/cellar-state",
};
