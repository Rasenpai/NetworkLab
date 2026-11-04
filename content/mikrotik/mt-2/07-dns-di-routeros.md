---
title: DNS di RouterOS
summary: Mengatur DNS cache, DNS statis, dan memahami cara router menerjemahkan nama domain.
minutes: 20
---

Manusia mengingat nama seperti `google.com`, sedangkan jaringan bekerja dengan IP. **DNS** menerjemahkan nama domain menjadi alamat IP. Router MikroTik bisa menjadi **DNS cache** untuk seluruh LAN.

## Tujuan belajar

- Memahami cara kerja pencarian DNS.
- Mengatur DNS di router dan membagikannya ke client.
- Memakai DNS cache dan membersihkannya.
- Membuat nama lokal dengan DNS statis.
- Mengamankan DNS router dari akses luar.

## Cara kerja DNS

![Contoh resolver DNS iteratif](https://commons.wikimedia.org/wiki/Special:FilePath/Example_of_an_iterative_DNS_resolver.svg?width=800 "Contoh resolver DNS iteratif. Sumber: Wikimedia Commons")

Secara sederhana urutannya seperti ini:

1. Client bertanya ke DNS server miliknya (misalnya router).
2. Jika router sudah menyimpan jawabannya (**cache**), jawaban langsung dikirim.
3. Jika belum, router bertanya ke DNS upstream seperti `8.8.8.8`.
4. Jawaban dikirim ke client dan disimpan di cache untuk permintaan berikutnya.

Keuntungan cache: akses ke domain yang sama jadi lebih cepat dan trafik DNS ke luar berkurang.

## Mengatur DNS di router

```routeros
/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes
/ip dns print
```

| Parameter                 | Fungsi                                                     |
| ------------------------- | ---------------------------------------------------------- |
| `servers`                 | DNS upstream tempat router bertanya                        |
| `allow-remote-requests`   | Izinkan client lain memakai router sebagai DNS server      |
| `cache-size`              | Besar memori untuk cache                                   |

Router tanpa `allow-remote-requests=yes` hanya melayani dirinya sendiri, sehingga client LAN tidak bisa memakainya sebagai DNS.

Untuk menambah ukuran cache:

```routeros
/ip dns set cache-size=4096KiB
```

## Membagikan DNS ke client

Client tidak perlu mengatur DNS manual. DHCP server membagikannya lewat parameter `dns-server` di bagian network:

```routeros
/ip dhcp-server network set [find address=192.168.10.0/24] dns-server=192.168.10.1
```

Dengan begitu client memakai router sebagai DNS, dan router memakai upstream yang kamu pilih.

## Mengamankan DNS router

Dengan `allow-remote-requests=yes`, router menjawab permintaan DNS dari **mana pun**, termasuk internet. Hal ini bisa dimanfaatkan penyerang. Blokir dari sisi WAN:

```routeros
/ip firewall filter add chain=input in-interface=ether1 protocol=udp dst-port=53 action=drop comment="Blok DNS dari WAN"
/ip firewall filter add chain=input in-interface=ether1 protocol=tcp dst-port=53 action=drop comment="Blok DNS dari WAN"
```

## DNS cache

Lihat isi cache dan bersihkan jika perlu:

```routeros
/ip dns cache print
/ip dns cache print detail
/ip dns cache flush
```

Bersihkan cache saat:

- Kamu baru mengubah alamat server dan client masih menuju IP lama.
- Hasil resolve terlihat salah atau kedaluwarsa.

## DNS statis

DNS statis membuat nama lokal yang bisa diakses seluruh LAN, tanpa perlu menghafal IP.

```routeros
/ip dns static add name=router.lab address=192.168.10.1
/ip dns static add name=server.lab address=192.168.10.10
/ip dns static print
```

Setelah itu client bisa membuka `server.lab`. Ini juga berguna untuk mengarahkan nama domain tertentu ke server lokal.

## Menguji DNS

Dari router:

```routeros
:resolve domain-name=google.com
/ping google.com count=4
```

Dari Windows:

```
nslookup google.com 192.168.10.1
```

Perintah `nslookup` dengan alamat di belakangnya menguji DNS server tertentu secara langsung.

## Memaksa client memakai DNS router

Sebagian perangkat memakai DNS sendiri (misalnya `8.8.8.8`) dan mengabaikan DNS dari DHCP. Kamu bisa mengalihkan semua permintaan DNS dari LAN ke router:

```routeros
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=udp dst-port=53 action=redirect to-ports=53 comment="Paksa DNS ke router"
```

> Aturan ini mengubah perilaku semua client, jadi uji dulu di lab. Perangkat yang memakai DNS terenkripsi (DoH atau DoT) tidak terpengaruh oleh aturan ini.

## Troubleshooting

| Gejala                                       | Penyebab umum                                  | Perbaikan                                      |
| -------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `ping 8.8.8.8` berhasil, `ping google.com` gagal | DNS belum diatur atau tidak terjangkau     | `/ip dns print`, cek `servers`                 |
| Client LAN tidak bisa resolve                | `allow-remote-requests` masih `no`             | Set ke `yes`                                   |
| Nama lokal tidak terbuka                     | DNS statis salah atau client memakai DNS lain  | `/ip dns static print`, cek DNS di client      |
| Alamat lama masih muncul                     | Cache belum diperbarui                         | `/ip dns cache flush`                          |

## Ringkasan

- DNS menerjemahkan nama domain menjadi IP, dan router bisa menjadi DNS cache untuk LAN.
- Aktifkan `allow-remote-requests=yes` agar client memakai router, lalu blokir dari WAN.
- DHCP server membagikan alamat DNS ke client lewat `dns-server`.
- DNS statis membuat nama lokal, `cache flush` membersihkan cache.

## Latihan

1. Atur DNS router, lalu uji `:resolve domain-name=google.com`.
2. Buat nama `server.lab` yang menuju `192.168.10.10`, lalu uji dari laptop dengan `nslookup server.lab 192.168.10.1`.
3. Jalankan `/ip dns cache print`, buka satu website baru, lalu lihat apakah entri baru muncul.
