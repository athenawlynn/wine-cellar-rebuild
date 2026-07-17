import { getSql, ensureSchema, readList, writeList } from "./_db.js";

export default async (req) => {
  const sql = getSql();
  await ensureSchema(sql);

  if (req.method === "GET") {
    const archive = await readList(sql, "archive");
    return Response.json(archive);
  }

  if (req.method === "PUT") {
    const archive = await req.json();
    if (!Array.isArray(archive)) {
      return new Response("Expected an array of archive entries", { status: 400 });
    }
    await writeList(sql, "archive", archive);
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/archive" };
