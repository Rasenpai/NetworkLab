---
title: Melindungi Jaringan LAN (Chain Forward)
summary: Mengatur lalu lintas yang melewati router, memblokir akses dari WAN, dan membuat segmentasi antara LAN 1 dan LAN 2.
minutes: 20
---

Bab 6 melindungi router. Bab ini melindungi **perangkat di belakang router** dan mengatur siapa boleh menghubungi siapa di antara dua LAN.

## Tujuan bab

- Menyusun chain `forward` yang aman.
- Memblokir koneksi baru dari WAN ke LAN.
- Menerapkan segmentasi: LAN 1 boleh memulai koneksi ke LAN 2, tetapi tidak sebaliknya.
- Membuat pengecualian terarah dengan aturan spesifik.

## Kebijakan yang akan kita terapkan

| Arah lalu lintas              | Kebijakan                                            |
| ----------------------------- | ---------------------------------------------------- |
| LAN 1 → internet              | Boleh                                                |
| LAN 2 → internet              | Boleh                                                |
| LAN 1 → LAN 2                 | Boleh (admin dan layanan internal)                   |
| LAN 2 → LAN 1                 | Dilarang, kecuali pengecualian khusus                |
| Internet → LAN                | Dilarang (kecuali port forwarding di bab 10)         |

Contoh pemakaian nyata: LAN 1 berisi komputer admin, LAN 2 berisi perangkat tamu atau IoT. Perangkat tamu tidak boleh menjangkau komputer admin, tetapi admin masih bisa mengakses perangkat tamu untuk perawatan.

## Pola chain forward

Aturan dipasang di **R1**, karena semua lalu lintas antar LAN dan ke internet melewatinya.

| No | Aturan                                              | Fungsi                                  |
| -- | --------------------------------------------------- | --------------------------------------- |
| 1  | Fasttrack untuk `established,related`               | Mempercepat koneksi yang sudah berjalan |
| 2  | Izinkan `established,related,untracked`             | Balasan dan sesi berjalan                |
| 3  | Drop `invalid`                                      | Paket tidak sah                         |
| 4  | Drop koneksi baru dari WAN                          | Melindungi LAN dari internet            |
| 5  | Drop koneksi baru LAN 2 → LAN 1                     | Segmentasi                              |

Tanpa aturan penutup "drop semua", sisanya (LAN ke internet, LAN 1 ke LAN 2) lolos karena kebijakan bawaan chain `forward` adalah mengizinkan.

## Konfigurasi R1

```routeros
/ip firewall filter
add chain=forward connection-state=established,related action=fasttrack-connection comment="Fasttrack"
add chain=forward connection-state=established,related,untracked action=accept comment="Forward: izinkan established,related,untracked"
add chain=forward connection-state=invalid action=drop comment="Forward: drop invalid"
add chain=forward in-interface-list=WAN connection-state=new action=drop comment="Drop WAN ke LAN"
add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.0/24 connection-state=new action=drop comment="Segmentasi: LAN 2 ke LAN 1"
```

Catatan penting:

- Fasttrack harus berada **di atas** aturan `established,related`, jika tidak ia tidak pernah dijalankan. Ingat bahwa fasttrack melewati `queue`; jika nanti kamu memakai simple queue untuk membatasi bandwidth, hapus aturan fasttrack.
- Aturan segmentasi hanya memblokir koneksi `new`. Balasan atas koneksi yang dimulai LAN 1 berstatus `established` dan lolos di aturan 2, jadi admin di LAN 1 tetap bisa mengakses LAN 2 dengan normal.
- Gaya alternatif yang juga umum: `in-interface-list=WAN connection-state=new connection-nat-state=!dstnat action=drop`. Aturan ini menjatuhkan koneksi baru dari WAN **kecuali** yang sudah di-dst-nat. Di materi ini kita memilih gaya yang lebih ketat dan menambahkan izin eksplisit untuk setiap port forwarding (bab 10).

## Pengecualian terarah

