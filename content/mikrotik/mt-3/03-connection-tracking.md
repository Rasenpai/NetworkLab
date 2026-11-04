---
title: Connection Tracking
summary: Memahami cara router mengingat koneksi, status paket, tabel koneksi, dan timeout.
minutes: 20
---

Connection tracking adalah "ingatan" firewall. Tanpanya, NAT tidak bisa bekerja dan aturan filter harus ditulis dua arah. Bab ini membahas cara kerja dan cara membacanya.

## Tujuan bab

- Menjelaskan fungsi connection tracking.
- Membedakan status koneksi `new`, `established`, `related`, `invalid`, dan `untracked`.
- Membaca tabel koneksi dan memantau penggunaannya.
- Memahami garis besar fasttrack.

## Cara kerjanya

Saat paket pertama sebuah koneksi lewat, router membuat satu **entri** di tabel koneksi: asal, tujuan, protokol, port, dan status. Paket berikutnya, termasuk balasan dari arah sebaliknya, dicocokkan dengan entri itu. Jika cocok, paket mewarisi status koneksinya.

Entri juga menyimpan informasi NAT. Itu sebabnya balasan dari internet bisa dikembalikan ke laptop yang benar setelah masquerade.

## Lima status koneksi

| Status         | Arti                                                                 | Biasanya       |
| -------------- | -------------------------------------------------------------------- | -------------- |
| `new`          | Paket pertama dari koneksi baru                                       | Dievaluasi     |
| `established`  | Koneksi yang sudah ada dan sudah ada paket di dua arah                | Diizinkan      |
| `related`      | Koneksi baru yang berhubungan dengan koneksi lain (misalnya pesan ICMP error, data FTP) | Diizinkan |
| `invalid`      | Paket yang tidak cocok dengan koneksi mana pun dan tidak masuk akal    | Di-drop        |
| `untracked`    | Paket yang sengaja dikecualikan dari tracking lewat tabel `raw`        | Diizinkan jika memang sengaja |

Polanya hampir selalu sama di chain `input` dan `forward`:

```routeros
/ip firewall filter add chain=forward connection-state=established,related,untracked action=accept
/ip firewall filter add chain=forward connection-state=invalid action=drop
```

Dua aturan ini nanti kamu pasang di bab 6 dan 7. Setelah itu, hanya paket berstatus `new` yang perlu dievaluasi dengan aturan lain, sehingga aturan lebih ringkas dan lebih cepat.

## Mengaktifkan dan memantau

```routeros
/ip firewall connection tracking print
/ip firewall connection tracking set enabled=auto
```

| Nilai `enabled` | Arti                                                        |
| --------------- | ----------------------------------------------------------- |
| `auto`          | Aktif otomatis selama ada aturan firewall atau NAT yang membutuhkannya (disarankan) |
| `yes`           | Selalu aktif                                                 |
| `no`            | Mati; NAT dan aturan berbasis `connection-state` tidak berfungsi |

Pada output `print`, perhatikan `max-entries` dan `total-entries`. Jika `total-entries` mendekati `max-entries`, tabel penuh dan koneksi baru bisa gagal. Penyebab umum adalah malware, torrent, atau serangan yang membuka ribuan koneksi.

## Membaca tabel koneksi

```routeros
/ip firewall connection print
/ip firewall connection print where protocol=tcp
/ip firewall connection print where dst-address~"8.8.8.8"
/ip firewall connection print count-only
```

Kolom penting:

| Kolom                  | Arti                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `src-address`          | Alamat dan port asal (sisi pengirim)                       |
| `dst-address`          | Alamat dan port tujuan                                     |
| `reply-src-address`    | Dari mana balasan akan datang                              |
| `reply-dst-address`    | Ke mana balasan akan dikirim (akan berbeda jika terkena NAT) |
| `timeout`              | Sisa waktu entri sebelum dihapus                           |

Di kolom flag ada huruf penanda, antara lain untuk koneksi yang sudah dikonfirmasi, yang terkena srcnat atau dstnat, dan yang memakai fasttrack. Legenda lengkap tampil di bagian atas output `print`.

Jika `reply-dst-address` berbeda dari `src-address`, itu bukti NAT sedang bekerja pada koneksi tersebut.

