import {
  json, HttpError, makeToken, verifyToken, getCookie,
  timingSafeEqual, readJson, SESSION_COOKIE,
} from "../_lib.js";

const HOURS = 8;

function cookie(value, maxAgeSeconds) {
  return [
    SESSION_COOKIE + "=" + value,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=" + maxAgeSeconds,
  ].join("; ");
}

// GET /api/session -> { authed: boolean }
export async function onRequestGet({ request, env }) {
  const token = getCookie(request, SESSION_COOKIE);
  return json({ authed: await verifyToken(env, token) });
}

// POST /api/session { user, pass } -> set cookie
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);

  const U = env.ADMIN_USER;
  const P = env.ADMIN_PASS;
  if (!U || !P) {
    throw new HttpError(
      503,
      "Kredensial admin belum diset di Cloudflare (ADMIN_USER / ADMIN_PASS). Lihat PANDUAN-ADMIN.md."
    );
  }

  const okUser = timingSafeEqual(body && body.user, U);
  const okPass = timingSafeEqual(body && body.pass, P);
  if (!okUser || !okPass) {
    throw new HttpError(401, "Username atau password salah.");
  }

  const token = await makeToken(env, HOURS);
  return json({ authed: true }, 200, { "set-cookie": cookie(token, HOURS * 3600) });
}

// DELETE /api/session -> hapus cookie
export async function onRequestDelete() {
  return json({ authed: false }, 200, { "set-cookie": cookie("", 0) });
}
