import type { Chapter } from "./types";
import { wikiImage } from "./media";

/**
 * g-3: Layanan inti jaringan. DHCP, DNS, gateway, NAT, dan ARP, lengkap dengan
 * gejala saat bermasalah, praktik di Linux, dan studi kasus.
 * Jumlah bab harus sama dengan `lessons` modul (9).
 *
 * Konvensi blok kode shell (tampil seperti terminal):
 *   - baris biasa     -> perintah (diberi prompt $)
 *   - "> teks"        -> output perintah
 *   - "# teks"        -> catatan
 */

const DORA_ASCII = `Client (belum punya IP)                      Server DHCP
        |                                          |
        |---- DISCOVER (broadcast, UDP 68 -> 67) ->|   "Ada server DHCP?"
        |<--- OFFER    (192.168.1.50, lease 24j) --|   "Pakai ini ya"
        |---- REQUEST  (broadcast, minta .50) ---->|   "Saya ambil .50"
        |<--- ACK      (konfigurasi final) --------|   "Resmi, ini milikmu"
        |                                          |`;

const DNS_ASCII = `Browser -> resolver (mis. 192.168.1.1 / 1.1.1.1)
                         |
                         |-- cache? ya -> langsung jawab
                         |-- tidak:
                         |     1. tanya root server   -> "tanya server .com"
                         |     2. tanya server .com   -> "tanya ns milik example.com"
                         |     3. tanya ns example.com -> "A: 93.184.216.34"
                         |
                         '-- simpan di cache selama TTL, jawab ke browser`;

