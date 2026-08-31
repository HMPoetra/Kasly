'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { getGreeting, formatRupiah } from '@/lib/utils';
import { getDashboardSummaryAction } from '@/lib/actions/db-actions';

const quickActions = [
  {
    label: 'Buku Kas (Cashflow)',
    sub: 'Catat mutasi kas masuk/keluar',
    icon: '💸',
    href: '/finance/cashflow',
    color: 'hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400',
  },
  {
    label: 'Iuran Bulanan',
    sub: 'Matriks iuran kas 4 minggu',
    icon: '📋',
    href: '/contributions',
    color: 'hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 group-hover:text-sky-600 dark:group-hover:text-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400',
  },
  {
    label: 'Status Pembayaran',
    sub: 'Monitoring kelunasan siswa',
    icon: '💳',
    href: '/contributions/status',
    color: 'hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400',
  },
  {
    label: 'Target Tabungan',
    sub: 'Program & target tabungan',
    icon: '🎯',
    href: '/savings/targets',
    color: 'hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 group-hover:text-amber-700 dark:group-hover:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400',
  },
  {
    label: 'Bukti & Nota',
    sub: 'Arsip kuitansi & struk belanja',
    icon: '📎',
    href: '/evidence',
    color: 'hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 group-hover:text-teal-600 dark:group-hover:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400',
  },
  {
    label: 'Laporan Keuangan',
    sub: 'Audit, ekspor & cetak PDF',
    icon: '📊',
    href: '/finance/reports',
    color: 'hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 group-hover:text-purple-600 dark:group-hover:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  },
};

export default function DashboardPage() {
  const [data, setData] = useState<{
    userName: string;
    userRole: string;
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netCashflow: number;
    savingsTarget: number;
    targetAchieved: number;
    totalMembers: number;
    lunasCount: number;
    totalContributionCollected: number;
    contributionPercent: number;
    recentTransactions: {
      id: string;
      type: string;
      category: string;
      description: string;
      amount: number;
      date: string;
      by: string;
      method: string;
    }[];
    upcomingDeadlines: {
      id: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      daysRemaining: number;
      progress: number;
    }[];
  }>({
    userName: 'Bendahara',
    userRole: 'Pengurus Kas',
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netCashflow: 0,
    savingsTarget: 0,
    targetAchieved: 0,
    totalMembers: 25,
    lunasCount: 0,
    totalContributionCollected: 0,
    contributionPercent: 0,
    recentTransactions: [],
    upcomingDeadlines: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getDashboardSummaryAction();
        setData(res);
      } catch (err) {
        console.error('Error loading dashboard summary:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-7 pb-10">
      {/* ========================================================= */}
      {/* 1. HERO SECTION & MASTER WALLET BALANCE */}
      {/* ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              🏛️ HOARIZON • X-PPLG 1
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              👑 {data.userRole || 'Pengurus Kas'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-[var(--font-display)] text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="text-[var(--color-denim)] dark:text-sky-400">{data.userName}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isLoading
              ? 'Sinkronisasi data kas kelas...'
              : 'Pantauan keuangan, iuran bulanan, dan program kas kelas terdata rapi.'}
          </p>
        </div>

        {/* Master Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="relative group"
        >
          <div className="bg-gradient-to-br from-[#2B6CB0] via-[#1E4E80] to-[#1A365D] dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-[0_15px_30px_-8px_rgba(43,108,176,0.35)] dark:shadow-[0_15px_35px_-10px_rgba(15,23,42,0.4)] border border-sky-300/30 dark:border-indigo-500/30 relative overflow-hidden min-w-[280px] sm:min-w-[340px]">
            {/* Ambient Background Glows */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>💰</span> Total Saldo Kas Aktif
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sinkron
                </span>
              </div>

              <AnimatedCounter
                value={data.totalBalance}
                isCurrency
                className="text-2xl sm:text-3xl font-black text-white font-[var(--font-display)] tracking-tight block"
              />

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="opacity-80">Kas Masuk: {formatRupiah(data.totalIncome)}</span>
                <span className="opacity-80 text-rose-300">Keluar: {formatRupiah(data.totalExpense)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ========================================================= */}
      {/* 2. QUICK ACTIONS (PINTASAN AKSI CEPAT) */}
      {/* ========================================================= */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          ⚡ Pintasan Fitur Cepat
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3"
        >
          {quickActions.map((action) => (
            <motion.a
              key={action.label}
              variants={itemVariants}
              href={action.href}
              className={`flex flex-col items-start p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group ${action.color}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2.5 transition-transform group-hover:scale-110 shadow-2xs ${action.iconBg}`}
              >
                {action.icon}
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[var(--color-denim)] dark:group-hover:text-sky-400 transition-colors leading-snug">
                {action.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight font-normal">
                {action.sub}
              </span>
            </motion.a>
          ))}
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 3. FOUR KEY FINANCIAL METRICS (HARMONIOUS PALETTE) */}
      {/* ========================================================= */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          📊 Metrik &amp; Ringkasan Keuangan
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
        >
          {/* Card 1: Total Pemasukan */}
          <motion.div variants={itemVariants}>
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-900/60 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Total Kas Masuk</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold shadow-2xs">
                  📈
                </div>
              </div>
              <AnimatedCounter
                value={data.totalIncome}
                isCurrency
                className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-[var(--font-display)] block tracking-tight"
              />
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-500/80 mt-1 font-medium">
                Akumulasi seluruh mutasi penerimaan kas
              </p>
            </div>
          </motion.div>

          {/* Card 2: Total Pengeluaran */}
          <motion.div variants={itemVariants}>
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/70 dark:border-rose-900/60 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-400">Total Kas Keluar</span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center text-sm font-bold shadow-2xs">
                  📉
                </div>
              </div>
              <AnimatedCounter
                value={data.totalExpense}
                isCurrency
                className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-[var(--font-display)] block tracking-tight"
              />
              <p className="text-[11px] text-rose-700/80 dark:text-rose-500/80 mt-1 font-medium">
                Realisasi belanja &amp; operasional kelas
              </p>
            </div>
          </motion.div>

          {/* Card 3: Target Tabungan */}
          <motion.div variants={itemVariants}>
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/60 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-400">Target Tabungan</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 flex items-center justify-center text-sm font-bold shadow-2xs">
                  🎯
                </div>
              </div>
              <AnimatedCounter
                value={data.targetAchieved}
                isCurrency
                className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300 font-[var(--font-display)] block tracking-tight"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-amber-800/80 dark:text-amber-400/80 font-medium">
                <span>Target: {formatRupiah(data.savingsTarget)}</span>
                <span className="font-bold">
                  {data.savingsTarget > 0
                    ? Math.round((data.targetAchieved / data.savingsTarget) * 100)
                    : 0}
                  %
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-amber-100 dark:bg-amber-950/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      data.savingsTarget > 0
                        ? Math.min(100, Math.round((data.targetAchieved / data.savingsTarget) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Status Kelunasan Iuran Siswa */}
          <motion.div variants={itemVariants}>
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/70 dark:border-sky-900/60 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-900 dark:text-sky-400">Kelunasan Iuran Kas</span>
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-400 flex items-center justify-center text-sm font-bold shadow-2xs">
                  👥
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-sky-800 dark:text-sky-300 font-[var(--font-display)] tracking-tight">
                {data.lunasCount}{' '}
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ {data.totalMembers} Siswa Lunas</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-sky-800/80 dark:text-sky-400/80 font-medium">
                <span>Bulan Agustus 2026</span>
                <span className="font-bold">{data.contributionPercent}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-sky-100 dark:bg-sky-950/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-sky-600 dark:bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.contributionPercent}%` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 4. TWO-COLUMN: RECENT TRANSACTIONS (60%) + ACTIVE TARGETS (40%) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-3"
        >
          <Card className="!p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <div>
                  <h3 className="text-sm font-black font-[var(--font-display)] text-slate-900 dark:text-slate-100">
                    Mutasi Kas Terkini (Recent Transactions)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pencatatan mutasi kas masuk dan keluar terbaru</p>
                </div>
              </div>
              <a
                href="/finance/cashflow"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-sky-200 dark:border-sky-800"
              >
                Buku Kas Lengkap →
              </a>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentTransactions.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <span className="text-3xl block mb-2">🍃</span>
                  Belum ada catatan mutasi kas
                </div>
              ) : (
                data.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 px-1 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-2xs ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '↗' : '↘'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {tx.category}{' '}
                          {tx.description && (
                            <span className="text-slate-500 dark:text-slate-400 font-normal">({tx.description})</span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {tx.date} • oleh <span className="font-semibold text-slate-600 dark:text-slate-300">{tx.by}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-xs sm:text-sm font-black font-[var(--font-display)] ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatRupiah(tx.amount)}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                        {tx.method}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right Column: Active Savings Targets */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <Card className="!p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h3 className="text-sm font-black font-[var(--font-display)] text-slate-900 dark:text-slate-100">
                  Target Tabungan Aktif
                </h3>
              </div>
              <a
                href="/savings/targets"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
              >
                Kelola →
              </a>
            </div>

            <div className="space-y-3.5">
              {data.upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  <p>Belum ada target tabungan aktif</p>
                  <a
                    href="/savings/targets"
                    className="mt-2 inline-block text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    + Buat Program Tabungan
                  </a>
                </div>
              ) : (
                data.upcomingDeadlines.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatRupiah(t.currentAmount)} / {formatRupiah(t.targetAmount)}
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                        {t.progress}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-2 overflow-hidden my-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>⏳ Sisa waktu</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t.daysRemaining > 0 ? `${t.daysRemaining} hari lagi` : 'Tenggat tercapai'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <a
              href="/savings/targets"
              className="mt-4 block w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-center text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              + Buka Program Tabungan Baru
            </a>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
