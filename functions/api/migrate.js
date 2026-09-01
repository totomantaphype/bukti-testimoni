import {
  json, HttpError, requireAuth, readState, writeState, newId, IMG_PREFIX,
} from "../_lib.js";

// POST /api/migrate
// Pindahkan foto lama yang masih "inline" di dalam "state" ke key KV per-foto.
// Diproses bertahap (maks 30 per panggilan) agar tak melewati batas subrequest.
// Panel admin memanggilnya berulang sampai "remaining" = 0.
export async function onRequestPost({ request, env }) {
  await requireAuth(request, env);
  if (!env.TESTI_KV) {
    throw new HttpError(503, "Penyimpanan (KV) belum dihubungkan di Cloudflare.");
  }

  const BATCH = 30;
  const state = await readState(env);

  let moved = 0;
  for (const it of state.items) {
    if (moved >= BATCH) break;
    if (it.img || typeof it.image !== "string" || !it.image) continue;
    const dataUri = it.image;
    const imgId = newId();
    await env.TESTI_KV.put(IMG_PREFIX + imgId, dataUri, {
      metadata: { size: dataUri.length },
    });
    it.img = imgId;
    it.bytes = dataUri.length;
    delete it.image;
    moved++;
  }

  const remaining = state.items.filter(
    (x) => !x.img && typeof x.image === "string" && x.image
  ).length;

  await writeState(env, state);
  return json({ moved, remaining, items: state.items });
}
