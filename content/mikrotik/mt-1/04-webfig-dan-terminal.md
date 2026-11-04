---
title: WebFig dan Terminal
summary: Mengakses router lewat browser, SSH, dan terminal, plus dasar perintah CLI RouterOS.
minutes: 15
---

Selain Winbox, RouterOS bisa dikelola lewat browser (WebFig) dan baris perintah (terminal). Terminal sangat penting karena semua perintah di materi ini ditulis dalam bentuk CLI.

## Tujuan belajar

- Membuka WebFig dari browser.
- Masuk ke terminal lewat Winbox dan SSH.
- Memahami struktur menu dan perintah dasar CLI.
- Memakai Tab dan tanda tanya (`?`) untuk bantuan.

## Cara mengakses router

| Cara      | Alamat atau port           | Cocok untuk                                  |
| --------- | -------------------------- | -------------------------------------------- |
| Winbox    | TCP 8291                   | Konfigurasi sehari-hari                      |
| WebFig    | `http://IP-router`, port 80 | Akses cepat dari HP atau komputer tanpa Winbox |
| SSH       | TCP 22                     | Remote aman, scripting, otomatisasi          |
| Telnet    | TCP 23                     | Tidak aman, sebaiknya dimatikan              |

**WebFig** tampil mirip Winbox tetapi berjalan di browser. Buka alamat router, misalnya `http://192.168.10.1`, lalu login. Layanan yang dipakai adalah `www`, jadi WebFig tidak bisa dibuka jika layanan itu dimatikan.

> WebFig lewat HTTP biasa tidak terenkripsi. Untuk akses lebih aman gunakan layanan `www-ssl` (HTTPS) yang butuh sertifikat, atau batasi akses hanya dari jaringan LAN.

## Membuka terminal

Ada tiga cara:

- Di Winbox, klik **New Terminal**.
- Lewat SSH dari laptop: `ssh admin@192.168.10.1`.
- Lewat program SSH client seperti PuTTY di Windows.

![PuTTY di Windows 11](https://commons.wikimedia.org/wiki/Special:FilePath/PuTTY_on_Windows_11.png?width=800 "Contoh PuTTY, SSH client populer di Windows. Sumber: Wikimedia Commons")

## Struktur menu

Perintah RouterOS disusun seperti folder. Setiap bagian dipisah spasi atau garis miring.

```routeros
/ip address print
```

Perintah di atas artinya: masuk menu `ip`, lalu submenu `address`, lalu jalankan `print`.

Kamu juga bisa masuk ke satu menu dulu, lalu menjalankan beberapa perintah di dalamnya:

```routeros
/ip address
print
add address=192.168.20.1/24 interface=ether3
..
/
```

Kegunaan simbol navigasi:

| Simbol | Arti                                  |
| ------ | ------------------------------------- |
| `/`    | Kembali ke menu paling atas           |
| `..`   | Naik satu tingkat menu                |
| `?`    | Menampilkan bantuan di posisi saat ini |
| Tab    | Melengkapi perintah secara otomatis   |

## Perintah dasar

Hampir semua menu punya perintah yang sama:

| Perintah  | Fungsi                       | Contoh                                              |
| --------- | ---------------------------- | --------------------------------------------------- |
| `print`   | Menampilkan data             | `/ip address print`                                 |
| `add`     | Menambah baris baru          | `/ip address add address=10.0.0.1/24 interface=ether3` |
| `set`     | Mengubah baris yang ada      | `/ip address set 0 comment="LAN"`                   |
| `remove`  | Menghapus baris              | `/ip address remove 0`                              |
| `enable`  | Mengaktifkan baris           | `/ip address enable 0`                              |
| `disable` | Menonaktifkan baris          | `/ip address disable 0`                             |

Angka `0` adalah nomor baris yang terlihat di hasil `print`. Nomor itu bisa berubah setelah ada data yang dihapus, jadi lihat dulu dengan `print` sebelum `set` atau `remove`.

## Mencari dan memfilter data

```routeros
/ip address print detail
/ip address print where interface=ether2
/ip firewall nat print where chain=srcnat
```

- `detail` menampilkan semua parameter setiap baris.
- `where` memfilter baris berdasarkan nilai parameter.

Untuk mengubah baris berdasarkan isinya, bukan nomornya, pakai `find`:

```routeros
/ip address set [find interface=ether2] comment="Gateway LAN"
```

Cara ini lebih aman karena tidak bergantung pada nomor baris.

## Memakai bantuan

Ketik awal perintah lalu tekan **Tab** untuk melengkapi. Ketik `?` di posisi mana pun untuk melihat pilihan yang tersedia:

```routeros
/ip ?
/ip address ?
/ip address add ?
```

Kalau lupa nama parameter, `?` setelah `add` akan menampilkan daftar semua parameter yang bisa diisi.

## Winbox, WebFig, atau terminal?

| Situasi                                   | Pilihan terbaik |
| ----------------------------------------- | --------------- |
| Konfigurasi harian, melihat banyak data   | Winbox          |
| Tidak bisa memasang Winbox                | WebFig          |
| Menyalin konfigurasi, dokumentasi, script | Terminal        |
| Akses remote lewat internet               | SSH             |

Semua cara itu mengubah konfigurasi yang sama, jadi hasilnya identik.

## Ringkasan

- Router bisa diakses lewat Winbox, WebFig (HTTP), SSH, dan Telnet. Hindari Telnet.
- Perintah CLI berbentuk menu bertingkat: `/menu submenu perintah parameter`.
- `print`, `add`, `set`, `remove`, `enable`, dan `disable` ada di hampir semua menu.
- Gunakan `where` untuk memfilter dan `find` untuk menargetkan baris.
- Tab melengkapi perintah, `?` menampilkan bantuan.

## Latihan

1. Buka WebFig dari browser dan bandingkan tampilannya dengan Winbox.
2. Masuk ke router lewat SSH dari laptop.
3. Tambahkan IP `10.10.10.1/24` pada `ether3`, ubah komentarnya dengan `find`, lalu hapus lagi.
