// Kak Modi - Asisten Belajar AI (materi modus, pendekatan RMT).
// Frontend hanya memanggil /api/chat. API key tersimpan di server (Vercel), tidak di sini.
// Jika /api/chat tidak tersedia, Kak Modi berjalan dalam Mode Cadangan (lihat RMT.md).

(() => {
  const soalList = Array.isArray(window.soalLatihan) ? window.soalLatihan : [];
  const API_URL = '/api/chat';
  const API_TIMEOUT_MS = 20000;
  const RETRY_AFTER_MS = 60000;
  const HISTORY_LIMIT = 12;

  const PHASES = {
    input: {
      label: 'Input',
      activity: 'Analisis Tugas',
      desc: 'Kumpulkan informasi: baca data dengan teliti, apa yang diketahui dan apa yang ditanya.'
    },
    elaborasi: {
      label: 'Elaborasi',
      activity: 'Perencanaan Tindakan',
      desc: 'Olah data: urutkan, buat turus, ubah menjadi frekuensi, lalu bandingkan.'
    },
    output: {
      label: 'Output',
      activity: 'Refleksi',
      desc: 'Nyatakan modus beserta alasannya, periksa ulang, lalu renungkan caramu.'
    }
  };
  const PHASE_ORDER = ['input', 'elaborasi', 'output'];

  const ORIENTATION_STEP = {
    prompt: 'Sebelum menghitung, perhatikan tabelnya. Baris mana yang menunjukkan nilai, dan baris mana yang menunjukkan frekuensi?',
    choices: [
      'Baris atas nilai, baris bawah frekuensi',
      'Baris atas frekuensi, baris bawah nilai',
      'Kedua baris berisi nilai',
      'Kedua baris berisi frekuensi'
    ],
    answer: 'Baris atas nilai, baris bawah frekuensi',
    explanation: 'Baris nilai berisi data yang diamati, sedangkan baris frekuensi menunjukkan berapa kali nilai itu muncul.',
    choicesFirst: true
  };

  const el = {
    picker: document.querySelector('#soal-picker'),
    phaseTrack: document.querySelector('#phase-track'),
    phaseDetail: document.querySelector('#phase-detail'),
    taskLabel: document.querySelector('#task-label'),
    taskPrompt: document.querySelector('#task-prompt'),
    hintMeter: document.querySelector('#hint-meter'),
    dataBox: document.querySelector('#data-box'),
    soalPrompt: document.querySelector('#soal-prompt'),
    soalData: document.querySelector('#soal-data'),
    tallyBox: document.querySelector('#tally-box'),
    tallyBody: document.querySelector('#tally-body'),
    tallyProgress: document.querySelector('#tally-progress'),
    tallyReset: document.querySelector('#tally-reset'),
    chatLog: document.querySelector('#chat-log'),
    choiceBox: document.querySelector('#choice-box'),
    choiceList: document.querySelector('#choice-list'),
    btnBingung: document.querySelector('#btn-bingung'),
    btnHint: document.querySelector('#btn-hint'),
    btnCheck: document.querySelector('#btn-check'),
    btnSend: document.querySelector('#btn-send'),
    form: document.querySelector('#chat-form'),
    input: document.querySelector('#chat-input'),
    formNote: document.querySelector('#form-note'),
    modeBadge: document.querySelector('#mode-badge')
  };

  if (!el.picker || soalList.length === 0) return;

  const state = {
    soalIndex: null,
    soal: null,
    steps: [],
    stepIndex: 0,
    hintLevel: 0,
    attempts: 0,
    // step: menjawab langkah | reason: menunggu alasan | refleksi | transendensi | selesai
    mode: 'idle',
    messages: [],
    busy: false,
    aiRetryAt: 0,
    tally: new Map(),
    tallyOrder: []
  };

  const playerName = (() => {
    try {
      return localStorage.getItem('petualanganModusPlayer') || '';
    } catch {
      return '';
    }
  })();

  // ---------- Pemilih soal ----------
  soalList.forEach((soal, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'soal-option';
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span class="soal-option-number">Soal ${index + 1}</span><span class="soal-option-type">${soal.table ? 'Tabel' : 'Data tunggal'}</span>`;
    button.addEventListener('click', () => startSoal(index));
    el.picker.append(button);
  });

  // ---------- Alur RMT ----------
  function startSoal(index) {
    if (state.busy) return;
    const soal = soalList[index];
    state.soalIndex = index;
    state.soal = soal;
    state.steps = soal.table ? [ORIENTATION_STEP, ...soal.stages] : [...soal.stages];
    state.stepIndex = 0;
    state.messages = [];
    state.tally = new Map();
    state.tallyOrder = [];

    [...el.picker.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    el.chatLog.replaceChildren();
    renderSoalData();

    const sapaan = playerName ? `Halo, ${playerName}! ` : 'Halo! ';
    addBubble(
      'assistant',
      `${sapaan}Aku Kak Modi. Tujuan kita: menemukan modus dari data Soal ${index + 1}, selangkah demi selangkah. Baca datanya pelan-pelan dulu, ya.`
    );
    askStep();
  }

  function currentStep() {
    return state.steps[state.stepIndex];
  }

  function phaseOfStep(index) {
    if (index === 0) return 'input';
    if (index === state.steps.length - 1) return 'output';
    return 'elaborasi';
  }

  function currentPhase() {
    if (['refleksi', 'transendensi', 'selesai'].includes(state.mode)) return 'output';
    return phaseOfStep(state.stepIndex);
  }

  function askStep() {
    const step = currentStep();
    state.mode = 'step';
    state.hintLevel = 0;
    state.attempts = 0;
    addBubble('assistant', `Langkah ${state.stepIndex + 1}: ${step.prompt}`, { label: phaseLabel() });
    updateUi();
  }

  function advance() {
    state.stepIndex += 1;
    if (state.stepIndex < state.steps.length) {
      askStep();
      return;
    }
    state.stepIndex = state.steps.length - 1;
    state.mode = 'refleksi';
    addBubble(
      'assistant',
      'Hebat, semua langkah sudah kamu selesaikan! Sekarang kita refleksi sebentar. Langkah apa saja yang tadi kamu lakukan untuk menemukan modus?',
      { label: phaseLabel() }
    );
    updateUi();
  }

  function transcendenceQuestion() {
    const multiMode = computeModes(state.soal).length > 1;
    return multiMode
      ? 'Sekarang coba di kehidupan sehari-hari. Kalau kamu ingin tahu warna baju yang paling banyak dipakai teman sekelas hari ini, bagaimana cara mencari modusnya?'
      : 'Sekarang bayangkan kasus lain. Kantin mencatat jajanan yang dibeli: bakso, mi, bakso, roti, mi. Apa modusnya, dan kenapa?';
  }

  // ---------- Aksi siswa ----------
  async function handleCheck(answerText, fromChoice = false) {
    if (state.busy || state.mode !== 'step') return;
    const text = answerText.trim();
    if (!text) {
      setNote('Tulis jawabanmu dulu di kotak pesan, lalu tekan Cek jawabanku.');
      el.input.focus();
      return;
    }

    const step = currentStep();
    addBubble('user', fromChoice ? `Aku pilih: ${text}` : `Jawabanku: ${text}`);
    clearInput();
    state.attempts += 1;

    const verdict = fromChoice ? (text === step.answer ? 'benar' : 'salah') : evaluateAnswer(text, step);

    if (verdict === 'benar') {
      hideChoices();
      if (hasReason(text)) {
        await respond('cek', { hasilCek: 'benar', jawabanSiswa: text });
        advance();
      } else {
        state.mode = 'reason';
        addBubble('assistant', 'Tepat! Sekarang jelaskan alasanmu dengan kata-katamu sendiri: kenapa kamu yakin dengan jawaban itu?');
        updateUi();
      }
      return;
    }

    await respond('cek', { hasilCek: verdict, jawabanSiswa: text });
  }

  async function handleSend(messageText) {
    if (state.busy || state.mode === 'idle' || state.mode === 'selesai') return;
    const text = messageText.trim();
    if (!text) {
      el.input.focus();
      return;
    }
    addBubble('user', text);
    clearInput();

    if (state.mode === 'reason') {
      await respond('alasan', { jawabanSiswa: text });
      advance();
    } else if (state.mode === 'refleksi') {
      await respond('refleksi', { jawabanSiswa: text });
      state.mode = 'transendensi';
      addBubble('assistant', transcendenceQuestion(), { label: 'Output · Transendensi' });
      updateUi();
    } else if (state.mode === 'transendensi') {
      await respond('transendensi', { jawabanSiswa: text });
      finishSoal();
    } else {
      await respond('pertanyaan', { jawabanSiswa: text });
    }
  }

  async function handleConfused() {
    if (state.busy || state.mode === 'idle' || state.mode === 'selesai') return;
    addBubble('user', 'Aku bingung.');
    await respond('bingung');
  }

  async function handleHint() {
    if (state.busy || state.mode !== 'step' || state.hintLevel >= 3) return;
    state.hintLevel += 1;
    addBubble('user', `Kak, beri petunjuk ${state.hintLevel}, ya.`);
    updateUi();
    await respond('petunjuk');
    if (state.hintLevel >= 3) showChoices();
  }

  function finishSoal() {
    state.mode = 'selesai';
    const next = state.soalIndex + 1 < soalList.length ? state.soalIndex + 1 : null;
    addBubble(
      'assistant',
      `Misi Soal ${state.soalIndex + 1} selesai! Kamu sudah melewati Input, Elaborasi, dan Output dengan berpikir sendiri.${next !== null ? ` Lanjut ke Soal ${next + 1}?` : ' Pilih soal lain untuk berlatih lagi, ya.'}`,
      { label: 'Misi selesai' }
    );
    if (next !== null) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bubble-action';
      button.textContent = `Mulai Soal ${next + 1} →`;
      button.addEventListener('click', () => startSoal(next));
      el.chatLog.lastElementChild.querySelector('.bubble').append(button);
    }
    updateUi();
  }

  // ---------- Komunikasi dengan /api/chat ----------
  async function respond(aksi, extra = {}) {
    setBusy(true);
    const typing = addTyping();
    let reply = null;

    if (Date.now() >= state.aiRetryAt) {
      try {
        reply = await callApi(aksi, extra);
        setAiMode(true);
      } catch (error) {
        console.warn('Kak Modi beralih ke mode cadangan:', error.message);
        state.aiRetryAt = Date.now() + RETRY_AFTER_MS;
        setAiMode(false);
      }
    }

    if (!reply) reply = fallbackReply(aksi, extra);
    typing.remove();
    addBubble('assistant', reply);
    setBusy(false);
  }

  async function callApi(aksi, extra) {
    const step = currentStep();
    const payload = {
      messages: state.messages.slice(-HISTORY_LIMIT),
      soal: {
        nomor: state.soalIndex + 1,
        prompt: state.soal.prompt,
        values: state.soal.values || null,
        table: state.soal.table || null,
        selesai: ['refleksi', 'transendensi', 'selesai'].includes(state.mode),
        tahap: {
          nomor: state.stepIndex + 1,
          total: state.steps.length,
          prompt: step.prompt,
          kunci: step.answer,
          percobaan: state.attempts
        }
      },
      hintLevel: state.hintLevel,
      fase: currentPhase(),
      aksi,
      hasilCek: extra.hasilCek || null,
      jawabanSiswa: extra.jawabanSiswa || ''
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Balasan kosong');
      return data.reply.trim();
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- Mode Cadangan (tanpa AI) ----------
  function stepCategory(step) {
    const p = step.prompt.toLowerCase();
    if (step === ORIENTATION_STEP) return 'orientasi';
    if (p.includes('urutkan')) return 'urut';
    if (p.includes('selisih')) return 'selisih';
    if (p.includes('jumlah seluruh frekuensi')) return 'jumlah';
    if (p.includes('tabel frekuensi')) return 'tabel';
    if (p.includes('berapa kali') || p.includes('frekuensi untuk')) return 'frekuensi';
    if (p.includes('bandingkan') || p.includes('dibandingkan') || p.includes('frekuensi terbesar')) return 'banding';
    if (p.includes('informasi') || p.includes('perlu dicari')) return 'input';
    return 'modus';
  }

  const HINTS = {
    orientasi: [
      'Lihat tulisan di awal setiap baris tabel. Apa yang tertulis di sana?',
      'Baris yang berisi data yang diamati disebut nilai, baris yang berisi "berapa kali" disebut frekuensi.',
      'Contoh: pada tabel ukuran sepatu, baris Nilai berisi 36, 37, 38 dan baris Frekuensi berisi banyak anak. Sekarang pilih jawaban yang tepat di bawah.'
    ],
    urut: [
      'Angka berapa yang paling kecil pada data? Mulailah dari angka itu.',
      () => `Tulis angka dari terkecil, dan coret angka yang sudah kamu pakai. Pastikan jumlahnya tetap ${dataCount()} angka.`,
      'Contoh: data 5, 2, 5, 1 diurutkan menjadi 1, 2, 5, 5. Sekarang pilih urutan yang tepat di bawah.'
    ],
    frekuensi: [
      'Bagaimana cara kita menghitung berapa kali sebuah angka muncul dengan teliti?',
      () =>
        state.soal.table
          ? 'Cari nilainya di baris Nilai, lalu lihat angka tepat di bawahnya pada baris Frekuensi.'
          : 'Ketuk setiap kartu angka yang ditanyakan untuk memberi turus, lalu hitung ulang turusnya satu per satu.',
      'Contoh: pada data 1, 4, 4, 2, 4 angka 4 mendapat turus |||, jadi frekuensinya 3. Sekarang pilih jawaban yang tepat di bawah.'
    ],
    tabel: [
      'Untuk setiap nilai, berapa turus yang kamu dapat?',
      'Buat turus untuk nilai 2, 3, 4, dan 5 dengan mengetuk kartu angka, lalu ubah setiap turus menjadi angka.',
      'Contoh: data 1, 2, 1, 1 menjadi 1: 3 kali dan 2: 1 kali. Sekarang pilih tabel yang tepat di bawah.'
    ],
    jumlah: [
      'Apa arti angka-angka pada frekuensi?',
      'Jumlahkan semua frekuensi, lalu bandingkan dengan banyaknya kartu data.',
      'Contoh: frekuensi 3 dan 1 jika dijumlahkan menjadi 4. Sekarang pilih jawaban yang tepat di bawah.'
    ],
    selisih: [
      'Selisih dua bilangan dicari dengan operasi apa?',
      'Hitung dulu frekuensi masing-masing angka dengan turus, lalu kurangkan yang besar dengan yang kecil.',
      'Contoh: angka 5 muncul 4 kali dan angka 6 muncul 1 kali, selisihnya 4 − 1 = 3. Sekarang pilih jawaban yang tepat di bawah.'
    ],
    banding: [
      'Kalau ingin tahu mana yang paling sering, apa yang perlu kita bandingkan?',
      'Tulis frekuensi setiap nilai berderet, lalu cari yang paling besar.',
      'Contoh: frekuensi 2, 5, dan 1, yang terbesar adalah 5. Sekarang pilih jawaban yang tepat di bawah.'
    ],
    input: [
      'Coba baca lagi kalimat soalnya. Data ini menceritakan tentang apa?',
      'Perhatikan kata-kata pada kalimat soal di atas kartu data.',
      'Contoh: data "jumlah pensil teman-teman" menceritakan banyak pensil. Sekarang pilih jawaban yang tepat di bawah.'
    ],
    modus: [
      'Apa arti modus? Nilai seperti apa yang kita cari?',
      'Cari frekuensi yang paling besar. Ingat, yang ditulis sebagai modus adalah nilainya, bukan frekuensinya.',
      'Contoh: data 1, 2, 2, 3 modusnya 2 karena 2 muncul 2 kali, paling sering. Sekarang pilih jawaban yang tepat di bawah.'
    ]
  };

  function hintText(step, level) {
    const hint = HINTS[stepCategory(step)][level - 1];
    return typeof hint === 'function' ? hint() : hint;
  }

  function fallbackReply(aksi, extra) {
    const step = currentStep();
    const phase = currentPhase();

    if (aksi === 'petunjuk') return `Petunjuk ${state.hintLevel}: ${hintText(step, state.hintLevel)}`;

    if (aksi === 'bingung') {
      if (state.mode === 'reason') return 'Tidak apa-apa. Ceritakan saja bagian data mana yang kamu lihat sampai yakin dengan jawabanmu.';
      if (state.mode === 'refleksi') return 'Tidak apa-apa. Coba ingat: apa yang kamu lakukan pertama kali, lalu apa yang kamu lakukan sesudahnya?';
      if (state.mode === 'transendensi') return 'Tidak apa-apa. Ingat, modus adalah yang paling sering muncul. Coba hitung dulu berapa kali setiap pilihan muncul.';
      if (phase === 'input') {
        return state.soal.table
          ? 'Tidak apa-apa, kita pelan-pelan. Lihat tabelnya dulu: baris mana yang berisi nilai, dan baris mana yang berisi frekuensi?'
          : `Tidak apa-apa, kita pelan-pelan. Baca datanya satu per satu: ada ${dataCount()} angka. Angka apa saja yang kamu lihat?`;
      }
      if (phase === 'elaborasi') {
        return state.soal.table
          ? 'Tidak apa-apa. Baris Nilai berisi datanya, baris Frekuensi berisi berapa kali nilai itu muncul. Angka yang ditanyakan ada di baris yang mana?'
          : 'Tidak apa-apa. Ketuk setiap kartu angka untuk membuat turus, lalu hitung ulang turusnya satu per satu. Berapa turus yang kamu dapat?';
      }
      return 'Tidak apa-apa. Ingat, modus adalah nilai yang paling sering muncul. Nilai mana yang frekuensinya paling besar?';
    }

    if (aksi === 'cek') {
      if (extra.hasilCek === 'benar') return `Tepat, alasanmu juga jelas! ${step.explanation}`;
      if (extra.hasilCek === 'belum_jelas') {
        if (step.choicesFirst) return 'Pilih salah satu pilihan jawaban di bawah, ya.';
        return 'Kak Modi belum yakin maksud jawabanmu. Coba tulis lebih lengkap dengan angkanya, ya.';
      }
      return diagnoseWrong(extra.jawabanSiswa || '', step);
    }

    if (aksi === 'alasan') return `Terima kasih alasannya! ${step.explanation} Menjelaskan alasan membuat kita yakin, bukan menebak.`;
    if (aksi === 'refleksi') {
      return 'Bagus, kamu sudah bisa menceritakan caramu! Langkah pentingnya: membaca data dengan teliti, menghitung turus dengan cermat, membandingkan frekuensi, lalu menulis nilainya sebagai modus.';
    }
    if (aksi === 'transendensi') {
      return 'Hebat! Modus bisa dipakai untuk mencari yang paling banyak dipilih, misalnya jajanan favorit di kantin. Ingat juga, kalau ada dua nilai yang sama-sama paling sering muncul, datanya punya dua modus.';
    }

    if (/jawab|kasih tahu|beri tahu|berapa modus/i.test(extra.jawabanSiswa || '')) {
      return `Kak Modi tidak memberi jawabannya langsung, ya. Ayo kita cari bersama: ${hintText(step, 1)}`;
    }
    return 'Kak Modi sedang dalam mode cadangan, jadi belum bisa ngobrol bebas. Tulis jawabanmu lalu tekan Cek jawabanku, atau pakai tombol Aku bingung dan Beri petunjuk.';
  }

  // Diagnosis berdasarkan kesulitan dari uji coba (RMT.md).
  function diagnoseWrong(answer, step) {
    const numbers = extractNumbers(answer);
    const prompt = step.prompt.toLowerCase();
    const table = state.soal.table;

    if (table && numbers.length) {
      const nilaiRow = table.rows.map((r) => r[0]);
      const frekRow = table.rows.map((r) => r[1]);
      const asksFrequency = prompt.includes('frekuensi') && !prompt.includes('nilai berapa') && !prompt.includes('modus');
      const n = numbers[0];
      if (asksFrequency && nilaiRow.includes(n) && !frekRow.includes(n)) {
        return `Hati-hati, ${n} ada di baris Nilai. Yang ditanyakan adalah frekuensi, jadi baris mana yang harus kamu lihat?`;
      }
      if (!asksFrequency && frekRow.includes(n) && !nilaiRow.includes(n)) {
        return `Hati-hati, ${n} ada di baris Frekuensi. Modus adalah nilai, jadi nilai berapa yang berada di atas frekuensi terbesar?`;
      }
      if (!asksFrequency && frekRow.includes(n)) {
        return 'Belum tepat. Apakah angka itu kamu ambil dari baris Nilai atau baris Frekuensi? Ingat, modus adalah nilai.';
      }
    }

    const category = stepCategory(step);
    if (!table && ['frekuensi', 'tabel', 'selisih', 'jumlah', 'banding'].includes(category)) {
      return 'Belum tepat, tapi kamu hampir sampai. Coba buat turus lagi dengan mengetuk kartu angka, lalu hitung ulang turusnya satu per satu. Apakah jumlahnya sudah sama?';
    }
    if (category === 'urut') {
      return `Belum tepat. Periksa lagi: apakah semua ${dataCount()} angka sudah tertulis dan tidak ada yang terlewat?`;
    }
    if (category === 'orientasi') {
      return 'Belum tepat. Baca lagi tulisan di awal setiap baris tabel. Baris mana yang berisi "berapa kali"?';
    }
    return 'Belum tepat, tidak apa-apa. Coba periksa lagi datanya pelan-pelan. Nilai mana yang paling sering muncul, dan bagaimana kamu tahu?';
  }

  // ---------- Pengecek jawaban teks ----------
  const STOPWORDS = new Set([
    'yang', 'di', 'ke', 'dari', 'dan', 'atau', 'itu', 'ini', 'adalah', 'ialah', 'yaitu', 'jadi', 'karena', 'sebab',
    'kali', 'aku', 'saya', 'menurutku', 'menurut', 'jawabanku', 'jawaban', 'dengan', 'pada', 'untuk', 'kak', 'ya',
    'deh', 'dong', 'sih', 'tersebut'
  ]);
  const SYNONYMS = {
    banyak: 'sering', terbanyak: 'sering', tersering: 'sering', sering: 'sering',
    terbesar: 'besar', angka: 'nilai', bilangan: 'nilai'
  };

  function extractNumbers(text) {
    return (String(text).match(/\d+/g) || []).map(Number);
  }

  function tokens(text) {
    const words = String(text)
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w.length > 5 && w.endsWith('nya') ? w.slice(0, -3) : w))
      .map((w) => SYNONYMS[w] || w)
      .filter((w) => !STOPWORDS.has(w));
    return words;
  }

  function subsequenceStart(haystack, needle) {
    if (!needle.length) return -1;
    let start = -1;
    let j = 0;
    for (let i = 0; i < haystack.length && j < needle.length; i += 1) {
      if (haystack[i] === needle[j]) {
        if (j === 0) start = i;
        j += 1;
      }
    }
    return j === needle.length ? start : -1;
  }

  function removeOnce(list, toRemove) {
    const result = [...list];
    toRemove.forEach((n) => {
      const i = result.indexOf(n);
      if (i >= 0) result.splice(i, 1);
    });
    return result;
  }

  function verdictFromGroup(group, answer) {
    if (group.length === 1) return group[0] === answer ? 'benar' : 'salah';
    return group.includes(answer) ? 'belum_jelas' : 'salah';
  }

  function evaluateAnswer(text, step) {
    const exact = step.choices.find((c) => c.toLowerCase() === text.toLowerCase());
    if (exact) return exact === step.answer ? 'benar' : 'salah';

    const answerNumbers = extractNumbers(step.answer);

    if (answerNumbers.length) {
      // Hasil akhir biasanya ditulis setelah "=" atau "jadi" (misal 3 - 2 = 1).
      const lastMarker = Math.max(text.lastIndexOf('='), text.toLowerCase().lastIndexOf('jadi'));
      const focus = lastMarker >= 0 ? text.slice(lastMarker) : text;
      let raw = extractNumbers(focus);
      if (!raw.length) raw = extractNumbers(text);

      const numericChoices = step.choices.filter((c) => extractNumbers(c).length);
      const promptNumbers = extractNumbers(step.prompt);
      const promptIsPartOfAnswer = numericChoices.every((c) => promptNumbers.every((n) => extractNumbers(c).includes(n)));
      const stripped = promptIsPartOfAnswer ? raw : removeOnce(raw, promptNumbers);

      const attempts = stripped.length && stripped.length !== raw.length ? [stripped, raw] : [raw];
      for (const nums of attempts) {
        if (!nums.length) continue;
        const candidates = numericChoices
          .map((c) => ({ c, pos: subsequenceStart(nums, extractNumbers(c)), len: extractNumbers(c).length }))
          .filter((x) => x.pos >= 0)
          .sort((a, b) => a.pos - b.pos || b.len - a.len);
        if (candidates.length) {
          const best = candidates[0];
          const group = candidates.filter((x) => x.pos === best.pos && x.len === best.len).map((x) => x.c);
          return verdictFromGroup(group, step.answer);
        }
      }

      const textVerdict = evaluateByWords(text, step);
      if (textVerdict) return textVerdict;
      // Ada angka tetapi tidak cocok dengan pilihan mana pun.
      if (raw.length >= answerNumbers.length) return 'salah';
      return 'belum_jelas';
    }

    return evaluateByWords(text, step) || 'belum_jelas';
  }

  function evaluateByWords(text, step) {
    const studentTokens = tokens(text);
    if (!studentTokens.length) return null;
    const scored = step.choices
      .map((c) => {
        const choiceTokens = [...new Set(tokens(c))];
        const matched = choiceTokens.filter((t) => studentTokens.includes(t));
        const firstPos = matched.length ? Math.min(...matched.map((t) => studentTokens.indexOf(t))) : Infinity;
        return { c, matched: matched.length, score: choiceTokens.length ? matched.length / choiceTokens.length : 0, firstPos };
      })
      .filter((x) => x.matched > 0 && (x.score >= 0.5 || x.matched >= 2))
      .sort((a, b) => b.score - a.score || a.firstPos - b.firstPos);
    if (!scored.length) return null;
    const best = scored[0];
    const group = scored.filter((x) => x.score === best.score && x.firstPos === best.firstPos).map((x) => x.c);
    return verdictFromGroup(group, step.answer);
  }

  function hasReason(text) {
    return /\b(karena|sebab|soalnya|alasannya|alasan)\b/i.test(text);
  }

  function computeModes(soal) {
    const freq = new Map();
    if (soal.table) soal.table.rows.forEach(([nilai, f]) => freq.set(nilai, f));
    else soal.values.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
    const max = Math.max(...freq.values());
    return [...freq.entries()].filter(([, f]) => f === max).map(([v]) => v);
  }

  function dataCount() {
    return state.soal.values ? state.soal.values.length : state.soal.table.rows.length;
  }

  // ---------- Tampilan ----------
  function renderSoalData() {
    const soal = state.soal;
    el.dataBox.hidden = false;
    el.soalPrompt.textContent = soal.prompt;
    el.soalData.replaceChildren();

    if (soal.table) {
      el.tallyBox.hidden = true;
      const wrap = document.createElement('div');
      wrap.className = 'freq-table-wrap';
      const table = document.createElement('table');
      table.className = 'freq-table';
      const caption = document.createElement('caption');
      caption.textContent = soal.table.caption;
      const body = document.createElement('tbody');
      soal.table.headers.forEach((header, col) => {
        const row = document.createElement('tr');
        row.className = col === 0 ? 'row-nilai' : 'row-frekuensi';
        const th = document.createElement('th');
        th.scope = 'row';
        th.innerHTML = `${header}<small>${col === 0 ? 'data yang diamati' : 'berapa kali muncul'}</small>`;
        row.append(th);
        soal.table.rows.forEach((r) => {
          const td = document.createElement('td');
          td.textContent = r[col];
          row.append(td);
        });
        body.append(row);
      });
      table.append(caption, body);
      wrap.append(table);
      el.soalData.append(wrap);
      return;
    }

    const count = document.createElement('p');
    count.className = 'data-count';
    count.textContent = `${soal.values.length} data · ketuk kartu untuk memberi turus`;
    const chips = document.createElement('div');
    chips.className = 'data-cards';
    soal.values.forEach((value) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'data-card';
      chip.textContent = value;
      chip.setAttribute('aria-pressed', 'false');
      chip.setAttribute('aria-label', `Angka ${value}, ketuk untuk memberi turus`);
      chip.addEventListener('click', () => toggleTally(chip, value));
      chips.append(chip);
    });
    el.soalData.append(chips, count);
    el.tallyBox.hidden = false;
    renderTally();
  }

  function toggleTally(chip, value) {
    const marked = chip.getAttribute('aria-pressed') === 'true';
    chip.setAttribute('aria-pressed', String(!marked));
    const current = state.tally.get(value) || 0;
    const next = marked ? current - 1 : current + 1;
    if (next <= 0) {
      state.tally.delete(value);
      state.tallyOrder = state.tallyOrder.filter((v) => v !== value);
    } else {
      if (!state.tally.has(value)) state.tallyOrder.push(value);
      state.tally.set(value, next);
    }
    renderTally();
  }

  function renderTally() {
    el.tallyBody.replaceChildren();
    if (!state.tallyOrder.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="2" class="tally-empty">Belum ada turus.</td>';
      el.tallyBody.append(row);
    }
    state.tallyOrder.forEach((value) => {
      const row = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = value;
      const td = document.createElement('td');
      const marks = document.createElement('span');
      marks.className = 'tally-marks';
      const count = state.tally.get(value);
      for (let i = 0; i < count; i += 1) {
        const bar = document.createElement('i');
        if (i > 0 && i % 5 === 0) bar.className = 'group-start';
        marks.append(bar);
      }
      marks.setAttribute('aria-label', `${count} turus`);
      td.append(marks);
      row.append(th, td);
      el.tallyBody.append(row);
    });
    const total = [...state.tally.values()].reduce((a, b) => a + b, 0);
    el.tallyProgress.textContent = `Kartu yang sudah diberi turus: ${total} dari ${dataCount()}`;
  }

  el.tallyReset.addEventListener('click', () => {
    state.tally = new Map();
    state.tallyOrder = [];
    el.soalData.querySelectorAll('.data-card').forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
    renderTally();
  });

  function phaseLabel() {
    const phase = PHASES[currentPhase()];
    const sub = { refleksi: 'Refleksi', transendensi: 'Transendensi' }[state.mode] || phase.activity;
    return `${phase.label} · ${sub}`;
  }

  function addBubble(role, text, options = {}) {
    el.chatLog.querySelector('.chat-empty')?.remove();
    const row = document.createElement('div');
    row.className = `chat-row ${role === 'assistant' ? 'from-modi' : 'from-siswa'}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (options.label) {
      const label = document.createElement('span');
      label.className = 'bubble-label';
      label.textContent = options.label;
      bubble.append(label);
    }
    const p = document.createElement('p');
    p.textContent = text;
    bubble.append(p);
    row.append(bubble);
    el.chatLog.append(row);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
    state.messages.push({ role, content: text });
    return row;
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'chat-row from-modi';
    row.innerHTML = '<div class="bubble typing" aria-label="Kak Modi sedang mengetik"><i></i><i></i><i></i></div>';
    el.chatLog.append(row);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
    return row;
  }

  function showChoices() {
    const step = currentStep();
    el.choiceList.replaceChildren();
    step.choices.forEach((choice, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-option';
      button.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + i)}</span><span></span>`;
      button.lastElementChild.textContent = choice;
      button.addEventListener('click', () => handleCheck(choice, true));
      el.choiceList.append(button);
    });
    el.choiceBox.hidden = false;
  }

  function hideChoices() {
    el.choiceBox.hidden = true;
    el.choiceList.replaceChildren();
  }

  function updateUi() {
    const active = state.mode === 'idle' ? null : currentPhase();
    const activeIndex = PHASE_ORDER.indexOf(active);
    [...el.phaseTrack.children].forEach((li, i) => {
      li.classList.toggle('is-active', i === activeIndex);
      li.classList.toggle('is-done', i < activeIndex || state.mode === 'selesai');
      if (i === activeIndex) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });

    if (active) {
      const phase = PHASES[active];
      el.phaseDetail.innerHTML = '';
      const strong = document.createElement('strong');
      strong.textContent = phaseLabel();
      el.phaseDetail.append(strong, document.createTextNode(` — ${phase.desc}`));
    }

    const step = currentStep();
    const labels = {
      step: `Langkah ${state.stepIndex + 1} dari ${state.steps.length}`,
      reason: 'Jelaskan alasanmu',
      refleksi: 'Refleksi',
      transendensi: 'Transendensi',
      selesai: 'Misi selesai'
    };
    const prompts = {
      step: step?.prompt,
      reason: 'Kenapa kamu yakin dengan jawabanmu? Tulis alasanmu lalu tekan Kirim.',
      refleksi: 'Ceritakan langkah-langkah yang kamu pakai untuk menemukan modus.',
      transendensi: 'Pakai konsep modus pada situasi lain.',
      selesai: 'Hebat! Pilih soal lain untuk berlatih lagi.'
    };
    el.taskLabel.textContent = labels[state.mode] || 'Belum ada soal';
    el.taskPrompt.textContent = prompts[state.mode] || 'Pilih Soal 1 sampai 5 di atas.';

    const usedHints = state.mode === 'step' ? state.hintLevel : 0;
    [...el.hintMeter.querySelectorAll('i')].forEach((dot, i) => dot.classList.toggle('is-used', i < usedHints));
    el.hintMeter.setAttribute('aria-label', `Petunjuk dipakai ${usedHints} dari 3`);

    if (state.mode === 'step' && step.choicesFirst) showChoices();
    else if (state.mode !== 'step' || state.hintLevel < 3) hideChoices();

    const placeholders = {
      step: 'Tulis jawabanmu di sini…',
      reason: 'Tulis alasanmu di sini…',
      refleksi: 'Ceritakan langkah-langkahmu…',
      transendensi: 'Tulis jawabanmu di sini…',
      selesai: 'Pilih soal lain untuk mulai lagi.'
    };
    el.input.placeholder = placeholders[state.mode] || 'Pilih soal dulu…';

    const notes = {
      step: 'Tulis jawabanmu lalu tekan <strong>Cek jawabanku</strong> atau Enter. Untuk bertanya, tekan <strong>Kirim</strong>.',
      reason: 'Tulis alasanmu lalu tekan <strong>Kirim</strong>.',
      refleksi: 'Tulis ceritamu lalu tekan <strong>Kirim</strong>.',
      transendensi: 'Tulis jawabanmu lalu tekan <strong>Kirim</strong>.',
      selesai: 'Misi selesai. Pilih soal lain di atas.'
    };
    el.formNote.innerHTML = notes[state.mode] || '';
    refreshButtons();
  }

  function refreshButtons() {
    const open = !['idle', 'selesai'].includes(state.mode);
    el.input.disabled = !open;
    el.btnSend.disabled = state.busy || !open;
    el.btnBingung.disabled = state.busy || !open;
    el.btnCheck.disabled = state.busy || state.mode !== 'step';
    el.btnHint.disabled = state.busy || state.mode !== 'step' || state.hintLevel >= 3;
    el.btnHint.lastChild.textContent = state.mode === 'step' && state.hintLevel >= 3 ? ' Petunjuk habis' : ' Beri petunjuk';
    el.choiceList.querySelectorAll('button').forEach((b) => (b.disabled = state.busy));
    [...el.picker.children].forEach((b) => (b.disabled = state.busy));
  }

  function setBusy(busy) {
    state.busy = busy;
    refreshButtons();
  }

  function setAiMode(online) {
    el.modeBadge.textContent = online ? 'Mode AI' : 'Mode cadangan';
    el.modeBadge.classList.toggle('is-offline', !online);
    el.modeBadge.title = online
      ? 'Kak Modi terhubung dengan AI'
      : 'AI belum tersedia. Kak Modi memakai petunjuk bawaan dan akan mencoba lagi nanti.';
  }

  function setNote(text) {
    el.formNote.textContent = text;
  }

  function clearInput() {
    el.input.value = '';
  }

  // ---------- Event ----------
  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSend(el.input.value);
  });
  el.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (state.mode === 'step') handleCheck(el.input.value);
      else handleSend(el.input.value);
    }
  });
  el.btnCheck.addEventListener('click', () => handleCheck(el.input.value));
  el.btnBingung.addEventListener('click', handleConfused);
  el.btnHint.addEventListener('click', handleHint);
})();
