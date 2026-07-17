import { getSql, ensureSchema, readList, writeList } from "./_db.js";
import seedWines from "../../src/data/wines.json";

export default async (req) => {
  const sql = getSql();
  await ensureSchema(sql);

  if (req.method === "GET") {
    let wines = await readList(sql, "wines");
    if (!wines.length) {
      wines = seedWines;
      await writeList(sql, "wines", wines);
    }
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
