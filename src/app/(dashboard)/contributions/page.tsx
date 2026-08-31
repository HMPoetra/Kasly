'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah, getMonthName } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import { MonthPicker } from '@/components/ui/MonthPicker';
import {
  getContributionsAction,
  submitContributionPaymentAction,
  verifyContributionPaymentAction,
} from '@/lib/actions/db-actions';

interface WeekDetail {
  paymentId?: string;
  status: string;
  methodCode: string;
  methodName: string;
  amount: number;
  evidenceId?: string;
  evidenceUrl?: string;
  evidenceFileName?: string;
  paidAt?: string;
}

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
  weeksDetail?: Record<number, WeekDetail>;
}

interface PendingSubmission {
  paymentId: string;
  userId: string;
  userName: string;
  weekNumber: number;
  amount: number;
  methodCode: string;
  methodName: string;
  evidenceId?: string;
  evidenceUrl?: string;
  evidenceFileName?: string;
  paidAt?: string;
}

const APPROVER_ROLES = ['CLASS_LEADER', 'VICE_CLASS_LEADER', 'SECRETARY_1', 'SECRETARY_2'];

export default function ContributionsPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const [data, setData] = useState<{
    totalCollected: number;
    totalPending: number;
    unpaidCount: number;
    membersCount: number;
    members: MemberContribution[];
    pendingSubmissions: PendingSubmission[];
    currentUserId: string | null;
    currentUserRole: string;
    canVerify: boolean;
  }>({
    totalCollected: 0,
    totalPending: 0,
    unpaidCount: 0,
    membersCount: 0,
    members: [],
    pendingSubmissions: [],
    currentUserId: null,
    currentUserRole: 'CLASS_MEMBER',
    canVerify: false,
  });

  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchMember, setSearchMember] = useState('');

  // Modals state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<PendingSubmission | null>(null);
  const [selectedCellDetail, setSelectedCellDetail] = useState<{
    userId: string;
    userName: string;
    weekNumber: number;
    detail: WeekDetail;
  } | null>(null);

  // Read-only info modal for other members' unpaid status
  const [unpaidInfoModal, setUnpaidInfoModal] = useState<{ userName: string; weekNumber: number } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form for Submit Payment (with Drag and Drop receipt)
  const [submitForm, setSubmitForm] = useState({
    userId: '',
    weekNumber: 1,
    amount: 25000,
    methodCode: 'SPAY',
    receiptBase64: '',
    receiptFileName: '',
    receiptFileType: '',
    receiptFileSize: 0,
    note: '',
  });

  // Rejection state
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const res = await getContributionsAction(selectedMonth, selectedYear);
        if (isMounted) {
          setData(res as any);
        }
      } catch (err) {
        console.error('Error loading contributions:', err);
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
    return <AccessGate moduleName="Iuran Kas Siswa" />;
  }

  const canVerify = data.canVerify || APPROVER_ROLES.includes(data.currentUserRole);
  const isMe = (userId: string) => userId === data.currentUserId;
  const currentMember = data.members.find((m) => m.userId === data.currentUserId);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('Hanya file gambar (JPEG, PNG, WEBP) yang didukung sebagai bukti pembayaran.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ukuran file maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSubmitForm((prev) => ({
        ...prev,
        receiptBase64: event.target?.result as string,
        receiptFileName: file.name,
        receiptFileType: file.type,
        receiptFileSize: file.size,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Open submission modal
  const openSubmitModal = (targetUserId?: string, weekNum: number = 1) => {
    // If not approver, strictly force userId to current logged in user
    const finalUserId = canVerify
      ? targetUserId || data.currentUserId || (data.members[0]?.userId ?? '')
      : data.currentUserId || '';

    setSubmitForm({
      userId: finalUserId,
      weekNumber: weekNum,
      amount: 25000,
      methodCode: 'SPAY',
      receiptBase64: '',
      receiptFileName: '',
      receiptFileType: '',
      receiptFileSize: 0,
      note: '',
    });
    setIsSubmitOpen(true);
  };

  // Handle Submit Form
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.receiptBase64) {
      toast.warning('Harap unggah foto bukti transfer / struk pembayaran.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitContributionPaymentAction({
      userId: submitForm.userId,
      weekNumber: submitForm.weekNumber,
      month: selectedMonth,
      year: selectedYear,
      amount: Number(submitForm.amount || 25000),
      methodCode: submitForm.methodCode,
      receiptBase64: submitForm.receiptBase64,
      receiptFileName: submitForm.receiptFileName,
      receiptFileType: submitForm.receiptFileType,
      receiptFileSize: submitForm.receiptFileSize,
      note: submitForm.note,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsSubmitOpen(false);
      setRefreshKey((k) => k + 1);
      toast.success(
        `Pengajuan pembayaran kas Minggu ke-${submitForm.weekNumber} (${formatRupiah(Number(submitForm.amount || 25000))}) berhasil dikirim dan menunggu konfirmasi pengurus.`,
        'Pengajuan Terkirim'
      );
    } else {
      toast.error('Gagal mengajukan pembayaran: ' + res.error);
    }
  };

  // Handle Verify Action (Approve or Reject)
  const handleVerifySubmit = async (status: 'PAID' | 'REJECTED') => {
    if (!selectedPending) return;
    setIsSubmitting(true);
    const res = await verifyContributionPaymentAction({
      paymentId: selectedPending.paymentId,
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      const studentName = selectedPending.userName;
      setIsVerifyOpen(false);
      setSelectedPending(null);
      setIsRejectMode(false);
      setRejectionReason('');
      setRefreshKey((k) => k + 1);
      if (status === 'PAID') {
        toast.verified(
          'Iuran Kas',
          `Pembayaran uang kas ${studentName} berhasil disetujui & otomatis dicatat ke Buku Kas.`
        );
      } else {
        toast.error(`Pengajuan pembayaran uang kas ${studentName} telah ditolak.`, 'Pengajuan Ditolak');
      }
    } else {
      toast.error('Gagal memverifikasi: ' + res.error);
    }
  };

  const handleExport = () => {
    const totalCollected = filteredMembers.reduce((sum, m) => sum + (m.total || 0), 0);
    const monthLabel = `${getMonthName(selectedMonth)} ${selectedYear}`;
    const formatStatus = (st: string) =>
      st === 'PAID' ? 'LUNAS (Rp5.000)' : st === 'PENDING' ? 'PENDING (Menunggu Verifikasi)' : 'BELUM BAYAR';

    exportToCSV(
      `Rekap_Iuran_Kas_Hoarizon_${getMonthName(selectedMonth)}_${selectedYear}`,
      filteredMembers,
      [
        { header: 'Nama Anggota', key: 'name' },
        { header: 'Jenis Kelamin', key: (r) => (r.gender === 'M' ? 'Laki-laki' : 'Perempuan') },
        { header: 'Iuran Minggu 1', key: (r) => formatStatus(r.w1) },
        { header: 'Iuran Minggu 2', key: (r) => formatStatus(r.w2) },
        { header: 'Iuran Minggu 3', key: (r) => formatStatus(r.w3) },
        { header: 'Iuran Minggu 4', key: (r) => formatStatus(r.w4) },
        { header: 'Total Iuran Masuk (Rp)', key: (r) => formatRupiah(r.total || 0) },
        { header: 'Total Iuran Angka', key: (r) => r.total || 0 },
      ],
      {
        title: 'REKAPITULASI IURAN KAS BULANAN KELAS HOARIZON',
        subtitle: `Bulan: ${monthLabel} (Iuran Wajib Rp5.000 / Minggu)`,
        summaryRows: [
          { label: 'Total Iuran Masuk Terkumpul', value: formatRupiah(totalCollected) },
          { label: 'Total Anggota Kelas', value: `${filteredMembers.length} siswa` },
        ],
      }
    );
  };

  // Filter members list
  const filteredMembers = data.members.filter((m) =>
    m.name.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)] flex items-center gap-2">
            <span>📋</span> Iuran Kas Bulanan (Monthly Contributions)
          </h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Pencatatan iuran kas kelas per anggota — {getMonthName(selectedMonth)} {selectedYear}
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

          <Button variant="secondary" size="sm" onClick={handleExport}>
            📥 Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => openSubmitModal()}>
            + Ajukan Pembayaran Saya
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-4 bg-emerald-50/60 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-800">Total Kas Terkumpul</p>
          <p className="text-xl font-black text-emerald-700 font-[var(--font-display)] mt-1">
            {formatRupiah(data.totalCollected)}
          </p>
          <span className="text-[10px] text-emerald-600">Periode {getMonthName(selectedMonth)} {selectedYear}</span>
        </Card>

        <Card className="!p-4 bg-amber-50/70 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800">Menunggu Konfirmasi</p>
            {data.pendingSubmissions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-xl font-black text-amber-900 font-[var(--font-display)] mt-1">
            {data.pendingSubmissions.length} Pengajuan
          </p>
          <span className="text-[10px] text-amber-700 font-semibold">
            {canVerify ? 'Perlu tindakan pengurus' : 'Sedang ditinjau'}
          </span>
        </Card>

        <Card className="!p-4 bg-rose-50/50 border border-rose-200">
          <p className="text-xs font-bold text-rose-800">Sisa Tagihan Kelas</p>
          <p className="text-xl font-black text-rose-700 font-[var(--font-display)] mt-1">
            {formatRupiah(data.totalPending)}
          </p>
          <span className="text-[10px] text-rose-600">{data.unpaidCount} siswa belum tuntas</span>
        </Card>

        <Card className="!p-4 bg-slate-50 border border-slate-200">
          <p className="text-xs font-bold text-slate-700">Total Anggota Kelas</p>
          <p className="text-xl font-black text-slate-900 font-[var(--font-display)] mt-1">
            {data.membersCount} Siswa
          </p>
          <span className="text-[10px] text-slate-500">Anggota aktif terdaftar</span>
        </Card>
      </div>

      {/* ========================================== */}
      {/* PENDING SUBMISSIONS BANNER */}
      {/* ========================================== */}
      {data.pendingSubmissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-2 border-amber-300 rounded-2xl shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shadow-sm">
                🔔
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  {data.pendingSubmissions.length} Pengajuan Pembayaran Menunggu Konfirmasi
                </h3>
                <p className="text-xs text-amber-800/80">
                  {canVerify
                    ? 'Sebagai Pengurus (Class Leader / Secretary), Anda dapat meninjau bukti transfer dan mengonfirmasi pembayaran.'
                    : 'Daftar pengajuan pembayaran yang sedang menunggu verifikasi oleh Ketua Kelas / Sekretaris.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {data.pendingSubmissions.map((p) => (
              <div
                key={p.paymentId}
                className="flex items-center justify-between p-2.5 bg-white border border-amber-200 rounded-xl shadow-xs hover:border-amber-400 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {p.userName} {isMe(p.userId) && <span className="text-[10px] text-blue-600 font-bold">(Anda)</span>}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Minggu {p.weekNumber} • <strong className="text-slate-800">{formatRupiah(p.amount)}</strong> ({p.methodCode})
                  </p>
                  <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                    ⏳ Menunggu Konfirmasi
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setSelectedPending(p);
                      setIsRejectMode(false);
                      setRejectionReason('');
                      setIsVerifyOpen(true);
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {canVerify ? '🔍 Tinjau' : '👁️ Bukti'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Table Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-[var(--font-display)]">
              Tabel Matriks Iuran — {getMonthName(selectedMonth)} {selectedYear}
            </h3>
            <p className="text-xs text-slate-500">
              Setiap anggota hanya dapat mengisi pembayaran untuk akunnya sendiri. Klik sel untuk melihat bukti atau status.
            </p>
          </div>

          <input
            type="text"
            placeholder="🔍 Cari nama siswa..."
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)] w-full sm:w-64"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            <span className="inline-block animate-spin mr-2">🌀</span> Memuat data matriks kas...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Tidak ada data siswa yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-3 text-xs font-bold text-slate-700">Nama Siswa</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-slate-700">M1</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-slate-700">M2</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-slate-700">M3</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-slate-700">M4</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-slate-700">Total Terbayar</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, i) => {
                  const userIsMe = isMe(m.userId);

                  return (
                    <motion.tr
                      key={m.userId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className={`border-b border-slate-100 transition-colors ${
                        userIsMe
                          ? 'bg-blue-50/50 hover:bg-blue-50/80 font-medium'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-slate-900">{m.name}</p>
                          {userIsMe && (
                            <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-md">
                              Anda
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {m.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>

                      {/* W1 to W4 Chips */}
                      {[1, 2, 3, 4].map((wNum) => {
                        const detail = m.weeksDetail?.[wNum] || {
                          status: 'UNPAID',
                          methodCode: 'CASH',
                          methodName: 'Tunai',
                          amount: 25000,
                        };

                        const isPaid = detail.status === 'PAID';
                        const isPending = detail.status === 'PENDING';
                        const isUnpaid = !isPaid && !isPending;

                        return (
                          <td key={wNum} className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (isPending) {
                                  // Open verification / review modal
                                  const pendingItem: PendingSubmission = {
                                    paymentId: detail.paymentId || '',
                                    userId: m.userId,
                                    userName: m.name,
                                    weekNumber: wNum,
                                    amount: detail.amount || 25000,
                                    methodCode: detail.methodCode || 'SPAY',
                                    methodName: detail.methodName || 'SPay',
                                    evidenceId: detail.evidenceId,
                                    evidenceUrl: detail.evidenceUrl,
                                    evidenceFileName: detail.evidenceFileName,
                                    paidAt: detail.paidAt,
                                  };
                                  setSelectedPending(pendingItem);
                                  setIsRejectMode(false);
                                  setRejectionReason('');
                                  setIsVerifyOpen(true);
                                } else if (isPaid) {
                                  // Show paid detail & evidence modal (read-only)
                                  setSelectedCellDetail({
                                    userId: m.userId,
                                    userName: m.name,
                                    weekNumber: wNum,
                                    detail,
                                  });
                                } else {
                                  // Unpaid
                                  if (userIsMe || canVerify) {
                                    openSubmitModal(m.userId, wNum);
                                  } else {
                                    setUnpaidInfoModal({ userName: m.name, weekNumber: wNum });
                                  }
                                }
                              }}
                              className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:scale-105 cursor-pointer shadow-2xs ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                  : userIsMe || canVerify
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={
                                isPaid
                                  ? `Lunas via ${detail.methodCode}. Klik untuk lihat bukti transfer`
                                  : isPending
                                  ? 'Pengajuan sedang menunggu konfirmasi. Klik untuk meninjau bukti'
                                  : userIsMe
                                  ? 'Belum bayar. Klik untuk mengajukan pembayaran Anda'
                                  : canVerify
                                  ? 'Belum bayar. Klik untuk mencatat pengajuan atas nama siswa'
                                  : `${m.name} belum membayar kas minggu ${wNum}`
                              }
                            >
                              {isPaid && `✓ ${detail.methodCode}`}
                              {isPending && '⏳ Pending'}
                              {isUnpaid && (userIsMe || canVerify ? '+ Bayar' : 'Belum')}
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-right">
                        <span className="font-black text-xs text-emerald-700 font-[var(--font-display)]">
                          {formatRupiah(m.total)}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        {userIsMe || canVerify ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!h-7 !text-[10px] !px-2 text-blue-600 hover:bg-blue-50"
                            onClick={() => openSubmitModal(m.userId)}
                            title={userIsMe ? 'Ajukan Pembayaran Kas Saya' : 'Ajukan Pembayaran'}
                          >
                            + Ajukan
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================== */}
      {/* MODAL PENGAJUAN PEMBAYARAN KAS (DRAG & DROP) */}
      {/* ========================================== */}
      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title="+ Ajukan Pembayaran Uang Kas">
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nama Siswa</label>
            {canVerify ? (
              <select
                value={submitForm.userId}
                onChange={(e) => setSubmitForm({ ...submitForm, userId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white outline-none"
              >
                {data.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} {isMe(m.userId) ? '(Akun Anda)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Pengajuan Atas Nama:</span>
                  <span className="text-xs font-bold text-slate-900">
                    {currentMember?.name || 'Akun Anda'}
                  </span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  Akun Anda
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Minggu Iuran</label>
              <select
                value={submitForm.weekNumber}
                onChange={(e) => setSubmitForm({ ...submitForm, weekNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white outline-none"
              >
                <option value={1}>Minggu 1 (W1)</option>
                <option value={2}>Minggu 2 (W2)</option>
                <option value={3}>Minggu 3 (W3)</option>
                <option value={4}>Minggu 4 (W4)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Metode Bayar</label>
              <select
                value={submitForm.methodCode}
                onChange={(e) => setSubmitForm({ ...submitForm, methodCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white outline-none"
              >
                <option value="SPAY">SPay / QRIS</option>
                <option value="SEABANK">SeaBank / Transfer</option>
                <option value="CASH">CASH (Tunai)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nominal Iuran</label>
            <CurrencyInput
              readOnly
              value={submitForm.amount}
              onChange={(val) => setSubmitForm({ ...submitForm, amount: val })}
            />
          </div>

          {/* DRAG AND DROP ZONE UNTUK BUKTI TRANSFER */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Unggah Foto Bukti Transfer / Slip Pembayaran <span className="text-rose-600">*</span>
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 scale-102'
                  : submitForm.receiptBase64
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {submitForm.receiptBase64 ? (
                <div className="space-y-2">
                  <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                    <img
                      src={submitForm.receiptBase64}
                      alt="Preview Slip"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-bold text-emerald-800 truncate">
                    {submitForm.receiptFileName}
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    {(submitForm.receiptFileSize / 1024).toFixed(1)} KB • Klik / Tarik file baru untuk mengganti
                  </p>
                </div>
              ) : (
                <div className="py-3">
                  <span className="text-3xl block mb-1">📸</span>
                  <p className="text-xs font-bold text-slate-800">
                    Tarik & Lepaskan Bukti Transfer di sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    atau <span className="text-blue-600 underline font-semibold">Pilih Berkas</span> dari perangkat
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Format: JPG, PNG, WEBP (Maksimal 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-0.5">
            <p className="font-bold">ℹ️ Alur Verifikasi:</p>
            <p>
              Setelah dikirim, status akan menjadi <strong>⏳ PENDING</strong> sampai diverifikasi oleh Ketua Kelas, Wakil Ketua, atau Sekretaris.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsSubmitOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim...' : '🚀 Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL VERIFIKASI / LIHAT BUKTI PENDING */}
      {/* ========================================== */}
      <Modal
        isOpen={isVerifyOpen}
        onClose={() => {
          setIsVerifyOpen(false);
          setSelectedPending(null);
        }}
        title={canVerify ? '🔍 Tinjau & Konfirmasi Pembayaran Kas' : '👁️ Bukti Pembayaran (Pending)'}
      >
        {selectedPending && (
          <div className="space-y-4">
            {/* Info Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{selectedPending.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Iuran:</span>
                <span className="font-bold text-slate-900">Minggu ke-{selectedPending.weekNumber} (Agustus 2026)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nominal:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(selectedPending.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Metode Bayar:</span>
                <span className="font-bold text-blue-700">{selectedPending.methodCode} ({selectedPending.methodName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-amber-700">⏳ Sedang Menunggu Verifikasi Pengurus</span>
              </div>
            </div>

            {/* Bukti Transfer Image Preview */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Bukti Transfer / Struk Terlampir:
              </label>
              {selectedPending.evidenceUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-64 flex items-center justify-center p-2">
                  <img
                    src={selectedPending.evidenceUrl}
                    alt="Bukti Transfer"
                    className="max-h-60 max-w-full object-contain rounded-xl shadow-xs"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                  Tidak ada lampiran foto bukti.
                </p>
              )}
            </div>

            {/* Rejection Input (if in reject mode) */}
            {isRejectMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 p-3 bg-rose-50 border border-rose-200 rounded-xl"
              >
                <label className="text-xs font-bold text-rose-900 block">
                  Alasan Penolakan (Opsional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Foto bukti buram, nominal tidak sesuai..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-xs outline-none bg-white"
                />
              </motion.div>
            )}

            {/* Actions */}
            {canVerify ? (
              <div className="space-y-2 pt-2">
                {!isRejectMode ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      className="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white font-bold"
                      onClick={() => setIsRejectMode(true)}
                      disabled={isSubmitting}
                    >
                      ❌ Tolak Pengajuan
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      className="flex-1 font-bold !bg-emerald-600 hover:!bg-emerald-700"
                      onClick={() => handleVerifySubmit('PAID')}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Memproses...' : '✅ Setujui & Catat ke Kas'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setIsRejectMode(false)}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white font-bold"
                      onClick={() => handleVerifySubmit('REJECTED')}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Memproses...' : 'Konfirmasi Tolak'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full font-bold"
                  onClick={() => setIsVerifyOpen(false)}
                >
                  Tutup
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL DETAIL PEMBAYARAN LUNAS (READ-ONLY) */}
      {/* ========================================== */}
      <Modal
        isOpen={!!selectedCellDetail}
        onClose={() => setSelectedCellDetail(null)}
        title="✓ Detail Pembayaran Uang Kas"
      >
        {selectedCellDetail && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{selectedCellDetail.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Iuran:</span>
                <span className="font-bold text-slate-900">Minggu ke-{selectedCellDetail.weekNumber} (Agustus 2026)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-emerald-700">✓ LUNAS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nominal:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(selectedCellDetail.detail.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Metode Bayar:</span>
                <span className="font-bold text-slate-800">{selectedCellDetail.detail.methodCode}</span>
              </div>
              {selectedCellDetail.detail.paidAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Waktu Bayar:</span>
                  <span className="text-slate-700">{selectedCellDetail.detail.paidAt}</span>
                </div>
              )}
            </div>

            {selectedCellDetail.detail.evidenceUrl && (
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Lampiran Bukti Transfer / Nota:
                </label>
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-60 flex items-center justify-center p-2 bg-slate-50">
                  <img
                    src={selectedCellDetail.detail.evidenceUrl}
                    alt="Bukti Transfer"
                    className="max-h-56 max-w-full object-contain rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                className="w-full font-bold"
                onClick={() => setSelectedCellDetail(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL INFO STATUS BELUM BAYAR ORANG LAIN */}
      {/* ========================================== */}
      <Modal
        isOpen={!!unpaidInfoModal}
        onClose={() => setUnpaidInfoModal(null)}
        title="ℹ️ Status Pembayaran"
      >
        {unpaidInfoModal && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <span className="text-3xl block">⏳</span>
              <p className="text-sm font-bold text-slate-800">
                {unpaidInfoModal.userName}
              </p>
              <p className="text-xs text-slate-500">
                Belum melakukan pembayaran kas untuk <strong>Minggu ke-{unpaidInfoModal.weekNumber}</strong>.
              </p>
              <p className="text-[11px] text-slate-400 mt-2 bg-white p-2 rounded-xl border border-slate-100">
                🔒 Sesuai kebijakan privasi kelas, setiap anggota hanya dapat mengajukan pembayaran untuk akunnya sendiri.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full font-bold"
              onClick={() => setUnpaidInfoModal(null)}
            >
              Mengerti
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
