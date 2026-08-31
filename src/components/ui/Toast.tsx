'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'create' | 'update' | 'delete' | 'verify';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, optionsOrDuration?: ToastOptions | number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  created: (entityName: string, detail?: string) => void;
  updated: (entityName: string, detail?: string) => void;
  deleted: (entityName: string, detail?: string) => void;
  verified: (entityName: string, detail?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Gentle Web Audio synthesiser for micro-sound feedback
function playSubtleChime(type: ToastType) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const notes: Record<ToastType, number[]> = {
      create: [523.25, 659.25, 783.99], // C5 -> E5 -> G5 (Uplifting major chord)
      update: [587.33, 880.0],          // D5 -> A5 (Bright chime)
      delete: [392.0, 329.63],          // G4 -> E4 (Soft wooden snap)
      verify: [659.25, 830.61, 1046.5], // E5 -> G#5 -> C6 (Celestial triumphant)
      success: [523.25, 659.25, 783.99],
      error: [349.23, 293.66],          // F4 -> D4 (Soft warning tap)
      warning: [440.0, 440.0],
      info: [523.25, 659.25],
    };

    const freqs = notes[type] || [523.25];
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.07);

      gain.gain.setValueAtTime(0.04, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.38);
    });
  } catch {
    // Ignore audio restriction errors
  }
}

const toastConfigs: Record<
  ToastType,
  {
    icon: string;
    defaultTitle: string;
    bgClass: string;
    borderClass: string;
    badgeBg: string;
    badgeGlow: string;
    accentBar: string;
    tagText: string;
    glowBorder: string;
  }
