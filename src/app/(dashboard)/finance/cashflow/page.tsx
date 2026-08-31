'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ReceiptDropzone } from '@/components/ui/ReceiptDropzone';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import { PeriodFilter, PeriodState, filterTransactionsByPeriod } from '@/components/ui/PeriodFilter';
import {
  getCashflowTransactionsAction,
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  getCategoriesAndPaymentMethodsAction,
} from '@/lib/actions/db-actions';

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  rawDate?: string;
  status: string;
  category: string;
  by: string;
  method: string;
  evidenceId?: string;
  evidenceUrl?: string;
  evidenceFileName?: string;
}

function CashflowPageContent() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialFilterParam = searchParams.get('filter');

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [filter, setFilter] = useState<'All' | 'INCOME' | 'EXPENSE'>(
    initialFilterParam === 'INCOME' ? 'INCOME' : initialFilterParam === 'EXPENSE' ? 'EXPENSE' : 'All'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Period filter state
  const [periodState, setPeriodState] = useState<PeriodState>({
    mode: 'ALL',
    date: new Date().toISOString().slice(0, 10),
    month: 8,
    year: 2026,
  });

  const [canManage, setCanManage] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    categoryName: 'Iuran Kas',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    paymentMethodCode: 'CASH',
    receiptBase64: '',
    receiptFileName: '',
    receiptFileType: '',
    receiptFileSize: 0,
    removeEvidence: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [methods, setMethods] = useState<{ id: string; name: string; code: string }[]>([]);

  useEffect(() => {
    if (initialFilterParam === 'INCOME') setFilter('INCOME');
    else if (initialFilterParam === 'EXPENSE') setFilter('EXPENSE');
  }, [initialFilterParam]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [res, meta] = await Promise.all([
          getCashflowTransactionsAction(),
          getCategoriesAndPaymentMethodsAction(),
        ]);
        if (isMounted) {
          setTransactions(res.transactions as TransactionItem[]);
          setCanManage(res.canManage ?? false);
          setCategories(meta.categories as { id: string; name: string; type: string }[]);
          setMethods(meta.methods as { id: string; name: string; code: string }[]);
        }
      } catch (err) {
        console.error('Error loading cashflow:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (!isPermLoading && !hasAccess('cashflow')) {
    return <AccessGate moduleName="Arus Kas & Keuangan" />;
  }

  // 1. Filter by Period (Daily / Monthly / Yearly / All)
  const periodFiltered = filterTransactionsByPeriod(transactions, periodState);

  // 2. Compute summaries on period-filtered transactions
  const incomeTxList = periodFiltered.filter((t) => t.type === 'INCOME');
  const expenseTxList = periodFiltered.filter((t) => t.type === 'EXPENSE');

  const totalIncome = incomeTxList.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTxList.reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  // 3. Filter by Type and Search query
  const filtered = periodFiltered.filter((t) => {
    if (filter !== 'All' && t.type !== filter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.by.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    exportToCSV(
      'Arus_Kas_Kelas_Hoarizon',
      filtered,
      [
        { header: 'Tanggal Transaksi', key: 'date' },
        { header: 'Jenis Mutasi', key: (r) => (r.type === 'INCOME' ? 'Pemasukan (Masuk)' : 'Pengeluaran (Keluar)') },
        { header: 'Kategori Transaksi', key: 'category' },
        { header: 'Keterangan / Catatan', key: 'description' },
        { header: 'Nominal Mutasi (Rp)', key: (r) => (r.type === 'INCOME' ? `+${formatRupiah(r.amount)}` : `-${formatRupiah(r.amount)}`) },
        { header: 'Nominal Angka', key: (r) => (r.type === 'INCOME' ? r.amount : -r.amount) },
        { header: 'Metode Pembayaran', key: 'method' },
        { header: 'PIC / Penanggung Jawab', key: 'by' },
        { header: 'Lampiran Bukti', key: (r) => (r.evidenceUrl ? 'Ada Bukti' : 'Tidak Ada') },
        { header: 'Status Transaksi', key: (r) => (r.status === 'COMPLETED' ? 'Selesai' : r.status) },
      ],
      {
        title: 'BUKU KAS UMUM & ARUS KAS (CASHFLOW) KELAS HOARIZON',
        subtitle: `Filter: ${filter === 'All' ? 'Semua Transaksi' : filter === 'INCOME' ? 'Pemasukan Saja' : 'Pengeluaran Saja'}${searchTerm ? ` (Pencarian: "${searchTerm}")` : ''}`,
        summaryRows: [
          { label: 'Total Pemasukan Kas', value: formatRupiah(totalIncome) },
          { label: 'Total Pengeluaran Kas', value: formatRupiah(totalExpense) },
          { label: 'Saldo Bersih (Net Cashflow)', value: formatRupiah(netCashflow) },
          { label: 'Total Baris Data Terpilih', value: `${filtered.length} baris` },
        ],
      }
    );
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.warning('Masukkan nominal transaksi yang valid.');
      return;
    }
    setIsSubmitting(true);
    const res = await createTransactionAction({
      type: formData.type,
      categoryName: formData.categoryName,
      amount: Number(formData.amount),
      description: formData.description,
      transactionDate: formData.transactionDate,
      paymentMethodCode: formData.paymentMethodCode,
      receiptBase64: formData.receiptBase64 || undefined,
      receiptFileName: formData.receiptFileName || undefined,
      receiptFileType: formData.receiptFileType || undefined,
      receiptFileSize: formData.receiptFileSize || undefined,
    });
    setIsSubmitting(false);
    if (res.success) {
      setIsAddOpen(false);
      const isIncome = formData.type === 'INCOME';
      toast.created(
        isIncome ? 'Pemasukan Kas' : 'Pengeluaran Kas',
        `${isIncome ? 'Pemasukan' : 'Pengeluaran'} (${formData.categoryName}) sebesar ${formatRupiah(Number(formData.amount))} berhasil dicatat.`
      );
      setFormData({
        type: 'INCOME',
        categoryName: 'Iuran Kas',
        amount: '',
        description: '',
        transactionDate: new Date().toISOString().slice(0, 10),
        paymentMethodCode: 'CASH',
        receiptBase64: '',
        receiptFileName: '',
        receiptFileType: '',
        receiptFileSize: 0,
        removeEvidence: false,
      });
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal mencatat transaksi: ' + res.error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    setIsSubmitting(true);
    const res = await updateTransactionAction(selectedTx.id, {
      type: formData.type,
      amount: Number(formData.amount),
      description: formData.description,
      transactionDate: formData.transactionDate,
      receiptBase64: formData.receiptBase64 || undefined,
      receiptFileName: formData.receiptFileName || undefined,
      receiptFileType: formData.receiptFileType || undefined,
      receiptFileSize: formData.receiptFileSize || undefined,
      removeEvidence: formData.removeEvidence,
    });
    setIsSubmitting(false);
    if (res.success) {
      setIsEditOpen(false);
      toast.updated(
        'Transaksi Kas',
        `Perubahan transaksi ${selectedTx.category} (${formatRupiah(Number(formData.amount))}) berhasil disimpan.`
      );
      setSelectedTx(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal memperbarui transaksi: ' + res.error);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedTx) return;
    setIsSubmitting(true);
    const res = await deleteTransactionAction(selectedTx.id);
    setIsSubmitting(false);
    if (res.success) {
      setIsDeleteOpen(false);
      toast.deleted(
        'Transaksi Kas',
        `Transaksi ${selectedTx.category} sebesar ${formatRupiah(selectedTx.amount)} berhasil dihapus.`
      );
      setSelectedTx(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal menghapus transaksi: ' + res.error);
    }
  };

  const openAddModalWithType = (type: 'INCOME' | 'EXPENSE') => {
    setFormData({
      type,
      categoryName: type === 'INCOME' ? 'Iuran Kas' : 'Operasional',
      amount: '',
      description: '',
      transactionDate: new Date().toISOString().slice(0, 10),
      paymentMethodCode: 'CASH',
      receiptBase64: '',
      receiptFileName: '',
      receiptFileType: '',
      receiptFileSize: 0,
      removeEvidence: false,
    });
    setIsAddOpen(true);
  };

  const openEditModal = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setFormData({
      type: tx.type as 'INCOME' | 'EXPENSE',
      categoryName: tx.category,
      amount: String(tx.amount),
      description: tx.description,
      transactionDate: tx.rawDate || new Date().toISOString().slice(0, 10),
      paymentMethodCode: tx.method,
      receiptBase64: tx.evidenceUrl || '',
      receiptFileName: tx.evidenceFileName || '',
      receiptFileType: '',
      receiptFileSize: 0,
      removeEvidence: false,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)] flex items-center gap-2">
            <span>💸</span> Arus Kas Kelas (Cashflow)
          </h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Pusat pencatatan seluruh mutasi kas masuk (pemasukan) dan kas keluar (pengeluaran) kelas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            📥 Export CSV
          </Button>
          {canManage && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="!bg-emerald-50 !text-emerald-800 hover:!bg-emerald-100 !border-emerald-200"
                onClick={() => openAddModalWithType('INCOME')}
              >
                + Catat Pemasukan
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="!bg-rose-50 !text-rose-800 hover:!bg-rose-100 !border-rose-200"
                onClick={() => openAddModalWithType('EXPENSE')}
              >
                + Catat Pengeluaran
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAddModalWithType('INCOME')}
              >
                + Tambah Transaksi
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          onClick={() => setFilter('INCOME')}
          className={`!p-4 bg-[var(--color-income-bg)] border transition-all cursor-pointer ${
            filter === 'INCOME' ? 'ring-2 ring-[var(--color-income)] shadow-sm' : 'border-[var(--color-income)]/20 hover:border-[var(--color-income)]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#22543D]">↗ Total Pemasukan</p>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {incomeTxList.length} Transaksi
            </span>
          </div>
          <p className="text-2xl font-black text-[var(--color-income)] font-[var(--font-display)] mt-1">
            {formatRupiah(totalIncome)}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Klik untuk filter pemasukan saja</p>
        </Card>

        <Card
          onClick={() => setFilter('EXPENSE')}
          className={`!p-4 bg-[var(--color-expense-bg)] border transition-all cursor-pointer ${
            filter === 'EXPENSE' ? 'ring-2 ring-[var(--color-expense)] shadow-sm' : 'border-[var(--color-expense)]/20 hover:border-[var(--color-expense)]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#742A2A]">↘ Total Pengeluaran</p>
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
              {expenseTxList.length} Transaksi
            </span>
          </div>
          <p className="text-2xl font-black text-[var(--color-expense)] font-[var(--font-display)] mt-1">
            {formatRupiah(totalExpense)}
          </p>
          <p className="text-[11px] text-rose-700/80 mt-0.5">Klik untuk filter pengeluaran saja</p>
        </Card>

        <Card
          onClick={() => setFilter('All')}
          className={`!p-4 bg-[var(--color-info-bg)] border transition-all cursor-pointer ${
            filter === 'All' ? 'ring-2 ring-[var(--color-info)] shadow-sm' : 'border-[var(--color-info)]/20 hover:border-[var(--color-info)]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#2A4365]">💰 Saldo Bersih Kas (Net)</p>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {transactions.length} Total
            </span>
          </div>
          <p className="text-2xl font-black text-[var(--color-info)] font-[var(--font-display)] mt-1">
            {formatRupiah(netCashflow)}
          </p>
          <p className="text-[11px] text-blue-700/80 mt-0.5">Sisa kas kelas aktif saat ini</p>
        </Card>
      </div>

      {/* Filters Row */}
      <Card className="!p-3.5 space-y-3">
        {/* Top Filter Bar: Period Picker & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Filter Periode:</span>
            <PeriodFilter state={periodState} onChange={setPeriodState} />
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="🔍 Cari transaksi, PIC, atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-[var(--color-baby-blue-200)]/40 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)]"
            />
          </div>
        </div>

        {/* Bottom Filter Bar: Mutation Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-[var(--color-accent)] mr-1">Jenis Mutasi:</span>
          {[
            { key: 'All' as const, label: 'Semua Mutasi', count: periodFiltered.length },
            { key: 'INCOME' as const, label: '↗ Pemasukan', count: incomeTxList.length },
            { key: 'EXPENSE' as const, label: '↘ Pengeluaran', count: expenseTxList.length },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                filter === f.key
                  ? 'bg-[var(--color-denim)] text-white shadow-sm'
                  : 'bg-[var(--color-baby-blue-50)] text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)]'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Transaction Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            <span className="inline-block animate-spin mr-2">🌀</span> Memuat data transaksi arus kas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            <span className="text-4xl mb-2 block">💸</span>
            <p className="font-bold text-slate-800">Tidak ada transaksi yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-baby-blue-200)]/20">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-denim-light)]">Tanggal</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-denim-light)]">Tipe</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-denim-light)]">Kategori & Keterangan</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--color-denim-light)]">Nominal</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-denim-light)]">Metode</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-denim-light)]">PIC</th>
                    {canManage && (
                      <th className="text-center py-3 px-4 text-xs font-semibold text-[var(--color-denim-light)]">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, i) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-b border-[var(--color-baby-blue-200)]/10 hover:bg-[var(--color-baby-blue-50)]/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-xs text-[var(--color-accent)] whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={tx.type === 'INCOME' ? 'income' : 'expense'}>
                          {tx.type === 'INCOME' ? '↗ Pemasukan' : '↘ Pengeluaran'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[var(--color-accent)]">{tx.category}</p>
                          {tx.evidenceUrl && (
                            <button
                              onClick={() => setPreviewImage({
                                url: tx.evidenceUrl!,
                                title: `Bukti: ${tx.category} — ${formatRupiah(tx.amount)}`,
                              })}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Lihat Bukti Foto / Nota"
                            >
                              <span>🧾 Bukti</span>
                            </button>
                          )}
                        </div>
                        {tx.description && <p className="text-[10px] text-[var(--color-denim-light)]">{tx.description}</p>}
                      </td>
                      <td className={`py-3 px-4 text-xs font-bold text-right whitespace-nowrap ${tx.type === 'INCOME' ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] px-2 py-1 rounded-md bg-[var(--color-baby-blue-50)] text-[var(--color-denim)] font-medium">
                          {tx.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--color-denim-light)] whitespace-nowrap">{tx.by}</td>
                      {canManage && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="p-1.5 rounded-lg text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)] transition-colors text-xs cursor-pointer"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => openDeleteModal(tx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors text-xs cursor-pointer"
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2.5">
              {filtered.map((tx) => (
                <div key={tx.id} className="p-3.5 rounded-2xl border border-[var(--color-baby-blue-200)]/20 hover:bg-[var(--color-baby-blue-50)]/30 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={tx.type === 'INCOME' ? 'income' : 'expense'}>
                      {tx.type === 'INCOME' ? '↗ Pemasukan' : '↘ Pengeluaran'}
                    </Badge>
                    <span className="text-[10px] text-[var(--color-denim-light)]">{tx.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900">{tx.category}</p>
                    {tx.evidenceUrl && (
                      <button
                        onClick={() => setPreviewImage({
                          url: tx.evidenceUrl!,
                          title: `Bukti: ${tx.category} — ${formatRupiah(tx.amount)}`,
                        })}
                        className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold"
                      >
                        🧾 Bukti
                      </button>
                    )}
                  </div>
                  {tx.description && <p className="text-xs text-[var(--color-denim-light)] mt-0.5">{tx.description}</p>}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-baby-blue-200)]/20">
                    <div>
                      <span className="text-[10px] text-[var(--color-denim-light)]">{tx.by} • {tx.method}</span>
                      <p className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="px-2.5 py-1 bg-white border border-[var(--color-baby-blue-200)] rounded-lg text-xs font-semibold text-[var(--color-denim)] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(tx)}
                          className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-600 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modal Tambah Transaksi */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="+ Tambah Transaksi Kas">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'INCOME', categoryName: formData.categoryName === 'Operasional' ? 'Iuran Kas' : formData.categoryName })}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  formData.type === 'INCOME' ? 'bg-[var(--color-income)] text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ↗ Pemasukan (Masuk)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'EXPENSE', categoryName: formData.categoryName === 'Iuran Kas' ? 'Operasional' : formData.categoryName })}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  formData.type === 'EXPENSE' ? 'bg-[var(--color-expense)] text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ↘ Pengeluaran (Keluar)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Kategori Transaksi</label>
            <input
              type="text"
              required
              list="categories-list"
              placeholder={formData.type === 'INCOME' ? 'Contoh: Iuran Kas, Donasi, Sponsorship...' : 'Contoh: Operasional, Konsumsi, Fotocopy...'}
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-baby-blue-200)]/40 text-xs focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
            />
            <datalist id="categories-list">
              {categories
                .filter((c) => c.type === formData.type)
                .map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Nominal (Rp)</label>
            <CurrencyInput
              required
              min={1000}
              placeholder="50.000"
              value={formData.amount}
              onChange={(val) => setFormData({ ...formData, amount: String(val) })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Keterangan / Catatan</label>
            <textarea
              rows={2}
              placeholder="Detail peruntukan atau sumber dana transaksi..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-baby-blue-200)]/40 text-xs focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-baby-blue-200)]/40 text-xs focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Metode Pembayaran</label>
              <select
                value={formData.paymentMethodCode}
                onChange={(e) => setFormData({ ...formData, paymentMethodCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-baby-blue-200)]/40 text-xs focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none bg-white"
              >
                {methods.length > 0 ? (
                  methods.map((m) => (
                    <option key={m.id} value={m.code}>
                      {m.name} ({m.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="CASH">CASH (Tunai)</option>
                    <option value="SPAY">ShopeePay / QRIS</option>
                    <option value="SEABANK">SeaBank / Transfer</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* DRAG AND DROP ZONE BUKTI */}
          <ReceiptDropzone
            receiptBase64={formData.receiptBase64}
            receiptFileName={formData.receiptFileName}
            receiptFileSize={formData.receiptFileSize}
            label="Foto Bukti Transaksi / Nota (Opsional)"
            helperText="Seret foto struk/bukti mutasi ke sini"
            onFileChange={(data) => {
              if (data) {
                setFormData((prev) => ({
                  ...prev,
                  receiptBase64: data.base64,
                  receiptFileName: data.fileName,
                  receiptFileType: data.fileType,
                  receiptFileSize: data.fileSize,
                  removeEvidence: false,
                }));
              } else {
                setFormData((prev) => ({
                  ...prev,
                  receiptBase64: '',
                  receiptFileName: '',
                  receiptFileType: '',
                  receiptFileSize: 0,
                  removeEvidence: true,
                }));
              }
            }}
          />

          <div className="flex gap-2 pt-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Transaksi */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="✏️ Edit Transaksi Kas">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Nominal (Rp)</label>
            <CurrencyInput
              required
              min={1000}
              placeholder="50.000"
              value={formData.amount}
              onChange={(val) => setFormData({ ...formData, amount: String(val) })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Keterangan</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-baby-blue-200)]/40 text-xs resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Tanggal</label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-baby-blue-200)]/40 text-xs"
            />
          </div>

          {/* DRAG AND DROP ZONE BUKTI DI EDIT */}
          <ReceiptDropzone
            receiptBase64={formData.receiptBase64}
            receiptFileName={formData.receiptFileName}
            receiptFileSize={formData.receiptFileSize}
            label="Foto Bukti Transaksi / Nota"
            helperText="Seret foto baru untuk mengganti atau menghapus bukti"
            onFileChange={(data) => {
              if (data) {
                setFormData((prev) => ({
                  ...prev,
                  receiptBase64: data.base64,
                  receiptFileName: data.fileName,
                  receiptFileType: data.fileType,
                  receiptFileSize: data.fileSize,
                  removeEvidence: false,
                }));
              } else {
                setFormData((prev) => ({
                  ...prev,
                  receiptBase64: '',
                  receiptFileName: '',
                  receiptFileType: '',
                  receiptFileSize: 0,
                  removeEvidence: true,
                }));
              }
            }}
          />

          <div className="flex gap-2 pt-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus Transaksi */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="🗑️ Hapus Transaksi Kas">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-accent)]">
            Apakah Anda yakin ingin menghapus transaksi{' '}
            <span className="font-bold">{selectedTx?.category}</span> sebesar{' '}
            <span className="font-bold text-[var(--color-expense)]">
              {selectedTx ? formatRupiah(selectedTx.amount) : ''}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white"
              disabled={isSubmitting}
              onClick={handleDeleteSubmit}
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Pratinjau Bukti */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.title || 'Pratinjau Bukti Transaksi'}
      >
        <div className="space-y-3">
          {previewImage && (
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-900/5 flex items-center justify-center p-2">
              <img
                src={previewImage.url}
                alt="Bukti Transaksi"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setPreviewImage(null)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function CashflowPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-[var(--color-denim-light)]">Memuat data arus kas...</div>}>
      <CashflowPageContent />
    </Suspense>
  );
}
