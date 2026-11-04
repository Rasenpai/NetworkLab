---
title: Lab Akhir dan Ringkasan
summary: Menyusun semua materi menjadi satu konfigurasi lengkap, lalu menguji pemahamanmu.
minutes: 10
---

Ini bab penutup. Kamu menggabungkan semua yang sudah dipelajari menjadi satu konfigurasi router yang rapi dan cukup aman untuk jaringan lokal.

## Tujuan lab

Membangun router yang:

- Punya nama, label port, dan waktu yang benar.
- Menyediakan internet untuk LAN lewat NAT.
- Membagikan IP otomatis lewat DHCP server.
- Aksesnya diamankan dan dibatasi ke LAN.

## Topologi

| Port     | Peran | Alamat                         |
| -------- | ----- | ------------------------------ |
| `ether1` | WAN   | Otomatis dari ISP              |
| `ether2` | LAN   | `192.168.10.1/24`              |

Jika kamu mulai dari router yang sudah pernah dikonfigurasi, reset dulu agar tidak ada sisa pengaturan:

```routeros
/system reset-configuration no-defaults=yes skip-backup=yes
```

Setelah reboot, sambung lewat MAC address di Winbox, lalu buka **New Terminal**.

> Aktifkan **Safe Mode** (`Ctrl+X`) sebelum menempelkan konfigurasi akses. Setelah semua berhasil, tekan `Ctrl+X` lagi untuk menyimpan.

## Konfigurasi lengkap

Tempelkan per blok agar mudah mengecek hasilnya. Ganti `<password>` dengan password kuat milikmu.

**1. Identitas dan label port**

```routeros
/system identity set name=R-Core
/interface set ether1 comment="WAN ke ISP"
/interface set ether2 comment="LAN ke client"
```

**2. Interface list**

```routeros
/interface list add name=WAN
/interface list add name=LAN
/interface list member add list=WAN interface=ether1
/interface list member add list=LAN interface=ether2
```

**3. IP LAN, WAN, dan DNS**

```routeros
/ip address add address=192.168.10.1/24 interface=ether2 comment="Gateway LAN"
/ip dhcp-client add interface=ether1 disabled=no
/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes
/ip firewall filter add chain=input in-interface-list=WAN protocol=udp dst-port=53 action=drop comment="Blok DNS dari WAN"
/ip firewall filter add chain=input in-interface-list=WAN protocol=tcp dst-port=53 action=drop comment="Blok DNS dari WAN"
```

**4. NAT**

```routeros
/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade comment="Internet untuk LAN"
```

**5. DHCP server**

```routeros
/ip pool add name=pool-lan ranges=192.168.10.10-192.168.10.200
/ip dhcp-server add name=dhcp-lan interface=ether2 address-pool=pool-lan disabled=no
/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1
```

**6. Waktu**

```routeros
/system clock set time-zone-name=Asia/Jakarta
/system ntp client set enabled=yes
/system ntp client servers add address=id.pool.ntp.org
```

**7. Keamanan akses**

```routeros
/user add name=teknisi password=<password> group=full
/ip service disable telnet,ftp,www,api
/ip service set winbox address=192.168.10.0/24
/ip service set ssh address=192.168.10.0/24
/ip ssh set strong-crypto=yes
/ip neighbor discovery-settings set discover-interface-list=LAN
/tool mac-server set allowed-interface-list=LAN
/tool mac-server mac-winbox set allowed-interface-list=LAN
```

Sebelum menonaktifkan `admin`, login dulu memakai user `teknisi`. Jika berhasil:

```routeros
/user disable admin
```

## Verifikasi

| Tes                                      | Hasil yang diharapkan                    |
| ---------------------------------------- | ---------------------------------------- |
| `/ip dhcp-client print`                  | Status `bound`                           |
| `/ping 8.8.8.8 count=4`                  | Balasan diterima                         |
| `/ping google.com count=4`               | Nama domain berhasil diterjemahkan       |
| Laptop dapat IP otomatis                 | Alamat di rentang `192.168.10.10-200`    |
| `ping google.com` dari laptop            | Balasan diterima                         |
| Winbox dari jaringan WAN                 | Ditolak                                  |

## Simpan hasilnya

```routeros
/system backup save name=lab-akhir
/export file=lab-akhir
```

Unduh kedua file ke komputer sebagai bukti dan bahan belajar.

## Uji pemahaman

1. Apa beda file `.backup` dan `.rsc`?
2. Kenapa user pengganti harus dites sebelum `admin` dinonaktifkan?
3. Apa fungsi NAT masquerade pada konfigurasi ini?
4. Layanan apa yang kamu matikan, dan kenapa?
5. Client mendapat IP tetapi tidak bisa membuka website. Sebutkan tiga hal yang kamu cek, berurutan.

**Kunci jawaban**

1. `.backup` adalah file biner untuk pemulihan penuh di perangkat yang sama, `.rsc` adalah skrip teks yang bisa diedit dan dipakai di router lain.
2. Agar kamu tidak terkunci dari router jika user baru ternyata bermasalah.
3. Mengganti alamat sumber paket LAN dengan IP WAN sehingga banyak perangkat privat bisa keluar lewat satu IP publik.
4. Telnet, FTP, WebFig lewat HTTP, dan API, karena tidak terenkripsi atau tidak dipakai, sehingga memperkecil celah serangan.
5. Contohnya: apakah router bisa ping `8.8.8.8`, apakah rule NAT ada, lalu apakah DNS berfungsi.

## Ringkasan materi

| Bab | Yang dipelajari                                          |
| --- | -------------------------------------------------------- |
| 1   | Pengenalan RouterOS dan cara akses                       |
| 2   | Konfigurasi awal: IP, DHCP, DNS, NAT                     |
| 3   | Winbox dan Safe Mode                                     |
| 4   | WebFig, terminal, dan perintah dasar CLI                 |
| 5   | User dan keamanan dasar                                  |
| 6   | Backup, restore, dan update                              |
| 7   | Monitoring dan troubleshooting                           |
| 8   | Lab penutup yang menggabungkan semuanya                  |

## Langkah selanjutnya

Kamu sudah punya fondasi untuk melanjutkan ke materi berikutnya: **IP Address, DHCP & DNS**, yang membahas pengaturan jaringan lokal dengan lebih dalam.
