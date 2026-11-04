---
title: DHCP Server
summary: Membagikan IP otomatis ke client lewat pool, network, dan server DHCP, termasuk static lease.
minutes: 20
---

Mengatur IP manual di setiap perangkat tidak praktis dan mudah salah. **DHCP server** membagikan IP, gateway, dan DNS otomatis ke semua client.

## Tujuan belajar

- Memahami proses DHCP dari awal sampai client mendapat IP.
- Membuat DHCP server lengkap: pool, server, dan network.
- Mengatur lease time dan mengelola lease.
- Membuat IP tetap untuk perangkat tertentu (static lease).

## Cara kerja DHCP

![Urutan alokasi alamat DHCP](https://commons.wikimedia.org/wiki/Special:FilePath/DHCP_-_A_new_Address_Allocating_Sequence_Diagram_-_en.png?width=800 "Urutan alokasi alamat DHCP. Sumber: Wikimedia Commons")

Prosesnya disebut **DORA**:

| Tahap            | Pengirim | Isi                                         |
| ---------------- | -------- | ------------------------------------------- |
| **D**iscover     | Client   | "Adakah DHCP server di sini?" (broadcast)   |
| **O**ffer        | Server   | "Saya tawarkan IP ini untukmu"              |
| **R**equest      | Client   | "Saya mau memakai IP tersebut"              |
| **A**cknowledge  | Server   | "Baik, IP itu milikmu selama masa lease"    |

## Tiga komponen DHCP server

| Komponen    | Fungsi                                                | Perintah                     |
| ----------- | ----------------------------------------------------- | ---------------------------- |
| **Pool**    | Rentang IP yang boleh dibagikan                       | `/ip pool`                   |
| **Server**  | Layanan DHCP yang aktif pada interface tertentu       | `/ip dhcp-server`            |
| **Network** | Parameter yang dikirim ke client: gateway dan DNS     | `/ip dhcp-server network`    |

## Membuat DHCP server

Pastikan interface LAN (misalnya `bridge-lan`) sudah punya IP `192.168.10.1/24`.

```routeros
/ip pool add name=pool-lan ranges=192.168.10.10-192.168.10.200
/ip dhcp-server add name=dhcp-lan interface=bridge-lan address-pool=pool-lan disabled=no
/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1
```

Alamat `192.168.10.1` sampai `.9` dan `.201` sampai `.254` sengaja tidak masuk pool, jadi bisa dipakai untuk perangkat dengan IP tetap.

Wizard interaktif juga tersedia dan menanyakan semua parameter satu per satu:

```routeros
/ip dhcp-server setup
```

## Lease time

Lease adalah masa pakai IP yang dipinjamkan ke client. Client akan memperbarui sebelum masa itu habis.

```routeros
/ip dhcp-server set dhcp-lan lease-time=1d
```

| Lease pendek (misalnya 10 menit)               | Lease panjang (misalnya 1 hari atau lebih)      |
| ---------------------------------------------- | ----------------------------------------------- |
| IP cepat kembali ke pool                       | Alamat client stabil                            |
| Cocok untuk WiFi tamu dan perangkat berganti   | Cocok untuk kantor dengan perangkat tetap       |

## Melihat dan mengelola lease

```routeros
/ip dhcp-server print
/ip dhcp-server lease print
/ip pool used print
```

Status lease yang sering muncul:

| Status    | Arti                                           |
| --------- | ---------------------------------------------- |
| `bound`   | Client aktif memakai IP tersebut               |
| `waiting` | Lease sudah dibuat tetapi client belum terlihat |
| `offered` | Server sudah menawarkan IP, client belum menerima |

## Static lease (IP tetap per perangkat)

Untuk printer, server, atau CCTV, kamu ingin IP yang selalu sama tanpa mengatur manual di perangkat. Gunakan static lease berdasarkan MAC address:

```routeros
/ip dhcp-server lease add address=192.168.10.50 mac-address=AA:BB:CC:DD:EE:FF server=dhcp-lan comment="Printer kantor"
```

Alamat statis sebaiknya tetap berada di dalam subnet, tetapi **di luar** rentang pool agar tidak bentrok.

Jika perangkat sudah mendapat lease dinamis, ubah jadi tetap tanpa mengetik ulang:

```routeros
/ip dhcp-server lease make-static [find where mac-address="AA:BB:CC:DD:EE:FF"]
```

Hapus lease yang tidak dipakai:

```routeros
/ip dhcp-server lease remove [find where comment="Printer kantor"]
```

## Parameter tambahan di network

```routeros
/ip dhcp-server network set [find address=192.168.10.0/24] domain=networklab.local
```

Selain gateway dan DNS, network juga bisa membagikan domain, NTP server, dan opsi lain.

## Troubleshooting

| Gejala                              | Penyebab umum                                  | Cek                                        |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| Client mendapat IP `169.254.x.x`    | DHCP server tidak terjangkau                   | Kabel, `/ip dhcp-server print`             |
| Server berstatus `invalid`          | Interface tidak punya IP di subnet pool        | `/ip address print`                        |
| Pool habis                          | Lease terlalu lama atau pool terlalu kecil     | `/ip pool used print`, perluas pool        |
| Client dapat IP tapi tidak bisa internet | Gateway atau DNS di network salah         | `/ip dhcp-server network print`            |

## Ringkasan

- DHCP bekerja lewat tahap Discover, Offer, Request, Acknowledge.
- Server DHCP terdiri dari **pool**, **server**, dan **network**.
- Lease time menentukan seberapa lama IP dipinjamkan.
- **Static lease** memberi IP tetap berdasarkan MAC address.

## Latihan

1. Buat DHCP server untuk `192.168.10.0/24` dengan pool `.10` sampai `.200`.
2. Hubungkan laptop, lalu cek lease-nya di `/ip dhcp-server lease print`.
3. Jadikan laptop itu memakai IP tetap `192.168.10.50` dengan static lease.
