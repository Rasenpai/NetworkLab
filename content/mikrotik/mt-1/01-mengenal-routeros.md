---
title: Mengenal RouterOS
summary: Apa itu RouterOS dan cara mengaksesnya.
minutes: 10
---

RouterOS adalah sistem operasi router buatan MikroTik. Router bisa diakses lewat **Winbox**, **WebFig**, **SSH**, atau **terminal**.

![Router MikroTik RB951Ui-2HnD](https://commons.wikimedia.org/wiki/Special:FilePath/Mikrotik_RB951Ui-2HnD.jpg?width=640 "Router MikroTik RB951Ui-2HnD. Sumber: Wikimedia Commons")

## Cara akses

1. Hubungkan laptop ke `ether2`.
2. Buka Winbox, pilih router lewat tab **Neighbors**.
3. Login dengan user `admin`.

> Gunakan password yang kuat dan nonaktifkan user admin default setelah membuat user baru.

![Winbox menampilkan terminal RouterOS](https://commons.wikimedia.org/wiki/Special:FilePath/Winbox_displaying_RouterOS_shell.png?width=900 "Winbox dengan terminal RouterOS. Sumber: Wikimedia Commons")

## Perintah pertama

```routeros
/system identity set name=R-Core
/system resource print
```

## Perbandingan cara akses

| Cara    | Butuh IP | Cocok untuk        |
| ------- | -------- | ------------------ |
| Winbox  | Tidak    | Konfigurasi awal   |
| WebFig  | Ya       | Akses dari browser |
| SSH     | Ya       | Remote & scripting |