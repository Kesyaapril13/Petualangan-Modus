// Vercel Serverless Function: POST /api/chat
// Body: { messages: [{role, content}], soal, hintLevel, fase?, aksi?, hasilCek?, jawabanSiswa? }
// Response: { reply }
// API key dibaca dari environment variable DEEPSEEK_API_KEY (jangan ditulis di kode).
// Pedagogi mengikuti RMT.md: fase Input - Elaborasi - Output, kriteria MLE,
// pengelolaan Cognitive Load, dan petunjuk bertingkat tanpa memberi jawaban akhir.

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
const MAX_MESSAGES = 14;
const MAX_CONTENT_LENGTH = 600;
const TIMEOUT_MS = 15000;

const FASE = {
  input: {
    nama: 'Input (Analisis Tugas)',
    tugas:
      'Bantu siswa mengumpulkan informasi: sebut tujuan langkah, minta siswa membaca data dengan teliti, menyebut yang diketahui dan yang ditanya, serta mengenali alat berpikir (nilai, frekuensi, turus, tabel). Jembatani bahasa sehari-hari "yang paling sering muncul" ke istilah modus.'
  },
  elaborasi: {
    nama: 'Elaborasi (Perencanaan Tindakan)',
    tugas:
      'Bimbing operasi mental: mengurutkan data, menghitung frekuensi dengan turus, lalu membandingkan frekuensi. Siswa sendiri yang menyimpulkan bahwa modus adalah NILAI dengan frekuensi terbesar.'
  },
  output: {
    nama: 'Output (Refleksi)',
    tugas:
      'Siswa menyatakan modus dengan bahasa yang tepat beserta alasannya, memeriksa ulang, merefleksikan cara yang dipakai, lalu transendensi: menghubungkan modus ke kehidupan sehari-hari dan kasus dua modus.'
  }
};

const HINT_GUIDE = {
  0: 'Belum ada petunjuk yang diminta. Jangan memberi petunjuk isi; cukup mediasi dengan pertanyaan.',
  1: 'Petunjuk 1 (pertanyaan pengarah): ajukan satu pertanyaan yang mengarahkan cara berpikir. Jangan menunjuk bagian data tertentu.',
  2: 'Petunjuk 2 (bagian data yang diperhatikan): tunjukkan bagian data atau baris tabel yang perlu diperhatikan, tanpa menghitungkan hasilnya.',
  3: 'Petunjuk 3 (contoh dengan data lain): beri satu contoh singkat memakai data lain yang modusnya berbeda dari soal, lalu minta siswa memilih dari pilihan jawaban yang sekarang tampil di layar.'
};

const AKSI_GUIDE = {
  pertanyaan:
    'Siswa mengirim pesan bebas. Tanggapi sebagai mediator, kaitkan dengan langkah yang sedang aktif, lalu akhiri dengan satu pertanyaan pemantik.',
  bingung:
    'Siswa menekan "Aku bingung". Tenangkan siswa, kenali fase yang bermasalah (Input, Elaborasi, atau Output), pecah langkah sekarang menjadi langkah yang lebih kecil, lalu ajukan satu pertanyaan yang sangat sederhana.',
  petunjuk: 'Siswa menekan "Beri petunjuk". Berikan petunjuk sesuai tingkat petunjuk di bawah.',
  cek: 'Siswa menekan "Cek jawabanku". Hasil pengecekan otomatis ada di bawah. Pakai hasil itu, jangan menilai ulang.',
  alasan:
    'Siswa menjelaskan alasan dari jawabannya yang sudah benar. Tanggapi alasannya (luruskan dengan lembut bila kurang tepat) dan sebut makna langkah ini. Jangan ajukan pertanyaan baru karena aplikasi akan menampilkan langkah berikutnya.',
  refleksi:
    'Siswa menceritakan cara yang dipakainya. Tanggapi singkat dan kuatkan langkah penting: membaca data dengan teliti, membuat turus, menghitung ulang frekuensi, membandingkan, dan modus adalah nilai. Jangan ajukan pertanyaan baru.',
  transendensi:
    'Siswa menjawab pertanyaan penerapan modus di situasi lain. Tanggapi singkat, luruskan bila perlu, dan tutup dengan pujian. Jangan ajukan pertanyaan baru.'
};

