---
title: Lab Akhir Firewall & NAT
summary: Menyatukan seluruh materi firewall dan NAT pada topologi dua router: hardening, segmentasi, port forwarding, dan pengujian menyeluruh.
minutes: 20
---

Di lab penutup ini kamu menggabungkan seluruh materi: interface list, address list, chain `input` dan `forward`, perlindungan serangan, NAT, dan port forwarding, pada topologi dua router dari Lab Akhir Dua Jaringan.

## Tujuan lab

- R1 dan R2 hanya bisa dikelola oleh admin dari LAN 1.
- LAN 1 dan LAN 2 bisa ke internet; internet tidak bisa memulai koneksi ke LAN.
- LAN 1 boleh memulai koneksi ke LAN 2, tetapi LAN 2 tidak boleh memulai ke LAN 1.
- Web server di LAN 1 dipublikasikan di port 8080.
- DNS klien dipaksa lewat router.

## Topologi dan alamat

```
Internet --- ether1 [R1] ether3 ---(10.0.0.0/30)--- ether1 [R2] ether2 --- LAN 2
                     ether2
                       |
                     LAN 1  (web server 192.168.10.50)
```

| Router | Interface | Peran       | Alamat                |
| ------ | --------- | ----------- | --------------------- |
| R1     | `ether1`  | WAN         | Otomatis dari ISP     |
| R1     | `ether2`  | LAN 1       | `192.168.10.1/24`     |
| R1     | `ether3`  | Link ke R2  | `10.0.0.1/30`         |
| R2     | `ether1`  | Link ke R1  | `10.0.0.2/30`         |
| R2     | `ether2`  | LAN 2       | `192.168.20.1/24`     |

> **Prasyarat:** konfigurasi dasar dari Lab Akhir Dua Jaringan sudah berjalan (alamat IP, DHCP, DNS, route, dan masquerade). Aktifkan **Safe Mode** saat menempelkan konfigurasi, dan buat backup lebih dulu: `/system backup save name=sebelum-lab-firewall`.

## Konfigurasi R1

Jalankan bagian per bagian dan pastikan akses ke router masih normal sebelum lanjut.

**1. Interface list dan address list**

```routeros
/interface list add name=WAN
/interface list add name=LAN
/interface list member add list=WAN interface=ether1
/interface list member add list=LAN interface=ether2
/interface list member add list=LAN interface=ether3
/ip firewall address-list add list=admin-allowed address=192.168.10.0/24 comment="Admin dari LAN 1"
/ip firewall address-list add list=lan-subnets address=192.168.10.0/24 comment="LAN 1"
/ip firewall address-list add list=lan-subnets address=192.168.20.0/24 comment="LAN 2"
```

**2. Chain input**

```routeros
/ip firewall filter remove [find comment="Blok DNS dari WAN"]
/ip firewall filter
add chain=input connection-state=established,related,untracked action=accept comment="Input: izinkan established,related,untracked"
add chain=input connection-state=invalid action=drop comment="Input: drop invalid"
add chain=input protocol=icmp action=accept limit=20,5:packet comment="Izinkan ICMP"
add chain=input protocol=udp dst-port=53 in-interface-list=LAN action=accept comment="DNS UDP dari LAN"
add chain=input protocol=tcp dst-port=53 in-interface-list=LAN action=accept comment="DNS TCP dari LAN"
add chain=input protocol=udp dst-port=67 in-interface-list=LAN action=accept comment="DHCP dari LAN"
add chain=input protocol=tcp dst-port=22,8291 src-address-list=admin-allowed in-interface-list=LAN action=accept comment="Admin SSH+Winbox"
add chain=input action=drop comment="Input: drop semua sisanya"
```

**3. Perlindungan serangan (opsional tetapi disarankan)**

```routeros
/ip firewall filter
add chain=input protocol=tcp dst-port=22 src-address-list=blacklist action=drop comment="SSH: drop blacklist" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage3 action=add-src-to-address-list address-list=blacklist address-list-timeout=1d comment="SSH: stage3 ke blacklist" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage2 action=add-src-to-address-list address-list=ssh_stage3 address-list-timeout=1m comment="SSH: stage2 ke stage3" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage1 action=add-src-to-address-list address-list=ssh_stage2 address-list-timeout=1m comment="SSH: stage1 ke stage2" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new action=add-src-to-address-list address-list=ssh_stage1 address-list-timeout=1m comment="SSH: koneksi baru ke stage1" place-before=[find comment="Admin SSH+Winbox"]
/ip firewall raw add chain=prerouting src-address-list=blacklist action=drop comment="Drop blacklist (raw)"
/ip settings set tcp-syncookies=yes
```

**4. Chain forward**

