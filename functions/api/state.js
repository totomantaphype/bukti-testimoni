import { json, readState } from "../_lib.js";

// GET /api/state -> { items, site }
// Dipakai halaman publik dan panel admin. Foto testimoni memang untuk ditampilkan,
// jadi tidak ada data rahasia di sini.
export async function onRequestGet({ env }) {
  const state = await readState(env);
  return json(state, 200, { "cache-control": "public, max-age=60" });
}
