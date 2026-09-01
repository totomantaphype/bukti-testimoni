# Bukti & Testimoni — Arta Nusantara

Website statik + **Cloudflare Pages Functions** + **Workers KV**.
Halaman utama menampilkan foto bukti/testimoni klien; admin untuk mengelolanya.

- Live (rencana): <https://bukti.ttmantap.tech>
- Admin: <https://bukti.ttmantap.tech/app/admin>

## Isi

| Path | Fungsi |
|------|--------|
| `index.html` | Halaman publik (ambil data dari `/api/state`) |
| `app/admin/index.html` | Panel admin: login + kelola testimoni & tampilan |
| `assets/app.css` | Gaya bersama kedua halaman |
| `functions/api/state.js` | `GET` daftar testimoni + konfigurasi tampilan (publik) |
| `functions/api/session.js` | Login / cek / logout (cookie HMAC) |
| `functions/api/testimonials.js` | `POST` tambah testimoni (1 atau banyak) |
| `functions/api/testimonials/[id].js` | `PUT` ubah teks, `DELETE` hapus |
| `functions/api/testimonials/reorder.js` | `POST` susun ulang urutan |
| `functions/api/site.js` | `PUT` simpan nama / logo / teks sambutan |
| `functions/_lib.js` | Helper bersama (auth, validasi, KV store) |
| `functions/_middleware.js` | Pembungkus error JSON untuk `/api/*` |
| `_headers` | Header keamanan + CSP |
| `404.html` | Halaman error |
| `PANDUAN-ADMIN.md` | **Setup KV + kredensial admin (wajib sekali)** |
| `PANDUAN-DEPLOY.md` | Deploy + sambung domain |

## Arsitektur singkat

- Semua data (daftar testimoni + `site`) disimpan sebagai **satu key KV** `state`
  (`{ items: [...], site: {...} }`). Foto disimpan sebagai data URI di dalam JSON,
  otomatis diperkecil di browser sebelum diunggah (maks ~1400 px).
- Batas aman 1 key KV = 25 MiB; kode menolak tulis di atas ~22 MB.
- Kredensial admin = Environment Variables Cloudflare (`ADMIN_USER`, `ADMIN_PASS`,
  `SESSION_SECRET`) — tidak ada di Git.
- Sebelum KV/kredensial diset: halaman utama tetap jalan (daftar kosong),
  admin menampilkan pesan setup.

## Auto-deploy

Setiap `git push` ke `main` → GitHub Actions → `wrangler pages deploy` ke Cloudflare.
URL & domain tidak berubah. Perlu 2 secret di repo GitHub:
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Jalan lokal

```bash
npx wrangler pages dev .
```

Tambah `--kv TESTI_KV` untuk menguji tulis. Tanpa itu, API baca memakai data kosong
dan tulis (POST/PUT/DELETE) akan menolak dengan pesan setup.
