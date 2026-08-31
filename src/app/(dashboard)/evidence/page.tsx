'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV } from '@/lib/utils/export';
import {
  getEvidenceAction,
  createEvidenceAction,
  updateEvidenceAction,
  verifyEvidenceAction,
  deleteEvidenceAction,
} from '@/lib/actions/db-actions';

interface EvidenceItem {
  id: string;
  entityType: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  status: string;
  uploadedBy: string;
  date: string;
}

const statusBadgeVariant: Record<string, 'pending' | 'income' | 'expense'> = {
  PENDING: 'pending',
  VERIFIED: 'income',
  REJECTED: 'expense',
};

const entityTypeLabels: Record<string, string> = {
  PAYMENT: 'Bukti Transfer Iuran Kas',
  PURCHASE: 'Struk / Nota Belanja Barang',
  EXPENSE: 'Kuitansi Pengeluaran Operasional',
};

// Roles that have full manage rights: Upload, Edit, Delete, Verify
const ALLOWED_EVIDENCE_MANAGERS = [
  'CLASS_LEADER',
  'VICE_CLASS_LEADER',
  'TREASURER_1',
  'SECRETARY_1',
  'SECRETARY_2',
];

export default function EvidencePage() {
  const { roleCode, isLeader, can, hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Permission check: Can manage (Upload, Edit, Delete, Verify)
  const canManage = isLeader || ALLOWED_EVIDENCE_MANAGERS.includes(roleCode) || can('evidence.create') || can('evidence.update') || can('evidence.delete');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<EvidenceItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<EvidenceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states (Upload)
  const [fileName, setFileName] = useState('');
  const [entityType, setEntityType] = useState('PAYMENT');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states (Edit)
  const [editFileName, setEditFileName] = useState('');
  const [editEntityType, setEditEntityType] = useState('PAYMENT');
  const [editFile, setEditFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isEditDragging, setIsEditDragging] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getEvidenceAction();
        if (isMounted) {
          setEvidenceList(res as EvidenceItem[]);
        }
      } catch (err) {
        console.error('Error loading evidence:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (!isPermLoading && !hasAccess('evidence')) {
    return <AccessGate moduleName="Bukti Nota & Transaksi" />;
  }

  // Handle Drag and Drop for Upload Modal
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file: File, isForEdit = false) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.warning('Format berkas tidak didukung. Harap pilih gambar (JPG, PNG, WEBP) atau dokumen PDF.');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ukuran file terlalu besar! Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
      };

      if (isForEdit) {
        setEditFile(fileData);
        if (!editFileName.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setEditFileName(cleanName);
        }
      } else {
        setSelectedFile(fileData);
        if (!fileName.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setFileName(cleanName);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0], false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0], false);
    }
  };

  // Drag and Drop for Edit Modal
  const handleEditDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditDragging(true);
  };

  const handleEditDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditDragging(false);
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0], true);
    }
  };

  const handleEditFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0], true);
    }
  };

  // Export CSV
  const handleExport = () => {
    const verifiedCount = filteredEvidence.filter((e) => e.status === 'VERIFIED').length;
    const pendingCount = filteredEvidence.filter((e) => e.status === 'PENDING').length;

    exportToCSV(
      'Daftar_Bukti_Nota_Hoarizon',
      filteredEvidence,
      [
        { header: 'Nama Dokumen / Keterangan', key: 'fileName' },
        { header: 'Kategori Bukti', key: (r) => entityTypeLabels[r.entityType] || r.entityType },
        { header: 'Pengunggah', key: 'uploadedBy' },
        { header: 'Tanggal Unggah', key: 'date' },
        { header: 'Tipe File', key: 'fileType' },
        { header: 'Status Verifikasi', key: (r) => (r.status === 'VERIFIED' ? 'Terverifikasi (Valid)' : r.status === 'PENDING' ? 'Menunggu Verifikasi' : 'Ditolak') },
      ],
      {
        title: 'DAFTAR ARSIP BUKTI NOTA & TRANSAKSI KAS KELAS HOARIZON',
        subtitle: `Daftar arsip digital struk belanja, nota operasional, dan bukti setoran`,
        summaryRows: [
          { label: 'Bukti Terverifikasi', value: `${verifiedCount} berkas` },
          { label: 'Bukti Menunggu Verifikasi', value: `${pendingCount} berkas` },
          { label: 'Total Berkas', value: `${filteredEvidence.length} berkas` },
        ],
      }
    );
  };

  // Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      toast.warning('Nama berkas / deskripsi tidak boleh kosong.');
      return;
    }
    setIsSubmitting(true);
    const res = await createEvidenceAction({
      fileName: fileName.trim(),
      entityType,
      fileUrl: selectedFile?.dataUrl,
      fileType: selectedFile?.type,
      fileSize: selectedFile?.size,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsUploadOpen(false);
      toast.created('Bukti Nota', `Berkas "${fileName.trim()}" berhasil diunggah ke arsip bukti.`);
      setFileName('');
      setSelectedFile(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal mengunggah bukti: ' + res.error);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (e: EvidenceItem) => {
    setSelectedEditItem(e);
    setEditFileName(e.fileName);
    setEditEntityType(e.entityType);
    setEditFile(null);
    setIsEditOpen(true);
  };

  // Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditItem || !editFileName.trim()) return;

    setIsSubmitting(true);
    const res = await updateEvidenceAction(selectedEditItem.id, {
      fileName: editFileName.trim(),
      entityType: editEntityType,
      fileUrl: editFile?.dataUrl,
      fileType: editFile?.type,
      fileSize: editFile?.size,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsEditOpen(false);
      toast.updated('Bukti Nota', `Informasi berkas "${editFileName.trim()}" berhasil diperbarui.`);
      setSelectedEditItem(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal memperbarui bukti: ' + res.error);
    }
  };

  // Verify Status
  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    if (!canManage) return;
    const res = await verifyEvidenceAction(id, status);
    if (res.success) {
      setRefreshKey((k) => k + 1);
      if (status === 'VERIFIED') {
        toast.verified('Bukti Nota', 'Berkas bukti telah disetujui & diverifikasi valid.');
      } else {
        toast.error('Berkas bukti telah ditolak.', 'Bukti Ditolak');
      }
    } else {
      toast.error('Gagal memverifikasi: ' + res.error);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!canManage) return;
    const ok = await confirm({
      title: 'Hapus Berkas Bukti / Nota?',
      description: 'Apakah Anda yakin ingin menghapus berkas bukti transaksi ini? Tindakan ini permanen dan berkas tidak dapat dipulihkan.',
      confirmText: 'Ya, Hapus Berkas',
      cancelText: 'Batal',
      type: 'delete',
    });
    if (!ok) return;

    const res = await deleteEvidenceAction(id);
    if (res.success) {
      toast.deleted('Bukti Nota', 'Berkas bukti telah berhasil dihapus.');
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal menghapus bukti: ' + res.error);
    }
  };

  // Filtered Evidence
  const filteredEvidence = evidenceList.filter((e) => {
    const matchSearch =
      e.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)]">
            📎 Bukti & Nota Transaksi
          </h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Unggah dan verifikasi bukti transfer iuran serta nota belanja kas ({evidenceList.length} Berkas Terdaftar)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!canManage && (
            <span className="text-[11px] px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-semibold flex items-center gap-1 shadow-sm">
              🔒 Mode Lihat Saja (Read-Only)
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            📥 Export CSV
          </Button>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFileName('');
                setSelectedFile(null);
                setIsUploadOpen(true);
              }}
            >
              + Unggah Bukti
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner for non-managers */}
      {!canManage && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center gap-3 text-xs text-blue-900 shadow-sm">
          <span className="text-xl">ℹ️</span>
          <div>
            <strong>Informasi Hak Akses:</strong> Hanya <strong>Class Leader, Vice Class Leader, 1st Treasurer, 1st Secretary, dan 2nd Secretary</strong> yang memiliki wewenang untuk mengunggah, mengedit, memverifikasi, dan menghapus bukti transaksi. Anda berada dalam mode lihat saja.
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <Card className="!p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Status:</span>
            <div className="flex gap-1 bg-[var(--color-baby-blue-50)] p-1 rounded-lg">
              {['ALL', 'VERIFIED', 'PENDING', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-[var(--color-denim)] text-white font-bold'
                      : 'text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)]'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st === 'VERIFIED' ? '✓ Diterima' : st === 'PENDING' ? '⏳ Menunggu' : '✕ Ditolak'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama berkas, pengunggah, jenis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)] w-full sm:w-64"
            />
          </div>
        </div>
      </Card>

      {/* Evidence Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-[var(--color-denim-light)]">
          <span className="inline-block animate-spin mr-2">🌀</span> Memuat data bukti transaksi...
        </div>
      ) : filteredEvidence.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            {canManage ? (
              <div
                onClick={() => {
                  setFileName('');
                  setSelectedFile(null);
                  setIsUploadOpen(true);
                }}
                className="mx-auto w-56 h-36 border-2 border-dashed border-[var(--color-baby-blue-200)] rounded-2xl flex flex-col items-center justify-center mb-4 hover:border-[var(--color-denim)] hover:bg-[var(--color-baby-blue-50)]/40 transition-all cursor-pointer group"
              >
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📤</span>
                <p className="text-xs font-bold text-[var(--color-denim)]">Klik / Tarik Foto ke Sini</p>
                <p className="text-[10px] text-[var(--color-denim-light)] mt-0.5">JPG, PNG, WEBP, PDF (Maks. 5MB)</p>
              </div>
            ) : (
              <div className="text-4xl mb-2">📁</div>
            )}
            <p className="text-sm font-bold text-[var(--color-accent)]">
              {evidenceList.length === 0 ? 'Belum ada berkas bukti diunggah' : 'Tidak ada bukti yang cocok dengan filter'}
            </p>
            <p className="text-xs text-[var(--color-denim-light)] mt-1 opacity-70">
              {canManage
                ? 'Klik tombol "+ Unggah Bukti" di atas atau tarik foto struk/transfer ke dalam aplikasi'
                : 'Pengurus kas belum mengunggah berkas bukti transaksi'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvidence.map((e, i) => {
            const isImage = e.fileUrl && (e.fileUrl.startsWith('data:image') || e.fileUrl.endsWith('.jpg') || e.fileUrl.endsWith('.png') || e.fileUrl.endsWith('.webp') || e.fileUrl.startsWith('http'));

            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="hover:-translate-y-1 transition-all overflow-hidden flex flex-col justify-between h-full group border border-slate-200/80 shadow-sm hover:shadow-md">
                  <div>
                    {/* Header: Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <span
                          className="text-xs font-bold text-slate-900 block truncate"
                          title={e.fileName}
                        >
                          {e.fileName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5 truncate">
                          {entityTypeLabels[e.entityType] || e.entityType}
                        </span>
                      </div>
                      <Badge variant={statusBadgeVariant[e.status] || 'pending'} className="text-[9px] flex-shrink-0">
                        {e.status}
                      </Badge>
                    </div>

                    {/* Thumbnail Preview */}
                    <div
                      onClick={() => setPreviewItem(e)}
                      className="w-full h-36 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200/70 mb-3 flex items-center justify-center cursor-pointer group-hover:border-blue-300 transition-colors"
                    >
                      {isImage ? (
                        <Image
                          src={e.fileUrl}
                          alt={e.fileName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <span className="text-3xl mb-1">🧾</span>
                          <span className="text-[10px] font-semibold">Lihat Berkas Nota</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                        <span>🔍 Klik untuk Perbesar</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Pengunggah:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[140px]">{e.uploadedBy}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Tanggal:</span>
                        <span className="text-slate-600 font-medium">{e.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                    {/* If manager: show verify & edit & delete buttons */}
                    {canManage ? (
                      <>
                        {e.status === 'PENDING' ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              className="flex-1 !h-7 !text-[10px] !bg-emerald-600 hover:!bg-emerald-700 text-white font-bold"
                              onClick={() => handleVerify(e.id, 'VERIFIED')}
                            >
                              ✓ Terima
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="flex-1 !h-7 !text-[10px] !bg-rose-500 hover:!bg-rose-600 text-white font-bold"
                              onClick={() => handleVerify(e.id, 'REJECTED')}
                            >
                              ✕ Tolak
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 !h-7 !text-[10px] font-semibold text-slate-700"
                            onClick={() => handleVerify(e.id, e.status === 'VERIFIED' ? 'REJECTED' : 'VERIFIED')}
                          >
                            {e.status === 'VERIFIED' ? 'Batalkan Terima' : 'Terima Kembali'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!h-7 !text-[10px] text-blue-700 hover:bg-blue-50 px-2"
                          onClick={() => handleOpenEdit(e)}
                          title="Edit Bukti"
                        >
                          ✏️ Edit
                        </Button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 text-xs"
                          title="Hapus Bukti"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      /* If read-only: full-width preview button */
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full !h-8 !text-xs font-semibold"
                        onClick={() => setPreviewItem(e)}
                      >
                        🔍 Lihat Foto / Bukti Transaksi
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* Modal Upload Bukti (Dengan Drag & Drop) */}
      {/* ========================================== */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="+ Unggah Bukti Transaksi Baru">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Nama Berkas / Deskripsi Bukti
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Struk Belanja Spidol & Kertas HVS - Toko Buku"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Jenis Dokumen Transaksi
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold outline-none bg-white"
            >
              <option value="PAYMENT">Bukti Transfer Iuran Kas Siswa</option>
              <option value="PURCHASE">Struk / Nota Belanja Barang Kelas</option>
              <option value="EXPENSE">Kuitansi Pengeluaran Operasional / Acara</option>
            </select>
          </div>

          {/* Drag and Drop Zone */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Lampiran Foto Struk / Nota (Drag & Drop)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
                }`}
              >
                <span className="text-3xl mb-1.5 block">📸</span>
                <p className="text-xs font-bold text-slate-800">
                  Tarik & Letakkan (Drag & Drop) Foto Struk di Sini
                </p>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  atau klik untuk memilih foto dari galeri / komputer
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mendukung PNG, JPG, JPEG, WEBP, PDF (Maksimal 5MB)
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedFile.type.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-blue-200 flex-shrink-0 bg-white shadow-sm">
                      <Image
                        src={selectedFile.dataUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-2xl">📄</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-[11px] font-bold transition-colors flex-shrink-0"
                >
                  ✕ Ganti
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsUploadOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isSubmitting}>
              {isSubmitting ? 'Mengunggah...' : '💾 Simpan Bukti'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* Modal Edit Bukti (Dengan Drag & Drop) */}
      {/* ========================================== */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="✏️ Edit Berkas Bukti Transaksi">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Nama Berkas / Deskripsi Bukti
            </label>
            <input
              type="text"
              required
              value={editFileName}
              onChange={(e) => setEditFileName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Jenis Dokumen Transaksi
            </label>
            <select
              value={editEntityType}
              onChange={(e) => setEditEntityType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold outline-none bg-white"
            >
              <option value="PAYMENT">Bukti Transfer Iuran Kas Siswa</option>
              <option value="PURCHASE">Struk / Nota Belanja Barang Kelas</option>
              <option value="EXPENSE">Kuitansi Pengeluaran Operasional / Acara</option>
            </select>
          </div>

          {/* Edit Drag and Drop Zone */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Ganti Foto / Lampiran (Opsional)
            </label>

            <input
              type="file"
              ref={editFileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
              onChange={handleEditFileInputChange}
              className="hidden"
            />

            {editFile ? (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {editFile.type.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-blue-200 flex-shrink-0 bg-white shadow-sm">
                      <Image
                        src={editFile.dataUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-2xl">📄</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {editFile.name} (Baru)
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {(editFile.size / 1024).toFixed(1)} KB • {editFile.type.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditFile(null);
                    if (editFileInputRef.current) editFileInputRef.current.value = '';
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-[11px] font-bold transition-colors flex-shrink-0"
                >
                  ✕ Batalkan
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleEditDragOver}
                onDragLeave={handleEditDragLeave}
                onDrop={handleEditDrop}
                onClick={() => editFileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isEditDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
                }`}
              >
                <p className="text-xs font-bold text-slate-700">
                  Tarik foto baru ke sini atau klik untuk mengganti foto lama
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Biarkan kosong jika tidak ingin mengubah foto yang sudah ada
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* Modal Preview Berkas Lengkap */}
      {/* ========================================== */}
      <Modal isOpen={!!previewItem} onClose={() => setPreviewItem(null)} title="🔍 Detail Bukti & Nota Transaksi">
        {previewItem && (
          <div className="space-y-4">
            {/* Image Preview Box */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 flex flex-col items-center justify-center min-h-[260px] max-h-[420px] relative shadow-inner">
              {previewItem.fileUrl && (previewItem.fileUrl.startsWith('data:image') || previewItem.fileUrl.endsWith('.jpg') || previewItem.fileUrl.endsWith('.png') || previewItem.fileUrl.endsWith('.webp') || previewItem.fileUrl.startsWith('http')) ? (
                <div className="w-full h-[360px] relative">
                  <Image
                    src={previewItem.fileUrl}
                    alt={previewItem.fileName}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-slate-300">
                  <span className="text-5xl mb-2 block">🧾</span>
                  <p className="text-sm font-semibold">Pratinjau Berkas Dokumen</p>
                  <p className="text-xs text-slate-400 mt-1">{previewItem.fileType || 'Format Dokumen Fisik'}</p>
                </div>
              )}
            </div>

            {/* Info details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Nama Dokumen:</span>
                <span className="font-bold text-slate-900 text-right max-w-[240px]">{previewItem.fileName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Jenis Transaksi:</span>
                <span className="font-bold text-blue-800">{entityTypeLabels[previewItem.entityType] || previewItem.entityType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Diunggah Oleh:</span>
                <span className="font-bold text-slate-800">{previewItem.uploadedBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tanggal Unggah:</span>
                <span className="text-slate-700">{previewItem.date}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Status Verifikasi:</span>
                <Badge variant={statusBadgeVariant[previewItem.status] || 'pending'} className="text-xs">
                  {previewItem.status === 'VERIFIED' ? '✓ Diterima (Valid)' : previewItem.status === 'PENDING' ? '⏳ Menunggu Verifikasi' : '✕ Ditolak'}
                </Badge>
              </div>
            </div>

            {/* Action buttons in preview */}
            <div className="flex gap-2 pt-2">
              {previewItem.fileUrl && previewItem.fileUrl.startsWith('data:image') && (
                <a
                  href={previewItem.fileUrl}
                  download={previewItem.fileName.replace(/\s+/g, '_')}
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full !text-xs font-semibold">
                    💾 Unduh Foto
                  </Button>
                </a>
              )}
              <Button variant="primary" className="flex-1 font-bold" onClick={() => setPreviewItem(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
