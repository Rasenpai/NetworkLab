import type { Chapter } from "./types";

const chapters: Chapter[] = [
  {
    title: "Pengantar: Mengapa Network Engineer Perlu Linux",
    blocks: [
      {
        t: "p",
        x: "Sebagian besar server layanan jaringan (DNS, DHCP, RADIUS, syslog, monitoring) berjalan di Linux. Banyak perangkat jaringan juga punya CLI yang mirip shell Linux. Menguasai CLI membuat kamu bisa mengelola perangkat dari jauh, bekerja cepat tanpa GUI, dan mengotomatiskan tugas berulang.",
      },
      { t: "h", x: "Tujuan belajar modul ini" },
      {
        t: "ul",
        items: [
          "Berpindah dan mengelola file lewat terminal.",
          "Memahami izin akses, user, dan group.",
          "Memeriksa proses, service, dan log.",
          "Menguji konektivitas jaringan dari CLI.",
          "Login ke perangkat lewat SSH dengan aman.",
        ],
      },
      {
        t: "tip",
        x: "Siapkan tempat latihan: VM Ubuntu Server (VirtualBox atau Proxmox), WSL2 di Windows, atau VPS kecil. Semua perintah di modul ini aman dicoba di sana.",
      },
      {
        t: "check",
        items: [
          "Saya punya mesin Linux untuk latihan.",
          "Saya bisa membuka terminal dan melihat prompt shell.",
        ],
      },
    ],
  },
  {
    title: "Struktur File System & Navigasi",
    blocks: [
      {
        t: "p",
        x: "Linux memakai satu pohon direktori yang berawal dari / (root). Tidak ada drive C: atau D:. Perangkat penyimpanan tambahan di-mount ke dalam pohon yang sama.",
      },
      {
        t: "ul",
        items: [
          "/etc : file konfigurasi sistem dan layanan.",
          "/var/log : log sistem dan aplikasi.",
          "/home : direktori pribadi tiap user.",
          "/usr : program dan library.",
          "/tmp : file sementara, bisa terhapus saat reboot.",
        ],
      },
      { t: "h", x: "Perintah navigasi" },
      {
        t: "code",
        lang: "bash",
        x: `pwd            # tampilkan lokasi saat ini
ls -la         # daftar file lengkap, termasuk file tersembunyi
cd /etc        # pindah ke direktori absolut
cd ..          # naik satu level
cd ~           # ke home directory
cd -           # kembali ke direktori sebelumnya`,
      },
      {
        t: "tip",
        x: "Tekan Tab untuk melengkapi nama file otomatis, dan panah atas untuk mengulang perintah sebelumnya. Dua kebiasaan ini menghemat banyak waktu.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjelaskan beda path absolut dan relatif.",
          "Saya tahu di mana file konfigurasi dan log berada.",
        ],
      },
    ],
  },
  {
    title: "Mengelola File & Direktori",
    blocks: [
      {
        t: "code",
        lang: "bash",
        x: `mkdir -p lab/jaringan          # buat direktori bertingkat
touch lab/jaringan/catatan.txt
cp catatan.txt catatan.bak     # salin
mv catatan.bak arsip/          # pindah atau ganti nama
rm catatan.txt                 # hapus file`,
      },
      { t: "h", x: "Membaca isi file" },
      {
        t: "code",
        lang: "bash",
        x: `cat /etc/hostname                # tampilkan seluruh isi
less /var/log/syslog             # baca per halaman (q untuk keluar)
head -n 20 file.log              # 20 baris pertama
tail -n 50 file.log              # 50 baris terakhir
tail -f /var/log/syslog          # ikuti log secara live
grep -n "error" file.log         # cari teks, tampilkan nomor baris
grep -i "fail" file.log | wc -l  # hitung baris yang cocok`,
      },
      {
        t: "warn",
        x: "rm tidak punya tempat sampah. Periksa dulu dengan ls sebelum menghapus, dan jangan menjalankan rm -rf dengan path yang belum kamu pastikan, terutama sebagai root.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membuat, menyalin, memindah, dan menghapus file.",
          "Saya bisa mencari kata tertentu di file log dengan grep.",
        ],
      },
    ],
  },
  {
    title: "Izin Akses, User & Group",
    blocks: [
      {
        t: "p",
        x: "Setiap file punya pemilik (user), group, dan tiga set izin: untuk pemilik, group, dan lainnya. Tiap set berisi r (baca), w (tulis), x (eksekusi).",
      },
      {
        t: "code",
        lang: "bash",
        x: `ls -l config.conf
# -rw-r----- 1 budi netops 1204 Nov 1 10:00 config.conf
#  rw-       -> pemilik (budi): baca dan tulis
#     r--    -> group (netops): baca
#        --- -> lainnya: tidak ada akses`,
      },
      {
        t: "ul",
        items: [
          "Angka: r = 4, w = 2, x = 1. Jadi rw- = 6, r-- = 4, --- = 0.",
          "chmod 640 file memberi rw- untuk pemilik, r-- untuk group, dan --- untuk lainnya.",
          "chown budi:netops file mengganti pemilik dan group.",
        ],
      },
      {
        t: "code",
        lang: "bash",
        x: `id                              # siapa saya, group apa saja
sudo systemctl restart ssh      # jalankan perintah sebagai root
sudo adduser rina               # buat user baru
sudo usermod -aG netops rina    # tambahkan ke group`,
      },
      {
        t: "tip",
        x: "Prinsip least privilege: beri izin sekecil mungkin. File berisi password atau kunci sebaiknya 600 atau 640, bukan 777.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membaca output ls -l dan menjelaskan artinya.",
          "Saya tahu kapan memakai chmod, chown, dan sudo.",
        ],
      },
    ],
  },
  {
    title: "Proses, Service & Log",
    blocks: [
      {
        t: "p",
        x: "Layanan seperti SSH, DNS, atau DHCP berjalan sebagai service yang dikelola systemd. Saat ada masalah, urutan dasarnya: cek apakah service hidup, lihat lognya, lalu cek proses dan resource.",
      },
      {
        t: "code",
        lang: "bash",
        x: `systemctl status ssh           # status service
sudo systemctl restart ssh     # restart
sudo systemctl enable ssh      # hidup otomatis saat boot
journalctl -u ssh -n 50        # 50 baris log terakhir service ssh
journalctl -u ssh -f           # ikuti log live

ps aux | grep sshd             # cari proses
top                            # pantau CPU dan memori (q untuk keluar)
df -h                          # sisa disk
free -h                        # memori`,
      },
      {
        t: "warn",
        x: "Disk penuh adalah penyebab klasik service berhenti tanpa pesan yang jelas. Biasakan cek df -h lebih dulu, terutama partisi tempat /var/log berada.",
      },
      {
        t: "check",
        items: [
          "Saya bisa memeriksa status dan log sebuah service.",
          "Saya bisa mengecek penggunaan CPU, memori, dan disk.",
        ],
      },
    ],
  },
  {
    title: "Tes Jaringan dari CLI",
    blocks: [
      {
        t: "p",
        x: "Perintah berikut adalah alat utama saat troubleshooting. Gunakan berurutan dari lapisan bawah: interface, gateway, internet, lalu DNS dan aplikasi.",
      },
      {
        t: "code",
        lang: "bash",
        x: `ip a                          # alamat IP tiap interface
ip route                      # tabel routing, cek default gateway
ping -c 4 192.168.1.1         # tes gateway
ping -c 4 8.8.8.8             # tes internet tanpa DNS
ping -c 4 google.com          # tes DNS dan internet
traceroute 8.8.8.8            # lihat hop menuju tujuan
ss -tulpn                     # port yang sedang listen dan prosesnya
dig google.com                # query DNS
curl -I https://example.com   # cek header HTTP`,
      },
      { t: "h", x: "Cara membaca hasilnya" },
      {
        t: "ol",
        items: [
          "Ping gateway gagal: masalah lokal (kabel, VLAN, IP, atau gateway).",
          "Ping gateway berhasil tetapi 8.8.8.8 gagal: masalah routing atau ISP.",
          "Ping 8.8.8.8 berhasil tetapi nama domain gagal: masalah DNS.",
          "Semua berhasil tetapi aplikasi gagal: cek port dengan ss dan firewall.",
        ],
      },
      {
        t: "check",
        items: [
          "Saya bisa menentukan letak masalah dengan urutan ping gateway, IP publik, lalu domain.",
          "Saya bisa melihat port yang terbuka di server.",
        ],
      },
    ],
  },
  {
    title: "SSH: Remote Login yang Aman",
    blocks: [
      {
        t: "p",
        x: "SSH adalah cara standar mengelola server dan perangkat jaringan dari jauh. Trafiknya terenkripsi. Untuk keamanan lebih baik, pakai kunci (key) daripada password.",
      },
      {
        t: "code",
        lang: "bash",
        x: `ssh budi@192.168.1.10                    # login biasa
ssh -p 2222 budi@192.168.1.10            # port non-standar

ssh-keygen -t ed25519 -C "laptop-budi"   # buat pasangan kunci
ssh-copy-id budi@192.168.1.10            # pasang kunci publik di server

scp config.txt budi@192.168.1.10:/tmp/   # salin file ke server`,
      },
      { t: "h", x: "File ~/.ssh/config untuk mempersingkat" },
      {
        t: "code",
        lang: "text",
        x: `Host core-sw
    HostName 192.168.1.10
    User budi
    Port 22
    IdentityFile ~/.ssh/id_ed25519`,
      },
      {
        t: "p",
        x: "Setelah itu cukup ketik: ssh core-sw",
      },
      {
        t: "warn",
        x: "Jangan pernah membagikan private key (file tanpa akhiran .pub). Nonaktifkan login password di server hanya setelah kamu memastikan login dengan key berhasil, supaya tidak terkunci dari luar.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membuat key SSH dan memasangnya di server.",
          "Saya bisa menyalin file dengan scp.",
        ],
      },
    ],
  },
  {
    title: "Editor Teks, Rangkuman & Latihan",
    blocks: [
      {
        t: "p",
        x: "Mengedit konfigurasi di server biasanya lewat nano (mudah) atau vim (cepat jika sudah terbiasa).",
      },
      {
        t: "ul",
        items: [
          "nano file: edit langsung, Ctrl+O simpan, Ctrl+X keluar.",
          "vim file: tekan i untuk mengetik, Esc untuk berhenti mengetik.",
          "Di vim: :wq simpan dan keluar, :q! keluar tanpa menyimpan.",
        ],
      },
      { t: "h", x: "Latihan akhir" },
      {
        t: "ol",
        items: [
          "Buat direktori lab/dns dan file catatan.txt berisi hasil perintah ip a.",
          "Cari baris yang mengandung kata error di /var/log/syslog dan simpan ke file baru.",
          "Atur izin catatan.txt menjadi 640.",
          "Cek status service ssh dan lihat 20 baris log terakhirnya.",
          "Lakukan tes berurutan: gateway, 8.8.8.8, lalu google.com, dan catat hasilnya.",
          "Buat key SSH, pasang ke server latihan, lalu login memakai alias di ~/.ssh/config.",
        ],
      },
      {
        t: "check",
        items: [
          "Saya bisa bernavigasi dan mengelola file tanpa GUI.",
          "Saya bisa memeriksa service, log, dan konektivitas jaringan.",
          "Saya bisa login ke server memakai SSH key.",
        ],
      },
    ],
  },
];

export default chapters;