---
title: DHCP Client dan DHCP Relay
summary: Mengambil IP dari ISP lewat DHCP client, dan meneruskan permintaan DHCP antar jaringan dengan relay.
minutes: 15
---

Di bab sebelumnya router bertindak sebagai **server**. Di bab ini kamu mempelajari dua peran lain: router sebagai **client** (mengambil IP dari ISP) dan sebagai **relay** (meneruskan permintaan DHCP ke server di jaringan lain).

## Tujuan belajar

- Mengaktifkan DHCP client di interface WAN.
- Memahami apa saja yang otomatis diatur oleh DHCP client.
- Memahami masalah broadcast DHCP lintas jaringan.
- Mengatur DHCP relay.

## DHCP client di WAN

Banyak ISP atau modem memberikan IP lewat DHCP. Aktifkan client pada interface WAN:

```routeros
/ip dhcp-client add interface=ether1 disabled=no
/ip dhcp-client print
```

Pastikan kolom status berisi `bound`. Jika terus `searching...`, artinya router belum mendapat jawaban dari server DHCP, jadi cek kabel dan modem.

![Diagram status DHCP client](https://commons.wikimedia.org/wiki/Special:FilePath/Dhcp-client-state-diagram.svg?width=800 "Diagram status DHCP client. Sumber: Wikimedia Commons")

## Yang otomatis diatur DHCP client

| Parameter          | Bawaan | Arti                                                         |
| ------------------ | ------ | ------------------------------------------------------------ |
| `add-default-route` | `yes` | Membuat default route lewat gateway dari ISP                 |
| `use-peer-dns`     | `yes`  | Memakai DNS dari ISP sebagai DNS router                      |
| `use-peer-ntp`     | `yes`  | Memakai NTP server dari ISP                                  |

Lihat detailnya:

```routeros
/ip dhcp-client print detail
/ip route print where dst-address=0.0.0.0/0
```

Jika kamu ingin memakai DNS sendiri, misalnya `8.8.8.8`, matikan penggunaan DNS dari ISP:

```routeros
/ip dhcp-client set [find interface=ether1] use-peer-dns=no
/ip dns set servers=8.8.8.8,1.1.1.1
```

## Memperbarui atau melepas IP

```routeros
/ip dhcp-client renew [find interface=ether1]
/ip dhcp-client release [find interface=ether1]
```

`renew` dipakai saat IP WAN perlu diperbarui, misalnya setelah modem diganti. `release` melepas IP lama.

## Jika dua jalur WAN

Dengan dua ISP, kedua DHCP client akan membuat default route masing-masing. Atur prioritasnya dengan `default-route-distance` (nilai lebih kecil lebih diutamakan):

```routeros
/ip dhcp-client set [find interface=ether1] default-route-distance=1
/ip dhcp-client set [find interface=ether2] default-route-distance=2
```

Konsep distance dibahas di bab routing statis.

## Masalah: DHCP tidak melewati router

DHCP Discover dikirim sebagai **broadcast**. Broadcast tidak diteruskan oleh router, jadi client di jaringan A tidak bisa menjangkau DHCP server yang berada di jaringan B.

| Pendekatan                              | Keterangan                                       |
| --------------------------------------- | ------------------------------------------------ |
| DHCP server di setiap jaringan          | Sederhana, tetapi banyak yang harus diurus       |
| Satu DHCP server pusat + **DHCP relay** | Lebih rapi untuk banyak subnet                   |

## DHCP relay

Relay menangkap broadcast dari client, lalu meneruskannya sebagai paket unicast ke DHCP server pusat. Jawaban server dikembalikan ke client lewat relay.

Contoh: router `R2` melayani LAN `192.168.20.0/24`, sedangkan DHCP server pusat ada di `10.0.0.5`.

```routeros
/ip dhcp-relay add name=relay1 interface=ether2 dhcp-server=10.0.0.5 local-address=192.168.20.1 disabled=no
```

| Parameter       | Arti                                                          |
| --------------- | ------------------------------------------------------------- |
| `interface`     | Interface tempat client berada                                |
| `dhcp-server`   | Alamat DHCP server pusat                                      |
| `local-address` | IP router di sisi client, dipakai server untuk memilih pool   |

DHCP server pusat harus memiliki **network dan pool** untuk subnet `192.168.20.0/24`, dan harus punya route balik menuju subnet tersebut.

> Pada router yang menjalankan relay, jangan aktifkan DHCP server di interface yang sama.

## Ringkasan

- **DHCP client** di WAN mengambil IP, default route, dan DNS dari ISP.
- Status `bound` berarti berhasil, `searching...` berarti belum dapat jawaban.
- Broadcast DHCP tidak melewati router, sehingga lintas subnet butuh **DHCP relay**.
- Relay meneruskan permintaan client ke satu DHCP server pusat.

## Latihan

1. Cek status DHCP client di `ether1` dan catat gateway-nya.
2. Matikan `use-peer-dns`, atur DNS sendiri, lalu uji `ping google.com`.
3. Jelaskan dengan kata-katamu kenapa client di jaringan lain tidak bisa mendapat IP tanpa relay.
