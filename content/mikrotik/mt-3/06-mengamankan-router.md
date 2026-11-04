---
title: Mengamankan Router (Chain Input)
summary: Menyusun chain input dengan prinsip default deny, mematikan layanan yang tidak dipakai, dan mengamankan akun admin.
minutes: 20
---

Router adalah target pertama penyerang. Jika router jatuh, seluruh jaringan di belakangnya ikut jatuh. Bab ini mengunci akses **ke router itu sendiri**.

## Tujuan bab

- Menyusun chain `input` dengan pola izinkan yang perlu, drop sisanya.
- Membatasi layanan manajemen hanya untuk admin.
- Mematikan layanan dan fitur penemuan yang tidak dipakai.
- Mengamankan akun admin.

## Pola chain input

Susunan aturan dari atas ke bawah (urutan wajib benar):

| No | Aturan                                         | Alasan                                    |
| -- | ---------------------------------------------- | ----------------------------------------- |
| 1  | Izinkan `established,related,untracked`        | Balasan dan sesi yang sedang jalan         |
| 2  | Drop `invalid`                                 | Paket tidak sah                           |
| 3  | Izinkan ICMP                                   | Agar ping dan diagnosa tetap bisa          |
| 4  | Izinkan DNS dari LAN                           | Router melayani DNS untuk klien dan R2     |
| 5  | Izinkan DHCP dari LAN                          | Router melayani DHCP                      |
| 6  | Izinkan SSH dan Winbox dari `admin-allowed`    | Manajemen hanya dari admin                |
| 7  | **Drop semua sisanya**                         | Default deny                              |

Aturan 7 harus ditambahkan **terakhir**. Jika dipasang sebelum aturan 6, kamu mengunci dirimu sendiri.

## Konfigurasi R1

Aktifkan **Safe Mode** lebih dulu, lalu pastikan interface list dan address list dari bab 4 dan 5 sudah ada.

Hapus aturan pemblokiran DNS lama dari lab sebelumnya (aturan drop akhir akan menggantikannya):

```routeros
/ip firewall filter remove [find comment="Blok DNS dari WAN"]
```

Pasang aturan chain `input`:

```routeros
/ip firewall filter
add chain=input connection-state=established,related,untracked action=accept comment="Input: izinkan established,related,untracked"
add chain=input connection-state=invalid action=drop comment="Input: drop invalid"
add chain=input protocol=icmp action=accept comment="Izinkan ICMP"
add chain=input protocol=udp dst-port=53 in-interface-list=LAN action=accept comment="DNS UDP dari LAN"
add chain=input protocol=tcp dst-port=53 in-interface-list=LAN action=accept comment="DNS TCP dari LAN"
add chain=input protocol=udp dst-port=67 in-interface-list=LAN action=accept comment="DHCP dari LAN"
add chain=input protocol=tcp dst-port=22,8291 src-address-list=admin-allowed in-interface-list=LAN action=accept comment="Admin SSH+Winbox"
add chain=input action=drop comment="Input: drop semua sisanya"
```

Karena `ether3` (link ke R2) ada di list LAN, R2 tetap bisa memakai R1 sebagai DNS, dan LAN 2 tetap bisa ping ke R1. Tetapi LAN 2 **tidak** ada di `admin-allowed`, jadi tidak bisa SSH atau Winbox ke R1.

## Konfigurasi R2

```routeros
/interface list add name=LAN
/interface list member add list=LAN interface=ether1
/interface list member add list=LAN interface=ether2
```

Lalu aturan input R2:

```routeros
/ip firewall filter
add chain=input connection-state=established,related,untracked action=accept comment="Input: izinkan established,related,untracked"
add chain=input connection-state=invalid action=drop comment="Input: drop invalid"
add chain=input protocol=icmp action=accept comment="Izinkan ICMP"
add chain=input protocol=udp dst-port=53 in-interface-list=LAN action=accept comment="DNS UDP dari LAN"
add chain=input protocol=tcp dst-port=53 in-interface-list=LAN action=accept comment="DNS TCP dari LAN"
add chain=input protocol=udp dst-port=67 in-interface-list=LAN action=accept comment="DHCP dari LAN"
add chain=input protocol=tcp dst-port=22,8291 src-address-list=admin-allowed action=accept comment="Admin SSH+Winbox"
add chain=input action=drop comment="Input: drop semua sisanya"
```

Di R2, `admin-allowed` berisi `192.168.10.0/24` dan `10.0.0.1` (bab 5), jadi admin dari LAN 1 bisa mengelola R2.

## Mematikan layanan yang tidak dipakai

Setiap layanan yang menyala adalah calon celah. Matikan yang tidak dibutuhkan:

