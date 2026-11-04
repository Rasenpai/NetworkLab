---
title: Dasar Firewall & Keamanan Jaringan
summary: Memahami fungsi firewall, perbedaan stateless dan stateful, serta peta fitur firewall di RouterOS.
minutes: 20
---

Di materi sebelumnya kamu sudah membangun dua jaringan yang saling terhubung dan bisa ke internet. Jaringan itu masih **terbuka**: siapa pun yang bisa menjangkau router bisa mencoba login, dan semua lalu lintas diizinkan. Mulai bab ini kamu belajar mengendalikan siapa boleh berbicara dengan siapa.

## Tujuan bab

- Menjelaskan apa itu firewall dan kenapa dibutuhkan.
- Membedakan firewall stateless dan stateful.
- Mengenal tabel dan fitur firewall di RouterOS.
- Menerapkan kebiasaan aman saat mengubah aturan firewall.

## Apa itu firewall

Firewall adalah penjaga gerbang. Setiap paket yang lewat diperiksa, lalu diberi keputusan: **diizinkan**, **ditolak**, atau **dicatat**. Pemeriksaan didasarkan pada aturan (rule) yang kamu tulis, misalnya alamat asal, alamat tujuan, protokol, port, dan interface.

Firewall melindungi dua hal:

- **Router itu sendiri**: mencegah orang luar membuka Winbox, SSH, atau DNS router.
- **Perangkat di belakang router**: mencegah orang luar mengakses laptop, server, dan printer di LAN.

## Stateless vs stateful

| Jenis      | Cara kerja                                          | Kelemahan                                    |
| ---------- | --------------------------------------------------- | -------------------------------------------- |
| Stateless  | Menilai tiap paket sendiri-sendiri, tanpa ingatan   | Harus menulis aturan untuk arah pergi dan pulang |
| Stateful   | Mengingat koneksi (connection tracking), balasan otomatis dikenali | Memakai sedikit memori dan CPU |

RouterOS adalah firewall **stateful**. Karena router ingat bahwa kamu yang memulai koneksi, balasannya cukup diizinkan dengan satu aturan `established,related`. Detailnya ada di bab 3.

## Dua filosofi aturan

| Pendekatan            | Prinsip                                  | Catatan                              |
| --------------------- | ---------------------------------------- | ------------------------------------ |
| Default allow         | Semua boleh, kecuali yang dilarang       | Mudah dibuat, tetapi mudah bocor     |
| Default deny          | Semua dilarang, kecuali yang diizinkan   | Lebih aman, butuh perencanaan        |

Di materi ini kamu akan bergerak ke arah **default deny** untuk akses ke router (chain `input`) dan memakai larangan terarah untuk lalu lintas antar jaringan (chain `forward`).

## Peta fitur firewall RouterOS

| Menu                         | Fungsi                                              | Dibahas di |
| ---------------------------- | --------------------------------------------------- | ---------- |
| `/ip firewall filter`        | Mengizinkan atau memblokir paket                    | Bab 4-8    |
| `/ip firewall nat`           | Mengubah alamat sumber atau tujuan                  | Bab 9-11   |
| `/ip firewall mangle`        | Menandai atau mengubah paket (routing mark, DSCP)   | Di luar materi ini |
| `/ip firewall raw`           | Memproses paket sebelum connection tracking         | Bab 8      |
| `/ip firewall address-list`  | Daftar alamat yang bisa dipakai ulang di aturan     | Bab 5      |
| `/ip firewall connection`    | Melihat koneksi yang sedang dilacak                 | Bab 3      |
| `/ip firewall service-port`  | Helper protokol (ALG) seperti FTP dan SIP           | Bab 11     |

## Kebiasaan aman sebelum mengubah firewall

Satu aturan `drop` yang salah bisa memutus aksesmu ke router sendiri. Biasakan:

1. Aktifkan **Safe Mode** (tombol Safe Mode di Winbox, atau `Ctrl+X` di terminal). Jika koneksimu putus, RouterOS membatalkan perubahan otomatis.
2. Beri `comment` pada setiap aturan supaya mudah dicari.
3. Ingat bahwa aturan dibaca **dari atas ke bawah** dan berhenti pada kecocokan pertama (bab 4).
4. Simpan backup sebelum memulai: `/system backup save name=sebelum-firewall`.

## Lab: melihat kondisi awal

Di R1, lihat isi firewall saat ini. Seharusnya hanya ada dua aturan pemblokiran DNS dari WAN dan satu aturan masquerade dari lab sebelumnya.

```routeros
/ip firewall filter print
/ip firewall filter print stats
/ip firewall nat print
/ip firewall connection print count-only
```

Kolom `bytes` dan `packets` pada `print stats` adalah penghitung (counter). Counter naik setiap ada paket yang cocok dengan aturan, jadi kamu bisa membuktikan sebuah aturan benar-benar terpakai.

Sekarang buat aturan `log` untuk melihat firewall bekerja:

```routeros
/ip firewall filter add chain=input protocol=icmp action=log log-prefix="PING-KE-ROUTER" comment="Uji log"
```

Dari laptop LAN 1, jalankan `ping 192.168.10.1`, lalu lihat log:

```routeros
/log print where message~"PING-KE-ROUTER"
/ip firewall filter print stats where comment="Uji log"
```

Hapus aturan uji setelah selesai:

```routeros
/ip firewall filter remove [find comment="Uji log"]
```

## Uji pemahaman

1. Apa kelebihan firewall stateful dibanding stateless?
2. Apa beda pendekatan default allow dan default deny?
3. Tabel firewall mana yang dipakai untuk mengubah alamat sumber paket?
4. Kenapa Safe Mode penting saat mengedit firewall?
5. Bagaimana cara membuktikan bahwa sebuah aturan benar-benar mengenai paket?

**Kunci jawaban**

1. Balasan dari koneksi yang sudah ada dikenali otomatis, sehingga aturan lebih sedikit dan lebih aman.
2. Default allow mengizinkan semua kecuali yang dilarang, sedangkan default deny melarang semua kecuali yang diizinkan.
3. Tabel `nat` (chain `srcnat`).
4. Jika kesalahan aturan memutus koneksimu, RouterOS membatalkan perubahan secara otomatis.
5. Lihat counter dengan `print stats`, atau pasang aturan `log` dan cek hasilnya di `/log print`.

## Ringkasan

- Firewall memutuskan nasib setiap paket berdasarkan aturan berurutan.
- RouterOS bersifat stateful dan punya beberapa tabel dengan tugas berbeda.
- Biasakan Safe Mode, comment, dan backup sebelum mengubah firewall.

## Langkah selanjutnya

Lanjutkan ke **Bab 2: Alur Paket & Chain**, untuk memahami jalur yang dilalui paket di dalam router sehingga kamu tahu aturan harus dipasang di chain yang mana.
