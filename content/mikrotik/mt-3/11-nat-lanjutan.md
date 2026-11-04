---
title: NAT Lanjutan
summary: Hairpin NAT, redirect untuk memaksa DNS, netmap 1:1, dan pengaturan service-port helper.
minutes: 20
---

Setelah port forwarding dasar jalan, ada beberapa situasi yang sering membingungkan. Bab ini membahas empat teknik NAT lanjutan yang berguna di jaringan nyata.

## Tujuan bab

- Menyelesaikan masalah akses server lewat alamat publik dari dalam LAN (hairpin NAT).
- Memaksa klien memakai DNS router dengan `redirect`.
- Memahami `netmap` untuk pemetaan subnet satu-satu.
- Mematikan service-port helper yang tidak dipakai.

## Masalah: server tidak bisa diakses dari dalam LAN lewat alamat publik

Dari internet, `http://<IP-publik>:8080` berhasil. Dari laptop LAN 1, alamat yang sama gagal. Penyebabnya: server `192.168.10.50` dan laptop berada di subnet yang sama. Server menerima paket dengan sumber `192.168.10.x` dan membalas **langsung** ke laptop tanpa lewat router, sedangkan laptop mengharapkan balasan dari alamat publik. Balasan itu ditolak.

## Solusi 1: Hairpin NAT

Paksa balasan lewat router dengan mengubah sumber paket menjadi alamat router.

```routeros
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=tcp dst-port=8080 dst-address-type=local action=dst-nat to-addresses=192.168.10.50 to-ports=80 comment="Hairpin: dst-nat dari LAN"
/ip firewall nat add chain=srcnat src-address=192.168.10.0/24 dst-address=192.168.10.50 protocol=tcp dst-port=80 out-interface=ether2 action=masquerade comment="Hairpin: masquerade ke server"
```

Aturan pertama menangkap paket dari LAN yang menuju alamat milik router (`dst-address-type=local`, termasuk alamat WAN) pada port 8080. Aturan kedua mengganti sumbernya sehingga server membalas ke router, bukan ke klien.

Kekurangan: server melihat semua akses dari LAN berasal dari alamat router, sehingga log server tidak menampilkan IP klien asli.

## Solusi 2: DNS split-horizon (lebih bersih)

Alih-alih hairpin, buat klien LAN mendapat **alamat lokal** saat membuka nama domain yang sama, memakai DNS statis dari materi sebelumnya:

```routeros
/ip dns static add name=web.lab.local address=192.168.10.50 comment="Server web untuk LAN"
```

Klien di LAN membuka `web.lab.local` dan langsung diarahkan ke `192.168.10.50`, tanpa melewati NAT sama sekali. Jika kamu punya domain publik, pakai nama yang sama untuk ke dua sisi (dari internet mengarah ke alamat publik, dari LAN mengarah ke alamat privat). Ini disarankan bila domain tersedia.

## Redirect: memaksa DNS lewat router

Beberapa klien memakai DNS sendiri (misalnya `8.8.8.8`) untuk menghindari kebijakan. `redirect` mengalihkan paket itu ke router sendiri.

```routeros
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=udp dst-port=53 dst-address-type=!local action=redirect to-ports=53 comment="Paksa DNS UDP ke router"
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=tcp dst-port=53 dst-address-type=!local action=redirect to-ports=53 comment="Paksa DNS TCP ke router"
```

`dst-address-type=!local` mengecualikan paket yang memang ditujukan ke router, jadi klien yang sudah memakai DNS router tidak terpengaruh. Paket yang dialihkan itu masuk ke chain `input` dan diizinkan oleh aturan DNS dari LAN (bab 6).

Uji dari laptop LAN 2: `nslookup google.com 8.8.8.8`. Jawaban datang dari DNS router, dan counter aturan redirect naik:

```routeros
/ip firewall nat print stats where comment~"Paksa DNS"
```

Catatan: klien yang memakai DNS over HTTPS (DoH) tidak terlihat sebagai port 53 sehingga tidak terkena redirect.