```routeros
/ip service disable telnet,ftp,www,www-ssl,api,api-ssl
/ip service set ssh address=192.168.10.0/24
/ip service set winbox address=192.168.10.0/24
/ip service print
```

Di R2, ganti alamat dengan `192.168.10.0/24,10.0.0.1/32`.

Lapisan ini bekerja **ganda** dengan firewall: walau aturan firewall gagal, layanan sendiri menolak alamat lain.

Matikan fitur penemuan dan layanan bantu:

```routeros
/tool mac-server set allowed-interface-list=none
/tool mac-server mac-winbox set allowed-interface-list=none
/tool mac-server ping set enabled=no
/ip neighbor discovery-settings set discover-interface-list=none
/tool bandwidth-server set enabled=no
/ip ssh set strong-crypto=yes
```

**Peringatan:** setelah MAC server dimatikan, kamu tidak bisa lagi mengakses router lewat alamat MAC. Pastikan akses lewat IP sudah terbukti jalan sebelum menjalankannya.

## Mengamankan akun

Jangan biarkan akun `admin` dengan nama dan kata sandi bawaan.

```routeros
/user add name=netadmin group=full password="GantiDenganSandiKuat!2026"
/user disable admin
/user print
```

Login dulu dengan `netadmin` untuk memastikan berhasil, baru nonaktifkan `admin`. Kata sandi kuat: minimal 12 karakter, campuran huruf, angka, dan simbol.

## Pengujian

| Langkah | Dari          | Perintah                         | Hasil yang diharapkan                   |
| ------- | ------------- | -------------------------------- | --------------------------------------- |
| 1       | Laptop LAN 1  | `ping 192.168.10.1`              | Berhasil                                |
| 2       | Laptop LAN 1  | `ssh netadmin@192.168.10.1`      | Berhasil login                          |
| 3       | Laptop LAN 2  | `ping 10.0.0.1`                  | Berhasil                                |
| 4       | Laptop LAN 2  | `ssh netadmin@10.0.0.1`          | Timeout (ditolak firewall)              |
| 5       | Laptop LAN 2  | `nslookup google.com 192.168.20.1` | Berhasil (DNS tetap jalan)            |
| 6       | Laptop LAN 1  | Dapatkan IP baru (`ipconfig /renew`) | Mendapat `192.168.10.x`            |

Cek counter untuk melihat aturan drop terakhir bekerja:

```routeros
/ip firewall filter print stats where comment~"drop semua sisanya"
```

## Troubleshooting

| Gejala                                       | Kemungkinan penyebab                              | Cek                                       |
| -------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| Terputus dari router setelah aturan drop      | Aturan admin berada di bawah drop atau salah subnet | Safe Mode membatalkan; periksa urutan  |
| R2 tidak bisa resolve DNS                    | `ether3` tidak masuk list LAN di R1               | `/interface list member print`            |
| Klien tidak dapat IP                         | DHCP tidak diizinkan oleh firewall                | Periksa aturan DHCP dan list LAN          |
| Tidak bisa login Winbox via MAC              | MAC server dimatikan                              | Gunakan alamat IP                         |

## Uji pemahaman

1. Kenapa aturan `drop` terakhir harus ditambahkan paling akhir?
2. Kenapa `ether3` dimasukkan ke list LAN di R1?
3. Apa gunanya membatasi layanan lewat `/ip service` jika firewall sudah ada?
4. Kenapa akun `admin` bawaan sebaiknya dinonaktifkan?
5. Apa risiko mematikan MAC server?

**Kunci jawaban**

1. Jika dipasang lebih awal, ia membuang paket sebelum aturan izin dibaca sehingga admin terkunci.
2. Agar R2 dan LAN 2 tetap dapat memakai DNS dan ping R1 yang melewati `ether3`.
3. Menjadi lapisan pertahanan kedua; jika salah satu gagal, yang lain tetap melindungi.
4. Nama pengguna bawaan sudah diketahui semua orang, sehingga penyerang hanya perlu menebak kata sandinya.
5. Akses lewat alamat MAC hilang, jadi akses via IP harus sudah dipastikan jalan.

## Ringkasan

- Chain `input` memakai default deny: izinkan yang perlu, drop sisanya sebagai aturan terakhir.
- Batasi manajemen ke `admin-allowed`, matikan layanan dan fitur penemuan yang tidak dipakai.
- Ganti akun admin bawaan dan pakai kata sandi kuat.

## Langkah selanjutnya

Lanjutkan ke **Bab 7: Melindungi Jaringan LAN (Chain Forward)**, untuk mengatur lalu lintas yang melewati router, termasuk segmentasi LAN 1 dan LAN 2.