> = {
  create: {
    icon: '➕',
    defaultTitle: 'Berhasil Ditambahkan!',
    bgClass: 'bg-white/95 text-emerald-950 shadow-2xl shadow-emerald-500/20',
    borderClass: 'border-emerald-300/80',
    badgeBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white',
    badgeGlow: 'bg-emerald-400/40',
    accentBar: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600',
    tagText: 'CREATE',
    glowBorder: 'ring-2 ring-emerald-400/30',
  },
  update: {
    icon: '✏️',
    defaultTitle: 'Berhasil Diperbarui!',
    bgClass: 'bg-white/95 text-sky-950 shadow-2xl shadow-sky-500/20',
    borderClass: 'border-sky-300/80',
    badgeBg: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
    badgeGlow: 'bg-sky-400/40',
    accentBar: 'bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600',
    tagText: 'UPDATE',
    glowBorder: 'ring-2 ring-sky-400/30',
  },
  delete: {
    icon: '🗑️',
    defaultTitle: 'Berhasil Dihapus!',
    bgClass: 'bg-white/95 text-rose-950 shadow-2xl shadow-rose-500/20',
    borderClass: 'border-rose-300/80',
    badgeBg: 'bg-gradient-to-br from-rose-400 to-red-600 text-white',
    badgeGlow: 'bg-rose-400/40',
    accentBar: 'bg-gradient-to-r from-rose-400 via-red-500 to-rose-600',
    tagText: 'DELETE',
    glowBorder: 'ring-2 ring-rose-400/30',
  },
  verify: {
    icon: '✓',
    defaultTitle: 'Berhasil Diverifikasi!',
    bgClass: 'bg-white/95 text-purple-950 shadow-2xl shadow-purple-500/20',
    borderClass: 'border-purple-300/80',
    badgeBg: 'bg-gradient-to-br from-purple-400 to-indigo-600 text-white',
    badgeGlow: 'bg-purple-400/40',
    accentBar: 'bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600',
    tagText: 'VERIFIED',
    glowBorder: 'ring-2 ring-purple-400/30',
  },
  success: {
    icon: '✓',
    defaultTitle: 'Aksi Berhasil',
    bgClass: 'bg-white/95 text-emerald-950 shadow-2xl shadow-emerald-500/20',
    borderClass: 'border-emerald-300/80',
    badgeBg: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white',
    badgeGlow: 'bg-emerald-400/40',
    accentBar: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600',
    tagText: 'SUCCESS',
    glowBorder: 'ring-2 ring-emerald-400/30',
  },
  error: {
    icon: '✕',
    defaultTitle: 'Terjadi Kesalahan',
    bgClass: 'bg-white/95 text-rose-950 shadow-2xl shadow-rose-500/20',
    borderClass: 'border-rose-300/80',
    badgeBg: 'bg-gradient-to-br from-rose-400 to-red-600 text-white',
    badgeGlow: 'bg-rose-400/40',
    accentBar: 'bg-gradient-to-r from-rose-400 via-red-500 to-rose-600',
    tagText: 'ERROR',
    glowBorder: 'ring-2 ring-rose-400/30',
  },
  warning: {
    icon: '⚠️',
    defaultTitle: 'Peringatan',
    bgClass: 'bg-white/95 text-amber-950 shadow-2xl shadow-amber-500/20',
    borderClass: 'border-amber-300/80',
    badgeBg: 'bg-gradient-to-br from-amber-400 to-orange-600 text-white',
    badgeGlow: 'bg-amber-400/40',
    accentBar: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600',
    tagText: 'WARNING',
    glowBorder: 'ring-2 ring-amber-400/30',
  },
  info: {
    icon: 'ℹ',
    defaultTitle: 'Informasi',
    bgClass: 'bg-white/95 text-blue-950 shadow-2xl shadow-blue-500/20',
    borderClass: 'border-blue-300/80',
    badgeBg: 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white',
    badgeGlow: 'bg-blue-400/40',
    accentBar: 'bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600',
    tagText: 'INFO',
    glowBorder: 'ring-2 ring-blue-400/30',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, optionsOrDuration?: ToastOptions | number) => {
      const id = crypto.randomUUID();
      let title = toastConfigs[type]?.defaultTitle || 'Notifikasi';
      let description: string | undefined = message;
      let duration = 4200;

      if (typeof optionsOrDuration === 'number') {
        duration = optionsOrDuration;
      } else if (optionsOrDuration && typeof optionsOrDuration === 'object') {
        if (optionsOrDuration.title) title = optionsOrDuration.title;
        if (optionsOrDuration.description !== undefined) {
          description = optionsOrDuration.description;
        }
        if (optionsOrDuration.duration) duration = optionsOrDuration.duration;
      }

      const newToast: ToastItem = {
        id,
        type,
        title,
        description,
        duration,
      };

      playSubtleChime(type);
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      addToast('success', message, { title: title || 'Aksi Berhasil', description: message });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      addToast('error', message, { title: title || 'Gagal Melakukan Aksi', description: message });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      addToast('warning', message, { title: title || 'Peringatan', description: message });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      addToast('info', message, { title: title || 'Informasi', description: message });
    },
    [addToast]
  );

  const created = useCallback(
    (entityName: string, detail?: string) => {
      addToast('create', detail || `${entityName} telah berhasil ditambahkan ke sistem.`, {
        title: `➕ ${entityName} Berhasil Dibuat`,
        description: detail || `${entityName} telah berhasil disimpan ke database.`,
      });
    },
    [addToast]
  );

  const updated = useCallback(
    (entityName: string, detail?: string) => {
      addToast('update', detail || `Perubahan pada ${entityName} berhasil disimpan.`, {
        title: `✏️ ${entityName} Berhasil Diperbarui`,
        description: detail || `Data terbaru ${entityName} telah diperbarui di sistem.`,
      });
    },
    [addToast]
  );

  const deleted = useCallback(
    (entityName: string, detail?: string) => {
      addToast('delete', detail || `${entityName} telah berhasil dihapus dari sistem.`, {
        title: `🗑️ ${entityName} Berhasil Dihapus`,
        description: detail || `Data ${entityName} telah dihapus dari sistem.`,
      });
    },
    [addToast]
  );

  const verified = useCallback(
    (entityName: string, detail?: string) => {
      addToast('verify', detail || `${entityName} telah berhasil dikonfirmasi & diverifikasi.`, {
        title: `✓ ${entityName} Berhasil Diverifikasi`,
        description: detail || `Status ${entityName} telah disetujui & diverifikasi pengurus.`,
      });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        addToast,
        success,
        error,
        warning,
        info,
        created,
        updated,
        deleted,
        verified,
      }}
    >
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const config = toastConfigs[toast.type] || toastConfigs.info;

            return (
              <motion.div
                key={toast.id}
                layout
                drag="x"
                dragConstraints={{ left: 0, right: 280 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 75 || info.velocity.x > 300) {
                    removeToast(toast.id);
                  }
                }}
                initial={{
                  opacity: 0,
                  y: 60,
                  scale: 0.65,
                  rotate: -3.5,
                  filter: 'blur(6px)',
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                  filter: 'blur(0px)',
                }}
                exit={{
                  opacity: 0,
                  x: 120,
                  scale: 0.7,
                  filter: 'blur(6px)',
                  transition: { duration: 0.25, ease: 'easeIn' },
                }}
                whileHover={{
                  scale: 1.025,
                  y: -2,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: 'spring',
                  damping: 16,
                  stiffness: 260,
                  mass: 0.85,
                }}
                className={cn(
                  'pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl flex flex-col cursor-grab active:cursor-grabbing select-none',
                  config.bgClass,
                  config.borderClass,
                  config.glowBorder
                )}
              >
                {/* 1. Diagonal Shimmer Flash Animation */}
                <motion.div
                  initial={{ x: '-120%' }}
                  animate={{ x: '240%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.05 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none -skew-x-12 z-10"
                />

                {/* 2. Main Card Content */}
                <div className="p-3.5 flex items-start gap-3 relative z-20">
                  {/* Icon Avatar with Ring Glow & Micro-Wiggle */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    {/* Pulsing Aura Ping */}
                    <span
                      className={cn(
                        'absolute -inset-1 rounded-2xl animate-ping opacity-30 pointer-events-none',
                        config.badgeGlow
                      )}
                    />

                    {/* Animated Icon Pill */}
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{
                        scale: [0, 1.35, 0.9, 1.12, 1],
                        rotate: [0, -16, 12, -6, 0],
                      }}
                      transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
                      className={cn(
                        'relative w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black shadow-md',
                        config.badgeBg
                      )}
                    >
                      {config.icon}
                    </motion.div>
                  </div>

                  {/* Text Details & Action Tag */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-slate-900/5 text-slate-700">
                        {config.tagText}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 leading-tight">
                      {toast.title}
                    </h4>
                    {toast.description && (
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                        {toast.description}
                      </p>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToast(toast.id);
                    }}
                    className="text-slate-400 hover:text-slate-700 transition-all text-sm leading-none p-1.5 -mr-1 -mt-1 rounded-xl hover:bg-slate-100/80 active:scale-90 flex-shrink-0"
                    aria-label="Tutup Notifikasi"
                  >
                    ✕
                  </button>
                </div>

                {/* 3. Countdown Progress Bar at Bottom */}
                <div className="h-1 w-full bg-slate-100/60 overflow-hidden relative">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{
                      duration: toast.duration / 1000,
                      ease: 'linear',
                    }}
                    className={cn('h-full', config.accentBar)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
