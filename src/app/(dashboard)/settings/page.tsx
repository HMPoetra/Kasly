'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

import { changePasswordAction } from '@/lib/actions/db-actions';

export default function SettingsPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const { confirm } = useConfirm();


  const [paymentMethods, setPaymentMethods] = useState(['CASH (Tunai)', 'ShopeePay (SPay)', 'SeaBank']);

  // Modals
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [isPmModalOpen, setIsPmModalOpen] = useState(false);
  const [newPmName, setNewPmName] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Password form state
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  if (!isPermLoading && !hasAccess('settings')) {
    return <AccessGate moduleName="Pengaturan &amp; Konfigurasi Sistem" />;
  }

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmName.trim()) return;
    setPaymentMethods([...paymentMethods, newPmName.trim()]);
    setNewPmName('');
    setIsPmModalOpen(false);
    toast.created('Metode Pembayaran', `Metode "${newPmName.trim()}" berhasil ditambahkan.`);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pwForm.currentPassword) {
      toast.warning('Masukkan password saat ini terlebih dahulu.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.warning('Password baru minimal 6 karakter.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Konfirmasi password tidak sesuai dengan password baru.');
      return;
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      toast.warning('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setIsChangingPw(true);
    const res = await changePasswordAction(pwForm.currentPassword, pwForm.newPassword);
    setIsChangingPw(false);

    if (res.success) {
      setIsPwModalOpen(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.updated('Keamanan Akun', 'Kata sandi berhasil diperbarui. Gunakan password baru saat login berikutnya.');
    } else {
      toast.error(res.error || 'Gagal memperbarui password.');
    }
  };

  const handleResetPin = async () => {
    const ok = await confirm({
      title: 'Reset PIN Otentikasi Kas?',
      description: 'Apakah Anda yakin ingin mengatur ulang PIN otentikasi kas ke nilai default (123456)?',
      confirmText: 'Ya, Reset PIN',
      cancelText: 'Batal',
      type: 'warning',
    });
    if (ok) {
      toast.updated('PIN Kas', 'PIN otentikasi kas berhasil direset ke default: 123456');
    }
  };

  const closePwModal = () => {
    setIsPwModalOpen(false);
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowCurrentPw(false);
    setShowNewPw(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)]">
          ⚙️ Pengaturan Sistem
        </h1>
        <p className="text-sm text-[var(--color-denim-light)] opacity-70">
          Konfigurasi tampilan, keamanan akun, dan data kelas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Payment Methods */}
        <Card>
          <h2 className="text-base font-bold font-[var(--font-display)] text-[var(--color-accent)] mb-4">
            💳 Metode Pembayaran
          </h2>
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <div
                key={pm}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-baby-blue-50)]/50 dark:bg-slate-800/60"
              >
                <span className="text-xs font-medium text-[var(--color-accent)]">{pm}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-medium">
                  Aktif
                </span>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsPmModalOpen(true)}>
              + Tambah Metode Pembayaran
            </Button>
          </div>
        </Card>

        {/* Class Info */}
        <Card>
          <h2 className="text-base font-bold font-[var(--font-display)] text-[var(--color-accent)] mb-4">
            🏫 Info Kelas
          </h2>
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Nama Kelas', value: 'HOARIZON' },
              { label: 'Jurusan', value: 'X PPLG 1' },
              { label: 'Total Anggota', value: '25 Siswa' },
              { label: 'Tahun Ajaran', value: '2025 / 2026' },
              { label: 'Versi Aplikasi', value: 'KASLY v1.0' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[var(--color-denim-light)] text-xs">{label}</span>
                <span className="font-semibold text-xs">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card>
          <h2 className="text-base font-bold font-[var(--font-display)] text-[var(--color-accent)] mb-4">
            🔒 Keamanan Akun
          </h2>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 font-medium">
              💡 Ganti password secara berkala untuk menjaga keamanan akun kas kelas.
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setIsPwModalOpen(true)}
            >
              🔑 Ganti Password Akun
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={handleResetPin}>
              🔄 Reset PIN Otentikasi
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal Tambah Metode Pembayaran */}
      <Modal isOpen={isPmModalOpen} onClose={() => setIsPmModalOpen(false)} title="+ Tambah Metode Pembayaran">
        <form onSubmit={handleAddPaymentMethod} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Nama Metode / Bank
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: GoPay, Bank Mandiri, DANA..."
              value={newPmName}
              onChange={(e) => setNewPmName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsPmModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ganti Password */}
      <Modal isOpen={isPwModalOpen} onClose={closePwModal} title="🔑 Ganti Password Akun">
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Password Saat Ini */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Password Saat Ini <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                placeholder="Masukkan password lama"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="w-full pr-10 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer text-sm"
                tabIndex={-1}
              >
                {showCurrentPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Password Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="w-full pr-10 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer text-sm"
                tabIndex={-1}
              >
                {showNewPw ? '🙈' : '👁️'}
              </button>
            </div>
            {pwForm.newPassword.length > 0 && pwForm.newPassword.length < 6 && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">⚠️ Minimal 6 karakter</p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Konfirmasi Password Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Ulangi password baru"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className={`w-full px-3 py-2.5 rounded-xl border text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-semibold focus:ring-2 outline-none transition-all ${
                pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword
                  ? 'border-rose-400 focus:ring-rose-300'
                  : pwForm.confirmPassword && pwForm.confirmPassword === pwForm.newPassword
                  ? 'border-emerald-400 focus:ring-emerald-300'
                  : 'border-slate-300 dark:border-slate-600 focus:ring-[var(--color-baby-blue)]'
              }`}
            />
            {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">⚠️ Password tidak cocok</p>
            )}
            {pwForm.confirmPassword && pwForm.confirmPassword === pwForm.newPassword && pwForm.newPassword.length >= 6 && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✓ Password cocok</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closePwModal}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isChangingPw}
              disabled={isChangingPw}
            >
              {isChangingPw ? 'Memperbarui...' : 'Perbarui Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
