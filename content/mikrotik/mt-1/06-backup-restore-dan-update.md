---
title: Backup, Restore, dan Update
summary: Menyimpan dan memulihkan konfigurasi, memindahkan file, serta memperbarui RouterOS dengan aman.
minutes: 15
---

Konfigurasi router adalah hasil kerja berjam-jam. Backup rutin dan update yang tertib membuat kamu bisa pulih cepat kalau ada masalah.

## Tujuan belajar

- Membedakan **backup** dan **export**.
- Memulihkan konfigurasi dari kedua jenis file.
- Memindahkan file dari dan ke router.
- Memperbarui RouterOS dan firmware dengan urutan yang benar.

## Backup dan export

| Fitur        | File       | Isi                               | Bisa dibuka di editor teks | Dipulihkan di                  |
| ------------ | ---------- | --------------------------------- | -------------------------- | ------------------------------ |
| **Backup**   | `.backup`  | Seluruh konfigurasi, biner        | Tidak                      | Perangkat yang sama            |
| **Export**   | `.rsc`     | Perintah konfigurasi dalam teks   | Ya                         | Perangkat apa saja, bisa diedit |

Gunakan keduanya: backup untuk pemulihan penuh di router yang sama, export untuk dokumentasi dan pindah ke router lain.

```routeros
/system backup save name=backup-awal
/export file=config-awal
```

Nama file otomatis diberi ekstensi. Agar nama file mengandung identity router, bisa dibuat seperti ini:

```routeros
/system backup save name=("backup-" . [/system identity get name])
```

Lihat file yang sudah dibuat:

```routeros
/file print
```

Opsi export yang sering dipakai:

| Perintah                          | Hasil                                          |
| --------------------------------- | ---------------------------------------------- |
| `/export`                         | Tampil langsung di terminal                    |
| `/export verbose`                 | Menyertakan semua parameter, termasuk default  |
| `/export show-sensitive file=...` | Menyertakan data sensitif seperti password (RouterOS v7) |

> File backup dan export bisa memuat data rahasia seperti password WiFi dan kunci VPN. Jangan dibagikan sembarangan atau diunggah ke tempat publik.

## Memindahkan file

File berada di router, jadi perlu dipindahkan ke komputer untuk disimpan aman.

- **Winbox**: buka menu **Files**, lalu seret file ke komputer atau gunakan tombol unduh.
- **SFTP**: sambung ke router lewat SSH dengan program seperti WinSCP.

![WinSCP](https://commons.wikimedia.org/wiki/Special:FilePath/Winscp_screenshots.png?width=800 "Contoh WinSCP, aplikasi transfer file lewat SFTP. Sumber: Wikimedia Commons")

> FTP tidak dipakai karena layanannya sudah dimatikan di bab keamanan, dan memang tidak terenkripsi.

## Memulihkan konfigurasi

**Dari file backup** (di router yang sama):

```routeros
/system backup load name=backup-awal
```

Router akan meminta konfirmasi lalu reboot.

**Dari file export** (di router mana pun):

```routeros
/import file-name=config-awal.rsc
```

Perintah di dalam file dijalankan satu per satu. Periksa pesan error di terminal setelah selesai.

Kalau baru saja salah mengubah sesuatu, lihat riwayat perubahan:

```routeros
/system history print
```

Perubahan terakhir bisa dibatalkan dengan `/system history undo`.

## Memperbarui RouterOS

Ada dua hal yang diperbarui secara terpisah: **RouterOS** (sistem operasi) dan **firmware RouterBOARD** (perangkat lunak bawaan hardware).

Urutan yang aman:

1. **Backup** dan export konfigurasi.
2. Cek versi saat ini.
3. Update RouterOS.
4. Update firmware.
5. Reboot dan verifikasi.

```routeros
/system resource print
/system package update set channel=stable
/system package update check-for-updates
/system package update install
```

Router akan reboot otomatis setelah proses install. Kemudian update firmware:

```routeros
/system routerboard print
/system routerboard upgrade
/system reboot
```

Bandingkan kolom `current-firmware` dan `upgrade-firmware`. Jika berbeda, jalankan upgrade lalu reboot agar firmware baru aktif.

Channel update yang tersedia:

| Channel          | Kegunaan                                          |
| ---------------- | ------------------------------------------------- |
| `stable`         | Pilihan umum untuk kebanyakan pengguna            |
| `long-term`      | Perubahan minimal, cocok untuk jaringan produksi  |
| `testing`        | Fitur baru yang belum final, hanya untuk uji coba |

> Jangan mencabut daya saat proses update berjalan. Update juga sebaiknya dilakukan saat jam sepi, karena router akan reboot.

## Rutinitas yang disarankan

| Kapan                                  | Yang dilakukan                          |
| -------------------------------------- | --------------------------------------- |
| Setelah konfigurasi selesai            | Backup dan export                       |
| Sebelum perubahan besar                | Backup dan export                       |
| Sebelum update RouterOS                | Backup dan export                       |
| Berkala (misal bulanan)                | Backup dan simpan di luar router        |

## Ringkasan

- **Backup** (`.backup`) untuk pemulihan penuh di perangkat yang sama, **export** (`.rsc`) untuk teks yang bisa diedit dan dipindah.
- Simpan salinan file di komputer, karena file di router ikut hilang jika router rusak.
- Update dilakukan berurutan: backup, RouterOS, firmware, reboot.
- File backup dan export bisa memuat data sensitif, jaga kerahasiaannya.

## Latihan

1. Buat backup dan export, lalu unduh keduanya ke komputer.
2. Buka file `.rsc` di editor teks dan cari konfigurasi NAT kamu.
3. Cek apakah ada update baru dengan `check-for-updates` (jangan install dulu kalau belum ada backup).
