window.soalLatihan = [
  {
    prompt: 'Tentukan modus dari data berikut.',
    values: [2, 3, 3, 4, 5, 3, 6],
    choices: ['2', '3', '4', '5'],
    answer: '3',
    explanation: [
      'Periksa berapa kali setiap angka muncul dalam data.',
      'Angka 3 muncul 3 kali. Angka 2, 4, 5, dan 6 masing-masing muncul 1 kali.',
      'Angka dengan kemunculan terbanyak adalah 3, jadi modusnya 3.'
    ]
  },
  {
    prompt: 'Tentukan modus dari data berikut. Apakah hanya ada satu modus?',
    values: [5, 6, 7, 7, 8, 8, 9],
    choices: ['7 dan 8', '7 saja', '8 saja', 'Tidak ada modus'],
    answer: '7 dan 8',
    explanation: [
      'Hitung kemunculan setiap angka pada data.',
      'Angka 7 muncul 2 kali dan angka 8 juga muncul 2 kali. Angka lainnya muncul 1 kali.',
      'Karena 7 dan 8 sama-sama muncul paling sering, keduanya adalah modus. Jadi, ada dua modus.'
    ]
  },
  {
    prompt: 'Perhatikan tabel frekuensi berikut. Nilai mana yang menjadi modus?',
    table: {
      caption: 'Nilai dan frekuensi',
      headers: ['Nilai', 'Frekuensi'],
      rows: [[4, 2], [5, 4], [6, 3], [7, 1]]
    },
    choices: ['4', '5', '6', '7'],
    answer: '5',
    explanation: [
      'Cari frekuensi terbesar pada kolom Frekuensi. Frekuensi terbesar adalah 4.',
      'Pada baris dengan frekuensi 4, nilai yang tercatat adalah 5.',
      'Jadi, modusnya adalah nilai 5, bukan frekuensi 4.'
    ]
  },
  {
    prompt: 'Jumlah buku yang dibaca beberapa siswa tercatat seperti berikut. Tentukan modusnya.',
    values: [6, 7, 8, 8, 9, 8, 7, 10],
    choices: ['7', '8', '9', '10'],
    answer: '8',
    explanation: [
      'Urutkan data agar lebih mudah diperiksa: 6, 7, 7, 8, 8, 8, 9, 10.',
      'Angka 7 muncul 2 kali, sedangkan angka 8 muncul 3 kali. Angka lainnya masing-masing muncul 1 kali.',
      'Angka yang paling sering muncul adalah 8, jadi modusnya 8 buku.'
    ]
  },
  {
    prompt: 'Stiker milik seorang siswa berjumlah seperti data berikut. Berapa modus jumlah stikernya?',
    values: [2, 3, 2, 4, 3, 2, 5, 3, 2, 4],
    choices: ['2 stiker', '3 stiker', '4 stiker', '5 stiker'],
    answer: '2 stiker',
    explanation: [
      'Hitung banyak kemunculan setiap jumlah stiker.',
      'Angka 2 muncul 4 kali, angka 3 muncul 3 kali, angka 4 muncul 2 kali, dan angka 5 muncul 1 kali.',
      'Angka 2 memiliki kemunculan terbanyak, yaitu 4 kali. Jadi, modusnya 2 stiker.'
    ]
  }
];
