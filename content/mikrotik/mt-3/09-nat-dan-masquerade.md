---
title: Konsep NAT & Masquerade
summary: Memahami cara kerja NAT, perbedaan srcnat dan dstnat, serta kapan memakai masquerade atau src-nat.
minutes: 20
---

Alamat privat seperti `192.168.x.x` tidak bisa dirutekan di internet. NAT adalah cara agar banyak perangkat privat bisa berselancar dengan satu alamat publik. Bab ini membahas dasar-dasarnya.

## Tujuan bab

- Menjelaskan fungsi NAT dan alurnya langkah demi langkah.
- Membedakan `srcnat` dan `dstnat`.
- Memilih antara `masquerade` dan `src-nat`.
- Membaca bukti NAT di tabel koneksi.

## Dua jenis NAT

| Jenis    | Yang diubah         | Chain      | Pemakaian umum                          |
| -------- | ------------------- | ---------- | --------------------------------------- |
| `srcnat` | Alamat **asal**     | `srcnat`   | Berbagi internet (masquerade)           |
| `dstnat` | Alamat **tujuan**   | `dstnat`   | Port forwarding, redirect (bab 10-11)   |

Bab ini fokus pada `srcnat`.

## Alur NAT langkah demi langkah

Laptop LAN 2 (`192.168.20.10`) membuka DNS ke `8.8.8.8`. Alamat WAN R1 dari ISP kita misalkan `203.0.113.5`.

| Tahap                          | Sumber                       | Tujuan             |
| ------------------------------ | ---------------------------- | ------------------ |
| Keluar dari laptop             | `192.168.20.10:50000`        | `8.8.8.8:53`       |
| Setelah srcnat di R1           | `203.0.113.5:50000`          | `8.8.8.8:53`       |
| Balasan dari internet          | `8.8.8.8:53`                 | `203.0.113.5:50000` |
| Setelah router membalik NAT    | `8.8.8.8:53`                 | `192.168.20.10:50000` |

Router mencatat penerjemahan itu di tabel connection tracking. Itulah kenapa NAT tidak bisa bekerja tanpa connection tracking (bab 3). Jika dua laptop memakai port asal yang sama, router mengganti portnya agar tidak bentrok.

## Masquerade vs src-nat

| Aksi         | Alamat hasil terjemahan                         | Kapan dipakai                              |
| ------------ | ----------------------------------------------- | ------------------------------------------ |
| `masquerade` | Alamat saat ini di interface keluar             | WAN dengan alamat **dinamis** (DHCP, PPPoE) |
| `src-nat`    | Alamat tetap yang kamu tentukan (`to-addresses`) | WAN dengan alamat **statis**               |

Masquerade sedikit lebih berat karena harus mencari alamat interface dan membersihkan koneksi saat alamat berubah. Namun untuk WAN dengan DHCP, ia adalah pilihan yang tepat.

Contoh src-nat dengan alamat statis:

```routeros
/ip firewall nat add chain=srcnat out-interface-list=WAN action=src-nat to-addresses=203.0.113.5 comment="Src-nat statis"
```

Aturan di atas hanya contoh. Di lab, WAN R1 memakai DHCP, jadi kita memakai masquerade.

## Lab: merapikan NAT di R1

Aturan masquerade dari lab sebelumnya memakai `out-interface=ether1`. Ganti dengan interface list agar konsisten dengan firewall:

```routeros
/ip firewall nat remove [find comment="Internet untuk semua LAN"]
/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade comment="Internet untuk semua LAN"
/ip firewall nat print
```

Poin yang perlu dipahami:

- `out-interface-list=WAN` memastikan NAT hanya untuk paket yang **keluar ke internet**. Lalu lintas antara LAN 1 dan LAN 2 (keluar lewat `ether2` atau `ether3`) tidak terkena masquerade, jadi alamat asli klien tetap terlihat saat saling berhubungan.
- R2 tidak membutuhkan NAT karena R1 sudah melakukannya (lihat Lab Akhir Dua Jaringan).

Membatasi NAT untuk subnet tertentu:

```routeros
/ip firewall nat add chain=srcnat src-address=192.168.10.0/24 out-interface-list=WAN action=masquerade comment="Contoh: hanya LAN 1"
```

Itu contoh sintaks; jangan dipasang bersamaan dengan aturan umum di atas kecuali kamu memang ingin membatasi.

## Membuktikan NAT bekerja

1. Dari laptop LAN 2: `ping 8.8.8.8 -t` (biarkan berjalan).
2. Di R1, lihat koneksi ICMP:

```routeros
/ip firewall connection print where protocol=icmp
```

3. Bandingkan `src-address` dengan `reply-dst-address`. Pada koneksi yang terkena NAT, `reply-dst-address` adalah alamat WAN R1, sedangkan `src-address` adalah `192.168.20.10`.
4. Lihat counter NAT:

```routeros
/ip firewall nat print stats
```

Hentikan ping dengan `Ctrl+C`.

## Hubungan dengan firewall filter

NAT hanya **menerjemahkan**; ia tidak mengizinkan atau memblokir. Tanpa aturan `forward` yang mengizinkan LAN ke internet, paket tetap bisa dijatuhkan oleh filter. Pada konfigurasi kita, chain `forward` mengizinkan LAN ke WAN secara bawaan (bab 7), jadi NAT dan filter bekerja bersama.

## Troubleshooting

| Gejala                                        | Kemungkinan penyebab                            | Cek                                             |
| --------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| LAN tidak bisa ke internet, ping IP gagal     | Aturan masquerade tidak ada atau interface salah | `/ip firewall nat print`                       |
| LAN 1 bisa, LAN 2 tidak                       | Route balik atau default route R2 salah         | `/ip route print` di R2                         |
| Masquerade cocok tetapi tetap gagal           | Connection tracking mati                        | `/ip firewall connection tracking print`        |
| Klien terlihat memakai IP WAN saat antar LAN  | Masquerade tidak dibatasi ke WAN                | Pastikan `out-interface-list=WAN`               |
| Koneksi putus saat IP WAN berubah             | Perilaku normal masquerade                      | Koneksi lama dibersihkan, klien menyambung ulang |

## Uji pemahaman

1. Apa beda `srcnat` dan `dstnat`?
2. Kapan memilih `masquerade` dan kapan `src-nat`?
3. Kenapa lalu lintas antar LAN tidak terkena masquerade pada konfigurasi kita?
4. Apa akibatnya jika connection tracking dimatikan?
5. Kolom mana di tabel koneksi yang membuktikan NAT bekerja?

**Kunci jawaban**

1. `srcnat` mengubah alamat asal, `dstnat` mengubah alamat tujuan.
2. `masquerade` untuk WAN dengan alamat dinamis, `src-nat` untuk alamat statis.
3. Aturan masquerade dibatasi `out-interface-list=WAN`, sedangkan lalu lintas antar LAN keluar lewat interface LAN.
4. NAT tidak berfungsi karena router tidak bisa mencatat dan membalik terjemahan.
5. `reply-dst-address`, yang berbeda dari `src-address` bila terkena NAT.

## Ringkasan

- `srcnat` mengganti alamat asal sehingga banyak klien privat berbagi satu alamat publik.
- Masquerade untuk WAN dinamis, src-nat untuk WAN statis; batasi ke interface WAN.
- NAT bergantung pada connection tracking dan tidak menggantikan fungsi filter.

## Langkah selanjutnya

Lanjutkan ke **Bab 10: Dst-NAT & Port Forwarding**, untuk membuat server di LAN bisa diakses dari internet secara terkontrol.
