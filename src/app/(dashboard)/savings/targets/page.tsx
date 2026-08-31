'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { formatRupiah } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import {
  getSavingsTargetsAction,
  createSavingsTargetAction,
  updateSavingsTargetAction,
  deleteSavingsTargetAction,
  submitTargetContributionAction,
  verifyTargetContributionAction,
  getMembersAction,
} from '@/lib/actions/db-actions';

interface TargetParticipantStatus {
  userId: string;
  name: string;
  role: string;
  roleCode?: string;
  status: 'LUNAS' | 'PENDING' | 'UNPAID';
  amount: number;
  evidenceUrl?: string;
  evidenceFileName?: string;
  contributedAt?: string;
}

interface SavingsTargetItem {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate: string;
  status: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'ROLE_BASED';
  progress: number;
  createdBy: string;
  createdById?: string;
  allowedUsers?: { userId: string; name: string }[];
  allowedUserIds?: string[];
  splitScheme?: 'EQUAL_SPLIT' | 'VOLUNTARY' | 'FIXED_AMOUNT';
  fixedAmount?: number;
  nominalPerPerson?: number;
  participantCount?: number;
  participants?: TargetParticipantStatus[];
  paidCount?: number;
  pendingCount?: number;
  unpaidCount?: number;
  currentUserStatus?: 'LUNAS' | 'PENDING' | 'UNPAID' | null;
  currentUserAmount?: number;
  canManage?: boolean;
}

interface PendingTargetSubmission {
  contributorId: string;
  targetId: string;
  targetName: string;
  userId: string;
  userName: string;
  amount: number;
  evidenceId?: string;
  evidenceUrl?: string;
  evidenceFileName?: string;
  contributedAt?: string;
}

interface MemberOption {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  roleCode?: string;
  gender: string;
}

const statusColors: Record<string, string> = {
  PLANNED: 'pending',
  ACTIVE: 'income',
  PAUSED: 'info',
  ACHIEVED: 'denim',
  CANCELLED: 'expense',
};

const TARGET_ADMIN_ROLES = ['CLASS_LEADER', 'VICE_CLASS_LEADER', 'TREASURER_1', 'SECRETARY_1', 'SECRETARY_2'];

