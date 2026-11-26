// Kuesioner Harian Cognitive Load (skala usaha mental Paas 1–9)
// Diadaptasi dari instrumen dosen: 10 butir (3 extraneous, 3 intrinsic, 4 germane).
// Kata "guru/lembar kerja" disesuaikan menjadi "Kak Modi/aplikasi".
(function () {
  const box = document.getElementById('kuesioner');
  const openBtn = document.getElementById('open-kuesioner');
  if (!box || !openBtn) return;

  const butir = [
    ['extraneous', 'Seberapa besar usaha berpikirmu untuk memahami maksud penjelasan dan petunjuk dari Kak Modi hari ini?'],
    ['extraneous', 'Seberapa besar usaha berpikirmu untuk memahami tampilan aplikasi yang digunakan hari ini?'],
    ['extraneous', 'Seberapa besar usaha berpikirmu untuk mencari dan mencocokkan informasi dari soal, data, dan penjelasan Kak Modi hari ini?'],
    ['intrinsic', 'Seberapa besar usaha berpikirmu untuk memahami materi modus yang dipelajari hari ini?'],
    ['intrinsic', 'Seberapa besar usaha berpikirmu untuk menyelesaikan soal-soal modus hari ini?'],
    ['intrinsic', 'Seberapa besar usaha berpikirmu untuk memahami hubungan antara konsep, cara, dan langkah penyelesaian hari ini?'],
    ['germane', 'Seberapa besar usaha berpikirmu untuk benar-benar memahami materi hari ini, bukan sekadar menghafal?'],
    ['germane', 'Seberapa besar usaha berpikirmu untuk meningkatkan pemahamanmu tentang modus hari ini?'],
    ['germane', 'Seberapa besar usaha berpikirmu untuk meningkatkan pengetahuan matematikamu melalui kegiatan hari ini?'],
    ['germane', 'Seberapa besar usaha berpikirmu untuk meningkatkan pemahamanmu tentang cara menentukan modus hari ini?'],
  ];
  const label = { extraneous: 'Extraneous Load', intrinsic: 'Intrinsic Load', germane: 'Germane Load' };
  const arti = {
    extraneous: 'usaha berpikir karena cara penyajian pembelajaran',
    intrinsic: 'usaha berpikir karena tingkat kesulitan materi',
    germane: 'usaha berpikir untuk membangun pemahaman',
  };
  const skala = ['Sangat rendah', '', 'Rendah', '', 'Sedang', '', 'Tinggi', '', 'Amat sangat tinggi'];
  const jawab = {};

  function render() {
    let html = `<h2 class="kq-title">📝 Kuesioner Beban Belajar</h2>
      <p class="kq-intro">Pilih angka 1–9. Angka 1 = usaha berpikirmu sangat rendah, 5 = sedang, 9 = amat sangat tinggi. Tidak ada jawaban benar atau salah, dan tidak memengaruhi nilai.</p>
      <label class="kq-name">Nama <input id="kq-nama" type="text" maxlength="60" placeholder="Nama kamu" /></label>`;
    let last = '';
    butir.forEach(([k, q], i) => {
      if (k !== last) { html += `<p class="kq-group">${label[k]} <span>(${arti[k]})</span></p>`; last = k; }
      html += `<div class="kq-item"><p>${i + 1}. ${q}</p><div class="kq-scale" data-i="${i}">` +
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-n="${n}" title="${skala[n - 1] || n}">${n}</button>`).join('') +
        '</div></div>';
    });
    html += '<button type="button" id="kq-kirim" class="kq-kirim">Lihat hasil</button><div id="kq-hasil" class="kq-hasil" aria-live="polite"></div>';
    box.innerHTML = html;

    box.querySelectorAll('.kq-scale').forEach((row) => {
      row.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        jawab[row.dataset.i] = Number(b.dataset.n);
        row.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      });
    });
    document.getElementById('kq-kirim').addEventListener('click', hasil);
  }

  function hasil() {
    const out = document.getElementById('kq-hasil');
    if (Object.keys(jawab).length < butir.length) {
      out.innerHTML = `<p class="kq-warn">Masih ada ${butir.length - Object.keys(jawab).length} pertanyaan yang belum diisi.</p>`;
      return;
    }
    const rata = {};
    Object.keys(label).forEach((k) => {
      const v = butir.map((b, i) => (b[0] === k ? jawab[i] : null)).filter((x) => x !== null);
      rata[k] = v.reduce((a, b) => a + b, 0) / v.length;
    });
    const saran = [];
    if (rata.extraneous >= 6) saran.push('Tampilan atau petunjuk terasa membingungkan. Pakai tombol "Aku bingung" agar Kak Modi menjelaskan lebih sederhana.');
    if (rata.intrinsic >= 6) saran.push('Materinya terasa sulit. Gunakan "Beri petunjuk" bertahap dan kerjakan satu langkah dulu.');
    if (rata.germane <= 4) saran.push('Coba jelaskan alasan setiap jawabanmu ke Kak Modi supaya pemahamanmu makin kuat.');
    if (!saran.length) saran.push('Beban belajarmu sudah seimbang. Lanjutkan berlatih soal lain!');

    out.innerHTML = '<h3>Hasil kuesioner</h3>' + Object.keys(label).map((k) =>
      `<div class="kq-bar" title="${arti[k]}"><span>${label[k]}</span><div><i style="width:${(rata[k] / 9) * 100}%"></i></div><b>${rata[k].toFixed(1)}</b></div>`).join('') +
      '<p class="kq-note">Extraneous: makin rendah makin baik · Germane: makin tinggi makin baik.</p><ul>' + saran.map((t) => `<li>${t}</li>`).join('') + '</ul><p class="kq-note">Screenshot hasil ini untuk dikumpulkan ke guru.</p>';

    try {
      const riwayat = JSON.parse(localStorage.getItem('kuesionerCL') || '[]');
      riwayat.push({ nama: document.getElementById('kq-nama').value, tanggal: new Date().toISOString(), jawab: { ...jawab }, rata });
      localStorage.setItem('kuesionerCL', JSON.stringify(riwayat));
    } catch (e) { /* penyimpanan browser tidak tersedia */ }
  }

  window.bukaKuesioner = function (scroll) {
    if (!box.innerHTML) render();
    box.hidden = false;
    openBtn.textContent = 'Tutup kuesioner';
    if (scroll) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  openBtn.addEventListener('click', () => {
    if (box.hidden) window.bukaKuesioner(true);
    else { box.hidden = true; openBtn.textContent = '📝 Isi kuesioner beban belajar'; }
  });
})();
