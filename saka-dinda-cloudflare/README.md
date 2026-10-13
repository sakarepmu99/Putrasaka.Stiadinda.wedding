# The Wedding of Saka & Dinda

Undangan mandiri: 16 Januari 2027, akad 09.00–10.00 WIB, resepsi 11.00–15.00 WIB, Stia Family House.

## Pemasangan lewat beberapa klik

1. Buat akun Cloudflare dan GitHub, lalu verifikasi email.
2. Buat repositori GitHub **Public** bernama `saka-dinda-wedding`. Masukkan isi folder ini langsung di akar repositori, bukan ZIP dan bukan di dalam folder tambahan. Upload lewat **Add file → Upload files**, lalu **Commit changes**. Foto, video dan isi undangan di repositori publik dapat dilihat orang lain.
3. Buka `Mulai_Di_Sini.html` dari paket utama. Isi username GitHub dan klik **Deploy to Cloudflare** setelah upload selesai.
4. Login Cloudflare dan GitHub, izinkan koneksi GitHub, pilih akun Cloudflare, dan lanjutkan.
5. Pertahankan nama Worker `saka-dinda-wedding`. Cloudflare membuat database `DB` secara otomatis. Perintah build: `npm run build`. Perintah deploy: `npm run deploy`. Jika layar menanyakan build variable Node.js, pilih Node.js 22 atau lebih baru.
6. Klik **Deploy**, tunggu selesai, lalu buka alamat `workers.dev` yang diberikan Cloudflare. Jangan menebak alamat sebelum hasil deploy muncul.

## Nama tamu

Tambahkan `/?to=Farhan%20Zulfikar` pada alamat baru. Nama tampil di pembuka dan mengisi nama formulir saat belum ada konfirmasi pada browser itu.

## Data RSVP dan buku ucapan

Tabel dibuat melalui migrasi otomatis ketika deploy. Saat paket diambil pada 13 Oktober 2026, database undangan asal memiliki **0 RSVP dan 0 ucapan**. Jika ada kiriman baru sebelum pindah, ekspor ulang data sebelum membagikan link baru. Cookie browser dari alamat lama tidak ikut berpindah ke domain baru.

Untuk melihat data, buka Cloudflare → **Storage & databases → D1 → saka-dinda-guestbook → Studio**, lalu tabel `rsvps` atau `wishes`. RSVP tidak dipublikasikan di API umum; buku ucapan memang ditampilkan di undangan.

## Domain dan biaya

Domain sendiri tidak wajib. Mulai dengan Workers Free dan D1 Free, sesuai batas penggunaan Cloudflare. Jika memakai domain sendiri, sambungkan setelah deploy dan tes.

## Validasi sebelum dibagikan

Coba dari HP: buka amplop, putar/jeda musik dan video, nama tamu, Maps, kalender, salin rekening, kirim RSVP, serta kirim ucapan. Build dan pengujian API lokal tersedia; deploy pada akun Cloudflare Anda belum dilakukan.

## Pengembangan lokal (opsional)

`npm install`, `npm run build`, `npx wrangler d1 migrations apply DB --local`, lalu `npx wrangler dev`.

Kode dan seluruh media ada dalam paket. Tidak memakai hosting ChatGPT, plugin ChatGPT, atau API OpenAI. Jangan upload `.env`, `.dev.vars`, token API, maupun data tamu ke repositori publik.
