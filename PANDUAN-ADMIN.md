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

Supaya binding aktif, jalankan deploy ulang: push commit apa pun ke `main`
(Cloudflare Pages otomatis build ~1–2 menit), atau di dashboard project **`bukti-testimoni`**
→ tab **Deployments** → **Retry deployment** pada deploy terakhir.

---

## Cara pakai admin

1. Buka <https://bukti.ttmantap.tech/app/admin>
2. Login pakai `ADMIN_USER` / `ADMIN_PASS`
3. **Tambah testimoni**: seret / pilih foto (bisa banyak) → isi keterangan tiap foto
   (+ label opsional) → atur **Tanggal tampil** (default hari ini, bisa diubah) →
   **Terbitkan sekarang**. Yang baru muncul di urutan teratas.
   Format: JPG, PNG, atau HEIC (foto iPhone — otomatis dikonversi ke JPG saat diunggah;
   konversi pertama agak lama karena memuat komponen ~1,3 MB). Bila sebuah foto gagal,
   pesan status menyebut nama file + alasannya; foto lain yang berhasil tetap masuk antrean.
4. **Kelola**: tombol ↑ ↓ untuk urutan, **Ubah** untuk teks & tanggal, **Hapus** untuk buang.
5. **Nama / logo / teks sambutan / ticker**: buka blok "Nama, logo & teks sambutan" →
   ubah → **Simpan tampilan**. **Teks berjalan / ticker** tampil di bawah judul halaman
   utama; tulis 1 baris untuk 1 pesan (beberapa baris = beberapa pesan yang berjalan
   bergantian). Kosongkan bila tak ingin ada ticker.

Di halaman utama ada juga **kotak pencarian** di pojok kanan atas (di atas judul) —
pengunjung mengetik kata kunci untuk menyaring testimoni berdasarkan keterangan / label
(tidak perlu diatur di admin).

Perubahan langsung tersimpan di server; halaman publik menyusul dalam ~1 menit (cache).

## Penyimpanan foto

- Foto disimpan **satu per satu** di Cloudflare KV (bukan lagi ditumpuk jadi satu paket
  22 MB). Batas praktis sekarang ~1 GB — cukup untuk ribuan foto, tetap gratis.
- Meter **"Ruang terpakai"** di panel menunjukkan total ukuran semua foto (dari ~1000 MB).
- Foto baru otomatis dikecilkan lebih agresif (sisi terpanjang maks 1200 px) — biasanya
  0,2–0,4 MB per foto. Screenshot chat/transfer tetap jelas.
- Kalau ada foto lama dari versi sebelumnya, panel menampilkan kotak
  **"Pindahkan N foto sekarang"** — klik sekali, tunggu selesai. Foto & tampilan tidak
  berubah. Cukup dilakukan satu kali.

## Sebelum setup selesai

- Halaman utama tetap tampil (daftar kosong).
- `/app/admin` bisa login, tapi saat menyimpan akan muncul pesan bahwa KV / kredensial
  belum diset.

## Catatan keamanan

- Kredensial admin **tidak** ada di kode / Git — hanya di Environment Variables Cloudflare.
- Cookie login: `HttpOnly`, `Secure`, `SameSite=Strict`, kedaluwarsa 8 jam.
- Ganti `ADMIN_PASS` kapan saja lewat dashboard (berlaku untuk request baru / setelah redeploy).
