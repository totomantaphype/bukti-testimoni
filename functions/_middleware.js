import { HttpError, json } from "./_lib.js";

// Jalan untuk setiap request. Ubah error dari handler /api/* jadi JSON rapi.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!url.pathname.startsWith("/api/")) {
    return context.next();
  }
  try {
    return await context.next();
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof HttpError ? err.message : "Kesalahan server.";
    return json({ error: message }, status);
  }
}