```routeros
/ip firewall filter
add chain=forward connection-state=established,related action=fasttrack-connection comment="Fasttrack"
add chain=forward connection-state=established,related,untracked action=accept comment="Forward: izinkan established,related,untracked"
add chain=forward connection-state=invalid action=drop comment="Forward: drop invalid"
add chain=forward in-interface-list=WAN connection-state=new connection-nat-state=dstnat dst-address=192.168.10.50 protocol=tcp dst-port=80 action=accept comment="Izinkan port forward web"
add chain=forward in-interface-list=WAN connection-state=new action=drop comment="Drop WAN ke LAN"
add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.0/24 connection-state=new action=drop comment="Segmentasi: LAN 2 ke LAN 1"
```

**5. NAT**

```routeros
/ip firewall nat remove [find comment="Internet untuk semua LAN"]
/ip firewall nat
add chain=srcnat out-interface-list=WAN action=masquerade comment="Internet untuk semua LAN"
add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=8080 action=dst-nat to-addresses=192.168.10.50 to-ports=80 comment="Port forward web server"
add chain=dstnat in-interface-list=LAN protocol=tcp dst-port=8080 dst-address-type=local action=dst-nat to-addresses=192.168.10.50 to-ports=80 comment="Hairpin: dst-nat dari LAN"
add chain=srcnat src-address=192.168.10.0/24 dst-address=192.168.10.50 protocol=tcp dst-port=80 out-interface=ether2 action=masquerade comment="Hairpin: masquerade ke server"
add chain=dstnat in-interface-list=LAN protocol=udp dst-port=53 dst-address-type=!local action=redirect to-ports=53 comment="Paksa DNS UDP ke router"
add chain=dstnat in-interface-list=LAN protocol=tcp dst-port=53 dst-address-type=!local action=redirect to-ports=53 comment="Paksa DNS TCP ke router"
```

**6. Pengerasan layanan**

```routeros
/ip service disable telnet,ftp,www,www-ssl,api,api-ssl
/ip service set ssh address=192.168.10.0/24
/ip service set winbox address=192.168.10.0/24
/ip neighbor discovery-settings set discover-interface-list=none
/tool bandwidth-server set enabled=no
/ip firewall service-port set sip disabled=yes
/ip firewall service-port set h323 disabled=yes
/ip firewall service-port set pptp disabled=yes
```

Matikan MAC server (`/tool mac-server ...`) dan nonaktifkan akun `admin` hanya setelah login `netadmin` lewat IP terbukti berhasil (bab 6).

## Konfigurasi R2

```routeros
/interface list add name=LAN
/interface list member add list=LAN interface=ether1
/interface list member add list=LAN interface=ether2
/ip firewall address-list add list=admin-allowed address=192.168.10.0/24 comment="Admin dari LAN 1"
/ip firewall address-list add list=admin-allowed address=10.0.0.1 comment="R1"
```

```routeros
/ip firewall filter
add chain=input connection-state=established,related,untracked action=accept comment="Input: izinkan established,related,untracked"
add chain=input connection-state=invalid action=drop comment="Input: drop invalid"
add chain=input protocol=icmp action=accept limit=20,5:packet comment="Izinkan ICMP"
add chain=input protocol=udp dst-port=53 in-interface-list=LAN action=accept comment="DNS UDP dari LAN"
add chain=input protocol=tcp dst-port=53 in-interface-list=LAN action=accept comment="DNS TCP dari LAN"
add chain=input protocol=udp dst-port=67 in-interface-list=LAN action=accept comment="DHCP dari LAN"
add chain=input protocol=tcp dst-port=22,8291 src-address-list=admin-allowed action=accept comment="Admin SSH+Winbox"
add chain=input action=drop comment="Input: drop semua sisanya"
/ip service disable telnet,ftp,www,www-ssl,api,api-ssl
/ip service set ssh address=192.168.10.0/24,10.0.0.1/32
/ip service set winbox address=192.168.10.0/24,10.0.0.1/32
```

R2 tidak membutuhkan NAT dan tidak membutuhkan aturan `forward` khusus karena segmentasi sudah dilakukan di R1.

## Pengujian bertahap

Uji dari yang paling dekat ke yang paling jauh.

| Langkah | Dari                   | Perintah                                   | Hasil yang diharapkan                          |
| ------- | ---------------------- | ------------------------------------------ | ---------------------------------------------- |
| 1       | R1                     | `/ping 10.0.0.2 count=4`                   | Berhasil (link tidak rusak oleh firewall)      |
| 2       | R1                     | `/ping 8.8.8.8 count=4`                    | Berhasil                                       |
| 3       | Laptop LAN 1           | `ipconfig`                                 | Mendapat IP `192.168.10.x`                     |
| 4       | Laptop LAN 1           | `ping 192.168.20.1`                        | Berhasil                                       |
| 5       | Laptop LAN 1           | `ssh netadmin@192.168.10.1`                | Berhasil                                       |
| 6       | Laptop LAN 1           | `ssh netadmin@192.168.20.1`                | Berhasil (admin R2)                            |
| 7       | Laptop LAN 2           | `ipconfig`                                 | Mendapat IP `192.168.20.x`                     |
| 8       | Laptop LAN 2           | `ping 8.8.8.8` dan `ping google.com`       | Berhasil                                       |
| 9       | Laptop LAN 2           | `ping 192.168.10.10` (laptop LAN 1)        | Request timed out (segmentasi)                 |
| 10      | Laptop LAN 2           | `ssh netadmin@10.0.0.1`                    | Timeout (bukan admin)                          |
| 11      | Laptop LAN 2           | `nslookup google.com 8.8.8.8`              | Berhasil; jawaban dari DNS router (redirect)   |
| 12      | Ponsel (jaringan seluler) | `http://<IP-publik-R1>:8080`            | Halaman web server tampil                      |
| 13      | Laptop LAN 1           | `http://<IP-publik-R1>:8080`               | Halaman tampil (hairpin) atau gunakan nama lokal |
| 14      | Laptop LAN 1           | Banyak percobaan SSH salah                 | Alamat masuk `blacklist`                       |

