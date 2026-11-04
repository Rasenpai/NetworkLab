// Modul tambahan & jalur belajar Network Engineer dan NOC.
// Modul lama (mt-*, cs-*) tetap di data.ts dan hanya direferensikan lewat id.

import type { Level, Vendor } from "@/lib/data";

export type PathVendor = Vendor | "Umum";

export type PathModule = {
  id: string;
  title: string;
  vendor: PathVendor;
  level: Level;
  lessons: number;
  minutes: number;
  description: string;
};

const m = (
  id: string,
  vendor: PathVendor,
  level: Level,
  title: string,
  lessons: number,
  minutes: number,
  description: string,
): PathModule => ({ id, vendor, level, title, lessons, minutes, description });

export const pathModules: PathModule[] = [
  /* ----- Umum: fondasi & keterampilan network engineer ----- */
  m("g-1", "Umum", "Beginner", "Dasar Komputer & Linux CLI", 8, 150, "Sistem operasi, file system, perintah dasar Linux, SSH, dan editor teks untuk administrasi perangkat."),
  m("g-2", "Umum", "Beginner", "TCP/IP Mendalam: ARP, ICMP, TCP & UDP", 10, 200, "Alur paket dari aplikasi ke kabel, three-way handshake, window, port, dan cara membaca header."),
  m("g-3", "Umum", "Beginner", "Layanan Jaringan: DNS, DHCP, HTTP & NTP", 9, 180, "Cara kerja layanan inti jaringan dan gejala yang muncul saat salah satunya bermasalah."),
  m("g-4", "Umum", "Beginner", "Kabel, Fiber Optik & Infrastruktur Fisik", 8, 150, "UTP, crimping, tes kabel, fiber SM/MM, konektor, redaman, rack, dan kelistrikan perangkat."),
  m("g-5", "Umum", "Beginner", "Dokumentasi Jaringan: Topologi, IPAM & Penamaan", 6, 120, "Diagram topologi, rencana IP, standar penamaan perangkat, dan label kabel yang konsisten."),
  m("g-6", "Umum", "Intermediate", "Wireshark & Analisis Paket", 10, 210, "Capture, display filter, follow stream, dan mengenali retransmisi, reset, serta masalah DNS dari paket."),
  m("g-7", "Umum", "Intermediate", "Metodologi Troubleshooting Jaringan", 8, 170, "Pendekatan per lapisan OSI, bottom-up dan divide-and-conquer, serta mencatat hasil tiap langkah."),
  m("g-8", "Umum", "Intermediate", "IPv6 Praktis", 8, 170, "Pengalamatan, SLAAC, DHCPv6, neighbor discovery, dan dual-stack di router dan switch."),
  m("g-9", "Umum", "Intermediate", "Wi-Fi: RF, Site Survey & Desain Wireless", 9, 200, "Band 2,4/5/6 GHz, channel planning, interferensi, kapasitas AP, dan tools site survey."),
  m("g-10", "Umum", "Intermediate", "Lab Virtual: Proxmox, EVE-NG & GNS3", 7, 150, "Membangun lab sendiri untuk latihan konfigurasi dan menguji perubahan sebelum ke produksi."),
  m("g-11", "Umum", "Intermediate", "Linux Server untuk Jaringan: DNS, RADIUS & Syslog", 10, 220, "Memasang BIND/Unbound, FreeRADIUS, dan server syslog di Linux serta mengamankannya."),
  m("g-12", "Umum", "Intermediate", "Dasar Keamanan Jaringan", 9, 190, "Prinsip CIA, jenis serangan umum, hardening perangkat, AAA, dan manajemen kredensial."),
  m("g-13", "Umum", "Intermediate", "VoIP & SIP Dasar", 7, 150, "Alur panggilan SIP/RTP, kebutuhan QoS untuk suara, dan troubleshooting kualitas panggilan."),
  m("g-14", "Umum", "Advanced", "Firewall Modern, IDS/IPS & Segmentasi", 10, 240, "Stateful firewall, zona keamanan, IDS/IPS, proxy, dan segmentasi berbasis prinsip least privilege."),
  m("g-15", "Umum", "Advanced", "Python untuk Network Automation", 12, 270, "Netmiko, NAPALM, parsing output dengan TextFSM, dan membuat script audit konfigurasi."),
  m("g-16", "Umum", "Advanced", "Git & Ansible untuk Jaringan", 9, 210, "Version control konfigurasi, inventory, playbook, dan rollout perubahan ke banyak perangkat."),
  m("g-17", "Umum", "Advanced", "Load Balancer & Reverse Proxy", 8, 180, "Nginx dan HAProxy, health check, algoritma balancing, dan TLS termination."),
  m("g-18", "Umum", "Advanced", "Cloud Networking: VPC, VPN & Peering", 10, 230, "Konsep VPC, subnet, route table, security group, dan konektivitas hybrid ke jaringan on-premise."),
  m("g-19", "Umum", "Advanced", "SD-WAN & Overlay Network", 7, 160, "Konsep underlay dan overlay, pemilihan jalur berbasis aplikasi, dan manajemen terpusat."),
  m("g-20", "Umum", "Advanced", "Data Center: Spine-Leaf, VXLAN & EVPN", 10, 240, "Desain spine-leaf, VXLAN, BGP EVPN, dan pola multi-tenant di data center."),
  m("g-21", "Umum", "Advanced", "MPLS & L3VPN", 10, 240, "Label switching, LDP, VRF, dan layanan L3VPN yang dipakai penyedia layanan."),
  m("g-22", "Umum", "Advanced", "Desain Jaringan: Redundansi & Capacity Planning", 9, 210, "Menentukan single point of failure, oversubscription, dan proyeksi kapasitas link."),
  m("g-23", "Umum", "Intermediate", "Backup Konfigurasi & Disaster Recovery", 7, 150, "Backup terjadwal, penyimpanan terpusat, prosedur restore, dan uji pemulihan berkala."),
  m("g-24", "Umum", "Advanced", "Capstone: Rancang & Deploy Jaringan Enterprise", 12, 360, "Proyek end-to-end: desain, konfigurasi multi-vendor, monitoring, dokumentasi, dan presentasi hasil."),

  /* ----- Umum: khusus operasional NOC ----- */
  m("n-1", "Umum", "Beginner", "Peran NOC: Shift, Tier L1-L3 & Alur Kerja", 6, 120, "Tugas tiap tier, pembagian shift, alur tiket dari alert sampai penutupan, dan etika kerja 24×7."),
  m("n-2", "Umum", "Beginner", "Ticketing, Prioritas & SLA", 7, 140, "Membuat tiket yang lengkap, menentukan severity dan prioritas, serta menghitung SLA dan waktu respons."),
  m("n-3", "Umum", "Beginner", "Incident Management & Dasar ITIL", 8, 160, "Siklus incident, problem, dan change dalam ITIL 4 serta bedanya di lapangan."),
  m("n-4", "Umum", "Intermediate", "Monitoring dengan Zabbix & LibreNMS", 10, 220, "Menambah host, template, trigger, auto-discovery, dan peta jaringan."),
  m("n-5", "Umum", "Intermediate", "SNMP, Syslog & NetFlow untuk Monitoring", 9, 190, "SNMPv2c/v3, MIB dan OID, pengiriman syslog, dan analisis trafik dengan NetFlow."),
  m("n-6", "Umum", "Intermediate", "Grafana, Dashboard & Alert Tuning", 8, 170, "Dashboard untuk NOC, threshold yang masuk akal, dan mengurangi alert yang tidak perlu."),
  m("n-7", "Umum", "Intermediate", "Runbook, Playbook & Eskalasi", 6, 130, "Menulis runbook per jenis insiden, kriteria eskalasi, dan daftar kontak vendor serta ISP."),
  m("n-8", "Umum", "Beginner", "Komunikasi Insiden: Handover, RFO & Laporan", 6, 120, "Format handover antar shift, update ke pelanggan, dan menulis Reason for Outage yang jelas."),
  m("n-9", "Umum", "Intermediate", "Change Management & Maintenance Window", 7, 150, "Rencana perubahan, rollback plan, komunikasi jadwal, dan verifikasi pasca-perubahan."),
  m("n-10", "Umum", "Intermediate", "Troubleshooting Last-Mile: FTTH, PPPoE & Wireless P2P", 9, 200, "Redaman fiber, ONT/OLT dasar, sesi PPPoE putus, dan link wireless point-to-point."),
  m("n-11", "Umum", "Advanced", "Root Cause Analysis & Post-Incident Review", 7, 150, "5 Whys, timeline insiden, faktor kontribusi, dan menyusun tindakan pencegahan."),
  m("n-12", "Umum", "Advanced", "Capstone: Simulasi NOC 24×7", 10, 300, "Simulasi insiden berurutan: deteksi, triase, eskalasi, perbaikan, dan laporan RFO."),
  m("n-13", "Umum", "Advanced", "Keamanan Operasional: DDoS, Abuse & Incident Response", 8, 190, "Mengenali serangan volumetrik, mitigasi dasar, menangani laporan abuse, dan prosedur respons."),
  m("n-14", "Umum", "Advanced", "Transport & Backbone: DWDM, Metro-E & Redundansi Link", 9, 210, "Dasar transport optik, ring dan protection switching, serta membaca alarm perangkat transport."),

  /* ----- MikroTik tambahan ----- */
  m("mx-1", "MikroTik", "Intermediate", "Bridge, VLAN & Switching di RouterOS", 8, 180, "Bridge VLAN filtering, trunk dan access, RSTP, bonding, dan hardware offload."),
  m("mx-2", "MikroTik", "Intermediate", "Wireless & CAPsMAN", 8, 180, "Konfigurasi AP, security profile, CAPsMAN controller, dan roaming antar AP."),
  m("mx-3", "MikroTik", "Intermediate", "Monitoring MikroTik: The Dude, SNMP & Traffic-Flow", 7, 150, "Memantau router lewat The Dude, SNMP, graphing, dan ekspor Traffic-Flow."),
  m("mx-4", "MikroTik", "Advanced", "Scripting & Automasi RouterOS", 10, 230, "Variabel, loop, scheduler, netwatch, backup otomatis, dan REST API di RouterOS v7."),
  m("mx-5", "MikroTik", "Advanced", "ISP dengan MikroTik: PPPoE, RADIUS & Skala Besar", 10, 240, "PPPoE server, RADIUS, profile per paket, dan tuning untuk ribuan pelanggan."),
  m("mx-6", "MikroTik", "Advanced", "MPLS, VPLS & Tunnel di RouterOS", 8, 200, "LDP, VPLS, EoIP, dan kapan memakai tiap jenis tunnel."),

  /* ----- Cisco tambahan ----- */
  m("cx-1", "Cisco", "Intermediate", "FHRP: HSRP, VRRP & GLBP", 7, 150, "Redundansi default gateway, preempt, tracking interface, dan verifikasi failover."),
  m("cx-2", "Cisco", "Intermediate", "EIGRP & Redistribusi Route", 9, 200, "Metrik EIGRP, feasible successor, summarization, dan redistribusi antar protokol."),
  m("cx-3", "Cisco", "Advanced", "OSPF Multi-Area & Route Filtering", 10, 230, "Tipe area, LSA, ABR/ASBR, summarization, prefix-list, dan route-map."),
  m("cx-4", "Cisco", "Advanced", "QoS Cisco: MQC, Shaping & Policing", 9, 210, "Klasifikasi, marking DSCP, LLQ, CBWFQ, shaping, dan policing."),
  m("cx-5", "Cisco", "Advanced", "Cisco Wireless: WLC & Catalyst 9800", 9, 210, "Join AP, WLAN dan profile, roaming, dan troubleshooting client di controller."),
  m("cx-6", "Cisco", "Intermediate", "Manajemen Perangkat: Upgrade IOS-XE, Lisensi & Backup", 7, 150, "Prosedur upgrade aman, verifikasi image, lisensi, dan backup otomatis."),
  m("cx-7", "Cisco", "Advanced", "Otomasi Cisco: NETCONF, RESTCONF & EEM", 9, 210, "Model data YANG, NETCONF dan RESTCONF, serta automasi lokal dengan EEM."),
];

