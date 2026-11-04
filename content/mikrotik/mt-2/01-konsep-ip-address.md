---
title: Konsep IP Address
summary: Memahami alamat IPv4, subnet mask, alamat privat, dan cara perangkat memutuskan ke mana paket dikirim.
minutes: 15
---

Semua konfigurasi jaringan berawal dari IP address. Bab ini membangun dasar yang kamu butuhkan sebelum mengatur router.

## Tujuan belajar

- Membaca alamat IPv4 beserta subnet mask-nya.
- Membedakan network address, host, dan broadcast.
- Mengenali alamat privat, publik, dan alamat khusus.
- Memahami bagaimana perangkat memilih mengirim langsung atau lewat gateway.

## Alamat IPv4

![Struktur alamat IPv4](https://commons.wikimedia.org/wiki/Special:FilePath/Ipv4_address.svg?width=800 "Struktur alamat IPv4. Sumber: Wikimedia Commons")

IPv4 terdiri dari **32 bit**, ditulis sebagai empat angka (oktet) yang dipisah titik. Setiap oktet bernilai 0 sampai 255.

| Bentuk desimal | Bentuk biner                            |
| -------------- | --------------------------------------- |
| `192.168.10.1` | `11000000.10101000.00001010.00000001`   |

## Subnet mask

Alamat IP dibagi menjadi dua bagian: bagian **network** (identitas jaringan) dan bagian **host** (identitas perangkat). Subnet mask menunjukkan batas keduanya.

| Notasi CIDR | Subnet mask       | Bit network | Bit host |
| ----------- | ----------------- | ----------- | -------- |
| `/8`        | `255.0.0.0`       | 8           | 24       |
| `/16`       | `255.255.0.0`     | 16          | 16       |
| `/24`       | `255.255.255.0`   | 24          | 8        |

Notasi CIDR (misalnya `/24`) hanya menulis jumlah bit network. `192.168.10.1/24` berarti tiga oktet pertama adalah network dan oktet terakhir adalah host.

## Tiga alamat penting dalam satu jaringan

Ambil jaringan `192.168.10.0/24`:

| Peran              | Alamat           | Keterangan                                       |
| ------------------ | ---------------- | ------------------------------------------------ |
| Network address    | `192.168.10.0`   | Semua bit host bernilai 0, nama jaringan itu sendiri |
| Host yang bisa dipakai | `192.168.10.1` sampai `192.168.10.254` | Diberikan ke perangkat       |
| Broadcast address  | `192.168.10.255` | Semua bit host bernilai 1, menuju semua perangkat |

Jumlah host yang bisa dipakai adalah `2^(bit host) - 2`. Untuk `/24` hasilnya 254, karena dua alamat dipakai network dan broadcast.

## Alamat privat dan publik

Alamat **privat** hanya berlaku di jaringan lokal dan tidak dirutekan di internet. Alamat **publik** unik di seluruh internet.

| Rentang privat      | CIDR              | Contoh pemakaian         |
| ------------------- | ----------------- | ------------------------ |
| `10.0.0.0` sampai `10.255.255.255`     | `10.0.0.0/8`      | Perusahaan besar         |
| `172.16.0.0` sampai `172.31.255.255`   | `172.16.0.0/12`   | Jaringan menengah        |
| `192.168.0.0` sampai `192.168.255.255` | `192.168.0.0/16`  | Rumah dan kantor kecil   |

Perangkat dengan IP privat bisa mengakses internet lewat **NAT**, seperti yang sudah kamu konfigurasi di materi sebelumnya.

Beberapa alamat khusus yang perlu dikenali:

| Alamat / rentang  | Arti                                                       |
| ----------------- | ---------------------------------------------------------- |
| `127.0.0.0/8`     | Loopback, mengarah ke perangkat itu sendiri                |
| `169.254.0.0/16`  | Link-local, muncul saat perangkat gagal mendapat IP dari DHCP |
| `100.64.0.0/10`   | Dipakai ISP untuk CGNAT, bukan IP publik sebenarnya        |
| `0.0.0.0/0`       | Semua alamat, dipakai pada default route                   |

> Jika laptop kamu memakai IP `169.254.x.x`, artinya laptop tidak menemukan DHCP server. Cek kabel dan DHCP server di router.

## Kapan paket dikirim langsung, kapan lewat gateway

Sebelum mengirim paket, perangkat membandingkan alamat tujuan dengan jaringannya sendiri memakai subnet mask.

Contoh: laptop `192.168.10.20/24` dengan gateway `192.168.10.1`.

| Tujuan          | Satu jaringan? | Dikirim ke                    |
| --------------- | -------------- | ----------------------------- |
| `192.168.10.50` | Ya             | Langsung ke perangkat itu     |
| `8.8.8.8`       | Tidak          | **Gateway** `192.168.10.1`    |
| `192.168.20.5`  | Tidak          | **Gateway** `192.168.10.1`    |

Karena itu setiap perangkat butuh empat pengaturan: **IP address, subnet mask, gateway, dan DNS**.

## Melihat pengaturan IP

Di Windows:

```
ipconfig /all
```

Di router MikroTik:

```routeros
/ip address print
```

## Ringkasan

- IPv4 berukuran 32 bit, ditulis dalam empat oktet.
- Subnet mask (atau `/prefix`) memisahkan bagian network dan host.
- Dalam satu jaringan ada network address, rentang host, dan broadcast.
- IP privat dipakai di LAN dan butuh NAT untuk ke internet.
- Perangkat memakai subnet mask untuk menentukan kirim langsung atau lewat gateway.

## Latihan

1. Ubah `172.16.5.10` ke bentuk biner.
2. Pada `192.168.1.0/24`, sebutkan network address, broadcast, dan jumlah host.
3. Laptop `10.0.0.15/24` ingin mengirim ke `10.0.1.20`. Dikirim langsung atau lewat gateway?

**Kunci jawaban**

1. `10101100.00010000.00000101.00001010`.
2. Network `192.168.1.0`, broadcast `192.168.1.255`, host sebanyak 254.
3. Lewat gateway, karena `10.0.1.20` berada di jaringan `10.0.1.0/24`, bukan `10.0.0.0/24`.
