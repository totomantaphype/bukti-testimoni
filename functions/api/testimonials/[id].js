import {
  json, HttpError, requireAuth, readState, writeState, readJson, sanitizeDate, IMG_PREFIX,
} from "../../_lib.js";

// PUT /api/testimonials/:id   { caption, label, date }  -> ubah teks/tanggal
export async function onRequestPut({ request, env, params }) {
  await requireAuth(request, env);
  const body = await readJson(request);
  const id = String(params.id || "");

  const state = await readState(env);
  const it = state.items.find((x) => x.id === id);
  if (!it) throw new HttpError(404, "Testimoni tidak ditemukan.");

  const caption = String((body && body.caption) || "").trim().slice(0, 280);
  const label = String((body && body.label) || "").trim().slice(0, 80);
  if (caption.length < 3) throw new HttpError(400, "Keterangan minimal 3 karakter.");

  it.caption = caption;
  it.label = label;
  if (body && body.date != null && String(body.date).trim() !== "") {
    it.date = sanitizeDate(body.date, it.date);
  }
  await writeState(env, state);
  return json({ item: it, items: state.items });
}

// DELETE /api/testimonials/:id  -> hapus
export async function onRequestDelete({ request, env, params }) {
  await requireAuth(request, env);
  const id = String(params.id || "");

  const state = await readState(env);
  const before = state.items.length;
  const removed = state.items.find((x) => x.id === id);
  state.items = state.items.filter((x) => x.id !== id);
  if (state.items.length === before) throw new HttpError(404, "Testimoni tidak ditemukan.");

  await writeState(env, state);
  // Buang juga foto di penyimpanan per-key (kalau ada). Bila gagal, tak apa —
  // paling jadi file yatim yang tak terpakai.
  if (removed && removed.img && env.TESTI_KV) {
    try { await env.TESTI_KV.delete(IMG_PREFIX + removed.img); } catch (e) {}
  }
  return json({ removed: id, items: state.items });
}
