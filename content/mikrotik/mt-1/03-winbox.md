---
title: Mengenal Winbox
summary: Tool GUI utama untuk mengelola RouterOS, termasuk Safe Mode yang menyelamatkan koneksi.
minutes: 15
---

Winbox adalah aplikasi GUI resmi MikroTik untuk mengelola router. Hampir semua fitur RouterOS bisa diatur dari sini, jadi ini alat yang paling sering kamu pakai.

## Tujuan belajar

- Terhubung ke router lewat IP maupun MAC address.
- Memahami tata letak menu dan cara mengelola data di Winbox.
- Memakai **Safe Mode** agar salah konfigurasi tidak memutus akses.
- Membedakan Quick Set dan konfigurasi manual.

## Terhubung ke router

![Tampilan Winbox](https://commons.wikimedia.org/wiki/Special:FilePath/Winbox.png?width=800 "Tampilan Winbox. Sumber: Wikimedia Commons")

1. Unduh Winbox dari situs resmi mikrotik.com, lalu jalankan.
2. Hubungkan kabel dari laptop ke salah satu port router.
3. Buka tab **Neighbors**. Router di jaringan yang sama akan muncul otomatis.
4. Klik baris router, periksa kolom **Connect To**, lalu klik **Connect**.
5. Login dengan user `admin`. Password router baru bisa kosong atau tertera di stiker, tergantung model dan versi.

Ada dua cara menyambung:

| Cara        | Kolom yang dipilih | Kelebihan                                | Kekurangan                           |
| ----------- | ------------------ | ---------------------------------------- | ------------------------------------ |
| Lewat IP    | IP address         | Bisa dari jaringan lain (lewat routing)  | Butuh IP di router dan laptop        |
| Lewat MAC   | MAC address        | Bisa saat router belum punya IP          | Hanya dalam satu segmen layer 2      |

> Lewat MAC sangat berguna setelah reset konfigurasi, karena router belum punya IP sama sekali. Winbox memakai port TCP 8291 saat menyambung lewat IP.

## Tata letak Winbox

Menu ada di sisi kiri, area kerja di kanan. Setiap menu membuka jendela baru.

| Menu            | Fungsi                                                   |
| --------------- | -------------------------------------------------------- |
| **Interfaces**  | Daftar port, VLAN, tunnel, dan statusnya                 |
| **Wireless/WiFi** | Pengaturan WiFi (ada di model yang punya radio)        |
| **Bridge**      | Menggabungkan beberapa port menjadi satu segmen          |
| **IP**          | Address, DHCP, DNS, Firewall, Routes, Services           |
| **Routing**     | Protokol routing dinamis seperti OSPF dan BGP            |
| **System**      | Identity, User, Backup, Clock, Reboot, Packages          |
| **Queues**      | Manajemen bandwidth                                      |
| **Files**       | File backup dan export di router                         |
| **Log**         | Catatan kejadian router                                  |
| **Tools**       | Ping, Traceroute, Torch, Sniffer, Bandwidth Test         |
| **New Terminal**| Terminal perintah di dalam Winbox                        |

> Tampilan Winbox 3 dan Winbox 4 sedikit berbeda, tetapi menu intinya sama.

## Mengelola data di Winbox

Sebagian besar jendela berbentuk tabel dengan pola yang sama:

- Tombol **+** untuk menambah, tombol **-** untuk menghapus.
- Tombol centang untuk **enable** dan silang untuk **disable**. Baris yang nonaktif tampil abu-abu.
- Klik dua kali pada baris untuk membuka dan mengubah isinya.
- Tombol **Comment** untuk memberi catatan pada baris. Biasakan memberi komentar.
- Kolom huruf kecil di kiri baris menunjukkan flag, misalnya `D` (dynamic), `X` (disabled), atau `R` (running).

Setiap perubahan langsung berlaku setelah kamu menekan **Apply** atau **OK**. Tidak ada tombol "simpan" terpisah.

## Safe Mode

Salah mengatur IP atau firewall bisa memutus koneksi Winbox kamu sendiri. **Safe Mode** mencegah hal itu.

1. Klik tombol **Safe Mode** di pojok kiri atas Winbox.
2. Lakukan perubahan konfigurasi seperti biasa.
3. Jika koneksi tetap normal, klik **Safe Mode** lagi untuk menyimpan perubahan.
4. Jika koneksi terputus, router otomatis membatalkan semua perubahan sejak Safe Mode dinyalakan.

Di terminal, tekan `Ctrl+X` untuk masuk Safe Mode dan `Ctrl+X` lagi untuk menyimpan.

> Aktifkan Safe Mode setiap kali mengubah firewall, IP management, atau layanan akses. Ini kebiasaan paling berguna untuk teknisi jaringan.

## Quick Set atau manual

**Quick Set** adalah wizard untuk pengaturan cepat seperti internet, WiFi, dan DHCP sekaligus.

| Quick Set                              | Manual                                  |
| -------------------------------------- | --------------------------------------- |
| Cepat untuk kebutuhan rumahan          | Kamu paham setiap baris konfigurasi     |
| Banyak pengaturan otomatis             | Fleksibel untuk jaringan kompleks       |
| Sulit dipelajari cara kerjanya         | Cocok untuk belajar dan produksi        |

Untuk belajar, pakai cara manual seperti di bab sebelumnya.

## Ringkasan

- Winbox bisa tersambung lewat IP (TCP 8291) atau MAC address.
- Menu di kiri, data tampil sebagai tabel dengan tombol tambah, hapus, enable, dan disable.
- **Safe Mode** membatalkan perubahan otomatis jika koneksi terputus.
- Beri `comment` pada setiap konfigurasi agar mudah dilacak.

## Latihan

1. Sambungkan ke router lewat MAC address, lalu lewat IP.
2. Buka **IP > Addresses**, tambahkan alamat dari Winbox, lalu beri comment.
3. Aktifkan Safe Mode, ubah IP interface yang sedang kamu pakai, dan amati apa yang terjadi.
