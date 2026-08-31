'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { exportToCSV } from '@/lib/utils/export';
import {
  getMembersAction,
  getRolesAction,
  getPermissionsAction,
  createMemberAction,
  updateMemberAction,
  deleteMemberAction,
  createRoleAction,
  updateMemberRoleAndPermissionsAction,
} from '@/lib/actions/db-actions';

interface MemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  gender: string;
  roleId: string;
  role: string;
  roleCode: string;
  permissions: string[];
  permissionSummary: string[];
  permsCount: number;
  status: string;
  totalPaid: number;
  outstanding: number;
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sortOrder: number;
  isDefault: boolean;
  perms?: number;
  members?: number;
}

interface PermissionItem {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

const roleBadgeColors: Record<string, string> = {
  CLASS_LEADER: 'bg-amber-100 text-amber-800 border-amber-300',
  VICE_CLASS_LEADER: 'bg-amber-50 text-amber-700 border-amber-200',
  TREASURER_1: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  TREASURER_2: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SECRETARY_1: 'bg-sky-100 text-sky-800 border-sky-300',
  SECRETARY_2: 'bg-sky-50 text-sky-700 border-sky-200',
  LOGISTICS_1: 'bg-purple-100 text-purple-800 border-purple-300',
  LOGISTICS_2: 'bg-purple-50 text-purple-700 border-purple-200',
  DISCIPLINARY: 'bg-rose-100 text-rose-800 border-rose-300',
  CREATIVE_1: 'bg-pink-100 text-pink-800 border-pink-300',
  CREATIVE_2: 'bg-pink-50 text-pink-700 border-pink-200',
  CREATIVE_3: 'bg-pink-50 text-pink-700 border-pink-200',
  CLASS_MEMBER: 'bg-slate-100 text-slate-700 border-slate-200',
};

const modulesList = [
  { key: 'cashflow', label: 'Kas', icon: '💵', title: 'Kas & Transaksi' },
  { key: 'contribution', label: 'Iuran', icon: '📋', title: 'Iuran Kas' },
  { key: 'target', label: 'Target', icon: '🎯', title: 'Target Tabungan' },
  { key: 'purchase', label: 'Belanja', icon: '🛒', title: 'Pengadaan Belanja' },
  { key: 'evidence', label: 'Bukti', icon: '📎', title: 'Bukti Nota' },
  { key: 'reports', label: 'Laporan', icon: '📊', title: 'Laporan & Rekap' },
  { key: 'users', label: 'User', icon: '👤', title: 'Anggota & Role' },
  { key: 'settings', label: 'Setting', icon: '⚙️', title: 'Konfigurasi' },
];

export default function UnifiedMembersRolesPermissionsPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [allPerms, setAllPerms] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Local state for fast checkbox toggles per member
  const [memberPermMap, setMemberPermMap] = useState<Record<string, Set<string>>>({});
  const [selectedRowRoles, setSelectedRowRoles] = useState<Record<string, string>>({});
  const [isSavingRow, setIsSavingRow] = useState<Record<string, boolean>>({});
  const [savedRowAlert, setSavedRowAlert] = useState<Record<string, boolean>>({});
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Member state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    roleId: '',
  });

  // Form Role state
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Permissions modal state
  const [memberActivePerms, setMemberActivePerms] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [membersData, rolesData, permsData] = await Promise.all([
          getMembersAction(),
          getRolesAction(),
          getPermissionsAction(),
        ]);
        if (isMounted) {
          const mList = membersData as MemberItem[];
          setMembers(mList);
          setRolesList(rolesData as RoleItem[]);
          setAllPerms(permsData as PermissionItem[]);

          // Initialize local map of permissions per member
          const initialMap: Record<string, Set<string>> = {};
          for (const m of mList) {
            initialMap[m.userId] = new Set(m.permissions);
          }
          setMemberPermMap(initialMap);

          if (rolesData.length > 0 && !formData.roleId) {
            setFormData((prev) => ({ ...prev, roleId: rolesData[0].id }));
          }
        }
      } catch (err) {
        console.error('Error loading members, roles, and permissions:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [refreshKey, formData.roleId]);

  // Check if member has access to a resource
  const hasResourceAccess = (userId: string, resourceKey: string) => {
    const userPerms = memberPermMap[userId];
    if (!userPerms) return false;
    for (const p of userPerms) {
      if (p.startsWith(`${resourceKey}.`)) return true;
    }
    return false;
  };

  // Toggle resource access with checkbox (Instant Live Auto-Save to Database)
  const handleToggleResourceCheckbox = async (userId: string, resourceKey: string) => {
    const current = memberPermMap[userId] || new Set<string>();
    const next = new Set(current);
    const hasAccess = hasResourceAccess(userId, resourceKey);

    if (hasAccess) {
      // Remove all perms for this resource
      for (const p of Array.from(next)) {
        if (p.startsWith(`${resourceKey}.`)) {
          next.delete(p);
        }
      }
    } else {
      // Add all available actions for this resource
      const resourcePerms = allPerms.filter((p) => p.resource === resourceKey);
      if (resourcePerms.length > 0) {
        for (const p of resourcePerms) {
          next.add(`${p.resource}.${p.action}`);
        }
      } else {
        next.add(`${resourceKey}.read`);
        next.add(`${resourceKey}.create`);
        next.add(`${resourceKey}.update`);
        next.add(`${resourceKey}.delete`);
      }
    }

    // Update UI immediately
    setMemberPermMap((prev) => ({
      ...prev,
      [userId]: next,
    }));

    // Auto-save directly to Database
    const member = members.find((m) => m.userId === userId);
    const roleId = selectedRowRoles[userId] || member?.roleId || rolesList[0]?.id;

    if (roleId) {
      setIsSavingRow((prev) => ({ ...prev, [userId]: true }));
      try {
        const res = await updateMemberRoleAndPermissionsAction({
          userId,
          roleId,
          customPermissions: Array.from(next),
        });

        if (res.success) {
          setSavedRowAlert((prev) => ({ ...prev, [userId]: true }));
          setTimeout(() => {
            setSavedRowAlert((prev) => ({ ...prev, [userId]: false }));
          }, 2500);
        }
      } catch (err) {
        console.error('Failed to auto-save permission toggle:', err);
      } finally {
        setIsSavingRow((prev) => ({ ...prev, [userId]: false }));
      }
    }
  };

  // Change role directly from table row dropdown
  const handleRowRoleChange = (userId: string, newRoleId: string) => {
    setSelectedRowRoles((prev) => ({
      ...prev,
      [userId]: newRoleId,
    }));
    setHasPendingChanges(true);
  };

  // Save single row changes (Role & Permissions)
  const handleSaveMemberRow = async (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    if (!member) return;
    const roleId = selectedRowRoles[userId] || member.roleId;
    const perms = memberPermMap[userId];

    setIsSavingRow((prev) => ({ ...prev, [userId]: true }));
    const res = await updateMemberRoleAndPermissionsAction({
      userId,
      roleId,
      customPermissions: perms ? Array.from(perms) : undefined,
    });
    setIsSavingRow((prev) => ({ ...prev, [userId]: false }));

    if (res.success) {
      setSavedRowAlert((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => {
        setSavedRowAlert((prev) => ({ ...prev, [userId]: false }));
      }, 3000);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal menyimpan perubahan role: ' + res.error);
    }
  };

  // Save all modified permissions to server
  const handleSaveAllPermissions = async () => {
    setIsSavingBatch(true);
    try {
      for (const m of members) {
        const roleId = selectedRowRoles[m.userId] || m.roleId;
        const perms = memberPermMap[m.userId];
        await updateMemberRoleAndPermissionsAction({
          userId: m.userId,
          roleId,
          customPermissions: perms ? Array.from(perms) : undefined,
        });
      }
      setHasPendingChanges(false);
      toast.updated('Hak Akses & Role', 'Semua perubahan role dan hak akses berhasil disimpan!');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Gagal menyimpan perubahan hak akses: ' + err);
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.permissions.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole =
      selectedRoleFilter === 'ALL' || m.roleId === selectedRoleFilter || m.roleCode === selectedRoleFilter;

    const matchGender =
      selectedGenderFilter === 'ALL' ||
      (selectedGenderFilter === 'M' && m.gender === 'M') ||
      (selectedGenderFilter === 'F' && m.gender === 'F');

    return matchSearch && matchRole && matchGender;
  });

  // Export CSV
  const handleExport = () => {
    exportToCSV(
      'Data_Anggota_Role_Permissions_Hoarizon',
      filteredMembers,
      [
        { header: 'Nama Lengkap', key: 'name' },
        { header: 'Email / Akun', key: 'email' },
        { header: 'Jenis Kelamin', key: (r) => (r.gender === 'M' ? 'Laki-laki' : 'Perempuan') },
        { header: 'Peran / Jabatan Kelas', key: 'role' },
        { header: 'Kode Role', key: 'roleCode' },
        {
          header: 'Hak Akses Modul Aktif',
          key: (r) =>
            modulesList
              .filter((mod) => hasResourceAccess(r.userId, mod.key))
              .map((mod) => mod.label)
              .join(', '),
        },
        { header: 'Total Izin (Permissions)', key: (r) => `${memberPermMap[r.userId]?.size || r.permsCount} Izin` },
        { header: 'Status Keanggotaan', key: (r) => (r.status === 'ACTIVE' ? 'Aktif' : r.status) },
      ],
      {
        title: 'DAFTAR ANGGOTA KELAS & HAK AKSES PERMISSIONS HOARIZON',
        subtitle: `Data anggota kelas, jabatan pengurus, dan pemetaan hak akses sistem`,
        summaryRows: [
          { label: 'Total Anggota Tercatat', value: `${filteredMembers.length} anggota` },
        ],
      }
    );
  };

  // Add Member
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Nama anggota tidak boleh kosong.');
      return;
    }
    setIsSubmitting(true);
    const email =
      formData.email.trim() ||
      `${formData.name.toLowerCase().replace(/\s+/g, '')}@hoarizon.dev`;
    const res = await createMemberAction({
      name: formData.name.trim(),
      email,
      gender: formData.gender,
      roleId: formData.roleId || rolesList[0]?.id,
    });
    setIsSubmitting(false);
    if (res.success) {
      setIsAddMemberOpen(false);
      toast.created('Anggota Kelas', `${formData.name.trim()} telah berhasil ditambahkan ke kelas.`);
      setFormData({
        name: '',
        email: '',
        gender: 'MALE',
        roleId: rolesList[0]?.id || '',
      });
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal menambah anggota: ' + res.error);
    }
  };

  // Add Role
  const handleAddRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name.trim() || !roleFormData.code.trim()) {
      toast.warning('Nama dan kode peran wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    const res = await createRoleAction({
      name: roleFormData.name.trim(),
      code: roleFormData.code.trim(),
      description: roleFormData.description.trim(),
    });
    setIsSubmitting(false);
    if (res.success) {
      setIsAddRoleOpen(false);
      toast.created('Role Jabatan', `Role "${roleFormData.name.trim()}" berhasil dibuat.`);
      setRoleFormData({ name: '', code: '', description: '' });
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal membuat role: ' + res.error);
    }
  };

  // Edit Member
  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);
    const res = await updateMemberAction(selectedMember.userId, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      gender: formData.gender,
      roleId: formData.roleId,
    });
    setIsSubmitting(false);
    if (res.success) {
      setIsEditOpen(false);
      toast.updated('Anggota Kelas', `Data anggota ${formData.name.trim()} berhasil diperbarui.`);
      setSelectedMember(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal memperbarui anggota: ' + res.error);
    }
  };

  // Delete Member
  const handleDeleteSubmit = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    const res = await deleteMemberAction(selectedMember.userId);
    setIsSubmitting(false);
    if (res.success) {
      setIsDeleteOpen(false);
      toast.deleted('Anggota Kelas', `${selectedMember.name} telah berhasil dihapus.`);
      setSelectedMember(null);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error('Gagal menghapus anggota: ' + res.error);
    }
  };

  // Open Granular Permissions Modal
  const handleOpenPermissions = (m: MemberItem) => {
    setSelectedMember(m);
    setMemberActivePerms(new Set(memberPermMap[m.userId] || m.permissions));
    setIsPermModalOpen(true);
  };

  const handleSaveModalPermissions = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    const res = await updateMemberRoleAndPermissionsAction({
      userId: selectedMember.userId,
      roleId: selectedMember.roleId,
      customPermissions: Array.from(memberActivePerms),
    });
    setIsSubmitting(false);
    if (res.success) {
      setMemberPermMap((prev) => ({
        ...prev,
        [selectedMember.userId]: new Set(memberActivePerms),
      }));
      setIsPermModalOpen(false);
      setSelectedMember(null);
      setRefreshKey((k) => k + 1);
      toast.updated('Hak Akses Anggota', `Hak akses untuk ${selectedMember.name} berhasil disimpan.`);
    } else {
      toast.error('Gagal memperbarui hak akses: ' + res.error);
    }
  };

  const toggleModalPerm = (permKey: string) => {
    const next = new Set(memberActivePerms);
    if (next.has(permKey)) {
      next.delete(permKey);
    } else {
      next.add(permKey);
    }
    setMemberActivePerms(next);
  };

  const pengurusCount = members.filter((m) => m.roleCode !== 'CLASS_MEMBER').length;
  const regulerCount = members.length - pengurusCount;

  if (!isPermLoading && !hasAccess('users') && !hasAccess('roles')) {
    return <AccessGate moduleName="Manajemen Anggota & Hak Akses" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)]">
            🛡️ Members & Access (Ceklis Hak Akses)
          </h1>
          <p className="text-sm text-[var(--color-denim-light)] opacity-70">
            Kelola nama anggota, peran jabatan, dan centang (ceklis) hak akses modul secara langsung (Live Database)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasPendingChanges && (
            <Button
              variant="primary"
              size="sm"
              className="!bg-emerald-600 hover:!bg-emerald-700 text-white animate-pulse"
              onClick={handleSaveAllPermissions}
              disabled={isSavingBatch}
            >
              {isSavingBatch ? 'Menyimpan...' : '💾 Simpan Ceklis Akses'}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            📥 Ekspor CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsAddRoleOpen(true)}>
            + Buat Role Baru
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                gender: 'MALE',
                roleId: rolesList[0]?.id || '',
              });
              setIsAddMemberOpen(true);
            }}
          >
            + Tambah Anggota
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-4 bg-[var(--color-income-bg)] border border-[var(--color-income)]/20">
          <p className="text-xs font-bold text-[#22543D]">Total Anggota Kelas</p>
          <p className="text-2xl font-black text-[var(--color-income)] font-[var(--font-display)] mt-1">
            {members.length} <span className="text-xs font-normal text-[var(--color-denim-light)]">Siswa</span>
          </p>
        </Card>

        <Card className="!p-4 bg-[var(--color-info-bg)] border border-[var(--color-info)]/20">
          <p className="text-xs font-bold text-[#2A4365]">Pengurus Kas & Kelas</p>
          <p className="text-2xl font-black text-[var(--color-info)] font-[var(--font-display)] mt-1">
            {pengurusCount} <span className="text-xs font-normal text-[var(--color-denim-light)]">Pengurus</span>
          </p>
        </Card>

        <Card className="!p-4 bg-[var(--color-pending-bg)] border border-[var(--color-pending)]/20">
          <p className="text-xs font-bold text-[#744210]">Anggota Biasa</p>
          <p className="text-2xl font-black text-[var(--color-pending)] font-[var(--font-display)] mt-1">
            {regulerCount} <span className="text-xs font-normal text-[var(--color-denim-light)]">Siswa</span>
          </p>
        </Card>

        <Card className="!p-4 bg-[var(--color-expense-bg)] border border-[var(--color-expense)]/20">
          <p className="text-xs font-bold text-[#742A2A]">Struktur Peran (Roles)</p>
          <p className="text-2xl font-black text-[var(--color-expense)] font-[var(--font-display)] mt-1">
            {rolesList.length} <span className="text-xs font-normal text-[var(--color-denim-light)]">Role Terdaftar</span>
          </p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="!p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-800 mr-1">Filter:</span>

            {/* Role Dropdown */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)]"
            >
              <option value="ALL">Semua Peran ({members.length})</option>
              {rolesList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <div className="flex gap-1 bg-[var(--color-baby-blue-50)] p-1 rounded-lg">
              {(['ALL', 'M', 'F'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenderFilter(g)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    selectedGenderFilter === g
                      ? 'bg-[var(--color-denim)] text-white font-bold'
                      : 'text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)]'
                  }`}
                >
                  {g === 'ALL' ? 'Semua' : g === 'M' ? 'L' : 'P'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama, peran, atau hak akses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-baby-blue)] w-full md:w-72"
            />
          </div>
        </div>
      </Card>

      {/* Main Table: Nama, Role, Checkboxes Hak Akses Modul, Aksi */}
      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            <span className="inline-block animate-spin mr-2">🌀</span> Memuat data anggota & matriks hak akses...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-denim-light)]">
            Tidak ada data anggota yang sesuai dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--color-baby-blue-50)]/60 border-b border-slate-200 text-slate-800">
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-900 min-w-[200px]">
                    Nama Anggota
                  </th>
                  <th className="text-left py-3.5 px-3 text-xs font-bold text-slate-900 min-w-[140px]">
                    Role / Jabatan
                  </th>
                  {/* Module Checkbox Columns */}
                  {modulesList.map((m) => (
                    <th
                      key={m.key}
                      className="text-center py-3.5 px-2 text-[11px] font-bold text-slate-800 min-w-[65px]"
                      title={m.title}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{m.icon}</span>
                        <span className="text-[10px] text-slate-700">{m.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-3.5 px-3 text-xs font-bold text-slate-900 min-w-[175px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMembers.map((m, i) => (
                  <motion.tr
                    key={m.userId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.012 }}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Column 1: NAMA ANGGOTA */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A90D9] to-[#2B6CB0] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {m.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                              {m.email}
                            </span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                m.gender === 'M'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-pink-100 text-pink-800'
                              }`}
                            >
                              {m.gender === 'M' ? 'L' : 'P'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: ROLE / JABATAN (INTERACTIVE SELECTOR) */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <select
                          value={selectedRowRoles[m.userId] || m.roleId}
                          onChange={(e) => handleRowRoleChange(m.userId, e.target.value)}
                          className={`w-full px-2 py-1 rounded-lg text-xs font-bold border transition-colors outline-none cursor-pointer ${
                            selectedRowRoles[m.userId] && selectedRowRoles[m.userId] !== m.roleId
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300'
                              : roleBadgeColors[m.roleCode] || 'border-slate-300 bg-white text-slate-900'
                          }`}
                        >
                          {rolesList.map((r) => (
                            <option key={r.id} value={r.id} className="text-slate-900 bg-white font-medium py-1">
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-[9px] text-slate-500 font-mono font-medium">
                          {m.roleCode}
                        </p>
                      </div>
                    </td>

                    {/* Checkbox Columns for each module */}
                    {modulesList.map((mod) => {
                      const isChecked = hasResourceAccess(m.userId, mod.key);

                      return (
                        <td key={mod.key} className="py-3 px-2 text-center align-middle">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleResourceCheckbox(m.userId, mod.key)}
                              className="w-4 h-4 rounded border-slate-300 text-[var(--color-denim)] focus:ring-[var(--color-baby-blue)] cursor-pointer accent-[#2B6CB0]"
                              title={`Ubah akses ${mod.title} untuk ${m.name}`}
                            />
                          </label>
                        </td>
                      );
                    })}

                    {/* Column 4: AKSI (DENGAN TOMBOL SIMPAN ROLE) */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Tombol Simpan Perubahan Role */}
                        <button
                          onClick={() => handleSaveMemberRow(m.userId)}
                          disabled={isSavingRow[m.userId]}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 ${
                            savedRowAlert[m.userId]
                              ? 'bg-emerald-600 text-white'
                              : selectedRowRoles[m.userId] && selectedRowRoles[m.userId] !== m.roleId
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-bounce'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                          }`}
                          title="Simpan Perubahan Role"
                        >
                          {isSavingRow[m.userId] ? (
                            '⏳...'
                          ) : savedRowAlert[m.userId] ? (
                            '✅ OK'
                          ) : (
                            '💾 Simpan'
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenPermissions(m)}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-sky-50 text-[var(--color-denim)] hover:bg-sky-100 border border-sky-200/60"
                          title="Buka Matriks Detail Hak Akses"
                        >
                          🔐 Akses
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setFormData({
                              name: m.name,
                              email: m.email,
                              gender: m.gender === 'M' ? 'MALE' : 'FEMALE',
                              roleId: selectedRowRoles[m.userId] || m.roleId,
                            });
                            setIsEditOpen(true);
                          }}
                          className="p-1 rounded-md text-slate-600 hover:bg-slate-100 text-xs"
                          title="Edit Profil & Peran"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1 rounded-md text-rose-600 hover:bg-rose-50 text-xs"
                          title="Nonaktifkan Anggota"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info & quick save toolbar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>💡 <strong>Tip:</strong> Centang/Hapus centang kotak (ceklis) pada kolom modul di atas untuk langsung memberikan atau mencabut izin akses anggota.</span>
          </div>
          {hasPendingChanges && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAllPermissions}
              disabled={isSavingBatch}
            >
              {isSavingBatch ? 'Menyimpan...' : '💾 Simpan Perubahan Ceklis'}
            </Button>
          )}
        </div>
      </Card>

      {/* Modal Tambah Anggota */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="+ Tambah Anggota & Tetapkan Role">
        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Nama Lengkap (Username)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Muhammad Aldo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Email / Akun
            </label>
            <input
              type="email"
              placeholder="Opsional (Otomatis dibuat jika kosong)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
              >
                <option value="MALE" className="text-slate-900 bg-white">Laki-laki</option>
                <option value="FEMALE" className="text-slate-900 bg-white">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Peran / Jabatan
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs font-bold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
              >
                {rolesList.map((r) => (
                  <option key={r.id} value={r.id} className="text-slate-900 bg-white font-medium py-1">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/50 text-[11px] text-amber-900 font-medium">
            ℹ️ Password default anggota baru: <span className="font-mono font-bold text-amber-950">[NamaDepan]#2026</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddMemberOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Anggota'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Buat Role Baru */}
      <Modal isOpen={isAddRoleOpen} onClose={() => setIsAddRoleOpen(false)} title="+ Buat Peran (Role) Baru">
        <form onSubmit={handleAddRoleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nama Peran</label>
            <input
              type="text"
              required
              placeholder="Contoh: Sie Konsumsi, Sie Acara..."
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Kode Peran</label>
            <input
              type="text"
              required
              placeholder="Contoh: SIE_KONSUMSI"
              value={roleFormData.code}
              onChange={(e) => setRoleFormData({ ...roleFormData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white uppercase font-mono text-xs font-bold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Deskripsi Tugas</label>
            <textarea
              rows={2}
              placeholder="Tanggung jawab dan wewenang peran..."
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddRoleOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Anggota & Role */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="✏️ Edit Profil & Ubah Peran">
        <form onSubmit={handleEditMemberSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
              >
                <option value="MALE" className="text-slate-900 bg-white">Laki-laki</option>
                <option value="FEMALE" className="text-slate-900 bg-white">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Peran / Jabatan</label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs font-bold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
              >
                {rolesList.map((r) => (
                  <option key={r.id} value={r.id} className="text-slate-900 bg-white font-medium py-1">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Perbarui'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Kelola Hak Akses / Permissions Granular */}
      <Modal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title={`🔐 Ceklis Hak Akses: ${selectedMember?.name} (${selectedMember?.role})`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Centang atau hapus centang kotak (ceklis) di bawah ini untuk menentukan izin akses granular untuk anggota <span className="font-bold text-slate-900">{selectedMember?.name}</span>.
          </p>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {allPerms.map((perm) => {
              const permKey = `${perm.resource}.${perm.action}`;
              const isChecked = memberActivePerms.has(permKey);
              const mod = modulesList.find((m) => m.key === perm.resource);
              const icon = mod?.icon || '🔑';

              return (
                <label
                  key={perm.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 transition-colors cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {perm.resource.toUpperCase()} — {perm.action.toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {perm.description || `Izin untuk ${perm.action} pada modul ${perm.resource}`}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleModalPerm(permKey)}
                    className="w-4 h-4 rounded border-slate-300 text-[var(--color-denim)] focus:ring-[var(--color-baby-blue)] cursor-pointer accent-[#2B6CB0]"
                  />
                </label>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsPermModalOpen(false)}>
              Tutup
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
              onClick={handleSaveModalPermissions}
            >
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan Hak Akses'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus / Nonaktifkan */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="🗑️ Nonaktifkan Anggota">
        <div className="space-y-4">
          <p className="text-sm text-slate-800">
            Apakah Anda yakin ingin menonaktifkan akun <span className="font-bold text-slate-950">{selectedMember?.name}</span>?
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
              {isSubmitting ? 'Menonaktifkan...' : 'Ya, Nonaktifkan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
