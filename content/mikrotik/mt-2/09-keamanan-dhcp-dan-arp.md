---
title: Keamanan DHCP dan ARP
summary: Mencegah DHCP palsu dan serangan ARP spoofing dengan DHCP snooping dan ARP reply-only.
minutes: 20
---

DHCP dan ARP bekerja tanpa autentikasi, sehingga siapa pun di LAN bisa berpura-pura. Bab ini membahas ancaman umum dan cara meredamnya di MikroTik.

> Fitur di bab ini mengubah perilaku seluruh LAN. Uji di lab dulu dan aktifkan **Safe Mode** saat menerapkannya.

## Tujuan belajar

- Mengenali ancaman rogue DHCP dan ARP spoofing.
- Mengaktifkan DHCP snooping pada bridge.
- Memakai ARP `reply-only` bersama static lease.
- Menyusun IP tetap yang rapi dan aman.

## Ancaman di LAN

| Ancaman             | Cara kerja                                                         | Dampak                                  |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| **Rogue DHCP**      | Perangkat asing membalas Discover lebih cepat dari server resmi    | Client mendapat gateway atau DNS palsu  |
| **ARP spoofing**    | Penyerang mengaku memiliki IP gateway lewat ARP palsu              | Trafik client dialihkan lewat penyerang |
| **IP liar**         | Perangkat memasang IP manual sembarangan                           | Bentrok IP, sulit dilacak               |

Contoh nyata rogue DHCP: seseorang menyambungkan router rumah ke port LAN kantor. Router itu ikut membagikan IP, dan sebagian client tiba-tiba kehilangan internet.

## DHCP snooping

DHCP snooping membuat bridge hanya menerima jawaban DHCP dari port yang ditandai **trusted**. Jawaban DHCP dari port lain dibuang.

```routeros
/interface bridge set bridge-lan dhcp-snooping=yes add-dhcp-option82=yes
/interface bridge port set [find interface=ether5] trusted=yes
```

| Pengaturan             | Fungsi                                                      |
| ---------------------- | ----------------------------------------------------------- |
| `dhcp-snooping=yes`    | Mengaktifkan pemeriksaan paket DHCP pada bridge             |
| `add-dhcp-option82=yes` | Menambahkan informasi port asal pada permintaan DHCP       |
| `trusted=yes`          | Menandai port yang boleh menjawab DHCP                      |

Port yang diberi `trusted=yes` adalah port yang menuju DHCP server resmi, misalnya uplink ke switch atau router lain yang menjalankan DHCP. Port tempat client biasa tersambung dibiarkan tidak trusted.

> Perilaku snooping bisa berbeda tergantung letak DHCP server (di router yang sama atau di perangkat lain). Cek dengan menyambungkan perangkat uji yang menjalankan DHCP, lalu pastikan jawabannya ditolak.

## ARP reply-only

Secara bawaan router menjawab ARP dari siapa saja dan mempelajari entri ARP baru secara dinamis. Dengan `reply-only`, router hanya menjawab ARP untuk entri yang sudah terdaftar, sehingga perangkat tak dikenal tidak bisa menyamar.

```routeros
/interface bridge set bridge-lan arp=reply-only
/ip dhcp-server set dhcp-lan add-arp=yes
```

`add-arp=yes` membuat router otomatis menambahkan entri ARP untuk setiap client DHCP, sehingga client yang sah tetap bisa berkomunikasi.

| Kondisi                                    | Hasil dengan `reply-only`                          |
| ------------------------------------------ | -------------------------------------------------- |
| Client mendapat IP dari DHCP server        | Berfungsi normal (entri ARP dibuat otomatis)       |
| Perangkat dengan IP manual, belum terdaftar | **Tidak dijawab**, tidak bisa berkomunikasi       |
| Perangkat dengan IP manual dan ARP statis   | Berfungsi normal                                  |

Karena itu, perangkat yang memakai IP tetap harus didaftarkan lewat static lease atau ARP statis.

## ARP statis

```routeros
/ip arp add address=192.168.10.50 mac-address=AA:BB:CC:DD:EE:FF interface=bridge-lan comment="Printer kantor"
/ip arp print
```

Cara yang lebih rapi: buat static lease di DHCP server (bab 5). Perangkat tetap mendapat IP yang sama lewat DHCP dan ARP-nya tercatat otomatis.

## Menyusun IP tetap yang rapi

| Rentang                           | Pemakaian                                   |
| --------------------------------- | ------------------------------------------- |
| `192.168.10.1`                    | Gateway (router)                            |
| `192.168.10.2` sampai `.9`        | Perangkat jaringan (switch, AP)             |
| `192.168.10.10` sampai `.49`      | Server dan perangkat tetap                  |
| `192.168.10.50` sampai `.99`      | Printer, CCTV (static lease)                |
| `192.168.10.100` sampai `.200`    | Pool DHCP untuk client                      |

Catat rencana ini di dokumentasi jaringan supaya tidak ada IP yang diberikan dua kali.

## Urutan penerapan yang aman

1. Buat **static lease** untuk semua perangkat dengan IP tetap.
2. Pastikan `add-arp=yes` di DHCP server.
3. Aktifkan Safe Mode.
4. Aktifkan `arp=reply-only` pada bridge.
5. Uji koneksi dari beberapa perangkat, termasuk yang memakai IP tetap.
6. Jika semua normal, simpan dengan keluar dari Safe Mode.

## Troubleshooting

| Gejala                                           | Penyebab umum                          | Perbaikan                                      |
| ------------------------------------------------ | -------------------------------------- | ---------------------------------------------- |
| Perangkat IP tetap tiba-tiba tidak bisa terhubung | Belum ada entri ARP setelah `reply-only` | Buat static lease atau ARP statis             |
| Client baru tidak dapat IP                       | Port DHCP server belum `trusted`       | Tandai port yang tepat sebagai trusted         |
| Setelah DHCP snooping semua client gagal         | Port uplink salah ditandai             | Periksa `/interface bridge port print`         |

## Ringkasan

- DHCP dan ARP tidak punya autentikasi, jadi rentan dipalsukan.
- **DHCP snooping** hanya menerima jawaban DHCP dari port `trusted`.
- **ARP reply-only** bersama `add-arp=yes` membatasi LAN hanya untuk perangkat terdaftar.
- Daftarkan semua perangkat IP tetap lewat static lease sebelum mengaktifkan `reply-only`.

## Latihan

1. Buat static lease untuk satu perangkat, aktifkan `add-arp=yes`, lalu cek `/ip arp print`.
2. Aktifkan `arp=reply-only` dengan Safe Mode dan uji perangkat yang terdaftar dan tidak terdaftar.
3. Susun rencana alokasi IP untuk jaringan `192.168.20.0/24` mengikuti contoh tabel di atas.
