---
title: Bridge untuk Jaringan LAN
summary: Menggabungkan beberapa port menjadi satu segmen LAN dengan satu IP gateway.
minutes: 20
---

Router MikroTik biasanya punya banyak port. Agar beberapa port itu menjadi satu jaringan LAN, kamu memakai **bridge**.

## Tujuan belajar

- Memahami fungsi bridge.
- Membuat bridge dan memasukkan port ke dalamnya.
- Memindahkan IP, DHCP server, dan interface list ke bridge.
- Membaca tabel MAC yang dipelajari bridge.

## Apa itu bridge

Bridge bekerja di **layer 2** dan berperan seperti switch virtual: port di dalamnya saling terhubung tanpa routing, sehingga semua perangkat berada di subnet yang sama.

![Contoh switch Ethernet](https://commons.wikimedia.org/wiki/Special:FilePath/ZyXEL_desktop_Ethernet_switch.jpg?width=640 "Contoh switch Ethernet desktop. Sumber: Wikimedia Commons")

| Tanpa bridge                                         | Dengan bridge                                  |
| ---------------------------------------------------- | ---------------------------------------------- |
| Tiap port butuh IP dan subnet sendiri                | Satu IP untuk semua port anggota               |
| Perangkat di port berbeda tidak otomatis satu jaringan | Semua perangkat satu jaringan                |
| Cocok untuk menghubungkan jaringan berbeda           | Cocok untuk LAN yang menyambung banyak perangkat |

Dengan bridge, IP gateway dipasang pada **interface bridge**, bukan pada port anggota.

## Membuat bridge

Contoh: `ether2` sampai `ether5` menjadi satu LAN.

```routeros
/interface bridge add name=bridge-lan comment="LAN utama"
/interface bridge port add bridge=bridge-lan interface=ether2
/interface bridge port add bridge=bridge-lan interface=ether3
/interface bridge port add bridge=bridge-lan interface=ether4
/interface bridge port add bridge=bridge-lan interface=ether5
```

Pasang IP pada bridge:

```routeros
/ip address add address=192.168.10.1/24 interface=bridge-lan comment="Gateway LAN"
```

Periksa:

```routeros
/interface bridge print
/interface bridge port print
```

> Setelah sebuah port masuk bridge, IP tidak boleh lagi dipasang pada port itu. Pasang IP pada `bridge-lan`.

## Memindahkan LAN yang sudah berjalan ke bridge

Jika sebelumnya IP dan DHCP server memakai `ether2` langsung, pindahkan ke bridge. Langkah ini memutus koneksi sebentar, jadi **sambung ke router lewat MAC address di Winbox** dan siapkan Safe Mode.

```routeros
/interface bridge add name=bridge-lan comment="LAN utama"
/ip address set [find interface=ether2] interface=bridge-lan
/ip dhcp-server set dhcp-lan interface=bridge-lan
/interface bridge port add bridge=bridge-lan interface=ether2
/interface bridge port add bridge=bridge-lan interface=ether3
```

Jika kamu memakai interface list `LAN`, perbarui anggotanya:

```routeros
/interface list member remove [find list=LAN interface=ether2]
/interface list member add list=LAN interface=bridge-lan
```

Interface list menentukan aturan firewall, MAC server, dan discovery yang mengacu ke `LAN`. Kalau lupa memperbaruinya, aturan itu tidak lagi berlaku untuk LAN barumu.

## Tabel MAC (host)

Bridge mempelajari MAC address perangkat di setiap port, mirip switch:

```routeros
/interface bridge host print
```

Kolom `ON-INTERFACE` menunjukkan di port mana sebuah MAC terlihat. Ini berguna untuk mencari lokasi fisik suatu perangkat.

## Protokol STP

Jika dua bridge atau switch tersambung dengan lebih dari satu jalur, bisa terjadi **loop** yang melumpuhkan jaringan. Bridge memakai STP untuk memblokir jalur berlebih.

```routeros
/interface bridge set bridge-lan protocol-mode=rstp
```

RSTP adalah pilihan umum karena pulih lebih cepat dibanding STP lama.

## Tips

- Beri nama yang jelas seperti `bridge-lan`, dan beri `comment`.
- Jangan masukkan port WAN ke bridge LAN.
- Pada router dengan banyak port, satu bridge cukup untuk kebanyakan jaringan kecil.
- Pemisahan jaringan dengan VLAN dibahas di materi lanjutan.

## Ringkasan

- Bridge menggabungkan beberapa port menjadi satu segmen layer 2.
- IP gateway, DHCP server, dan interface list dipasang pada **bridge**, bukan pada port anggota.
- Saat memindahkan LAN ke bridge, sambung lewat MAC dan pakai Safe Mode.
- `/interface bridge host print` menunjukkan MAC di setiap port.

## Latihan

1. Buat `bridge-lan` dan masukkan `ether2` sampai `ether4`.
2. Pasang IP `192.168.10.1/24` di bridge, hubungkan dua laptop ke port berbeda, lalu pastikan keduanya saling bisa ping.
3. Cek `/interface bridge host print` dan temukan MAC laptop kamu.
