# 🏛️ HOARIZON • KASLY
### *Modern Class Cashflow & Smart Wallet Management System*

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-SQLite-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/NextAuth.js-v5-purple?style=for-the-badge" alt="NextAuth" />
  <img src="https://img.shields.io/badge/Guidebook-Dokumentasi%20Lengkap-emerald?style=for-the-badge&logo=gitbook" alt="Guidebook" />
</p>

> 📚 **Buku Panduan Penggunaan Lengkap**: Silakan baca file [**`GUIDEBOOK.md`**](file:///e:/Code/H.MP%20Dev/Hoarizon/kasly-app/GUIDEBOOK.md) untuk panduan detail cara penggunaan setiap halaman, card, dan alur kerja aplikasi.

---

## 📌 Sekilas Tentang Projek (Project Overview)

**Kasly** adalah platform web aplikasi manajemen keuangan dan kas kelas modern yang dirancang khusus untuk mewujudkan **transparansi, akuntabilitas, dan efisiensi pembukuan kas** pada lingkungan kelas (sekolah/kampus). Dibangun dengan arsitektur **Next.js 16 (App Router & Turbopack)**, **TypeScript**, dan **Drizzle ORM**, aplikasi ini menggantikan pembukuan manual buku tulis dengan sistem pencatatan digital yang rapi, otomatis, dan berestetika tinggi.

---

## ✨ Fitur-Fitur Utama (Key Features)

### 1. 📊 Executive Financial Dashboard
- **Live Saldo Kas**: Sinkronisasi saldo aktif, total pemasukan, dan total pengeluaran secara *real-time*.
- **Pintasan Fitur Cepat (6 Quick Actions)**: Akses instan ke Buku Kas, Iuran Bulanan, Status Pembayaran, Target Tabungan, Bukti Nota, dan Laporan.
- **4 Pilar Metrik Finansial**: Total Kas Masuk, Total Kas Keluar, Target Tabungan Kelas, dan Rasio Kelunasan Siswa.
- **Dua Kolom Transaksi & Target**: Pemantauan mutasi kas terkini dan program target tabungan aktif dalam satu layar.

### 2. 💸 Buku Kas & Arus Kas (Cashflow Management)
- Pencatatan transaksi pemasukan (*Income*) dan pengeluaran (*Expense*) terpusat pada satu buku kas.
- Kategori mutasi fleksibel (Iuran Kas, Donasi, Uang Kas Keluar, Belanja ATK, Konsumsi, Acara Kelas, dsb.).
- Pelacakan metode pembayaran (*CASH*, *BCA*, *ShopeePay*, *SeaBank*, *GoPay*, dsb.) serta pencatat (PIC).

### 3. 📋 Matriks Iuran Bulanan (4 Minggu) & Navigasi Bulan
- **Navigasi Multi-Bulan**: Fitur pemilih bulan & tahun (*MonthPicker*) untuk memantau iuran bulan lalu, bulan ini, maupun bulan depan.
- Matriks pembayaran interaktif 4 minggu (W1, W2, W3, W4) per siswa dengan kalkulasi otomatis status lunas/kurang.
- Perhitungan total tertagih dan persentase kelunasan kelas secara dinamis.

### 4. 💳 Monitoring Status Pembayaran & Reminder
- Ringkasan status kelunasan siswa (Lunas / Belum Lunas) dengan filter kelas dan pencarian instan.
- Sistem notifikasi pengingat (*Payment Reminder Notification*) otomatis ke akun anggota kelas.

### 5. 🎯 Program Target Tabungan (Savings Target)
- Pembuatan program tabungan khusus (e.g. Kas Wisata Kelas, Jaket Kelas, Kas Sosial, Kas Akhir Tahun).
- Indikator progres target (*Progress Bar*), jumlah terkumpul vs target nominal, serta hitung mundur sisa hari (*Days Remaining*).

### 6. 📎 Arsip Bukti & Nota Digital (Evidence Management)
- Unggah dan dokumentasi kuitansi, struk belanja, dan bukti mutasi transfer.
- Transparansi penuh bagi wali kelas dan siswa untuk memeriksa keaslian transaksi belanja kelas.

### 7. 📈 Laporan Keuangan Multi-Periode & Ekspor
- **Filter Periode Fleksibel**: Pilihan filter *Semua Periode*, *Per Hari*, *Per Bulan*, dan *Per Tahun*.
- **Ekspor Data Rapi**: Cetak dan unduh data ke format **CSV** dan **PDF** yang terformat elegan dan siap diaudit.

### 8. 🔔 Notifikasi Interaktif & Dialog Konfirmasi
- **Lonceng Notifikasi Dropdown**: Informasi pembaruan kas, bukti transaksi baru, target tabungan, dan pengingat bayar iuran tanpa teks terpotong.
- **Modal Konfirmasi Aksi**: Pop-up konfirmasi interaktif sebelum melakukan aksi *Create*, *Update*, *Delete*, atau *Logout*.

### 9. 🌓 Mode Gelap & Mode Terang (*Theme Switcher*)
- Pilihan tema: **☀️ Terang (*Light*)**, **🌙 Gelap (*Dark*)**, dan **💻 Sistem (*System*)**.
- Penyimpanan preferensi otomatis di `localStorage` tanpa *layout shift* atau *color bleeding*.

### 10. 🛡️ Role-Based Access Control (RBAC) & Audit Trail
- Hak akses hierarkis: `CLASS_LEADER` (Ketua Kelas), `TREASURER_1` & `TREASURER_2` (Bendahara), `HOMEROOM_TEACHER` (Wali Kelas), dan `CLASS_MEMBER` (Anggota Siswa).
- Log aktivitas audit trail menyeluruh mencatat siapa yang menambah, mengubah, atau menghapus data keuangan.

---

## 🛠️ Teknologi & Arsitektur (Tech Stack)

| Komponen | Teknologi |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS Tokens |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Database & ORM** | [SQLite / Turso](https://turso.tech/) with [Drizzle ORM](https://orm.drizzle.team/) |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) |
| **Icons & UI** | Custom Clean Vector SVG & Google Fonts (Inter & Nunito) |

---

## 📂 Struktur Direktori (Project Structure)

```text
kasly-app/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/          # Dashboard utama & ringkasan saldo
│   │   │   ├── finance/
│   │   │   │   ├── cashflow/       # Buku kas masuk & keluar
│   │   │   │   └── reports/        # Laporan keuangan & ekspor CSV/PDF
│   │   │   ├── contributions/      # Matriks iuran bulanan 4 minggu
│   │   │   │   └── status/         # Status & kelunasan siswa
│   │   │   ├── savings/
│   │   │   │   └── targets/        # Program target tabungan kelas
│   │   │   ├── evidence/           # Arsip nota & kuitansi belanja
│   │   │   ├── members/            # Daftar anggota kelas
│   │   │   ├── permissions/        # Manajemen peran & hak akses
│   │   │   ├── audit/              # Log audit aktivitas sistem
│   │   │   ├── settings/           # Pengaturan profil akun
│   │   │   └── layout.tsx          # Master layout dashboard, header & sidebar
│   │   ├── api/auth/               # NextAuth authentication endpoints
│   │   ├── globals.css             # Tema warna, Tailwind v4, dark mode tokens
│   │   └── page.tsx                # Landing / login redirect page
│   ├── components/
│   │   ├── providers/
│   │   │   └── ThemeProvider.tsx   # Context provider mode gelap/terang
│   │   └── ui/
│   │       ├── Sidebar.tsx         # Sidebar menu navigasi kelas
│   │       ├── ProfileDropdown.tsx # Menu profil & tombol logout modal
│   │       ├── NotificationDropdown.tsx # Lonceng notifikasi
│   │       ├── MonthPicker.tsx     # Selector bulan & tahun
│   │       ├── PeriodFilter.tsx    # Filter periode (hari/bulan/tahun)
│   │       ├── ConfirmModal.tsx    # Dialog konfirmasi aksi interaktif
│   │       └── Toast.tsx           # Notifikasi toast popup
│   ├── db/
│   │   ├── schema.ts               # Skema tabel Drizzle ORM
│   │   └── index.ts                # Koneksi database SQLite
│   └── lib/
│       ├── actions/
│       │   └── db-actions.ts       # Server actions database queries
│       └── utils.ts                # Format mata uang Rupiah, tanggal, & helper
├── public/                         # Aset logo, ikon, dan gambar statis
├── package.json
└── README.md
```

---

## 🚀 Panduan Memulai (Getting Started)

### 1. Prasyarat (Prerequisites)
- [Node.js](https://nodejs.org/) versi 18.18.0 atau yang lebih baru.
- Package Manager: `npm`, `pnpm`, atau `yarn`.

### 2. Instalasi & Setup

```bash
# 1. Clone repositori ini
git clone https://github.com/your-username/kasly-app.git

# 2. Masuk ke direktori projek
cd kasly-app

# 3. Install dependencies
npm install

# 4. Buat file environment (.env.local)
cp .env.example .env.local
```

### 3. Konfigurasi Environment Variable (`.env.local`)

```env
DATABASE_URL="file:./sqlite.db"
AUTH_SECRET="ganti_dengan_random_secret_string_anda"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup & Migrasi

```bash
# Generate skema database
npx drizzle-kit generate

# Jalankan push / migrasi skema
npx drizzle-kit push
```

### 5. Menjalankan Server Pengembangan (Development Server)

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda untuk mengakses aplikasi Kasly.

---

## 🔒 Hak Cipta & Lisensi (License)

Dikembangkan dengan 💙 oleh tim **HOARIZON**.  
Hak Cipta © 2026 **Suami Marie • HOARIZON Dev**. Seluruh hak dilindungi undang-undang.
