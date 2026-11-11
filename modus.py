"""
Petualangan Modus - Asisten Modus versi Python
Program untuk mencari modus dari sekumpulan data, lengkap dengan langkah-langkahnya.
 
Algoritma:
1. Masukkan data
2. Urutkan data dari yang terkecil
3. Hitung frekuensi (berapa kali muncul) setiap nilai
4. Cari frekuensi terbesar
5. Modus = semua nilai yang frekuensinya sama dengan frekuensi terbesar
6. Tampilkan kesimpulan
 
Cara menjalankan:  python modus.py
"""
 
 
def ubah_ke_angka(teks):
    """Mengubah teks seperti '2, 3, 3, 4' menjadi list angka."""
    bagian = teks.replace(",", " ").replace(";", " ").split()
    data = []
    for x in bagian:
        angka = float(x)
        data.append(int(angka) if angka.is_integer() else angka)
    return data
 
 
def hitung_frekuensi(data_urut):
    """Menghitung berapa kali setiap nilai muncul."""
    frekuensi = {}
    for nilai in data_urut:
        if nilai in frekuensi:
            frekuensi[nilai] = frekuensi[nilai] + 1
        else:
            frekuensi[nilai] = 1
    return frekuensi
 
 
def cari_modus(data):
    """Mengembalikan (data_urut, frekuensi, frekuensi_terbesar, daftar_modus)."""
    data_urut = sorted(data)
    frekuensi = hitung_frekuensi(data_urut)
    terbesar = max(frekuensi.values())
    modus = [nilai for nilai, f in frekuensi.items() if f == terbesar]
    return data_urut, frekuensi, terbesar, modus
 
 
def gabung(daftar):
    """[7, 8] -> '7 dan 8', [1, 2, 3] -> '1, 2 dan 3'."""
    teks = [str(x) for x in daftar]
    if len(teks) == 1:
        return teks[0]
    return ", ".join(teks[:-1]) + " dan " + teks[-1]
 
 
def tampilkan_langkah(data):
    data_urut, frekuensi, terbesar, modus = cari_modus(data)
 
    print("\nLangkah 1 - Urutkan data dari yang terkecil:")
    print("  ", ", ".join(str(x) for x in data_urut))
 
    print("\nLangkah 2 - Hitung berapa kali setiap nilai muncul:")
    print(f"   {'Nilai':<8}{'Turus':<12}{'Frekuensi'}")
    for nilai, f in frekuensi.items():
        penanda = "  <-- paling sering" if f == terbesar and len(modus) < len(frekuensi) else ""
        print(f"   {str(nilai):<8}{'|' * f:<12}{f}{penanda}")
    print(f"   {'Jumlah':<20}{len(data)}")
 
    print("\nLangkah 3 - Cari frekuensi terbesar:")
    print(f"   Frekuensi terbesar = {terbesar}")
 
    print("\nLangkah 4 - Kesimpulan:")
    if len(modus) == len(frekuensi):
        print("   Semua nilai muncul sama banyak, jadi data ini TIDAK MEMILIKI MODUS.")
    elif len(modus) == 1:
        print(f"   Modusnya adalah {modus[0]}, karena muncul paling sering ({terbesar} kali).")
    else:
        print(f"   Modusnya ada {len(modus)}, yaitu {gabung(modus)}, karena sama-sama muncul paling sering ({terbesar} kali).")
 
 
# 5 soal dari instrumen penelitian (untuk dicoba)
CONTOH_SOAL = {
    "1": ("Soal 1 - Menentukan satu modus", [2, 3, 3, 4, 5, 3, 6]),
    "2": ("Soal 2 - Dua modus", [5, 6, 7, 7, 8, 8, 9]),
    "3": ("Soal 3 - Tabel frekuensi (nilai 4,5,6,7; frekuensi 2,4,3,1)", [4] * 2 + [5] * 4 + [6] * 3 + [7] * 1),
    "4": ("Soal 4 - Data tidak berurutan (buku)", [6, 7, 8, 8, 9, 8, 7, 10]),
    "5": ("Soal 5 - Cerita singkat (stiker)", [2, 3, 2, 4, 3, 2, 5, 3, 2, 4]),
}
 
 
def main():
    print("=" * 50)
    print("   PETUALANGAN MODUS - Asisten Modus (Python)")
    print("=" * 50)
    while True:
        print("\nMenu:")
        print("  1-5 : coba soal 1 sampai 5")
        print("  M   : masukkan data sendiri")
        print("  K   : keluar")
        pilihan = input("Pilihan: ").strip().upper()
 
        if pilihan == "K":
            print("Terima kasih, sampai jumpa di petualangan berikutnya!")
            break
        elif pilihan in CONTOH_SOAL:
            judul, data = CONTOH_SOAL[pilihan]
            print(f"\n{judul}")
            print("Data:", ", ".join(str(x) for x in data))
            tampilkan_langkah(data)
        elif pilihan == "M":
            teks = input("Masukkan data (pisahkan dengan koma/spasi): ")
            try:
                data = ubah_ke_angka(teks)
                if len(data) < 2:
                    print("Masukkan minimal 2 angka.")
                    continue
                tampilkan_langkah(data)
            except ValueError:
                print("Data tidak valid. Contoh yang benar: 2, 3, 3, 4, 5")
        else:
            print("Pilihan tidak dikenal, coba lagi.")
 
 
if __name__ == "__main__":
    main()