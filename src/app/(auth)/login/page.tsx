'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        email: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Nama pengguna atau kata sandi tidak sesuai.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gingham flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-x-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-indigo-300/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14 xl:gap-20 z-10">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: BRANDING & FEATURE SHOWCASE (DESKTOP) */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="hidden lg:flex flex-col items-start max-w-lg space-y-6"
        >
          {/* Class & App Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-sky-200/80 shadow-xs text-xs font-black text-[var(--color-denim)] tracking-wide">
            <span>🏛️</span>
            <span>HOARIZON • DIGITAL CLASS WALLET</span>
          </div>

          {/* Main Title & Subtitle */}
          <div>
            <h1 className="text-3xl xl:text-4xl font-black font-[var(--font-display)] text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              Kelola Kas &amp; Iuran Kelas Jadi Lebih <span className="text-[var(--color-denim)] underline decoration-sky-300 underline-offset-4">Rapi &amp; Transparan</span>.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 font-medium leading-relaxed">
              Platform pembukuan keuangan kelas modern dengan pencatatan mutasi kas real-time, matriks iuran bulanan 4 minggu, program target tabungan, dan arsip bukti nota digital.
            </p>
          </div>

          {/* 3 Feature Highlights */}
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-sky-100 dark:border-slate-700 shadow-2xs hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg flex-shrink-0">
                💸
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Buku Kas &amp; Arus Kas Terpusat</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pencatatan kas masuk dan keluar dengan kategori &amp; metode pembayaran.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-sky-100 dark:border-slate-700 shadow-2xs hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-lg flex-shrink-0">
                📋
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Matriks Iuran 4 Minggu &amp; Pengingat</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Monitoring status kelunasan siswa dan kirim notifikasi pengingat otomatis.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-sky-100 dark:border-slate-700 shadow-2xs hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg flex-shrink-0">
                🎯
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Target Tabungan &amp; Laporan PDF</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Program tabungan kelas, arsip struk belanja, dan ekspor laporan berkala.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: LOGIN CARD (DESKTOP & MOBILE) */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Washi Tape Paper Container */}
          <div className="relative">
            {/* Top Washi Tapes */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="absolute -top-3 left-10 w-20 h-5 bg-amber-200/80 rounded-sm border border-amber-300/40 shadow-xs z-20 backdrop-blur-xs"
              style={{ transform: 'rotate(-3deg)' }}
            />
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="absolute -top-3 right-10 w-20 h-5 bg-amber-200/80 rounded-sm border border-amber-300/40 shadow-xs z-20 backdrop-blur-xs"
              style={{ transform: 'rotate(3deg)' }}
            />

            {/* Paper Card Body */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_-10px_rgba(43,108,176,0.22)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-sky-200/70 dark:border-slate-700/50 p-6 sm:p-8">
              {/* App Logo & Title Header */}
              <div className="text-center mb-5">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="inline-block relative mb-2.5"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shadow-[var(--shadow-puffy)] border-2 border-white mx-auto ring-4 ring-sky-100">
                    <Image
                      src="/logo.png"
                      alt="Hoarizon Logo"
                      width={88}
                      height={88}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </motion.div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-[var(--font-display)] tracking-tight">
                  HOARIZON • KASLY
                </h2>
                <p className="text-xs text-[var(--color-denim)] font-semibold mt-0.5">
                  Class Cashflow &amp; Wallet Management
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Silakan masuk menggunakan akun anggota kelas
                </p>
              </div>

              {/* Decorative Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent mb-5" />

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap / Username
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: Marie Allycia Renaldine"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-sky-400 dark:focus:border-sky-500 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-sky-400 dark:focus:border-sky-500 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                      title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium flex items-center gap-2"
                  >
                    <span>⚠️</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[var(--color-denim)] via-[#2B6CB0] to-[#1A4971] hover:from-[#235891] hover:to-[#143958] text-white font-black text-xs tracking-wider uppercase rounded-2xl shadow-[0_10px_25px_-5px_rgba(43,108,176,0.35)] transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Membuka Dompet Kas...</span>
                    </>
                  ) : (
                    <>
                      <span>👛</span>
                      <span>Masuk ke Dompet Kas Kelas</span>
                    </>
                  )}
                </button>

                {/* Password Help Hint */}
                <div className="text-center pt-1">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Lupa password? Hubungi <span className="font-bold text-[var(--color-denim)]">Ketua Kelas / Bendahara</span>
                  </p>
                </div>
              </form>

              {/* Bottom Slogan */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="w-6 h-px bg-slate-200" />
                <span>Sistem Kas Kelas Digital &amp; Akuntabel</span>
                <span className="w-6 h-px bg-slate-200" />
              </div>
            </div>
          </div>

          {/* Copyright Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-sky-200/60 shadow-2xs text-[11px] text-[var(--color-denim)] font-bold">
              <span>✨</span>
              <span>CopyRight @Suami Marie</span>
              <span>💙</span>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
