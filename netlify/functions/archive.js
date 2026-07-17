import { getSql, ensureSchema, readList, writeList } from "./_db.js";
import seedArchive from "../../src/data/archive.json";

export default async (req) => {
  try {
    const sql = getSql();
    await ensureSchema(sql);

    if (req.method === "GET") {
      let archive = await readList(sql, "archive");
      if (!archive.length) {
        archive = seedArchive;
        await writeList(sql, "archive", archive);
      }
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
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
};

export const config = { path: "/api/archive" };
