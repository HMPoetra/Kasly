'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { getCurrentUserPermissionsAction } from '@/lib/actions/db-actions';

export function ProfileDropdown() {
  const router = useRouter();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { confirm } = useConfirm();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    roleName: string;
    roleCode: string;
  }>({
    name: 'Pengurus Kas',
    email: 'user@hoarizon.app',
    roleName: 'Pengurus Kas',
    roleCode: 'CLASS_LEADER',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await getCurrentUserPermissionsAction();
        if (res.isAuthenticated) {
          setUserInfo({
            name: res.userName || (res.roleCode === 'CLASS_LEADER' ? 'Ketua Kelas' : 'Bendahara'),
            email: res.userEmail || 'user@hoarizon.app',
            roleName:
              res.roleCode === 'CLASS_LEADER'
                ? 'Ketua Kelas'
                : res.roleCode === 'TREASURER_1'
                ? 'Bendahara 1'
                : res.roleCode === 'TREASURER_2'
                ? 'Bendahara 2'
                : res.roleCode === 'HOMEROOM_TEACHER'
                ? 'Wali Kelas'
                : 'Anggota Kelas',
            roleCode: res.roleCode || 'CLASS_MEMBER',
          });
        }
      } catch (err) {
        console.error('Error fetching user info for profile:', err);
      }
    }
    loadUser();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Konfirmasi Keluar (Logout)',
      description: 'Apakah Anda yakin ingin keluar dari sesi akun Kasly saat ini?',
      confirmText: 'Ya, Keluar Akun',
      cancelText: 'Batal',
      type: 'danger',
    });

    if (isConfirmed) {
      toast.info('Sedang keluar dari akun...', 'Logout');
      setIsOpen(false);
      await signOut({ callbackUrl: '/login' });
    }
  };

  const initialLetter = (userInfo.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Avatar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        aria-label="Menu Pengguna"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-denim)] to-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xs shadow-xs ring-2 ring-sky-200 dark:ring-sky-900 group-hover:scale-105 transition-transform">
            {initialLetter}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </div>

        <div className="hidden md:flex flex-col items-start text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
            {userInfo.name}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {userInfo.roleName}
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-700 dark:text-slate-300' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Profile Pop-up Dropdown Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] z-50 overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            {/* Header: User Info Card */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--color-denim)] to-[var(--color-accent)] flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-sky-200 dark:ring-sky-900">
                  {initialLetter}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate font-[var(--font-display)]">
                    {userInfo.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {userInfo.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    👑 {userInfo.roleName}
                  </span>
                </div>
              </div>
            </div>

            {/* Dark Mode Segmented Switcher */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center justify-between">
                <span>Tema Tampilan (Dark Mode)</span>
                <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                  {resolvedTheme === 'dark' ? '🌙 Mode Gelap' : '☀️ Mode Terang'}
                </span>
              </p>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'light' as const, label: 'Terang', icon: '☀️' },
                  { id: 'dark' as const, label: 'Gelap', icon: '🌙' },
                  { id: 'system' as const, label: 'Sistem', icon: '💻' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      theme === t.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="p-2 space-y-0.5">
              {[
                { label: 'Profil & Pengaturan Akun', icon: '👤', href: '/settings' },
                { label: 'Hak Akses & Peran Jabatan', icon: '🛡️', href: '/permissions' },
                { label: 'Riwayat & Log Aktivitas', icon: '📜', href: '/audit' },
              ].map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(item.href);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout Action Button */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-2.5 cursor-pointer group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🚪</span>
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
