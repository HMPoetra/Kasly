'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { motion } from 'framer-motion';
import { exportToCSV } from '@/lib/utils/export';
import { getAuditLogsAction } from '@/lib/actions/db-actions';

interface AuditItem {
  id: string;
  user: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VERIFY' | 'INITIALIZE' | string;
  entity: string;
  detail: string;
  time: string;
}

// Soft, balanced, non-distracting colors per action
const actionRowStyles: Record<
  string,
  {
    rowClass: string;
    iconBg: string;
    iconText: string;
    iconBorder: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icon: string;
    label: string;
  }
> = {
  CREATE: {
    rowClass: 'bg-emerald-50/35 hover:bg-emerald-50/65 border border-emerald-100/80 border-l-[3.5px] border-l-emerald-500',
    iconBg: 'bg-emerald-100/70',
    iconText: 'text-emerald-700',
    iconBorder: 'border-emerald-200',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    icon: '➕',
    label: 'CREATE',
  },
  UPDATE: {
    rowClass: 'bg-sky-50/35 hover:bg-sky-50/65 border border-sky-100/80 border-l-[3.5px] border-l-sky-500',
    iconBg: 'bg-sky-100/70',
    iconText: 'text-sky-700',
    iconBorder: 'border-sky-200',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    icon: '✏️',
    label: 'UPDATE',
  },
  DELETE: {
    rowClass: 'bg-rose-50/35 hover:bg-rose-50/65 border border-rose-100/80 border-l-[3.5px] border-l-rose-500',
    iconBg: 'bg-rose-100/70',
    iconText: 'text-rose-700',
    iconBorder: 'border-rose-200',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    icon: '🗑️',
    label: 'DELETE',
  },
  VERIFY: {
    rowClass: 'bg-purple-50/35 hover:bg-purple-50/65 border border-purple-100/80 border-l-[3.5px] border-l-purple-500',
    iconBg: 'bg-purple-100/70',
    iconText: 'text-purple-700',
    iconBorder: 'border-purple-200',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    icon: '✓',
    label: 'VERIFY',
  },
  INITIALIZE: {
    rowClass: 'bg-amber-50/30 hover:bg-amber-50/60 border border-amber-100/80 border-l-[3.5px] border-l-amber-500',
    iconBg: 'bg-amber-100/70',
    iconText: 'text-amber-700',
    iconBorder: 'border-amber-200',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    icon: '⚡',
    label: 'INIT',
  },
};

const defaultStyle = {
  rowClass: 'bg-slate-50/40 hover:bg-slate-50/70 border border-slate-200/80 border-l-[3.5px] border-l-slate-400',
  iconBg: 'bg-slate-100',
  iconText: 'text-slate-700',
  iconBorder: 'border-slate-200',
  badgeBg: 'bg-slate-100',
  badgeText: 'text-slate-700',
  badgeBorder: 'border-slate-200',
  icon: '📌',
  label: 'LOG',
};

