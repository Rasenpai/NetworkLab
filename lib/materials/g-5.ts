import type { Chapter } from "./types";
import { wikiImage } from "./media";

/**
 * g-5: Dokumentasi Jaringan: Topologi, IPAM & Penamaan. Diagram topologi,
 * rencana IP, standar penamaan perangkat, dan label kabel yang konsisten.
 * Jumlah bab harus sama dengan `lessons` modul (6).
 *
 * Konvensi blok kode shell (tampil seperti terminal):
 *   - baris biasa     -> perintah (diberi prompt $)
 *   - "> teks"        -> output perintah
 *   - "# teks"        -> catatan
 */

const TOPOLOGI_ASCII = `Bus        Star         Ring        Mesh
--+--+--   sw          o--o        o--o
  |  |    /|\\         |  |        |\\/|
  A  B   A B C        o--o        |/\\|
                                  o--o`;

const chapters: Chapter[] = [
  {
    title: "Pengantar dokumentasi jaringan",
    blocks: [
      {
        t: "p",
        x: "Jaringan yang berjalan baik tetapi tidak terdokumentasi adalah risiko. Saat terjadi gangguan jam dua pagi, teknisi yang tidak ingat jalur kabel, alamat IP, atau fungsi sebuah switch akan kehilangan waktu berharga. Dokumentasi yang rapi memangkas waktu mencari masalah, mempercepat orang baru belajar, dan mencegah kesalahan konfigurasi.",
      },
      { t: "h", x: "Tujuan belajar modul ini" },
      {
        t: "ul",
        items: [
          "Menyebutkan jenis dokumentasi jaringan dan fungsi masing-masing.",
          "Menggambar diagram topologi fisik dan logis yang mudah dibaca.",
          "Menyusun rencana IP (IPAM) yang rapi dan bisa diringkas.",
          "Membuat standar penamaan perangkat dan interface yang konsisten.",
          "Memberi label kabel dan patch panel yang cocok dengan dokumen.",
        ],
      },
      { t: "h", x: "Empat dokumen inti" },
      {
        t: "table",
        head: ["Dokumen", "Isi", "Menjawab pertanyaan"],
        rows: [
          ["Diagram topologi", "Perangkat dan hubungan antarperangkat", "Apa terhubung ke apa?"],
          ["Rencana IP (IPAM)", "Blok, subnet, VLAN, alamat tetap", "Alamat ini milik siapa dan untuk apa?"],
          ["Standar penamaan", "Aturan nama perangkat dan interface", "Apa nama perangkat ini dan di mana letaknya?"],
          ["Label kabel dan patch panel", "Penanda fisik di kabel dan port", "Kabel ini ujungnya ke mana?"],
        ],
        caption: "Keempatnya saling terhubung: nama di diagram, tabel IP, label fisik, dan konfigurasi perangkat harus sama.",
      },
      { t: "h", x: "Prinsip dokumentasi yang baik" },
      {
        t: "ul",
        items: [
          "Satu sumber kebenaran: tiap informasi dicatat di satu tempat saja, lainnya merujuk ke sana.",
          "As-built: dokumen menggambarkan kondisi sebenarnya, bukan rencana awal.",
          "Terbarui: setiap perubahan (change) diikuti pembaruan dokumen sebelum ticket ditutup.",
          "Berversi: simpan tanggal, penulis, dan riwayat perubahan.",
          "Mudah ditemukan: letakkan di wiki, repositori, atau folder bersama yang diketahui semua tim.",
          "Aman: dokumen berisi alamat dan topologi sehingga akses harus dibatasi.",
        ],
      },
      { t: "h", x: "Alat yang umum dipakai" },
      {
        t: "table",
        head: ["Kebutuhan", "Pilihan sederhana", "Pilihan lebih lengkap"],
        rows: [
          ["Diagram", "draw.io (diagrams.net), Visio", "Alat diagram yang terhubung ke inventori"],
          ["Rencana IP", "Spreadsheet (CSV/Excel)", "NetBox, phpIPAM"],
          ["Catatan dan prosedur", "Wiki atau folder bersama", "Repositori Git dengan Markdown"],
          ["Label fisik", "Label printer (P-touch/Brother)", "Pelabelan terintegrasi dengan inventori"],
        ],
      },
      {
        t: "warn",
        x: "Jangan menyimpan password, SNMP community, atau kunci pribadi di dokumen topologi atau spreadsheet IP. Pakai password manager atau vault terpisah, dan batasi akses dokumen jaringan hanya untuk tim yang berwenang.",
      },
      {
        t: "tip",
        x: "Mulailah kecil: satu diagram, satu tabel IP, dan satu aturan penamaan yang benar-benar dipakai lebih berguna daripada dokumen lengkap yang tidak pernah diperbarui.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut empat dokumen inti dan fungsinya.",
          "Saya paham prinsip satu sumber kebenaran dan dokumen as-built.",
          "Saya tahu informasi apa yang tidak boleh disimpan di dokumen jaringan.",
        ],
      },
    ],
  },
  {
    title: "Diagram topologi",
    blocks: [
      {
        t: "p",
        x: "Diagram topologi adalah peta jaringan. Diagram yang baik membuat orang yang belum pernah melihat jaringanmu bisa memahami jalurnya dalam beberapa menit. Diagram yang buruk (penuh garis bersilang, tanpa label) justru menyesatkan.",
      },
      wikiImage(
        "Diagram of different network topologies.svg",
        "Diagram berbagai topologi jaringan: bus, ring, star, mesh, dan tree",
        "Pola topologi dasar: bus, ring, star, mesh, dan tree",
        TOPOLOGI_ASCII,
      ),
      { t: "h", x: "Diagram fisik, Layer 2, dan Layer 3" },
      {
        t: "table",
        head: ["Jenis", "Yang digambar", "Dipakai untuk"],
        rows: [
          ["Fisik", "Lokasi rack, perangkat, kabel, dan port yang dipakai", "Perawatan, instalasi, pelacakan kabel"],
          ["Layer 2", "Switch, trunk, VLAN, dan STP", "Mencari loop, masalah VLAN"],
          ["Layer 3", "Router, subnet, gateway, dan routing", "Mencari masalah rute dan alamat"],
        ],
        caption: "Satu diagram yang menampung semuanya biasanya jadi padat. Lebih baik buat beberapa diagram dengan tingkat detail berbeda.",
      },
      { t: "h", x: "Aturan menggambar" },
      {
        t: "ol",
        items: [
          "Tentukan tujuan dan pembaca diagram (operator, manajemen, auditor).",
          "Letakkan internet dan perangkat batas di atas, lalu core, distribusi, akses, dan perangkat ujung ke bawah.",
          "Beri nama perangkat sesuai standar penamaan, bukan nama bebas.",
          "Tulis interface di kedua ujung link, misalnya Gi1/0/24 dan Gi0/1.",
          "Cantumkan VLAN, subnet, dan IP gateway pada diagram Layer 3.",
          "Gunakan simbol dan warna yang konsisten, serta sediakan legenda.",
          "Hindari garis bersilang; kelompokkan perangkat per lokasi atau fungsi.",
          "Cantumkan judul, versi, tanggal, dan nama pembuat di pojok diagram.",
        ],
      },
      { t: "h", x: "Contoh diagram Layer 3 sederhana" },
      {
        t: "code",
        lang: "text",
        x: `                      [ Internet ]
                           |
                  jkt-fw-edge-01  (203.0.113.2/30)
                           | 10.255.0.1/30
                  jkt-sw-core-01  (L3)
                  /               \\
       Gi1/0/1  /                   \\ Gi1/0/2
    jkt-sw-acc-01               jkt-sw-acc-02
    VLAN 30 staff               VLAN 20 server
    10.10.30.0/24               10.10.20.0/24
    gw 10.10.30.1               gw 10.10.20.1`,
      },
      {
        t: "p",
        x: "Pada contoh di atas, orang bisa langsung melihat urutan lapisan, nama perangkat, VLAN, subnet, dan gateway tanpa membuka konfigurasi.",
      },
      { t: "h", x: "Kapan diagram harus diperbarui" },
      {
        t: "ul",
        items: [
          "Menambah, mengganti, atau memindahkan perangkat.",
          "Menambah atau memutus link, termasuk perubahan trunk dan uplink.",
          "Menambah VLAN atau subnet baru.",
          "Setelah insiden yang menunjukkan diagram tidak sesuai kenyataan.",
        ],
      },
      {
        t: "warn",
        x: "Diagram yang menunjukkan seluruh jalur dan IP internal adalah peta bagi penyerang. Tandai diagram sebagai internal atau rahasia, dan jangan mengunggahnya ke layanan publik atau forum saat meminta bantuan tanpa menghapus informasi sensitif.",
      },
      {
        t: "tip",
        x: "Simpan diagram dalam format yang bisa diedit (mis. file .drawio) bersama hasil ekspor PNG atau PDF. Menyimpan hanya gambar membuatnya sulit diperbarui.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membedakan diagram fisik, Layer 2, dan Layer 3.",
          "Saya hafal delapan aturan menggambar diagram.",
          "Saya tahu kapan diagram harus diperbarui dan bagaimana menjaganya tetap aman.",
        ],
      },
    ],
  },
  {
    title: "Rencana IP",
    blocks: [
      {
        t: "p",
        x: "Rencana IP, atau IPAM (IP Address Management), mencatat blok alamat, subnet, VLAN, dan alamat tetap. Tanpa rencana, alamat sering bentrok, subnet tumpang tindih, dan rute tidak bisa diringkas.",
      },
      { t: "h", x: "Mulai dari hierarki" },
      {
        t: "p",
        x: "Alokasikan dari yang besar ke kecil: blok perusahaan, blok per lokasi, lalu subnet per fungsi. Dengan pola yang konsisten, alamat bisa ditebak dan rute tiap lokasi bisa diringkas menjadi satu prefix.",
      },
      {
        t: "code",
        lang: "text",
        x: `10.0.0.0/8        blok perusahaan
 |- 10.10.0.0/16  lokasi Jakarta   (ID lokasi = 10)
 |   |- 10.10.10.0/24  VLAN 10 mgmt
 |   |- 10.10.20.0/24  VLAN 20 server
 |   |- 10.10.30.0/24  VLAN 30 staff
 |   '- 10.10.40.0/24  VLAN 40 guest
 |- 10.20.0.0/16  lokasi Surabaya  (ID lokasi = 20)
 '- 10.255.0.0/24  link point-to-point antarrouter`,
      },
      {
        t: "p",
        x: "Pola 10.<ID lokasi>.<VLAN>.0/24 membuat jawaban cepat: alamat 10.10.30.57 pasti milik Jakarta (10), VLAN 30 (staff). Seluruh Jakarta dapat diringkas menjadi 10.10.0.0/16 untuk router lain. Satu /16 memuat 65.536 alamat, atau 256 subnet /24.",
      },
      { t: "h", x: "Konvensi isi tiap subnet" },
      {
        t: "table",
        head: ["Rentang pada /24", "Fungsi", "Catatan"],
        rows: [
          [".1", "Default gateway", "Konsisten di semua subnet"],
          [".2 - .4", "Gateway cadangan (HSRP/VRRP)", "Jika memakai redundansi"],
          [".5 - .20", "Infrastruktur dan perangkat statis", "Switch, AP, printer"],
          [".21 - .99", "Reservasi DHCP dan server", "Dicatat satu per satu"],
          [".100 - .250", "Pool DHCP", "Klien umum"],
          [".251 - .254", "Cadangan", "Jangan dipakai tanpa catatan"],
        ],
        caption: "Contoh konvensi; sesuaikan dengan kebutuhan, asalkan tertulis dan dipakai seragam.",
      },
      {
        t: "p",
        x: "Link point-to-point antarrouter diambil dari blok khusus, misalnya 10.255.0.0/24. Jika tiap link memakai /30 (4 alamat), blok ini memuat 256 / 4 = 64 link. Dengan /31 (2 alamat), memuat 256 / 2 = 128 link.",
      },
      { t: "h", x: "Contoh tabel IPAM" },
      {
        t: "table",
        head: ["Lokasi", "VLAN", "Nama", "Prefix", "Gateway", "Pemilik", "Keterangan"],
        rows: [
          ["JKT", "10", "mgmt", "10.10.10.0/24", "10.10.10.1", "NetOps", "Manajemen perangkat"],
          ["JKT", "20", "server", "10.10.20.0/24", "10.10.20.1", "SysOps", "Server internal"],
          ["JKT", "30", "staff", "10.10.30.0/24", "10.10.30.1", "NetOps", "DHCP .100 - .250"],
          ["JKT", "40", "guest", "10.10.40.0/24", "10.10.40.1", "NetOps", "Wi-Fi tamu, terisolasi"],
        ],
      },
      { t: "h", x: "Memantau penggunaan" },
      {
        t: "p",
        x: "Pool DHCP .100 sampai .250 berisi 250 - 100 + 1 = 151 alamat. Jika 120 lease aktif, pemakaiannya 120 / 151 = sekitar 79,5%. Banyak tim menetapkan peringatan pada 80% supaya pool diperbesar atau subnet dipecah sebelum penuh.",
      },
      { t: "h", x: "Memeriksa tumpang tindih dengan Python" },
      {
        t: "code",
        lang: "bash",
        x: `cat > ipam.csv <<'EOF'
site,vlan,name,prefix
JKT,10,mgmt,10.10.10.0/24
JKT,20,server,10.10.20.0/24
JKT,30,staff,10.10.30.0/24
JKT,40,guest,10.10.40.0/24
SBY,10,mgmt,10.20.10.0/24
SBY,30,staff,10.20.30.0/25
SBY,31,staff2,10.20.30.64/26
EOF
python3 - <<'EOF'
import csv, ipaddress as ip
rows = list(csv.DictReader(open('ipam.csv')))
nets = [(r['site'], r['vlan'], ip.ip_network(r['prefix'])) for r in rows]
for i, a in enumerate(nets):
    for b in nets[i+1:]:
        if a[2].overlaps(b[2]):
            print('OVERLAP', a[0], a[1], a[2], '<->', b[0], b[1], b[2])
print('selesai', len(nets))
EOF
> OVERLAP SBY 30 10.20.30.0/25 <-> SBY 31 10.20.30.64/26
> selesai 7`,
      },
      {
        t: "p",
        x: "10.20.30.0/25 mencakup .0 sampai .127, sedangkan 10.20.30.64/26 mencakup .64 sampai .127, sehingga tumpang tindih. Skrip kecil seperti ini bisa dijalankan sebelum perubahan IP disetujui.",
      },
      {
        t: "tip",
        x: "Spreadsheet cukup untuk jaringan kecil. Ketika jumlah subnet dan perubahan bertambah, pindah ke alat IPAM seperti NetBox atau phpIPAM yang punya riwayat perubahan, pencegahan tumpang tindih, dan API.",
      },
      {
        t: "check",
        items: [
          "Saya bisa merancang hierarki blok perusahaan, lokasi, dan VLAN yang bisa diringkas.",
          "Saya bisa menetapkan konvensi isi subnet dan menghitung pemakaian pool DHCP.",
          "Saya bisa memeriksa tumpang tindih subnet.",
        ],
      },
    ],
  },
  {
    title: "Standar penamaan perangkat",
    blocks: [
      {
        t: "p",
        x: "Nama yang konsisten membuat perangkat bisa dikenali dari namanya saja: di mana letaknya, apa fungsinya, dan yang keberapa. Nama dipakai di diagram, tabel IP, DNS, log, SNMP, dan label fisik, jadi satu kesalahan nama menyebar ke mana-mana.",
      },
      { t: "h", x: "Pola nama yang dianjurkan" },
      {
        t: "code",
        lang: "text",
        x: `<lokasi>-<peran>-<fungsi/lantai>-<nomor>

jkt-rtr-edge-01     router tepi Jakarta
jkt-sw-core-01      switch core Jakarta
jkt-sw-lt2-03       switch akses lantai 2, unit ke-3
sby-ap-lt1-12       access point lantai 1 Surabaya
jkt-fw-edge-01      firewall tepi Jakarta`,
      },
      {
        t: "table",
        head: ["Bagian", "Isi", "Contoh"],
        rows: [
          ["Lokasi", "Kode 3 huruf kota atau gedung", "jkt, sby, bdg"],
          ["Peran", "Jenis perangkat", "rtr (router), sw (switch), fw (firewall), ap (access point), srv (server)"],
          ["Fungsi/lantai", "Letak atau tugas", "core, dist, lt1, lt2, edge"],
          ["Nomor", "Dua digit berurutan", "01, 02, 03"],
        ],
      },
      { t: "h", x: "Aturan penulisan" },
      {
        t: "ul",
        items: [
          "Huruf kecil, angka, dan tanda hubung saja. Hindari spasi, garis bawah, dan karakter khusus.",
          "Jangan diawali atau diakhiri tanda hubung. Satu bagian nama (label DNS) maksimal 63 karakter, dan nama lengkap (FQDN) maksimal 253.",
          "Pendek tetapi jelas. Windows membatasi nama komputer 15 karakter (NetBIOS), jadi nama server Windows perlu dipertimbangkan khusus.",
          "Nama tidak boleh berisi informasi yang cepat berubah (nama orang, IP, atau model).",
          "Gunakan nomor dua digit agar urutan di daftar tetap rapi (01 sebelum 10).",
          "Nama perangkat sama di semua tempat: diagram, DNS, hostname, label, dan IPAM.",
        ],
      },
      { t: "h", x: "Memeriksa nama dengan regex" },
      {
        t: "code",
        lang: "bash",
        x: `python3 - <<'EOF'
import re
pat = re.compile(r'^(jkt|sby|bdg)-(rtr|sw|fw|ap|srv)-[a-z0-9]+-\\d{2}$')
for n in ['jkt-sw-core-01', 'JKT-SW-01', 'sby-ap-lt2-03', 'bdg_sw_core_01', 'jkt-rtr-edge-1']:
    print(n, bool(pat.match(n)))
EOF
> jkt-sw-core-01 True
> JKT-SW-01 False
> sby-ap-lt2-03 True
> bdg_sw_core_01 False
> jkt-rtr-edge-1 False`,
      },
      { t: "h", x: "Menerapkan nama di perangkat" },
      {
        t: "code",
        lang: "text",
        x: `Switch(config)# hostname jkt-sw-core-01
jkt-sw-core-01(config)# ip domain-name corp.example.com
jkt-sw-core-01(config)# interface gigabitEthernet 1/0/1
jkt-sw-core-01(config-if)# description to-jkt-sw-acc-01-Gi0/1
jkt-sw-core-01(config-if)# end`,
      },
      {
        t: "code",
        lang: "bash",
        x: `sudo hostnamectl set-hostname jkt-srv-app-01
hostnamectl --static
> jkt-srv-app-01`,
      },
      {
        t: "p",
        x: "Deskripsi interface memakai pola to-<nama perangkat lawan>-<port lawan>. Dengan itu perintah show interfaces description sudah menjadi peta link. Catatan untuk Linux: bila perubahan tidak bertahan setelah reboot di sistem tertentu, periksa juga /etc/hosts dan layanan cloud-init.",
      },
      {
        t: "warn",
        x: "Mengganti nama perangkat tanpa memperbarui DNS, monitoring, IPAM, diagram, dan label akan menciptakan data ganda yang bertentangan. Perlakukan penggantian nama sebagai perubahan yang tercatat dan sertakan daftar tempat yang perlu diperbarui.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyusun pola nama lokasi-peran-fungsi-nomor.",
          "Saya hafal aturan penulisan dan batas panjang nama.",
          "Saya bisa menerapkan hostname dan deskripsi interface sesuai standar.",
        ],
      },
    ],
  },
  {
    title: "Label kabel yang konsisten",
    blocks: [
      {
        t: "p",
        x: "Label kabel adalah dokumentasi yang bisa dilihat langsung di rack. Teknisi yang membutuhkan lima menit untuk menelusuri sebuah kabel secara fisik bisa menyelesaikannya dalam lima detik jika labelnya benar dan sama dengan dokumen. Standar industri yang membahas ini adalah TIA-606 (administrasi infrastruktur telekomunikasi).",
      },
      wikiImage(
        "Servers in a Rack.jpg",
        "Rack dengan perangkat dan kabel yang tertata",
        "Rack yang rapi: kabel yang berlabel mempermudah penelusuran",
      ),
      { t: "h", x: "Apa yang dilabeli" },
      {
        t: "table",
        head: ["Objek", "Isi label", "Contoh"],
        rows: [
          ["Rack", "Lokasi dan nomor rack", "JKT-R01"],
          ["Perangkat", "Hostname", "jkt-sw-core-01"],
          ["Port patch panel", "ID panel dan nomor port", "PP01-24"],
          ["Kabel (kedua ujung)", "Ujung sendiri dan ujung lawan", "PP01-24 / SW01-Gi1/0/24"],
          ["Outlet dinding", "Ruang dan nomor outlet", "LT2-A07"],
        ],
      },
      { t: "h", x: "Aturan label yang baik" },
      {
        t: "ol",
        items: [
          "Label di kedua ujung kabel, di dekat konektor (sekitar beberapa sentimeter) supaya terbaca tanpa menarik kabel.",
          "Gunakan label dari printer (flag atau wrap-around), bukan tulisan tangan atau selotip yang luntur.",
          "Cetak dengan huruf yang jelas dan tahan lama; hindari label yang mudah lepas oleh panas atau kelembapan.",
          "Gunakan format yang sama di seluruh instalasi: awalan, nomor tetap, dan urutan.",
          "Pastikan isi label cocok dengan dokumen: tabel patch panel, IPAM, dan diagram.",
          "Beri warna kabel atau pengikat untuk fungsi (mis. uplink, server, manajemen) hanya bila aturannya tertulis dan dipakai seragam.",
          "Catat label kabel baru dan kabel yang dilepas pada ticket perubahan.",
        ],
      },
      { t: "h", x: "Contoh format ID kabel" },
      {
        t: "code",
        lang: "text",
        x: `<panel>-<port>   pada sisi patch panel      PP01-24
<perangkat>-<port> pada sisi switch          SW01-Gi1/0/24

Label di ujung patch panel :  PP01-24  >  SW01-Gi1/0/24
Label di ujung switch      :  SW01-Gi1/0/24  >  PP01-24`,
      },
      {
        t: "p",
        x: "Dengan format ini, siapa pun yang memegang satu ujung langsung tahu ujung lainnya ke mana. Tabel di dokumen berisi pasangan yang sama dalam satu baris.",
      },
      { t: "h", x: "Contoh tabel patch panel" },
      {
        t: "table",
        head: ["Port panel", "Outlet", "Port switch", "VLAN", "Perangkat di ujung"],
        rows: [
          ["PP01-01", "LT2-A01", "SW01-Gi1/0/01", "30", "PC staf 01"],
          ["PP01-02", "LT2-A02", "SW01-Gi1/0/02", "30", "PC staf 02"],
          ["PP01-03", "LT2-A03", "SW01-Gi1/0/03", "40", "AP tamu lantai 2"],
          ["PP01-24", "LT2-C12", "SW01-Gi1/0/24", "20", "Printer jaringan"],
        ],
      },
      {
        t: "p",
        x: "Penghitungan kebutuhan label: patch panel 24 port yang seluruhnya terpakai butuh 24 label di panel dan 24 label di sisi switch, ditambah label pada outlet dinding, sehingga minimal 24 x 3 = 72 label per panel, belum termasuk label kabel kedua ujung bila kabel diberi ID tersendiri.",
      },
      {
        t: "warn",
        x: "Label yang salah lebih berbahaya daripada tanpa label, karena orang akan percaya dan mencabut kabel yang salah. Setelah memindahkan kabel, perbarui label dan dokumen pada saat yang sama, lalu uji dengan melihat link dan MAC address di port.",
      },
      {
        t: "tip",
        x: "Biasakan memeriksa pelabelan sebelum mencabut: cocokkan tiga hal (label fisik, tabel patch panel, dan deskripsi interface di switch). Bila ketiganya tidak sama, hentikan dan selidiki dulu.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut objek yang perlu dilabeli dan isi labelnya.",
          "Saya hafal aturan label yang baik dan format dua ujung.",
          "Saya bisa mencocokkan label fisik dengan tabel patch panel dan deskripsi interface.",
        ],
      },
    ],
  },
  {
    title: "Rangkuman dan latihan dokumentasi",
    blocks: [
      { t: "h", x: "Rangkuman" },
      {
        t: "table",
        head: ["Topik", "Intisari"],
        rows: [
          ["Prinsip", "Satu sumber kebenaran, as-built, terbarui, berversi, mudah ditemukan, dan aman."],
          ["Diagram", "Pisahkan fisik, Layer 2, dan Layer 3. Beri nama, interface, VLAN, subnet, legenda, dan versi. Simpan file sumbernya."],
          ["IPAM", "Hierarki perusahaan, lokasi, VLAN. Konvensi isi subnet. Pantau pemakaian dan periksa tumpang tindih."],
          ["Penamaan", "lokasi-peran-fungsi-nomor, huruf kecil, tanda hubung, konsisten di diagram, DNS, hostname, dan label."],
          ["Label kabel", "Kedua ujung, dekat konektor, format seragam, cocok dengan dokumen."],
        ],
      },
      { t: "h", x: "Soal latihan" },
      {
        t: "ol",
        items: [
          "Rancang pola IP 10.<lokasi>.<VLAN>.0/24 untuk lokasi Bandung (ID 30) dengan VLAN 10 (mgmt), 20 (server), 30 (staff). Tuliskan ketiga prefix dan ringkasan seluruh lokasi.",
          "Pool DHCP .50 sampai .200 pada sebuah /24 punya 95 lease aktif. Berapa total alamat pool dan persentase pemakaiannya?",
          "Dari nama JKT-SW-01, bdg_sw_core_01, dan bdg-sw-core-01, mana yang mengikuti standar di modul ini, dan apa kesalahan dua lainnya?",
          "Blok 10.255.0.0/24 dipakai untuk link point-to-point /30. Berapa link yang bisa ditampung? Berapa jika memakai /31?",
          "Port switch sw01 Gi1/0/12 terhubung ke patch panel PP02-12. Tulis label di kedua ujung dan deskripsi interface yang cocok.",
          "Mengapa menyimpan diagram hanya sebagai gambar PNG merepotkan?",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) 10.30.10.0/24, 10.30.20.0/24, 10.30.30.0/24; ringkasan 10.30.0.0/16. (2) 200 - 50 + 1 = 151 alamat; 95 / 151 = sekitar 62,9%. (3) hanya bdg-sw-core-01 yang sesuai; JKT-SW-01 memakai huruf besar dan tidak punya bagian fungsi/lantai, bdg_sw_core_01 memakai garis bawah. (4) /30: 256 / 4 = 64 link; /31: 256 / 2 = 128 link. (5) Label di panel: PP02-12 > SW01-Gi1/0/12; label di switch: SW01-Gi1/0/12 > PP02-12; deskripsi interface contoh: description to-PP02-12. (6) PNG tidak bisa diedit sehingga setiap pembaruan harus menggambar ulang, dan kecil kemungkinan tetap dijaga terbaru.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjawab semua soal tanpa melihat kunci.",
          "Saya sudah membuat satu diagram, satu tabel IPAM, dan satu aturan penamaan untuk jaringan latihan.",
          "Saya siap melanjutkan ke modul berikutnya.",
        ],
      },
    ],
  },
];

export default chapters;