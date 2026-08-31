'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ConfirmType = 'create' | 'update' | 'delete' | 'verify' | 'warning' | 'danger';

export interface ConfirmOptions {
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

const typeConfigs = {
  create: {
    icon: '➕',
    iconGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    iconGlow: 'bg-emerald-500/30',
    borderClass: 'border-emerald-200/80',
    buttonClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 active:scale-95',
    defaultConfirmText: 'Ya, Simpan Data',
    tagText: 'KONFIRMASI TAMBAH',
    tagBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  update: {
    icon: '✏️',
    iconGradient: 'from-sky-400 via-blue-500 to-sky-600',
    iconGlow: 'bg-sky-500/30',
    borderClass: 'border-sky-200/80',
    buttonClass: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg shadow-sky-500/25 active:scale-95',
    defaultConfirmText: 'Ya, Simpan Perubahan',
    tagText: 'KONFIRMASI PERUBAHAN',
    tagBg: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  delete: {
    icon: '🗑️',
    iconGradient: 'from-rose-500 via-red-600 to-rose-700',
    iconGlow: 'bg-rose-500/35',
    borderClass: 'border-rose-200/80',
    buttonClass: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-500/30 active:scale-95',
    defaultConfirmText: 'Ya, Hapus Data',
    tagText: 'PERINGATAN PENGHAPUSAN',
    tagBg: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  danger: {
    icon: '⚠️',
    iconGradient: 'from-rose-500 via-amber-600 to-red-600',
    iconGlow: 'bg-rose-500/35',
    borderClass: 'border-rose-200/80',
    buttonClass: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-500/30 active:scale-95',
    defaultConfirmText: 'Ya, Lanjutkan',
    tagText: 'PERINGATAN KRUSIAL',
    tagBg: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  verify: {
    icon: '✓',
    iconGradient: 'from-purple-400 via-indigo-500 to-purple-600',
    iconGlow: 'bg-purple-500/30',
    borderClass: 'border-purple-200/80',
    buttonClass: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 active:scale-95',
    defaultConfirmText: 'Ya, Setujui & Konfirmasi',
    tagText: 'KONFIRMASI VERIFIKASI',
    tagBg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  warning: {
    icon: '⚠️',
    iconGradient: 'from-amber-400 via-orange-500 to-amber-600',
    iconGlow: 'bg-amber-500/30',
    borderClass: 'border-amber-200/80',
    buttonClass: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 active:scale-95',
    defaultConfirmText: 'Ya, Lanjutkan',
    tagText: 'PERHATIAN',
    tagBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
  }>({
    isOpen: false,
    options: {
      title: '',
      description: '',
    },
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setModalState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const activeType = modalState.options.type || 'delete';
  const config = typeConfigs[activeType] || typeConfigs.delete;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Modern Glassmorphic Animated Confirmation Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop with Blur Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleClose(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Card with Spring Bounce & Tilt */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 35, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', damping: 18, stiffness: 300, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
            >
              {/* Shimmer Light Bar across header */}
              <div className={`h-2 w-full bg-gradient-to-r ${config.iconGradient}`} />

              <div className="p-6">
                {/* Header with Animated Glowing Icon & Tag */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Icon Avatar with Expanding Ping Halo */}
                  <div className="relative flex-shrink-0">
                    <span
                      className={`absolute -inset-1.5 rounded-2xl animate-ping opacity-35 pointer-events-none ${config.iconGlow}`}
                    />
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: [0, 1.4, 0.9, 1.15, 1], rotate: [0, -18, 12, -6, 0] }}
                      transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
                      className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${config.iconGradient} text-white flex items-center justify-center text-xl font-bold shadow-md`}
                    >
                      {config.icon}
                    </motion.div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className={`inline-block text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border mb-1.5 uppercase ${config.tagBg}`}
                    >
                      {config.tagText}
                    </span>
                    <h3 className="text-base font-black font-[var(--font-display)] text-slate-900 leading-snug">
                      {modalState.options.title}
                    </h3>
                  </div>
                </div>

                {/* Description Body */}
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 mb-5">
                  {typeof modalState.options.description === 'string' ? (
                    <p>{modalState.options.description}</p>
                  ) : (
                    modalState.options.description
                  )}
                </div>

                {/* Action Buttons with Spring Response */}
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100/80 transition-all active:scale-95 cursor-pointer"
                  >
                    {modalState.options.cancelText || 'Batal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClose(true)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${config.buttonClass}`}
                  >
                    {modalState.options.confirmText || config.defaultConfirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

// Standalone Modal for backward compatibility
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Batal',
  type = 'update',
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  isLoading?: boolean;
}) {
  const config = typeConfigs[type] || typeConfigs.update;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 35, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 300, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${config.iconGradient}`} />

            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  <span
                    className={`absolute -inset-1.5 rounded-2xl animate-ping opacity-35 pointer-events-none ${config.iconGlow}`}
                  />
                  <div
                    className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${config.iconGradient} text-white flex items-center justify-center text-xl font-bold shadow-md`}
                  >
                    {config.icon}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border mb-1.5 uppercase ${config.tagBg}`}
                  >
                    {config.tagText}
                  </span>
                  <h3 className="text-base font-black font-[var(--font-display)] text-slate-900 leading-snug">
                    {title}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 mb-5">
                {typeof description === 'string' ? <p>{description}</p> : description}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100/80 transition-all active:scale-95 cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${config.buttonClass}`}
                >
                  {isLoading ? 'Memproses...' : confirmText || config.defaultConfirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
