---
title: Subnetting dan VLSM
summary: Membagi satu jaringan menjadi beberapa subnet dengan ukuran yang sesuai kebutuhan.
minutes: 20
---

Satu jaringan besar sering perlu dipecah menjadi beberapa jaringan kecil, misalnya per divisi atau per lantai. Itulah subnetting.

## Tujuan belajar

- Menghitung jumlah host dan batas tiap subnet.
- Membagi jaringan menjadi subnet berukuran sama.
- Memakai **VLSM** untuk membagi subnet dengan ukuran berbeda.

## Kenapa subnetting

- **Keamanan dan pengelolaan**: tiap divisi punya jaringan sendiri.
- **Kinerja**: broadcast hanya menyebar di dalam satu subnet.
- **Efisiensi alamat**: tidak memberi 254 alamat untuk jaringan yang hanya butuh 10.

![Contoh operasi subnetting](https://commons.wikimedia.org/wiki/Special:FilePath/Subnetting_operation.svg?width=800 "Ilustrasi subnetting. Sumber: Wikimedia Commons")

## Tabel prefix yang perlu dihafal

Pada oktet terakhir, ukuran satu blok subnet adalah `256 - nilai mask`.

| Prefix | Subnet mask       | Ukuran blok | Host yang bisa dipakai |
| ------ | ----------------- | ----------- | ---------------------- |
| `/24`  | `255.255.255.0`   | 256         | 254                    |
| `/25`  | `255.255.255.128` | 128         | 126                    |
| `/26`  | `255.255.255.192` | 64          | 62                     |
| `/27`  | `255.255.255.224` | 32          | 30                     |
| `/28`  | `255.255.255.240` | 16          | 14                     |
| `/29`  | `255.255.255.248` | 8           | 6                      |
| `/30`  | `255.255.255.252` | 4           | 2                      |

Rumus host: `2^(32 - prefix) - 2`. Contoh `/27`: `2^5 - 2 = 30`.

## Membagi jaringan sama besar

Bagi `192.168.10.0/24` menjadi **4 subnet**. Empat subnet butuh 2 bit tambahan, jadi prefix baru `/26` dengan blok 64.

| Subnet | Network          | Host yang bisa dipakai            | Broadcast        |
| ------ | ---------------- | --------------------------------- | ---------------- |
| 1      | `192.168.10.0`   | `192.168.10.1` sampai `.62`       | `192.168.10.63`  |
| 2      | `192.168.10.64`  | `192.168.10.65` sampai `.126`     | `192.168.10.127` |
| 3      | `192.168.10.128` | `192.168.10.129` sampai `.190`    | `192.168.10.191` |
| 4      | `192.168.10.192` | `192.168.10.193` sampai `.254`    | `192.168.10.255` |

## Cara cepat menghitung

Untuk alamat `192.168.10.77/26`:

1. Ukuran blok `/26` adalah 64.
2. Kelipatan 64 terdekat di bawah 77 adalah 64, jadi network = `192.168.10.64`.
3. Broadcast = network + 64 - 1 = `192.168.10.127`.
4. Host: `192.168.10.65` sampai `192.168.10.126`.

## VLSM: ukuran subnet berbeda

Pada VLSM (Variable Length Subnet Mask) setiap subnet diberi prefix sesuai kebutuhan, bukan sama rata.

![Ruang alamat pada VLSM](https://commons.wikimedia.org/wiki/Special:FilePath/Address_space_in_Variable_Length_Subnet_Masking_%28VLSM%29.svg?width=800 "Ruang alamat pada VLSM. Sumber: Wikimedia Commons")

**Kasus:** dari `192.168.10.0/24` kamu butuh jaringan berikut.

| Kebutuhan        | Host | Prefix yang cukup |
| ---------------- | ---- | ----------------- |
| Kantor           | 100  | `/25` (126 host)  |
| Lab              | 50   | `/26` (62 host)   |
| Server           | 20   | `/27` (30 host)   |
| Link antar router | 2   | `/30` (2 host)    |

**Aturan:** alokasikan dari kebutuhan **terbesar** ke terkecil agar blok tidak saling tumpang tindih.

| Jaringan | Network            | Host yang bisa dipakai              | Broadcast        |
| -------- | ------------------ | ----------------------------------- | ---------------- |
| Kantor   | `192.168.10.0/25`  | `192.168.10.1` sampai `.126`        | `192.168.10.127` |
| Lab      | `192.168.10.128/26` | `192.168.10.129` sampai `.190`     | `192.168.10.191` |
| Server   | `192.168.10.192/27` | `192.168.10.193` sampai `.222`     | `192.168.10.223` |
| Link     | `192.168.10.224/30` | `192.168.10.225` dan `.226`        | `192.168.10.227` |

Sisa alamat mulai `192.168.10.228` masih bebas untuk kebutuhan berikutnya.

## Menerapkannya di RouterOS

Alamat gateway biasanya diambil dari host pertama tiap subnet:

```routeros
/ip address add address=192.168.10.1/25 interface=ether2 comment="Kantor"
/ip address add address=192.168.10.129/26 interface=ether3 comment="Lab"
/ip address add address=192.168.10.193/27 interface=ether4 comment="Server"
/ip address add address=192.168.10.225/30 interface=ether5 comment="Link ke router lain"
```

Lihat hasil perhitungan RouterOS pada kolom **NETWORK**:

```routeros
/ip address print
```

Kalau kolom itu berbeda dengan hitunganmu, periksa lagi prefix yang kamu tulis.

## Ringkasan

- Prefix lebih besar berarti subnet lebih kecil dan host lebih sedikit.
- Host yang bisa dipakai = `2^(32 - prefix) - 2`.
- Ukuran blok pada oktet terakhir = `256 - nilai mask`.
- VLSM mengalokasikan subnet dari kebutuhan terbesar ke terkecil.
- Link point-to-point antar router cukup memakai `/30`.

## Latihan

1. Tentukan network, broadcast, dan rentang host dari `192.168.1.130/25`.
2. Berapa host yang bisa dipakai pada `/28`?
3. Dari `10.10.0.0/24` bagi menjadi subnet untuk 60 host, 25 host, dan satu link router dengan VLSM.

**Kunci jawaban**

1. Network `192.168.1.128`, broadcast `192.168.1.255`, host `192.168.1.129` sampai `192.168.1.254`.
2. 14 host.
3. 60 host memakai `/26` (`10.10.0.0/26`), 25 host memakai `/27` (`10.10.0.64/27`), link router memakai `/30` (`10.10.0.96/30`).
