window.soalLatihan = [
  {
    prompt: 'Data berikut diamati untuk menentukan modus.',
    values: [2, 3, 3, 4, 5, 3, 6],
    stages: [
      {
        prompt: 'Urutkan data dari yang terkecil.',
        points: 1,
        choices: ['2, 3, 3, 3, 4, 5, 6', '2, 3, 3, 4, 3, 5, 6', '3, 2, 3, 3, 4, 5, 6', '2, 3, 4, 3, 3, 5, 6'],
        answer: '2, 3, 3, 3, 4, 5, 6',
        explanation: 'Susun semua angka dari nilai terkecil ke terbesar tanpa menghilangkan data.'
      },
      {
        prompt: 'Berapa kali angka 3 muncul?',
        points: 2,
        choices: ['1 kali', '2 kali', '3 kali', '4 kali'],
        answer: '3 kali',
        explanation: 'Angka 3 muncul tiga kali pada kumpulan data.'
      },
      {
        prompt: 'Bandingkan frekuensi angka 3 dengan angka lainnya. Apa yang kamu temukan?',
        points: 2,
        choices: ['Angka 3 muncul lebih sering daripada setiap angka lainnya', 'Semua angka muncul sama sering', 'Angka 2 muncul paling sering', 'Angka 4 muncul lebih sering daripada angka 3'],
        answer: 'Angka 3 muncul lebih sering daripada setiap angka lainnya',
        explanation: 'Angka 3 muncul 3 kali, sementara angka 2, 4, 5, dan 6 masing-masing 1 kali.'
      },
      {
        prompt: 'Jadi, berapa modus data tersebut?',
        points: 1,
        choices: ['2', '3', '4', '5'],
        answer: '3',
        explanation: 'Modus adalah nilai yang paling sering muncul, yaitu 3.'
      }
    ]
  },
  {
    prompt: 'Perhatikan data berikut. Apakah ada lebih dari satu modus?',
    values: [5, 6, 7, 7, 8, 8, 9],
    stages: [
      {
        prompt: 'Apa yang perlu dicari untuk menjawab pertanyaan tentang modus?',
        points: 1,
        choices: ['Nilai yang muncul paling sering', 'Nilai yang paling besar', 'Jumlah seluruh nilai', 'Nilai yang muncul paling awal'],
        answer: 'Nilai yang muncul paling sering',
        explanation: 'Modus ditentukan dengan mencari nilai yang frekuensi kemunculannya paling besar.'
      },
      {
        prompt: 'Berapa kali nilai 7 dan nilai 8 muncul?',
        points: 2,
        choices: ['7 muncul 1 kali dan 8 muncul 2 kali', '7 muncul 2 kali dan 8 muncul 2 kali', '7 muncul 2 kali dan 8 muncul 1 kali', '7 muncul 3 kali dan 8 muncul 3 kali'],
        answer: '7 muncul 2 kali dan 8 muncul 2 kali',
        explanation: 'Nilai 7 tercatat dua kali dan nilai 8 juga tercatat dua kali.'
      },
      {
        prompt: 'Bandingkan frekuensi 7 dan 8 dengan nilai lainnya.',
        points: 1,
        choices: ['Frekuensi 7 dan 8 sama-sama terbesar', 'Frekuensi 7 paling besar', 'Frekuensi 8 paling besar', 'Semua frekuensi sama'],
        answer: 'Frekuensi 7 dan 8 sama-sama terbesar',
        explanation: 'Nilai lainnya muncul satu kali, sedangkan 7 dan 8 masing-masing muncul dua kali.'
      },
      {
        prompt: 'Nilai mana yang menjadi modus data?',
        points: 1,
        choices: ['7 dan 8', '7 saja', '8 saja', 'Tidak ada modus'],
        answer: '7 dan 8',
        explanation: 'Kedua nilai sama-sama memiliki frekuensi terbesar.'
      },
      {
        prompt: 'Apa alasan data ini memiliki dua modus?',
        points: 1,
        choices: ['7 dan 8 sama-sama muncul paling sering', '7 dan 8 adalah nilai terbesar', 'Semua nilai muncul dua kali', 'Jumlah data ada tujuh'],
        answer: '7 dan 8 sama-sama muncul paling sering',
        explanation: 'Nilai 7 dan 8 masing-masing muncul dua kali, lebih sering daripada nilai lainnya.'
      }
    ]
  },
  {
    prompt: 'Perhatikan tabel nilai dan frekuensi berikut.',
    table: {
      caption: 'Nilai dan frekuensi',
      headers: ['Nilai', 'Frekuensi'],
      rows: [[4, 2], [5, 4], [6, 3], [7, 1]]
    },
    stages: [
      {
        prompt: 'Pada tabel, berapa frekuensi untuk nilai 5?',
        points: 1,
        choices: ['1', '2', '3', '4'],
        answer: '4',
        explanation: 'Pada baris nilai 5, kolom frekuensi menunjukkan angka 4.'
      },
      {
        prompt: 'Berapa frekuensi terbesar pada tabel?',
        points: 1,
        choices: ['1', '2', '3', '4'],
        answer: '4',
        explanation: 'Frekuensi pada tabel adalah 2, 4, 3, dan 1; yang terbesar adalah 4.'
      },
      {
        prompt: 'Nilai berapa yang memiliki frekuensi terbesar?',
        points: 1,
        choices: ['4', '5', '6', '7'],
        answer: '5',
        explanation: 'Frekuensi terbesar, yaitu 4, berada pada baris nilai 5.'
      },
      {
        prompt: 'Modus diambil dari nilai atau frekuensi?',
        points: 1,
        choices: ['Nilai', 'Frekuensi', 'Jumlah semua frekuensi', 'Selisih nilai'],
        answer: 'Nilai',
        explanation: 'Frekuensi membantu menemukan baris yang paling sering, tetapi modusnya adalah nilai pada baris itu.'
      },
      {
        prompt: 'Bagaimana frekuensi nilai 5 dibandingkan frekuensi nilai lainnya?',
        points: 1,
        choices: ['Lebih besar daripada semuanya', 'Sama dengan frekuensi nilai 4', 'Lebih kecil daripada frekuensi nilai 6', 'Semua frekuensi sama'],
        answer: 'Lebih besar daripada semuanya',
        explanation: 'Frekuensi nilai 5 adalah 4, lebih besar daripada frekuensi nilai lain (2, 3, dan 1).'
      },
      {
        prompt: 'Apa kesimpulan yang tepat dari tabel?',
        points: 1,
        choices: ['Modusnya nilai 5', 'Modusnya frekuensi 4', 'Modusnya nilai 4', 'Tidak ada modus'],
        answer: 'Modusnya nilai 5',
        explanation: 'Nilai 5 memiliki frekuensi terbesar, sehingga modus tabel adalah 5.'
      }
    ]
  },
  {
    prompt: 'Jumlah buku yang dibaca beberapa siswa tercatat seperti berikut.',
    values: [6, 7, 8, 8, 9, 8, 7, 10],
    stages: [
      {
        prompt: 'Urutkan data jumlah buku dari yang terkecil.',
        points: 1,
        choices: ['6, 7, 7, 8, 8, 8, 9, 10', '6, 7, 8, 7, 8, 8, 9, 10', '7, 6, 7, 8, 8, 8, 9, 10', '6, 7, 7, 8, 8, 9, 8, 10'],
        answer: '6, 7, 7, 8, 8, 8, 9, 10',
        explanation: 'Urutan dari terkecil ke terbesar adalah 6, 7, 7, 8, 8, 8, 9, 10.'
      },
      {
        prompt: 'Berapa kali angka 8 muncul?',
        points: 2,
        choices: ['1 kali', '2 kali', '3 kali', '4 kali'],
        answer: '3 kali',
        explanation: 'Angka 8 muncul tiga kali dalam data.'
      },
      {
        prompt: 'Berapa selisih frekuensi angka 8 dan angka 7?',
        points: 2,
        choices: ['0', '1', '2', '3'],
        answer: '1',
        explanation: 'Angka 8 muncul 3 kali dan angka 7 muncul 2 kali, jadi selisihnya 1.'
      },
      {
        prompt: 'Tentukan modus jumlah buku tersebut.',
        points: 1,
        choices: ['7 buku', '8 buku', '9 buku', '10 buku'],
        answer: '8 buku',
        explanation: 'Angka 8 muncul paling banyak, yaitu tiga kali, sehingga modusnya 8 buku.'
      }
    ]
  },
  {
    prompt: 'Jumlah stiker milik seorang siswa tercatat seperti berikut.',
    values: [2, 3, 2, 4, 3, 2, 5, 3, 2, 4],
    stages: [
      {
        prompt: 'Informasi apa yang ditunjukkan oleh data ini?',
        points: 1,
        choices: ['Jumlah stiker yang dimiliki siswa', 'Harga setiap stiker', 'Warna stiker yang disukai', 'Jumlah siswa di kelas'],
        answer: 'Jumlah stiker yang dimiliki siswa',
        explanation: 'Data menceritakan banyaknya stiker yang dimiliki seorang siswa.'
      },
      {
        prompt: 'Urutkan data jumlah stiker dari yang terkecil.',
        points: 1,
        choices: ['2, 2, 2, 2, 3, 3, 3, 4, 4, 5', '2, 3, 2, 2, 3, 2, 3, 4, 4, 5', '2, 2, 2, 3, 2, 3, 3, 4, 4, 5', '5, 4, 4, 3, 3, 3, 2, 2, 2, 2'],
        answer: '2, 2, 2, 2, 3, 3, 3, 4, 4, 5',
        explanation: 'Setelah diurutkan, empat angka 2 diikuti tiga angka 3, dua angka 4, dan satu angka 5.'
      },
      {
        prompt: 'Tabel frekuensi mana yang sesuai dengan data?',
        points: 1,
        choices: ['2: 4 kali, 3: 3 kali, 4: 2 kali, 5: 1 kali', '2: 3 kali, 3: 4 kali, 4: 2 kali, 5: 1 kali', '2: 4 kali, 3: 2 kali, 4: 3 kali, 5: 1 kali', '2: 2 kali, 3: 3 kali, 4: 4 kali, 5: 1 kali'],
        answer: '2: 4 kali, 3: 3 kali, 4: 2 kali, 5: 1 kali',
        explanation: 'Nilai 2 muncul empat kali, 3 muncul tiga kali, 4 muncul dua kali, dan 5 muncul satu kali.'
      },
      {
        prompt: 'Berapa jumlah seluruh frekuensi pada tabel?',
        points: 1,
        choices: ['8', '9', '10', '11'],
        answer: '10',
        explanation: 'Jumlah frekuensi 4 + 3 + 2 + 1 = 10, sama dengan banyaknya data.'
      },
      {
        prompt: 'Berapa modus jumlah stiker?',
        points: 1,
        choices: ['2 stiker', '3 stiker', '4 stiker', '5 stiker'],
        answer: '2 stiker',
        explanation: 'Angka 2 memiliki frekuensi terbesar, yaitu empat kali.'
      },
      {
        prompt: 'Apa kesimpulan yang tepat?',
        points: 1,
        choices: ['Modusnya 2 stiker karena muncul 4 kali', 'Modusnya 3 stiker karena muncul 3 kali', 'Modusnya 4 stiker karena nilainya besar', 'Modusnya 5 stiker karena muncul terakhir'],
        answer: 'Modusnya 2 stiker karena muncul 4 kali',
        explanation: 'Jumlah stiker yang paling sering muncul adalah 2, sebanyak 4 kali.'
      }
    ]
  }
];
