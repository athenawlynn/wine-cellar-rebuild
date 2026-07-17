import { getSql, ensureSchema, readList, writeList } from "./_db.js";

export default async (req) => {
  const sql = getSql();
  await ensureSchema(sql);

  if (req.method === "GET") {
    const wines = await readList(sql, "wines");
    return Response.json(wines);
  }

  if (req.method === "PUT") {
    const wines = await req.json();
    if (!Array.isArray(wines)) {
      return new Response("Expected an array of wines", { status: 400 });
    }
    await writeList(sql, "wines", wines);
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/wines" };
