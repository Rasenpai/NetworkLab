---
title: Address List
summary: Mengelompokkan alamat IP dalam daftar bernama, memakainya di aturan firewall, dan membuat daftar dinamis dengan timeout.
minutes: 20
---

Menulis puluhan alamat satu per satu di setiap aturan membuat firewall berantakan. Address list memecahkan masalah itu: kamu menamai sebuah kelompok alamat, lalu aturan cukup menyebut nama kelompoknya.

## Tujuan bab

- Membuat dan memakai address list.
- Memakai rentang alamat, subnet, dan nama domain di address list.
- Membuat entri sementara dengan `timeout`.
- Memahami address list dinamis yang diisi oleh aturan firewall.

## Membuat address list

Satu list terdiri dari banyak entri yang memakai `list=` yang sama.

```routeros
/ip firewall address-list add list=lan-subnets address=192.168.10.0/24 comment="LAN 1"
/ip firewall address-list add list=lan-subnets address=192.168.20.0/24 comment="LAN 2"
/ip firewall address-list add list=admin-allowed address=192.168.10.0/24 comment="Admin dari LAN 1"
/ip firewall address-list print
```

Format `address` yang diterima:

| Bentuk              | Contoh                          |
| ------------------- | ------------------------------- |
| Satu host           | `192.168.10.50`                 |
| Subnet              | `192.168.10.0/24`               |
| Rentang             | `192.168.10.10-192.168.10.20`   |
| Nama domain         | `update.contoh.id`              |

Untuk nama domain, router meminta DNS dan menyimpan hasilnya sebagai entri. Pastikan DNS router berfungsi (bab sebelumnya) agar entri ini terisi.

## Memakai address list di aturan

```routeros
/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 src-address-list=admin-allowed action=accept comment="Admin dari list admin-allowed"
```

Kebalikannya dengan tanda `!`:

```routeros
/ip firewall filter add chain=forward src-address-list=!lan-subnets in-interface-list=LAN action=drop comment="Drop sumber asing di LAN"
```

Aturan kedua di atas hanya contoh sintaks; kita tidak memasangnya di lab.

Keuntungannya: saat ada admin baru dari subnet lain, kamu cukup menambah satu entri ke `admin-allowed`, tanpa menyentuh aturan firewall.

## Entri sementara

Parameter `timeout` membuat entri hilang sendiri setelah waktu habis.

```routeros
/ip firewall address-list add list=tamu-sementara address=192.168.10.99 timeout=10m comment="Izin 10 menit"
/ip firewall address-list print where list=tamu-sementara
```

Entri dengan timeout ditandai sebagai dinamis dan sisa waktunya terlihat di kolom `timeout`. Setelah 10 menit entri itu lenyap otomatis.

## Daftar dinamis dari aturan firewall

Aksi `add-src-to-address-list` dan `add-dst-to-address-list` memasukkan alamat paket yang cocok ke sebuah list.

```routeros
/ip firewall filter add chain=input protocol=tcp dst-port=23 action=add-src-to-address-list address-list=pelaku-telnet address-list-timeout=1d comment="Catat yang mencoba Telnet"
```

Setiap perangkat yang mencoba Telnet ke router tercatat selama satu hari di list `pelaku-telnet`. Kamu bisa memakai list itu di aturan lain untuk memblokirnya. Teknik ini menjadi dasar perlindungan dari serangan di bab 8.

## Merawat address list

```routeros
/ip firewall address-list print where list=lan-subnets
/ip firewall address-list remove [find list=tamu-sementara]
/ip firewall address-list set [find list=admin-allowed address=192.168.10.0/24] comment="Admin utama"
```

Entri dinamis hilang saat router reboot, kecuali memang dibuat statis. Entri statis (tanpa `timeout`) tersimpan di konfigurasi.

## Lab: list untuk dipakai bab berikutnya

Di R1, buat list yang akan dipakai di bab 6 sampai 12:

```routeros
/ip firewall address-list add list=admin-allowed address=192.168.10.0/24 comment="Admin dari LAN 1"
/ip firewall address-list add list=lan-subnets address=192.168.10.0/24 comment="LAN 1"
/ip firewall address-list add list=lan-subnets address=192.168.20.0/24 comment="LAN 2"
```

Di R2, `admin-allowed` perlu mencakup LAN 1 dan R1 (sumber paket dari R1 adalah `10.0.0.1`):

```routeros
/ip firewall address-list add list=admin-allowed address=192.168.10.0/24 comment="Admin dari LAN 1"
/ip firewall address-list add list=admin-allowed address=10.0.0.1 comment="R1"
```

Bila daftar sudah ada dari percobaan sebelumnya, hapus dulu duplikatnya dengan `remove [find list=...]` supaya tidak ada entri ganda.

Uji entri sementara:

```routeros
/ip firewall address-list add list=uji address=192.168.10.77 timeout=30s
/ip firewall address-list print where list=uji
```

Tunggu 30 detik, lalu jalankan `print` lagi. Entri hilang sendiri.

## Troubleshooting

| Gejala                                            | Kemungkinan penyebab                           | Cek                                           |
| ------------------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| Aturan dengan `src-address-list` tidak cocok      | Nama list salah ketik (huruf besar kecil berpengaruh) | `address-list print`                  |
| Entri nama domain tidak terisi                    | DNS router tidak berfungsi                     | `/ip dns print`, `/ping contoh.id`            |
| Entri sementara hilang padahal dibutuhkan         | `timeout` terlalu singkat                      | Perpanjang timeout atau buat statis           |

## Uji pemahaman

1. Apa keuntungan memakai address list dibanding menulis alamat langsung di aturan?
2. Bagaimana membuat entri yang hilang otomatis setelah satu jam?
3. Apa fungsi aksi `add-src-to-address-list`?
4. Apa arti `src-address-list=!lan-subnets`?
5. Apa syarat agar entri berupa nama domain bisa terisi?

**Kunci jawaban**

1. Aturan lebih ringkas, dan perubahan alamat cukup dilakukan di satu tempat.
2. Tambahkan parameter `timeout=1h` saat membuat entri.
3. Memasukkan alamat sumber paket yang cocok ke sebuah list, biasanya dengan `address-list-timeout`.
4. Alamat sumber yang tidak ada di list `lan-subnets`.
5. DNS router harus berfungsi agar nama bisa diterjemahkan ke alamat IP.

## Ringkasan

- Address list mengelompokkan alamat dan dipakai lewat `src-address-list` dan `dst-address-list`.
- `timeout` membuat entri sementara; aksi `add-src-to-address-list` membuat list terisi otomatis.
- List `admin-allowed` dan `lan-subnets` akan dipakai di bab berikutnya.

## Langkah selanjutnya

Lanjutkan ke **Bab 6: Mengamankan Router**, untuk menyusun chain `input` yang melindungi R1 dan R2 dengan prinsip default deny.