## Netmap: pemetaan subnet satu-satu

`netmap` memetakan satu subnet ke subnet lain dengan **menjaga bagian host**. Contoh: dua kantor sama-sama memakai `192.168.20.0/24`, dan kamu perlu menghubungkannya tanpa bentrok.

```routeros
/ip firewall nat add chain=dstnat dst-address=172.16.20.0/24 action=netmap to-addresses=192.168.20.0/24 comment="Contoh netmap masuk"
/ip firewall nat add chain=srcnat src-address=192.168.20.0/24 out-interface=ether3 action=netmap to-addresses=172.16.20.0/24 comment="Contoh netmap keluar"
```

Pada contoh itu, `172.16.20.7` dipetakan ke `192.168.20.7`, dan sebaliknya. Ini hanya ilustrasi sintaks; jangan dipasang di lab kecuali kamu benar-benar punya kasus subnet bentrok.

## Service-port helper (ALG)

Beberapa protokol (FTP, SIP, H.323, PPTP) membuka koneksi kedua yang bergantung pada alamat di dalam muatan paket. RouterOS menyediakan helper untuk menyesuaikan muatan itu agar NAT tetap berfungsi.

```routeros
/ip firewall service-port print
/ip firewall service-port set sip disabled=yes
/ip firewall service-port set h323 disabled=yes
/ip firewall service-port set pptp disabled=yes
```

Matikan helper yang tidak dipakai. Helper SIP yang menyala tanpa kebutuhan sering menimbulkan masalah suara satu arah dan bisa menjadi celah. Biarkan `ftp` menyala bila ada layanan FTP di jaringan kamu.

## Troubleshooting

| Gejala                                        | Kemungkinan penyebab                        | Cek                                              |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------ |
| Server bisa diakses dari luar, tidak dari LAN  | Belum ada hairpin NAT atau DNS lokal        | Tambahkan aturan hairpin atau DNS statis         |
| Hairpin dipasang tetapi masih gagal           | `out-interface` pada srcnat bukan interface LAN server | Sesuaikan dengan `ether2`           |
| Redirect DNS membuat router lambat            | Banyak klien menekan DNS router             | Cek `/ip dns print` dan cache-size               |
| Klien tetap bisa memakai DNS lain             | Memakai DoH atau DNS lewat port lain        | Redirect hanya mengatasi port 53                 |
| Suara VoIP satu arah                          | Helper SIP bentrok                          | Coba matikan helper SIP                          |

## Uji pemahaman

1. Kenapa akses lewat alamat publik dari dalam LAN gagal tanpa hairpin NAT?
2. Apa kelebihan DNS split-horizon dibanding hairpin NAT?
3. Apa fungsi `dst-address-type=!local` pada aturan redirect DNS?
4. Apa yang dipertahankan `netmap` saat memetakan subnet?
5. Kenapa service-port helper yang tidak dipakai sebaiknya dimatikan?

**Kunci jawaban**

1. Server membalas langsung ke klien di subnet yang sama sehingga balasannya tidak datang dari alamat yang diharapkan klien.
2. Tidak ada NAT tambahan, dan server melihat alamat klien yang asli.
3. Mengecualikan paket yang memang ditujukan ke router agar tidak ikut dialihkan.
4. Bagian host dari alamat, hanya prefiks subnet yang diganti.
5. Mengurangi permukaan serangan dan menghindari gangguan protokol yang tidak diperlukan.

## Ringkasan

- Hairpin NAT atau DNS lokal menyelesaikan akses server dari dalam LAN lewat nama atau alamat publik.
- `redirect` memaksa DNS lewat router; `netmap` memetakan subnet satu-satu.
- Matikan service-port helper yang tidak dipakai.

## Langkah selanjutnya

Lanjutkan ke **Bab 12: Lab Akhir Firewall & NAT**, yang menyatukan semua konfigurasi dalam topologi dua router.
