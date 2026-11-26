# Petualangan Modus 🎮

Aplikasi pembelajaran matematika materi **Statistika: Modus** untuk siswa SMP, dibuat untuk tugas Alpro.

## Fitur
- **Halaman awal**: isi nama petualang dan pilih menu.
- **Materi**: pengertian modus, langkah mencari modus, data dengan dua modus, tabel frekuensi, dan soal cerita.
- **Latihan Soal**: 5 soal Mathematical Literacy berbentuk pilihan ganda bertahap (25 tahap, skor maksimal 30), lengkap dengan pembahasan per tahap.
- **Asisten Belajar AI (Kak Modi)**: chatbot berbasis **DeepSeek** yang membimbing siswa langkah demi langkah:
  - mengikuti fase *Rigorous Mathematical Thinking* (RMT) sesuai ringkasan dosen: **Input → Elaborasi → Output**, dengan Aktivitas Belajar (analisis tugas, perencanaan, refleksi) dan kriteria MLE (intensionalitas, makna, transendensi). Lihat `RMT.md` dan `docs/Ringkasan_RMT_dari_Dosen.md`;
  - fokus bimbingan disusun dari hasil wawancara dan uji coba siswa (ketelitian menghitung frekuensi dan membaca tabel);
  - mengelola *Cognitive Load* (satu langkah per pesan, bahasa singkat, pertanyaan pemantik);
  - memberi petunjuk bertingkat (Petunjuk 1–3) sesuai kesulitan siswa;
  - **tidak memberikan jawaban akhir** secara langsung;
  - dilengkapi **kuesioner harian Cognitive Load** (10 butir, skala 1–9) yang langsung menampilkan rata-rata extraneous, intrinsic, dan germane load;
  - punya **mode cadangan**: jika DeepSeek tidak tersedia (belum deploy atau saldo habis), Kak Modi tetap membimbing per fase RMT memakai tahapan soal, mengecek jawaban, memberi petunjuk bertingkat, dan menampilkan pilihan jawaban setelah petunjuk ke-3.
- **modus.py**: program Python sederhana untuk menghitung modus.

## Struktur folder
```
index.html        Beranda
materi.html       Materi
latihan.html      Latihan soal
asisten.html      Asisten Belajar AI (chatbot)
css/              style.css, asisten.css
js/               soal.js, app.js, asisten.js
api/chat.js       Backend (serverless) yang memanggil DeepSeek
RMT.md            Penerapan RMT di aplikasi
docs/             Ringkasan RMT dari dosen
js/kuesioner.js   Kuesioner Cognitive Load
.env.example      Contoh variabel lingkungan
modus.py          Program Python modus
```

## Keamanan API Key
API Key DeepSeek **tidak** ditulis di kode frontend dan **tidak** diunggah ke GitHub.
API Key disimpan sebagai variabel lingkungan `DEEPSEEK_API_KEY` di backend (Vercel).
File `.env` sudah dimasukkan ke `.gitignore`.

## Cara menjalankan
**Tanpa chatbot:** buka `index.html` di browser atau pakai Live Server di VS Code.

**Dengan chatbot (deploy ke Vercel):**
1. Masuk ke https://vercel.com dengan akun GitHub.
2. *Add New → Project* → pilih repository `Petualangan-Modus` → *Import*.
3. Buka *Environment Variables*, isi `DEEPSEEK_API_KEY` (DeepSeek resmi, berbayar) **atau** `OPENROUTER_API_KEY` (model DeepSeek gratis lewat https://openrouter.ai/keys).
4. Klik *Deploy*. Buka link Vercel, lalu pilih menu **Asisten Belajar AI**.

**Menjalankan lokal dengan chatbot:**
1. Salin `.env.example` menjadi `.env`, lalu isi API Key.
2. Jalankan `npx vercel dev` dan buka http://localhost:3000.

## Teknologi
HTML, CSS, JavaScript, Node.js (Vercel Serverless Function), DeepSeek API, Python.

## Link
- Repository: https://github.com/Kesyaapril13/Petualangan-Modus
- GitHub Pages (tanpa chatbot): https://kesyaapril13.github.io/Petualangan-Modus/

## Pembuat
Nama: Kesya Nur Aprilliani
NIM: 2225250219
