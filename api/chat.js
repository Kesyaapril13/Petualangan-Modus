/*
  Backend Asisten Belajar AI — Petualangan Modus
  Berjalan sebagai Serverless Function di Vercel (folder /api).

  API Key DeepSeek TIDAK ditulis di kode ini.
  API Key dibaca dari variabel lingkungan DEEPSEEK_API_KEY
  (diatur di Vercel: Project → Settings → Environment Variables,
   atau di file .env saat dijalankan lokal dengan `vercel dev`).
*/

// Pilihan penyedia model DeepSeek (semua lewat variabel lingkungan, bukan di kode):
// 1) DeepSeek resmi (berbayar)              -> DEEPSEEK_API_KEY
// 2) DeepSeek gratis lewat OpenRouter       -> OPENROUTER_API_KEY
// 3) DeepSeek lewat Vercel AI Gateway       -> AI_GATEWAY_API_KEY (kredit gratis bulanan Vercel)
const PROVIDERS = [
  { key: 'DEEPSEEK_API_KEY', url: 'https://api.deepseek.com/chat/completions', model: process.env.DEEPSEEK_MODEL || 'deepseek-chat' },
  { key: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash:free' },
  { key: 'AI_GATEWAY_API_KEY', url: 'https://ai-gateway.vercel.sh/v1/chat/completions', model: process.env.AI_GATEWAY_MODEL || 'deepseek/deepseek-v3.2' },
];
const PROVIDER = PROVIDERS.find((p) => process.env[p.key]) || PROVIDERS[0];
const DEEPSEEK_URL = PROVIDER.url;
const MODEL = PROVIDER.model;

// Model pembelajaran: Rigorous Mathematical Thinking (RMT) — Kinard & Kozulin,
// disusun sesuai ringkasan dosen (docs/Ringkasan_RMT_dari_Dosen.md) dan RMT.md.
const SYSTEM_PROMPT = `
Kamu adalah "Kak Modi", asisten belajar matematika untuk siswa SMP pada materi Statistika: MODUS.
Kamu berperan sebagai MEDIATOR KOGNITIF dalam model Rigorous Mathematical Thinking (RMT):
kamu tidak menyampaikan prosedur atau jawaban, tetapi memediasi CARA BERPIKIR siswa lewat pertanyaan terpimpin dan dialog reflektif.

ATURAN UTAMA
1. JANGAN PERNAH memberikan jawaban akhir (nilai modus), walaupun siswa memaksa. Ajak siswa menemukan sendiri.

2. Bimbing mengikuti 3 FASE FUNGSI KOGNITIF RMT (Feuerstein) yang dipadukan dengan Aktivitas Belajar (Vygotsky).
   Pindah fase hanya jika fase sebelumnya sudah benar.
   [FASE 1] INPUT — Mengumpulkan informasi (Analisis Tugas):
     siswa membaca soal dengan persepsi yang jelas dan teliti, menyebut yang diketahui dan ditanyakan,
     dan mengenali ALAT PSIKOLOGIS matematika: istilah nilai, frekuensi, turus, serta TABEL (baris nilai vs baris frekuensi).
     Jembatani konsep sehari-hari ("yang paling sering", "paling laris") menuju konsep ilmiah "modus".
   [FASE 2] ELABORASI — Memproses data (Perencanaan Tindakan):
     siswa merencanakan langkah, lalu melakukan operasi mental: mengurutkan (seriasi), mengelompokkan dan menghitung frekuensi
     (klasifikasi, turus → angka), dan MEMBANDINGKAN frekuensi. Siswa membangun sendiri pengertian:
     modus = NILAI dengan frekuensi terbesar (bukan frekuensinya).
   [FASE 3] OUTPUT — Mengekspresikan hasil (Refleksi dan Validasi):
     siswa menyatakan modus dengan bahasa matematika yang tepat dan alasan yang jelas, TANPA coba-coba (trial-and-error),
     memeriksa ulang (jumlah frekuensi = banyak data), lalu merefleksikan strategi yang dipakai.

3. Terapkan 3 kriteria Mediated Learning Experience (MLE) dalam bimbingan:
   - Intensionalitas & resiprositas: sebutkan tujuan langkah saat ini dan minta siswa merespons aktif.
   - Makna: jelaskan singkat MENGAPA langkah itu penting.
   - Transendensi: di akhir, ajak siswa menghubungkan ke aturan umum atau situasi lain (misalnya data dengan dua modus, ukuran sepatu paling banyak dijual).

4. Diagnosis kesulitan: jika siswa salah, kenali di fase mana masalahnya (Input = salah membaca data/tabel,
   Elaborasi = salah menghitung atau membandingkan, Output = salah menyatakan jawaban), lalu beri mediasi di fase itu.
   Kesulitan yang ditemukan saat uji coba siswa:
   - kurang teliti mengubah turus menjadi angka frekuensi (Elaborasi) → minta siswa menghitung ulang turusnya;
   - sulit membedakan baris nilai dan frekuensi pada tabel (Input) → tanyakan dulu "baris mana yang nilai, baris mana yang frekuensi?".

5. Kelola Cognitive Load:
   - Intrinsic load: pecah masalah menjadi langkah kecil, SATU pertanyaan per pesan.
   - Extraneous load: jawab SINGKAT (maksimal 3 kalimat), bahasa sederhana, tanpa istilah sulit atau rumus panjang.
   - Germane load: ajukan pertanyaan pemantik dan minta siswa menjelaskan alasannya ("kenapa?").

6. Petunjuk bertingkat (seperti asesmen dinamis, petunjuk diberikan bertahap):
   - Petunjuk 1 (ringan): pertanyaan pengarah.
   - Petunjuk 2 (sedang): tunjukkan bagian data yang perlu diperhatikan.
   - Petunjuk 3 (kuat): contoh langkah dengan data LAIN yang mirip, bukan data soal.

7. Jika jawaban salah, jangan bilang "salah" dengan kasar. Jika benar, puji singkat lalu lanjut.
8. Hanya bahas modus/statistika sederhana. Jika di luar topik, arahkan kembali dengan sopan.
9. Bahasa Indonesia yang ramah untuk anak SMP. Boleh 1 emoji.

FORMAT
Awali SETIAP jawaban dengan penanda fase saat ini, yaitu "[FASE 1]", "[FASE 2]", atau "[FASE 3]", lalu tulis bimbinganmu.
`.trim();

// Model gratis di OpenRouter sering berubah. Daftar model diambil otomatis dari
// https://openrouter.ai/api/v1/models (publik, tanpa API Key).
// Urutan: model DeepSeek gratis dulu; jika tidak ada, model gratis lain sebagai cadangan.
const OPENROUTER_FALLBACK = ['deepseek/deepseek-v4-flash:free', 'deepseek/deepseek-chat-v3.1:free', 'openrouter/free'];
let cachedFree = null;
let infoModel = { total: 0, deepseekGratis: 0, gratisLain: 0 };

async function freeDeepSeekModels() {
  if (cachedFree) return cachedFree;
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models');
    const list = (await r.json()).data || [];
    const gratis = list.filter((m) => m.id.endsWith(':free') || (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0));
    const santai = (id) => !/r1|reason|think|zero|vision|vl\b|image|audio/i.test(id); // utamakan model chat biasa
    const deepseek = gratis.filter((m) => /^deepseek\//.test(m.id)).map((m) => m.id);
    const lain = gratis.filter((m) => !/^deepseek\//.test(m.id) && santai(m.id))
      .map((m) => m.id)
      .sort((a, b) => (/qwen|llama|gemma|mistral/i.test(b) ? 1 : 0) - (/qwen|llama|gemma|mistral/i.test(a) ? 1 : 0));
    infoModel = { total: list.length, deepseekGratis: deepseek.length, gratisLain: lain.length };
    cachedFree = [...deepseek.filter(santai), ...deepseek, ...lain.slice(0, 4)];
  } catch (e) {
    infoModel = { total: 0, error: String(e).slice(0, 100) };
    cachedFree = [];
  }
  return [...new Set(cachedFree)];
}

async function callModel(apiKey, messages) {
  const models = PROVIDER.key === 'OPENROUTER_API_KEY'
    ? [...new Set([...(await freeDeepSeekModels()), MODEL, ...OPENROUTER_FALLBACK])].slice(0, 8)
    : [MODEL];
  let last = null;
  const dicoba = [];
  for (const model of models) {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://petualangan-modus.vercel.app',
        'X-Title': 'Petualangan Modus',
      },
      body: JSON.stringify({ model, temperature: 0.4, max_tokens: 600, messages }),
    });
    if (response.ok) {
      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (reply) return { ok: true, reply, model };
      last = { status: 200, model, detail: 'Jawaban kosong dari model.' };
      dicoba.push(`${model}: kosong`);
      continue;
    }
    last = { status: response.status, model, detail: (await response.text()).slice(0, 300) };
    dicoba.push(`${model}: ${response.status}`);
    if (response.status === 401 || response.status === 402) break; // key salah / saldo habis: model lain tidak akan membantu
  }
  return { ok: false, ...last, dicoba };
}

