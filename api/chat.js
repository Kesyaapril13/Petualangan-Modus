// Vercel Serverless Function: POST /api/chat
// Body: { messages: [{role, content}], soal, hintLevel }
// Response: { reply }
// API key dibaca dari environment variable DEEPSEEK_API_KEY (jangan ditulis di kode).

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

const HINT_GUIDE = {
  1: 'Berikan petunjuk ringan saja: ingatkan konsep modus (nilai yang paling sering muncul) atau ajukan pertanyaan pancingan. Jangan sebutkan langkah lengkap atau jawabannya.',
  2: 'Berikan petunjuk sedang: arahkan langkah berikutnya secara konkret (misalnya mengurutkan data atau menghitung frekuensi tiap angka), tetapi jangan sebutkan jawaban akhirnya.',
  3: 'Berikan petunjuk kuat: jelaskan langkah-langkah penyelesaian secara rinci sampai siswa hampir menemukan jawabannya sendiri. Jawaban akhir boleh disebutkan hanya jika siswa sudah mencoba dan masih salah.'
};

function normalizeHintLevel(value) {
  const level = Number.parseInt(value, 10);
  if (Number.isNaN(level)) return 1;
  return Math.min(3, Math.max(1, level));
}

function formatSoal(soal) {
  if (!soal) return 'Tidak ada soal spesifik.';
  if (typeof soal === 'string') return soal.slice(0, MAX_CONTENT_LENGTH);
  try {
    return JSON.stringify(soal).slice(0, MAX_CONTENT_LENGTH * 2);
  } catch {
    return 'Tidak ada soal spesifik.';
  }
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

function buildSystemPrompt(soal, hintLevel) {
  return [
    'Kamu adalah tutor matematika yang ramah untuk game edukasi "Petualangan Modus".',
    'Materi: Statistika - Modus (nilai yang paling sering muncul dalam sekumpulan data).',
    'Selalu jawab dalam Bahasa Indonesia yang sederhana, singkat (maksimal 4 kalimat), dan memotivasi.',
    'Fokus hanya pada materi modus dan soal yang sedang dikerjakan. Jika siswa bertanya di luar topik, arahkan kembali dengan sopan.',
    `Tingkat petunjuk: ${hintLevel}. ${HINT_GUIDE[hintLevel]}`,
    `Soal yang sedang dikerjakan siswa: ${formatSoal(soal)}`
  ].join('\n');
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

  const { messages, soal, hintLevel } = body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: '"messages" harus berupa array.' });
  }

  const chatMessages = sanitizeMessages(messages);
  if (chatMessages.length === 0) {
    return res.status(400).json({ error: '"messages" tidak boleh kosong.' });
  }

  const level = normalizeHintLevel(hintLevel);

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: buildSystemPrompt(soal, level) }, ...chatMessages],
        temperature: 0.7,
        max_tokens: 400,
        stream: false
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('DeepSeek API error:', response.status, detail);
      return res.status(502).json({ error: 'Gagal menghubungi layanan AI.' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'Layanan AI tidak memberikan jawaban.' });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan di server.' });
  }
};