## Timeout

Entri yang tidak aktif akan dihapus setelah timeout.

| Protokol / kondisi            | Timeout bawaan |
| ----------------------------- | -------------- |
| `icmp-timeout`                | 10 detik       |
| `udp-timeout`                 | 10 detik       |
| `udp-stream-timeout`          | 3 menit        |
| `tcp-established-timeout`     | 1 hari         |
| `tcp-syn-sent-timeout`        | 5 detik        |

Lihat dan ubah dengan:

```routeros
/ip firewall connection tracking print
/ip firewall connection tracking set tcp-established-timeout=4h
```

Menurunkan `tcp-established-timeout` mengurangi beban tabel, tetapi koneksi yang diam lama (misalnya sesi SSH menganggur) bisa terputus.

## Fasttrack

Fasttrack mempercepat paket dari koneksi `established` dan `related` dengan melewati sebagian pemeriksaan. Aturannya sederhana:

```routeros
/ip firewall filter add chain=forward connection-state=established,related action=fasttrack-connection comment="Fasttrack"
```

Catatannya: paket yang difasttrack tidak diproses oleh `mangle` dan `queue`, jadi fitur pembatasan bandwidth berbasis queue tidak berlaku pada koneksi tersebut. Di lab ini fasttrack dipasang di bab 7 dan dijelaskan lagi di sana.

## Lab: melihat koneksi nyata

Di R1, pasang log untuk koneksi HTTPS baru:

```routeros
/ip firewall filter add chain=forward connection-state=new protocol=tcp dst-port=443 action=log log-prefix="NEW443" comment="Uji conntrack"
```

Dari laptop LAN 1, buka sebuah situs HTTPS, lalu lihat:

```routeros
/log print where message~"NEW443"
/ip firewall connection print where dst-address~":443"
```

Kamu akan melihat log hanya untuk **paket pertama** tiap koneksi (status `new`), sementara tabel koneksi menampilkan koneksi yang masih hidup. Perhatikan `reply-dst-address` pada koneksi dari LAN 1: alamatnya adalah alamat WAN R1 karena sudah di-masquerade.

Bersihkan:

```routeros
/ip firewall filter remove [find comment="Uji conntrack"]
```

## Troubleshooting

| Gejala                                         | Kemungkinan penyebab                              | Cek                                                    |
| ---------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| NAT tidak bekerja sama sekali                  | Connection tracking dimatikan                     | `/ip firewall connection tracking print`               |
| Koneksi baru sering gagal saat jaringan ramai  | Tabel koneksi penuh                               | Bandingkan `total-entries` dan `max-entries`           |
| Sesi SSH terputus saat menganggur              | Timeout pendek di tengah jalur                    | Periksa timeout dan keepalive SSH                      |

## Uji pemahaman

1. Apa yang disimpan router saat paket pertama sebuah koneksi lewat?
2. Kenapa paket `invalid` sebaiknya di-drop?
3. Apa arti status `related`? Berikan satu contoh.
4. Apa akibatnya jika connection tracking dimatikan sementara NAT masih dipakai?
5. Apa kekurangan fasttrack?

**Kunci jawaban**

1. Satu entri berisi asal, tujuan, protokol, port, status, dan info NAT.
2. Paket itu tidak cocok dengan koneksi mana pun dan tidak sah; membiarkannya hanya membuka celah.
3. Koneksi baru yang berhubungan dengan koneksi lain, misalnya pesan ICMP error atau koneksi data FTP.
4. NAT tidak berfungsi karena router tidak bisa mengembalikan balasan ke klien yang benar.
5. Paket yang difasttrack melewati `mangle` dan `queue`, sehingga pembatasan bandwidth berbasis queue tidak berlaku.

## Ringkasan

- Connection tracking membuat firewall stateful dan menjadi syarat NAT.
- Status koneksi menentukan pola aturan standar: izinkan `established,related,untracked`, drop `invalid`.
- Pantau `total-entries` agar tabel tidak penuh.

## Langkah selanjutnya

Lanjutkan ke **Bab 4: Filter Rule**, untuk mempelajari struktur sebuah aturan, daftar aksi, dan cara urutan aturan memengaruhi hasilnya.
