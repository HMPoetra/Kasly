# 📘 BUKU PANDUAN PENGGUNA RESMI (OFFICIAL GUIDE BOOK)
## 🏛️ HOARIZON • KASLY — Class Cashflow & Smart Wallet Management System

> **Versi Dokumen:** 1.0 (Agustus 2026)  
> **Pengembang:** Hoarizon Dev • Hak Cipta © 2026 **Suami Marie**  
> **Target Pengguna:** Ketua Kelas, Bendahara, Wali Kelas, dan Seluruh Anggota Kelas

---

## 📑 DAFTAR ISI

1. [BAB 1: Pendahuluan & Gambaran Umum](#bab-1-pendahuluan--gambaran-umum)
2. [BAB 2: Peran Pengguna & Hak Akses (Roles & Permissions)](#bab-2-peran-pengguna--hak-akses)
3. [BAB 3: Panduan Masuk Akun & Personalisasi Profil](#bab-3-panduan-masuk-akun--personalisasi-profil)
4. [BAB 4: Panduan Dashboard Keuangan](#bab-4-panduan-dashboard-keuangan)
5. [BAB 5: Panduan Buku Kas & Arus Kas (Cashflow)](#bab-5-panduan-buku-kas--arus-kas-cashflow)
6. [BAB 6: Panduan Iuran Bulanan 4 Minggu & Pembayaran](#bab-6-panduan-iuran-bulanan-4-minggu)
7. [BAB 7: Panduan Status Pembayaran & Pengingat Tagihan](#bab-7-panduan-status-pembayaran--pengingat)
8. [BAB 8: Panduan Program Target Tabungan (Savings Target)](#bab-8-panduan-program-target-tabungan)
9. [BAB 9: Panduan Manajemen Bukti & Nota Digital (Evidence)](#bab-9-panduan-manajemen-bukti--nota)
10. [BAB 10: Panduan Laporan Keuangan & Audit Log](#bab-10-panduan-laporan-keuangan--audit-log)
11. [BAB 11: Sistem Notifikasi Interaktif](#bab-11-sistem-notifikasi-interaktif)
12. [BAB 12: Panduan Tampilan Responsif (Mobile vs Desktop)](#bab-12-panduan-tampilan-responsif)
13. [BAB 13: FAQ & Solusi Masalah Umum (Troubleshooting)](#bab-13-faq--solusi-masalah-umum)

---

## 🏛️ BAB 1: Pendahuluan & Gambaran Umum

**KASLY** adalah aplikasi berbasis web yang diciptakan untuk menyelesaikan kendala pembukuan kas kelas konvensional (buku tulis manual yang rentan hilang, rusak, atau sulit diaudit). Dengan sistem digital terpusat:
- **Transparansi Penuh**: Seluruh siswa dan wali kelas dapat melihat arus kas masuk dan keluar secara terbuka.
- **Akuntabilitas**: Setiap rupiah yang dibelanjakan wajib disertai foto kuitansi/nota digital.
- **Otomatisasi Laporan**: Rekapitulasi kas bulanan, status lunas, dan ekspor CSV/PDF dapat dilakukan dengan 1 klik.

---

## 🛡️ BAB 2: Peran Pengguna & Hak Akses

Sistem Kasly membagi hak akses ke dalam 5 tingkatan peran (*Role-Based Access Control*):

| Peran Jabatan | Kode Sistem | Hak Akses & Tanggung Jawab Utama |
|---|---|---|
| **👑 Ketua Kelas** | `CLASS_LEADER` | Akses penuh superadmin: mengelola semua transaksi, memverifikasi setoran iuran/target, mengatur peran anggota, dan melihat log audit. |
| **💰 Bendahara 1 & 2** | `TREASURER_1` & `TREASURER_2` | Mencatat kas masuk/keluar, memverifikasi bukti transfer iuran, mengelola target tabungan, dan mencetak laporan keuangan. |
| **✍️ Sekretaris 1 & 2** | `SECRETARY_1` & `SECRETARY_2` | Membantu pencatatan notulensi kas, mengunggah bukti nota, dan memantau kehadiran data. |
| **🎓 Wali Kelas** | `HOMEROOM_TEACHER` | Akses pengawasan (*Auditor/Read-Only*): memantau saldo kas aktif, memeriksa nota belanja, dan memantau siswa penunggak iuran. |
| **👥 Anggota Siswa** | `CLASS_MEMBER` | Mengajukan pembayaran iuran kas mingguan, menyetor dana target tabungan, memeriksa status lunas pribadi, dan melihat transparansi saldo kas. |

---

## 🔑 BAB 3: Panduan Masuk Akun & Personalisasi Profil

### 1. Cara Masuk ke Aplikasi (Login)
1. Buka alamat website Kasly pada peramban (*browser*) Anda (misal: `https://kasly-app.vercel.app` atau `localhost:3000`).
2. Masukkan **Nama Lengkap / Username** Anda sesuai yang terdaftar di kelas (contoh: `Marie Allycia Renaldine`).
3. Masukkan **Kata Sandi (Password)** Anda. Klik ikon mata (👁️) di sebelah kanan jika ingin memeriksa ketikan sandi.
4. Klik tombol **`👛 Masuk ke Dompet Kas Kelas`**.

### 2. Mengubah Tema Tampilan (Mode Gelap & Terang)
Kasly menyediakan 2 cara mudah untuk mengganti tema:
- **Pintasan 1-Klik**: Klik tombol **Matahari (☀️) / Bulan (🌙)** di bar atas sebelah lonceng notifikasi.
- **Menu Profil**: Klik foto avatar di pojok kanan atas ➡️ pilih segmen **Terang**, **Gelap**, atau **Sistem**.

### 3. Cara Keluar dari Sesi Akun (Logout)
1. Klik **Avatar Profil** di pojok kanan atas.
2. Klik tombol merah **`🚪 Keluar dari Akun`**.
3. Sistem akan memunculkan pop-up dialog konfirmasi: klik **`Ya, Keluar Akun`** untuk mengakhiri sesi login secara aman.

---

## 📊 BAB 4: Panduan Dashboard Keuangan

Halaman **Dashboard** (`/dashboard`) adalah pusat komando keuangan kelas:

1. **🏛️ Header Sambutan**: Menyapa nama Anda sesuai peran jabatan (*Ketua Kelas / Bendahara / Anggota*).
2. **💰 Master Wallet Balance Card (Kartu Saldo Utama)**:
   - Menampilkan total saldo kas aktif yang tersedia di kas kelas secara *Live Sinkron*.
   - Menyajikan subtotal kas masuk dan kas keluar terakumulasi.
3. **⚡ Pintasan Fitur Cepat (6 Quick Actions)**:
   - Tombol navigasi instan ke Buku Kas, Iuran Bulanan, Status Pembayaran, Target Tabungan, Bukti Nota, dan Laporan.
4. **📈 4 Pilar Metrik Finansial**:
   - **Total Kas Masuk**: Akumulasi seluruh pemasukan uang kas.
   - **Total Kas Keluar**: Akumulasi realisasi belanja dan pengeluaran.
   - **Target Tabungan**: Capaian dana tabungan kelas vs target nominal.
   - **Kelunasan Iuran**: Jumlah siswa lunas dari total seluruh siswa bulan berjalan.
5. **📋 Dua Kolom Informasi Aktif**:
   - Kolom Kiri: Daftar 5 mutasi kas masuk/keluar terbaru (*Recent Transactions*).
   - Kolom Kanan: Daftar program target tabungan yang sedang berjalan beserta sisa hari (*Days Remaining*).

---

## 💸 BAB 5: Panduan Buku Kas & Arus Kas (Cashflow)

Halaman **Buku Kas** (`/finance/cashflow`) digunakan untuk memantau dan mencatat seluruh perputaran uang kas.

### 1. Mencatat Kas Masuk (Pemasukan)
1. Klik tombol hijau **`+ Catat Pemasukan`**.
2. Isi formulir yang muncul:
   - **Kategori**: Pilih `Iuran Kas`, `Donasi / Sumbangan`, `Penjualan Merchandise`, dsb.
   - **Nominal**: Masukkan jumlah rupiah (contoh: `50.000`).
   - **Metode Pembayaran**: Pilih `CASH (Tunai)`, `SPAY (ShopeePay)`, `BCA`, `SEABANK`, atau `GOPAY`.
   - **Tanggal Transaksi**: Tentukan tanggal penerimaan uang.
   - **Keterangan**: Tambahkan catatan pendukung (opsional).
3. Klik **`Simpan Transaksi`**.

### 2. Mencatat Kas Keluar (Pengeluaran & Nota)
1. Klik tombol merah **`+ Catat Pengeluaran`**.
2. Isi formulir:
   - **Kategori**: Pilih `Operasional Kelas`, `Belanja ATK / Spidol`, `Konsumsi Acara`, `Kebersihan`, dsb.
   - **Nominal**: Masukkan nominal belanja.
   - **Unggah Bukti Nota**: Unggah file foto/struk belanja (format JPG/PNG).
3. Klik **`Simpan Pengeluaran`**. Saldo kas kelas akan otomatis berkurang secara akurat.

### 3. Memfilter Transaksi Multi-Periode
Gunakan bilah filter di bagian atas tabel:
- **Semua Periode**: Menampilkan seluruh riwayat transaksi dari awal pembukuan.
- **📅 Per Hari**: Pilih tanggal spesifik untuk melihat mutasi di hari tersebut.
- **🗓️ Per Bulan**: Navigasi ke bulan dan tahun tertentu.
- **📊 Per Tahun**: Melihat mutasi tahunan.

### 4. Mengekspor Buku Kas ke File CSV
Klik tombol **`📥 Export CSV`** di pojok kanan atas untuk mengunduh rekap mutasi kas lengkap yang siap dibuka di Microsoft Excel atau Google Sheets.

---

## 📋 BAB 6: Panduan Iuran Bulanan 4 Minggu

Halaman **Iuran Kas Bulanan** (`/contributions`) menyajikan matriks pembayaran per minggu (Minggu 1 s/d Minggu 4) untuk setiap siswa.

### 1. Memilih Bulan (Navigasi Multi-Bulan)
Gunakan komponen **MonthPicker** di kanan atas:
- Klik tombol panah **`◀`** untuk mundur ke bulan sebelumnya.
- Klik tombol panah **`▶`** untuk maju ke bulan berikutnya.
- Atau pilih langsung nama bulan dan tahun dari dropdown.

### 2. Alur Siswa: Mengajukan Pembayaran Iuran Pribadi
1. Klik tombol biru **`+ Ajukan Pembayaran Saya`**.
2. Pilih **Minggu Iuran** yang ingin dibayar (Minggu 1, 2, 3, atau 4).
3. Masukkan nominal iuran (standar iuran kelas: Rp25.000 / minggu).
4. Pilih **Metode Pembayaran** (misal: Transfer ShopeePay / Tunai).
5. Unggah foto **Bukti Transfer / Struk**.
6. Klik **`Kirim Pengajuan`**.
7. Status iuran Anda pada minggu tersebut akan berubah menjadi **`⏳ PENDING`** menunggu persetujuan pengurus.

### 3. Alur Pengurus: Memverifikasi Setoran Siswa
1. Pengajuan baru akan muncul pada banner atas **"Pengajuan Pembayaran Menunggu Konfirmasi"** dan lonceng notifikasi.
2. Klik tombol **`🔍 Tinjau`** pada pengajuan siswa yang bersangkutan.
3. Periksa foto bukti transfer dan nominal yang disetor:
   - Jika valid: Klik tombol hijau **`✓ Setujui Pembayaran (LUNAS)`**. Status siswa seketika berubah menjadi **`✅ LUNAS`** dan saldo kas kelas bertambah otomatis.
   - Jika bukti palsu/nominal kurang: Klik tombol merah **`✗ Tolak Pengajuan`** dan berikan alasan penolakan.

---

## 💳 BAB 7: Panduan Status Pembayaran & Pengingat

Halaman **Status Pembayaran** (`/contributions/status`) berfungsi untuk mengawasi kepatuhan kelunasan iuran kas kelas.

### 1. Membaca Status Kelunasan
- **✅ Lunas**: Siswa telah membayar penuh iuran 4 minggu (Total Rp100.000/bulan).
- **⏳ Belum Lunas**: Siswa masih memiliki sisa tunggakan iuran.
- **Progress Bar**: Menunjukkan persentase pembayaran (e.g. `25% = 1/4 mgg`, `50% = 2/4 mgg`, `100% = 4/4 mgg`).

### 2. Mengirim Notifikasi Pengingat Tagihan (1-Klik Reminder)
- **Pengingat Perorangan**: Klik tombol **`📲 Ingatkan`** di baris siswa yang belum lunas. Pesan notifikasi pengingat otomatis masuk ke akun siswa tersebut.
- **Pengingat Massal (*Batch Reminder*)**: Klik tombol **`📢 Tagih Otomatis`** di kanan atas untuk mengirimkan notifikasi penagihan secara serentak ke seluruh siswa yang belum tuntas bayar iuran.

---

## 🎯 BAB 8: Panduan Program Target Tabungan (Savings Target)

Halaman **Target Tabungan** (`/savings/targets`) digunakan untuk pengumpulan dana kegiatan khusus kelas (misal: Study Tour, Jaket Angkatan, Kas Sosial).

### 1. Membuat Program Tabungan Baru (Pengurus)
1. Klik tombol **`+ Buat Target Baru`**.
2. Masukkan **Nama Program** (contoh: `Jaket Kelas Hoarizon 2026`) dan deskripsi kegiatan.
3. Masukkan **Target Nominal Total** (contoh: `Rp5.000.000`).
4. Tentukan **Tenggat Waktu (*Target Date*)**.
5. Pilih **Visibilitas**:
   - `🌐 Publik`: Terbuka untuk seluruh siswa di kelas.
   - `🔒 Private`: Hanya diikuti oleh siswa-siswa tertentu yang dipilih.
6. Pilih **Skema Iuran**:
   - `⚖️ Bagi Rata (Equal Split)`: Total target dibagi rata otomatis ke seluruh peserta.
   - `📌 Nominal Tetap (Fixed Amount)`: Setiap peserta menyetor nominal patokan yang sama.
   - `🌱 Seikhlasnya (Voluntary)`: Peserta bebas menyetor nominal berapa saja.
7. Klik **`Simpan Program Tabungan`**.

### 2. Menyetor Iuran Target Tabungan
1. Temukan kartu program tabungan yang ingin disetor ➡️ klik tombol **`💸 Setor Iuran`**.
2. Masukkan nominal setoran dan lampirkan bukti transfer.
3. Pengurus akan memverifikasi setoran, dan bilah progres (*Progress Bar*) program tabungan akan otomatis meningkat hingga 100%.

---

## 📎 BAB 9: Panduan Manajemen Bukti & Nota Digital (Evidence)

Halaman **Bukti & Nota** (`/evidence`) adalah arsip digital seluruh kuitansi belanja:

1. Setiap pengeluaran belanja kas yang diinput oleh Bendahara otomatis terarsip di galeri nota.
2. Klik tombol **`👁️ Lihat Nota`** pada struk untuk membuka tampilan *Full Resolution Preview Modal*.
3. Setiap nota dilengkapi data tanggal belanja, nominal rupiah, pencatat (PIC), dan kategori barang.

---

## 📈 BAB 10: Panduan Laporan Keuangan & Audit Log

### 1. Halaman Laporan Finansial (`/finance/reports`)
- Menampilkan grafik komparasi kas masuk vs kas keluar.
- Menyajikan rasio efisiensi keuangan kelas dan laba/rugi bersih (*Net Cashflow*).
- Tombol **Cetak Laporan PDF** dan **Ekspor CSV** untuk diserahkan kepada Wali Kelas atau Kepala Sekolah saat evaluasi akhir semester.

### 2. Halaman Log Audit Aktivitas (`/audit`)
- Mencatat seluruh jejak digital sistem: *Siapa yang menambah transaksi, siapa yang menyetujui setoran, kapan data diubah, dan kapan data dihapus*.
- Menjamin tidak ada kecurangan (*fraud*) atau manipulasi data kas di belakang layar.

---

## 🔔 BAB 11: Sistem Notifikasi Interaktif

Ikon lonceng (🔔) di bar atas memberikan peringatan *real-time* kepada masing-masing pengguna:

1. **Kategori Notifikasi**:
   - 💳 **Tagihan Iuran**: Pengingat pembayaran kas bulanan yang belum tuntas.
   - 💸 **Pembaruan Kas**: Informasi pencatatan mutasi kas baru oleh bendahara.
   - 📎 **Nota Baru**: Pemberitahuan upload struk belanja kelas.
   - 🎯 **Target Tabungan**: Informasi progres program tabungan yang baru dibuat atau tercapai.
2. **Aksi Cepat**:
   - Klik langsung pada item notifikasi untuk menuju ke halaman terkait.
   - Klik tombol **`✓ Tandai Semua Dibaca`** untuk membersihkan badge lonceng.

---

## 📱 BAB 12: Panduan Tampilan Responsif (Mobile vs Desktop)

Kasly dirancang adaptif untuk semua jenis perangkat:

### 📱 Pada Layar Smartphone (Mobile View):
- Hadir **Bilah Navigasi Bawah (*Bottom Navigation Bar*)** dengan tombol besar yang mudah dijangkau jempol: *Beranda*, *Buku Kas*, *Iuran*, *Target*, dan *Laporan*.
- Tabel data bertransformasi otomatis menjadi **Kartu Vertikal Ringkas (*Card View*)** agar tidak perlu digeser-geser ke samping.
- Menu profil dan notifikasi otomatis menyesuaikan lebar layar ponsel agar tidak terpotong.

### 🖥️ Pada Layar Laptop / Monitor (Desktop View):
- Menampilkan **Sidebar Navigasi Kiri** lengkap dengan submenu yang bisa dilipat (*collapsible*).
- Halaman Login menampilkan format **2 Kolom Modern** (Kolom Showcase Fitur di kiri & Kartu Login di kanan).
- Tabel mutasi menyajikan multi-kolom komprehensif lengkap dengan badge metode pembayaran.

---

## ❓ BAB 13: FAQ & Solusi Masalah Umum (Troubleshooting)

### Q1: Saya lupa kata sandi akun saya, bagaimana cara masuk?
> **Solusi:** Hubungi **Ketua Kelas** atau **Bendahara 1**. Pengurus dapat mengatur ulang (*reset*) kata sandi akun Anda melalui menu *Members & Access* (`/members`).

### Q2: Saya salah menginput nominal kas masuk/keluar, apakah bisa diperbaiki?
> **Solusi:** Ya. Pengurus (Ketua Kelas / Bendahara) dapat membuka menu **Buku Kas**, klik tombol **`Edit`** pada baris transaksi yang salah, perbaiki nominalnya, lalu klik **`Simpan Perubahan`**.

### Q3: Foto bukti transfer saya gagal diunggah, apa penyebabnya?
> **Solusi:** Pastikan ukuran file gambar bukti transfer tidak melebihi 5 MB dan berformat standard (`.jpg`, `.jpeg`, `.png`, atau `.webp`).

### Q4: Apakah data kas tetap aman jika server di-restart?
> **Solusi:** Sangat aman. Seluruh data transaksi, akun, bukti nota, dan log audit tersimpan di basis data cloud **Neon Serverless PostgreSQL** yang terenkripsi dan otomatis ter-backup.

---

<p align="center">
  <b>HOARIZON • KASLY v1.0</b><br/>
  <i>"Menghadirkan Transparansi Finansial Kelas yang Modern, Cepat, dan Berwibawa."</i><br/>
  Hak Cipta © 2026 <b>Suami Marie • HOARIZON Dev</b>. Seluruh hak dilindungi undang-undang.
</p>
