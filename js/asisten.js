// Asisten Belajar AI (Kak Modi) — frontend.
// Frontend TIDAK menyimpan API Key. Permintaan AI dikirim ke backend /api/chat (DeepSeek).
// Jika backend tidak tersedia (belum deploy / saldo DeepSeek habis), Kak Modi otomatis
// beralih ke MODE CADANGAN: bimbingan bertahap RMT berbasis tahapan soal di js/soal.js.
(function () {
  const soalList = window.soalLatihan || [];
  const tabs = document.getElementById('soal-tabs');
  const soalBox = document.getElementById('soal-box');
  const log = document.getElementById('chat-log');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const track = document.getElementById('rmt-track');
  const modeBadge = document.getElementById('mode-badge');

  let current = 0;
  let messages = [];
  let hintLevel = 0;
  let busy = false;
  let offline = false; // true = mode cadangan
  let st = null; // status mode cadangan

  /* ---------- tampilan ---------- */
  function soalText(s) {
    let data = '';
    if (s.values) data = 'Data: ' + s.values.join(', ');
    if (s.table) data = s.table.headers.join(' | ') + '\n' + s.table.rows.map((r) => r.join(' | ')).join('\n');
    return `${s.prompt}\n${data}\nPertanyaan akhir: ${s.stages[s.stages.length - 1].prompt}`;
  }

  function renderSoal() {
    const s = soalList[current];
    let html = `<p class="ai-soal-label">SOAL ${current + 1}</p><p class="ai-soal-text">${s.prompt}</p>`;
    if (s.values) html += '<div class="chips">' + s.values.map((v) => `<span>${v}</span>`).join('') + '</div>';
    if (s.table) {
      html += '<table class="ai-table"><tr>' + s.table.headers.map((h) => `<th>${h}</th>`).join('') + '</tr>' +
        s.table.rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</table>';
    }
    html += `<p class="ai-soal-ask">❓ ${s.stages[s.stages.length - 1].prompt}</p>`;
    soalBox.innerHTML = html;
    [...tabs.children].forEach((b, i) => b.setAttribute('aria-selected', i === current));
  }

  function setStage(n) {
    [...track.children].forEach((li) => {
      const step = Number(li.dataset.step);
      li.classList.toggle('done', step < n);
      li.classList.toggle('active', step === n);
    });
  }

  function setMode(isOffline, model) {
    offline = isOffline;
    if (!modeBadge) return;
    const nama = model ? model.split('/').pop().replace(':free', '') : '';
    modeBadge.textContent = isOffline
      ? 'Mode cadangan (tanpa AI)'
      : (model && !/deepseek/i.test(model) ? `Terhubung ke AI (${nama})` : 'Terhubung ke DeepSeek AI');
    modeBadge.classList.toggle('offline', isOffline);
  }

  function escapeHtml(t) {
    return t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function addBubble(role, text) {
    const div = document.createElement('div');
    div.className = 'bubble ' + (role === 'user' ? 'me' : 'bot');
    let clean = text;
    const m = text.match(/^\s*\[(?:FASE|TAHAP)\s*(\d)\]\s*/i);
    if (m) {
      setStage(Number(m[1]));
      clean = text.slice(m[0].length);
      div.innerHTML = `<span class="stage-tag">Fase ${m[1]}</span>`;
    }
    div.innerHTML += escapeHtml(clean).replace(/\n/g, '<br>');
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function addChoices(choices) {
    const wrap = document.createElement('div');
    wrap.className = 'choice-row';
    choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice-btn';
      b.textContent = `${'ABCD'[i]}. ${c}`;
      b.addEventListener('click', () => { wrap.remove(); send(c); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  function bot(text) {
    addBubble('assistant', text);
    messages.push({ role: 'assistant', content: text });
  }

  /* ---------- MODE CADANGAN: bimbingan RMT berbasis tahapan soal ---------- */
  // Fase RMT tiap tahap: tahap pertama = Fase 1, tahap akhir = Fase 3, sisanya = Fase 2.
  function faseOf(j, n) {
    if (j === 0) return 1;
    if (j === n - 1 || (n >= 5 && j === n - 2)) return 3;
    return 2;
  }

  const nums = (t) => (String(t).match(/\d+/g) || []).map(Number);
  const sameList = (a, b) => a.length > 0 && a.length === b.length && a.every((x, i) => x === b[i]);
  const words = (t) => String(t).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);

  function isCorrect(stage, text) {
    const letter = text.trim().match(/^([A-Da-d])[.)]?$/);
    if (letter) return stage.choices['ABCD'.indexOf(letter[1].toUpperCase())] === stage.answer;
    if (text.trim().toLowerCase() === stage.answer.toLowerCase()) return true;
    const ansN = nums(stage.answer);
    const userN = nums(text);
    const numsUnique = !stage.choices.some((c) => c !== stage.answer && sameList(nums(c), ansN));
    if (ansN.length && numsUnique) {
      if (sameList(userN, ansN)) return true;
      const core = ansN.slice();
      nums(stage.prompt).forEach((p) => { const i = core.indexOf(p); if (i >= 0) core.splice(i, 1); });
      return core.length > 0 && sameList(userN, core);
    }
    // jawaban berupa kata: cocokkan kata pembeda tiap pilihan
    const user = new Set(words(text));
    const score = stage.choices.map((c, i) => {
      const others = new Set(stage.choices.filter((_, k) => k !== i).flatMap(words));
      return words(c).filter((w) => !others.has(w) && user.has(w)).length;
    });
    const ai = stage.choices.indexOf(stage.answer);
    return score[ai] > 0 && score.every((sc, i) => i === ai || sc < score[ai]);
  }

  function hint(stage, level) {
    const s = soalList[current];
    const p = stage.prompt.toLowerCase();
    if (level === 1) {
      if (p.includes('urutkan')) return 'Mulai dari angka yang paling kecil dulu. Angka berapa yang paling kecil di data?';
      if (s.table && (p.includes('frekuensi') || p.includes('nilai'))) return 'Lihat tabelnya: baris mana yang NILAI, baris mana yang FREKUENSI? Cari dulu barisnya, ya.';
      if (p.includes('berapa kali') || p.includes('frekuensi')) return 'Coba beri turus (|) setiap kali angka itu muncul, lalu hitung turusnya. Sudah cocok dengan angkamu?';
      if (p.includes('bandingkan') || p.includes('terbesar') || p.includes('selisih')) return 'Tulis dulu frekuensi tiap angka. Mana yang paling besar?';
      if (p.includes('modus')) return 'Ingat: modus adalah NILAI yang paling sering muncul, bukan banyaknya muncul.';
      return 'Baca lagi datanya pelan-pelan. Informasi apa yang paling penting?';
    }
    if (level === 2) {
      const data = s.values ? `Datanya: ${s.values.join(', ')}.` : `Tabel: ${s.table.rows.map((r) => `nilai ${r[0]} frekuensi ${r[1]}`).join('; ')}.`;
      const fokus = nums(stage.prompt);
      return `${data} ${fokus.length ? `Fokus pada angka ${fokus.join(' dan ')}.` : 'Perhatikan angka yang paling sering muncul.'}`;
    }
    return 'Kakak beri pilihan, ya. Pilih yang menurutmu paling tepat:';
  }

  function askStage() {
    const s = soalList[current];
    const stage = s.stages[st.j];
    bot(`[FASE ${faseOf(st.j, s.stages.length)}] Langkah ${st.j + 1}: ${stage.prompt}`);
  }

  function offlineStart() {
    st = { phase: 'orient', j: 0, wrong: 0, shown: false };
  }

  function offlineReply(text, quick) {
    const s = soalList[current];
    if (st.phase === 'orient') {
      if (quick === 'hint' || quick === 'bingung') {
        bot('[FASE 1] Yang diketahui adalah data (angka atau tabel) pada soal. Yang ditanyakan ada di baris bertanda ❓. Coba sebutkan dengan kata-katamu, ya.');
        return;
      }
      st.phase = 'stage';
      bot('[FASE 1] Bagus, kamu sudah mengumpulkan informasinya 👍 Sehari-hari kita bilang "yang paling sering"; dalam matematika itu disebut MODUS. Yuk kita cari selangkah demi selangkah.');
      askStage();
      return;
    }
    if (st.phase === 'reflect') {
      st.phase = 'transcend';
      bot('[FASE 3] Mantap, menjelaskan alasan membuat pemahamanmu makin kuat! Satu lagi: kalau di kantin jus jeruk paling sering dibeli, apa artinya bagi penjual? Dan bisakah sebuah data punya DUA modus?');
      return;
    }
    if (st.phase === 'transcend') {
      st.phase = 'done';
      bot('[FASE 3] Keren! Kamu sudah menghubungkan modus dengan kehidupan sehari-hari 🎉 Isi kuesioner beban belajar di bawah, lalu coba soal lain.');
      if (window.bukaKuesioner) window.bukaKuesioner(true);
      return;
    }
    if (st.phase === 'done') {
      bot('[FASE 3] Soal ini sudah selesai. Pilih soal lain di atas untuk lanjut berlatih, ya.');
      return;
    }
    const stage = s.stages[st.j];
    const fase = faseOf(st.j, s.stages.length);
    if (quick === 'hint' || quick === 'bingung') {
      st.wrong = Math.min(st.wrong + 1, 3);
      if (st.shown) { bot(`[FASE ${fase}] Pilih salah satu jawaban yang tadi, lalu jelaskan alasanmu dalam hati.`); return; }
      bot(`[FASE ${fase}] ${hint(stage, st.wrong)}`);
      if (st.wrong >= 3) { addChoices(stage.choices); st.shown = true; }
      return;
    }
    if (isCorrect(stage, text)) {
      st.wrong = 0;
      st.shown = false;
      log.querySelectorAll('.choice-row').forEach((r) => r.remove());
      bot(`[FASE ${fase}] Tepat! ${stage.explanation}`);
      st.j += 1;
      if (st.j < s.stages.length) {
        askStage();
      } else {
        st.phase = 'reflect';
        bot('[FASE 3] Kamu sudah menemukan jawabannya sendiri! Sekarang refleksi: jelaskan dengan kata-katamu, kenapa jawabanmu benar dan cara apa yang kamu pakai?');
      }
      return;
    }
    st.wrong = Math.min(st.wrong + 1, 3);
    if (st.shown) { bot(`[FASE ${fase}] Belum tepat. Coba pilih jawaban lain dari pilihan tadi, ya.`); return; }
    bot(`[FASE ${fase}] Hampir! Cek lagi bagian ${['', 'membaca data', 'mengolah data', 'menyatakan jawaban'][fase]}, ya. ${hint(stage, st.wrong)}`);
    if (st.wrong >= 3) { addChoices(stage.choices); st.shown = true; }
  }

  /* ---------- alur percakapan ---------- */
  function startSoal(i) {
    current = i;
    messages = [];
    hintLevel = 0;
    log.innerHTML = '';
    renderSoal();
    setStage(1);
    offlineStart();
    bot('[FASE 1] Halo! Aku Kak Modi 👋 Tujuan kita: menemukan nilai yang paling sering muncul. Baca soalnya pelan-pelan. Apa yang DIKETAHUI dan apa yang DITANYAKAN?');
  }

  async function send(text, quick) {
    if (busy || !text.trim()) return;
    busy = true;
    sendBtn.disabled = true;
    addBubble('user', text);
    messages.push({ role: 'user', content: text });

    if (!offline) {
      const typing = addBubble('assistant', '…');
      typing.classList.add('typing');
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, soal: soalText(soalList[current]), hintLevel: quick === 'hint' ? hintLevel : 0 }),
        });
        const data = await res.json().catch(() => ({}));
        typing.remove();
        if (res.ok && data.reply) {
          setMode(false, data.model);
          addBubble('assistant', data.reply);
          messages.push({ role: 'assistant', content: data.reply });
        } else {
          setMode(true);
          offlineReply(text, quick);
        }
      } catch (e) {
        typing.remove();
        setMode(true);
        offlineReply(text, quick);
      }
    } else {
      offlineReply(text, quick);
    }

    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  soalList.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.textContent = 'Soal ' + (i + 1);
    b.addEventListener('click', () => startSoal(i));
    tabs.appendChild(b);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = input.value;
    input.value = '';
    send(t);
  });

  document.querySelectorAll('.quick-btn').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.quick;
      if (k === 'hint') {
        hintLevel = Math.min(hintLevel + 1, 3);
        send(`Aku butuh petunjuk ${hintLevel}, ya Kak.`, 'hint');
      } else if (k === 'bingung') {
        send('Aku bingung, Kak. Bisa dijelaskan dengan langkah yang lebih kecil?', 'bingung');
      } else {
        const t = input.value.trim();
        input.value = '';
        send(t ? t : 'Tolong cek jawabanku yang terakhir, apakah sudah benar?', t ? undefined : 'cek');
      }
    })
  );

  if (soalList.length) startSoal(0);
})();
