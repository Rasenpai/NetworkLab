---
title: User dan Keamanan Dasar
summary: Mengamankan akses router, dari user dan password sampai membatasi layanan.
minutes: 15
---

Router yang baru dikonfigurasi biasanya masih memakai pengaturan default yang terlalu terbuka. Bab ini membahas langkah dasar agar router tidak mudah diakses orang yang tidak berwenang.

> Aktifkan **Safe Mode** (`Ctrl+X` di terminal) sebelum mengubah pengaturan akses. Salah satu langkah di bab ini bisa memutus koneksi kamu sendiri.

## Tujuan belajar

- Membuat user dengan hak akses sesuai kebutuhan.
- Mengamankan user `admin` bawaan.
- Mematikan dan membatasi layanan yang tidak diperlukan.
- Membatasi discovery dan akses MAC ke jaringan LAN.

## User dan group

RouterOS memakai group untuk menentukan hak akses user.

| Group   | Hak akses                                         |
| ------- | ------------------------------------------------- |
| `read`  | Hanya melihat konfigurasi, tidak bisa mengubah    |
| `write` | Bisa mengubah konfigurasi, tetapi tidak semua fitur sistem |
| `full`  | Semua hak akses, termasuk mengelola user          |

Lihat daftar group dan user:

```routeros
/user group print
/user print
```

Buat user baru, misalnya satu untuk teknisi dan satu untuk monitoring:

```routeros
/user add name=teknisi password=<password> group=full
/user add name=monitor password=<password> group=read
```

Ganti `<password>` dengan password yang kuat. Berikan hak seminimal mungkin sesuai kebutuhan. Akun monitoring cukup memakai group `read`.

## Mengamankan user admin

User `admin` adalah nama yang paling sering diserang. Urutan yang aman:

1. Buat user baru dengan group `full`.
2. Login memakai user baru dan pastikan berhasil.
3. Baru nonaktifkan `admin`.

```routeros
/user disable admin
```

Jika tidak ingin menonaktifkannya, minimal ganti passwordnya:

```routeros
/user set admin password=<password>
```

Lihat siapa yang sedang login:

```routeros
/user active print
```

> Jangan nonaktifkan `admin` sebelum kamu berhasil login dengan user pengganti. Kalau tidak, kamu bisa terkunci dari router.

## Layanan yang terbuka

Router menjalankan beberapa layanan akses secara default:

```routeros
/ip service print
```

| Layanan  | Port | Catatan                                         |
| -------- | ---- | ----------------------------------------------- |
| `telnet` | 23   | Tidak terenkripsi, matikan                      |
| `ftp`    | 21   | Tidak terenkripsi, matikan                      |
| `www`    | 80   | WebFig lewat HTTP, matikan atau batasi          |
| `ssh`    | 22   | Aman, batasi ke jaringan manajemen              |
| `winbox` | 8291 | Batasi ke jaringan manajemen                    |
| `api`    | 8728 | Matikan jika tidak dipakai                      |

Matikan yang tidak dipakai:

```routeros
/ip service disable telnet,ftp,www,api
```

Batasi layanan yang dipakai agar hanya bisa diakses dari LAN:

```routeros
/ip service set winbox address=192.168.10.0/24
/ip service set ssh address=192.168.10.0/24
```

> Kalau kamu masih butuh WebFig, jangan matikan `www`. Cukup batasi dengan `/ip service set www address=192.168.10.0/24`.

## Membatasi discovery dan akses MAC

Secara default router memperkenalkan dirinya ke semua interface lewat neighbor discovery dan menerima koneksi MAC Winbox. Batasi hanya ke LAN. Pertama buat interface list:

```routeros
/interface list add name=LAN
/interface list member add list=LAN interface=ether2
```

Lalu terapkan:

```routeros
/ip neighbor discovery-settings set discover-interface-list=LAN
/tool mac-server set allowed-interface-list=LAN
/tool mac-server mac-winbox set allowed-interface-list=LAN
```

Sekarang port WAN tidak lagi menampilkan atau menerima akses lewat MAC.

## Penguatan SSH

```routeros
/ip ssh set strong-crypto=yes
```

Perintah ini membatasi SSH hanya memakai algoritma enkripsi yang kuat. Pastikan SSH client yang kamu pakai cukup baru.

## Daftar periksa

| Langkah                                        | Selesai |
| ---------------------------------------------- | ------- |
| User baru sudah dibuat dan berhasil login      |         |
| User `admin` dinonaktifkan atau passwordnya diganti |    |
| Telnet, FTP, dan API dimatikan                 |         |
| Winbox dan SSH dibatasi ke subnet LAN          |         |
| Neighbor discovery dan MAC server dibatasi ke LAN |     |
| Firewall untuk melindungi router (bab Firewall)|         |

## Ringkasan

- Pakai user terpisah dengan group sesuai kebutuhan, dan jangan bergantung pada `admin`.
- Matikan layanan tidak aman seperti Telnet dan FTP.
- Batasi Winbox dan SSH ke alamat manajemen.
- Batasi discovery dan MAC server ke interface LAN.
- Selalu pakai Safe Mode saat mengubah pengaturan akses.

## Latihan

1. Buat user `monitor` dengan group `read`, login, dan coba ubah konfigurasi. Apa yang terjadi?
2. Batasi Winbox ke subnet LAN lalu coba sambung dari alamat lain.
3. Cek `/ip service print` dan pastikan tidak ada layanan yang tidak kamu butuhkan.
