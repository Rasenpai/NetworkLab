---
title: Routing Statis
summary: Mengarahkan paket antar jaringan dengan route manual, default route, dan jalur cadangan.
minutes: 20
---

Router meneruskan paket antar jaringan berdasarkan **tabel routing**. Pada routing statis, kamu menulis sendiri rute-rute di tabel itu.

## Tujuan belajar

- Membaca tabel routing dan memahami route yang terbentuk otomatis.
- Membuat static route dan default route.
- Memahami prioritas rute (distance) dan jalur cadangan.
- Mengenali kesalahan umum seperti rute balik yang hilang.

## Tabel routing

![Contoh tabel routing](https://commons.wikimedia.org/wiki/Special:FilePath/Routing_Table.png?width=800 "Contoh tabel routing. Sumber: Wikimedia Commons")

```routeros
/ip route print
```

Setiap kali kamu memasang IP di interface atau DHCP client mendapat IP, router membuat route otomatis. Baris route punya flag:

| Flag | Arti                                          |
| ---- | --------------------------------------------- |
| `A`  | Active, sedang dipakai                        |
| `S`  | Static, dibuat manual                         |
| `C`  | Connected, jaringan yang terhubung langsung   |
| `d`  | Dari DHCP client                              |

Kolom penting: `DST-ADDRESS` (jaringan tujuan), `GATEWAY` (ke mana paket diteruskan), dan `DISTANCE` (prioritas).

## Cara router memilih route

1. **Prefix paling spesifik menang** (longest prefix match). Route `192.168.20.0/24` mengalahkan `0.0.0.0/0` untuk tujuan `192.168.20.5`.
2. Jika prefix sama, **distance lebih kecil** diutamakan.
3. Jika tidak ada yang cocok, paket dibuang.

## Static route

Format: jaringan tujuan dan gateway (router berikutnya).

```routeros
/ip route add dst-address=192.168.20.0/24 gateway=10.0.0.2 comment="Ke LAN cabang"
```

Artinya: untuk tujuan `192.168.20.0/24`, kirim ke `10.0.0.2`.

> **Gateway harus dapat dijangkau langsung**, yaitu berada di jaringan yang terhubung dengan router ini. Jika tidak, route akan berstatus tidak aktif.

## Default route

Default route adalah rute untuk semua tujuan yang tidak punya rute lebih spesifik, biasanya menuju internet.

```routeros
/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1 comment="Default ke ISP"
```

Jika WAN memakai DHCP client, default route dibuat otomatis.

## Contoh dua router

```
LAN 1 (192.168.10.0/24) --- R1 ---(10.0.0.0/30)--- R2 --- LAN 2 (192.168.20.0/24)
```

| Router | Interface link        | LAN                |
| ------ | --------------------- | ------------------ |
| R1     | `10.0.0.1/30`         | `192.168.10.1/24`  |
| R2     | `10.0.0.2/30`         | `192.168.20.1/24`  |

Agar kedua LAN saling terhubung, **kedua router** harus tahu rute ke LAN seberang:

```routeros
# di R1
/ip route add dst-address=192.168.20.0/24 gateway=10.0.0.2

# di R2
/ip route add dst-address=192.168.10.0/24 gateway=10.0.0.1
```

> Kesalahan paling sering: hanya membuat rute di satu sisi. Paket bisa sampai, tetapi balasannya tidak tahu jalan pulang sehingga ping tetap gagal.

## Jalur cadangan dengan distance

Jika ada dua jalur ke tujuan yang sama, distance menentukan mana yang utama.

```routeros
/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1 distance=1 comment="ISP utama"
/ip route add dst-address=0.0.0.0/0 gateway=192.168.2.1 distance=2 comment="ISP cadangan"
```

Route dengan distance 2 hanya aktif saat route distance 1 hilang. Agar router tahu gateway utama benar-benar mati, tambahkan `check-gateway=ping`:

```routeros
/ip route set [find comment="ISP utama"] check-gateway=ping
```

Tanpa itu, route tetap aktif selama interface-nya nyala walaupun ISP sudah putus.

## Route khusus

**Blackhole** membuang paket yang menuju jaringan tertentu:

```routeros
/ip route add dst-address=10.0.0.0/8 type=blackhole
```

Berguna untuk menutup jalur yang tidak boleh dilewati.

## Memeriksa route

```routeros
/ip route print where dst-address=0.0.0.0/0
/ip route check 8.8.8.8
/tool traceroute 8.8.8.8
```

`/ip route check` menampilkan gateway yang akan dipakai untuk menuju sebuah IP, jadi cepat untuk memastikan jalur yang dipilih router.

## Troubleshooting

| Gejala                                 | Penyebab umum                                | Cek                                              |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Route berstatus tidak aktif            | Gateway tidak terjangkau langsung            | Pastikan IP link benar dan gateway di jaringan yang sama |
| Ping ke LAN seberang gagal             | Rute balik belum ada                         | Periksa route di kedua router                    |
| Internet mati saat ISP utama putus     | Tidak ada `check-gateway`                    | Tambahkan `check-gateway=ping`                   |
| Paket lewat jalur yang tidak diharapkan | Ada route yang lebih spesifik               | `/ip route print`, urutkan berdasarkan prefix    |

## Ringkasan

- Route menghubungkan jaringan tujuan dengan gateway yang dituju.
- Router memilih prefix paling spesifik dulu, lalu distance terkecil.
- **Default route** `0.0.0.0/0` dipakai untuk semua tujuan lain, biasanya ke ISP.
- Kedua sisi harus punya rute agar komunikasi dua arah berjalan.
- `check-gateway=ping` membuat failover bekerja saat gateway mati.

## Latihan

1. Buat topologi dua router di lab dan hubungkan kedua LAN dengan static route.
2. Hapus rute di salah satu router dan amati perilaku ping dari kedua sisi.
3. Buat dua default route dengan distance berbeda, lalu cabut kabel jalur utama dan amati route yang aktif.