/* ---------- Jalur belajar ---------- */

export type PathStage = {
  id: string;
  title: string;
  level: Level;
  goal: string;
  outcome: string;
  certs?: string[];
  items: string[]; // id dari courses (data.ts) atau pathModules
};

export type PathTrack = {
  id: "network-engineer" | "noc";
  title: string;
  role: string;
  description: string;
  stages: PathStage[];
};

export const learningTracks: PathTrack[] = [
  {
    id: "network-engineer",
    title: "Network Engineer",
    role: "Merancang, membangun, dan memelihara jaringan",
    description:
      "Dari fondasi TCP/IP sampai desain, otomasi, dan infrastruktur modern. Kombinasi MikroTik dan Cisco supaya siap bekerja di jaringan campuran.",
    stages: [
      {
        id: "ne-1",
        title: "Fondasi Jaringan",
        level: "Beginner",
        goal: "Paham bagaimana data bergerak dari aplikasi sampai kabel dan mampu membagi alamat IP.",
        outcome: "Bisa menjelaskan alur paket, menghitung subnet, memakai Linux CLI untuk tes koneksi, dan membuat dokumentasi dasar.",
        certs: ["CompTIA Network+"],
        items: ["g-1", "cs-1", "g-2", "g-3", "cs-2", "g-4", "g-5"],
      },
      {
        id: "ne-2",
        title: "Router & Switch Dasar",
        level: "Intermediate",
        goal: "Mengonfigurasi router dan switch pertama di MikroTik dan Cisco.",
        outcome: "Bisa membangun LAN lengkap dengan DHCP, DNS, VLAN, dan inter-VLAN routing, lalu memverifikasinya.",
        certs: ["MTCNA", "Cisco CCNA"],
        items: ["mt-1", "mt-2", "cs-3", "cs-4", "mx-1", "g-10"],
      },
      {
        id: "ne-3",
        title: "Routing, NAT & Firewall",
        level: "Intermediate",
        goal: "Menghubungkan banyak segmen jaringan dan mengamankannya.",
        outcome: "Bisa menerapkan OSPF dan EIGRP dasar, NAT, firewall filter, queue, dan redundansi gateway.",
        certs: ["Cisco CCNA"],
        items: ["cs-5", "cs-6", "mt-3", "mt-4", "mt-5", "cx-1", "cx-2", "g-8", "g-12"],
      },
      {
        id: "ne-4",
        title: "Troubleshooting & Visibilitas",
        level: "Intermediate",
        goal: "Menemukan akar masalah dengan cepat dan memastikan konfigurasi selalu aman.",
        outcome: "Bisa menelusuri masalah per lapisan, membaca paket di Wireshark, mendesain Wi-Fi, dan memulihkan perangkat dari backup.",
        certs: ["MTCWE"],
        items: ["g-7", "g-6", "g-9", "mx-2", "mx-3", "cx-6", "g-11", "g-23"],
      },
      {
        id: "ne-5",
        title: "Routing Lanjut & VPN",
        level: "Advanced",
        goal: "Mengelola jaringan multi-site dengan routing dinamis dan VPN.",
        outcome: "Bisa mendesain OSPF multi-area, BGP dasar, VPN site-to-site, QoS, dan failover dual ISP.",
        certs: ["MTCRE", "MTCSE", "Cisco CCNP ENCOR"],
        items: ["mt-6", "cs-8", "cx-3", "mt-7", "mt-8", "cs-7", "cx-4"],
      },
      {
        id: "ne-6",
        title: "Keamanan & Desain Jaringan",
        level: "Advanced",
        goal: "Mendesain jaringan yang aman, redundan, dan siap tumbuh.",
        outcome: "Bisa membuat desain dengan segmentasi, redundansi, dan proyeksi kapasitas, serta mengelola wireless enterprise dan layanan load balancing.",
        items: ["g-14", "g-17", "g-22", "cx-5", "g-13", "g-21"],
      },
      {
        id: "ne-7",
        title: "Otomasi & Infrastruktur Modern",
        level: "Advanced",
        goal: "Mengurangi kerja manual dan memahami infrastruktur cloud dan data center.",
        outcome: "Bisa membuat script dan playbook untuk perubahan massal, serta memahami VXLAN/EVPN, SD-WAN, dan konektivitas cloud.",
        items: ["g-15", "g-16", "mx-4", "cx-7", "g-18", "g-19", "g-20", "mx-6"],
      },
      {
        id: "ne-8",
        title: "Capstone",
        level: "Advanced",
        goal: "Menyatukan semua keterampilan dalam satu proyek nyata.",
        outcome: "Punya portofolio berisi topologi, konfigurasi, hasil uji, dan dokumentasi jaringan enterprise.",
        items: ["g-24"],
      },
    ],
  },
  {
    id: "noc",
    title: "NOC Engineer",
    role: "Memantau, menangani insiden, dan menjaga uptime jaringan 24×7",
    description:
      "Dari operator Level 1 sampai Level 3: monitoring, troubleshooting, eskalasi, komunikasi insiden, dan root cause analysis.",
    stages: [
      {
        id: "noc-1",
        title: "Fondasi untuk NOC",
        level: "Beginner",
        goal: "Menguasai dasar jaringan yang selalu muncul di alert dan tiket.",
        outcome: "Bisa membaca topologi, memahami alur paket, dan memakai Linux CLI untuk tes ping, traceroute, dan DNS.",
        certs: ["CompTIA Network+"],
        items: ["g-1", "cs-1", "g-2", "g-3", "cs-2", "g-4"],
      },
      {
        id: "noc-2",
        title: "Dasar Operasional NOC",
        level: "Beginner",
        goal: "Memahami cara kerja NOC dan standar penanganan tiket.",
        outcome: "Bisa menangani tiket Level 1, menentukan prioritas, menulis handover shift, dan melaporkan insiden dengan jelas.",
        certs: ["ITIL 4 Foundation"],
        items: ["n-1", "n-2", "n-3", "n-8", "g-5"],
      },
      {
        id: "noc-3",
        title: "Mengenal Perangkat yang Dimonitor",
        level: "Beginner",
        goal: "Tahu apa yang dilihat saat mengecek router dan switch.",
        outcome: "Bisa login ke perangkat, membaca status interface, tabel routing, VLAN, dan log tanpa mengubah konfigurasi.",
        certs: ["MTCNA"],
        items: ["mt-1", "mt-2", "cs-3", "cs-4"],
      },
      {
        id: "noc-4",
        title: "Monitoring & Alerting",
        level: "Intermediate",
        goal: "Membangun dan memelihara sistem monitoring.",
        outcome: "Bisa menambah perangkat ke Zabbix atau LibreNMS, membuat dashboard, menyetel threshold, dan menulis runbook.",
        certs: ["Zabbix Certified User"],
        items: ["n-4", "n-5", "n-6", "mx-3", "n-7", "g-11"],
      },
      {
        id: "noc-5",
        title: "Troubleshooting Level 2",
        level: "Intermediate",
        goal: "Menemukan akar masalah, bukan hanya gejalanya.",
        outcome: "Bisa menelusuri masalah per lapisan, membaca paket, menangani gangguan last-mile, dan menjalankan perubahan terencana.",
        items: ["g-7", "g-6", "cs-5", "cs-6", "mt-3", "g-8", "g-9", "n-10", "n-9", "g-23"],
      },
      {
        id: "noc-6",
        title: "Routing, ISP & Transport (Level 3)",
        level: "Advanced",
        goal: "Menangani insiden di level backbone dan routing.",
        outcome: "Bisa menganalisis masalah OSPF dan BGP, failover gateway, layanan PPPoE skala besar, dan alarm perangkat transport.",
        certs: ["MTCRE", "MTCINE", "Cisco CCNP ENCOR"],
        items: ["mt-6", "cs-8", "cx-2", "cx-3", "cx-1", "mt-8", "mx-5", "mt-7", "n-14"],
      },
      {
        id: "noc-7",
        title: "Keamanan Operasional & RCA",
        level: "Advanced",
        goal: "Menangani serangan dan mencegah insiden berulang.",
        outcome: "Bisa merespons DDoS atau laporan abuse, menyusun timeline insiden, dan menulis tindakan pencegahan.",
        items: ["g-12", "cs-7", "n-13", "n-11"],
      },
      {
        id: "noc-8",
        title: "Otomasi & Capstone NOC",
        level: "Advanced",
        goal: "Mengotomatiskan pekerjaan berulang dan membuktikan kesiapan.",
        outcome: "Bisa membuat script pengecekan rutin dan menyelesaikan simulasi NOC 24×7 dari deteksi sampai laporan RFO.",
        items: ["g-15", "mx-4", "n-12"],
      },
    ],
  },
];