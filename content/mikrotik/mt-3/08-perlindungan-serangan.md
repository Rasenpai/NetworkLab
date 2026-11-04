---
title: Perlindungan dari Serangan Umum
summary: Menangani brute force SSH, port scan, serangan SYN flood, dan koneksi berlebih memakai address list, raw, dan limit.
minutes: 20
---

Firewall yang hanya statis tidak cukup. Penyerang mencoba berkali-kali, memindai port, dan membanjiri koneksi. Bab ini menambahkan pertahanan **adaptif** yang bereaksi terhadap perilaku mencurigakan.

## Tujuan bab

- Mendeteksi dan memblokir brute force pada SSH dengan daftar bertahap.
- Mendeteksi port scan.
- Memakai tabel `raw` untuk membuang paket lebih awal.
- Membatasi ICMP dan koneksi berlebih, serta mengaktifkan SYN cookies.

## Konsep: blacklist dinamis

Idenya: aturan memantau perilaku, lalu memasukkan pelaku ke address list `blacklist` dengan timeout. Aturan lain membuang semua paket dari alamat di list itu.

```
perilaku mencurigakan --> add-src-to-address-list (blacklist, timeout) --> drop
```

## Brute force SSH: daftar bertahap

Satu percobaan login gagal wajar. Banyak percobaan dalam waktu singkat tidak wajar. Setiap koneksi **baru** ke port 22 menaikkan peringkat sumbernya.

Aturan ini harus berada **di atas** aturan `Admin SSH+Winbox` dari bab 6, dengan urutan penting dari bawah ke atas:

```routeros
/ip firewall filter
add chain=input protocol=tcp dst-port=22 src-address-list=blacklist action=drop comment="SSH: drop blacklist" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage3 action=add-src-to-address-list address-list=blacklist address-list-timeout=1d comment="SSH: stage3 ke blacklist" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage2 action=add-src-to-address-list address-list=ssh_stage3 address-list-timeout=1m comment="SSH: stage2 ke stage3" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage1 action=add-src-to-address-list address-list=ssh_stage2 address-list-timeout=1m comment="SSH: stage1 ke stage2" place-before=[find comment="Admin SSH+Winbox"]
add chain=input protocol=tcp dst-port=22 connection-state=new action=add-src-to-address-list address-list=ssh_stage1 address-list-timeout=1m comment="SSH: koneksi baru ke stage1" place-before=[find comment="Admin SSH+Winbox"]
```

Cara kerjanya: koneksi baru pertama masuk `ssh_stage1`, yang kedua dalam semenit ke `ssh_stage2`, yang ketiga ke `ssh_stage3`, dan yang keempat berakhir di `blacklist` selama sehari.

Peringatan: admin yang salah ketik kata sandi berkali-kali juga bisa masuk blacklist. Tahan diri, atau hapus manual (lihat bagian merawat blacklist).

## Deteksi port scan

Port scan membuka banyak port dalam waktu singkat. Matcher `psd` (port scan detection) mengenalinya.

```routeros
/ip firewall filter add chain=input protocol=tcp psd=21,3s,3,1 action=add-src-to-address-list address-list=blacklist address-list-timeout=1d comment="Deteksi port scan" place-before=[find comment="Input: drop invalid"]
```

Parameter `psd=21,3s,3,1` berarti ambang bobot 21 dalam 3 detik, dengan bobot 3 untuk port rendah dan 1 untuk port tinggi. Nilai ini umum dipakai dan bisa disesuaikan.

## Raw: membuang lebih awal

Tabel `raw` memeriksa paket **sebelum** connection tracking, sehingga membuang paket di sini menghemat CPU dan memori tabel koneksi.

```routeros
/ip firewall raw add chain=prerouting src-address-list=blacklist action=drop comment="Drop blacklist (raw)"
```

Setelah ini, siapa pun di `blacklist` ditolak untuk semua layanan, bukan hanya SSH.

## ICMP, SYN flood, dan koneksi berlebih

Batasi laju ICMP dengan mengubah aturan dari bab 6:

```routeros
/ip firewall filter set [find comment="Izinkan ICMP"] limit=20,5:packet
```

