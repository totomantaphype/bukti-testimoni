import {
  json, requireAuth, readState, writeState, sanitizeSite, readJson,
} from "../_lib.js";

// PUT /api/site  { name, initials, logo, heading, intro } -> simpan tampilan halaman
export async function onRequestPut({ request, env }) {
  await requireAuth(request, env);
  const body = await readJson(request);

  const state = await readState(env);
  state.site = sanitizeSite({ ...state.site, ...body });
  await writeState(env, state);
  return json({ site: state.site });
}
