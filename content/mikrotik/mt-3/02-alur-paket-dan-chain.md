---
title: Alur Paket & Chain
summary: Memahami jalur paket di dalam RouterOS (prerouting, input, forward, output, postrouting) agar aturan dipasang di chain yang tepat.
minutes: 20
---

Kesalahan paling umum pemula adalah memasang aturan di chain yang salah, lalu bingung kenapa aturan tidak berefek. Bab ini memetakan perjalanan paket di dalam router.

## Tujuan bab

- Menyebutkan lima titik pemeriksaan paket di RouterOS.
- Menentukan chain yang tepat untuk sebuah kebutuhan.
- Membuktikan jalur paket dengan aturan `log`.

## Lima titik pemeriksaan

```
                       +--> input --> proses lokal router --> output --+
                       |                                                |
 masuk --> prerouting --+                                                +--> postrouting --> keluar
                       |                                                |
                       +--> (keputusan routing) --> forward ------------+
```

| Chain         | Dilewati oleh                                   | Contoh pemakaian                         |
| ------------- | ----------------------------------------------- | ---------------------------------------- |
| `prerouting`  | Semua paket yang masuk, sebelum keputusan routing | `dstnat`, `raw`, penandaan di `mangle`  |
| `input`       | Paket yang **tujuannya router itu sendiri**     | Melindungi Winbox, SSH, DNS router       |
| `forward`     | Paket yang **melewati** router ke tujuan lain   | Mengatur lalu lintas antar jaringan      |
| `output`      | Paket yang **dibuat oleh router**               | Ping dari router, update, NTP            |
| `postrouting` | Semua paket yang keluar                         | `srcnat` dan masquerade                  |

Aturan mudah diingat:

- Tujuan paket adalah router → **input**.
- Paket hanya numpang lewat → **forward**.
- Paket berasal dari router → **output**.

## Chain yang tersedia di tiap tabel

| Tabel    | Chain                                              |
| -------- | -------------------------------------------------- |
| `raw`    | `prerouting`, `output`                             |
| `mangle` | `prerouting`, `input`, `forward`, `output`, `postrouting` |
| `nat`    | `dstnat`, `srcnat`                                 |
| `filter` | `input`, `forward`, `output`                       |

Di tabel `nat`, chain `dstnat` dijalankan pada tahap prerouting (sebelum routing), sedangkan `srcnat` pada tahap postrouting (sesudah routing). Karena itu, di chain `forward`, alamat tujuan sebuah paket yang kena dst-nat sudah berupa alamat **setelah** diterjemahkan.

## Contoh jalur di topologi kita

| Skenario                                        | Chain yang dilewati di R1                                   |
| ----------------------------------------------- | ----------------------------------------------------------- |
| Laptop LAN 1 `ping 192.168.10.1`                | `prerouting` → `input`                                      |
| Laptop LAN 2 buka google.com                    | `prerouting` → `forward` → `postrouting` (masquerade)       |
| Laptop LAN 1 `ping 192.168.20.1` (router R2)    | `prerouting` → `forward` → `postrouting`                    |
| R1 menjalankan `/ping 8.8.8.8`                  | `output` → `postrouting`                                    |
| Balasan dari internet ke laptop LAN 2           | `prerouting` → `forward` → `postrouting`                    |

Perhatikan: paket dari LAN 2 ke internet **tidak** melewati `input` di R1, jadi aturan `input` tidak mengatur akses internet klien. Itu tugas `forward`.

## Lab: membuktikan jalur paket

Pasang tiga aturan log di R1:

```routeros
/ip firewall filter add chain=input protocol=icmp action=log log-prefix="INP" comment="Uji alur"
/ip firewall filter add chain=forward protocol=icmp action=log log-prefix="FWD" comment="Uji alur"
/ip firewall filter add chain=output protocol=icmp action=log log-prefix="OUT" comment="Uji alur"
```

Lakukan tiga pengujian, satu per satu:

| Pengujian                                  | Perintah                  | Log yang muncul |
| ------------------------------------------ | ------------------------- | --------------- |
| Laptop LAN 1 ke router R1                  | `ping 192.168.10.1`       | `INP`           |
| Laptop LAN 2 ke internet                   | `ping 8.8.8.8`            | `FWD`           |
| Dari R1 ke internet                        | `/ping 8.8.8.8 count=2`   | `OUT`           |

Lihat hasilnya:

```routeros
/log print where message~"INP" or message~"FWD" or message~"OUT"
```

Hapus aturan uji supaya log tidak penuh:

```routeros
/ip firewall filter remove [find comment="Uji alur"]
```

## Troubleshooting

| Gejala                                              | Kemungkinan penyebab                              | Cek                                           |
| --------------------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Aturan `input` tidak memengaruhi akses internet klien | Paket klien lewat `forward`, bukan `input`      | Pindahkan aturan ke chain `forward`           |
| Aturan tidak pernah cocok                           | Chain atau interface salah                        | `print stats`, lihat counter                  |
| Log tidak muncul                                    | Aturan log berada di bawah aturan `accept` atau `drop` | Cek urutan dengan `print`                |

## Uji pemahaman

1. Chain apa yang dilewati paket dari laptop ke internet?
2. Chain apa yang dipakai untuk melindungi Winbox router?
3. Di chain mana masquerade bekerja?
4. Kenapa ping dari R1 ke 8.8.8.8 muncul di chain `output`?
5. Di chain `forward`, alamat tujuan paket port forwarding sudah berupa alamat asli atau alamat sebelum diterjemahkan?

**Kunci jawaban**

1. `prerouting`, `forward`, lalu `postrouting`.
2. `input`, karena tujuan paketnya adalah router sendiri.
3. `srcnat`, yang berjalan di tahap postrouting.
4. Karena paket itu dibuat oleh router sendiri.
5. Sudah alamat setelah diterjemahkan, karena dst-nat berjalan di prerouting sebelum `forward`.

## Ringkasan

- Router sendiri → `input`; numpang lewat → `forward`; dibuat router → `output`.
- `dstnat` terjadi sebelum routing, `srcnat` sesudahnya.
- Aturan `log` adalah alat bantu paling cepat untuk membuktikan jalur paket.

## Langkah selanjutnya

Lanjutkan ke **Bab 3: Connection Tracking**, untuk memahami bagaimana router mengingat koneksi dan apa arti status `new`, `established`, `related`, dan `invalid`.
