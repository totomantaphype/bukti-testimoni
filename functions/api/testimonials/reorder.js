import {
  json, HttpError, requireAuth, readState, writeState, readJson,
} from "../../_lib.js";

// POST /api/testimonials/reorder  { order: [id, id, ...] }
// Susun ulang sesuai daftar id. Id yang tak disebut ditaruh di akhir (urutan lama).
export async function onRequestPost({ request, env }) {
  await requireAuth(request, env);
  const body = await readJson(request);
  const order = Array.isArray(body && body.order) ? body.order.map(String) : null;
  if (!order) throw new HttpError(400, "Data urutan tidak valid.");

  const state = await readState(env);
  const byId = new Map(state.items.map((it) => [it.id, it]));
  const next = [];
  for (const id of order) {
    if (byId.has(id)) {
      next.push(byId.get(id));
      byId.delete(id);
    }
  }
  for (const leftover of byId.values()) next.push(leftover);

  state.items = next;
  await writeState(env, state);
  return json({ items: state.items });
}
