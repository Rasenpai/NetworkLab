---
title: Konfigurasi Awal Router
summary: Dari router kosong sampai client LAN bisa internet, langkah demi langkah.
minutes: 25
---

Di bab ini kamu mengonfigurasi router MikroTik dari kondisi kosong sampai laptop di jaringan lokal bisa membuka internet. Semua perintah bisa dijalankan di **New Terminal** Winbox.

## Tujuan belajar

Setelah bab ini kamu bisa:

- Mereset router ke kondisi bersih dan memberi nama (identity).
- Mengatur IP address LAN dan mengambil IP WAN lewat DHCP client.
- Mengatur DNS dan NAT masquerade.
- Menyalakan DHCP server agar client mendapat IP otomatis.
- Memverifikasi koneksi dan menyimpan backup konfigurasi.

## Topologi

![Contoh topologi jaringan lokal sederhana](https://commons.wikimedia.org/wiki/Special:FilePath/Home_LAN_local_area_network_example_diagram.png?width=800 "Contoh topologi LAN sederhana. Sumber: Wikimedia Commons")

Pada lab ini router punya dua sisi: **WAN** (menuju internet) dan **LAN** (menuju laptop atau switch).

| Port     | Peran | Alamat                                  |
| -------- | ----- | --------------------------------------- |
| `ether1` | WAN   | Otomatis dari ISP (DHCP client)         |
| `ether2` | LAN   | `192.168.10.1/24`                       |
| Client   | LAN   | `192.168.10.10` sampai `192.168.10.200` |

![Skema LAN dan WAN](https://commons.wikimedia.org/wiki/Special:FilePath/LAN_WAN_scheme.svg?width=800 "Skema LAN dan WAN. Sumber: Wikimedia Commons")

## Persiapan: reset router

Mulai dari konfigurasi bersih agar tidak ada sisa pengaturan lama.

```routeros
/system reset-configuration no-defaults=yes skip-backup=yes
```

> Perintah ini menghapus **seluruh** konfigurasi dan router akan reboot. Backup dulu jika router sudah dipakai.

Setelah reboot, router tidak punya IP. Sambungkan laptop ke `ether2`, buka Winbox, lalu hubungkan lewat **MAC address** di tab **Neighbors**.

## Langkah 1: nama router dan label port

```routeros
/system identity set name=R-Core
/interface set ether1 comment="WAN ke ISP"
/interface set ether2 comment="LAN ke client"
```

Label (`comment`) memudahkan kamu mengenali port saat konfigurasi makin banyak.

## Langkah 2: IP address LAN

```routeros
/ip address add address=192.168.10.1/24 interface=ether2 comment="Gateway LAN"
/ip address print
```

Alamat `192.168.10.1` akan menjadi **default gateway** semua client di LAN.

## Langkah 3: IP WAN dari ISP

Kebanyakan ISP atau modem memberi IP otomatis lewat DHCP.

```routeros
/ip dhcp-client add interface=ether1 disabled=no
/ip dhcp-client print
```

Pastikan kolom status berisi `bound`. Dengan pengaturan bawaan, DHCP client juga otomatis membuat **default route** dan mengambil alamat DNS dari ISP.

Cek rutenya:

```routeros
/ip route print where dst-address=0.0.0.0/0
```

## Langkah 4: DNS

Agar router dan client bisa memakai nama domain, atur server DNS dan izinkan client memakai router sebagai DNS.

```routeros
/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes
```

> `allow-remote-requests=yes` membuat router menjawab permintaan DNS dari jaringan mana pun, termasuk WAN. Blokir dari sisi WAN dengan dua rule berikut (firewall lengkap dibahas di bab Firewall & NAT).

```routeros
/ip firewall filter add chain=input in-interface=ether1 protocol=udp dst-port=53 action=drop comment="Blok DNS dari WAN"
/ip firewall filter add chain=input in-interface=ether1 protocol=tcp dst-port=53 action=drop comment="Blok DNS dari WAN"
```

## Langkah 5: NAT masquerade

Alamat `192.168.x.x` adalah alamat **privat** yang tidak bisa dirutekan di internet. NAT masquerade mengganti alamat sumber paket LAN dengan IP WAN router, sehingga semua perangkat LAN bisa keluar memakai satu IP publik.

![Ilustrasi Network Address Translation](https://commons.wikimedia.org/wiki/Special:FilePath/Network_Address_Translation_%28NAT%29.png?width=800 "Ilustrasi NAT. Sumber: Wikimedia Commons")

```routeros
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="Internet untuk LAN"
/ip firewall nat print
```

`masquerade` cocok untuk IP WAN yang berubah-ubah (DHCP). Untuk IP WAN tetap bisa memakai `src-nat`, tetapi masquerade sudah cukup untuk pemula.

## Langkah 6: DHCP server di LAN

DHCP server memberi IP, gateway, dan DNS ke client secara otomatis. Prosesnya empat tahap: client mengirim **Discover**, server membalas **Offer**, client meminta lewat **Request**, lalu server menegaskan lewat **Acknowledge**.

![Urutan sesi DHCP](https://commons.wikimedia.org/wiki/Special:FilePath/DHCP_session_en.svg?width=800 "Urutan sesi DHCP. Sumber: Wikimedia Commons")

```routeros
/ip pool add name=pool-lan ranges=192.168.10.10-192.168.10.200
/ip dhcp-server add name=dhcp-lan interface=ether2 address-pool=pool-lan disabled=no
/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1
```

Alamat `192.168.10.1` sampai `.9` sengaja tidak masuk pool, jadi bisa dipakai untuk perangkat dengan IP tetap seperti server atau printer.

> Jalan pintas: perintah `/ip dhcp-server setup` memandu pembuatan DHCP server secara interaktif.

## Langkah 7: verifikasi

Jalankan dari router:

```routeros
/ping 8.8.8.8 count=4
/ping google.com count=4
/ip dhcp-server lease print
```

Lalu dari laptop client (Command Prompt atau terminal):

```
ipconfig
ping 192.168.10.1
ping 8.8.8.8
ping google.com
```

Artinya tiap tes:

| Tes                | Jika berhasil                           |
| ------------------ | --------------------------------------- |
| `ping 192.168.10.1` | Client terhubung ke router             |
| `ping 8.8.8.8`      | Routing dan NAT sudah benar            |
| `ping google.com`   | DNS sudah benar, internet berfungsi    |

## Langkah 8: simpan konfigurasi

```routeros
/system backup save name=konfigurasi-awal
/export file=konfigurasi-awal
```

File `.backup` hanya bisa dipulihkan di perangkat yang sama, sedangkan file `.rsc` dari `/export` berupa teks yang mudah dibaca dan dipindahkan ke router lain. Ambil kedua file dari menu **Files** di Winbox.

## Troubleshooting

| Gejala                                              | Penyebab umum                          | Cek dan perbaiki                                           |
| --------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| `ping 8.8.8.8` dari router gagal                    | WAN belum dapat IP atau tidak ada rute | `/ip dhcp-client print`, pastikan status `bound`           |
| Ping IP berhasil, ping nama domain gagal            | DNS belum diatur                       | `/ip dns print`, lalu atur `servers`                       |
| Router bisa internet, client tidak                  | NAT belum ada atau salah interface     | `/ip firewall nat print`, pastikan `out-interface=ether1`  |
| Client tidak dapat IP otomatis                      | DHCP server di interface yang salah    | `/ip dhcp-server print`, pastikan `interface=ether2`       |
| Client dapat IP tapi tidak bisa ping `192.168.10.1` | Kabel atau port salah                  | `/interface print`, pastikan port berstatus `R` (running)  |

## Ringkasan

- LAN memakai IP privat dan router sebagai gateway, sedangkan WAN mendapat IP dari ISP.
- **DHCP client** di WAN membuat default route dan DNS otomatis.
- **NAT masquerade** membuat banyak perangkat LAN bisa keluar lewat satu IP publik.
- **DHCP server** di LAN membagikan IP, gateway, dan DNS ke client.
- Selalu **verifikasi bertahap**: router ke IP, router ke domain, lalu client.
- Simpan `backup` dan `export` sebelum mengubah konfigurasi besar.

## Latihan

1. Ubah subnet LAN menjadi `192.168.20.0/24` dan sesuaikan semua langkah yang terkait.
2. Buat IP tetap untuk satu perangkat lewat static lease: `/ip dhcp-server lease add address=192.168.10.50 mac-address=<MAC> server=dhcp-lan`.
3. Matikan rule NAT (`/ip firewall nat disable numbers=0`), lalu amati apa yang terjadi pada ping dari client. Aktifkan lagi setelahnya.