Misalkan printer di LAN 1 (`192.168.10.60`) perlu diakses dari LAN 2 hanya pada port 631 (IPP). Pasang aturan **di atas** aturan segmentasi:

```routeros
/ip firewall filter add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.60 protocol=tcp dst-port=631 connection-state=new action=accept place-before=[find comment="Segmentasi: LAN 2 ke LAN 1"] comment="Pengecualian: LAN 2 ke printer"
```

Hanya satu host dan satu port yang dibuka, bukan seluruh LAN 1.

## Pengujian

| Langkah | Dari          | Perintah                              | Hasil yang diharapkan                       |
| ------- | ------------- | ------------------------------------- | ------------------------------------------- |
| 1       | Laptop LAN 1  | `ping 8.8.8.8`                        | Berhasil                                    |
| 2       | Laptop LAN 2  | `ping 8.8.8.8`                        | Berhasil                                    |
| 3       | Laptop LAN 1  | `ping 192.168.20.10` (laptop LAN 2)   | Berhasil                                    |
| 4       | Laptop LAN 2  | `ping 192.168.10.10` (laptop LAN 1)   | Request timed out                           |
| 5       | Laptop LAN 2  | `ping 192.168.10.1` (router R1)       | Berhasil (itu chain `input`, bukan `forward`) |
| 6       | Laptop LAN 2  | `ping 192.168.20.1` (router R2)       | Berhasil                                    |

Langkah 4 dan 5 sengaja dibandingkan: ping ke laptop LAN 1 melewati `forward` dan diblokir, sedangkan ping ke R1 hanya masuk `input` yang mengizinkan ICMP.

Lihat counter:

```routeros
/ip firewall filter print stats where chain=forward
```

## Troubleshooting

| Gejala                                         | Kemungkinan penyebab                              | Cek                                            |
| ---------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| LAN 1 tidak bisa ke LAN 2                      | Aturan drop terlalu umum atau route hilang         | `/ip route print`, `print stats`               |
| Sesi lama putus setelah aturan baru            | Aturan `established` berada di bawah aturan drop   | Pindahkan aturan 2 ke atas                     |
| Pembatasan bandwidth tidak berfungsi           | Fasttrack melewati queue                           | Nonaktifkan atau hapus aturan fasttrack        |
| Pengecualian tidak berefek                     | Aturan pengecualian berada di bawah aturan drop    | `move` ke atas aturan segmentasi               |

## Uji pemahaman

1. Kenapa aturan segmentasi hanya memblokir `connection-state=new`?
2. Kenapa ping dari LAN 2 ke R1 berhasil sedangkan ke laptop LAN 1 gagal?
3. Kenapa fasttrack harus berada di atas aturan `established,related`?
4. Apa kelemahan fasttrack terkait queue?
5. Bagaimana membuka akses LAN 2 hanya ke satu printer pada satu port?

**Kunci jawaban**

1. Agar balasan dari koneksi yang dimulai LAN 1 tetap lolos sebagai `established`.
2. Ping ke R1 masuk chain `input` yang mengizinkan ICMP; ping ke laptop melewati chain `forward` yang memblokir LAN 2 ke LAN 1.
3. Jika di bawahnya, paket sudah diterima oleh aturan `accept` dan tidak pernah sampai ke aturan fasttrack.
4. Paket yang difasttrack tidak diproses queue, jadi pembatasan bandwidth tidak berlaku.
5. Tambahkan aturan `accept` dengan `dst-address` printer dan `dst-port` spesifik di atas aturan segmentasi.

## Ringkasan

- Chain `forward` mengatur lalu lintas yang melewati router, baik ke internet maupun antar LAN.
- Blokir `new` dari WAN, dan segmentasi dengan memblokir `new` dari jaringan yang kurang dipercaya.
- Pengecualian dibuat spesifik dan ditaruh di atas aturan drop.

## Langkah selanjutnya

Lanjutkan ke **Bab 8: Perlindungan dari Serangan Umum**, untuk menangani brute force, port scan, dan banjir koneksi.
