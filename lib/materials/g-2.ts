import { wikiImage } from "./media";
import type { Chapter } from "./types";

/**
 * g-2: TCP/IP dari dalam. Alur paket, three-way handshake, window, port,
 * dan cara membaca header, dengan praktik memakai tcpdump dan ss.
 * Jumlah bab harus sama dengan `lessons` modul (10).
 *
 * Konvensi blok kode shell (tampil seperti terminal):
 *   - baris biasa     -> perintah (diberi prompt $)
 *   - "> teks"        -> output perintah
 *   - "# teks"        -> catatan
 */
const chapters: Chapter[] = [
  {
    title: "Pengantar dan tujuan belajar",
    blocks: [
      {
        t: "p",
        x: "Di modul sebelumnya kamu belajar model OSI dan TCP/IP sebagai teori. Di modul ini kamu melihat teori itu bekerja: bagaimana data aplikasi dibungkus menjadi paket, bagaimana dua komputer membuka koneksi TCP, bagaimana pengiriman diatur supaya andal, dan bagaimana semua itu terbaca di sebuah capture paket.",
      },
      wikiImage(
        "Message flows.svg",
        "Aliran pesan antara dua sistem yang memakai protocol suite yang sama, digambarkan per lapisan",
        "Aliran pesan antar dua sistem: tiap lapisan protokol berbicara dengan lapisan yang sama di sisi lawan",
      ),
      { t: "h", x: "Tujuan belajar modul ini" },
      {
        t: "ul",
        items: [
          "Menjelaskan perjalanan data dari aplikasi sampai kabel, termasuk header yang ditambahkan tiap lapisan.",
          "Menggambar dan membaca three-way handshake lengkap dengan nomor sequence dan acknowledgment.",
          "Menjelaskan fungsi window dan menghitung batas throughput dari ukuran window dan RTT.",
          "Memahami port, socket, dan perbedaan LISTEN dengan ESTABLISHED.",
          "Membaca header IP dan TCP, lalu menemukan masalah lewat capture paket.",
        ],
      },
      { t: "h", x: "Peta modul" },
      {
        t: "table",
        head: ["Bab", "Topik", "Alat utama"],
        rows: [
          ["2", "Alur paket dari aplikasi ke kabel", "Diagram, perhitungan MSS"],
          ["3", "Three-way handshake", "Diagram sequence dan ack"],
          ["4", "Window dan pengiriman andal", "Rumus window / RTT"],
          ["5", "Port dan socket", "ss, nc"],
          ["6", "Cara membaca header", "Tabel header, filter Wireshark"],
          ["7 - 9", "Praktik: alur paket, handshake, window", "tcpdump, curl, iperf3, ss"],
          ["10", "Rangkuman dan latihan", "Semua alat di atas"],
        ],
      },
      { t: "h", x: "Siapkan alat latihan" },
      {
        t: "p",
        x: "Semua praktik bisa dilakukan di satu mesin Linux lewat interface loopback (lo), tanpa menyentuh jaringan lain. Pasang alat berikut di VM Ubuntu atau WSL2.",
      },
      {
        t: "code",
        lang: "bash",
        x: `sudo apt update
sudo apt install -y tcpdump netcat-openbsd iperf3 curl iproute2
tcpdump --version
ss --version`,
      },
      {
        t: "p",
        x: "Wireshark opsional tetapi sangat membantu untuk membaca capture secara visual. Pasang di laptop (Windows, macOS, atau Linux desktop), lalu buka file .pcap yang kamu buat dengan tcpdump.",
      },
      {
        t: "tip",
        x: "Mulailah dari loopback. Trafiknya pendek, bersih, dan aman, jadi mudah dibaca. Setelah paham, baru capture di interface asli seperti eth0 atau wlan0.",
      },
      {
        t: "warn",
        x: "Capture paket hanya di jaringan milikmu atau yang kamu punya izin tertulis untuk menganalisisnya. Paket bisa berisi data sensitif, misalnya password pada protokol tanpa enkripsi (HTTP, Telnet, FTP). Perlakukan file .pcap seperti data rahasia.",
      },
      {
        t: "check",
        items: [
          "Saya tahu apa saja yang akan dipelajari di modul ini.",
          "Saya punya mesin Linux dengan tcpdump, nc, dan ss yang bisa dipakai.",
          "Saya paham batas etika dan keamanan saat menangkap paket.",
        ],
      },
    ],
  },
  {
    title: "Alur paket dari aplikasi ke kabel",
    blocks: [
      {
        t: "p",
        x: "Saat browser mengambil sebuah halaman, aplikasi hanya menyerahkan teks permintaan HTTP. Semua hal lain, mulai dari nomor port, alamat IP, sampai alamat MAC, ditambahkan oleh lapisan di bawahnya. Setiap lapisan membungkus data dari lapisan atas dengan header miliknya.",
      },
      {
        t: "code",
        lang: "text",
        x: `Application  GET / HTTP/1.1 ...                                    = data
     |
Transport    [TCP: port 52344 -> 80 | seq, ack, flag, window] + data        = segment
     |
Network      [IP: 192.168.1.20 -> 203.0.113.10 | TTL, protocol=6] + segment = packet
     |
Data Link    [Ethernet: MAC PC -> MAC gateway] + packet + FCS               = frame
     |
Physical     1011001110... sinyal listrik, cahaya, atau radio               = bit`,
      },
      wikiImage(
        "IP stack connections.svg",
        "Dua host terhubung lewat dua router, beserta lapisan protokol yang dipakai di tiap hop",
        "Host memakai semua lapisan, sedangkan router hanya sampai lapisan Internet (IP) di tiap hop",
      ),
      { t: "h", x: "Tugas tiap header" },
      {
        t: "table",
        head: ["Lapisan", "Header berisi", "Menjawab pertanyaan"],
        rows: [
          ["Transport (TCP)", "Port asal dan tujuan, sequence, ack, flag, window", "Untuk aplikasi yang mana, dan bagaimana urutan serta kecepatannya?"],
          ["Network (IP)", "IP asal dan tujuan, TTL, nomor protokol", "Dikirim ke mana, melewati jaringan apa saja?"],
          ["Data Link (Ethernet)", "MAC asal dan tujuan, tipe protokol, FCS", "Siapa penerima berikutnya di kabel ini?"],
        ],
      },
      { t: "h", x: "Urutan kejadian saat membuka sebuah website" },
      {
        t: "ol",
        items: [
          "DNS: browser menanyakan alamat IP dari nama domain (UDP port 53).",
          "ARP: PC mencari alamat MAC gateway, karena tujuan ada di luar jaringan lokal.",
          "Three-way handshake TCP ke port tujuan (80 atau 443).",
          "Untuk HTTPS: negosiasi TLS (enkripsi) berjalan di atas koneksi TCP tadi.",
          "Permintaan HTTP dikirim, lalu server membalas dengan satu atau banyak segmen data.",
          "Penerima mengirim ACK untuk data yang sudah diterima.",
          "Koneksi ditutup dengan FIN, atau dipakai ulang untuk permintaan berikutnya.",
        ],
      },
      { t: "h", x: "Ukuran header, MTU, dan MSS" },
      {
        t: "p",
        x: "Satu frame Ethernet biasa membawa paket IP sampai 1500 byte. Angka ini disebut MTU (Maximum Transmission Unit). Dari 1500 byte itu, header IP (minimal 20 byte) dan header TCP (minimal 20 byte) ikut memakan tempat. Sisanya yang bisa dipakai untuk data aplikasi disebut MSS (Maximum Segment Size).",
      },
      {
        t: "table",
        head: ["Komponen", "Ukuran"],
        rows: [
          ["MTU (paket IP maksimum pada Ethernet)", "1500 byte"],
          ["Header IPv4 (tanpa opsi)", "20 byte"],
          ["Header TCP (tanpa opsi)", "20 byte"],
          ["MSS = 1500 - 20 - 20", "1460 byte"],
          ["Header Ethernet + FCS (di luar MTU)", "14 + 4 byte"],
        ],
        caption: "Opsi TCP seperti timestamp memakai sebagian ruang data, jadi payload nyata kadang sedikit di bawah 1460 byte.",
      },
      {
        t: "p",
        x: "Contoh: server mengirim file 10.000 byte dengan MSS 1460. Jumlah segmen = 10.000 / 1460 = 6,85, dibulatkan ke atas menjadi 7 segmen (6 segmen penuh 1460 byte dan 1 segmen 1240 byte). Pemecahan ini dilakukan oleh TCP, bukan oleh aplikasi.",
      },
      {
        t: "tip",
        x: "Selama paket melewati router, alamat MAC berganti di setiap hop, sedangkan alamat IP dan port tetap sama dari ujung ke ujung (kecuali ada NAT yang mengubahnya). Pegang aturan ini saat membaca capture.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut header apa yang ditambahkan tiap lapisan dan nama unit datanya.",
          "Saya bisa menghitung MSS dari MTU dan jumlah segmen dari ukuran data.",
          "Saya tahu alamat mana yang berubah dan mana yang tetap selama perjalanan.",
        ],
      },
    ],
  },
  {
    title: "Three-way handshake",
    blocks: [
      {
        t: "p",
        x: "TCP bersifat connection-oriented: sebelum data dikirim, kedua ujung harus sepakat membuka koneksi. Kesepakatan ini dilakukan lewat tiga pesan yang disebut three-way handshake. Tujuannya dua hal: memastikan kedua pihak siap, dan menyamakan nomor urut awal (ISN, Initial Sequence Number) yang akan dipakai untuk melacak setiap byte.",
      },
      {
        t: "code",
        lang: "text",
        x: `Client                                              Server
(CLOSED)                                            (LISTEN)
   |                                                   |
   |------ 1. SYN        seq=1000 ------------------->|   Client: SYN_SENT
   |                                                   |
   |<----- 2. SYN+ACK    seq=5000  ack=1001 -----------|   Server: SYN_RECEIVED
   |                                                   |
   |------ 3. ACK        seq=1001  ack=5001 ---------->|   Keduanya: ESTABLISHED
   |                                                   |
   |========== data aplikasi mulai mengalir ===========|`,
      },
      wikiImage(
        "Three-way-handshake-example.gif",
        "Animasi contoh three-way handshake TCP antara client dan server",
        "Animasi three-way handshake: SYN, SYN+ACK, ACK",
      ),
      { t: "h", x: "Membaca tiga langkahnya" },
      {
        t: "ol",
        items: [
          "SYN: client memilih ISN (di contoh 1000) dan meminta koneksi. Flag SYN menyala.",
          "SYN+ACK: server memilih ISN-nya sendiri (5000), dan mengakui SYN client dengan ack = 1001. Flag SYN dan ACK menyala.",
          "ACK: client mengakui SYN server dengan ack = 5001. Setelah ini koneksi berstatus ESTABLISHED.",
        ],
      },
      {
        t: "p",
        x: "Mengapa ack bernilai ISN + 1? Karena flag SYN dihitung memakai satu nomor urut. Angka ack selalu berarti: byte berikutnya yang saya harapkan adalah nomor ini.",
      },
      { t: "h", x: "Flag TCP yang perlu dikenal" },
      {
        t: "table",
        head: ["Flag", "Arti", "Notasi tcpdump"],
        rows: [
          ["SYN", "Membuka koneksi dan menyinkronkan nomor urut", "S"],
          ["ACK", "Mengakui data atau SYN yang sudah diterima", "."],
          ["PSH", "Minta data segera diteruskan ke aplikasi", "P"],
          ["FIN", "Menutup koneksi secara normal", "F"],
          ["RST", "Memutus koneksi seketika (ditolak atau terjadi error)", "R"],
        ],
      },
      { t: "h", x: "Opsi yang dinegosiasikan saat handshake" },
      {
        t: "ul",
        items: [
          "MSS: ukuran data terbesar per segmen yang sanggup diterima.",
          "Window scale: pengali agar window bisa lebih besar dari 65.535 byte (dibahas di bab 4).",
          "SACK: izin untuk memberi tahu segmen mana yang sudah diterima walau urutannya lompat.",
          "Timestamp: membantu mengukur RTT dan melindungi dari nomor urut lama.",
        ],
      },
      { t: "h", x: "Menutup koneksi" },
      {
        t: "p",
        x: "Penutupan normal memakai FIN dari tiap arah, biasanya terlihat sebagai empat paket: FIN, ACK, FIN, ACK. Pihak yang menutup lebih dulu akan berada di status TIME_WAIT selama sekitar 60 detik di Linux, supaya sisa paket lama tidak tercampur ke koneksi baru. RST berbeda dari FIN: RST memutus koneksi tanpa basa-basi.",
      },
      wikiImage(
        "Tcp state diagram fixed new.svg",
        "Diagram status (state) koneksi TCP dari CLOSED, LISTEN, SYN_SENT, ESTABLISHED sampai TIME_WAIT",
        "Diagram status TCP: dari LISTEN dan SYN_SENT sampai ESTABLISHED dan TIME_WAIT",
      ),
      { t: "h", x: "Gejala saat handshake bermasalah" },
      {
        t: "table",
        head: ["Yang terlihat di capture", "Artinya", "Pesan di aplikasi"],
        rows: [
          ["SYN dikirim berulang, tidak ada balasan", "Paket dibuang di jalan: firewall DROP, routing salah, atau host mati", "Connection timed out"],
          ["SYN dibalas RST", "Tidak ada proses yang LISTEN di port itu, atau ditolak aktif", "Connection refused"],
          ["SYN+ACK terkirim tetapi ACK tidak pernah datang", "Jalur balik bermasalah atau routing asimetris", "Koneksi menggantung"],
          ["Handshake sukses, lalu segera RST", "Aplikasi atau firewall menolak setelah koneksi terbentuk", "Connection reset by peer"],
        ],
      },
      {
        t: "warn",
        x: "SYN flood adalah serangan yang membanjiri server dengan SYN tanpa pernah menyelesaikan handshake, sehingga antrean koneksi setengah jadi penuh. Server modern memakai SYN cookies dan firewall untuk meredamnya. Mengenali pola ini di capture (banyak SYN, nyaris tanpa ACK) adalah keterampilan NOC yang berguna.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menggambar handshake lengkap dengan seq dan ack dari ISN tertentu.",
          "Saya tahu mengapa ack = ISN + 1.",
          "Saya bisa membedakan timeout dan connection refused dari pola paketnya.",
        ],
      },
    ],
  },
  {
    title: "Window: kecepatan dan pengiriman andal",
    blocks: [
      {
        t: "p",
        x: "Jika pengirim harus menunggu ACK untuk setiap segmen sebelum mengirim segmen berikutnya, jaringan akan sangat lambat. Solusinya adalah window: jumlah byte yang boleh dikirim tanpa menunggu ACK. Selama window belum penuh, pengirim bisa terus mengirim.",
      },
      {
        t: "code",
        lang: "text",
        x: `Nomor byte:   1 ........ 1000 | 1001 ........ 2000 | 2001 ........ 3000 | 3001 ...
              [ sudah di-ACK ]  [ terkirim, belum ACK ] [ boleh dikirim ]   [ belum boleh ]
                                |<----------- window = 2000 byte ---------->|
Saat ACK baru datang, window "bergeser" ke kanan dan segmen berikutnya boleh dikirim.`,
      },
      { t: "h", x: "Dua batas yang berlaku bersamaan" },
      {
        t: "table",
        head: ["Nama", "Siapa yang menentukan", "Tujuannya"],
        rows: [
          ["Receive window (rwnd)", "Penerima, diumumkan di kolom Window pada header TCP", "Flow control: agar buffer penerima tidak kebanjiran"],
          ["Congestion window (cwnd)", "Pengirim, berdasarkan kondisi jaringan", "Congestion control: agar jaringan tidak kelebihan beban"],
        ],
        caption: "Jumlah data yang boleh beredar = nilai terkecil dari rwnd dan cwnd.",
      },
      { t: "h", x: "ACK, retransmisi, dan congestion control" },
      {
        t: "ul",
        items: [
          "ACK bersifat kumulatif: ack = 3001 berarti semua byte sampai 3000 sudah diterima.",
          "Jika ACK tidak datang sebelum RTO (retransmission timeout), segmen dikirim ulang.",
          "Jika pengirim menerima 3 duplicate ACK, ia curiga satu segmen hilang dan langsung mengirim ulang tanpa menunggu RTO (fast retransmit).",
          "Slow start: cwnd dimulai kecil (di Linux 10 MSS) lalu membesar cepat selama tidak ada kehilangan paket.",
          "Saat terdeteksi kehilangan paket, cwnd diturunkan dan pertumbuhannya diperlambat (congestion avoidance).",
        ],
      },
      wikiImage(
        "CongWin in TCP Tahoe e Reno.png",
        "Grafik congestion window TCP terhadap waktu pada varian Tahoe dan Reno",
        "Congestion window (cwnd) terhadap waktu: tumbuh cepat saat slow start, turun saat paket hilang",
      ),
      { t: "h", x: "Window scaling" },
      {
        t: "p",
        x: "Kolom window di header TCP hanya 16 bit, jadi nilai maksimalnya 65.535 byte. Untuk jaringan cepat itu terlalu kecil. Opsi window scale (dinegosiasikan di handshake) mengalikan nilai window dengan 2 pangkat n, sehingga window bisa mencapai sekitar 1 GiB. Itu sebabnya di capture kamu melihat nilai window mentah dan nilai window yang sudah dikalikan.",
      },
      { t: "h", x: "Rumus yang paling berguna" },
      {
        t: "code",
        lang: "text",
        x: `Throughput maksimum  <=  Window / RTT

Window yang dibutuhkan  =  Bandwidth x RTT        (disebut BDP, Bandwidth-Delay Product)`,
      },
      {
        t: "table",
        head: ["Window", "RTT", "Throughput maksimum"],
        rows: [
          ["65.535 byte", "1 ms", "sekitar 524 Mbps"],
          ["65.535 byte", "10 ms", "sekitar 52,4 Mbps"],
          ["65.535 byte", "50 ms", "sekitar 10,5 Mbps"],
          ["65.535 byte", "200 ms", "sekitar 2,6 Mbps"],
        ],
        caption: "Perhitungan: 65.535 x 8 = 524.280 bit, dibagi RTT dalam detik. Contoh RTT 50 ms: 524.280 / 0,05 = 10.485.600 bps.",
      },
      {
        t: "p",
        x: "Contoh BDP: link 1 Gbps dengan RTT 20 ms. Bandwidth dalam byte per detik adalah 1.000.000.000 / 8 = 125.000.000. Dikali 0,02 detik, window yang dibutuhkan sekitar 2.500.000 byte (2,5 MB). Tanpa window scaling, koneksi ini tidak akan pernah mendekati 1 Gbps.",
      },
      { t: "h", x: "Zero window" },
      {
        t: "p",
        x: "Jika buffer penerima penuh (aplikasi lambat membaca data), penerima mengumumkan window = 0. Pengirim berhenti, lalu mengirim probe kecil secara berkala sampai penerima membuka window lagi. Di capture, ini muncul sebagai win 0 atau tanda TCP ZeroWindow di Wireshark.",
      },
      {
        t: "tip",
        x: "Koneksi lambat padahal bandwidth besar? Periksa tiga hal: RTT (jarak atau latensi tinggi), window (kecil atau zero window), dan retransmisi (paket hilang). Ketiganya terlihat langsung di capture.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjelaskan rwnd dan cwnd serta mana yang membatasi pengiriman.",
          "Saya bisa menghitung throughput maksimum dari window dan RTT.",
          "Saya bisa menghitung window yang dibutuhkan untuk bandwidth dan RTT tertentu.",
          "Saya tahu arti zero window dan duplicate ACK.",
        ],
      },
    ],
  },
  {
    title: "Port dan socket",
    blocks: [
      {
        t: "p",
        x: "Alamat IP menunjuk ke sebuah perangkat. Port menunjuk ke aplikasi tertentu di perangkat itu. Satu server bisa menjalankan web, SSH, dan database sekaligus karena masing-masing mendengarkan di port berbeda. Nomor port adalah angka 16 bit, jadi rentangnya 0 sampai 65.535.",
      },
      {
        t: "table",
        head: ["Rentang", "Nama", "Keterangan"],
        rows: [
          ["0 - 1023", "Well-known", "Layanan standar seperti 22, 53, 80, 443. Di Linux, membukanya butuh hak root."],
          ["1024 - 49151", "Registered", "Aplikasi terdaftar seperti 3306 (MySQL) dan 5432 (PostgreSQL)."],
          ["49152 - 65535", "Dynamic / ephemeral", "Dipakai client sebagai port asal sementara (rentang menurut IANA)."],
        ],
        caption: "Linux memakai rentang ephemeral sendiri: 32768 sampai 60999 secara default.",
      },
      {
        t: "table",
        head: ["Port", "Protokol", "Layanan"],
        rows: [
          ["22", "TCP", "SSH"],
          ["25", "TCP", "SMTP"],
          ["53", "UDP dan TCP", "DNS"],
          ["80", "TCP", "HTTP"],
          ["443", "TCP", "HTTPS"],
          ["3306", "TCP", "MySQL / MariaDB"],
          ["3389", "TCP", "Remote Desktop (RDP)"],
          ["5432", "TCP", "PostgreSQL"],
        ],
      },
      { t: "h", x: "Socket dan identitas koneksi" },
      {
        t: "p",
        x: "Socket adalah gabungan alamat IP dan port, misalnya 192.168.1.20:52344. Sebuah koneksi TCP dikenali secara unik oleh lima nilai (5-tuple): protokol, IP asal, port asal, IP tujuan, dan port tujuan.",
      },
      {
        t: "code",
        lang: "text",
        x: `Tab browser A : 192.168.1.20:52344  ->  203.0.113.10:443     (koneksi 1)
Tab browser B : 192.168.1.20:52390  ->  203.0.113.10:443     (koneksi 2)

Tujuannya sama, tetapi port asal berbeda, jadi server bisa membedakan keduanya.`,
      },
      { t: "h", x: "Melihat port di Linux" },
      {
        t: "code",
        lang: "bash",
        x: `ss -tlnp                       # TCP yang LISTEN, tampilkan proses
> State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process
> LISTEN  0       128     0.0.0.0:22           0.0.0.0:*          users:(("sshd",pid=812,fd=3))
> LISTEN  0       4096    127.0.0.1:5432       0.0.0.0:*          users:(("postgres",pid=990,fd=6))

ss -tn state established       # hanya koneksi yang sudah terbentuk
cat /proc/sys/net/ipv4/ip_local_port_range
> 32768  60999`,
      },
      {
        t: "p",
        x: "Perhatikan kolom Local Address. 0.0.0.0:22 berarti SSH menerima koneksi di semua interface. 127.0.0.1:5432 berarti PostgreSQL hanya menerima koneksi dari mesin itu sendiri, jadi tidak bisa dijangkau dari jaringan walau portnya LISTEN.",
      },
      { t: "h", x: "Menguji port dari sisi client" },
      {
        t: "code",
        lang: "bash",
        x: `nc -vz 192.168.1.10 22          # cek apakah port 22 terbuka
curl -v telnet://192.168.1.10:22  # alternatif tanpa nc (Ctrl+C untuk keluar)`,
      },
      { t: "h", x: "TCP dan UDP" },
      {
        t: "table",
        head: ["Aspek", "TCP", "UDP"],
        rows: [
          ["Koneksi", "Ada, lewat handshake", "Tidak ada"],
          ["Jaminan pengiriman", "Ada: ACK, urutan, retransmisi", "Tidak ada"],
          ["Overhead header", "Minimal 20 byte", "8 byte"],
          ["Cocok untuk", "Web, SSH, email, transfer file", "DNS, suara dan video, game, DHCP"],
        ],
      },
      {
        t: "tip",
        x: "Router yang menjalankan NAT (PAT) juga mengubah port asal. Banyak perangkat di LAN bisa berbagi satu IP publik karena router membedakan koneksi mereka lewat nomor port yang berbeda.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut tiga rentang port dan contoh layanannya.",
          "Saya bisa menjelaskan 5-tuple dan mengapa dua tab browser tidak saling tertukar.",
          "Saya bisa membaca output ss dan membedakan 0.0.0.0 dari 127.0.0.1.",
        ],
      },
    ],
  },
  {
    title: "Cara membaca header IP dan TCP",
    blocks: [
      {
        t: "p",
        x: "Semua yang dibahas di bab sebelumnya tersimpan sebagai kolom-kolom di header. Memahami arti tiap kolom membuat output tcpdump dan tampilan Wireshark terbaca seperti kalimat biasa.",
      },
      { t: "h", x: "Header IPv4" },
      {
        t: "table",
        head: ["Kolom", "Ukuran", "Fungsi"],
        rows: [
          ["Version", "4 bit", "Versi IP (4)."],
          ["IHL", "4 bit", "Panjang header dalam satuan 4 byte (nilai 5 = 20 byte)."],
          ["DSCP / ECN", "8 bit", "Penandaan prioritas (QoS) dan notifikasi kemacetan."],
          ["Total Length", "16 bit", "Panjang seluruh paket, header ditambah data."],
          ["Identification, Flags, Fragment Offset", "32 bit", "Dipakai bila paket dipecah (fragmentasi)."],
          ["TTL", "8 bit", "Batas hop. Berkurang 1 di tiap router, paket dibuang jika mencapai 0."],
          ["Protocol", "8 bit", "Isi paket: 6 = TCP, 17 = UDP, 1 = ICMP."],
          ["Header Checksum", "16 bit", "Pemeriksaan kerusakan pada header."],
          ["Source / Destination Address", "32 bit + 32 bit", "Alamat IP asal dan tujuan."],
        ],
      },
      { t: "h", x: "Header TCP" },
      {
        t: "table",
        head: ["Kolom", "Ukuran", "Fungsi"],
        rows: [
          ["Source Port, Destination Port", "16 bit + 16 bit", "Port asal dan tujuan."],
          ["Sequence Number", "32 bit", "Nomor urut byte pertama pada segmen ini."],
          ["Acknowledgment Number", "32 bit", "Byte berikutnya yang diharapkan (valid jika flag ACK menyala)."],
          ["Data Offset", "4 bit", "Panjang header TCP dalam satuan 4 byte (5 = 20 byte)."],
          ["Flags", "8 bit", "CWR, ECE, URG, ACK, PSH, RST, SYN, FIN."],
          ["Window", "16 bit", "Receive window yang diumumkan (dikalikan window scale)."],
          ["Checksum", "16 bit", "Pemeriksaan kerusakan pada header dan data."],
          ["Urgent Pointer", "16 bit", "Jarang dipakai."],
          ["Options", "variabel", "MSS, window scale, SACK, timestamp."],
        ],
      },
      { t: "h", x: "Membaca satu baris tcpdump" },
      {
        t: "code",
        lang: "bash",
        x: `> IP 192.168.1.20.52344 > 203.0.113.10.80: Flags [S], seq 1000, win 64240, options [mss 1460,sackOK,TS val 11 ecr 0,nop,wscale 7], length 0`,
      },
      {
        t: "ul",
        items: [
          "192.168.1.20.52344 > 203.0.113.10.80: IP dan port asal (52344), menuju IP dan port tujuan (80). Port ditulis setelah titik terakhir.",
          "Flags [S]: ini paket SYN, awal handshake.",
          "seq 1000: nomor urut awal (ISN) milik pengirim.",
          "win 64240: window yang diumumkan (belum dikalikan wscale pada paket SYN).",
          "options [mss 1460, ..., wscale 7]: opsi yang ditawarkan. wscale 7 berarti window dikalikan 2^7 = 128 setelah handshake.",
          "length 0: tidak ada data aplikasi di paket ini.",
        ],
      },
      { t: "h", x: "Filter yang sering dipakai di Wireshark" },
      {
        t: "table",
        head: ["Tujuan", "Filter"],
        rows: [
          ["Semua trafik ke atau dari satu host", "ip.addr == 192.168.1.20"],
          ["Satu port TCP", "tcp.port == 443"],
          ["Hanya paket SYN awal (tanpa ACK)", "tcp.flags.syn == 1 && tcp.flags.ack == 0"],
          ["Paket RST", "tcp.flags.reset == 1"],
          ["Retransmisi", "tcp.analysis.retransmission"],
          ["Zero window", "tcp.analysis.zero_window"],
          ["Satu percakapan TCP saja", "tcp.stream eq 0"],
        ],
      },
      {
        t: "tip",
        x: "Wireshark secara default menampilkan nomor sequence relatif (dimulai dari 0) supaya mudah dibaca. Nilai aslinya tetap ada di bagian detail header, dan itu yang dicetak tcpdump jika kamu memakai opsi -S.",
      },
      {
        t: "warn",
        x: "TTL membantu menebak sistem operasi, misalnya awal 64 pada Linux dan 128 pada Windows, tetapi itu hanya perkiraan. Nilai yang kamu lihat di capture sudah berkurang oleh router yang dilewati, dan nilai awalnya bisa diubah pengguna.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut kolom penting di header IP dan TCP serta fungsinya.",
          "Saya bisa menguraikan satu baris tcpdump menjadi bagian-bagiannya.",
          "Saya bisa menulis filter untuk SYN, RST, dan retransmisi.",
        ],
      },
    ],
  },
  {
    title: "Praktik: Alur paket dari aplikasi ke kabel",
    blocks: [
      {
        t: "p",
        x: "Tujuan praktik ini: menangkap satu permintaan HTTP sederhana dan menunjuk bukti nyata tiap lapisan di dalamnya. Kita memakai web server kecil di mesin sendiri lewat interface loopback, jadi aman dan hasilnya bersih.",
      },
      { t: "h", x: "Langkah 1: jalankan server (Terminal A)" },
      {
        t: "code",
        lang: "bash",
        x: `mkdir -p ~/lab-tcp && cd ~/lab-tcp
echo "halo dari server lab" > index.html
python3 -m http.server 8000 --bind 127.0.0.1`,
      },
      { t: "h", x: "Langkah 2: mulai capture (Terminal B)" },
      {
        t: "code",
        lang: "bash",
        x: `sudo tcpdump -i lo -nn -S -w lab1.pcap port 8000
> tcpdump: listening on lo, link-type EN10MB (Ethernet), snapshot length 262144 bytes`,
      },
      {
        t: "p",
        x: "Opsi -nn mematikan penerjemahan nama dan nama port, -S menampilkan nomor sequence asli, dan -w menyimpan hasil ke file supaya bisa dibuka di Wireshark.",
      },
      { t: "h", x: "Langkah 3: buat satu permintaan (Terminal C)" },
      {
        t: "code",
        lang: "bash",
        x: `curl -s http://127.0.0.1:8000/
> halo dari server lab`,
      },
      { t: "h", x: "Langkah 4: hentikan capture dan baca hasilnya" },
      {
        t: "code",
        lang: "bash",
        x: `# tekan Ctrl+C di Terminal B, lalu:
sudo tcpdump -r lab1.pcap -nn -S
> 12:01:10.100001 IP 127.0.0.1.52344 > 127.0.0.1.8000: Flags [S], seq 3112233440, win 65495, options [mss 65495,sackOK,TS val 100 ecr 0,nop,wscale 7], length 0
> 12:01:10.100010 IP 127.0.0.1.8000 > 127.0.0.1.52344: Flags [S.], seq 2001002000, ack 3112233441, win 65483, options [mss 65495,sackOK,TS val 100 ecr 100,nop,wscale 7], length 0
> 12:01:10.100018 IP 127.0.0.1.52344 > 127.0.0.1.8000: Flags [.], ack 2001002001, win 512, length 0
> 12:01:10.100150 IP 127.0.0.1.52344 > 127.0.0.1.8000: Flags [P.], seq 3112233441:3112233556, ack 2001002001, length 115
> ...`,
      },
      {
        t: "p",
        x: "Angka di komputermu akan berbeda (port, waktu, dan nomor urut acak), tetapi polanya sama. Tiga baris pertama adalah handshake, lalu baris berflag P. membawa permintaan HTTP (panjang 115 byte pada contoh ini).",
      },
      { t: "h", x: "Langkah 5: lihat lapisan Data Link (opsional, interface asli)" },
      {
        t: "p",
        x: "Loopback tidak punya alamat MAC sungguhan. Untuk melihat header Ethernet, capture di interface asli sambil melakukan ping ke gateway. Cek nama interface dengan ip -br a.",
      },
      {
        t: "code",
        lang: "bash",
        x: `ip -br a                                   # cek nama interface, misalnya eth0
sudo tcpdump -i eth0 -e -nn -c 2 icmp      # Terminal B
ping -c 1 192.168.1.1                      # Terminal C
> 12:05:01.200001 aa:bb:cc:11:22:33 > 11:22:33:44:55:66, ethertype IPv4 (0x0800), length 98: 192.168.1.20 > 192.168.1.1: ICMP echo request, id 7, seq 1, length 64
> 12:05:01.200400 11:22:33:44:55:66 > aa:bb:cc:11:22:33, ethertype IPv4 (0x0800), length 98: 192.168.1.1 > 192.168.1.20: ICMP echo reply, id 7, seq 1, length 64`,
      },
      { t: "h", x: "Tugas: cocokkan bukti dengan lapisan" },
      {
        t: "table",
        head: ["Lapisan", "Bukti yang harus kamu tunjuk di capture"],
        rows: [
          ["Application", "Teks GET / HTTP/1.1 di dalam paket berflag P. (lihat dengan tcpdump -A atau Wireshark)"],
          ["Transport", "Port 52344 menuju 8000, flag, seq, ack, dan window"],
          ["Network", "Alamat IP asal dan tujuan, ICMP atau TCP sebagai isi paket"],
          ["Data Link", "Alamat MAC asal dan tujuan serta ethertype IPv4 (0x0800)"],
        ],
      },
      {
        t: "tip",
        x: "Buka lab1.pcap di Wireshark, klik kanan salah satu paket TCP, lalu pilih Follow > TCP Stream. Kamu akan melihat percakapan HTTP utuh, lengkap dengan permintaan dan jawabannya.",
      },
      {
        t: "warn",
        x: "Hentikan web server dengan Ctrl+C setelah selesai, dan hapus file .pcap yang tidak diperlukan lagi.",
      },
      {
        t: "check",
        items: [
          "Saya berhasil menangkap satu permintaan HTTP ke server lab dan menyimpannya ke file .pcap.",
          "Saya bisa menunjuk handshake, permintaan HTTP, dan ACK di dalam capture.",
          "Saya bisa menunjuk bukti tiap lapisan: port, IP, dan MAC.",
        ],
      },
    ],
  },
  {
    title: "Praktik: Three-way handshake",
    blocks: [
      {
        t: "p",
        x: "Di praktik ini kamu menyaring capture agar hanya menampilkan paket pembuka dan penutup koneksi, lalu sengaja menciptakan dua kegagalan: port tertutup (RST) dan paket dibuang (timeout).",
      },
      { t: "h", x: "Bagian 1: handshake normal dan penutupan" },
      {
        t: "code",
        lang: "bash",
        x: `# Terminal A: server
cd ~/lab-tcp && python3 -m http.server 8000 --bind 127.0.0.1

# Terminal B: tampilkan hanya SYN, FIN, dan RST
sudo tcpdump -i lo -nn 'tcp port 8000 and (tcp[tcpflags] & (tcp-syn|tcp-fin|tcp-rst) != 0)'

# Terminal C: satu permintaan
curl -s http://127.0.0.1:8000/ > /dev/null

# Hasil di Terminal B (contoh)
> IP 127.0.0.1.52400 > 127.0.0.1.8000: Flags [S], seq 11, win 65495, ...
> IP 127.0.0.1.8000 > 127.0.0.1.52400: Flags [S.], seq 22, ack 12, win 65483, ...
> IP 127.0.0.1.52400 > 127.0.0.1.8000: Flags [F.], seq 130, ack 300, ...
> IP 127.0.0.1.8000 > 127.0.0.1.52400: Flags [F.], seq 300, ack 131, ...`,
      },
      {
        t: "p",
        x: "Ingat notasi flag: S = SYN, titik (.) = ACK, jadi [S.] adalah SYN+ACK. Handshake dan penutupan terlihat jelas. ACK murni ([.]) tersaring karena tidak mengandung SYN, FIN, atau RST.",
      },
      { t: "h", x: "Bagian 2: port tertutup menghasilkan RST" },
      {
        t: "code",
        lang: "bash",
        x: `# Terminal B: capture semua paket ke port 9999 (tidak ada yang LISTEN di sana)
sudo tcpdump -i lo -nn 'tcp port 9999'

# Terminal C
curl --connect-timeout 5 http://127.0.0.1:9999/
> curl: (7) Failed to connect to 127.0.0.1 port 9999 after 0 ms: Couldn't connect to server

# Hasil di Terminal B (contoh)
> IP 127.0.0.1.52410 > 127.0.0.1.9999: Flags [S], seq 77, win 65495, ...
> IP 127.0.0.1.9999 > 127.0.0.1.52410: Flags [R.], seq 0, ack 78, win 0, length 0`,
      },
      {
        t: "p",
        x: "SYN langsung dibalas RST+ACK. Itulah arti connection refused: ada host yang menjawab, tetapi tidak ada proses yang mendengarkan di port itu.",
      },
      { t: "h", x: "Bagian 3: paket dibuang menghasilkan timeout" },
      {
        t: "p",
        x: "Pasang aturan firewall yang membuang (DROP) paket ke port 8000, lalu coba terhubung. Lakukan ini hanya di mesin lab milikmu.",
      },
      {
        t: "code",
        lang: "bash",
        x: `sudo iptables -I INPUT -i lo -p tcp --dport 8000 -j DROP

# Terminal B
sudo tcpdump -i lo -nn 'tcp port 8000'

# Terminal C
curl --connect-timeout 8 http://127.0.0.1:8000/
> curl: (28) Failed to connect to 127.0.0.1 port 8000 after 8001 ms: Timeout was reached

# Hasil di Terminal B (contoh): SYN yang sama dikirim ulang dengan jeda yang makin lebar
> 12:30:00.000 IP 127.0.0.1.52420 > 127.0.0.1.8000: Flags [S], seq 5, ...
> 12:30:01.000 IP 127.0.0.1.52420 > 127.0.0.1.8000: Flags [S], seq 5, ...
> 12:30:03.000 IP 127.0.0.1.52420 > 127.0.0.1.8000: Flags [S], seq 5, ...
> 12:30:07.000 IP 127.0.0.1.52420 > 127.0.0.1.8000: Flags [S], seq 5, ...

# Bersihkan aturan setelah selesai
sudo iptables -D INPUT -i lo -p tcp --dport 8000 -j DROP`,
      },
      {
        t: "p",
        x: "Tidak ada balasan sama sekali. Pengirim mengulang SYN dengan jeda 1, 2, 4 detik, dan seterusnya (exponential backoff). Inilah pola khas paket yang dibuang firewall atau hilang di jalan.",
      },
      { t: "h", x: "Melihat status koneksi dengan ss" },
      {
        t: "code",
        lang: "bash",
        x: `ss -tan | head
> State      Recv-Q  Send-Q  Local Address:Port   Peer Address:Port
> LISTEN     0       5       127.0.0.1:8000       0.0.0.0:*
> TIME-WAIT  0       0       127.0.0.1:8000       127.0.0.1:52400`,
      },
      {
        t: "table",
        head: ["Percobaan", "Pola di capture", "Pesan curl"],
        rows: [
          ["Port terbuka", "S, S., ., lalu data, lalu F.", "Berhasil"],
          ["Port tertutup", "S lalu R.", "Connection refused (7)"],
          ["Paket di-DROP", "S berulang tanpa balasan", "Timeout (28)"],
        ],
      },
      {
        t: "warn",
        x: "Pastikan aturan iptables sudah dihapus. Jika lupa, curl ke port 8000 di mesinmu akan terus timeout dan itu bisa membingungkan saat latihan berikutnya. Periksa dengan sudo iptables -L INPUT -n.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menangkap handshake dan penutupan koneksi dengan filter flag.",
          "Saya bisa memicu dan mengenali pola connection refused (RST).",
          "Saya bisa memicu dan mengenali pola timeout (SYN berulang).",
          "Saya sudah menghapus aturan firewall lab setelah selesai.",
        ],
      },
    ],
  },
  {
    title: "Praktik: Window",
    blocks: [
      {
        t: "p",
        x: "Di praktik ini kamu melihat window sebagai angka nyata: nilai window scale di handshake, cwnd dan RTT dari ss, efek latensi terhadap throughput, dan zero window yang sengaja dibuat.",
      },
      { t: "h", x: "Bagian 1: periksa pengaturan window di Linux" },
      {
        t: "code",
        lang: "bash",
        x: `sysctl net.ipv4.tcp_window_scaling
> net.ipv4.tcp_window_scaling = 1
sysctl net.ipv4.tcp_rmem
> net.ipv4.tcp_rmem = 4096 131072 6291456`,
      },
      {
        t: "p",
        x: "tcp_rmem berisi tiga angka: minimum, default, dan maksimum buffer terima (dalam byte). Angka sebenarnya berbeda antar distribusi dan versi kernel.",
      },
      { t: "h", x: "Bagian 2: lihat cwnd dan RTT dengan ss" },
      {
        t: "code",
        lang: "bash",
        x: `# Terminal A: server iperf3
iperf3 -s

# Terminal B: kirim data selama 10 detik
iperf3 -c 127.0.0.1 -t 10

# Terminal C: saat itu juga, lihat detail koneksi
ss -ti dst 127.0.0.1:5201
> ESTAB 0 0 127.0.0.1:41234 127.0.0.1:5201
>   cubic wscale:7,7 rto:204 rtt:0.05/0.01 mss:65483 cwnd:10 ... send 100Gbps ...`,
      },
      {
        t: "ul",
        items: [
          "wscale:7,7: faktor window scale kedua arah (dikalikan 2^7).",
          "rtt: rata-rata dan variasi RTT dalam milidetik.",
          "mss dan cwnd: ukuran segmen dan congestion window (dalam jumlah segmen).",
          "cubic: algoritma congestion control yang dipakai.",
        ],
      },
      { t: "h", x: "Bagian 3: tambahkan latensi dan lihat throughput turun" },
      {
        t: "p",
        x: "Dengan tc netem kita menambah delay buatan di loopback. Karena delay berlaku di setiap arah, RTT bertambah dua kali lipatnya. Bandingkan hasil iperf3 dengan rumus Window / RTT.",
      },
      {
        t: "code",
        lang: "bash",
        x: `# Tambahkan 50 ms per arah (RTT sekitar 100 ms)
sudo tc qdisc add dev lo root netem delay 50ms

# Window dibatasi kecil agar efeknya jelas
iperf3 -c 127.0.0.1 -t 10 -w 64K
iperf3 -c 127.0.0.1 -t 10 -w 1M

# WAJIB: hapus delay setelah selesai
sudo tc qdisc del dev lo root`,
      },
      {
        t: "table",
        head: ["Window", "RTT", "Perkiraan batas (rumus)"],
        rows: [
          ["64 KiB", "sekitar 100 ms", "sekitar 5 Mbps"],
          ["1 MiB", "sekitar 100 ms", "sekitar 80 Mbps"],
        ],
        caption: "Linux menggandakan nilai buffer yang diminta lewat -w, jadi hasil nyata bisa sedikit lebih tinggi dari rumus. Yang penting: window dua kali lipat, throughput ikut naik.",
      },
      { t: "h", x: "Bagian 4: ciptakan zero window" },
      {
        t: "p",
        x: "Kita membuat penerima yang menerima koneksi tetapi tidak pernah membaca data. Buffer-nya akan penuh, lalu penerima mengumumkan window 0.",
      },
      {
        t: "code",
        lang: "bash",
        x: `# Terminal A: penerima yang tidak membaca data selama 60 detik
python3 -c "import socket,time; s=socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); s.bind(('127.0.0.1', 9000)); s.listen(); c,_=s.accept(); time.sleep(60)"

# Terminal B: capture window yang diumumkan
sudo tcpdump -i lo -nn 'tcp port 9000'

# Terminal C: kirim data tanpa henti (hentikan dengan Ctrl+C)
yes | nc 127.0.0.1 9000

# Hasil di Terminal B (contoh), setelah buffer penerima penuh
> IP 127.0.0.1.9000 > 127.0.0.1.52500: Flags [.], ack 2800000, win 0, length 0
> IP 127.0.0.1.52500 > 127.0.0.1.9000: Flags [.], seq 2800000:2800001, ack 1, length 1`,
      },
      {
        t: "p",
        x: "Perhatikan win 0 dari penerima, lalu pengirim yang hanya mengirim probe berukuran 1 byte secara berkala. Di Wireshark, filter tcp.analysis.zero_window akan menandainya.",
      },
      {
        t: "tip",
        x: "Di dunia nyata, zero window berulang menandakan aplikasi penerima terlalu lambat memproses data (CPU penuh, disk lambat, atau aplikasi macet), bukan masalah jaringan. Capture membantumu menunjuk sisi mana yang bermasalah.",
      },
      {
        t: "warn",
        x: "Jangan lupa menjalankan sudo tc qdisc del dev lo root. Jika delay tertinggal, semua aplikasi lokal yang memakai loopback akan terasa lambat.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membaca wscale, rtt, dan cwnd dari output ss -ti.",
          "Saya bisa menunjukkan bahwa penambahan latensi menurunkan throughput sesuai rumus Window / RTT.",
          "Saya bisa menciptakan dan mengenali zero window di capture.",
          "Saya sudah menghapus delay tc netem setelah praktik.",
        ],
      },
    ],
  },
  {
    title: "Rangkuman dan latihan",
    blocks: [
      {
        t: "p",
        x: "Inti modul ini: data dibungkus bertingkat sebelum keluar ke kabel, koneksi TCP dibuka lewat handshake, kecepatannya diatur oleh window dan RTT, aplikasi dibedakan oleh port, dan semuanya bisa dibuktikan lewat header di capture paket.",
      },
      { t: "h", x: "Ringkasan konsep" },
      {
        t: "table",
        head: ["Konsep", "Yang harus diingat"],
        rows: [
          ["Enkapsulasi", "Data, segment, packet, frame, bit. MSS = MTU - 20 - 20 = 1460 byte."],
          ["Handshake", "SYN, SYN+ACK, ACK. ack = seq lawan + 1. Selesai = ESTABLISHED."],
          ["Penutupan", "FIN dari tiap arah, lalu TIME_WAIT. RST memutus seketika."],
          ["Window", "Throughput maksimum = Window / RTT. Window dibutuhkan = Bandwidth x RTT."],
          ["Port", "0 sampai 65.535. Koneksi unik oleh 5-tuple."],
          ["Header", "IP: TTL, protocol, alamat. TCP: port, seq, ack, flag, window."],
        ],
      },
      { t: "h", x: "Troubleshooting dari pola paket" },
      {
        t: "table",
        head: ["Gejala", "Pola di capture", "Arah pengecekan"],
        rows: [
          ["Timeout saat konek", "SYN berulang tanpa balasan", "Firewall, routing, host mati, ACL"],
          ["Connection refused", "SYN dibalas RST", "Service belum jalan, port salah, binding salah (127.0.0.1)"],
          ["Koneksi lambat padahal bandwidth besar", "Window kecil, RTT tinggi, atau retransmisi", "Window scaling, latensi, kualitas link"],
          ["Transfer macet berkala", "Zero window dari penerima", "Aplikasi atau server penerima kelebihan beban"],
          ["Banyak retransmisi dan duplicate ACK", "Paket hilang di jalan", "Kabel, Wi-Fi, port error, antrean router"],
        ],
      },
      { t: "h", x: "Latihan" },
      {
        t: "ol",
        items: [
          "Gambar three-way handshake jika ISN client = 7000 dan ISN server = 2500. Tuliskan seq dan ack di tiap langkah.",
          "Sebuah file 50.000 byte dikirim dengan MSS 1460. Berapa jumlah segmen yang dibutuhkan, dan berapa byte di segmen terakhir?",
          "Window 65.535 byte tanpa window scaling, RTT 80 ms. Berapa throughput maksimumnya dalam Mbps?",
          "Link 500 Mbps dengan RTT 30 ms. Berapa window minimum agar link terisi penuh?",
          "Server menjawab SYN dengan RST, sedangkan server lain tidak menjawab sama sekali. Jelaskan perbedaan penyebabnya dan apa yang kamu cek lebih dulu pada masing-masing.",
          "Ulangi praktik bab 7 dengan HTTP ke server lab, simpan capture, lalu beri anotasi: tandai handshake, permintaan, jawaban, dan penutupan, lengkap dengan seq dan ack-nya.",
          "Tulis filter Wireshark untuk menemukan semua retransmisi dari host 192.168.1.20 ke port 443.",
        ],
      },
      {
        t: "tip",
        x: "Kunci singkat. Nomor 1: SYN seq=7000; SYN+ACK seq=2500 ack=7001; ACK seq=7001 ack=2501. Nomor 2: 50.000 / 1460 = 34,2 sehingga 35 segmen, dan segmen terakhir 50.000 - (34 x 1460) = 360 byte. Nomor 3: 65.535 x 8 / 0,08 = sekitar 6,55 Mbps. Nomor 4: (500.000.000 / 8) x 0,03 = 1.875.000 byte, sekitar 1,9 MB. Nomor 7: ip.src == 192.168.1.20 && tcp.dstport == 443 && tcp.analysis.retransmission.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjelaskan alur data dari aplikasi ke kabel beserta header tiap lapisan.",
          "Saya bisa menggambar handshake dan membaca flag, seq, dan ack di capture.",
          "Saya bisa menghitung throughput dan window dari RTT dan bandwidth.",
          "Saya bisa menentukan penyebab masalah koneksi dari pola paket.",
        ],
      },
    ],
  },
];

export default chapters;