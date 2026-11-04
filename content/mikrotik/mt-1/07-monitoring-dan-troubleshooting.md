---
title: Monitoring dan Troubleshooting Dasar
summary: Memantau kondisi router dan menemukan sumber masalah jaringan lapis demi lapis.
minutes: 15
---

Router yang sudah berjalan perlu dipantau, dan saat ada keluhan "internet lambat atau mati" kamu butuh cara sistematis untuk mencari penyebabnya.

## Tujuan belajar

- Membaca kondisi router: CPU, memori, suhu, dan uptime.
- Memantau trafik interface dan membaca log.
- Memakai ping, traceroute, torch, dan sniffer.
- Mengikuti alur troubleshooting dari lapis bawah ke atas.

## Kondisi router

```routeros
/system resource print
/system health print
/system resource cpu print
```

| Informasi        | Yang perlu diperhatikan                                    |
| ---------------- | ---------------------------------------------------------- |
| `uptime`         | Uptime pendek yang tak terduga berarti router reboot sendiri |
| `cpu-load`       | Terus tinggi di atas 80 persen menandakan beban berlebih   |
| `free-memory`    | Sangat kecil menandakan memori hampir habis                |
| `version`        | Pastikan versi RouterOS sesuai yang diharapkan             |

`/system health` menampilkan suhu dan tegangan. Perintah ini tidak tersedia di semua model.

## Memantau trafik

```routeros
/interface print stats
/interface monitor-traffic ether1
/interface monitor-traffic ether1 once
```

`monitor-traffic` menampilkan kecepatan masuk dan keluar secara langsung. Gunakan `once` untuk satu kali tampil saja.

Untuk melihat **siapa** yang memakai bandwidth, pakai **Torch**:

```routeros
/tool torch interface=ether1
/tool torch interface=ether1 protocol=tcp
/tool torch interface=ether1 port=443
```

Torch menampilkan koneksi aktif beserta IP sumber, tujuan, dan kecepatan masing-masing, jadi sangat berguna saat ada satu perangkat yang menghabiskan bandwidth.

## Membaca log

```routeros
/log print
/log print follow
/log print where topics~"firewall"
```

- `follow` menampilkan log baru secara langsung.
- `where topics~"..."` memfilter berdasarkan topik, misalnya `dhcp`, `system`, atau `firewall`.

## Tool jaringan

**Ping** menguji apakah tujuan bisa dijangkau.

```routeros
/ping 8.8.8.8 count=4
/ping 8.8.8.8 interface=ether1 count=4
```

**Traceroute** menunjukkan jalur paket menuju tujuan, hop demi hop.

```routeros
/tool traceroute 8.8.8.8
```

![Contoh output traceroute](https://commons.wikimedia.org/wiki/Special:FilePath/Traceroute.png?width=800 "Contoh hasil traceroute. Sumber: Wikimedia Commons")

Jika traceroute berhenti di hop tertentu, masalahnya biasanya ada di hop itu atau setelahnya.

**Packet sniffer** menangkap paket yang lewat. Hasilnya bisa dibuka di Wireshark.

```routeros
/tool sniffer quick ip-address=192.168.10.20
```

![Contoh tampilan Wireshark](https://commons.wikimedia.org/wiki/Special:FilePath/Wireshark_screenshot.png?width=800 "Contoh Wireshark untuk menganalisis paket. Sumber: Wikimedia Commons")

Beberapa perintah pencarian lain yang sering membantu:

```routeros
/ip arp print
/ip dhcp-server lease print
/ip firewall connection print count-only
```

## Alur troubleshooting

Mulailah dari lapis paling bawah dan naik ke atas. Jangan langsung curiga ke konfigurasi yang rumit.

| Lapis        | Pertanyaan                                | Cara cek                                       |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| Fisik        | Kabel dan port berfungsi?                 | `/interface print`, lihat flag `R` dan status link |
| IP           | Client punya IP dan gateway yang benar?   | `ipconfig`, `/ip address print`                |
| Gateway      | Router bisa dijangkau dari client?        | `ping 192.168.10.1` dari client                |
| Routing      | Ada default route yang aktif?             | `/ip route print`                              |
| NAT          | Client bisa keluar ke internet?           | `/ip firewall nat print`                       |
| DNS          | Nama domain bisa diterjemahkan?           | `ping google.com`, `/ip dns print`             |

![Konektor Ethernet RJ45](https://commons.wikimedia.org/wiki/Special:FilePath/Ethernet_RJ45_connector_p1160054.jpg?width=640 "Konektor Ethernet RJ45. Sumber: Wikimedia Commons")

Cek kualitas link ethernet bila koneksi putus-putus:

```routeros
/interface ethernet monitor ether1 once
/interface ethernet print stats
```

Kecepatan link yang jauh di bawah normal, atau error CRC yang terus naik, biasanya menandakan kabel atau konektor bermasalah.

## Contoh kasus

**Gejala:** client mendapat IP tetapi tidak bisa membuka website.

1. `ping 192.168.10.1` dari client: berhasil. Berarti LAN sehat.
2. `/ping 8.8.8.8 count=4` dari router: berhasil. Berarti WAN dan routing sehat.
3. `ping 8.8.8.8` dari client: gagal. Berarti masalah ada di antara client dan WAN.
4. `/ip firewall nat print`: rule masquerade tidak ada. Itulah penyebabnya.
5. Tambahkan lagi rule NAT, lalu ulangi tes dari client.

## Ringkasan

- Pantau `/system resource`, trafik interface, dan log secara rutin.
- **Torch** menunjukkan siapa yang memakai bandwidth, **traceroute** menunjukkan di hop mana masalah muncul.
- Troubleshooting dilakukan berurutan: fisik, IP, gateway, routing, NAT, DNS.
- Uji dari sisi router dan dari sisi client untuk mempersempit penyebab.

## Latihan

1. Jalankan `torch` di `ether1` sambil membuka video dari laptop. Amati koneksi yang muncul.
2. Matikan rule NAT sementara, lalu ikuti alur troubleshooting sampai kamu menemukan penyebabnya sendiri. Aktifkan lagi setelahnya.
3. Lihat `/log print follow`, lalu cabut dan colok kabel `ether2`. Apa yang tercatat?
