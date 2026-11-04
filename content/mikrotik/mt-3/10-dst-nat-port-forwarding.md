---
title: Dst-NAT & Port Forwarding
summary: Mempublikasikan layanan di LAN ke internet dengan dst-nat dan aturan forward yang dibatasi.
minutes: 20
---

Bab 9 membahas koneksi yang **keluar**. Sekarang kebalikannya: seseorang dari internet ingin menjangkau server di dalam LAN. Router harus meneruskan (forward) koneksi itu ke perangkat yang benar.

## Tujuan bab

- Membuat aturan `dst-nat` untuk port forwarding.
- Menambahkan izin `forward` yang sempit agar hanya port yang dibutuhkan terbuka.
- Memahami batasan jika ISP memakai alamat privat (CGNAT).
- Menguji port forwarding dari luar jaringan.

## Skenario

Sebuah web server berada di LAN 1 dengan alamat `192.168.10.50`, melayani HTTP di port 80. Kita ingin dunia luar mengaksesnya lewat **port 8080** pada alamat publik R1.

```
Internet --> R1 (WAN:8080) --> [dst-nat] --> 192.168.10.50:80
```

Menggunakan port luar 8080 (bukan 80) adalah pilihan agar tidak bentrok dengan layanan lain dan mengurangi pindaian otomatis di port standar.

## Aturan dst-nat

Di R1:

```routeros
/ip firewall nat add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=8080 action=dst-nat to-addresses=192.168.10.50 to-ports=80 comment="Port forward web server"
```

| Bagian                        | Arti                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `chain=dstnat`                | Dijalankan sebelum keputusan routing                        |
| `in-interface-list=WAN`       | Hanya paket yang masuk dari WAN                             |
| `dst-port=8080`               | Port yang dituju dari luar                                  |
| `to-addresses`, `to-ports`    | Tujuan sebenarnya di dalam LAN                              |

Kita memakai `in-interface-list=WAN`, bukan `dst-address=<IP-publik>`, karena alamat WAN kita dinamis dan bisa berubah.

## Izin di chain forward

Di bab 7 ada aturan `Drop WAN ke LAN` yang membuang semua koneksi baru dari WAN. Agar port forwarding berjalan, buat izin yang **sempit** dan taruh **di atas** aturan drop itu:

```routeros
/ip firewall filter add chain=forward in-interface-list=WAN connection-state=new connection-nat-state=dstnat dst-address=192.168.10.50 protocol=tcp dst-port=80 action=accept place-before=[find comment="Drop WAN ke LAN"] comment="Izinkan port forward web"
```

Perhatikan alamat dan port di aturan ini adalah **hasil terjemahan** (`192.168.10.50:80`), bukan `8080`. Itu karena dst-nat berjalan di prerouting sebelum paket sampai ke chain `forward` (bab 2).

Hasilnya: hanya koneksi baru ke server itu pada port 80 yang lolos. Perangkat lain di LAN tetap tidak terjangkau dari internet.

## Server di LAN 2

Alur untuk server di LAN 2 sama, misalnya `192.168.20.50`: ubah `to-addresses` dan `dst-address`. Paket diteruskan R1 ke R2 melalui route statis `192.168.20.0/24`, dan balasan kembali lewat default route R2 ke R1. Pastikan aturan segmentasi tidak menghalangi, karena koneksi ini berasal dari WAN, bukan dari LAN 2 ke LAN 1.

## Syarat agar bisa diakses dari internet

| Syarat                                         | Cara memeriksa                                           |
| ---------------------------------------------- | -------------------------------------------------------- |
| WAN R1 memiliki alamat **publik**              | Bandingkan `/ip address print` dengan situs "what is my ip" |
| ISP tidak memblokir port masuk                 | Uji dari jaringan lain                                   |
| Server mendengarkan di port 80 dan gateway-nya benar | Dari R1: `/tool fetch` atau akses dari laptop LAN 1 |
| Firewall server sendiri mengizinkan            | Cek firewall OS server                                   |

