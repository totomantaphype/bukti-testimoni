import {
  json, HttpError, requireAuth, readState, writeState, readJson,
} from "../../_lib.js";

// PUT /api/testimonials/:id   { caption, label }  -> ubah teks
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
  await writeState(env, state);
  return json({ item: it, items: state.items });
}

// DELETE /api/testimonials/:id  -> hapus
export async function onRequestDelete({ request, env, params }) {
  await requireAuth(request, env);
  const id = String(params.id || "");

  const state = await readState(env);
  const before = state.items.length;
  state.items = state.items.filter((x) => x.id !== id);
  if (state.items.length === before) throw new HttpError(404, "Testimoni tidak ditemukan.");

  await writeState(env, state);
  return json({ removed: id, items: state.items });
}
