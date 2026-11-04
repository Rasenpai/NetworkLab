---
title: IP Address di RouterOS
summary: Menambah, melihat, mengubah, dan menghapus IP address, serta membaca tabel ARP.
minutes: 15
---

Setelah paham konsep IP, saatnya menerapkannya di router. Di RouterOS alamat IP selalu dipasang pada sebuah **interface**.

## Tujuan belajar

- Menambah dan mengelola IP address pada interface.
- Membaca kolom hasil `print` dengan benar.
- Menghindari kesalahan umum seperti subnet bentrok.
- Memahami fungsi tabel ARP.

## Menambah IP address

Format penulisan memakai notasi CIDR:

```routeros
/ip address add address=192.168.10.1/24 interface=ether2 comment="Gateway LAN"
```

Lihat hasilnya:

```routeros
/ip address print
```

Kolom pentingnya:

| Kolom       | Isi                                                        |
| ----------- | ---------------------------------------------------------- |
| `ADDRESS`   | IP router beserta prefix                                   |
| `NETWORK`   | Network address yang dihitung otomatis                     |
| `INTERFACE` | Interface tempat IP dipasang                               |
| Flag `X`    | Baris sedang dinonaktifkan                                 |
| Flag `D`    | Baris dinamis, misalnya dari DHCP client                   |

## Mengelola IP address

```routeros
/ip address print detail
/ip address print where interface=ether2
/ip address set [find interface=ether2] comment="LAN kantor"
/ip address disable [find interface=ether2]
/ip address enable [find interface=ether2]
/ip address remove [find interface=ether2]
```

`find` lebih aman daripada nomor baris karena nomor bisa bergeser setelah ada baris yang dihapus.

## Lebih dari satu IP pada satu interface

Satu interface boleh memiliki beberapa IP, misalnya saat memindahkan jaringan lama ke yang baru:

```routeros
/ip address add address=192.168.20.1/24 interface=ether2 comment="Jaringan tambahan"
```

Client di kedua subnet memakai router sebagai gateway masing-masing. Cara ini praktis, tetapi mereka berbagi satu segmen layer 2 sehingga tidak terpisah secara keamanan.

## Kesalahan yang sering terjadi

| Kesalahan                                 | Akibat                                              | Perbaikan                                      |
| ----------------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| Memakai subnet yang sama di dua interface | Routing tidak jelas, paket salah arah               | Beri setiap interface subnet sendiri           |
| Lupa menulis prefix                       | Router memakai prefix yang tidak sesuai             | Selalu tulis `/24`, `/30`, dan seterusnya      |
| Gateway client salah                      | Client hanya bisa akses sesama jaringan             | Gateway harus IP router di subnet yang sama    |
| IP bentrok dengan perangkat lain          | Koneksi putus-putus pada kedua perangkat            | Pakai DHCP atau catat IP tetap dengan rapi     |
| Mengubah IP interface yang sedang dipakai | Koneksi Winbox terputus                             | Aktifkan Safe Mode atau sambung lewat MAC      |

> Sebelum mengubah IP pada interface yang kamu pakai untuk mengakses router, aktifkan **Safe Mode** agar konfigurasi otomatis kembali kalau koneksi terputus.

## Tabel ARP

Switch dan router mengirim data memakai **MAC address**, tetapi kita mengatur jaringan memakai IP. **ARP** menghubungkan keduanya: perangkat menyiarkan "siapa pemilik IP ini?" dan pemiliknya membalas dengan MAC address-nya.

![Cara kerja protokol ARP](https://commons.wikimedia.org/wiki/Special:FilePath/Protocol_ARP.svg?width=800 "Cara kerja ARP. Sumber: Wikimedia Commons")

Lihat tabel ARP router:

```routeros
/ip arp print
/ip arp print where interface=ether2
```

Tabel ini berguna untuk melihat perangkat apa saja yang aktif di LAN. Entri yang berstatus `incomplete` artinya perangkat tidak membalas, misalnya kabel lepas atau perangkat mati.

```routeros
/ip arp print where status=incomplete
```

## IP address WAN

IP di sisi WAN biasanya tidak diisi manual, tetapi diambil dari ISP lewat DHCP client (dibahas di bab 6). Jika ISP memberi IP tetap, tambahkan seperti biasa beserta route default:

```routeros
/ip address add address=203.0.113.2/30 interface=ether1 comment="WAN"
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1
```

Alamat `203.0.113.x` di sini hanya contoh dokumentasi. Pakai IP dan gateway dari ISP kamu.

## Ringkasan

- IP dipasang pada interface dengan `/ip address add address=... interface=...`.
- Selalu sertakan prefix dan beri `comment` pada setiap alamat.
- Gunakan `find` dan `where` untuk menargetkan baris tertentu.
- Beri subnet berbeda untuk setiap interface.
- ARP menerjemahkan IP ke MAC, dan tabelnya membantu melihat perangkat yang aktif.

## Latihan

1. Tambahkan IP `192.168.30.1/24` pada `ether3`, beri komentar, lalu nonaktifkan dan hapus.
2. Lihat tabel ARP, lalu hubungkan satu laptop ke `ether2` dan amati entri baru yang muncul.
3. Coba tambahkan IP yang sama persis di dua interface berbeda. Apa pesan yang muncul?