const CEK_GUIDE = {
  benar:
    'BENAR. Puji singkat dan sebut makna langkah ini. Jika siswa sudah menyertakan alasan, tanggapi alasannya. Jangan ajukan pertanyaan baru.',
  salah:
    'BELUM TEPAT. Jangan sebut jawaban yang benar. Kenali penyebab yang paling mungkin (terutama dua kesulitan umum di atas), tunjukkan bagian yang perlu diperiksa ulang, lalu ajukan satu pertanyaan agar siswa mencoba lagi.',
  belum_jelas:
    'BELUM JELAS. Jawaban siswa tidak cocok dengan bentuk jawaban yang diharapkan. Minta siswa menulis jawabannya lebih lengkap dan jelas (misalnya dengan angka), tanpa memberi jawabannya.'
};

const SAFE_REPLY =
  'Kak Modi tidak memberi jawabannya langsung, ya, karena kamu pasti bisa menemukannya sendiri. Coba periksa lagi turus atau frekuensi setiap nilai dengan teliti. Nilai mana yang menurutmu paling sering muncul, dan kenapa?';

function clampText(value, max = MAX_CONTENT_LENGTH) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function normalizeHintLevel(value) {
  const level = Number.parseInt(value, 10);
  if (Number.isNaN(level)) return 0;
  return Math.min(3, Math.max(0, level));
}

function numberList(value, max = 50) {
  return Array.isArray(value) ? value.filter((n) => Number.isFinite(n)).slice(0, max) : [];
}

function sanitizeSoal(soal) {
  if (!soal || typeof soal !== 'object') return null;
  const tahap = soal.tahap && typeof soal.tahap === 'object' ? soal.tahap : {};
  const table =
    soal.table && Array.isArray(soal.table.rows)
      ? {
          rows: soal.table.rows
            .filter((row) => Array.isArray(row) && row.length >= 2)
            .slice(0, 20)
            .map((row) => [Number(row[0]), Number(row[1])])
        }
      : null;

  return {
    nomor: Number.parseInt(soal.nomor, 10) || null,
    prompt: clampText(soal.prompt, 300),
    values: numberList(soal.values),
    table,
    selesai: soal.selesai === true,
    tahap: {
      nomor: Number.parseInt(tahap.nomor, 10) || null,
      total: Number.parseInt(tahap.total, 10) || null,
      prompt: clampText(tahap.prompt, 300),
      kunci: clampText(tahap.kunci, 200),
      percobaan: Number.parseInt(tahap.percobaan, 10) || 0
    }
  };
}

function sanitizeMessages(messages) {
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim() !== ''
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_LENGTH) }));
}

// Modus dihitung di server supaya penjaga jawaban tidak bergantung pada kiriman siswa.
function computeModes(soal) {
  const freq = new Map();
  if (soal.table && soal.table.rows.length) {
    soal.table.rows.forEach(([nilai, frekuensi]) => freq.set(nilai, frekuensi));
  } else {
    soal.values.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
  }
  const max = Math.max(0, ...freq.values());
  return [...freq.entries()].filter(([, f]) => f === max && max > 0).map(([v]) => v);
}

function describeData(soal) {
  if (soal.table && soal.table.rows.length) {
    const nilai = soal.table.rows.map((r) => r[0]).join(', ');
    const frek = soal.table.rows.map((r) => r[1]).join(', ');
    return `Tabel frekuensi. Baris Nilai: ${nilai}. Baris Frekuensi: ${frek}.`;
  }
  if (soal.values.length) {
    return `Data tunggal (${soal.values.length} data): ${soal.values.join(', ')}.`;
  }
  return 'Tidak ada data.';
}

