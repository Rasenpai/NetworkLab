---
title: Lab Akhir Dua Jaringan
summary: Menghubungkan dua LAN dengan dua router, DHCP di masing-masing sisi, dan akses internet bersama.
minutes: 15
---

Di lab penutup ini kamu menyatukan seluruh materi: pengalamatan IP, DHCP server, DNS, dan routing statis dalam satu topologi dua router.

## Tujuan lab

- LAN 1 dan LAN 2 mendapat IP otomatis dari router masing-masing.
- Kedua LAN bisa saling berkomunikasi.
- Semua client bisa mengakses internet lewat satu router (R1).

## Topologi

![Contoh diagram jaringan](https://commons.wikimedia.org/wiki/Special:FilePath/Sample-network-diagram.png?width=800 "Contoh diagram jaringan. Sumber: Wikimedia Commons")

```
Internet --- ether1 [R1] ether3 ---(10.0.0.0/30)--- ether1 [R2] ether2 --- LAN 2
                     ether2
                       |
                     LAN 1
```

| Router | Interface | Peran       | Alamat                |
| ------ | --------- | ----------- | --------------------- |
| R1     | `ether1`  | WAN         | Otomatis dari ISP     |
| R1     | `ether2`  | LAN 1       | `192.168.10.1/24`     |
| R1     | `ether3`  | Link ke R2  | `10.0.0.1/30`         |
| R2     | `ether1`  | Link ke R1  | `10.0.0.2/30`         |
| R2     | `ether2`  | LAN 2       | `192.168.20.1/24`     |

Rencana alamat: link antar router memakai `/30` karena hanya membutuhkan dua IP (VLSM, bab 2).

> Reset konfigurasi kedua router lebih dulu dengan `/system reset-configuration no-defaults=yes skip-backup=yes`, lalu aktifkan **Safe Mode** saat menempelkan konfigurasi.

## Konfigurasi R1

```routeros
/system identity set name=R1
/ip address add address=192.168.10.1/24 interface=ether2 comment="LAN 1"
/ip address add address=10.0.0.1/30 interface=ether3 comment="Link ke R2"
/ip dhcp-client add interface=ether1 disabled=no
```

DNS dan pembatasan dari sisi WAN:

```routeros
/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes
/ip firewall filter add chain=input in-interface=ether1 protocol=udp dst-port=53 action=drop comment="Blok DNS dari WAN"
/ip firewall filter add chain=input in-interface=ether1 protocol=tcp dst-port=53 action=drop comment="Blok DNS dari WAN"
```

NAT agar kedua LAN bisa ke internet:

```routeros
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="Internet untuk semua LAN"
```

DHCP server untuk LAN 1:

```routeros
/ip pool add name=pool-lan1 ranges=192.168.10.10-192.168.10.200
/ip dhcp-server add name=dhcp-lan1 interface=ether2 address-pool=pool-lan1 disabled=no
/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1
```

Route menuju LAN 2:

```routeros
/ip route add dst-address=192.168.20.0/24 gateway=10.0.0.2 comment="Ke LAN 2"
```

## Konfigurasi R2

```routeros
/system identity set name=R2
/ip address add address=10.0.0.2/30 interface=ether1 comment="Link ke R1"
/ip address add address=192.168.20.1/24 interface=ether2 comment="LAN 2"
/ip route add dst-address=0.0.0.0/0 gateway=10.0.0.1 comment="Default ke R1"
/ip dns set servers=10.0.0.1 allow-remote-requests=yes
```

DHCP server untuk LAN 2:

```routeros
/ip pool add name=pool-lan2 ranges=192.168.20.10-192.168.20.200
/ip dhcp-server add name=dhcp-lan2 interface=ether2 address-pool=pool-lan2 disabled=no
/ip dhcp-server network add address=192.168.20.0/24 gateway=192.168.20.1 dns-server=192.168.20.1
```

R2 tidak membutuhkan NAT, karena NAT dilakukan di R1 yang terhubung ke internet.

## Pengujian bertahap

Uji dari yang paling dekat ke yang paling jauh.

| Langkah | Dari          | Perintah                              | Yang dibuktikan                   |
| ------- | ------------- | ------------------------------------- | --------------------------------- |
| 1       | R1            | `/ping 10.0.0.2 count=4`              | Link R1 ke R2 berfungsi           |
| 2       | R2            | `/ping 10.0.0.1 count=4`              | Link dua arah                     |
| 3       | R1            | `/ping 8.8.8.8 count=4`               | WAN dan DHCP client R1 berfungsi  |
| 4       | Laptop LAN 1  | `ipconfig`                            | Mendapat IP `192.168.10.x`        |
| 5       | Laptop LAN 1  | `ping 192.168.20.1`                   | Routing ke R2 berfungsi           |
| 6       | Laptop LAN 2  | `ipconfig`                            | Mendapat IP `192.168.20.x`        |
| 7       | Laptop LAN 2  | `ping 192.168.10.1`                   | Route balik berfungsi             |
| 8       | Laptop LAN 2  | `ping 8.8.8.8`                        | Internet lewat R1                 |
| 9       | Laptop LAN 2  | `ping google.com`                     | DNS berfungsi                     |

Lihat jalur yang dilalui paket dari laptop LAN 2 ke internet:

```
tracert 8.8.8.8
```

Hop pertama harus `192.168.20.1` (R2), hop kedua `10.0.0.1` (R1), lalu keluar ke ISP.

## Troubleshooting

| Gejala                                       | Kemungkinan penyebab                           | Cek                                          |
| -------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Ping R1 ke R2 gagal                          | IP link salah atau kabel bermasalah            | `/ip address print`, `/interface print`      |
| LAN 1 bisa ke R2, LAN 2 tidak bisa balik    | Route di salah satu router belum ada           | `/ip route print` di kedua router            |
| LAN 2 bisa ke R1 tapi tidak ke internet      | Default route di R2 salah                      | `/ip route print where dst-address=0.0.0.0/0` |
| LAN 1 internet jalan, LAN 2 tidak            | NAT hanya mencakup interface salah             | `/ip firewall nat print` di R1               |
| LAN 2 tidak dapat IP                         | DHCP server R2 salah interface atau pool       | `/ip dhcp-server print`                      |
| Ping IP berhasil, nama domain gagal          | DNS di R2 belum mengarah ke R1                 | `/ip dns print` di R2                        |

## Simpan hasilnya

Di kedua router:

```routeros
/system backup save name=lab-dua-jaringan
/export file=lab-dua-jaringan
```

## Uji pemahaman

1. Kenapa link antar router memakai `/30`?
2. Kenapa R2 tidak perlu NAT?
3. Apa yang terjadi jika route `192.168.10.0/24` di R2 tidak dibuat? Pada akhirnya siapa yang tidak bisa dihubungi?
4. Sebutkan dua cara mengurangi risiko DHCP liar di LAN.
5. Jika DHCP server di R1 melayani LAN 2 juga, apa yang harus dipasang di R2?

**Kunci jawaban**

1. Karena hanya butuh dua IP (satu di tiap router), jadi `/30` hemat alamat.
2. NAT sudah dilakukan R1 pada paket yang keluar lewat `ether1`, termasuk paket dari LAN 2.
3. Paket dari LAN 1 bisa sampai ke LAN 2, tetapi balasannya tidak tahu jalan pulang. Perangkat di LAN 1 tidak akan mendapat jawaban dari LAN 2.
4. DHCP snooping dengan port trusted, dan ARP reply-only dengan static lease.
5. **DHCP relay** di R2 yang menunjuk ke DHCP server di R1.

## Ringkasan materi

| Bab | Yang dipelajari                                      |
| --- | ---------------------------------------------------- |
| 1   | Konsep IP address dan subnet mask                    |
| 2   | Subnetting dan VLSM                                  |
| 3   | IP address di RouterOS dan tabel ARP                 |
| 4   | Bridge untuk jaringan LAN                            |
| 5   | DHCP server dan static lease                         |
| 6   | DHCP client dan DHCP relay                           |
| 7   | DNS cache dan DNS statis                             |
| 8   | Routing statis dan jalur cadangan                    |
| 9   | Keamanan DHCP dan ARP                                |
| 10  | Lab dua jaringan yang menggabungkan semuanya         |

## Langkah selanjutnya

Lanjutkan ke materi **Firewall & NAT**, yang membahas filter rule, connection tracking, dan penguatan keamanan router secara lengkap.