export default function SavingsTargetsPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [dataState, setDataState] = useState<{
    targets: SavingsTargetItem[];
    pendingSubmissions: PendingTargetSubmission[];
    canManage: boolean;
    currentUserId: string | null;
    currentUserRole: string;
  }>({
    targets: [],
    pendingSubmissions: [],
    canManage: false,
    currentUserId: null,
    currentUserRole: 'CLASS_MEMBER',
  });

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search
  const [searchTarget, setSearchTarget] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('ALL');
  const [filterScheme, setFilterScheme] = useState('ALL');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [previewEvidenceUrl, setPreviewEvidenceUrl] = useState<string | null>(null);

  const [selectedTarget, setSelectedTarget] = useState<SavingsTargetItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<SavingsTargetItem | null>(null);
  const [selectedPending, setSelectedPending] = useState<PendingTargetSubmission | null>(null);

  // Detail Modal Filter: ALL | LUNAS | PENDING | UNPAID
  const [detailStatusFilter, setDetailStatusFilter] = useState<'ALL' | 'LUNAS' | 'PENDING' | 'UNPAID'>('ALL');
  const [detailMemberSearch, setDetailMemberSearch] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rejection state
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);

  // Form states for Target creation & edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'ROLE_BASED',
    status: 'ACTIVE' as 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'ACHIEVED' | 'CANCELLED',
    allowedUserIds: [] as string[],
    splitScheme: 'EQUAL_SPLIT' as 'EQUAL_SPLIT' | 'VOLUNTARY' | 'FIXED_AMOUNT',
    fixedAmount: 0,
  });

  // Form states for Paying / Contributing to target
  const [payForm, setPayForm] = useState({
    targetId: '',
    targetName: '',
    userId: '',
    amount: 20000,
    methodCode: 'SPAY',
    receiptBase64: '',
    receiptFileName: '',
    receiptFileType: '',
    receiptFileSize: 0,
    note: '',
  });

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search member in modal
  const [memberSearch, setMemberSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [targetsRes, membersRes] = await Promise.all([
          getSavingsTargetsAction(),
          getMembersAction(),
        ]);
        if (isMounted) {
          setDataState(targetsRes as any);
          setMembers(membersRes as unknown as MemberOption[]);

          // If detailTarget is currently open, keep it updated
          if (detailTarget) {
            const updated = (targetsRes as any)?.targets?.find((t: SavingsTargetItem) => t.id === detailTarget.id);
            if (updated) setDetailTarget(updated);
          }
        }
      } catch (err) {
        console.error('Error loading savings targets & members:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (!isPermLoading && !hasAccess('target')) {
    return <AccessGate moduleName="Target Tabungan Bersama" />;
  }

  const canManage = dataState.canManage || TARGET_ADMIN_ROLES.includes(dataState.currentUserRole);
  const currentMember = members.find((m) => m.userId === dataState.currentUserId);

  const handleExport = () => {
    const totalTarget = filteredTargets.reduce((sum, t) => sum + t.targetAmount, 0);
    const totalCollected = filteredTargets.reduce((sum, t) => sum + t.currentAmount, 0);

    exportToCSV(
      'Target_Tabungan_Kelas_Hoarizon',
      filteredTargets,
      [
        { header: 'Nama Target Tabungan', key: 'name' },
        { header: 'Target Dana (Rp)', key: (r) => (r.targetAmount > 0 ? formatRupiah(r.targetAmount) : 'Sukarela / Bebas') },
        { header: 'Dana Terkumpul (Rp)', key: (r) => formatRupiah(r.currentAmount) },
        { header: 'Capaian Progress (%)', key: (r) => `${r.progress}%` },
        {
          header: 'Skema Pembagian',
          key: (r) =>
            r.splitScheme === 'EQUAL_SPLIT'
              ? 'Bagi Rata (Target ÷ Total Peserta)'
              : r.splitScheme === 'FIXED_AMOUNT'
              ? `Nominal Tetap (${formatRupiah(r.fixedAmount || 0)})`
              : 'Seikhlasnya (Sukarela)',
        },
        { header: 'Nominal/Org (Rp)', key: (r) => (r.nominalPerPerson ? formatRupiah(r.nominalPerPerson) : 'Bebas') },
        { header: 'Jumlah Lunas (Org)', key: (r) => `${r.paidCount || 0} orang` },
        { header: 'Menunggu Verifikasi (Org)', key: (r) => `${r.pendingCount || 0} orang` },
        { header: 'Belum Bayar (Org)', key: (r) => `${r.unpaidCount || 0} orang` },
        { header: 'Tenggat Waktu', key: (r) => (r.targetDate || '—') },
        { header: 'Status Target', key: (r) => (r.status === 'ACTIVE' ? 'Aktif' : r.status === 'COMPLETED' ? 'Tercapai (Selesai)' : r.status) },
        { header: 'Visibilitas', key: (r) => (r.visibility === 'PUBLIC' ? 'Publik (Semua Anggota)' : 'Privat (Anggota Terpilih)') },
      ],
      {
        title: 'DAFTAR TARGET TABUNGAN BERSAMA KELAS HOARIZON',
        subtitle: 'Laporan Capaian Target Tabungan, Skema Iuran, dan Status Pembayaran Anggota',
        summaryRows: [
          { label: 'Total Nominal Target Dana', value: formatRupiah(totalTarget) },
          { label: 'Total Dana Terkumpul', value: formatRupiah(totalCollected) },
          { label: 'Total Target Tabungan', value: `${filteredTargets.length} target program` },
        ],
      }
    );
  };

  const handleToggleMember = (userId: string) => {
    setFormData((prev) => {
      const exists = prev.allowedUserIds.includes(userId);
      return {
        ...prev,
        allowedUserIds: exists
          ? prev.allowedUserIds.filter((id) => id !== userId)
          : [...prev.allowedUserIds, userId],
      };
    });
  };

  const handleSelectAllMembers = () => {
    setFormData((prev) => ({
      ...prev,
      allowedUserIds: members.map((m) => m.userId),
    }));
  };

  const handleClearAllMembers = () => {
    setFormData((prev) => ({
      ...prev,
      allowedUserIds: [],
    }));
  };

  // Drag & Drop handlers
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
      setPayForm((prev) => ({
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

  // Open Payment Modal for a target
  const openPayModal = (t: SavingsTargetItem) => {
    const defaultAmount =
      t.splitScheme === 'FIXED_AMOUNT' && t.fixedAmount
        ? t.fixedAmount
        : t.nominalPerPerson && t.nominalPerPerson > 0
        ? t.nominalPerPerson
        : 25000;

    setPayForm({
      targetId: t.id,
      targetName: t.name,
      userId: dataState.currentUserId || (members[0]?.userId ?? ''),
      amount: defaultAmount,
      methodCode: 'SPAY',
      receiptBase64: '',
      receiptFileName: '',
      receiptFileType: '',
      receiptFileSize: 0,
      note: '',
    });
    setIsPayOpen(true);
  };

  // Submit Target Payment
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount || payForm.amount <= 0) {
      toast.warning('Masukkan nominal iuran yang valid.');
      return;
    }
    if (!payForm.receiptBase64) {
      toast.warning('Harap unggah bukti transfer / slip pembayaran.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitTargetContributionAction({
      targetId: payForm.targetId,
      amount: payForm.amount,
      userId: canManage ? payForm.userId : dataState.currentUserId || undefined,
      methodCode: payForm.methodCode,
      receiptBase64: payForm.receiptBase64,
      receiptFileName: payForm.receiptFileName,
      receiptFileType: payForm.receiptFileType,
      receiptFileSize: payForm.receiptFileSize,
      note: payForm.note,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsPayOpen(false);
      setRefreshKey((k) => k + 1);
      toast.success('Pengajuan setoran iuran target berhasil dikirim dan sedang menunggu verifikasi pengurus.', 'Setoran Diajukan');
    } else {
      toast.error('Gagal mengajukan setoran: ' + res.error);
    }
  };

  // Verify / Confirm Target Payment
  const handleVerifySubmit = async (status: 'PAID' | 'REJECTED') => {
    if (!selectedPending) return;
    setIsSubmitting(true);
    const res = await verifyTargetContributionAction({
      contributorId: selectedPending.contributorId,
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsVerifyOpen(false);
      setSelectedPending(null);
      setIsRejectMode(false);
      setRejectionReason('');
      setRefreshKey((k) => k + 1);
      if (status === 'PAID') {
        toast.verified('Setoran Target Tabungan', 'Setoran anggota telah berhasil disetujui (LUNAS).');
      } else {
        toast.error('Pengajuan setoran iuran telah ditolak.', 'Setoran Ditolak');
      }
    } else {
      toast.error('Gagal memverifikasi: ' + res.error);
    }
  };

  // Calculate live preview per person in modal
  const calculateModalPerPerson = () => {
    const target = formData.targetAmount || 0;
    if (formData.splitScheme === 'VOLUNTARY') return 0;
    if (formData.splitScheme === 'FIXED_AMOUNT') return formData.fixedAmount || 0;

    // EQUAL_SPLIT
    const count =
      formData.visibility === 'PRIVATE'
        ? Math.max(1, formData.allowedUserIds.length)
        : Math.max(1, members.length);
    return target > 0 ? Math.ceil(target / count) : 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Masukkan nama target tabungan yang valid.');
      return;
    }

    if (formData.visibility === 'PRIVATE' && formData.allowedUserIds.length === 0) {
      const ok = await confirm({
        title: 'Target Tabungan Private',
        description: 'Anda belum memilih anggota untuk target Private ini. Hanya akun Anda yang dapat melihatnya. Apakah Anda ingin melanjutkan?',
        confirmText: 'Ya, Lanjutkan Simpan',
        cancelText: 'Pilih Anggota Dulu',
        type: 'warning',
      });
      if (!ok) {
        return;
      }
    }

    setIsSubmitting(true);
    const res = await createSavingsTargetAction({
      name: formData.name.trim(),
      description: formData.description.trim(),
      targetAmount: formData.targetAmount || 0,
      currentAmount: formData.currentAmount || 0,
      targetDate: formData.targetDate || undefined,
      visibility: formData.visibility,
      allowedUserIds: formData.visibility === 'PRIVATE' ? formData.allowedUserIds : undefined,
      splitScheme: formData.splitScheme,
      fixedAmount: formData.splitScheme === 'FIXED_AMOUNT' ? formData.fixedAmount : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAddOpen(false);
      toast.created('Target Tabungan', `Program target "${formData.name.trim()}" berhasil dibuat.`);
      setFormData({
        name: '',
        description: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: '',
        visibility: 'PUBLIC',
        status: 'ACTIVE',
        allowedUserIds: [],
        splitScheme: 'EQUAL_SPLIT',
        fixedAmount: 0,
      });
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal membuat target: ' + res.error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    setIsSubmitting(true);
    const res = await updateSavingsTargetAction(selectedTarget.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      targetAmount: formData.targetAmount || 0,
      currentAmount: formData.currentAmount || 0,
      targetDate: formData.targetDate || undefined,
      status: formData.status,
      visibility: formData.visibility,
      allowedUserIds: formData.visibility === 'PRIVATE' ? formData.allowedUserIds : undefined,
      splitScheme: formData.splitScheme,
      fixedAmount: formData.splitScheme === 'FIXED_AMOUNT' ? formData.fixedAmount : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsEditOpen(false);
      toast.updated('Target Tabungan', `Target tabungan "${formData.name.trim()}" berhasil diperbarui.`);
      setSelectedTarget(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal memperbarui target: ' + res.error);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedTarget) return;
    setIsSubmitting(true);
    const res = await deleteSavingsTargetAction(selectedTarget.id);
    setIsSubmitting(false);
    if (res.success) {
      setIsDeleteOpen(false);
      toast.deleted('Target Tabungan', `Target tabungan "${selectedTarget.name}" telah berhasil dihapus.`);
      setSelectedTarget(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal menghapus target: ' + res.error);
    }
  };

  const openEditModal = (t: SavingsTargetItem) => {
    setSelectedTarget(t);
    setFormData({
      name: t.name,
      description: t.description,
      targetAmount: t.targetAmount || 0,
      currentAmount: t.currentAmount || 0,
      targetDate: t.targetDate === '—' ? '' : t.targetDate,
      visibility: t.visibility || 'PUBLIC',
      status: (t.status as 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'ACHIEVED' | 'CANCELLED') || 'ACTIVE',
      allowedUserIds: t.allowedUserIds || [],
      splitScheme: t.splitScheme || 'EQUAL_SPLIT',
      fixedAmount: t.fixedAmount || 0,
    });
    setMemberSearch('');
    setIsEditOpen(true);
  };

  const openDeleteModal = (t: SavingsTargetItem) => {
    setSelectedTarget(t);
    setIsDeleteOpen(true);
  };

  // Filter members list by search query
  const filteredModalMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Filtered targets on the page
  const filteredTargets = dataState.targets.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTarget.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTarget.toLowerCase());
    const matchVis = filterVisibility === 'ALL' || t.visibility === filterVisibility;
    const matchScheme = filterScheme === 'ALL' || t.splitScheme === filterScheme;
    return matchSearch && matchVis && matchScheme;
  });

  // Filter participants in Detail Target Modal
  const filteredDetailParticipants = (detailTarget?.participants || []).filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(detailMemberSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(detailMemberSearch.toLowerCase());
    const matchStatus = detailStatusFilter === 'ALL' || p.status === detailStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)]">
            🎯 Savings Targets & Penggalangan
          </h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Target tabungan bersama, setor iuran target, transparansi status Lunas / Belum Bayar ({dataState.targets.length} Target Aktif)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            📥 Export CSV
          </Button>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormData({
                  name: '',
                  description: '',
                  targetAmount: 0,
                  currentAmount: 0,
                  targetDate: '',
                  visibility: 'PUBLIC',
                  status: 'ACTIVE',
                  allowedUserIds: [],
                  splitScheme: 'EQUAL_SPLIT',
                  fixedAmount: 0,
                });
                setMemberSearch('');
                setIsAddOpen(true);
              }}
            >
              + Buat Target Baru
            </Button>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* PENDING TARGET CONTRIBUTIONS BANNER */}
      {/* ========================================== */}
      {dataState.pendingSubmissions.length > 0 && (
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
                  {dataState.pendingSubmissions.length} Setoran Iuran Target Menunggu Konfirmasi
                </h3>
                <p className="text-xs text-amber-800/80">
                  {canManage
                    ? 'Sebagai Pengurus, Anda dapat meninjau bukti transfer dan mengonfirmasi status LUNAS siswa.'
                    : 'Setoran iuran tabungan sedang menunggu verifikasi oleh Pengurus Kelas.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {dataState.pendingSubmissions.map((p) => (
              <div
                key={p.contributorId}
                className="flex items-center justify-between p-2.5 bg-white border border-amber-200 rounded-xl shadow-xs hover:border-amber-400 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {p.userName} {p.userId === dataState.currentUserId && <span className="text-[10px] text-blue-600 font-bold">(Anda)</span>}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium truncate">
                    Target: <strong className="text-slate-800">{p.targetName}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-700 font-black mt-0.5">
                    {formatRupiah(p.amount)}
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
                    {canManage ? '🔍 Tinjau' : '👁️ Bukti'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter Bar */}
      <Card className="!p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Visibilitas:</span>
            <div className="flex gap-1 bg-[var(--color-baby-blue-50)] p-1 rounded-lg">
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'PUBLIC', label: '🌐 Publik' },
                { key: 'ROLE_BASED', label: '🔐 Pengurus' },
                { key: 'PRIVATE', label: '🔒 Private' },
              ].map((vis) => (
                <button
                  key={vis.key}
                  onClick={() => setFilterVisibility(vis.key)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    filterVisibility === vis.key
                      ? 'bg-[var(--color-denim)] text-white font-bold'
                      : 'text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)]'
                  }`}
                >
                  {vis.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-800 ml-2">Skema:</span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'EQUAL_SPLIT', label: '⚖️ Bagi Rata' },
                { key: 'FIXED_AMOUNT', label: '📌 Tetap' },
                { key: 'VOLUNTARY', label: '🌱 Seikhlasnya' },
              ].map((sch) => (
                <button
                  key={sch.key}
                  onClick={() => setFilterScheme(sch.key)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    filterScheme === sch.key
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sch.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Cari target tabungan..."
            value={searchTarget}
            onChange={(e) => setSearchTarget(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)] w-full md:w-56"
          />
        </div>
      </Card>

      {/* Targets Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
          <span className="inline-block animate-spin mr-2">🌀</span> Memuat target tabungan...
        </div>
      ) : filteredTargets.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            <span className="text-4xl mb-2 block">🎯</span>
            <p className="font-bold text-slate-800">Tidak ada target tabungan yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">
              Buat target baru atau ubah filter pencarian di atas
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTargets.map((target, i) => {
            const hasTargetAmount = target.targetAmount > 0;
            const remaining = hasTargetAmount ? Math.max(0, target.targetAmount - target.currentAmount) : 0;
            const isPrivate = target.visibility === 'PRIVATE';
            const participantCount = target.participants?.length || target.participantCount || 0;
            const paidCount = target.paidCount || 0;
            const pendingCount = target.pendingCount || 0;
            const unpaidCount = target.unpaidCount || 0;

            return (
              <motion.div
                key={target.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Card className="relative overflow-hidden hover:shadow-[var(--shadow-puffy-lg)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full border border-slate-200/80 shadow-sm">
                  {/* Top Bar Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {isPrivate ? (
                            <button
                              onClick={() => {
                                setDetailTarget(target);
                                setDetailStatusFilter('ALL');
                                setDetailMemberSearch('');
                              }}
                              className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Klik untuk melihat peserta target private ini"
                            >
                              <span>🔒 Private</span>
                              <span className="bg-rose-200/70 px-1 rounded-full text-[9px]">
                                {participantCount} Siswa
                              </span>
                            </button>
                          ) : target.visibility === 'ROLE_BASED' ? (
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                              🔐 Pengurus ({participantCount} Siswa)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              🌐 Publik ({participantCount} Siswa)
                            </span>
                          )}
                          <Badge variant={statusColors[target.status] as any} className="text-[9px]">
                            {target.status}
                          </Badge>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 font-[var(--font-display)] truncate" title={target.name}>
                          {target.name}
                        </h3>
                        {target.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {target.description}
                          </p>
                        )}
                      </div>

                      {/* Edit/Delete Buttons (Strictly for 5 Target Admin Roles) */}
                      {canManage && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditModal(target)}
                            className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                            title="Edit Target & Pembagian"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDeleteModal(target)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 text-xs cursor-pointer"
                            title="Hapus Target"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Amount & Progress */}
                    <div className="mb-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <AnimatedCounter
                          value={target.currentAmount}
                          isCurrency
                          className="text-lg font-black text-[var(--color-denim)] font-[var(--font-display)]"
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          {hasTargetAmount ? `/ ${formatRupiah(target.targetAmount)}` : '(Target Bebas)'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {hasTargetAmount ? (
                        <>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${target.progress}%` }}
                              transition={{ delay: 0.2 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${
                                target.progress >= 100
                                  ? 'bg-emerald-500'
                                  : 'bg-gradient-to-r from-blue-500 to-[var(--color-denim)]'
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="font-bold text-[var(--color-denim)]">{target.progress}% Terkumpul</span>
                            <span className="text-slate-500 font-medium">
                              Sisa: {formatRupiah(remaining)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          ✓ Penggalangan dana sukarela berjalan
                        </div>
                      )}
                    </div>

                    {/* SPLIT SCHEME BADGE / INFO */}
                    <div className="mb-2 p-2 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                          {target.splitScheme === 'VOLUNTARY'
                            ? '🌱'
                            : target.splitScheme === 'FIXED_AMOUNT'
                            ? '📌'
                            : '⚖️'}
                        </span>
                        <div>
                          <p className="text-[10px] text-blue-900 font-bold leading-tight">
                            {target.splitScheme === 'VOLUNTARY'
                              ? 'Seikhlasnya / Sukarela'
                              : target.splitScheme === 'FIXED_AMOUNT'
                              ? `Nominal Ditetapkan`
                              : `Bagi Rata (Target ÷ Peserta)`}
                          </p>
                          <p className="text-[11px] font-black text-blue-800">
                            {target.splitScheme === 'VOLUNTARY' || (!hasTargetAmount && target.splitScheme === 'EQUAL_SPLIT')
                              ? 'Bebas'
                              : `${formatRupiah(target.nominalPerPerson || 0)} / orang`}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-blue-700 bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                        {isPrivate ? `${participantCount} Siswa` : 'Semua Anggota'}
                      </span>
                    </div>

                    {/* ========================================== */}
                    {/* STATUS LUNAS / BELUM BAYAR SUMMARY IN CARD */}
                    {/* ========================================== */}
                    <div className="mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                      {/* Current User Status Banner */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">Status Anda:</span>
                        {target.currentUserStatus === 'LUNAS' ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                            ✓ LUNAS ({formatRupiah(target.currentUserAmount || 0)})
                          </span>
                        ) : target.currentUserStatus === 'PENDING' ? (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                            ⏳ MENUNGGU KONFIRMASI
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                            ❌ BELUM BAYAR
                          </span>
                        )}
                      </div>

                      {/* Collective Status Counter */}
                      <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200/60 font-semibold">
                        <span className="text-emerald-700 font-bold">✅ {paidCount} Lunas</span>
                        <span className="text-amber-700 font-bold">⏳ {pendingCount} Pending</span>
                        <span className="text-rose-700 font-bold">❌ {unpaidCount} Belum</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar / Setor Button & Footer */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full !py-1.5 !text-xs font-bold shadow-xs !bg-emerald-600 hover:!bg-emerald-700"
                      onClick={() => openPayModal(target)}
                    >
                      💳 Setor / Bayar Iuran Target
                    </Button>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>📅 Tenggat: {target.targetDate || 'Fleksibel'}</span>
                      <button
                        onClick={() => {
                          setDetailTarget(target);
                          setDetailStatusFilter('ALL');
                          setDetailMemberSearch('');
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Detail & Status Peserta →
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL SETOR / BAYAR IURAN TARGET */}
      {/* ========================================== */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title={`💳 Setor Iuran Target: ${payForm.targetName}`}>
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nama Siswa / Pembayar</label>
            {canManage ? (
              <select
                value={payForm.userId}
                onChange={(e) => setPayForm({ ...payForm, userId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white outline-none"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} {m.userId === dataState.currentUserId ? '(Akun Anda)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Setoran Atas Nama:</span>
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
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Nominal Setoran (Rp) <span className="text-rose-600">*</span>
              </label>
              <CurrencyInput
                required
                min={1000}
                placeholder="25.000"
                value={payForm.amount}
                onChange={(val) => setPayForm({ ...payForm, amount: val })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Metode Bayar</label>
              <select
                value={payForm.methodCode}
                onChange={(e) => setPayForm({ ...payForm, methodCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white outline-none"
              >
                <option value="SPAY">SPay / QRIS</option>
                <option value="SEABANK">SeaBank / Transfer</option>
                <option value="CASH">CASH (Tunai)</option>
              </select>
            </div>
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
                  : payForm.receiptBase64
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

              {payForm.receiptBase64 ? (
                <div className="space-y-2">
                  <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                    <img
                      src={payForm.receiptBase64}
                      alt="Preview Slip"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-bold text-emerald-800 truncate">
                    {payForm.receiptFileName}
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    {(payForm.receiptFileSize / 1024).toFixed(1)} KB • Klik / Tarik file baru untuk mengganti
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

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Catatan / Keterangan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Iuran Jersey gelombang 1..."
              value={payForm.note}
              onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold outline-none"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-0.5">
            <p className="font-bold">ℹ️ Alur Verifikasi:</p>
            <p>
              Setelah dikirim, status setoran akan menjadi <strong>⏳ MENUNGGU KONFIRMASI</strong> sampai diverifikasi oleh Pengurus Kelas untuk menjadi <strong>✅ LUNAS</strong>.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsPayOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold !bg-emerald-600 hover:!bg-emerald-700" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim...' : '🚀 Kirim Setoran'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL VERIFIKASI SETORAN TARGET (APPROVER) */}
      {/* ========================================== */}
      <Modal
        isOpen={isVerifyOpen}
        onClose={() => {
          setIsVerifyOpen(false);
          setSelectedPending(null);
        }}
        title={canManage ? '🔍 Tinjau & Konfirmasi Setoran Target' : '👁️ Bukti Setoran Target (Pending)'}
      >
        {selectedPending && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Target Tabungan:</span>
                <span className="font-bold text-slate-900">{selectedPending.targetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{selectedPending.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nominal Setoran:</span>
                <span className="font-black text-emerald-700">{formatRupiah(selectedPending.amount)}</span>
              </div>
              {selectedPending.contributedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Waktu Pengajuan:</span>
                  <span className="text-slate-700">{selectedPending.contributedAt}</span>
                </div>
              )}
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
                    className="max-h-60 max-w-full object-contain rounded-xl shadow-xs cursor-pointer hover:scale-102 transition-transform"
                    onClick={() => setPreviewEvidenceUrl(selectedPending.evidenceUrl || null)}
                    title="Klik untuk memperbesar foto bukti"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                  Tidak ada lampiran foto bukti.
                </p>
              )}
            </div>

            {/* Rejection Input */}
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
            {canManage ? (
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
                      ❌ Tolak Setoran
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      className="flex-1 font-bold !bg-emerald-600 hover:!bg-emerald-700"
                      onClick={() => handleVerifySubmit('PAID')}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Memproses...' : '✅ Setujui (Tandai LUNAS)'}
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
      {/* Modal Detail Target Tabungan (Daftar Peserta Lunas / Belum) */}
      {/* ========================================== */}
      <Modal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={`🎯 Detail Target: ${detailTarget?.name || ''}`}
      >
        {detailTarget && (
          <div className="space-y-4">
            {/* Target Overview Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 font-[var(--font-display)]">
                  {detailTarget.name}
                </h3>
                <Badge variant={statusColors[detailTarget.status] as any}>
                  {detailTarget.status}
                </Badge>
              </div>

              {detailTarget.description && (
                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  {detailTarget.description}
                </p>
              )}

              {/* Skema Iuran Info */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-blue-700 font-semibold block">Sistem Iuran:</span>
                  <span className="font-bold text-blue-950">
                    {detailTarget.splitScheme === 'VOLUNTARY'
                      ? '🌱 Seikhlasnya / Sukarela'
                      : detailTarget.splitScheme === 'FIXED_AMOUNT'
                      ? '📌 Nominal Ditetapkan'
                      : '⚖️ Bagi Rata (Target ÷ Peserta)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-blue-700 font-semibold block">Tagihan per Orang:</span>
                  <span className="font-black text-blue-900">
                    {detailTarget.splitScheme === 'VOLUNTARY' || (!detailTarget.targetAmount && detailTarget.splitScheme === 'EQUAL_SPLIT')
                      ? 'Bebas / Sukarela'
                      : `${formatRupiah(detailTarget.nominalPerPerson || 0)} / orang`}
                  </span>
                </div>
              </div>

              {/* Progress & Target Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Target Dana</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {detailTarget.targetAmount > 0 ? formatRupiah(detailTarget.targetAmount) : 'Bebas / Tanpa Batas'}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Terkumpul</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    {formatRupiah(detailTarget.currentAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* STATISTIK LUNAS / PENDING / BELUM BAYAR */}
            {/* ========================================== */}
            <div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-700 font-bold block">✅ LUNAS</span>
                  <span className="text-base font-black text-emerald-800">
                    {detailTarget.paidCount || 0}
                  </span>
                  <span className="text-[9px] text-emerald-600 block">Siswa</span>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] text-amber-700 font-bold block">⏳ MENUNGGU</span>
                  <span className="text-base font-black text-amber-800">
                    {detailTarget.pendingCount || 0}
                  </span>
                  <span className="text-[9px] text-amber-600 block">Siswa</span>
                </div>

                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <span className="text-[10px] text-rose-700 font-bold block">❌ BELUM BAYAR</span>
                  <span className="text-base font-black text-rose-800">
                    {detailTarget.unpaidCount || 0}
                  </span>
                  <span className="text-[9px] text-rose-600 block">Siswa</span>
                </div>
              </div>

              {/* Status Filter Tabs & Search */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                  {[
                    { key: 'ALL', label: `Semua (${detailTarget.participants?.length || 0})` },
                    { key: 'LUNAS', label: `✅ Lunas (${detailTarget.paidCount || 0})` },
                    { key: 'PENDING', label: `⏳ Pending (${detailTarget.pendingCount || 0})` },
                    { key: 'UNPAID', label: `❌ Belum (${detailTarget.unpaidCount || 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setDetailStatusFilter(tab.key as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        detailStatusFilter === tab.key
                          ? 'bg-[var(--color-denim)] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="🔍 Cari nama peserta target..."
                  value={detailMemberSearch}
                  onChange={(e) => setDetailMemberSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white outline-none"
                />
              </div>

              {/* LIST OF PARTICIPANTS WITH STATUS LUNAS / BELUM */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 mt-2 pr-1">
                {filteredDetailParticipants.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                    Tidak ada peserta dengan filter ini.
                  </p>
                ) : (
                  filteredDetailParticipants.map((p) => {
                    const isMe = p.userId === dataState.currentUserId;
                    return (
                      <div
                        key={p.userId}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          p.status === 'LUNAS'
                            ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                            : p.status === 'PENDING'
                            ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {p.name}
                            </span>
                            {isMe && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-1.5 py-0.2 rounded">
                                Akun Anda
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            {p.role} {p.contributedAt ? `• ${p.contributedAt}` : ''}
                          </span>
                        </div>

                        {/* Status Pill on Right Side */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {p.status === 'LUNAS' ? (
                            <div className="text-right">
                              <span className="text-[11px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-md shadow-xs inline-flex items-center gap-1">
                                ✓ LUNAS
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                                {formatRupiah(p.amount)}
                              </span>
                            </div>
                          ) : p.status === 'PENDING' ? (
                            <div className="text-right">
                              <span className="text-[11px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-md shadow-xs inline-flex items-center gap-1">
                                ⏳ MENUNGGU
                              </span>
                              <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                                {formatRupiah(p.amount)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-md border border-rose-200">
                              ❌ BELUM BAYAR
                            </span>
                          )}

                          {/* Evidence Preview Button if present */}
                          {p.evidenceUrl && (
                            <button
                              onClick={() => setPreviewEvidenceUrl(p.evidenceUrl || null)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs cursor-pointer"
                              title="Lihat Bukti Transfer"
                            >
                              👁️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="primary"
                className="flex-1 font-bold !bg-emerald-600 hover:!bg-emerald-700"
                onClick={() => {
                  const t = detailTarget;
                  setDetailTarget(null);
                  openPayModal(t);
                }}
              >
                💳 Setor Iuran Target Ini
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setDetailTarget(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL ZOOM PREVIEW BUKTI TRANSFER */}
      {/* ========================================== */}
      <Modal
        isOpen={!!previewEvidenceUrl}
        onClose={() => setPreviewEvidenceUrl(null)}
        title="📸 Pratinjau Bukti Pembayaran"
      >
        {previewEvidenceUrl && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-96 flex items-center justify-center p-2">
              <img
                src={previewEvidenceUrl}
                alt="Bukti Transfer"
                className="max-h-90 max-w-full object-contain rounded-xl shadow-xs"
              />
            </div>
            <Button
              variant="secondary"
              className="w-full font-bold"
              onClick={() => setPreviewEvidenceUrl(null)}
            >
              Tutup Pratinjau
            </Button>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* Modal Tambah Target Baru (Target Dana Opsional) */}
      {/* ========================================== */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="+ Buat Target Tabungan Baru">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nama Target Tabungan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Jersey Kelas, Kas Proyek Kelompok, Study Tour..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Target Dana</label>
                <span className="text-[10px] text-slate-400 font-semibold">(Opsional)</span>
              </div>
              <CurrencyInput
                placeholder="500.000 (Boleh kosong)"
                value={formData.targetAmount}
                onChange={(val) => setFormData({ ...formData, targetAmount: val })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Dana Awal Terkumpul</label>
              <CurrencyInput
                placeholder="0"
                value={formData.currentAmount}
                onChange={(val) => setFormData({ ...formData, currentAmount: val })}
              />
            </div>
          </div>

          {/* 3 PILIHAN SISTEM PEMBAGIAN TARGET */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Sistem Pembagian Iuran Target <span className="text-blue-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitScheme: 'EQUAL_SPLIT' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.splitScheme === 'EQUAL_SPLIT'
                    ? 'border-blue-500 bg-blue-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-lg block mb-0.5">⚖️</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Bagi Rata</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Target ÷ Total Orang</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitScheme: 'VOLUNTARY' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.splitScheme === 'VOLUNTARY'
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-lg block mb-0.5">🌱</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Seikhlasnya</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Nominal sukarela bebas</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitScheme: 'FIXED_AMOUNT' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.splitScheme === 'FIXED_AMOUNT'
                    ? 'border-purple-500 bg-purple-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-lg block mb-0.5">📌</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Nominal Tetap</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Tarif wajib per orang</p>
              </button>
            </div>

            {/* Input Nominal Ditetapkan jika memilih FIXED_AMOUNT */}
            {formData.splitScheme === 'FIXED_AMOUNT' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2.5 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1"
              >
                <label className="text-xs font-bold text-purple-900 block">
                  Nominal Ditetapkan per Orang
                </label>
                <CurrencyInput
                  required
                  min={1000}
                  placeholder="50.000"
                  value={formData.fixedAmount}
                  onChange={(val) => setFormData({ ...formData, fixedAmount: val })}
                />
              </motion.div>
            )}

            {/* Live Calculation Preview Banner */}
            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Estimasi Tagihan per Orang:</span>
              <strong className="text-slate-900 text-xs">
                {formData.splitScheme === 'VOLUNTARY' || (!formData.targetAmount && formData.splitScheme === 'EQUAL_SPLIT')
                  ? '🌱 Bebas / Sukarela'
                  : formatRupiah(calculateModalPerPerson()) + ' / orang'}
              </strong>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Keterangan / Deskripsi</label>
            <textarea
              rows={2}
              placeholder="Tujuan penggalangan dana, catatan, atau rincian target..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Status Target</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white"
              >
                <option value="ACTIVE">🟢 Aktif (Sedang Berjalan)</option>
                <option value="PLANNED">🟡 Direncanakan (Draft)</option>
                <option value="PAUSED">⏸️ Ditunda (Paused)</option>
                <option value="ACHIEVED">🎉 Tercapai (Achieved)</option>
              </select>
            </div>
          </div>

          {/* Segmented Cards for Visibility */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Siapa Saja yang Bisa Melihat & Mengikuti? (Visibilitas)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: 'PUBLIC', allowedUserIds: [] })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.visibility === 'PUBLIC'
                    ? 'border-emerald-500 bg-emerald-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-base block mb-0.5">🌐</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Publik</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Seluruh siswa sekelas</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: 'ROLE_BASED', allowedUserIds: [] })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.visibility === 'ROLE_BASED'
                    ? 'border-amber-500 bg-amber-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-base block mb-0.5">🔐</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Pengurus</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Khusus perangkat kelas</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: 'PRIVATE' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.visibility === 'PRIVATE'
                    ? 'border-rose-500 bg-rose-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-base block mb-0.5">🔒</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Private</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pilih anggota tertentu</p>
              </button>
            </div>
          </div>

          {/* Member Selection Box for PRIVATE mode */}
          {formData.visibility === 'PRIVATE' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 p-3 bg-rose-50/70 border border-rose-200 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1">
                    <span>👥</span> Pilih Anggota yang Mengikuti ({formData.allowedUserIds.length} Terpilih)
                  </h4>
                </div>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAllMembers}
                    className="px-2 py-0.5 bg-rose-200/80 hover:bg-rose-300 text-rose-800 font-bold rounded cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllMembers}
                    className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="🔍 Cari nama siswa..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 text-slate-900 bg-white text-xs outline-none"
              />

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredModalMembers.map((m) => {
                  const isSelected = formData.allowedUserIds.includes(m.userId);
                  return (
                    <div
                      key={m.userId}
                      onClick={() => handleToggleMember(m.userId)}
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-200/60 border border-rose-300 font-bold text-rose-900'
                          : 'bg-white hover:bg-rose-100/50 border border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>{m.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">{m.role}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Target'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* Modal Edit Target Tabungan */}
      {/* ========================================== */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="✏️ Edit Target Tabungan">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nama Target Tabungan</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Target Dana</label>
                <span className="text-[10px] text-slate-400 font-semibold">(Opsional)</span>
              </div>
              <CurrencyInput
                placeholder="500.000 (Boleh kosong)"
                value={formData.targetAmount}
                onChange={(val) => setFormData({ ...formData, targetAmount: val })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Dana Terkumpul</label>
              <CurrencyInput
                placeholder="0"
                value={formData.currentAmount}
                onChange={(val) => setFormData({ ...formData, currentAmount: val })}
              />
            </div>
          </div>

          {/* 3 PILIHAN SISTEM PEMBAGIAN TARGET */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Sistem Pembagian Iuran Target <span className="text-blue-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitScheme: 'EQUAL_SPLIT' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.splitScheme === 'EQUAL_SPLIT'
                    ? 'border-blue-500 bg-blue-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-lg block mb-0.5">⚖️</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Bagi Rata</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Target ÷ Total Orang</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitScheme: 'VOLUNTARY' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.splitScheme === 'VOLUNTARY'
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-lg block mb-0.5">🌱</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Seikhlasnya</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Nominal sukarela bebas</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitScheme: 'FIXED_AMOUNT' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.splitScheme === 'FIXED_AMOUNT'
                    ? 'border-purple-500 bg-purple-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-lg block mb-0.5">📌</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Nominal Tetap</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Tarif wajib per orang</p>
              </button>
            </div>

            {formData.splitScheme === 'FIXED_AMOUNT' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2.5 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1"
              >
                <label className="text-xs font-bold text-purple-900 block">
                  Nominal Ditetapkan per Orang
                </label>
                <CurrencyInput
                  required
                  min={1000}
                  placeholder="50.000"
                  value={formData.fixedAmount}
                  onChange={(val) => setFormData({ ...formData, fixedAmount: val })}
                />
              </motion.div>
            )}

            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Estimasi Tagihan per Orang:</span>
              <strong className="text-slate-900 text-xs">
                {formData.splitScheme === 'VOLUNTARY' || (!formData.targetAmount && formData.splitScheme === 'EQUAL_SPLIT')
                  ? '🌱 Bebas / Sukarela'
                  : formatRupiah(calculateModalPerPerson()) + ' / orang'}
              </strong>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Keterangan / Deskripsi</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Status Target</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white"
              >
                <option value="ACTIVE">🟢 Aktif (Sedang Berjalan)</option>
                <option value="PLANNED">🟡 Direncanakan (Draft)</option>
                <option value="PAUSED">⏸️ Ditunda (Paused)</option>
                <option value="ACHIEVED">🎉 Tercapai (Achieved)</option>
                <option value="CANCELLED">❌ Dibatalkan (Cancelled)</option>
              </select>
            </div>
          </div>

          {/* Segmented Cards for Visibility */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Siapa Saja yang Bisa Melihat & Mengikuti? (Visibilitas)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: 'PUBLIC', allowedUserIds: [] })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.visibility === 'PUBLIC'
                    ? 'border-emerald-500 bg-emerald-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-base block mb-0.5">🌐</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Publik</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Seluruh siswa sekelas</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: 'ROLE_BASED', allowedUserIds: [] })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.visibility === 'ROLE_BASED'
                    ? 'border-amber-500 bg-amber-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-base block mb-0.5">🔐</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Pengurus</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Khusus perangkat kelas</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: 'PRIVATE' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  formData.visibility === 'PRIVATE'
                    ? 'border-rose-500 bg-rose-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-base block mb-0.5">🔒</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Private</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pilih anggota tertentu</p>
              </button>
            </div>
          </div>

          {/* Member Selection Box for PRIVATE mode */}
          {formData.visibility === 'PRIVATE' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 p-3 bg-rose-50/70 border border-rose-200 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1">
                    <span>👥</span> Pilih Anggota yang Mengikuti ({formData.allowedUserIds.length} Terpilih)
                  </h4>
                </div>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAllMembers}
                    className="px-2 py-0.5 bg-rose-200/80 hover:bg-rose-300 text-rose-800 font-bold rounded cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllMembers}
                    className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="🔍 Cari nama siswa..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 text-slate-900 bg-white text-xs outline-none"
              />

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredModalMembers.map((m) => {
                  const isSelected = formData.allowedUserIds.includes(m.userId);
                  return (
                    <div
                      key={m.userId}
                      onClick={() => handleToggleMember(m.userId)}
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-200/60 border border-rose-300 font-bold text-rose-900'
                          : 'bg-white hover:bg-rose-100/50 border border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>{m.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">{m.role}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* Modal Hapus Target Tabungan */}
      {/* ========================================== */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="🗑️ Hapus Target Tabungan">
        {selectedTarget && (
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-rose-900">
                Apakah Anda yakin ingin menghapus target &quot;{selectedTarget.name}&quot;?
              </p>
              <p className="text-rose-700">
                Target dana: <strong>{formatRupiah(selectedTarget.targetAmount)}</strong> • Terkumpul: <strong>{formatRupiah(selectedTarget.currentAmount)}</strong>
              </p>
              <p className="text-[11px] text-rose-600 mt-1">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus daftar peserta terkait.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button
                variant="danger"
                className="flex-1 font-bold !bg-rose-600 hover:!bg-rose-700 text-white"
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Target'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