export default function AuditPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        const res = await getAuditLogsAction();
        setLogs(res as AuditItem[]);
      } catch (err) {
        console.error('Error loading audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (!isPermLoading && !hasAccess('audit')) {
    return <AccessGate moduleName="Activity Log & Audit" />;
  }

  // Action counts
  const totalLogs = logs.length;
  const createCount = logs.filter((l) => l.action === 'CREATE').length;
  const updateCount = logs.filter((l) => l.action === 'UPDATE').length;
  const deleteCount = logs.filter((l) => l.action === 'DELETE').length;
  const verifyCount = logs.filter((l) => l.action === 'VERIFY').length;

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchEntity = entityFilter === 'ALL' || log.entity.toLowerCase() === entityFilter.toLowerCase();

    return matchSearch && matchAction && matchEntity;
  });

  const handleExport = () => {
    const actionLabel = (act: string) =>
      act === 'CREATE'
        ? 'TAMBAH DATA (CREATE)'
        : act === 'UPDATE'
        ? 'UBAH DATA (UPDATE)'
        : act === 'DELETE'
        ? 'HAPUS DATA (DELETE)'
        : act === 'VERIFY'
        ? 'VERIFIKASI (VERIFY)'
        : act;

    exportToCSV(
      'Audit_Log_Aktivitas_Hoarizon',
      filteredLogs,
      [
        { header: 'Waktu & Tanggal', key: 'time' },
        { header: 'Nama Pengguna / Aktor', key: 'user' },
        { header: 'Tipe Aksi', key: (r) => actionLabel(r.action) },
        { header: 'Modul / Entitas', key: 'entity' },
        { header: 'Rincian Perubahan', key: 'detail' },
      ],
      {
        title: 'LOG AKTIVITAS & JEJAK AUDIT SISTEM KELAS HOARIZON',
        subtitle: `Rekaman audit aktivitas Create, Update, Delete, dan Verify oleh seluruh pengurus & anggota`,
        summaryRows: [
          { label: 'Total Log Aktivitas Terpilih', value: `${filteredLogs.length} entri log` },
        ],
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)] flex items-center gap-2">
            <span>🕐</span> Activity Log & Riwayat Audit
          </h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Jejak rekaman seluruh aktivitas sistem (Tambah, Ubah, Hapus, dan Verifikasi) secara real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            📥 Export CSV ({filteredLogs.length})
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="!p-3.5 bg-slate-50/80 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block">Total Aktivitas</span>
          <p className="text-2xl font-black text-slate-800 font-[var(--font-display)] mt-0.5">
            {totalLogs}
          </p>
          <span className="text-[10px] text-slate-400">Seluruh riwayat log</span>
        </Card>

        <Card className="!p-3.5 bg-emerald-50/50 border border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 block">➕ CREATE</span>
            <span className="text-xs">🌱</span>
          </div>
          <p className="text-2xl font-black text-emerald-800 font-[var(--font-display)] mt-0.5">
            {createCount}
          </p>
          <span className="text-[10px] text-emerald-600">Data baru dibuat</span>
        </Card>

        <Card className="!p-3.5 bg-sky-50/50 border border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-700 block">✏️ UPDATE</span>
            <span className="text-xs">🔄</span>
          </div>
          <p className="text-2xl font-black text-sky-800 font-[var(--font-display)] mt-0.5">
            {updateCount}
          </p>
          <span className="text-[10px] text-sky-600">Data diperbarui</span>
        </Card>

        <Card className="!p-3.5 bg-rose-50/50 border border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 block">🗑️ DELETE</span>
            <span className="text-xs">⚠️</span>
          </div>
          <p className="text-2xl font-black text-rose-800 font-[var(--font-display)] mt-0.5">
            {deleteCount}
          </p>
          <span className="text-[10px] text-rose-600">Penghapusan data</span>
        </Card>

        <Card className="!p-3.5 bg-purple-50/50 border border-purple-200 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 block">✓ VERIFY</span>
            <span className="text-xs">🛡️</span>
          </div>
          <p className="text-2xl font-black text-purple-800 font-[var(--font-display)] mt-0.5">
            {verifyCount}
          </p>
          <span className="text-[10px] text-purple-600">Verifikasi iuran/target</span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="!p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-800 mr-1 flex-shrink-0">Aksi:</span>
            {[
              { key: 'ALL', label: 'Semua', count: totalLogs, activeClass: 'bg-[var(--color-denim)] text-white shadow-sm' },
              { key: 'CREATE', label: '➕ Create', count: createCount, activeClass: 'bg-emerald-600 text-white shadow-sm' },
              { key: 'UPDATE', label: '✏️ Update', count: updateCount, activeClass: 'bg-sky-600 text-white shadow-sm' },
              { key: 'DELETE', label: '🗑️ Delete', count: deleteCount, activeClass: 'bg-rose-600 text-white shadow-sm' },
              { key: 'VERIFY', label: '✓ Verify', count: verifyCount, activeClass: 'bg-purple-600 text-white shadow-sm' },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setActionFilter(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  actionFilter === st.key
                    ? st.activeClass
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    actionFilter === st.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="🔍 Cari pengguna, detail aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-72 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)]"
            />
          </div>
        </div>
      </Card>

      {/* Logs List Container */}
      {isLoading ? (
        <Card>
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            <span className="inline-block animate-spin mr-2">🌀</span> Memuat riwayat aktivitas sistem...
          </div>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-sm text-slate-500">
            <span className="text-4xl mb-2 block">📋</span>
            <p className="font-bold text-slate-800">Tidak ada riwayat aktivitas yang sesuai</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter aksi atau kata kunci pencarian</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log, i) => {
            const style = actionRowStyles[log.action] || defaultStyle;

            return (
              <motion.div
                key={log.id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl transition-all duration-200 shadow-xs ${style.rowClass}`}
              >
                {/* Action Icon Pill */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border font-bold ${style.iconBg} ${style.iconText} ${style.iconBorder}`}
                >
                  {style.icon}
                </div>

                {/* Log Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900">{log.user}</span>

                    {/* Action Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                    >
                      {style.label}
                    </span>

                    {/* Entity Module Tag */}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/80 text-slate-700 border border-slate-200/80 font-mono">
                      {log.entity}
                    </span>

                    <span className="text-[11px] text-slate-400 ml-auto flex-shrink-0 font-medium">
                      🕒 {log.time}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {log.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
