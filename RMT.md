# Penerapan Rigorous Mathematical Thinking (RMT) di Aplikasi Petualangan Modus

Ringkasan lengkap dari dosen: [`docs/Ringkasan_RMT_dari_Dosen.md`](docs/Ringkasan_RMT_dari_Dosen.md)
(Kinard & Kozulin, *Rigorous Mathematical Thinking: Conceptual Formation in the Mathematics Classroom*).

## Inti RMT yang dipakai (dari ringkasan)
- **RMT = sintesis Vygotsky + Feuerstein**: alat psikologis dan konsep ilmiah (Vygotsky) dipadukan dengan Pengalaman Belajar Ter-mediasi / MLE (Feuerstein).
- **Tiga pilar RMT**: (1) fungsi kognitif spesifik matematika pada fase **Input – Elaborasi – Output**, (2) **alat psikologis** matematika (simbol, bahasa matematika, organizer grafis seperti **tabel**), (3) **MLE**.
- **Aktivitas Belajar**: Analisis Tugas → Perencanaan Tindakan → Refleksi.
- **Kriteria MLE**: Intensionalitas & Resiprositas, Makna, Transendensi.
- **Guru (di sini: AI) sebagai mediator kognitif**: memediasi cara berpikir lewat pertanyaan terpimpin dan dialog reflektif, bukan menyampaikan prosedur.
- **Diagnosis kesulitan**: mengenali fase kognitif yang bermasalah (Input, Elaborasi, atau Output) agar bantuan tepat sasaran.
- **Dari konsep sehari-hari ke konsep ilmiah**, menghindari perilaku coba-coba (*trial-and-error*), dan mendorong metakognisi.

## Fase RMT di Kak Modi (Asisten Belajar AI)
| Fase | Aktivitas Belajar | Yang dilakukan Kak Modi pada materi modus |
|---|---|---|
| **1. Input** (mengumpulkan informasi) | Analisis Tugas | Menyebut tujuan, meminta siswa membaca data dengan teliti, menyebut yang diketahui/ditanya, mengenali alat psikologis (nilai, frekuensi, turus, tabel), menjembatani "yang paling sering" → istilah **modus** |
| **2. Elaborasi** (mengolah data) | Perencanaan Tindakan | Membimbing operasi mental: mengurutkan (seriasi), menghitung frekuensi dengan turus (klasifikasi), membandingkan frekuensi, lalu siswa menyimpulkan sendiri bahwa modus adalah **nilai** dengan frekuensi terbesar |
| **3. Output** (mengekspresikan hasil) | Refleksi | Siswa menyatakan modus dengan bahasa yang tepat dan alasannya, memeriksa ulang, merefleksikan cara yang dipakai, lalu **transendensi**: menghubungkan ke kehidupan sehari-hari dan kasus dua modus |

Fase yang sedang aktif ditampilkan di layar (Input → Elaborasi → Output).

## Kriteria MLE dalam bimbingan
- **Intensionalitas & resiprositas**: Kak Modi menyebut tujuan langkah dan selalu menunggu respons siswa.
- **Makna**: setiap jawaban benar diikuti penjelasan singkat mengapa langkah itu penting.
- **Transendensi**: setelah refleksi, siswa diajak memakai konsep modus di situasi lain.

## Pengelolaan Cognitive Load
- **Intrinsic load**: soal dipecah menjadi langkah kecil, satu pertanyaan per pesan.
- **Extraneous load**: jawaban maksimal 3 kalimat, bahasa sederhana, data tampil sebagai kartu angka/tabel rapi, pilihan jawaban baru muncul setelah petunjuk ke-3.
- **Germane load**: pertanyaan pemantik, permintaan alasan, refleksi, dan transendensi.
- **Pengukuran**: kuesioner harian Cognitive Load (10 butir, skala Paas 1–9: 3 extraneous, 3 intrinsic, 4 germane) diisi di akhir sesi. Hasil rata-rata tiap komponen langsung tampil beserta saran.

## Petunjuk bertingkat (asesmen dinamis)
Seperti format *cake* pada asesmen dinamis, bantuan diberikan bertahap: Petunjuk 1 (pertanyaan pengarah) → Petunjuk 2 (bagian data yang diperhatikan) → Petunjuk 3 (contoh dengan data lain / pilihan jawaban). Jawaban akhir tidak pernah diberikan.

## Dasar dari Wawancara dan Uji Coba
Hasil uji coba (S02: 28/30; poin hilang di soal tabel frekuensi) dan siswa lain menunjukkan dua kesulitan:
1. **Input**: sulit membedakan baris nilai dan frekuensi pada tabel → Kak Modi menanyakan dulu "baris mana yang nilai, mana yang frekuensi?".
2. **Elaborasi**: kurang teliti mengubah turus menjadi angka frekuensi → Kak Modi meminta siswa menghitung ulang turus.

## Mode Cadangan
Jika DeepSeek tidak tersedia, Kak Modi tetap menjalankan fase RMT tanpa AI: tahap pertama soal = Input, tahap tengah = Elaborasi, tahap akhir + refleksi + transendensi = Output. Jawaban dicek, petunjuk bertingkat, dan pilihan jawaban muncul setelah petunjuk ke-3.
