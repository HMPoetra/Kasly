'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/lib/actions/db-actions';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  href: string;
  timeAgo: string;
}

const typeConfig: Record<
  string,
  { icon: string; bg: string; text: string; badge: string; badgeBg: string }
> = {
  PAYMENT_OVERDUE: {
    icon: '💳',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    badge: 'Tagihan Kas',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  TARGET_NEAR_COMPLETION: {
    icon: '🎯',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    badge: 'Target Tabungan',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  PAYMENT_RECEIVED: {
    icon: '💸',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    badge: 'Buku Kas (Finance)',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  EVIDENCE_UPLOADED: {
    icon: '📎',
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    badge: 'Bukti & Nota',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  EVIDENCE_REJECTED: {
    icon: '⚠️',
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    badge: 'Verifikasi Ditolak',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  PERMISSION_CHANGED: {
    icon: '🛡️',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    badge: 'Hak Akses',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
};

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotificationsAction();
      setNotifications(res.notifications as NotificationItem[]);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
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

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationAsReadAction(notif.id);
    }
    setIsOpen(false);
    if (notif.href) {
      router.push(notif.href);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsReadAction();
    setIsLoading(false);
  };

  const filteredNotifs = notifications.filter((n) =>
    filter === 'UNREAD' ? !n.isRead : true
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-[var(--color-baby-blue-50)] transition-colors focus:outline-none cursor-pointer"
        aria-label="Buka Notifikasi"
      >
        <svg
          className="w-5 h-5 text-[var(--color-denim)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Animated Badge Count */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-sm"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Pop-up Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto mt-2.5 w-[calc(100vw-24px)] sm:w-[460px] md:w-[490px] max-w-[490px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] z-50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[85vh]"
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-2">
                <span className="text-base">🔔</span>
                <h3 className="text-sm font-black font-[var(--font-display)] text-slate-900">
                  Notifikasi
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    {unreadCount} belum dibaca
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  ✓ Tandai Semua Dibaca
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === 'UNREAD'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 bg-white">
              {filteredNotifs.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-400 text-xs">
                  <span className="text-3xl block mb-2">✨</span>
                  <p className="font-bold text-slate-700 text-sm">Tidak ada notifikasi</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {filter === 'UNREAD'
                      ? 'Seluruh pesan notifikasi telah Anda baca.'
                      : 'Belum ada notifikasi aktivitas baru.'}
                  </p>
                </div>
              ) : (
                filteredNotifs.map((notif) => {
                  const cfg = typeConfig[notif.type] || {
                    icon: '🔔',
                    bg: 'bg-blue-100',
                    text: 'text-blue-800',
                    badge: 'Aktivitas',
                    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
                  };

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`p-4 hover:bg-slate-50/90 transition-all cursor-pointer flex items-start gap-3.5 relative group ${
                        !notif.isRead
                          ? 'bg-sky-50/40 border-l-4 border-l-sky-500'
                          : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Icon Avatar */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 mt-0.5 shadow-2xs ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.icon}
                      </div>

                      {/* Content (Full text, no truncated ellipsis) */}
                      <div className="flex-1 min-w-0">
                        {/* Top Metadata: Badge & Time */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeBg}`}
                          >
                            {cfg.badge}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                            {notif.timeAgo}
                          </span>
                        </div>

                        {/* Title - Full wrapping without truncation */}
                        <h4
                          className={`text-xs sm:text-[13px] leading-snug break-words ${
                            !notif.isRead
                              ? 'font-black text-slate-900'
                              : 'font-bold text-slate-800'
                          }`}
                        >
                          {notif.title}
                        </h4>

                        {/* Message - Full text clearly visible without line-clamp truncation */}
                        <p className="text-[12px] text-slate-600 leading-relaxed mt-1 break-words font-normal">
                          {notif.message}
                        </p>

                        {/* Bottom action hint */}
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-sky-600 group-hover:text-sky-700 transition-colors">
                          <span>Buka rincian</span>
                          <span className="transition-transform group-hover:translate-x-0.5">→</span>
                        </div>
                      </div>

                      {/* Unread indicator pulse */}
                      {!notif.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0 mt-2 ring-4 ring-sky-100" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Quick Link */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/audit');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Lihat Seluruh Log &amp; Riwayat Aktivitas Kelas →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
