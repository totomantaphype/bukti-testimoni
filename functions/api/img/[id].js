import { IMG_PREFIX } from "../../_lib.js";

// GET /api/img/:id -> keluarkan foto testimoni sebagai gambar biasa (bukan JSON).
// Foto disimpan di KV sebagai data URI; di sini diubah kembali jadi byte gambar.
// URL-nya permanen per foto -> boleh di-cache lama sekali (browser + tepi Cloudflare),
// jadi KV hanya dibaca sekali per lokasi.
export async function onRequestGet(context) {
  const { params, env, request } = context;
  const id = String((params && params.id) || "");
  if (!/^[A-Za-z0-9]{1,40}$/.test(id) || !env.TESTI_KV) {
    return new Response("Not found", { status: 404 });
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).origin + "/api/img/" + id, { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const dataUri = await env.TESTI_KV.get(IMG_PREFIX + id);
  if (!dataUri) return new Response("Not found", { status: 404 });

  const m = /^data:([a-zA-Z0-9.+/-]+);base64,([\s\S]+)$/.exec(dataUri);
  if (!m) return new Response("Not found", { status: 404 });

  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const res = new Response(bytes, {
    headers: {
      "content-type": m[1],
      "cache-control": "public, max-age=31536000, immutable",
    },
  });

  if (context.waitUntil) context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