Artinya maksimum 20 paket ICMP per detik, dengan lonjakan sesaat sampai 5 paket. Kelebihannya jatuh ke aturan drop terakhir.

Aktifkan SYN cookies untuk menahan SYN flood:

```routeros
/ip settings set tcp-syncookies=yes
```

Batasi koneksi berlebih per host. Mulai dengan **log** dulu agar tidak salah blokir:

```routeros
/ip firewall filter add chain=forward protocol=tcp connection-limit=300,32 action=log log-prefix="KONEKSI-BANYAK" comment="Pantau koneksi berlebih"
```

`connection-limit=300,32` cocok ketika satu alamat (`/32`) memiliki lebih dari 300 koneksi TCP. Setelah angka batas terbukti wajar untuk jaringanmu, barulah aksinya diganti menjadi `add-src-to-address-list`. Klien yang sah seperti torrent bisa melewati batas ini.

## Merawat blacklist

```routeros
/ip firewall address-list print where list=blacklist
/ip firewall address-list remove [find list=blacklist address=192.168.10.77]
/ip firewall address-list remove [find list=blacklist]
```

Baris kedua menghapus satu alamat, baris ketiga mengosongkan seluruh blacklist.

## Lab: memicu dan membuktikan

Gunakan **laptop uji**, bukan laptop admin utama.

1. Dari laptop uji di LAN 1, coba SSH ke router dengan sandi salah lima kali berturut-turut dalam satu menit: `ssh salah@192.168.10.1`.
2. Cek `blacklist` di R1:

```routeros
/ip firewall address-list print where list~"ssh_stage" or list=blacklist
```

3. Pastikan laptop uji sekarang tidak bisa ping R1 sama sekali (di-drop di raw).
4. Untuk uji port scan dari laptop uji: `nmap -sS 192.168.10.1`. Setelah beberapa detik alamat laptop uji muncul di `blacklist`.
5. Bersihkan: `/ip firewall address-list remove [find list=blacklist]`.

## Troubleshooting

| Gejala                                             | Kemungkinan penyebab                          | Cek                                                  |
| -------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Blacklist tidak terisi                             | Urutan aturan salah; aturan accept SSH di atasnya | `print` dan pastikan urutan benar                |
| Admin sendiri masuk blacklist                      | Terlalu banyak percobaan login                | Hapus entri; pertimbangkan batas yang lebih longgar  |
| Klien sah terblokir karena batas koneksi           | `connection-limit` terlalu rendah             | Pakai `log` dulu, lalu naikkan batas                 |
| Aturan raw tidak terlihat di menu filter           | Raw punya menu sendiri                        | `/ip firewall raw print`                             |

## Uji pemahaman

1. Kenapa daftar SSH dibuat bertahap (stage1 sampai stage3)?
2. Apa keuntungan membuang paket di tabel `raw`?
3. Apa fungsi `address-list-timeout`?
4. Kenapa `connection-limit` sebaiknya diuji dengan `log` dulu?
5. Apa fungsi `tcp-syncookies`?

**Kunci jawaban**

1. Agar satu atau dua percobaan wajar tidak langsung diblokir, hanya pelaku yang terus mengulang.
2. Paket dibuang sebelum connection tracking, sehingga menghemat CPU dan memori tabel koneksi.
3. Menentukan berapa lama sebuah alamat tetap berada di list sebelum dihapus otomatis.
4. Agar kamu tahu apakah batas itu salah memblokir klien yang sah sebelum memblokir sungguhan.
5. Membantu router bertahan dari SYN flood tanpa menyimpan setengah-koneksi di memori.

## Ringkasan

- Pertahanan adaptif memakai address list dengan timeout dan aturan `drop` di tabel `raw`.
- Brute force SSH ditangani dengan daftar bertahap, port scan dengan matcher `psd`.
- Selalu uji batas dengan `log` sebelum memblokir sungguhan.

## Langkah selanjutnya

Lanjutkan ke **Bab 9: Konsep NAT & Masquerade**, untuk memahami cara router menerjemahkan alamat sehingga banyak perangkat privat berbagi satu alamat publik.
