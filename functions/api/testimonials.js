import {
  json, HttpError, requireAuth, readState, writeState,
  sanitizeItem, newId, readJson,
} from "../_lib.js";

// POST /api/testimonials
//   { image, caption, label }                  -> tambah 1
//   { items: [{ image, caption, label }, ...] } -> tambah banyak
// Yang baru selalu masuk di urutan paling atas.
export async function onRequestPost({ request, env }) {
  await requireAuth(request, env);
  const body = await readJson(request);

  const inputs = Array.isArray(body && body.items) ? body.items : [body];
  if (!inputs.length) throw new HttpError(400, "Tidak ada foto untuk ditambahkan.");
  if (inputs.length > 30) throw new HttpError(400, "Maksimal 30 foto sekali unggah.");

  const now = new Date().toISOString();
  const additions = inputs.map((raw) => {
    const clean = sanitizeItem(raw);
    return { id: newId(), image: clean.image, caption: clean.caption, label: clean.label, date: now };
  });

  const state = await readState(env);
  state.items = additions.concat(state.items);
  await writeState(env, state);

  return json({ added: additions.length, items: state.items }, 201);
}