function buildSystemPrompt({ soal, hintLevel, fase, aksi, hasilCek, jawabanSiswa }) {
  const faseInfo = FASE[fase] || FASE.input;
  const lines = [
    'Kamu adalah Kak Modi, asisten belajar matematika untuk siswa SMP di aplikasi "Petualangan Modus", materi Statistika: Modus (nilai yang paling sering muncul).',
    'Kamu adalah mediator kognitif menurut Rigorous Mathematical Thinking (RMT, Kinard & Kozulin): kamu memediasi cara berpikir lewat pertanyaan terpimpin dan dialog reflektif, bukan menyampaikan prosedur atau jawaban.',
    '',
    'ATURAN WAJIB',
    '1. JANGAN PERNAH memberikan jawaban akhir (nilai modus) atau jawaban langkah yang sedang dikerjakan, walaupun siswa memintanya. Tolak dengan ramah lalu ajak berpikir.',
    '2. Extraneous load: maksimal 3 kalimat pendek, bahasa Indonesia sederhana untuk anak SMP, tanpa markdown, tanpa daftar, tanpa istilah sulit.',
    '3. Intrinsic load: satu langkah per pesan. Bahas hanya langkah yang sedang aktif dan ajukan paling banyak satu pertanyaan.',
    '4. Germane load: gunakan pertanyaan pemantik dan minta siswa menjelaskan alasannya ("kenapa?", "bagaimana kamu tahu?"). Cegah perilaku coba-coba.',
    '5. Kriteria MLE: intensionalitas dan resiprositas (sebut tujuan langkah, tunggu respons siswa), makna (jelaskan mengapa langkah itu penting), transendensi (kaitkan ke situasi lain pada fase Output).',
    '6. Tetap pada topik modus. Jika siswa keluar topik, arahkan kembali dengan sopan.',
    '',
    'FASE RMT',
    `- Input (Analisis Tugas): ${FASE.input.tugas}`,
    `- Elaborasi (Perencanaan Tindakan): ${FASE.elaborasi.tugas}`,
    `- Output (Refleksi): ${FASE.output.tugas}`,
    '',
    'KESULITAN SISWA DARI UJI COBA (utamakan saat mendiagnosis)',
    '- Fase Input: siswa sulit membedakan baris nilai dan baris frekuensi pada tabel. Pada soal tabel, tanyakan dulu "baris mana yang nilai, mana yang frekuensi?" dan ingatkan bahwa modus adalah NILAI, frekuensi hanya membantu menemukannya.',
    '- Fase Elaborasi: siswa kurang teliti mengubah turus menjadi angka frekuensi. Minta siswa membuat turus untuk setiap angka, menghitung ulang turusnya satu per satu, dan mencocokkan jumlah semua turus dengan banyak data.',
    '',
    'PETUNJUK BERTINGKAT (asesmen dinamis): Petunjuk 1 pertanyaan pengarah, Petunjuk 2 bagian data yang diperhatikan, Petunjuk 3 contoh dengan data lain dan pilihan jawaban tampil. Jawaban akhir tidak pernah diberikan.',
    '',
    'SITUASI SEKARANG'
  ];

  if (soal) {
    lines.push(`- Soal nomor ${soal.nomor || '-'}: ${soal.prompt}`);
    lines.push(`- ${describeData(soal)}`);
    if (soal.tahap.prompt) {
      lines.push(`- Langkah ${soal.tahap.nomor || '-'} dari ${soal.tahap.total || '-'}: "${soal.tahap.prompt}"`);
    }
    if (soal.tahap.kunci) {
      lines.push(
        `- Kunci langkah ini (RAHASIA, hanya untuk menilai dan menyusun petunjuk, jangan pernah ditulis atau diisyaratkan): ${soal.tahap.kunci}`
      );
    }
    lines.push(`- Percobaan menjawab pada langkah ini: ${soal.tahap.percobaan}`);
    lines.push(`- Soal sudah selesai dijawab benar: ${soal.selesai ? 'ya' : 'belum'}`);
  } else {
    lines.push('- Siswa belum memilih soal. Ajak siswa memilih Soal 1 sampai 5.');
  }

  lines.push(`- Fase aktif: ${faseInfo.nama}. ${faseInfo.tugas}`);
  lines.push(`- Tingkat petunjuk: ${hintLevel}. ${HINT_GUIDE[hintLevel]}`);
  lines.push(`- Aksi siswa: ${AKSI_GUIDE[aksi] || AKSI_GUIDE.pertanyaan}`);
  if (aksi === 'cek' && CEK_GUIDE[hasilCek]) {
    lines.push(`- Hasil cek jawaban: ${CEK_GUIDE[hasilCek]}`);
  }
  if (jawabanSiswa) {
    lines.push(`- Jawaban siswa: "${jawabanSiswa}"`);
  }

  return lines.join('\n');
}