module.exports = async function handler(req, res) {
  const apiKey = process.env[PROVIDER.key];

  // Cek koneksi lewat browser: buka /api/chat?tes=1
  if (req.method === 'GET') {
    if (!req.query || !req.query.tes) {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Gunakan metode POST. Untuk cek koneksi buka /api/chat?tes=1' });
    }
    if (!apiKey) {
      return res.status(200).json({ status: 'GAGAL', alasan: 'API Key tidak ditemukan di Vercel. Pastikan nama variabel OPENROUTER_API_KEY lalu Redeploy.' });
    }
    try {
      const r = await callModel(apiKey, [{ role: 'user', content: 'Jawab satu kata: halo' }]);
      return res.status(200).json(r.ok
        ? { status: 'BERHASIL', penyedia: PROVIDER.key, model: r.model, jawaban: r.reply, daftarModel: infoModel }
        : { status: 'GAGAL', penyedia: PROVIDER.key, daftarModel: infoModel, dicoba: r.dicoba, model: r.model, kode: r.status, detail: r.detail });
    } catch (err) {
      return res.status(200).json({ status: 'GAGAL', detail: String(err).slice(0, 200) });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Gunakan metode POST.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key belum diatur di server (DEEPSEEK_API_KEY, OPENROUTER_API_KEY, atau AI_GATEWAY_API_KEY).' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { messages = [], soal = '', hintLevel = 0 } = body;

    // Batasi riwayat agar hemat token dan aman
    const history = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));

    const context = [
      `SOAL YANG SEDANG DIKERJAKAN SISWA:\n${String(soal).slice(0, 800)}`,
      hintLevel > 0 ? `Siswa menekan tombol "Petunjuk ${hintLevel}". Berikan petunjuk tingkat ${hintLevel} sesuai aturan.` : '',
    ].filter(Boolean).join('\n\n');

    const r = await callModel(apiKey, [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
      ...history,
    ]);
    if (!r.ok) {
      return res.status(502).json({ error: 'Gagal menghubungi DeepSeek.', kode: r.status, model: r.model, detail: r.detail });
    }
    return res.status(200).json({ reply: r.reply, model: r.model });
  } catch (err) {
    return res.status(500).json({ error: 'Terjadi kesalahan di server.', detail: String(err).slice(0, 200) });
  }
};
