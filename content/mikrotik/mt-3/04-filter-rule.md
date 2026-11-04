---
title: Filter Rule
summary: Struktur aturan filter, parameter pencocokan, aksi, urutan aturan, dan penggunaan interface list.
minutes: 20
---

Sekarang kamu mulai menulis aturan sungguhan. Bab ini membahas anatomi aturan filter dan satu hal yang paling sering menjebak: **urutan**.

## Tujuan bab

- Menyusun aturan dari chain, matcher, dan action.
- Memahami bahwa aturan dibaca dari atas dan berhenti pada kecocokan pertama.
- Memakai interface list agar aturan lebih rapi.
- Memilih antara `drop` dan `reject`.

## Anatomi sebuah aturan

```routeros
/ip firewall filter add chain=input protocol=tcp dst-port=22 src-address=192.168.10.0/24 action=accept comment="SSH dari LAN 1"
```

| Bagian     | Contoh                         | Fungsi                                        |
| ---------- | ------------------------------ | --------------------------------------------- |
| Chain      | `chain=input`                  | Di titik mana paket diperiksa                 |
| Matcher    | `protocol=tcp dst-port=22 ...` | Syarat agar aturan berlaku                    |
| Action     | `action=accept`                | Apa yang dilakukan jika semua syarat cocok    |
| Comment    | `comment="..."`                | Catatan manusia                               |

Aturan hanya berlaku jika **semua** matcher cocok sekaligus (logika AND).

## Matcher yang sering dipakai

| Matcher                        | Contoh                          | Arti                                       |
| ------------------------------ | ------------------------------- | ------------------------------------------ |
| `src-address`, `dst-address`   | `192.168.10.0/24`               | Alamat asal atau tujuan                    |
| `protocol`                     | `tcp`, `udp`, `icmp`            | Protokol                                   |
| `dst-port`, `src-port`         | `22`, `80,443`, `1000-2000`     | Port tujuan atau asal (butuh `protocol=tcp` atau `udp`) |
| `in-interface`, `out-interface`| `ether1`                        | Interface masuk atau keluar                |
| `in-interface-list`, `out-interface-list` | `WAN`, `LAN`         | Kumpulan interface                         |
| `connection-state`             | `new`, `established,related`    | Status koneksi (bab 3)                     |
| `connection-nat-state`         | `dstnat`, `srcnat`              | Apakah koneksi terkena NAT                 |
| `src-address-list`, `dst-address-list` | `admin-allowed`         | Daftar alamat (bab 5)                      |

Tanda `!` di depan nilai berarti **kebalikan**, misalnya `in-interface-list=!LAN` berarti "bukan dari LAN".

## Aksi yang sering dipakai

| Aksi                        | Efek                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| `accept`                    | Izinkan, hentikan pemeriksaan aturan berikutnya                  |
| `drop`                      | Buang paket tanpa memberi tahu pengirim                          |
| `reject`                    | Buang paket dan kirim pesan penolakan ICMP ke pengirim           |
| `log`                       | Catat ke log, lalu lanjut ke aturan berikutnya                   |
| `passthrough`               | Tidak berbuat apa-apa, hanya menambah counter (berguna untuk statistik) |
| `jump` / `return`           | Pindah ke chain buatan sendiri dan kembali                       |
| `add-src-to-address-list`   | Masukkan alamat sumber ke daftar (bab 5 dan 8)                   |
| `fasttrack-connection`      | Percepat koneksi (bab 3 dan 7)                                   |

`log` dan `passthrough` tidak menghentikan pemrosesan; aksi lain (`accept`, `drop`, `reject`) menghentikannya.

### Drop atau reject

| Aksi     | Pengirim melihat                         | Cocok untuk                         |
| -------- | ---------------------------------------- | ----------------------------------- |
| `drop`   | Timeout, tidak ada jawaban               | Sisi WAN; tidak membocorkan informasi |
| `reject` | Penolakan cepat (misalnya `icmp-admin-prohibited`) | LAN, agar pengguna tidak menunggu timeout |

```routeros
/ip firewall filter add chain=forward src-address=192.168.10.99 action=reject reject-with=icmp-admin-prohibited comment="Contoh reject"
```

## Urutan adalah segalanya

