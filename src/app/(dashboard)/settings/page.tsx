'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AccessGate } from '@/components/ui/AccessGate';
import { usePermissions } from '@/lib/permissions/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

export default function SettingsPage() {
  const { hasAccess, isLoading: isPermLoading } = usePermissions();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [theme, setTheme] = useState('Light');
  const [paymentMethods, setPaymentMethods] = useState(['CASH (Tunai)', 'ShopeePay (SPay)', 'SeaBank']);

  // Modals
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [isPmModalOpen, setIsPmModalOpen] = useState(false);
  const [newPmName, setNewPmName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!isPermLoading && !hasAccess('settings')) {
    return <AccessGate moduleName="Pengaturan & Konfigurasi Sistem" />;
  }

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmName.trim()) return;
    setPaymentMethods([...paymentMethods, newPmName.trim()]);
    setNewPmName('');
    setIsPmModalOpen(false);
    toast.created('Metode Pembayaran', `Metode "${newPmName.trim()}" berhasil ditambahkan.`);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setIsPwModalOpen(false);
    setNewPassword('');
    toast.updated('Keamanan Akun', 'Kata sandi berhasil diperbarui.');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-[var(--font-display)] text-[var(--color-accent-dark)]">⚙️ Settings</h1>
        <p className="text-sm text-[var(--color-denim-light)] opacity-70">Pengaturan aplikasi dan konfigurasi sistem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-base font-bold font-[var(--font-display)] text-[var(--color-accent)] mb-4">🎨 Appearance</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-accent)] font-medium">Tema Tampilan</span>
              <div className="flex gap-2">
                {['Light', 'Dark', 'System'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${theme === t
                        ? 'bg-[var(--color-denim)] text-white font-bold shadow-sm'
                        : 'bg-[var(--color-baby-blue-50)] text-[var(--color-denim)] hover:bg-[var(--color-baby-blue-100)]'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold font-[var(--font-display)] text-[var(--color-accent)] mb-4">💳 Payment Methods</h2>
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <div key={pm} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-baby-blue-50)]/50">
                <span className="text-xs font-medium text-[var(--color-accent)]">{pm}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-income-light)] text-[#22543D] font-medium">Active</span>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setIsPmModalOpen(true)}
            >
              + Tambah Metode Pembayaran
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold font-[var(--font-display)] text-[var(--color-accent)] mb-4">🏫 Class Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--color-denim-light)]">Kelas</span><span className="font-semibold">HOARIZON</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-denim-light)]">Jurusan</span><span className="font-semibold">Pengelolaan Perhotelan</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-denim-light)]">Total Mahasiswa</span><span className="font-semibold">25 Anggota</span></div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold font-[var(--font-display)] text-[var(--color-accent)] mb-4">🔒 Security & Authentication</h2>
          <div className="space-y-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setIsPwModalOpen(true)}
            >
              Ganti Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleResetPin}
            >
              Reset PIN
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal Tambah Metode Pembayaran */}
      <Modal isOpen={isPmModalOpen} onClose={() => setIsPmModalOpen(false)} title="+ Tambah Metode Pembayaran">
        <form onSubmit={handleAddPaymentMethod} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Nama Metode / Bank</label>
            <input
              type="text"
              required
              placeholder="Contoh: GoPay, Bank Mandiri, DANA..."
              value={newPmName}
              onChange={(e) => setNewPmName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
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
      <Modal isOpen={isPwModalOpen} onClose={() => setIsPwModalOpen(false)} title="🔑 Ganti Password Akun">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Password Baru</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-[var(--color-baby-blue)] outline-none shadow-sm"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsPwModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Perbarui Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
