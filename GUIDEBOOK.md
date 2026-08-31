# 📖 BUKU PANDUAN PENGGUNA (USER GUIDEBOOK)
# HOARIZON • KASLY — Class Cashflow & Smart Wallet Management System

> **Versi Panduan**: 1.0 (Lengkap)  
> **Hak Cipta**: © 2026 **Suami Marie • HOARIZON Dev**  
> **Target Pengguna**: Ketua Kelas, Bendahara, Sekretaris, Wali Kelas, dan Seluruh Anggota Kelas

---

## 📑 DAFTAR ISI

1. [Pendahuluan & Konsep Utama Aplikasi](#1-pendahuluan--konsep-utama-aplikasi)
2. [Hierarki Peran & Hak Akses Pengguna (RBAC)](#2-hierarki-peran--hak-akses-pengguna-rbac)
3. [Panduan Lengkap Halaman & Setiap Card](#3-panduan-lengkap-halaman--setiap-card)
   - [3.1. Halaman Login (`/login`)](#31-halaman-login-login)
   - [3.2. Dashboard Utama (`/dashboard`)](#32-dashboard-utama-dashboard)
   - [3.3. Buku Kas & Arus Kas (`/finance/cashflow`)](#33-buku-kas--arus-kas-financecashflow)
   - [3.4. Iuran Kas Bulanan 4 Minggu (`/contributions`)](#34-iuran-kas-bulanan-4-minggu-contributions)
   - [3.5. Status Pembayaran & Monitoring Siswa (`/contributions/status`)](#35-status-pembayaran--monitoring-siswa-contributionsstatus)
   - [3.6. Program Target Tabungan (`/savings/targets`)](#36-program-target-tabungan-savingstargets)
   - [3.7. Bukti & Nota Digital (`/evidence`)](#37-bukti--nota-digital-evidence)
   - [3.8. Laporan Keuangan & Ekspor PDF/CSV (`/finance/reports`)](#38-laporan-keuangan--ekspor-pdfcsv-financereports)
   - [3.9. Anggota Kelas (`/members`)](#39-anggota-kelas-members)
   - [3.10. Hak Akses & Peran (`/permissions`)](#310-hak-akses--peran-permissions)
   - [3.11. Log Audit Aktivitas Sistem (`/audit`)](#311-log-audit-aktivitas-sistem-audit)
   - [3.12. Pengaturan Profil Akun (`/settings`)](#312-pengaturan-profil-akun-settings)
4. [Panduan Navigasi Global (Topbar & Mobile Navigation)](#4-panduan-navigasi-global-topbar--mobile-navigation)
5. [Tanya Jawab Umum & Solusi Masalah (FAQ)](#5-tanya-jawab-umum--solusi-masalah-faq)

---

## 1. PENDAHULUAN & KONSEP UTAMA APLIKASI

**KASLY** adalah aplikasi berbasis web modern yang dirancang untuk mengelola keuangan kas kelas secara transparan, otomatis, dan akuntabel. Aplikasi ini menyelesaikan berbagai permasalahan pembukuan manual (seperti catatan hilang, selisih perhitungan saldo, lupa tagihan iuran, dan bukti nota belanja yang tercecer).

### 🌟 Nilai Utama Kasly:
- **Transparansi Total**: Setiap pemasukan, pengeluaran, dan bukti struk belanja dapat dicek secara langsung oleh seluruh anggota dan wali kelas.
- **Kalkulasi Otomatis**: Saldo bersih kas, persentase kelunasan iuran, dan pencapaian target tabungan dihitung otomatis oleh sistem database.
- **Dukungan Multi-Perangkat**: Tampilan responsif yang nyaman digunakan pada layar Laptop/Desktop maupun Ponsel Pintar (Smartphone).
- **Tema Fleksibel**: Mendukung **Mode Terang (*Light*)** dan **Mode Gelap (*Dark*)** untuk kenyamanan mata pengguna.

---

## 2. HIERARKI PERAN & HAK AKSES PENGGUNA (RBAC)

Aplikasi Kasly menerapkan sistem izin bertingkat (*Role-Based Access Control*):

| Peran Jabatan | Kode Role | Hak Akses Utama |
|---|---|---|
| **Ketua Kelas** | `CLASS_LEADER` | Akses penuh (*Full Admin*) ke seluruh fitur, konfirmasi pembayaran, kelola peran anggota, dan persetujuan pengeluaran. |
| **Bendahara 1 & 2** | `TREASURER_1`, `TREASURER_2` | Mencatat transaksi kas masuk/keluar, memverifikasi setoran iuran dan tabungan, mengunggah bukti nota, dan mengunduh laporan. |
| **Sekretaris 1 & 2** | `SECRETARY_1`, `SECRETARY_2` | Meninjau pengajuan iuran, memverifikasi bukti transfer, mencatat aktivitas kelas, dan monitoring presensi pembayaran. |
| **Wali Kelas** | `HOMEROOM_TEACHER` | Akses pengawasan (*Auditor / Read-Only Super*), memantau seluruh mutasi kas, memeriksa laporan keuangan, dan log audit. |
| **Anggota Kelas** | `CLASS_MEMBER` | Mengajukan pembayaran iuran mingguan, mengajukan setoran target tabungan, melihat saldo kelas, memeriksa bukti belanja, dan melihat riwayat kas. |

---

## 3. PANDUAN LENGKAP HALAMAN & SETIAP CARD

---

### 3.1. Halaman Login (`/login`)

Halaman pintu masuk sistem untuk memastikan keamanan data keuangan kelas.

#### 🎴 Komponen & Card pada Halaman:
1. **Showcase Kiri (Mode Desktop)**:
   - Menampilkan ringkasan keunggulan fitur (Buku Kas, Matriks 4 Minggu, dan Target Tabungan).
2. **Card Form Login (Kanan/Tengah)**:
   - **Input Nama Lengkap / Username**: Masukkan nama lengkap sesuai data kelas (contoh: `Marie Allycia Renaldine`).
   - **Input Kata Sandi (Password)**: Masukkan kata sandi akun Anda.
   - **Tombol Ikon Mata (*Show/Hide Password*)**: Klik untuk melihat atau menyembunyikan karakter sandi yang sedang diketik.
   - **Tombol "👛 Masuk ke Dompet Kas Kelas"**: Klik untuk memvalidasi kredensial dan masuk ke Dashboard.
   - **Tautan Bantuan "Lupa password?"**: Informasi kontak langsung ke Ketua Kelas atau Bendahara untuk mereset sandi jika terlupa.
   - **Badge Footer**: Menampilkan hak cipta resmi `✨ CopyRight @Suami Marie 💙`.

---

### 3.2. Dashboard Utama (`/dashboard`)

Pusat kendali dan ringkasan keuangan kelas dalam satu tampilan eksekutif.

#### 🎴 Komponen & Card pada Halaman:
1. **Hero Greeting & Badge Jabatan**:
   - Menampilkan sapaan waktu (*Selamat Pagi/Siang/Sore/Malam*), nama pengguna, identitas kelas (`🏛️ HOARIZON • X-PPLG 1`), dan badge peran (`👑 Bendahara 1`).
2. **Card Master Saldo Kas Aktif (*Royal Denim / Midnight Slate*)**:
   - **Indikator Live Sinkron**: Titik hijau berkedip menandakan data terhubung langsung ke database secara *real-time*.
   - **Nominal Saldo Kas Aktif**: Menghitung rumus: `Total Kas Masuk - Total Kas Keluar`.
   - **Sub-info Bawah**: Menampilkan angka total kas masuk dan kas keluar akumulatif.
3. **Card 6 Pintasan Fitur Cepat (*Quick Actions*)**:
   - 💸 **Buku Kas (Cashflow)**: Lompat cepat ke pencatatan mutasi kas masuk dan keluar.
   - 📋 **Iuran Bulanan**: Buka matriks pembayaran kas 4 minggu siswa.
   - 💳 **Status Pembayaran**: Pantau daftar siswa yang sudah lunas atau memiliki tunggakan.
   - 🎯 **Target Tabungan**: Lihat program dan target tabungan kelas yang sedang berjalan.
   - 📎 **Bukti & Nota**: Akses arsip kuitansi dan struk belanja.
   - 📊 **Laporan Keuangan**: Buka laporan audit keuangan dan cetak PDF/CSV.
4. **4 Card Pilar Metrik Finansial**:
   - 🟢 **Total Kas Masuk**: Akumulasi seluruh pemasukan uang kas kelas.
   - 🔴 **Total Kas Keluar**: Akumulasi seluruh realisasi belanja operasional kelas.
   - 🟠 **Target Tabungan**: Nominal tabungan yang sudah terkumpul terhadap target rencana (disertai *Progress Bar*).
   - 🔵 **Kelunasan Iuran Kas**: Jumlah siswa yang telah melunasi iuran bulan berjalan (disertai persentase kelas).
5. **Card Mutasi Kas Terkini (*Recent Transactions*)**:
   - Menampilkan 5-10 transaksi terakhir lengkap dengan kategori, nominal, tanggal, nama pencatat (PIC), dan metode pembayaran (`CASH`, `SPAY`, `BCA`, dll.).
   - Tombol **"Buku Kas Lengkap →"** untuk melihat daftar seluruh mutasi.
6. **Card Target Tabungan Aktif**:
   - Menampilkan program tabungan aktif, progres persentase, nominal terkumpul vs target, dan sisa hari tenggat waktu.
   - Tombol **"+ Buka Program Tabungan Baru"** untuk membuat program tabungan baru bagi pengurus.

---

### 3.3. Buku Kas & Arus Kas (`/finance/cashflow`)

Buku besar pencatatan kas masuk (*Income*) dan kas keluar (*Expense*) kelas.

#### 🎴 Komponen & Card pada Halaman:
1. **3 Card Ringkasan Arus Kas**:
   - **Total Pemasukan (Hijau)**: Klik untuk memfilter hanya transaksi kas masuk.
   - **Total Pengeluaran (Merah)**: Klik untuk memfilter hanya transaksi kas keluar.
   - **Saldo Bersih Kas (Biru)**: Klik untuk menampilkan seluruh transaksi.
2. **Card Toolbar Filter & Pencarian**:
   - **Filter Periode (`PeriodFilter`)**:
     - *Semua Periode*: Menampilkan seluruh riwayat transaksi tanpa batasan waktu.
     - *📅 Per Hari*: Memilih transaksi pada tanggal spesifik (disertai tombol ◀ / ▶).
     - *🗓️ Per Bulan*: Memilih transaksi pada bulan dan tahun tertentu.
     - *📊 Per Tahun*: Memilih rekap tahunan tertentu.
   - **Input Pencarian**: Cari transaksi berdasarkan nama kategori, keterangan, atau nama PIC.
   - **Pills Jenis Mutasi**: Pilihan tombol *Semua Mutasi*, *↗ Pemasukan*, dan *↘ Pengeluaran* lengkap dengan jumlah transaksi.
3. **Card Tabel Data / Mobile Card View**:
   - Menampilkan kolom: Tanggal, Tipe, Kategori & Keterangan, Nominal, Metode Pembayaran, PIC Pencatat, dan Bukti Nota.
   - Tombol **"🧾 Bukti"**: Klik untuk melihat pratinjau foto kuitansi/struk transaksi.
   - Tombol **"Edit"** & **"Hapus"**: Bagi pengurus yang memiliki wewenang untuk memperbarui atau membatalkan mutasi.
4. **Tombol Aksi Header**:
   - **📥 Export CSV**: Mengunduh seluruh data tabel kas yang telah difilter ke file Excel/CSV berformat rapi.
   - **+ Catat Pemasukan**: Membuka formulir pencatatan kas masuk.
   - **+ Catat Pengeluaran**: Membuka formulir belanja/pengeluaran kas (wajib melampirkan keterangan dan bukti struk).

---

### 3.4. Iuran Kas Bulanan 4 Minggu (`/contributions`)

Halaman rekapitulasi iuran kas siswa per minggu (Minggu 1, Minggu 2, Minggu 3, Minggu 4) dalam 1 bulan.

#### 🎴 Komponen & Card pada Halaman:
1. **Pemilih Bulan & Tahun (`MonthPicker`)**:
   - Tombol panah **◀ Bulan Lalu** dan **Bulan Depan ▶** untuk memeriksa iuran di masa lampau atau masa mendatang.
   - Tombol cepat **"Bulan Ini"** untuk kembali ke bulan berjalan.
2. **4 Card Indikator Iuran**:
   - *Total Kas Terkumpul*: Nominal uang iuran yang telah lunas pada bulan yang dipilih.
   - *Menunggu Konfirmasi*: Jumlah setoran iuran siswa yang menunggu verifikasi pengurus.
   - *Sisa Tagihan Kelas*: Total nominal iuran yang belum disetorkan oleh siswa yang menunggak.
   - *Total Anggota Kelas*: Jumlah siswa aktif di kelas.
3. **Banner Pengajuan Pembayaran Menunggu Konfirmasi (Kuning Emas)**:
   - Muncul otomatis jika ada siswa yang mengunggah bukti transfer iuran.
   - Bagi Pengurus (Ketua Kelas / Bendahara / Sekretaris), terdapat tombol **"🔍 Tinjau"** untuk memeriksa foto bukti transfer dan mengonfirmasi status menjadi **LUNAS** atau **Ditolak**.
4. **Card Matriks Iuran 4 Minggu**:
   - Kolom: Nama Siswa, M1, M2, M3, M4, Total Terbayar, dan Aksi.
   - **Badge Status Minggu**:
     - 🟢 **Rp25.000 / LUNAS**: Siswa telah membayar iuran pada minggu tersebut.
     - 🟡 **PENDING**: Pengajuan pembayaran sedang ditinjau pengurus.
     - ⚪ **Belum Bayar**: Siswa belum membayar iuran pada minggu tersebut.
   - Klik pada chip minggu untuk mengubah status (bagi pengurus) atau melihat detail pembayaran.
5. **Tombol "+ Ajukan Pembayaran Saya"**:
   - Bagi siswa/anggota untuk memilih minggu yang ingin dibayar, memilih metode transfer (*CASH*, *BCA*, *ShopeePay*, *SeaBank*, dll.), dan mengunggah foto struk/screenshot mutasi.

---

### 3.5. Status Pembayaran & Monitoring Siswa (`/contributions/status`)

Halaman pemantauan kelunasan siswa dan pengiriman notifikasi pengingat iuran (*payment reminder*).

#### 🎴 Komponen & Card pada Halaman:
1. **4 Card KPI Status**:
   - *Lunas Bulan Ini*: Menampilkan rasio siswa lunas (contoh: `20 / 25 Siswa`).
   - *Belum Lunas*: Jumlah siswa yang masih memiliki tunggakan.
   - *Total Terkumpul*: Nominal iuran yang sudah masuk.
   - *Sisa Tunggakan*: Nominal iuran yang belum masuk ke kas kelas.
2. **Toolbar Filter Status**:
   - Tombol filter cepat: **Semua**, **Lunas**, dan **Belum Lunas**.
3. **Fitur Pengingat Tagihan (Reminder System)**:
   - **Tombol "📲 Ingatkan" (Per Siswa)**: Mengirimkan pesan notifikasi langsung ke lonceng notifikasi akun siswa yang bersangkutan berisi rincian sisa tunggakan.
   - **Tombol "📢 Tagih Otomatis" (Header Massal)**: Mengirimkan pengingat notifikasi serentak ke seluruh siswa yang belum melunasi iuran dalam 1 klik.
4. **Tampilan Tabel (Desktop) & Kartu Vertikal (Mobile)**:
   - Menampilkan progres bar kelunasan, tarif iuran, nominal terbayar, dan sisa tagihan per siswa.

---

### 3.6. Program Target Tabungan (`/savings/targets`)

Halaman pengelolaan program tabungan kelas jangka pendek maupun jangka panjang (contoh: *Wisata Kelas*, *Baju Jurusan*, *Kas Sosial*, *Kunjungan Industri*).

#### 🎴 Komponen & Card pada Halaman:
1. **Card Target Tabungan**:
   - **Badge Visibilitas**: 🌐 *Publik* (seluruh kelas) atau 🔒 *Private* (hanya anggota tertentu yang dipilih).
   - **Badge Skema Iuran**:
     - ⚖️ *Bagi Rata (Equal Split)*: Target total dibagi rata otomatis ke seluruh peserta.
     - 📌 *Nominal Tetap (Fixed Amount)*: Setiap anggota menyetor nominal yang ditentukan.
     - 🌱 *Seikhlasnya (Voluntary)*: Besaran setoran sukarela tanpa target per orang.
   - **Bilah Progres (*Progress Bar*)**: Visualisasi persentase dana terkumpul terhadap target nominal.
   - **Info Waktu & Tenggat**: Menghitung sisa hari (*Days Remaining*) menuju tanggal target tercapai.
   - **Daftar Peserta (*Participant Status*)**: Menampilkan daftar peserta yang sudah lunas, pending, atau belum menyetor.
   - **Tombol "💵 Setor Iuran"**: Anggota dapat menyetor iuran tabungan dan melampirkan bukti transfer.
2. **Tombol "+ Buat Target Baru" (Pengurus)**:
   - Formulir pembuatan program tabungan dengan pilihan nama, deskripsi, nominal target, tanggal mulai, tenggat waktu, visibilitas, dan skema pembagian.

---

### 3.7. Bukti & Nota Digital (`/evidence`)

Arsip visual kuitansi, struk belanja ATK/konsumsi, dan slip transfer pembayaran.

#### 🎴 Komponen & Card pada Halaman:
1. **Galeri Bukti Digital**:
   - Kartu thumbnail foto struk/nota belanja lengkap dengan tanggal, kategori, nominal, dan nama pengunggah.
2. **Modal Pratinjau Gambar (*Image Lightbox*)**:
   - Klik pada gambar untuk memperbesar bukti transaksi secara jernih dan mendetail.

---

### 3.8. Laporan Keuangan & Ekspor PDF/CSV (`/finance/reports`)

Halaman rekapitulasi audit keuangan kelas untuk keperluan laporan ke Wali Kelas, Sekolah, atau Orang Tua Siswa.

#### 🎴 Komponen & Card pada Halaman:
1. **Filter Periode Laporan**:
   - Memilih rentang laporan berdasarkan bulan atau tahun buku kas.
2. **Card Neraca Keuangan**:
   - Rekap total pemasukan, total pengeluaran belanja kelas, mutasi bersih, dan saldo akhir kas.
3. **Fitur Ekspor Dokumen**:
   - **📥 Download CSV**: Mengunduh data terstruktur untuk diolah di Microsoft Excel / Google Sheets.
   - **📄 Cetak Laporan (PDF)**: Mencetak dokumen laporan keuangan resmi lengkap dengan kop kelas, tabel mutasi, rekapitulasi, dan tanda tangan pengurus.

---

### 3.9. Anggota Kelas (`/members`)

Direktori data seluruh anggota siswa, pengurus kelas, dan wali kelas yang terdaftar.

#### 🎴 Komponen & Card pada Halaman:
1. **Daftar Anggota & Kontak**:
   - Menampilkan nama lengkap, jenis kelamin, role/jabatan, email, dan status keaktifan.
2. **Pencarian Anggota**:
   - Cari anggota berdasarkan nama atau jabatan.

---

### 3.10. Hak Akses & Peran (`/permissions`)

Pengaturan hak izin akses fitur (*RBAC Management*) bagi Ketua Kelas.

#### 🎴 Komponen & Card pada Halaman:
1. **Matriks Perizinan**:
   - Pengaturan hak membuat (*create*), mengedit (*update*), menghapus (*delete*), atau melihat (*read*) pada modul Kas, Iuran, Bukti, dan Pengaturan.

---

### 3.11. Log Audit Aktivitas Sistem (`/audit`)

Rekam jejak digital (*Audit Trail*) untuk mencegah kecurangan atau manipulasi data keuangan.

#### 🎴 Komponen & Card pada Halaman:
1. **Tabel Riwayat Aktivitas**:
   - Mencatat waktu (*timestamp*), nama pelaku (user), jenis aksi (`CREATE`, `UPDATE`, `DELETE`, `VERIFY`), modul terkait, dan detail perubahan data.

---

### 3.12. Pengaturan Profil Akun (`/settings`)

Halaman personalisasi akun pengguna.

#### 🎴 Komponen & Card pada Halaman:
1. **Card Informasi Profil**:
   - Menampilkan nama lengkap, email, dan jabatan akun saat ini.
2. **Card Ganti Kata Sandi (Password)**:
   - Formulir pembaruan kata sandi akun secara mandiri.

---

## 4. PANDUAN NAVIGASI GLOBAL (TOPBAR & MOBILE NAVIGATION)

Navigasi atas (*Topbar*) dan navigasi bawah (*Bottom Navigation*) dapat diakses dari seluruh halaman aplikasi:

### 🔝 Topbar Navigasi Atas:
1. **Tombol Menu Hamburger (Mobile)**:
   - Membuka laci navigasi (*Sidebar Drawer*) di sisi kiri pada layar smartphone.
2. **Kotak Pencarian Global (`⌘K` / `Ctrl+K`)**:
   - Pencarian cepat transaksi, nama anggota, iuran, atau target tabungan di desktop.
3. **Tombol Pengalih Tema 1-Klik (`ThemeToggle`)**:
   - Ikon **☀️ Matahari** (Mode Terang) dan **🌙 Bulan** (Mode Gelap).
   - Klik untuk beralih mode secara instan tanpa memuat ulang halaman.
4. **Lonceng Notifikasi Dropdown (`NotificationDropdown`)**:
   - Menampilkan pemberitahuan terkini mengenai:
     - 🔔 *Pemasukan / Pengeluaran Kas Baru*
     - 🧾 *Bukti Nota Belanja Baru yang Diunggah*
     - 🎯 *Pembaruan Program Tabungan Kelas*
     - 💳 *Pemberitahuan Pengingat Iuran Siswa*
   - Tombol **"✓ Tandai Semua Dibaca"** untuk membersihkan badge merah notifikasi.
5. **Menu Profil & Tombol Logout (`ProfileDropdown`)**:
   - Menampilkan avatar inisial, nama pengguna, dan badge jabatan.
   - **Segmented Theme Picker**: Pilihan visual 3 mode: *Terang* | *Gelap* | *Sistem*.
   - **Tombol Keluar Akun (*Logout*)**: Membuka dialog konfirmasi modal animasi sebelum sesi akun diakhiri dengan aman.

---

### 📱 Bottom Navigation Bar (Khusus Layar Smartphone):
Terletak di bagian bawah layar ponsel untuk navigasi cepat menggunakan satu tangan:
- 🏠 **Beranda**: Halaman Dashboard & Live Saldo.
- 💸 **Buku Kas**: Halaman mutasi kas masuk/keluar.
- 📋 **Iuran**: Halaman matriks iuran 4 minggu.
- 🎯 **Target**: Halaman program target tabungan.
- 📊 **Laporan**: Haporan rekapitulasi keuangan & ekspor.

---

## 5. TANYA JAWAB UMUM & SOLUSI MASALAH (FAQ)

### ❓ Q1: Bagaimana cara siswa membayar iuran kas kelas mingguan?
> **Jawaban**:
> 1. Buka menu **Iuran** (`/contributions`).
> 2. Klik tombol **"+ Ajukan Pembayaran Saya"**.
> 3. Pilih minggu yang ingin dibayar (contoh: *Minggu 1* atau *Minggu 2*).
> 4. Pilih metode pembayaran (contoh: *Transfer BCA*, *ShopeePay*, atau *Tunai ke Bendahara*).
> 5. Lampirkan foto bukti struk/screenshot mutasi transfer.
> 6. Klik **"Kirim Pengajuan Pembayaran"**. Status akan menjadi **PENDING** dan otomatis berubah menjadi **LUNAS** setelah diverifikasi oleh Bendahara atau Ketua Kelas.

---

### ❓ Q2: Bagaimana cara Bendahara memverifikasi bukti setoran siswa?
> **Jawaban**:
> 1. Buka halaman **Iuran** (`/contributions`) atau **Target Tabungan** (`/savings/targets`).
> 2. Pada banner emas bagian atas bertuliskan *"Pengajuan Pembayaran Menunggu Konfirmasi"*, klik tombol **"🔍 Tinjau"**.
> 3. Periksa foto struk transfer, nominal, dan tanggal yang dilampirkan siswa.
> 4. Klik tombol **"✅ Setujui Pembayaran"** untuk mengonfirmasi status menjadi LUNAS, atau tombol **"❌ Tolak"** jika bukti tidak valid.

---

### ❓ Q3: Mengapa saldo kas kelas bertambah atau berkurang secara otomatis?
> **Jawaban**:
> Saldo kas kelas terhubung secara terpusat (*Centralized Database Engine*). Setiap ada transaksi pemasukan yang disetujui, saldo otomatis bertambah. Setiap ada transaksi belanja/pengeluaran yang dicatat pengurus, saldo otomatis berkurang secara akurat.

---

### ❓ Q4: Bagaimana cara mencetak laporan keuangan kas ke format PDF atau Excel?
> **Jawaban**:
> 1. Buka halaman **Laporan Keuangan** (`/finance/reports`) atau **Buku Kas** (`/finance/cashflow`).
> 2. Pilih filter periode yang diinginkan (*Bulan Ini*, *Bulan Lalu*, atau *Tahun Tertentu*).
> 3. Klik tombol **"📥 Export CSV"** untuk file Excel, atau klik **"📄 Cetak Laporan (PDF)"** untuk mencetak laporan resmi siap tanda tangan.

---

### ❓ Q5: Apakah data keuangan aman jika aplikasi dibuka di perangkat lain?
> **Jawaban**:
> **Sangat aman**. Data disimpan di cloud database terenkripsi (PostgreSQL / Neon) dan setiap aksi penting (tambah/edit/hapus) dilindungi oleh sistem otentikasi NextAuth serta dicatat dalam **Log Audit** (`/audit`).

---

**HOARIZON • KASLY v1.0**  
*Dibuat dengan 💙 untuk Transparansi & Akuntabilitas Keuangan Kelas*  
Hak Cipta © 2026 **Suami Marie • HOARIZON Dev**. Seluruh hak dilindungi undang-undang.