Router membaca aturan dari nomor terkecil. Kecocokan pertama yang berakhir pada `accept`, `drop`, atau `reject` mengakhiri pemeriksaan.

| Urutan  | Aturan                                    | Hasil untuk SSH dari 192.168.10.5     |
| ------- | ----------------------------------------- | ------------------------------------- |
| 0       | `drop` semua                              | Dibuang. Aturan 1 tidak pernah dibaca |
| 1       | `accept` SSH dari 192.168.10.0/24         | Tidak berguna                         |

Kebalikannya, jika `accept` SSH berada di atas `drop` semua, SSH dari LAN 1 diizinkan dan sisanya dibuang. Selalu taruh aturan yang **lebih spesifik** di atas aturan yang lebih umum.

Mengatur urutan:

```routeros
/ip firewall filter add chain=input protocol=icmp action=accept place-before=0 comment="Taruh di paling atas"
/ip firewall filter move [find comment="Taruh di paling atas"] destination=3
/ip firewall filter print
```

## Interface list

Daripada menulis `in-interface=ether1` di mana-mana, kelompokkan interface berdasarkan peran. Jika nanti WAN berpindah ke `ether4`, kamu hanya mengubah satu tempat.

Di R1:

```routeros
/interface list add name=WAN
/interface list add name=LAN
/interface list member add list=WAN interface=ether1
/interface list member add list=LAN interface=ether2
/interface list member add list=LAN interface=ether3
/interface list member print
```

`ether3` (link ke R2) dimasukkan ke LAN karena sisi itu adalah jaringan internal kita, bukan internet.

Di R2:

```routeros
/interface list add name=LAN
/interface list member add list=LAN interface=ether1
/interface list member add list=LAN interface=ether2
```

## Lab: dua aturan dasar

Di R1, pasang pola dasar di chain `input`, lalu uji dengan Safe Mode aktif:

```routeros
/ip firewall filter add chain=input connection-state=established,related,untracked action=accept comment="Input: izinkan established,related,untracked"
/ip firewall filter add chain=input connection-state=invalid action=drop comment="Input: drop invalid"
```

Dua aturan di atas aman karena tidak membuang apa pun yang sah. Cek counter:

```routeros
/ip firewall filter print stats
```

Counter aturan pertama akan terus bertambah selama kamu terhubung ke router, karena sesi Winbox atau SSH-mu berstatus `established`.

## Troubleshooting

| Gejala                                    | Kemungkinan penyebab                        | Cek                                           |
| ----------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| Aturan `accept` tidak berefek             | Ada `drop` yang lebih umum di atasnya       | `print` dan urutkan ulang dengan `move`        |
| Aturan tidak pernah cocok                 | Matcher bertentangan (misalnya `dst-port` tanpa `protocol`) | Periksa kombinasi matcher |
| Setelah memasang `drop` akses ke router putus | Tidak ada `accept` untuk koneksimu di atasnya | Aktifkan Safe Mode; baca bab 6          |

## Uji pemahaman

1. Kapan sebuah aturan filter dianggap cocok?
2. Apa beda `drop` dan `reject`?
3. Kenapa aturan spesifik harus berada di atas aturan umum?
4. Apa arti `in-interface-list=!LAN`?
5. Apa keuntungan interface list dibanding menulis nama interface langsung?

**Kunci jawaban**

1. Jika semua matcher di aturan itu cocok sekaligus.
2. `drop` membuang tanpa pemberitahuan; `reject` membuang dan mengirim pesan penolakan ke pengirim.
3. Karena pemeriksaan berhenti pada kecocokan pertama; aturan umum di atas akan menutupi aturan spesifik.
4. Paket yang masuk dari interface yang bukan anggota list LAN.
5. Peran interface diubah di satu tempat dan semua aturan ikut menyesuaikan.

## Ringkasan

- Aturan = chain + matcher + action, dibaca dari atas ke bawah.
- Aksi `accept`, `drop`, dan `reject` menghentikan pemeriksaan; `log` dan `passthrough` tidak.
- Interface list membuat aturan lebih rapi dan mudah dirawat.

## Langkah selanjutnya

Lanjutkan ke **Bab 5: Address List**, untuk mengelompokkan alamat IP agar aturan lebih ringkas, termasuk daftar dinamis yang terisi otomatis.