Setelah langkah 14, bersihkan: `/ip firewall address-list remove [find list=blacklist]`.

Lihat jalur dari LAN 2 ke internet:

```
tracert 8.8.8.8
```

Hop pertama `192.168.20.1` (R2), hop kedua `10.0.0.1` (R1), lalu keluar ke ISP.

Cek bukti dari sisi router:

```routeros
/ip firewall filter print stats
/ip firewall nat print stats
/ip firewall connection tracking print
/ip firewall address-list print where list=blacklist
```

## Troubleshooting

| Gejala                                        | Kemungkinan penyebab                           | Cek                                                |
| --------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Terputus dari router setelah aturan drop      | Aturan izin admin di bawah atau subnet salah   | Safe Mode membatalkan; periksa urutan `input`      |
| R2 tidak resolve DNS                          | `ether3` tidak ada di list LAN R1              | `/interface list member print`                     |
| LAN 2 tidak bisa ke internet                  | Aturan drop `forward` terlalu luas atau route hilang | `/ip route print`, `print stats` chain forward |
| Port forwarding tidak jalan dari luar         | CGNAT, atau izin forward berada di bawah drop  | Cek alamat WAN dan urutan aturan                   |
| Berhasil dari luar tetapi gagal dari LAN      | Hairpin NAT belum dipasang                     | Cek dua aturan hairpin di `/ip firewall nat print` |
| Pembatasan bandwidth tidak jalan              | Fasttrack aktif                                | Nonaktifkan aturan fasttrack                       |
| Admin masuk blacklist                         | Terlalu banyak percobaan SSH gagal             | Hapus entri dan atur ulang batas                   |

## Simpan hasilnya

Di kedua router:

```routeros
/system backup save name=lab-firewall-nat
/export file=lab-firewall-nat
```

## Uji pemahaman

1. Kenapa aturan `drop` terakhir di chain `input` harus dipasang paling akhir?
2. Kenapa aturan izin port forward harus berada di atas `Drop WAN ke LAN`?
3. Kenapa ping dari LAN 2 ke R1 berhasil tetapi ke laptop LAN 1 gagal?
4. Apa yang akan terjadi jika `ether3` tidak dimasukkan ke list LAN di R1?
5. Sebutkan dua cara agar server LAN 1 bisa diakses dari dalam LAN lewat nama yang sama dengan akses dari luar.

**Kunci jawaban**

1. Jika dipasang lebih awal, ia membuang paket sebelum aturan izin dibaca sehingga admin terkunci.
2. Pemeriksaan berhenti pada kecocokan pertama; jika berada di bawah aturan drop, izin itu tidak pernah dibaca.
3. Ping ke R1 masuk chain `input` yang mengizinkan ICMP, sedangkan ping ke laptop melewati chain `forward` yang memblokir LAN 2 ke LAN 1.
4. R2 dan LAN 2 tidak bisa memakai DNS R1 dan tidak bisa ping R1, karena aturan `input` hanya mengizinkan DNS dan sebagainya dari list LAN.
5. Hairpin NAT, atau DNS statis yang mengarahkan nama itu ke alamat lokal server.

## Ringkasan materi

| Bab | Yang dipelajari                                              |
| --- | ------------------------------------------------------------ |
| 1   | Fungsi firewall dan peta fitur RouterOS                      |
| 2   | Alur paket dan chain                                         |
| 3   | Connection tracking dan status koneksi                       |
| 4   | Filter rule, urutan aturan, dan interface list               |
| 5   | Address list statis, sementara, dan dinamis                  |
| 6   | Mengamankan router lewat chain `input`                       |
| 7   | Melindungi LAN dan segmentasi lewat chain `forward`          |
| 8   | Perlindungan dari brute force, port scan, dan banjir koneksi |
| 9   | Konsep NAT dan masquerade                                    |
| 10  | Dst-NAT dan port forwarding                                  |
| 11  | NAT lanjutan: hairpin, redirect, netmap, service-port        |
| 12  | Lab akhir yang menggabungkan semuanya                        |

## Langkah selanjutnya

Kamu sudah menyelesaikan jalur **Firewall & NAT**. Lanjutkan ke materi berikutnya di tingkat Intermediate, misalnya VPN atau manajemen bandwidth, yang akan memakai fondasi firewall dan NAT yang baru kamu bangun.
