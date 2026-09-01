# Setup Admin (wajib sekali) — Bukti & Testimoni

Backend admin = **Cloudflare Pages Functions** + **Workers KV**. Semua gratis di
paket Cloudflare gratis. Lakukan 3 langkah di dashboard Cloudflare **satu kali**.

Project Pages: **`bukti-testimoni`**.

---

## 1. Buat KV namespace

1. <https://dash.cloudflare.com> → menu kiri **Storage & Databases** → **KV**
2. **Create instance** → Name: `bukti-testimoni-kv` → **Add**

## 2. Hubungkan KV ke project Pages

1. **Workers & Pages** → project **`bukti-testimoni`** → tab **Settings**
2. Bagian **Bindings** (atau **Functions → KV namespace bindings**) → **Add** →
   **KV namespace**
3. Isi:
   - **Variable name**: `TESTI_KV`  ← harus persis
   - **KV namespace**: `bukti-testimoni-kv`
4. Simpan. Kalau ada pilihan environment, pasang untuk **Production**.

## 3. Set kredensial admin (Environment variables)

Di **Settings → Variables and Secrets** (Production), tambah 3 ini:

| Name | Type | Nilai |
|------|------|-------|
| `ADMIN_USER` | Plaintext | username pilihan Anda, mis. `admin` |
| `ADMIN_PASS` | **Secret** | password kuat pilihan Anda |
| `SESSION_SECRET` | **Secret** | string acak panjang (bikin baru, jangan pakai contoh) |

Bikin `SESSION_SECRET` acak: di terminal jalankan
`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

> `SESSION_SECRET` menandatangani cookie login. Kalau diganti, semua sesi login logout.

## 4. Redeploy

Supaya binding aktif, jalankan deploy ulang:

- GitHub → **Actions** → workflow **Deploy ke Cloudflare Pages** → **Run workflow**, atau
- push commit apa pun ke `main`.

---

## Cara pakai admin

1. Buka <https://bukti.ttmantap.tech/app/admin>
2. Login pakai `ADMIN_USER` / `ADMIN_PASS`
3. **Tambah testimoni**: seret / pilih foto (bisa banyak) → isi keterangan tiap foto
   (+ label opsional) → **Terbitkan sekarang**. Yang baru muncul di urutan teratas.
   Format: JPG, PNG, atau HEIC (foto iPhone — otomatis dikonversi ke JPG saat diunggah;
   konversi pertama agak lama karena memuat komponen ~1,3 MB). Bila sebuah foto gagal,
   pesan status menyebut nama file + alasannya; foto lain yang berhasil tetap masuk antrean.
4. **Kelola**: tombol ↑ ↓ untuk urutan, **Ubah** untuk teks, **Hapus** untuk buang.
5. **Nama / logo / teks sambutan**: buka blok "Nama, logo & teks sambutan" →
   ubah → **Simpan tampilan**.

Perubahan langsung tersimpan di server; halaman publik menyusul dalam ~1 menit (cache).

## Sebelum setup selesai

- Halaman utama tetap tampil (daftar kosong).
- `/app/admin` bisa login, tapi saat menyimpan akan muncul pesan bahwa KV / kredensial
  belum diset.

## Catatan keamanan

- Kredensial admin **tidak** ada di kode / Git — hanya di Environment Variables Cloudflare.
- Cookie login: `HttpOnly`, `Secure`, `SameSite=Strict`, kedaluwarsa 8 jam.
- Ganti `ADMIN_PASS` kapan saja lewat dashboard (berlaku untuk request baru / setelah redeploy).
