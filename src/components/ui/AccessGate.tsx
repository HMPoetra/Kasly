'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from './Button';

interface AccessGateProps {
  moduleName?: string;
  description?: string;
}

export function AccessGate({
  moduleName = 'Modul Ini',
  description = 'Anda tidak memiliki hak akses untuk membuka atau mengubah data pada modul ini. Silakan hubungi Ketua Kelas atau Bendahara jika Anda memerlukan akses.',
}: AccessGateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-[var(--shadow-puffy-lg)] border border-[var(--color-baby-blue-200)]/40 p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
          🔒
        </div>

        <h2 className="text-xl font-black font-[var(--font-display)] text-slate-800 mb-2">
          Akses Dibatasi
        </h2>

        <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">
          {moduleName}
        </p>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/dashboard">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              🏠 Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          💡 Hubungi administrator jika menurut Anda ini adalah kekeliruan.
        </div>
      </motion.div>
    </div>
  );
}