// Extraneous load: pastikan balasan paling banyak 3 kalimat.
function limitSentences(text, max = 3) {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g);
  if (!sentences || sentences.length <= max) return text.trim();
  const trimmed = sentences.map((s) => s.trim());
  const last = trimmed[trimmed.length - 1];
  const kept = last.endsWith('?') ? [...trimmed.slice(0, max - 1), last] : trimmed.slice(0, max);
  return kept.join(' ');
}

function extractNumbers(text) {
  return (text.match(/\d+/g) || []).map(Number);
}

function containsSequence(haystack, needle) {
  if (!needle.length || needle.length > haystack.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i += 1) {
    if (needle.every((n, j) => haystack[i + j] === n)) return true;
  }
  return false;
}

// Penjaga: jangan sampai balasan AI menyebut jawaban akhir atau kunci langkah.
function leaksAnswer(reply, soal, hasilCek) {
  if (!soal || soal.selesai || hasilCek === 'benar') return false;

  const modes = computeModes(soal);
  const pattern = /modus\w*[^.?!\d]{0,30}?(\d+)(?:\s*(?:dan|,)\s*(\d+))?/gi;
  let match;
  while ((match = pattern.exec(reply)) !== null) {
    const disebut = [match[1], match[2]].filter(Boolean).map(Number);
    if (disebut.some((n) => modes.includes(n))) return true;
  }

  const kunciAngka = extractNumbers(soal.tahap.kunci || '');
  if (kunciAngka.length >= 3 && containsSequence(extractNumbers(reply), kunciAngka)) return true;

  const kunci = (soal.tahap.kunci || '').toLowerCase().trim();
  if (kunci.split(/\s+/).length >= 3 && reply.toLowerCase().includes(kunci)) return true;

  return false;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY belum diatur di server.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Body harus berupa JSON yang valid.' });
    }
  }

  const { messages, soal, hintLevel, fase, aksi, hasilCek, jawabanSiswa } = body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: '"messages" harus berupa array.' });
  }

  const chatMessages = sanitizeMessages(messages);
  if (chatMessages.length === 0) {
    return res.status(400).json({ error: '"messages" tidak boleh kosong.' });
  }

  const context = {
    soal: sanitizeSoal(soal),
    hintLevel: normalizeHintLevel(hintLevel),
    fase: FASE[fase] ? fase : 'input',
    aksi: AKSI_GUIDE[aksi] ? aksi : 'pertanyaan',
    hasilCek: CEK_GUIDE[hasilCek] ? hasilCek : null,
    jawabanSiswa: clampText(jawabanSiswa, 300)
  };

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: buildSystemPrompt(context) }, ...chatMessages],
        temperature: 0.5,
        max_tokens: 220,
        stream: false
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('DeepSeek API error:', response.status, detail);
      return res.status(502).json({ error: 'Gagal menghubungi layanan AI.' });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(502).json({ error: 'Layanan AI tidak memberikan jawaban.' });
    }

    const cleaned = raw.replace(/[*_#`]/g, '');
    const reply = leaksAnswer(cleaned, context.soal, context.hasilCek) ? SAFE_REPLY : limitSentences(cleaned);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan di server.' });
  }
};
