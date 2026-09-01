// Helper bersama untuk Functions "Bukti & Testimoni".
// File/dir berawalan "_" tidak dirutekan, hanya ikut di-bundle.

const enc = new TextEncoder();
const dec = new TextDecoder();

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

/* ---------- base64url ---------- */
function b64urlEncode(bytes) {
  let s = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ---------- token sesi (HMAC) ---------- */
function secretOf(env) {
  return env.SESSION_SECRET || env.ADMIN_PASS || "ttm-insecure-fallback-secret";
}
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function makeToken(env, hours = 8) {
  const payload = { exp: Date.now() + hours * 3600 * 1000 };
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey(secretOf(env));
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return body + "." + b64urlEncode(sig);
}

export async function verifyToken(env, token) {
  if (!token || token.indexOf(".") < 0) return false;
  const [body, sig] = token.split(".");
  try {
    const key = await hmacKey(secretOf(env));
    const ok = await crypto.subtle.verify("HMAC", key, b64urlDecode(sig), enc.encode(body));
    if (!ok) return false;
    const payload = JSON.parse(dec.decode(b64urlDecode(body)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch (e) {
    return false;
  }
}

export function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const parts = header.split(/;\s*/);
  for (let i = 0; i < parts.length; i++) {
    const eq = parts[i].indexOf("=");
    if (eq > -1 && parts[i].slice(0, eq) === name) {
      return decodeURIComponent(parts[i].slice(eq + 1));
    }
  }
  return null;
}

export const SESSION_COOKIE = "bukti_sess";

export async function requireAuth(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!(await verifyToken(env, token))) {
    throw new HttpError(401, "Sesi berakhir, silakan login lagi.");
  }
}

export function timingSafeEqual(a, b) {
  const ab = enc.encode(String(a));
  const bb = enc.encode(String(b));
  if (ab.length !== bb.length) return false;
  let r = 0;
  for (let i = 0; i < ab.length; i++) r |= ab[i] ^ bb[i];
  return r === 0;
}

/* ---------- penyimpanan (Workers KV) ---------- */
const STATE_KEY = "state";

export function defaultSite() {
  return {
    name: "Arta Nusantara",
    initials: "AN",
    logo: "",
    heading: "Bukti & testimoni klien",
    intro: "",
  };
}

export function emptyState() {
  return { items: [], site: defaultSite() };
}

function coerceState(raw) {
  let s = raw;
  if (!s || typeof s !== "object" || Array.isArray(s)) s = {};
  if (!Array.isArray(s.items)) s.items = [];
  const d = defaultSite();
  if (!s.site || typeof s.site !== "object" || Array.isArray(s.site)) s.site = d;
  else for (const k in d) if (typeof s.site[k] !== "string") s.site[k] = d[k];
  s.items = s.items
    .filter((it) => it && typeof it === "object" && typeof it.image === "string")
    .map((it) => ({
      id: String(it.id || newId()),
      image: it.image,
      caption: String(it.caption || ""),
      label: String(it.label || ""),
      date: String(it.date || new Date().toISOString()),
    }));
  return s;
}

export async function readState(env) {
  if (!env.TESTI_KV) return emptyState();
  const raw = await env.TESTI_KV.get(STATE_KEY);
  if (!raw) return emptyState();
  try {
    return coerceState(JSON.parse(raw));
  } catch (e) {
    return emptyState();
  }
}

// Batas aman: 1 key KV maks 25 MiB. Kita jaga di ~22 MB.
const MAX_STATE_BYTES = 22 * 1024 * 1024;

export async function writeState(env, state) {
  if (!env.TESTI_KV) {
    throw new HttpError(503, "Penyimpanan (KV) belum dihubungkan di Cloudflare. Lihat PANDUAN-ADMIN.md.");
  }
  const body = JSON.stringify(coerceState(state));
  if (body.length > MAX_STATE_BYTES) {
    throw new HttpError(413, "Halaman sudah hampir penuh. Hapus beberapa testimoni lama dulu.");
  }
  await env.TESTI_KV.put(STATE_KEY, body);
}

/* ---------- validasi input ---------- */
const IMG_RE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMG = 3_600_000; // ~3.6 MB per gambar (data URI)
const MAX_LOGO = 500_000;

export function checkImage(v, max = MAX_IMG, field = "Gambar") {
  const s = String(v || "");
  if (!IMG_RE.test(s)) throw new HttpError(400, field + " harus berupa PNG/JPG/WebP.");
  if (s.length > max) throw new HttpError(400, field + " terlalu besar. Pakai gambar lebih kecil.");
  return s;
}

export function sanitizeItem(input) {
  const image = checkImage(input && input.image);
  const caption = String((input && input.caption) || "").trim().slice(0, 280);
  const label = String((input && input.label) || "").trim().slice(0, 80);
  if (caption.length < 3) throw new HttpError(400, "Keterangan minimal 3 karakter.");
  return { image, caption, label };
}

export function sanitizeSite(input) {
  const d = defaultSite();
  const g = (k, n) => String((input && input[k]) || "").trim().slice(0, n);
  let logo = String((input && input.logo) || "");
  if (logo) logo = checkImage(logo, MAX_LOGO, "Logo");
  const initials = (g("initials", 3) || d.initials).toUpperCase().slice(0, 3);
  return {
    name: g("name", 60) || d.name,
    initials,
    logo,
    heading: g("heading", 80),
    intro: g("intro", 400),
  };
}

export function newId() {
  const r = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2);
  return "m" + r.slice(0, 12);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    throw new HttpError(400, "Data tidak valid.");
  }
}