Jika ISP memakai CGNAT, alamat WAN R1 berupa alamat privat atau rentang `100.64.0.0/10`. Dalam kondisi itu port forwarding dari internet **tidak mungkin** bekerja, apa pun konfigurasi router. Solusinya meminta alamat publik ke ISP atau memakai VPN atau tunnel.

## Pengujian

1. Pastikan server berjalan: dari laptop LAN 1, buka `http://192.168.10.50`.
2. Dari **jaringan lain** (misalnya data seluler di ponsel), buka `http://<alamat-publik-R1>:8080`.
3. Di R1, buktikan aturan terpakai:

```routeros
/ip firewall nat print stats where comment="Port forward web server"
/ip firewall filter print stats where comment="Izinkan port forward web"
/ip firewall connection print where dst-address~":8080"
```

Counter kedua aturan naik, dan pada koneksi akan terlihat penerjemahan tujuan ke `192.168.10.50:80`.

Jangan menguji dari dalam LAN dengan memakai alamat publik: itu memerlukan hairpin NAT yang dibahas di bab 11.

## Praktik aman

- Teruskan **hanya** port yang benar-benar dibutuhkan, jangan pernah membuka Winbox, SSH router, atau DNS ke internet.
- Batasi sumber bila memungkinkan, misalnya `src-address-list=kantor-saya` pada aturan `forward` dan `dst-nat`.
- Pertimbangkan VPN untuk akses administrasi, bukan port forwarding.
- Pantau log atau counter agar kamu tahu bila ada upaya akses ke port yang dipublikasikan.

## Troubleshooting

| Gejala                                         | Kemungkinan penyebab                            | Cek                                             |
| ---------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| Tidak bisa diakses dari luar sama sekali       | CGNAT atau ISP memblokir port                   | Cek alamat WAN dan uji dari jaringan lain       |
| Counter dst-nat 0                              | Interface list atau port salah                  | `print stats` dan cek `in-interface-list`       |
| Counter dst-nat naik tetapi koneksi gagal      | Aturan `forward` belum mengizinkan              | Periksa urutan aturan izin dan `Drop WAN ke LAN`|
| Koneksi masuk tetapi tidak ada balasan         | Gateway server salah                            | Pastikan gateway server = IP router LAN         |
| Berhasil dari luar tetapi gagal dari LAN       | Perlu hairpin NAT                               | Lihat bab 11                                    |

## Uji pemahaman

1. Kenapa `dst-nat` memakai chain `dstnat` dan bukan `forward`?
2. Kenapa di aturan `forward` port yang dipakai adalah 80, bukan 8080?
3. Kenapa lebih baik memakai `in-interface-list=WAN` daripada `dst-address`?
4. Apa yang membuat port forwarding mustahil walau konfigurasi benar?
5. Sebutkan dua cara memperkecil risiko layanan yang dipublikasikan.

**Kunci jawaban**

1. Karena penerjemahan tujuan harus terjadi sebelum keputusan routing, yaitu di tahap prerouting.
2. Karena di chain `forward` alamat dan port sudah hasil terjemahan dst-nat.
3. Alamat WAN dinamis bisa berubah, sedangkan interface tetap sama.
4. ISP memakai CGNAT sehingga alamat WAN bukan alamat publik, atau ISP memblokir port.
5. Membuka hanya port yang diperlukan, membatasi sumber akses, dan memakai VPN untuk administrasi.

## Ringkasan

- `dst-nat` mengarahkan koneksi masuk dari WAN ke server di LAN.
- Berikan izin `forward` yang sempit di atas aturan drop WAN.
- Pastikan WAN punya alamat publik, dan uji dari jaringan lain.

## Langkah selanjutnya

Lanjutkan ke **Bab 11: NAT Lanjutan**, yang membahas hairpin NAT, redirect, netmap, dan service-port helper.
