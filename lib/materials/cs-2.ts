import type { Chapter } from "./types";
import { wikiImage } from "./media";

/**
 * cs-2 (Cisco): Pengalamatan IP. IPv4, CIDR, VLSM, dan pengenalan IPv6,
 * dengan latihan di Cisco Packet Tracer / IOS dan verifikasi memakai Python.
 * Jumlah bab harus sama dengan `lessons` modul (12).
 *
 * Konvensi blok kode shell (tampil seperti terminal):
 *   - baris biasa     -> perintah (diberi prompt $)
 *   - "> teks"        -> output perintah
 *   - "# teks"        -> catatan
 */

const IPV6_HEADER_ASCII = `+---------+--------------+------------------------------+
| Version | Traffic Cls  | Flow Label (20 bit)          |
+---------+--------------+--------------+---------------+
| Payload Length (16)    | Next Header  | Hop Limit     |
+------------------------+--------------+---------------+
| Source Address (128 bit)                              |
+-------------------------------------------------------+
| Destination Address (128 bit)                         |
+-------------------------------------------------------+`;

const chapters: Chapter[] = [
  {
    title: "Pengantar pengalamatan IP untuk CCNA",
    blocks: [
      {
        t: "p",
        x: "Setiap perangkat yang berkomunikasi lewat jaringan butuh alamat IP, dan salah merancang alamat adalah sumber masalah jaringan yang paling sering: IP bentrok, mask salah, subnet terlalu kecil, atau rute tidak bisa diringkas. Modul ini mengajarkan cara menghitung dan merancang alamat dengan cepat dan benar, sesuai kemampuan yang diuji pada CCNA.",
      },
      { t: "h", x: "Tujuan belajar modul ini" },
      {
        t: "ul",
        items: [
          "Mengubah alamat IPv4 antara desimal dan biner, serta menentukan network, broadcast, dan rentang host.",
          "Memahami notasi CIDR, menghitung jumlah subnet dan host, dan meringkas rute.",
          "Merancang alamat dengan VLSM supaya tidak ada ruang alamat yang terbuang.",
          "Menulis, menyingkat, dan menjelaskan alamat IPv6 beserta jenis-jenisnya.",
          "Mengonfigurasi alamat IPv4 dan IPv6 di router Cisco IOS dan memverifikasinya.",
        ],
      },
      { t: "h", x: "Peta modul" },
      {
        t: "table",
        head: ["Bab", "Topik", "Keterampilan"],
        rows: [
          ["2 dan 6", "IPv4", "Biner, kelas, mask, network/broadcast/host"],
          ["3 dan 7", "CIDR", "Prefix, subnetting, summarization"],
          ["4 dan 8", "VLSM", "Alokasi subnet berbeda ukuran"],
          ["5 dan 9", "IPv6", "Penulisan, jenis alamat, konfigurasi IOS"],
          ["10 dan 11", "Studi kasus", "Mendiagnosis dan merancang alamat"],
          ["12", "Rangkuman", "Latihan campuran"],
        ],
      },
      { t: "h", x: "Siapkan alat latihan" },
      {
        t: "ul",
        items: [
          "Cisco Packet Tracer (gratis lewat Cisco Networking Academy) untuk konfigurasi router dan PC.",
          "Python 3 untuk memeriksa hasil hitungan dengan modul ipaddress.",
          "Kertas dan pensil: hitung manual dulu, baru verifikasi dengan alat.",
        ],
      },
      {
        t: "code",
        lang: "bash",
        x: `python3 --version
python3 -c "import ipaddress; print(ipaddress.ip_network('192.168.10.0/26').netmask)"
> 255.255.255.192`,
      },
      {
        t: "tip",
        x: "Hafalkan deret ini, karena dipakai terus: 128, 64, 32, 16, 8, 4, 2, 1 (nilai tiap bit dalam satu oktet) dan 128, 192, 224, 240, 248, 252, 254, 255 (nilai oktet mask).",
      },
      {
        t: "check",
        items: [
          "Saya tahu apa yang akan dipelajari di modul ini.",
          "Saya sudah menyiapkan Packet Tracer dan Python.",
          "Saya hafal deret nilai bit dan nilai oktet mask.",
        ],
      },
    ],
  },
  {
    title: "IPv4",
    blocks: [
      {
        t: "p",
        x: "Alamat IPv4 panjangnya 32 bit, ditulis sebagai empat oktet desimal yang dipisah titik (dotted decimal). Alamat terdiri dari bagian network (siapa jaringannya) dan bagian host (siapa perangkatnya); subnet mask menentukan batas keduanya.",
      },
      { t: "h", x: "Desimal ke biner" },
      {
        t: "p",
        x: "Contoh: 192.168.10.37. 192 = 128+64 = 11000000; 168 = 128+32+8 = 10101000; 10 = 8+2 = 00001010; 37 = 32+4+1 = 00100101. Hasilnya 11000000.10101000.00001010.00100101.",
      },
      { t: "h", x: "Menentukan network dengan operasi AND" },
      {
        t: "code",
        lang: "text",
        x: `IP    192.168.10.37  = 11000000.10101000.00001010.00100101
Mask  255.255.255.192 = 11111111.11111111.11111111.11000000
AND   ------------------------------------------------------
Net   192.168.10.0    = 11000000.10101000.00001010.00000000`,
      },
      {
        t: "p",
        x: "Mask /26 punya 6 bit host, sehingga 2^6 = 64 alamat per blok. Rentang blok: 0-63, 64-127, 128-191, 192-255. Alamat .37 berada di blok 0-63. Maka network = 192.168.10.0, broadcast = 192.168.10.63, host valid .1 sampai .62 (62 host).",
      },
      { t: "h", x: "Rumus yang paling berguna" },
      {
        t: "table",
        head: ["Yang dicari", "Rumus", "Contoh /26"],
        rows: [
          ["Bit host (h)", "32 - prefix", "32 - 26 = 6"],
          ["Alamat per subnet", "2^h", "2^6 = 64"],
          ["Host valid", "2^h - 2", "64 - 2 = 62"],
          ["Ukuran blok", "256 - nilai oktet mask", "256 - 192 = 64"],
          ["Network", "Kelipatan blok terbesar yang <= IP", "37 -> 0"],
          ["Broadcast", "Network berikutnya - 1", "64 - 1 = 63"],
        ],
      },
      { t: "h", x: "Alamat privat dan khusus" },
      {
        t: "table",
        head: ["Rentang", "Keterangan"],
        rows: [
          ["10.0.0.0/8", "Privat (RFC 1918)"],
          ["172.16.0.0/12 (172.16.0.0 - 172.31.255.255)", "Privat (RFC 1918)"],
          ["192.168.0.0/16", "Privat (RFC 1918)"],
          ["127.0.0.0/8", "Loopback; 127.0.0.1 = localhost"],
          ["169.254.0.0/16", "APIPA / link-local, muncul saat DHCP gagal"],
          ["224.0.0.0/4", "Multicast"],
          ["255.255.255.255", "Broadcast terbatas"],
        ],
      },
      { t: "h", x: "Kelas klasik" },
      {
        t: "table",
        head: ["Kelas", "Oktet pertama", "Mask default", "Catatan"],
        rows: [
          ["A", "1 - 126", "/8", "127 dicadangkan untuk loopback"],
          ["B", "128 - 191", "/16", ""],
          ["C", "192 - 223", "/24", ""],
          ["D", "224 - 239", "-", "Multicast"],
          ["E", "240 - 255", "-", "Cadangan/eksperimen"],
        ],
        caption: "Kelas kini jarang dipakai untuk alokasi (digantikan CIDR), tetapi masih keluar di ujian dan mask default.",
      },
      {
        t: "warn",
        x: "Alamat network (semua bit host 0) dan alamat broadcast (semua bit host 1) tidak boleh dipasang pada perangkat. Karena itulah host valid adalah 2^h - 2. Pengecualian: link /31 untuk point-to-point (RFC 3021) dan /32 untuk satu host.",
      },
      {
        t: "check",
        items: [
          "Saya bisa mengubah alamat IPv4 antara desimal dan biner.",
          "Saya bisa menghitung network, broadcast, dan rentang host dari IP dan mask.",
          "Saya hafal rentang alamat privat dan alamat khusus.",
        ],
      },
    ],
  },
  {
    title: "CIDR",
    blocks: [
      {
        t: "p",
        x: "CIDR (Classless Inter-Domain Routing) menghapus batas kelas. Panjang bagian network ditulis langsung sebagai prefix, misalnya 192.168.10.0/26. Dengan CIDR kamu bisa memotong blok alamat sebesar apa pun (subnetting) dan menggabungkan beberapa blok menjadi satu rute (summarization).",
      },
      { t: "h", x: "Tabel prefix yang sering dipakai" },
      {
        t: "table",
        head: ["Prefix", "Subnet mask", "Alamat", "Host valid"],
        rows: [
          ["/24", "255.255.255.0", "256", "254"],
          ["/25", "255.255.255.128", "128", "126"],
          ["/26", "255.255.255.192", "64", "62"],
          ["/27", "255.255.255.224", "32", "30"],
          ["/28", "255.255.255.240", "16", "14"],
          ["/29", "255.255.255.248", "8", "6"],
          ["/30", "255.255.255.252", "4", "2"],
        ],
      },
      { t: "h", x: "Subnetting: memecah satu blok" },
      {
        t: "p",
        x: "Soal: bagi 192.168.1.0/24 menjadi 4 subnet sama besar. 4 = 2^2, jadi pinjam 2 bit host dan prefix menjadi /26. Ukuran blok 64.",
      },
      {
        t: "table",
        head: ["Subnet", "Network", "Host valid", "Broadcast"],
        rows: [
          ["1", "192.168.1.0/26", ".1 - .62", ".63"],
          ["2", "192.168.1.64/26", ".65 - .126", ".127"],
          ["3", "192.168.1.128/26", ".129 - .190", ".191"],
          ["4", "192.168.1.192/26", ".193 - .254", ".255"],
        ],
      },
      {
        t: "p",
        x: "Jumlah subnet = 2^(bit yang dipinjam). Bit yang dibutuhkan untuk N subnet adalah bilangan bulat terkecil n dengan 2^n >= N. Untuk 5 subnet, 2^2 = 4 kurang, 2^3 = 8 cukup, jadi pinjam 3 bit (dari /24 menjadi /27).",
      },
      { t: "h", x: "Summarization: menggabung rute" },
      {
        t: "p",
        x: "Soal: ringkas 192.168.0.0/24, 192.168.1.0/24, 192.168.2.0/24, dan 192.168.3.0/24. Oktet ketiga 0 sampai 3 adalah 4 blok berurutan, sehingga cukup dengan 2 bit lagi dari network: 24 - 2 = /22. Hasil ringkasan: 192.168.0.0/22 (mask 255.255.252.0).",
      },
      {
        t: "code",
        lang: "text",
        x: `Oktet ke-3:  0 = 00000000
             1 = 00000001
             2 = 00000010
             3 = 00000011
                 ------xx   <- 6 bit pertama sama, 2 bit terakhir berbeda
Bit sama = 16 (dua oktet awal) + 6 = 22  ->  /22`,
      },
      {
        t: "tip",
        x: "Syarat summarization: jumlah blok harus pangkat 2 dan alamat awal harus kelipatan ukuran total ringkasan. 172.16.20.0/24 sampai 172.16.23.0/24 bisa diringkas menjadi 172.16.20.0/22 karena 20 kelipatan 4. Tetapi 172.16.21.0/24 sampai 172.16.24.0/24 tidak bisa menjadi satu /22.",
      },
      { t: "h", x: "Wildcard mask" },
      {
        t: "p",
        x: "Pada ACL dan OSPF, Cisco memakai wildcard mask, yaitu kebalikan subnet mask: 255 - nilai tiap oktet. Mask 255.255.255.192 menjadi wildcard 0.0.0.63; mask /22 (255.255.252.0) menjadi 0.0.3.255.",
      },
      {
        t: "check",
        items: [
          "Saya bisa mengubah prefix menjadi mask dan sebaliknya.",
          "Saya bisa memecah satu blok menjadi N subnet dan menuliskan rentang tiap subnet.",
          "Saya bisa meringkas beberapa jaringan berurutan menjadi satu prefix.",
          "Saya bisa menghitung wildcard mask.",
        ],
      },
    ],
  },
  {
    title: "VLSM",
    blocks: [
      {
        t: "p",
        x: "Pada subnetting biasa semua subnet berukuran sama, sehingga LAN kecil menyia-nyiakan alamat dan link antarrouter (yang hanya butuh 2 alamat) memakan satu blok penuh. VLSM (Variable Length Subnet Mask) membiarkan tiap subnet punya prefix berbeda sesuai kebutuhan.",
      },
      { t: "h", x: "Aturan emas VLSM" },
      {
        t: "ol",
        items: [
          "Urutkan kebutuhan dari yang terbesar ke yang terkecil.",
          "Tentukan prefix terkecil yang cukup untuk tiap kebutuhan (ingat 2^h - 2 >= host).",
          "Alokasikan berurutan mulai dari alamat terendah, tanpa tumpang tindih.",
          "Subnet berikutnya mulai tepat setelah broadcast subnet sebelumnya.",
        ],
      },
      { t: "h", x: "Contoh lengkap" },
      {
        t: "p",
        x: "Tersedia 192.168.50.0/24. Kebutuhan: LAN A 100 host, LAN B 50 host, LAN C 20 host, dan dua link WAN masing-masing 2 alamat.",
      },
      {
        t: "table",
        head: ["Kebutuhan", "Prefix", "Alasan", "Network", "Rentang host", "Broadcast"],
        rows: [
          ["LAN A (100)", "/25", "2^7 - 2 = 126", "192.168.50.0", ".1 - .126", ".127"],
          ["LAN B (50)", "/26", "2^6 - 2 = 62", "192.168.50.128", ".129 - .190", ".191"],
          ["LAN C (20)", "/27", "2^5 - 2 = 30", "192.168.50.192", ".193 - .222", ".223"],
          ["WAN 1 (2)", "/30", "2^2 - 2 = 2", "192.168.50.224", ".225 - .226", ".227"],
          ["WAN 2 (2)", "/30", "2^2 - 2 = 2", "192.168.50.228", ".229 - .230", ".231"],
        ],
      },
      {
        t: "p",
        x: "Total terpakai = 128 + 64 + 32 + 4 + 4 = 232 alamat. Sisa 256 - 232 = 24 alamat (192.168.50.232 sampai .255) bisa dipakai untuk pertumbuhan, misalnya sebuah /29 atau /28.",
      },
      {
        t: "warn",
        x: "Kesalahan umum: mengalokasikan subnet kecil lebih dulu sehingga blok besar berikutnya tidak lagi rata pada batas yang benar. Selalu mulai dari kebutuhan terbesar, dan pastikan network address setiap blok adalah kelipatan ukuran bloknya.",
      },
      { t: "h", x: "Syarat routing" },
      {
        t: "p",
        x: "VLSM hanya jalan bila protokol routing membawa informasi mask di setiap update (classless): RIPv2, EIGRP, OSPF, dan BGP. RIPv1 bersifat classful dan tidak mendukung VLSM.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menentukan prefix terkecil yang cukup untuk sebuah jumlah host.",
          "Saya bisa mengalokasikan beberapa subnet berbeda ukuran tanpa tumpang tindih.",
          "Saya tahu protokol routing mana yang mendukung VLSM.",
        ],
      },
    ],
  },
  {
    title: "Pengenalan IPv6 dengan latihan terstruktur",
    blocks: [
      {
        t: "p",
        x: "IPv4 punya sekitar 4,3 miliar alamat (2^32) dan sudah habis dialokasikan. IPv6 memakai 128 bit, yaitu 2^128 alamat, sehingga NAT tidak lagi diperlukan untuk menghemat alamat dan tiap perangkat bisa punya alamat global sendiri.",
      },
      { t: "h", x: "Menulis alamat IPv6" },
      {
        t: "p",
        x: "Alamat IPv6 ditulis sebagai 8 kelompok heksadesimal 16 bit dipisah titik dua. Dua aturan penyingkatan: (1) buang nol di depan tiap kelompok; (2) satu rangkaian kelompok nol berurutan boleh diganti :: sekali saja per alamat.",
      },
      {
        t: "table",
        head: ["Bentuk lengkap", "Bentuk singkat"],
        rows: [
          ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"],
          ["2001:0db8:00a0:0000:0000:0042:0000:0001", "2001:db8:a0::42:0:1"],
          ["FE80:0000:0000:0000:021A:2BFF:FE3C:4D5E", "fe80::21a:2bff:fe3c:4d5e"],
          ["0000:0000:0000:0000:0000:0000:0000:0001", "::1 (loopback)"],
        ],
        caption: "Pada contoh kedua ada dua rangkaian nol; yang dipadatkan adalah yang paling panjang (dua kelompok), bukan yang tunggal.",
      },
      { t: "h", x: "Struktur alamat unicast global" },
      {
        t: "code",
        lang: "text",
        x: `|<----- 48 bit ---->|<-- 16 -->|<------- 64 bit ------->|
|  Global Routing     | Subnet ID |   Interface ID         |
|  Prefix (dari ISP)  | (LAN)     |   (host)               |
2001:0db8:acad         : 0001     : 0000:0000:0000:0001`,
      },
      {
        t: "p",
        x: "Dari prefix /48 yang diberikan ISP, tersedia 16 bit Subnet ID, sehingga ada 2^16 = 65.536 subnet /64. Setiap LAN memakai /64 (64 bit untuk interface ID), meski hanya berisi dua perangkat.",
      },
      wikiImage(
        "Ipv6 header.svg",
        "Susunan header paket IPv6 dengan field alamat sumber dan tujuan 128 bit",
        "Header IPv6: tetap 40 byte, tanpa checksum dan tanpa fragmentasi oleh router",
        IPV6_HEADER_ASCII,
      ),
      { t: "h", x: "Jenis alamat" },
      {
        t: "table",
        head: ["Jenis", "Prefix", "Fungsi"],
        rows: [
          ["Global unicast", "2000::/3", "Alamat publik yang dirutekan di internet"],
          ["Unique local", "FC00::/7 (praktiknya FD00::/8)", "Setara alamat privat IPv4, tidak dirutekan di internet"],
          ["Link-local", "FE80::/10", "Hanya satu link; otomatis ada di setiap interface IPv6"],
          ["Multicast", "FF00::/8", "Satu ke banyak; menggantikan broadcast (mis. FF02::1 semua node, FF02::2 semua router)"],
          ["Loopback", "::1/128", "Setara 127.0.0.1"],
          ["Unspecified", "::/128", "Belum punya alamat"],
        ],
      },
      { t: "h", x: "Cara perangkat mendapat alamat" },
      {
        t: "ul",
        items: [
          "Statis: dikonfigurasi manual.",
          "SLAAC: perangkat membentuk alamat sendiri dari prefix yang diumumkan router (Router Advertisement) ditambah interface ID.",
          "DHCPv6: server memberi alamat dan/atau info lain seperti DNS.",
          "Interface ID bisa dari EUI-64: MAC dibelah dua, disisipi FFFE, dan bit ke-7 oktet pertama dibalik.",
        ],
      },
      {
        t: "p",
        x: "Contoh EUI-64: MAC 00:1A:2B:3C:4D:5E. Sisipkan FFFE di tengah: 00:1A:2B:FF:FE:3C:4D:5E. Balik bit ke-7 oktet pertama: 00 (00000000) menjadi 02 (00000010). Interface ID = 021A:2BFF:FE3C:4D5E.",
      },
      {
        t: "tip",
        x: "IPv6 tidak punya ARP dan broadcast. Fungsi ARP diganti Neighbor Discovery Protocol (NDP) yang memakai ICMPv6 dan multicast. Karena itu firewall tidak boleh memblokir ICMPv6 sembarangan.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyingkat dan memperpanjang alamat IPv6.",
          "Saya bisa menyebut jenis alamat IPv6 dari prefix-nya.",
          "Saya bisa menghitung jumlah subnet /64 dari sebuah prefix /48.",
          "Saya bisa membentuk interface ID EUI-64 dari sebuah MAC.",
        ],
      },
    ],
  },
  {
    title: "Praktik: IPv4",
    blocks: [
      {
        t: "p",
        x: "Praktik ini menghitung network, broadcast, dan rentang host secara manual, memverifikasinya dengan Python, lalu mengonfigurasi alamat di router Cisco dan memeriksanya.",
      },
      { t: "h", x: "Langkah 1: hitung manual lalu verifikasi" },
      {
        t: "code",
        lang: "bash",
        x: `python3 - <<'EOF'
import ipaddress
n = ipaddress.ip_interface('192.168.10.37/26').network
print(n, n.netmask, n.broadcast_address, n.num_addresses - 2)
h = list(n.hosts())
print(h[0], h[-1])
EOF
> 192.168.10.0/26 255.255.255.192 192.168.10.63 62
> 192.168.10.1 192.168.10.62`,
      },
      {
        t: "p",
        x: "Ulangi untuk 172.16.45.200/20 dan 10.1.2.3/13 secara manual dulu. Kunci jawaban ada di akhir bab ini.",
      },
      { t: "h", x: "Langkah 2: topologi dasar di Packet Tracer" },
      {
        t: "p",
        x: "Buat topologi: PC0 - Switch0 - R1 (Gig0/0). Pada PC0 isi IP 192.168.10.10/24, gateway 192.168.10.1. Konfigurasikan R1:",
      },
      {
        t: "code",
        lang: "text",
        x: `Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitEthernet 0/0
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# description LAN-Pengguna
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
> Interface          IP-Address      OK? Method Status  Protocol
> GigabitEthernet0/0 192.168.10.1    YES manual up      up
R1# ping 192.168.10.10
> !!!!!`,
      },
      {
        t: "p",
        x: "Status up/up berarti link fisik dan protokol Layer 2 hidup. Jika administratively down, kamu lupa no shutdown. Jika up/down, periksa kabel atau sisi lawan.",
      },
      { t: "h", x: "Langkah 3: sengaja membuat kesalahan" },
      {
        t: "ol",
        items: [
          "Ubah mask PC0 menjadi 255.255.255.128 lalu ping gateway. Apa yang terjadi, dan mengapa tetap berhasil/gagal?",
          "Beri PC1 IP yang sama dengan PC0. Perhatikan pesan duplicate address.",
          "Isi gateway PC0 dengan 192.168.20.1 (di luar subnet). Coba ping ke luar subnet.",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban hitungan: 172.16.45.200/20 -> mask 255.255.240.0, blok 16 di oktet ketiga, network 172.16.32.0, broadcast 172.16.47.255, host 172.16.32.1 - 172.16.47.254 (4094 host). 10.1.2.3/13 -> mask 255.248.0.0, blok 8 di oktet kedua, network 10.0.0.0, broadcast 10.7.255.255 (524.286 host).",
      },
      {
        t: "check",
        items: [
          "Saya bisa menghitung network dan broadcast manual lalu memverifikasinya dengan Python.",
          "Saya bisa mengonfigurasi IP di interface router dan membaca show ip interface brief.",
          "Saya bisa menjelaskan akibat mask atau gateway yang salah.",
        ],
      },
    ],
  },
  {
    title: "Praktik: CIDR",
    blocks: [
      {
        t: "p",
        x: "Praktik ini memecah blok menjadi subnet, meringkas rute, dan memasang rute ringkasan di router Cisco.",
      },
      { t: "h", x: "Langkah 1: subnetting dengan Python" },
      {
        t: "code",
        lang: "bash",
        x: `python3 - <<'EOF'
import ipaddress
for s in ipaddress.ip_network('192.168.1.0/24').subnets(new_prefix=26):
    print(s, s[1], s[-2], s.broadcast_address)
EOF
> 192.168.1.0/26 192.168.1.1 192.168.1.62 192.168.1.63
> 192.168.1.64/26 192.168.1.65 192.168.1.126 192.168.1.127
> 192.168.1.128/26 192.168.1.129 192.168.1.190 192.168.1.191
> 192.168.1.192/26 192.168.1.193 192.168.1.254 192.168.1.255`,
      },
      { t: "h", x: "Langkah 2: summarization" },
      {
        t: "code",
        lang: "bash",
        x: `python3 - <<'EOF'
import ipaddress as ip
nets = [ip.ip_network(f'192.168.{i}.0/24') for i in range(4)]
print(list(ip.collapse_addresses(nets)))
nets2 = [ip.ip_network(f'172.16.{i}.0/24') for i in (21, 22, 23, 24)]
print(list(ip.collapse_addresses(nets2)))
EOF
> [IPv4Network('192.168.0.0/22')]
> [IPv4Network('172.16.21.0/24'), IPv4Network('172.16.22.0/23'), IPv4Network('172.16.24.0/24')]`,
      },
      {
        t: "p",
        x: "Hasil kedua membuktikan aturan di bab CIDR: 172.16.21.0 sampai 172.16.24.0 tidak bisa menjadi satu ringkasan /22.",
      },
      { t: "h", x: "Langkah 3: rute ringkasan di router" },
      {
        t: "p",
        x: "Topologi: R1 menghubungkan 4 LAN (192.168.0.0/24 sampai 192.168.3.0/24). R2 di sisi lain perlu satu rute untuk semuanya. Next hop R1 adalah 10.0.0.1.",
      },
      {
        t: "code",
        lang: "text",
        x: `R2(config)# ip route 192.168.0.0 255.255.252.0 10.0.0.1
R2(config)# end
R2# show ip route static
> S    192.168.0.0/22 [1/0] via 10.0.0.1
R2# ping 192.168.2.10
> !!!!!`,
      },
      {
        t: "p",
        x: "Satu baris rute menggantikan empat. Semakin besar jaringan, semakin penting ringkasan untuk menjaga tabel routing tetap kecil.",
      },
      { t: "h", x: "Soal latihan" },
      {
        t: "ol",
        items: [
          "Bagi 10.10.0.0/24 menjadi 8 subnet sama besar. Berapa prefix dan ukuran blok?",
          "Ringkas 10.20.8.0/24 sampai 10.20.15.0/24.",
          "Tulis wildcard mask untuk /27 dan /20.",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) 2^3 = 8, prefix /27, blok 32; (2) delapan blok, 8 kelipatan 8, hasil 10.20.8.0/21; (3) /27 = 255.255.255.224, wildcard 0.0.0.31; /20 = 255.255.240.0, wildcard 0.0.15.255.",
      },
      {
        t: "check",
        items: [
          "Saya bisa memecah dan meringkas blok alamat lalu memverifikasinya.",
          "Saya bisa memasang rute ringkasan statis di router Cisco.",
          "Saya bisa menghitung wildcard mask.",
        ],
      },
    ],
  },
  {
    title: "Praktik: VLSM",
    blocks: [
      {
        t: "p",
        x: "Praktik ini menerapkan rancangan VLSM dari bab teori pada topologi Packet Tracer: tiga LAN dan dua link WAN dari blok 192.168.50.0/24.",
      },
      { t: "h", x: "Langkah 1: topologi" },
      {
        t: "code",
        lang: "text",
        x: `LAN A (100 host)--R1--WAN1--R2--LAN B (50 host)
                 |
               WAN2
                 |
                R3--LAN C (20 host)

R1 Gig0/0 = LAN A      192.168.50.1/25
R1 Gig0/1 = WAN1       192.168.50.225/30    R2 WAN1 = 192.168.50.226/30
R1 Gig0/2 = WAN2       192.168.50.229/30    R3 WAN2 = 192.168.50.230/30
R2 LAN B gateway       192.168.50.129/26
R3 LAN C gateway       192.168.50.193/27`,
      },
      { t: "h", x: "Langkah 2: konfigurasi R1" },
      {
        t: "code",
        lang: "text",
        x: `R1(config)# interface g0/0
R1(config-if)# ip address 192.168.50.1 255.255.255.128
R1(config-if)# no shutdown
R1(config-if)# interface g0/1
R1(config-if)# ip address 192.168.50.225 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# interface g0/2
R1(config-if)# ip address 192.168.50.229 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# end`,
      },
      {
        t: "p",
        x: "Konfigurasi R2 dan R3 dengan pola yang sama memakai alamat pada diagram. Setelah itu aktifkan routing, misalnya OSPF:",
      },
      {
        t: "code",
        lang: "text",
        x: `R1(config)# router ospf 1
R1(config-router)# network 192.168.50.0 0.0.0.127 area 0
R1(config-router)# network 192.168.50.224 0.0.0.3 area 0
R1(config-router)# network 192.168.50.228 0.0.0.3 area 0`,
      },
      {
        t: "p",
        x: "Perhatikan wildcard: /25 menjadi 0.0.0.127, /30 menjadi 0.0.0.3. Lakukan hal serupa di R2 dan R3 untuk subnet masing-masing. Lalu verifikasi:",
      },
      {
        t: "code",
        lang: "text",
        x: `R1# show ip route ospf
> O  192.168.50.128/26 [110/2] via 192.168.50.226
> O  192.168.50.192/27 [110/2] via 192.168.50.230
R1# show ip route connected
> C  192.168.50.0/25 is directly connected, GigabitEthernet0/0
> C  192.168.50.224/30 is directly connected, GigabitEthernet0/1
> C  192.168.50.228/30 is directly connected, GigabitEthernet0/2`,
      },
      { t: "h", x: "Langkah 3: cek rancangan dengan Python" },
      {
        t: "code",
        lang: "bash",
        x: `python3 - <<'EOF'
import ipaddress as ip
nets = [ip.ip_network(x) for x in (
 '192.168.50.0/25','192.168.50.128/26','192.168.50.192/27',
 '192.168.50.224/30','192.168.50.228/30')]
print(any(a.overlaps(b) for i,a in enumerate(nets) for b in nets[i+1:]))
print(sum(n.num_addresses for n in nets))
EOF
> False
> 232`,
      },
      {
        t: "p",
        x: "False berarti tidak ada tumpang tindih; 232 sesuai hitungan manual. Uji akhir: ping dari PC di LAN A ke PC di LAN B dan LAN C.",
      },
      {
        t: "warn",
        x: "Output show ip route di atas contoh. Metric dan urutan baris di Packet Tracer bisa berbeda; yang harus sama adalah prefix dan next hop-nya.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menerapkan rancangan VLSM pada interface router.",
          "Saya bisa menulis wildcard mask yang benar pada perintah network OSPF.",
          "Saya bisa memeriksa tumpang tindih subnet dan total alamat.",
        ],
      },
    ],
  },
  {
    title: "Praktik: pengenalan IPv6 dengan latihan terstruktur",
    blocks: [
      {
        t: "p",
        x: "Praktik ini melatih penyingkatan alamat, lalu mengonfigurasi IPv6 pada router Cisco dan mengamati alamat link-local.",
      },
      { t: "h", x: "Langkah 1: singkat dan perpanjang dengan Python" },
      {
        t: "code",
        lang: "bash",
        x: `python3 - <<'EOF'
import ipaddress as ip
a = ip.ip_address('2001:0db8:00a0:0000:0000:0042:0000:0001')
print(a.compressed)
print(a.exploded)
print(ip.ip_address('fe80::21a:2bff:fe3c:4d5e').is_link_local)
print(ip.ip_network('2001:db8:acad::/48').num_addresses // ip.ip_network('2001:db8:acad::/64').num_addresses)
EOF
> 2001:db8:a0::42:0:1
> 2001:0db8:00a0:0000:0000:0042:0000:0001
> True
> 65536`,
      },
      { t: "h", x: "Langkah 2: konfigurasi IPv6 di router" },
      {
        t: "p",
        x: "Dari prefix 2001:db8:acad::/48, pakai subnet 1 (LAN) dan subnet 2 (link antarrouter).",
      },
      {
        t: "code",
        lang: "text",
        x: `R1(config)# ipv6 unicast-routing
R1(config)# interface g0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# interface g0/1
R1(config-if)# ipv6 address 2001:db8:acad:2::1/64
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface brief
> GigabitEthernet0/0  [up/up]
>     FE80::1
>     2001:DB8:ACAD:1::1
> GigabitEthernet0/1  [up/up]
>     FE80::1
>     2001:DB8:ACAD:2::1`,
      },
      {
        t: "p",
        x: "Perintah ipv6 unicast-routing wajib supaya router meneruskan paket IPv6 dan mengirim Router Advertisement. Tanpa perintah itu PC tidak akan membentuk alamat lewat SLAAC. Alamat link-local boleh sama di interface berbeda karena hanya berlaku per link.",
      },
      { t: "h", x: "Langkah 3: uji" },
      {
        t: "code",
        lang: "text",
        x: `R1# show ipv6 route connected
> C   2001:DB8:ACAD:1::/64 [0/0] via GigabitEthernet0/0, directly connected
> L   2001:DB8:ACAD:1::1/128 [0/0] via GigabitEthernet0/0, receive
R1# ping 2001:db8:acad:1::10
> !!!!!`,
      },
      {
        t: "p",
        x: "Di PC Packet Tracer, pilih IPv6 Configuration = Auto Config untuk SLAAC, lalu bandingkan alamat yang terbentuk dengan hasil EUI-64 dari MAC PC.",
      },
      { t: "h", x: "Soal latihan" },
      {
        t: "ol",
        items: [
          "Singkat 2001:0db8:0000:0001:0000:0000:0000:00ff.",
          "Berapa subnet /64 yang tersedia dalam sebuah /56?",
          "Jenis alamat apakah FD12:3456:789A::1, dan FF02::2?",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) 2001:db8:0:1::ff (rangkaian nol terpanjang adalah tiga kelompok); (2) 2^(64-56) = 2^8 = 256; (3) FD12:... adalah unique local, FF02::2 adalah multicast semua router di link.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyingkat alamat IPv6 dengan benar.",
          "Saya bisa mengaktifkan IPv6 di router Cisco dan membaca show ipv6 interface brief.",
          "Saya paham fungsi ipv6 unicast-routing dan alamat link-local.",
        ],
      },
    ],
  },
  {
    title: "Studi kasus: IPv4",
    blocks: [
      {
        t: "p",
        x: "Kantor kecil memakai jaringan 192.168.5.0/24 dengan gateway 192.168.5.1. Tiga pengguna melapor masalah. Gunakan perintah ipconfig, ping, dan arp -a di PC serta show ip interface brief di router.",
      },
      {
        t: "table",
        head: ["Pengguna", "IP / Mask / Gateway", "Gejala"],
        rows: [
          ["Dewi", "192.168.5.20 / 255.255.255.0 / 192.168.5.1", "Normal"],
          ["Eko", "192.168.5.20 / 255.255.255.0 / 192.168.5.1", "Kadang putus, ada peringatan duplicate IP"],
          ["Fajar", "192.168.5.70 / 255.255.255.192 / 192.168.5.1", "Tidak bisa ping gateway maupun Dewi"],
          ["Gita", "192.168.6.15 / 255.255.255.0 / 192.168.5.1", "Tidak bisa ping siapa pun"],
        ],
      },
      { t: "h", x: "Analisis" },
      {
        t: "ol",
        items: [
          "Eko: IP sama dengan Dewi. Dua perangkat berebut alamat, ARP cache berubah-ubah. Perbaiki dengan memberi alamat unik atau memakai reservasi DHCP.",
          "Fajar: mask /26 membuat subnetnya 192.168.5.64 - .127, sedangkan gateway 192.168.5.1 berada di blok 0 - 63. PC menganggap gateway di luar subnet, sehingga tidak diteruskan ke sana. Perbaiki mask menjadi 255.255.255.0.",
          "Gita: IP 192.168.6.15 berada di subnet berbeda dari gateway, jadi tidak ada jalur ke gateway. Perbaiki ke alamat 192.168.5.x yang bebas.",
        ],
      },
      {
        t: "p",
        x: "Akar masalah yang sama: alamat dimasukkan manual tanpa kontrol. Pencegahannya: DHCP dengan pool dan reservasi, dokumentasi rencana alamat, dan DHCP snooping di switch.",
      },
      {
        t: "tip",
        x: "Aturan cepat: sebelum menyalahkan perangkat, cek tiga hal dasarnya, yaitu IP, mask, dan gateway harus berada dalam satu subnet yang sama, dan IP-nya unik.",
      },
      { t: "h", x: "Latihan" },
      {
        t: "ol",
        items: [
          "PC 10.1.1.200/25 dengan gateway 10.1.1.129. Apakah gateway satu subnet dengan PC?",
          "Apakah 172.16.17.255/20 alamat host valid?",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) /25 blok 128; PC berada di 10.1.1.128 - .255, gateway .129 ada di blok sama, jadi ya; (2) /20 blok 16 di oktet ketiga: 172.16.16.0 - 172.16.31.255. 172.16.17.255 bukan broadcast (broadcast adalah 172.16.31.255), jadi valid.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menemukan mask atau gateway yang salah dari data PC.",
          "Saya bisa mengenali gejala IP duplikat.",
          "Saya bisa menuliskan akar masalah dan langkah pencegahannya.",
        ],
      },
    ],
  },
  {
    title: "Studi kasus: CIDR",
    blocks: [
      {
        t: "p",
        x: "Sebuah perusahaan punya 4 cabang dan kantor pusat. Blok yang tersedia: 10.10.0.0/20. Rancang alamat dan ringkasan rute untuk router pusat.",
      },
      { t: "h", x: "Kebutuhan" },
      {
        t: "table",
        head: ["Lokasi", "Host dibutuhkan", "Prefix minimum"],
        rows: [
          ["Pusat", "900", "/22 (2^10 - 2 = 1022)"],
          ["Cabang 1", "250", "/24 (254)"],
          ["Cabang 2", "250", "/24 (254)"],
          ["Cabang 3", "120", "/25 (126)"],
          ["Cabang 4", "60", "/26 (62)"],
        ],
      },
      { t: "h", x: "Alokasi (terbesar dulu)" },
      {
        t: "table",
        head: ["Lokasi", "Network", "Rentang"],
        rows: [
          ["Pusat", "10.10.0.0/22", "10.10.0.0 - 10.10.3.255"],
          ["Cabang 1", "10.10.4.0/24", "10.10.4.0 - 10.10.4.255"],
          ["Cabang 2", "10.10.5.0/24", "10.10.5.0 - 10.10.5.255"],
          ["Cabang 3", "10.10.6.0/25", "10.10.6.0 - 10.10.6.127"],
          ["Cabang 4", "10.10.6.128/26", "10.10.6.128 - 10.10.6.191"],
        ],
      },
      {
        t: "p",
        x: "Total dipakai = 1024 + 256 + 256 + 128 + 64 = 1728 alamat dari 4096 (/20). Sisa 2368 alamat (10.10.6.192 sampai 10.10.15.255) untuk pertumbuhan.",
      },
      { t: "h", x: "Ringkasan rute untuk jaringan cabang" },
      {
        t: "p",
        x: "Cabang 1 sampai 4 menempati 10.10.4.0 sampai 10.10.6.191. Untuk router lain yang hanya perlu tahu arah ke semua cabang, ringkasan terkecil yang menutup semuanya adalah 10.10.4.0/22 (10.10.4.0 - 10.10.7.255), karena 4 kelipatan 4 dan oktet ketiga 4 - 7. Ringkasan ini sedikit lebih luas dari yang dipakai (mencakup 10.10.6.192 - 10.10.7.255 yang belum terpakai), jadi jangan alokasikan ruang itu ke tempat lain.",
      },
      {
        t: "warn",
        x: "Ringkasan yang mencakup alamat milik lokasi lain menyebabkan paket salah arah (black hole). Selalu pastikan seluruh rentang ringkasan memang milik area yang diumumkan.",
      },
      {
        t: "code",
        lang: "text",
        x: `Pusat(config)# ip route 10.10.4.0 255.255.252.0 10.255.0.2
Pusat# show ip route static
> S    10.10.4.0/22 [1/0] via 10.255.0.2`,
      },
      { t: "h", x: "Latihan" },
      {
        t: "ol",
        items: [
          "Jika Cabang 5 butuh 500 host, bagaimana alokasinya dan dari mana?",
          "Mengapa Pusat dialokasikan lebih dulu?",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) 500 host butuh /23 (2^9 - 2 = 510). Harus sejajar kelipatan 512 di oktet ketiga (kelipatan 2): 10.10.8.0/23 (10.10.8.0 - 10.10.9.255); (2) agar blok terbesar sejajar pada batas yang benar dan tidak memecah ruang untuk blok kecil.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menentukan prefix untuk tiap kebutuhan dan mengalokasikan tanpa tumpang tindih.",
          "Saya bisa membuat ringkasan rute dan menjelaskan risikonya.",
          "Saya bisa menghitung sisa alamat yang tersedia.",
        ],
      },
    ],
  },
  {
    title: "Rangkuman dan latihan pengalamatan IP",
    blocks: [
      { t: "h", x: "Rangkuman" },
      {
        t: "table",
        head: ["Topik", "Intisari"],
        rows: [
          ["IPv4", "32 bit. Host valid = 2^h - 2. Network = IP AND mask. Alamat privat: 10/8, 172.16/12, 192.168/16."],
          ["CIDR", "Prefix menggantikan kelas. Subnet = pinjam bit; summarization = cari bit awal yang sama."],
          ["VLSM", "Alokasi dari kebutuhan terbesar ke terkecil; subnet berbeda ukuran; butuh routing classless."],
          ["IPv6", "128 bit. Singkat dengan membuang nol depan dan satu ::. /64 per LAN. Link-local FE80::/10. NDP menggantikan ARP."],
          ["Cisco IOS", "ip address, no shutdown, show ip interface brief, ip route, ipv6 unicast-routing, show ipv6 interface brief."],
        ],
      },
      { t: "h", x: "Soal latihan campuran" },
      {
        t: "ol",
        items: [
          "Tentukan network, broadcast, dan jumlah host valid untuk 172.20.99.130/27.",
          "Pecah 192.168.100.0/24 menjadi subnet untuk 60, 28, 12, dan 2 host dengan VLSM. Tuliskan network dan prefix tiap subnet.",
          "Ringkas 10.0.16.0/24 sampai 10.0.31.0/24.",
          "Singkat FE80:0000:0000:0000:0202:B3FF:FE1E:8329.",
          "Berapa banyak subnet /64 yang ada dalam /52?",
          "Apa fungsi perintah ipv6 unicast-routing?",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) blok 32, 130 berada di 128 - 159: network 172.20.99.128, broadcast 172.20.99.159, 30 host. (2) 60 host /26 -> 192.168.100.0/26; 28 host /27 -> 192.168.100.64/27; 12 host /28 -> 192.168.100.96/28; 2 host /30 -> 192.168.100.112/30. (3) 16 blok, 16 kelipatan 16: 10.0.16.0/20. (4) fe80::202:b3ff:fe1e:8329. (5) 2^(64-52) = 2^12 = 4096. (6) Mengaktifkan penerusan paket IPv6 dan pengiriman Router Advertisement.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjawab semua soal tanpa melihat kunci.",
          "Saya sudah mencoba semua praktik di Packet Tracer.",
          "Saya siap melanjutkan ke modul Cisco berikutnya.",
        ],
      },
    ],
  },
];

export default chapters;