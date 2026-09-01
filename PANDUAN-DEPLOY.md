# Deploy + Sambung Domain — Bukti & Testimoni

Domain `ttmantap.tech` **sudah di Cloudflare** (nameserver Cloudflare, sama seperti
`prediksi.ttmantap.tech`). Jadi menyambung `bukti.ttmantap.tech` cukup beberapa klik,
**tanpa menyentuh Namecheap**.

---

## 1. Buat repo GitHub

1. Buat repo baru, mis. `bukti-testimoni` (private boleh).
2. Dari folder `site/` ini:

   ```bash
   cd D:\file-kerja-ttm\bukti-jp\site
   git init
   git add -A
   git commit -m "awal: website bukti & testimoni"
   git branch -M main
   git remote add origin https://github.com/<user>/bukti-testimoni.git
   git push -u origin main
   ```

## 2. Buat project Cloudflare Pages

**Cara A — lewat GitHub (auto-deploy, disarankan):**

1. dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pilih repo `bukti-testimoni`.
2. Build settings: **Framework preset = None**, **Build command = (kosong)**,
   **Build output directory = `/`** (root). Deploy.
3. Nama project akan jadi `bukti-testimoni` → alamat sementara `bukti-testimoni.pages.dev`.

**Cara B — upload manual (tanpa Git):**

1. **Create** → **Pages** → **Upload assets** → nama `bukti-testimoni`.
2. Seret **isi** folder `site/` → **Deploy**.
   (Update berikutnya harus upload ulang tiap kali — Cara A lebih enak.)

> Kalau pakai Cara B tapi tetap mau auto-deploy dari GitHub Actions:
> tambah 2 secret di repo (**Settings → Secrets and variables → Actions**):
> `CLOUDFLARE_API_TOKEN` (buat di My Profile → API Tokens → template "Edit Cloudflare Workers")
> dan `CLOUDFLARE_ACCOUNT_ID` (ada di sidebar dashboard). Workflow `.github/workflows/deploy.yml`
> sudah disiapkan.

## 3. Setup KV + kredensial admin

Ikuti **PANDUAN-ADMIN.md** (buat KV `TESTI_KV`, set `ADMIN_USER` / `ADMIN_PASS` /
`SESSION_SECRET`), lalu redeploy.

## 4. Sambung `bukti.ttmantap.tech`

1. Project `bukti-testimoni` → tab **Custom domains** → **Set up a custom domain**.
2. Ketik `bukti.ttmantap.tech` → **Continue** → **Activate domain**.
   Karena zona `ttmantap.tech` sudah di Cloudflare, record DNS dibuat otomatis.
3. Tunggu status **Active** + SSL terbit (beberapa menit).

Selesai — <https://bukti.ttmantap.tech> live, admin di `/app/admin`.

## 5. Isi testimoni

Foto testimoni lama ada di `..\testimoni-lama\` (2 file). Login ke `/app/admin`,
unggah yang mau dipakai. (`2-asqo2.jpg` sepertinya data uji — lewati kalau memang tes.)

---

## Update ke depannya

Edit file → `git add -A && git commit -m "..." && git push` → auto-deploy ~1 menit.
Atau minta lewat sesi Claude Code: perubahan dibuat + di-push dari sana.
