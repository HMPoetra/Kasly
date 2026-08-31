'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah, getMonthName } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import { MonthPicker } from '@/components/ui/MonthPicker';
import {
  getContributionsAction,
  sendPaymentReminderAction,
  sendBatchPaymentReminderAction,
} from '@/lib/actions/db-actions';

interface MemberContribution {
  userId: string;
  name: string;
  gender: string;
  amount: number;
  w1: string;
  w2: string;
  w3: string;
  w4: string;
  total: number;
}

export default function PaymentStatusPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedYear, setSelectedYear] = useState(2026);

  const [data, setData] = useState<{
    totalCollected: number;
    totalPending: number;
    unpaidCount: number;
    membersCount: number;
    members: MemberContribution[];
  }>({
    totalCollected: 0,
    totalPending: 0,
    unpaidCount: 0,
    membersCount: 0,
    members: [],
  });
  const [filter, setFilter] = useState<'ALL' | 'LUNAS' | 'BELUM'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const res = await getContributionsAction(selectedMonth, selectedYear);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.error('Error loading contribution status:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [refreshKey, selectedMonth, selectedYear]);

  if (!isPermLoading && !hasAccess('contribution')) {
    return <AccessGate moduleName="Status Pembayaran Iuran" />;
  }

  const targetPerMonth = 100000; // 4 weeks x 25.000

  const filteredMembers = data.members.filter((m) => {
    const isLunas = m.total >= targetPerMonth;
    if (filter === 'LUNAS' && !isLunas) return false;
    if (filter === 'BELUM' && isLunas) return false;
    if (searchTerm) {
      return m.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const lunasCount = data.members.filter((m) => m.total >= targetPerMonth).length;
  const belumCount = data.members.length - lunasCount;

  const handleExport = () => {
    const totalCollected = filteredMembers.reduce((sum, m) => sum + (m.total || 0), 0);
    const totalArrears = filteredMembers.reduce((sum, m) => sum + Math.max(0, targetPerMonth - (m.total || 0)), 0);
    const monthLabel = `${getMonthName(selectedMonth)} ${selectedYear}`;

    exportToCSV(
      `Status_Kelunasan_Iuran_Hoarizon_${getMonthName(selectedMonth)}_${selectedYear}`,
      filteredMembers,
      [
        { header: 'Nama Siswa / Anggota', key: 'name' },
        { header: 'Status Kelunasan', key: (r) => (r.total >= targetPerMonth ? 'LUNAS' : 'BELUM LUNAS') },
        { header: 'Total Terbayar (Rp)', key: (r) => formatRupiah(r.total || 0) },
        { header: 'Sisa Tunggakan (Rp)', key: (r) => formatRupiah(Math.max(0, targetPerMonth - r.total)) },
        { header: 'Iuran Minggu 1', key: (r) => (r.w1 === 'PAID' ? 'LUNAS' : r.w1 === 'PENDING' ? 'PENDING' : 'BELUM') },
        { header: 'Iuran Minggu 2', key: (r) => (r.w2 === 'PAID' ? 'LUNAS' : r.w2 === 'PENDING' ? 'PENDING' : 'BELUM') },
        { header: 'Iuran Minggu 3', key: (r) => (r.w3 === 'PAID' ? 'LUNAS' : r.w3 === 'PENDING' ? 'PENDING' : 'BELUM') },
        { header: 'Iuran Minggu 4', key: (r) => (r.w4 === 'PAID' ? 'LUNAS' : r.w4 === 'PENDING' ? 'PENDING' : 'BELUM') },
      ],
      {
        title: 'STATUS KELUNASAN IURAN KAS KELAS HOARIZON',
        subtitle: `Periode: ${monthLabel} (Target: ${formatRupiah(targetPerMonth)} per Siswa)`,
        summaryRows: [
          { label: 'Jumlah Siswa Lunas', value: `${lunasCount} siswa` },
          { label: 'Jumlah Siswa Belum Lunas', value: `${belumCount} siswa` },
          { label: 'Total Kas Masuk Terkumpul', value: formatRupiah(totalCollected) },
          { label: 'Total Sisa Tunggakan Kas', value: formatRupiah(totalArrears) },
        ],
      }
    );
  };

  const handleBatchReminder = async () => {
    const unpaidMembers = data.members.filter((m) => m.total < targetPerMonth);
    if (unpaidMembers.length === 0) {
      toast.success('Semua anggota sudah lunas untuk periode kas ini! 🎉', 'Lunas Semua');
      return;
    }
    const res = await sendBatchPaymentReminderAction();
    if (res.success) {
      toast.success(
        `Pemberitahuan pengingat tagihan berhasil dikirimkan ke notifikasi ${res.count} siswa yang memiliki tunggakan!`,
        '📲 Notifikasi Terkirim'
      );
    } else {
      toast.error('Gagal mengirim pengingat: ' + res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)]">
            💳 Status Pembayaran Iuran (Payment Status)
          </h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Monitoring kelunasan iuran kas kelas per anggota — {getMonthName(selectedMonth)} {selectedYear} (Live Database)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month & Year Navigation Picker */}
          <MonthPicker
            month={selectedMonth}
            year={selectedYear}
            onChange={(m, y) => {
              setSelectedMonth(m);
              setSelectedYear(y);
            }}
          />

          <Button variant="ghost" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
            🔄 Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            📥 Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleBatchReminder}>
            📢 Tagih Otomatis
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-4 bg-[var(--color-income-bg)] border border-[var(--color-income)]/20">
          <p className="text-xs font-semibold text-[#22543D]">Lunas Bulan Ini</p>
          <p className="text-2xl font-black text-[var(--color-income)] font-[var(--font-display)] mt-1">
            {lunasCount} <span className="text-xs font-normal text-[var(--color-denim-light)]">/ {data.members.length} Siswa</span>
          </p>
        </Card>

        <Card className="!p-4 bg-[var(--color-expense-bg)] border border-[var(--color-expense)]/20">
          <p className="text-xs font-semibold text-[#742A2A]">Belum Lunas</p>
          <p className="text-2xl font-black text-[var(--color-expense)] font-[var(--font-display)] mt-1">
            {belumCount} <span className="text-xs font-normal text-[var(--color-denim-light)]">Siswa</span>
          </p>
        </Card>

        <Card className="!p-4 bg-[var(--color-info-bg)] border border-[var(--color-info)]/20">
          <p className="text-xs font-semibold text-[#2A4365]">Total Terkumpul</p>
          <p className="text-xl font-black text-[var(--color-info)] font-[var(--font-display)] mt-1">
            {formatRupiah(data.totalCollected)}
          </p>
        </Card>

        <Card className="!p-4 bg-[var(--color-pending-bg)] border border-[var(--color-pending)]/20">
          <p className="text-xs font-semibold text-[#744210]">Sisa Tunggakan</p>
          <p className="text-xl font-black text-[var(--color-pending)] font-[var(--font-display)] mt-1">
            {formatRupiah(data.totalPending)}
          </p>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="!p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-accent)] mr-1">Status:</span>
            {(['ALL', 'LUNAS', 'BELUM'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-[var(--color-denim)] text-white font-bold'
                    : 'bg-[var(--color-baby-blue-50)] text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)]'
                }`}
              >
                {f === 'ALL' ? `Semua (${data.members.length})` : f === 'LUNAS' ? `Lunas (${lunasCount})` : `Belum Lunas (${belumCount})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-baby-blue-200)]/30 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)] w-48 md:w-60"
            />
          </div>
        </div>
      </Card>

      {/* Status List & Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            <span className="inline-block animate-spin mr-2">🌀</span> Memuat status pembayaran anggota...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            Tidak ada anggota yang cocok dengan pencarian / filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--color-baby-blue-200)]/30">
                  <th className="text-left py-3 px-3 text-xs font-bold text-[var(--color-denim)]">Nama Anggota</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-[var(--color-denim)]">Status Kelunasan</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-[var(--color-denim)]">Sudah Dibayar</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-[var(--color-denim)]">Sisa Tagihan</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-[var(--color-denim)]">Progress</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-[var(--color-denim)]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, i) => {
                  const isLunas = m.total >= targetPerMonth;
                  const sisa = Math.max(0, targetPerMonth - m.total);
                  const progressPct = Math.min(100, Math.round((m.total / targetPerMonth) * 100));

                  return (
                    <motion.tr
                      key={m.userId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-[var(--color-baby-blue-200)]/10 hover:bg-[var(--color-baby-blue-50)]/30 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <p className="font-semibold text-xs text-[var(--color-accent)]">{m.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={m.gender === 'M' ? 'info' : 'default'} className="text-[9px] py-0 px-1">
                            {m.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                          </Badge>
                          <span className="text-[10px] text-[var(--color-denim-light)] opacity-70">Tarif: Rp25.000/mgg</span>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <Badge variant={isLunas ? 'income' : 'expense'}>
                          {isLunas ? '✅ Lunas' : '⏳ Belum Lunas'}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-xs text-[var(--color-income)]">
                        {formatRupiah(m.total)}
                      </td>

                      <td className={`py-3 px-3 text-right font-bold text-xs ${sisa === 0 ? 'text-[var(--color-denim-light)] opacity-40' : 'text-[var(--color-expense)]'}`}>
                        {sisa === 0 ? 'Rp0' : formatRupiah(sisa)}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <div className="w-24 mx-auto">
                          <div className="flex items-center justify-between text-[9px] text-[var(--color-denim-light)] mb-1">
                            <span>{progressPct}%</span>
                            <span>{m.total / 25000}/4 mgg</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--color-baby-blue-50)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isLunas ? 'bg-[var(--color-income)]' : 'bg-[var(--color-pending)]'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isLunas ? (
                            <span className="text-[10px] text-[var(--color-income)] font-semibold">Tuntas ✨</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!h-6 !text-[10px] !px-2 text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)]"
                              onClick={async () => {
                                const res = await sendPaymentReminderAction(m.userId, sisa);
                                if (res.success) {
                                  toast.success(
                                    `Pengingat tunggakan ${formatRupiah(sisa)} berhasil dikirimkan ke lonceng notifikasi ${m.name}!`,
                                    '📲 Pengingat Terkirim'
                                  );
                                } else {
                                  toast.error('Gagal mengirim notifikasi: ' + res.error);
                                }
                              }}
                            >
                              📲 Ingatkan
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

