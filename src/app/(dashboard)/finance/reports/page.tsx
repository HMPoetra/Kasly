'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { formatRupiah, getMonthName } from '@/lib/utils';
import { exportToCSV, exportToPrint } from '@/lib/utils/export';
import { PeriodFilter, PeriodState, filterTransactionsByPeriod } from '@/components/ui/PeriodFilter';
import { getCashflowTransactionsAction } from '@/lib/actions/db-actions';

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  rawDate?: string;
  category: string;
  by: string;
}

export default function ReportsPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [periodState, setPeriodState] = useState<PeriodState>({
    mode: 'ALL',
    date: new Date().toISOString().slice(0, 10),
    month: 8,
    year: 2026,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await getCashflowTransactionsAction();
        setTransactions(res.transactions as TransactionItem[]);
      } catch (err) {
        console.error('Error loading report data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (!isPermLoading && !hasAccess('reports')) {
    return <AccessGate moduleName="Laporan & Rekap Keuangan" />;
  }

  // Filter transactions by selected period
  const filteredTransactions = filterTransactionsByPeriod(transactions, periodState);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Category breakdown
  const categoryBreakdown: Record<string, { income: number; expense: number }> = {};
  filteredTransactions.forEach((tx) => {
    if (!categoryBreakdown[tx.category]) {
      categoryBreakdown[tx.category] = { income: 0, expense: 0 };
    }
    if (tx.type === 'INCOME') {
      categoryBreakdown[tx.category].income += tx.amount;
    } else {
      categoryBreakdown[tx.category].expense += tx.amount;
    }
  });

  const getPeriodLabel = () => {
    if (periodState.mode === 'DAILY') return `Hari: ${periodState.date}`;
    if (periodState.mode === 'MONTHLY') return `Bulan: ${getMonthName(periodState.month)} ${periodState.year}`;
    if (periodState.mode === 'YEARLY') return `Tahun: ${periodState.year}`;
    return 'Semua Periode';
  };

  const handleExportCSV = () => {
    exportToCSV(
      `Laporan_Keuangan_Hoarizon_${periodState.mode}_${periodState.year}`,
      filteredTransactions,
      [
        { header: 'Tanggal Transaksi', key: 'date' },
        { header: 'Jenis Mutasi', key: (r) => (r.type === 'INCOME' ? 'Pemasukan (+)' : 'Pengeluaran (-)') },
        { header: 'Kategori Keuangan', key: 'category' },
        { header: 'Keterangan Transaksi', key: 'description' },
        { header: 'Nominal Mutasi (Rp)', key: (r) => (r.type === 'INCOME' ? `+${formatRupiah(r.amount)}` : `-${formatRupiah(r.amount)}`) },
        { header: 'Nominal Angka', key: (r) => (r.type === 'INCOME' ? r.amount : -r.amount) },
        { header: 'PIC / Penanggung Jawab', key: 'by' },
      ],
      {
        title: 'LAPORAN REKAPITULASI KEUANGAN LENGKAP KELAS HOARIZON',
        subtitle: `Periode: ${getPeriodLabel()}`,
        summaryRows: [
          { label: 'Total Pemasukan Kas', value: formatRupiah(totalIncome) },
          { label: 'Total Pengeluaran Kas', value: formatRupiah(totalExpense) },
          { label: 'Saldo Akhir / Saldo Bersih', value: formatRupiah(netBalance) },
          { label: 'Total Transaksi Tercatat', value: `${filteredTransactions.length} transaksi` },
        ],
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)]">📊 Laporan Keuangan</h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Ringkasan dan rekapitulasi audit keuangan kas kelas — {getPeriodLabel()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter Component */}
          <PeriodFilter state={periodState} onChange={setPeriodState} />

          <Button variant="secondary" size="sm" onClick={handleExportCSV}>📥 Ekspor CSV</Button>
          <Button variant="primary" size="sm" onClick={() => exportToPrint()}>🖨️ Cetak PDF</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
          <span className="inline-block animate-spin mr-2">🌀</span> Menyiapkan laporan keuangan...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="!p-4 bg-[var(--color-income-bg)] border border-[var(--color-income)]/20">
              <p className="text-xs font-medium text-[#22543D]">Total Penerimaan Kas</p>
              <p className="text-2xl font-black text-[var(--color-income)] font-[var(--font-display)] mt-1">
                {formatRupiah(totalIncome)}
              </p>
            </Card>
            <Card className="!p-4 bg-[var(--color-expense-bg)] border border-[var(--color-expense)]/20">
              <p className="text-xs font-medium text-[#742A2A]">Total Pengeluaran Kas</p>
              <p className="text-2xl font-black text-[var(--color-expense)] font-[var(--font-display)] mt-1">
                {formatRupiah(totalExpense)}
              </p>
            </Card>
            <Card className="!p-4 bg-[var(--color-info-bg)] border border-[var(--color-info)]/20">
              <p className="text-xs font-medium text-[#2A4365]">Saldo Akhir Buku</p>
              <p className="text-2xl font-black text-[var(--color-info)] font-[var(--font-display)] mt-1">
                {formatRupiah(netBalance)}
              </p>
            </Card>
          </div>

          {/* Breakdown Table */}
          <Card>
            <h2 className="text-sm font-bold text-[var(--color-accent)] mb-3">Rincian Kas Berdasarkan Kategori</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-baby-blue-200)]/20 text-[var(--color-denim-light)]">
                    <th className="text-left py-2 px-3">Kategori</th>
                    <th className="text-right py-2 px-3">Pemasukan</th>
                    <th className="text-right py-2 px-3">Pengeluaran</th>
                    <th className="text-right py-2 px-3">Saldo Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categoryBreakdown).map(([cat, val]) => (
                    <tr key={cat} className="border-b border-[var(--color-baby-blue-200)]/10">
                      <td className="py-2.5 px-3 font-semibold text-[var(--color-accent)]">{cat}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--color-income)] font-mono font-bold">
                        {val.income > 0 ? `+${formatRupiah(val.income)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[var(--color-expense)] font-mono font-bold">
                        {val.expense > 0 ? `-${formatRupiah(val.expense)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--color-accent)]">
                        {formatRupiah(val.income - val.expense)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