const chapters: Chapter[] = [
  {
    title: "Pengantar layanan jaringan",
    blocks: [
      {
        t: "p",
        x: "Kabel sudah terpasang dan Wi-Fi tersambung, tetapi pengguna tetap tidak bisa bekerja. Hampir selalu penyebabnya ada di layanan jaringan: perangkat tidak mendapat alamat IP (DHCP), nama tidak bisa diterjemahkan (DNS), halaman web tidak bisa diambil (HTTP), atau jam perangkat melenceng sehingga login dan sertifikat gagal (NTP). Modul ini membahas keempatnya.",
      },
      { t: "h", x: "Tujuan belajar modul ini" },
      {
        t: "ul",
        items: [
          "Menjelaskan proses DHCP DORA dan konfigurasi yang dibagikan.",
          "Menjelaskan alur resolusi DNS, jenis record, cache, dan TTL.",
          "Membaca request dan response HTTP: method, status code, header, dan peran TLS.",
          "Menjelaskan sinkronisasi waktu NTP, stratum, offset, dan delay.",
          "Mengenali gejala saat tiap layanan bermasalah dan mengujinya dengan dig, curl, dan chrony.",
        ],
      },
      { t: "h", x: "Peta modul" },
      {
        t: "table",
        head: ["Layanan", "Pertanyaan yang dijawab", "Port", "Alat cek"],
        rows: [
          ["DHCP", "Apa IP, gateway, dan DNS saya?", "UDP 67/68", "ip addr, dhclient -v, tcpdump"],
          ["DNS", "Apa alamat IP dari nama ini?", "UDP/TCP 53", "dig, nslookup, resolvectl"],
          ["HTTP/HTTPS", "Bagaimana mengambil halaman dari server?", "TCP 80/443", "curl -v, curl -I"],
          ["NTP", "Jam yang benar sekarang pukul berapa?", "UDP 123", "chronyc, timedatectl"],
        ],
        caption: "Urutan umum: DHCP memberi IP dan DNS, DNS mencari alamat server, HTTP mengambil halaman, NTP menjaga jam tetap benar.",
      },
      { t: "h", x: "Siapkan alat latihan" },
      {
        t: "code",
        lang: "bash",
        x: `sudo apt update
sudo apt install -y dnsutils iproute2 tcpdump curl chrony
dig -v
curl --version | head -1`,
      },
      {
        t: "warn",
        x: "Latihan hanya di VM atau jaringan milikmu. Jangan menjalankan server DHCP kedua di jaringan kantor atau kampus, dan jangan mengubah waktu sistem mesin produksi untuk eksperimen.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut fungsi dan port DHCP, DNS, HTTP/HTTPS, dan NTP.",
          "Saya punya mesin Linux atau VM untuk latihan.",
        ],
      },
    ],
  },
  {
    title: "Cara kerja DHCP",
    blocks: [
      {
        t: "p",
        x: "DHCP (Dynamic Host Configuration Protocol) membagikan konfigurasi jaringan secara otomatis. Tanpa DHCP, setiap perangkat harus diisi IP, mask, gateway, dan DNS secara manual. Server DHCP menyimpan pool alamat dan meminjamkannya ke klien dalam jangka waktu tertentu yang disebut lease.",
      },
      { t: "h", x: "Empat langkah DORA" },
      { t: "code", lang: "text", x: DORA_ASCII },
      {
        t: "table",
        head: ["Pesan", "Arah", "Tujuan"],
        rows: [
          ["Discover", "Klien ke broadcast 255.255.255.255", "Mencari server DHCP; IP sumber masih 0.0.0.0"],
          ["Offer", "Server ke klien", "Menawarkan IP beserta mask, gateway, DNS, lease"],
          ["Request", "Klien ke broadcast", "Menerima satu tawaran (bila ada banyak server, yang lain tahu ditolak)"],
          ["Acknowledge", "Server ke klien", "Mengesahkan lease; klien boleh memakai IP"],
        ],
      },
      { t: "h", x: "Isi konfigurasi yang diberikan" },
      {
        t: "ul",
        items: [
          "IP address dan subnet mask.",
          "Default gateway (option 3).",
          "Server DNS (option 6) dan domain pencarian.",
          "Lease time: berapa lama IP boleh dipakai.",
        ],
      },
      { t: "h", x: "Lease, renew, dan rebind" },
      {
        t: "table",
        head: ["Waktu", "Kejadian", "Contoh pada lease 24 jam"],
        rows: [
          ["T1 = 50% lease", "Klien meminta perpanjangan (unicast ke server asal)", "Setelah 12 jam"],
          ["T2 = 87,5% lease", "Bila belum berhasil, klien menyiarkan permintaan ke server mana pun (rebind)", "Setelah 21 jam"],
          ["100% lease", "IP kedaluwarsa; klien harus memulai DORA dari awal", "Setelah 24 jam"],
        ],
      },
      {
        t: "p",
        x: "Perhitungan: 24 jam x 0,5 = 12 jam untuk T1, dan 24 jam x 0,875 = 21 jam untuk T2. Lease yang terlalu pendek memperbanyak trafik DHCP, sedangkan lease yang terlalu panjang membuat pool cepat habis di jaringan dengan banyak perangkat yang datang dan pergi, misalnya Wi-Fi tamu.",
      },
      { t: "h", x: "DHCP relay" },
      {
        t: "p",
        x: "Broadcast tidak melewati router, jadi satu server DHCP bisa melayani banyak VLAN lewat DHCP relay (ip helper-address pada router). Relay mengubah broadcast klien menjadi unicast ke server dan mengisi field giaddr supaya server tahu pool subnet mana yang harus dipakai.",
      },
      {
        t: "tip",
        x: "Reservasi DHCP (IP tetap berdasarkan MAC) lebih mudah dikelola daripada IP statis di setiap perangkat, karena semua alamat tercatat di satu tempat dan tidak bentrok dengan pool.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut urutan Discover, Offer, Request, Acknowledge dan siapa mengirim apa.",
          "Saya bisa menghitung T1 dan T2 dari lease time.",
          "Saya tahu fungsi DHCP relay.",
        ],
      },
    ],
  },
  {
    title: "Cara kerja DNS",
    blocks: [
      {
        t: "p",
        x: "DNS (Domain Name System) adalah buku telepon internet: ia menerjemahkan nama seperti example.com menjadi alamat IP. Datanya tidak disimpan di satu tempat, melainkan tersebar dalam hierarki yang dikelola banyak server.",
      },
      wikiImage(
        "2 Example of a Domain Hierarchy.svg",
        "Contoh hierarki nama domain DNS dari root, top-level domain, sampai subdomain",
        "Hierarki domain DNS: root, TLD, domain, subdomain",
        `.  (root)
 |-- com
 |    '-- example
 |         '-- www
 |-- org
 '-- id
      '-- co`,
      ),
      { t: "h", x: "Siapa saja yang terlibat" },
      {
        t: "table",
        head: ["Peran", "Tugas", "Contoh"],
        rows: [
          ["Stub resolver", "Bagian kecil di OS/aplikasi yang bertanya ke resolver", "systemd-resolved, getaddrinfo()"],
          ["Recursive resolver", "Mencari jawaban sampai tuntas dan menyimpannya di cache", "Router rumah, DNS ISP, 1.1.1.1, 8.8.8.8"],
          ["Root server", "Menunjuk ke server TLD yang tepat", "a.root-servers.net"],
          ["TLD server", "Menunjuk ke server milik domain", "Server untuk .com, .id"],
          ["Authoritative server", "Pemegang jawaban resmi untuk sebuah domain", "ns milik example.com"],
        ],
      },
      { t: "h", x: "Alur resolusi" },
      { t: "code", lang: "text", x: DNS_ASCII },
      { t: "h", x: "Jenis record yang paling sering dipakai" },
      {
        t: "table",
        head: ["Record", "Isi", "Contoh"],
        rows: [
          ["A", "Nama ke IPv4", "example.com -> 93.184.216.34"],
          ["AAAA", "Nama ke IPv6", "example.com -> 2606:2800:..."],
          ["CNAME", "Alias ke nama lain", "www -> example.com"],
          ["MX", "Server email domain, dengan prioritas", "10 mail.example.com"],
          ["NS", "Server nama resmi domain", "ns1.example.com"],
          ["TXT", "Teks bebas (SPF, verifikasi domain)", "v=spf1 ..."],
          ["PTR", "IP ke nama (reverse lookup)", "34.216.184.93.in-addr.arpa"],
        ],
      },
      { t: "h", x: "Cache dan TTL" },
      {
        t: "p",
        x: "Setiap jawaban membawa TTL (time to live) dalam detik. Selama TTL belum habis, resolver menjawab dari cache tanpa bertanya lagi. Akibatnya, perubahan record baru terlihat merata setelah TTL lama habis. Contoh: record ber-TTL 3600 detik (1 jam) yang diubah pukul 10.00 bisa masih tampil sebagai nilai lama sampai paling lambat pukul 11.00 di resolver yang baru saja menyimpannya.",
      },
      {
        t: "tip",
        x: "Sebelum memindahkan website ke server baru, turunkan TTL record terkait menjadi 300 detik beberapa jam (minimal satu TTL lama) sebelum hari pindah, lalu naikkan kembali setelah stabil.",
      },
      {
        t: "p",
        x: "DNS memakai UDP port 53 untuk pertanyaan biasa, dan TCP port 53 bila jawaban terlalu besar atau untuk transfer zona. DNS tanpa enkripsi bisa dibaca di jaringan; DoT (port 853) dan DoH (HTTPS) mengenkripsinya.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menggambar alur resolusi dari resolver ke root, TLD, dan authoritative.",
          "Saya hafal fungsi record A, AAAA, CNAME, MX, NS, TXT, dan PTR.",
          "Saya paham mengapa perubahan DNS tidak langsung terlihat (TTL dan cache).",
        ],
      },
    ],
  },
  {
    title: "Cara kerja HTTP",
    blocks: [
      {
        t: "p",
        x: "HTTP (Hypertext Transfer Protocol) adalah protokol tanya-jawab antara klien (browser, curl, aplikasi) dan server web. Klien mengirim request, server membalas dengan response. HTTP berjalan di atas TCP port 80; HTTPS adalah HTTP yang dibungkus TLS di port 443 sehingga terenkripsi dan server terautentikasi lewat sertifikat.",
      },
      { t: "h", x: "Anatomi request dan response" },
      {
        t: "code",
        lang: "text",
        x: `REQUEST                                  RESPONSE
GET /index.html HTTP/1.1                 HTTP/1.1 200 OK
Host: example.com                        Content-Type: text/html
User-Agent: curl/8.5.0                   Content-Length: 1256
Accept: */*                              Cache-Control: max-age=3600
                                         (baris kosong)
(baris kosong)                           <html> ... </html>`,
      },
      { t: "h", x: "Method yang umum" },
      {
        t: "table",
        head: ["Method", "Fungsi", "Contoh"],
        rows: [
          ["GET", "Mengambil data", "Membuka halaman"],
          ["POST", "Mengirim data baru", "Submit form login"],
          ["PUT / PATCH", "Mengganti / mengubah sebagian data", "Update profil"],
          ["DELETE", "Menghapus data", "Hapus item"],
          ["HEAD", "Seperti GET tanpa body (hanya header)", "Cek ukuran file"],
        ],
      },
      { t: "h", x: "Kelompok status code" },
      {
        t: "table",
        head: ["Kode", "Arti", "Contoh yang sering muncul"],
        rows: [
          ["1xx", "Informasi", "101 Switching Protocols"],
          ["2xx", "Berhasil", "200 OK, 201 Created, 204 No Content"],
          ["3xx", "Pengalihan", "301 Moved Permanently, 302 Found, 304 Not Modified"],
          ["4xx", "Kesalahan di sisi klien", "400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests"],
          ["5xx", "Kesalahan di sisi server", "500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout"],
        ],
      },
      { t: "h", x: "Versi HTTP" },
      {
        t: "table",
        head: ["Versi", "Transport", "Ciri utama"],
        rows: [
          ["HTTP/1.1", "TCP", "Teks, satu request per koneksi pada satu waktu, keep-alive"],
          ["HTTP/2", "TCP + TLS", "Biner, banyak request sekaligus dalam satu koneksi (multiplexing)"],
          ["HTTP/3", "QUIC (UDP 443)", "Menghindari head-of-line blocking TCP, handshake lebih cepat"],
        ],
      },
      { t: "h", x: "Apa yang terjadi saat membuka https://example.com" },
      {
        t: "ol",
        items: [
          "DNS menerjemahkan example.com menjadi IP.",
          "TCP three-way handshake ke port 443.",
          "TLS handshake: server mengirim sertifikat, klien memeriksa penerbit dan masa berlakunya, lalu kunci sesi disepakati.",
          "Browser mengirim request HTTP terenkripsi, server membalas response.",
        ],
      },
      {
        t: "tip",
        x: "Bila sertifikat dianggap tidak valid padahal benar, periksa jam perangkat lebih dulu. Jam yang melenceng membuat sertifikat terlihat belum berlaku atau sudah kedaluwarsa. Itulah sebabnya NTP dibahas di modul yang sama.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membaca request dan response HTTP dan menyebut fungsi method utama.",
          "Saya bisa membedakan 4xx dan 5xx serta menyebut contoh tiap kelompok.",
          "Saya bisa menjelaskan urutan DNS, TCP, TLS, lalu HTTP.",
        ],
      },
    ],
  },
  {
    title: "Cara kerja NTP",
    blocks: [
      {
        t: "p",
        x: "NTP (Network Time Protocol) menyinkronkan jam perangkat lewat jaringan memakai UDP port 123. Jam yang akurat penting untuk sertifikat TLS, log yang bisa dikorelasikan antar server, token autentikasi (misalnya Kerberos dan TOTP), serta penjadwalan tugas.",
      },
      { t: "h", x: "Hierarki stratum" },
      {
        t: "table",
        head: ["Stratum", "Sumber", "Contoh"],
        rows: [
          ["0", "Jam referensi presisi tinggi", "Jam atom, penerima GPS"],
          ["1", "Server yang terhubung langsung ke stratum 0", "Server waktu institusi"],
          ["2", "Menyinkron ke stratum 1", "pool.ntp.org, server kantor"],
          ["3 dan seterusnya", "Menyinkron ke stratum di atasnya", "Perangkat dan laptop"],
        ],
        caption: "Semakin besar nomor stratum, semakin jauh dari sumber waktu. Stratum 16 berarti tidak tersinkronisasi.",
      },
      { t: "h", x: "Menghitung offset dan delay" },
      {
        t: "p",
        x: "Klien mencatat empat waktu: T1 (klien kirim), T2 (server terima), T3 (server balas), T4 (klien terima).",
      },
      {
        t: "code",
        lang: "text",
        x: `offset = ((T2 - T1) + (T3 - T4)) / 2
delay  = (T4 - T1) - (T3 - T2)`,
      },
      {
        t: "p",
        x: "Contoh: T1 = 10,000; T2 = 10,120; T3 = 10,121; T4 = 10,041 (semua dalam detik). Offset = ((0,120) + (0,080)) / 2 = 0,100 detik, artinya jam klien tertinggal 0,1 detik. Delay = 0,041 - 0,001 = 0,040 detik (40 ms) perjalanan pergi-pulang di jaringan.",
      },
      { t: "h", x: "Step dan slew" },
      {
        t: "ul",
        items: [
          "Selisih kecil dikoreksi perlahan dengan mempercepat atau memperlambat jam (slew), supaya waktu tidak melompat mundur.",
          "Selisih besar (misalnya lebih dari 1 detik pada beberapa konfigurasi) dikoreksi langsung dengan melompatkan jam (step).",
          "Daemon yang umum: chrony (modern, default di banyak distro), systemd-timesyncd (sederhana), dan ntpd (klasik).",
        ],
      },
      {
        t: "warn",
        x: "Port UDP 123 sering diblokir firewall. Server NTP yang terbuka ke publik dan salah dikonfigurasi juga bisa disalahgunakan untuk serangan amplifikasi DDoS. Batasi akses dan perbarui daemon.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjelaskan stratum.",
          "Saya bisa menghitung offset dan delay dari empat timestamp.",
          "Saya tahu bedanya step dan slew serta mengapa jam penting untuk TLS dan log.",
        ],
      },
    ],
  },
  {
    title: "Praktik: DHCP dan DNS",
    blocks: [
      { t: "h", x: "DHCP: lihat konfigurasi dan tangkap DORA" },
      {
        t: "code",
        lang: "bash",
        x: `ip -br addr
ip route
resolvectl status

# Terminal A: tangkap pesan DHCP
sudo tcpdump -i eth0 -n -vv 'port 67 or port 68'

# Terminal B: lepas lalu minta ulang lease
sudo dhclient -r eth0
sudo dhclient -v eth0
> DHCPDISCOVER on eth0 to 255.255.255.255 port 67
> DHCPOFFER of 192.168.1.50 from 192.168.1.1
> DHCPREQUEST for 192.168.1.50 on eth0 to 255.255.255.255 port 67
> DHCPACK of 192.168.1.50 from 192.168.1.1`,
      },
      {
        t: "warn",
        x: "dhclient -r memutus koneksi sementara. Jangan jalankan lewat SSH ke mesin yang sama. Bila memakai NetworkManager atau systemd-networkd, gunakan nmcli device reapply eth0 atau networkctl renew eth0. Sesuaikan nama eth0 dengan hasil ip -br link.",
      },
      { t: "h", x: "DNS: query, bandingkan resolver, telusuri" },
      {
        t: "code",
        lang: "bash",
        x: `dig +short example.com A
dig example.com MX
dig -x 8.8.8.8 +short
> dns.google.

dig +short example.com @1.1.1.1
dig +short example.com @8.8.8.8

dig +trace example.com
> .             518400 IN NS a.root-servers.net.
> com.          172800 IN NS a.gtld-servers.net.
> example.com.     300 IN A  93.184.216.34`,
      },
      {
        t: "p",
        x: "Lihat status pada dig lengkap: NOERROR (berhasil), NXDOMAIN (nama tidak ada), SERVFAIL (resolver gagal). Jalankan dig example.com dua kali dengan jeda 5 detik: TTL pada jawaban kedua lebih kecil karena dihitung mundur dari cache.",
      },
      { t: "h", x: "Soal latihan" },
      {
        t: "ol",
        items: [
          "IP sumber dan tujuan pada Discover, dan alasannya?",
          "Lease 2 jam. Kapan T1 dan T2?",
          "Record TTL 1800 detik diubah. Berapa menit paling lama nilai lama masih terlihat?",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) sumber 0.0.0.0 karena klien belum punya IP, tujuan 255.255.255.255 karena server belum diketahui; (2) T1 = 1 jam, T2 = 2 x 0,875 = 1,75 jam; (3) 1800 / 60 = 30 menit.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menangkap keempat pesan DORA dengan tcpdump.",
          "Saya bisa memakai dig untuk record A, MX, reverse lookup, dan +trace.",
          "Saya bisa membandingkan jawaban beberapa resolver.",
        ],
      },
    ],
  },
  {
    title: "Praktik: HTTP dan NTP",
    blocks: [
      { t: "h", x: "HTTP dengan curl" },
      {
        t: "code",
        lang: "bash",
        x: `curl -I https://example.com
> HTTP/2 200
> content-type: text/html

curl -v https://example.com -o /dev/null
> * Connected to example.com (93.184.216.34) port 443
> * SSL connection using TLSv1.3
> > GET / HTTP/2
> < HTTP/2 200

curl -s -o /dev/null -w "%{http_code} dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} total=%{time_total}\n" https://example.com
curl -I http://example.com/tidak-ada
> HTTP/1.1 404 Not Found`,
      },
      {
        t: "p",
        x: "Baris berawalan > adalah request yang dikirim, baris berawalan < adalah response. Pengukuran -w memperlihatkan di mana waktu terbuang: bila time_namelookup besar masalahnya DNS, time_connect besar masalahnya jaringan atau TCP, time_appconnect besar masalahnya TLS.",
      },
      { t: "h", x: "Server web sementara" },
      {
        t: "code",
        lang: "bash",
        x: `# Terminal A
mkdir -p ~/web && cd ~/web && echo "halo" > index.html
python3 -m http.server 8080

# Terminal B
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/tidak-ada`,
      },
      { t: "h", x: "NTP dengan chrony" },
      {
        t: "code",
        lang: "bash",
        x: `timedatectl
> System clock synchronized: yes
> NTP service: active

chronyc tracking
> Stratum         : 3
> System time     : 0.000012345 seconds fast of NTP time

chronyc sources -v
> ^* time.cloudflare.com   3   6   377    32   +120us[ +150us] +/-  15ms`,
      },
      {
        t: "p",
        x: "Pada chronyc sources, tanda ^* adalah server yang sedang dipakai, kolom setelahnya adalah stratum, dan Reach 377 (oktal) berarti 8 polling terakhir berhasil. Cek lalu lintasnya dengan sudo tcpdump -i eth0 -n udp port 123.",
      },
      { t: "h", x: "Soal latihan" },
      {
        t: "ol",
        items: [
          "curl menampilkan 502. Termasuk kelompok apa, dan siapa yang kemungkinan bermasalah?",
          "time_namelookup = 3,2 detik dan total = 3,5 detik. Layanan apa yang dicurigai?",
          "T1 = 50,000; T2 = 50,300; T3 = 50,301; T4 = 50,101. Hitung offset dan delay.",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) 5xx, masalah di sisi server atau perantara seperti gateway/reverse proxy; (2) DNS; (3) offset = ((0,300) + (0,200)) / 2 = 0,250 detik (jam klien tertinggal); delay = 0,101 - 0,001 = 0,100 detik.",
      },
      {
        t: "check",
        items: [
          "Saya bisa memakai curl -I dan curl -v untuk membaca status dan header.",
          "Saya bisa memakai curl -w untuk menentukan lambat di DNS, TCP, atau TLS.",
          "Saya bisa membaca timedatectl dan chronyc tracking/sources.",
        ],
      },
    ],
  },
  {
    title: "Studi kasus: gejala yang muncul saat salah satunya bermasalah",
    blocks: [
      { t: "h", x: "Gejala dan layanan yang dicurigai" },
      {
        t: "table",
        head: ["Gejala", "Layanan", "Cara memastikan"],
        rows: [
          ["IP 169.254.x.x", "DHCP", "ip addr; tcpdump port 67 or port 68"],
          ["Sebagian perangkat tidak dapat IP", "DHCP (pool habis) atau rogue DHCP", "Lihat tabel lease dan IP server pengirim Offer"],
          ["ping 8.8.8.8 berhasil, ping nama gagal", "DNS", "dig nama; dig nama @8.8.8.8"],
          ["Hanya satu situs gagal", "DNS (record/cache) atau HTTP", "dig +short lalu curl -I"],
          ["Situs lambat di awal lalu normal", "DNS (resolver utama mati)", "curl -w time_namelookup"],
          ["Error 502/503/504", "HTTP (server atau reverse proxy)", "curl -I dan log server"],
          ["Error sertifikat padahal sertifikat benar", "NTP (jam salah)", "date; chronyc tracking"],
          ["Login/token ditolak, log antar server tidak sinkron", "NTP", "chronyc sources; bandingkan jam"],
        ],
      },
      { t: "h", x: "Urutan uji yang efisien" },
      {
        t: "ol",
        items: [
          "ip addr dan ip route: IP, mask, dan gateway benar? Bila tidak, DHCP.",
          "ping gateway lalu ping 8.8.8.8: jalur jaringan hidup? Bila gagal, bukan masalah layanan di modul ini.",
          "dig nama: nama bisa diterjemahkan? Bila tidak, DNS.",
          "curl -v alamat: TLS dan HTTP berhasil? Perhatikan kode status dan pesan sertifikat.",
          "date dan chronyc tracking: jam benar? Bila melenceng, NTP.",
        ],
      },
      { t: "h", x: "Studi kasus" },
      {
        t: "p",
        x: "Pagi hari, tiga pengguna di kantor cabang melapor. Andi: ping 8.8.8.8 berhasil, ping google.com gagal. Budi: IP 169.254.77.12 dan gateway tidak bisa di-ping. Citra: semua normal, tetapi aplikasi internal menolak login dengan pesan token kedaluwarsa, dan jam laptopnya tertinggal 6 menit.",
      },
      {
        t: "ol",
        items: [
          "Andi: jaringan hidup tetapi nama tidak diterjemahkan, jadi DNS. Bandingkan dig google.com dengan dig google.com @8.8.8.8; bila yang kedua berhasil, resolver bawaan DHCP bermasalah.",
          "Budi: 169.254.x.x berarti tidak ada jawaban DHCP. Cek kabel, port, VLAN, DHCP relay, dan kapasitas pool.",
          "Citra: token berbasis waktu ditolak karena jam melenceng 6 menit. Cek chronyc sources dan UDP 123 ke server waktu.",
        ],
      },
      {
        t: "p",
        x: "Kesimpulan: tiga keluhan, tiga layanan berbeda (DNS, DHCP, NTP). Kelompokkan gejala per layanan sebelum memperbaiki, dan jangan berasumsi semuanya satu penyebab. Setelah itu tulis akar masalah dan cara mencegahnya, misalnya memantau pool DHCP, menyiapkan dua resolver, dan memantau selisih waktu.",
      },
      {
        t: "check",
        items: [
          "Saya bisa mengaitkan gejala dengan layanan yang tepat.",
          "Saya hafal urutan uji dari IP sampai jam.",
          "Saya bisa menuliskan akar masalah dan langkah pencegahan.",
        ],
      },
    ],
  },
  {
    title: "Rangkuman dan latihan layanan jaringan",
    blocks: [
      { t: "h", x: "Rangkuman" },
      {
        t: "table",
        head: ["Layanan", "Intisari"],
        rows: [
          ["DHCP", "Discover, Offer, Request, Acknowledge. UDP 67/68. T1 = 50% dan T2 = 87,5% lease. 169.254.x.x = gagal dapat lease."],
          ["DNS", "Resolver menelusuri root, TLD, authoritative. Cache sesuai TTL. NOERROR, NXDOMAIN, SERVFAIL."],
          ["HTTP", "Request/response. Status 2xx berhasil, 3xx alih, 4xx salah klien, 5xx salah server. HTTPS = HTTP di atas TLS, port 443."],
          ["NTP", "UDP 123, hierarki stratum. Offset dan delay dari empat timestamp. Jam salah merusak TLS dan autentikasi."],
        ],
      },
      { t: "h", x: "Soal latihan mandiri" },
      {
        t: "ol",
        items: [
          "Lease DHCP 8 jam. Hitung T1 dan T2.",
          "Record ber-TTL 7200 detik diubah. Berapa jam paling lama nilai lama bisa bertahan di resolver?",
          "Apa beda 401 dan 403, serta 502 dan 504?",
          "curl -I https://situs menampilkan error sertifikat belum berlaku. Apa yang pertama kali dicek?",
          "T1 = 20,000; T2 = 20,210; T3 = 20,211; T4 = 20,061. Hitung offset dan delay.",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) T1 = 4 jam, T2 = 7 jam; (2) 2 jam; (3) 401 = belum terautentikasi, 403 = terautentikasi tetapi tidak diizinkan; 502 = gateway menerima jawaban tidak valid dari upstream, 504 = upstream tidak menjawab tepat waktu; (4) jam perangkat (NTP); (5) offset = ((0,210) + (0,150)) / 2 = 0,180 detik; delay = 0,061 - 0,001 = 0,060 detik.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjawab semua soal tanpa melihat kunci.",
          "Saya siap melanjutkan ke modul berikutnya.",
        ],
      },
    ],
  },
];

export default chapters;