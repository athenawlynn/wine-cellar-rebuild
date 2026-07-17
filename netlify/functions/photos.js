import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const store = getStore("wine-photos");
    const url = new URL(req.url);

    if (req.method === "POST") {
      const { data, contentType } = await req.json();
      if (!data) return new Response("Missing photo data", { status: 400 });
      const base64 = data.includes(",") ? data.split(",")[1] : data;
      const bytes = Buffer.from(base64, "base64");
      const key = crypto.randomUUID();
      await store.set(key, bytes, { metadata: { contentType: contentType || "image/jpeg" } });
      return Response.json({ key });
    }

    if (req.method === "GET") {
      const key = url.searchParams.get("key");
      if (!key) return new Response("Missing key", { status: 400 });
      const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
      if (!result) return new Response("Not found", { status: 404 });
      return new Response(result.data, {
        headers: {
          "Content-Type": result.metadata?.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
};

export const config = { path: "/api/photos" };
