'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DenimPatchProps {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
}

export function DenimPatch({ children, className, rotate = -2 }: DenimPatchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: rotate * 2 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className={cn(
        'relative inline-block px-4 py-2',
        'bg-gradient-to-br from-[var(--color-denim)] to-[var(--color-denim-dark)]',
        'text-white font-bold text-sm rounded-lg',
        'shadow-[var(--shadow-denim)]',
        'border border-[var(--color-denim-light)]/20',
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Stitching effect */}
      <div className="absolute inset-[3px] border border-dashed border-white/20 rounded-md pointer-events-none" />
      {/* Denim texture overlay */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='white' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );
}

interface TapeProps {
  className?: string;
  rotate?: number;
  variant?: 'yellow' | 'clear';
}

export function Tape({ className, rotate = -3, variant = 'yellow' }: TapeProps) {
  const bg = variant === 'yellow'
    ? 'bg-gradient-to-r from-amber-100/70 via-amber-50/60 to-amber-100/70'
    : 'bg-gradient-to-r from-white/30 via-white/20 to-white/30';

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        'absolute w-16 h-5 rounded-sm z-10',
        bg,
        'border border-amber-200/30',
        'shadow-sm',
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    />
  );
}

interface StickerProps {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  emoji?: string;
}

export function Sticker({ children, className, rotate = -2, emoji }: StickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: rotate * 3 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ scale: 1.1, rotate: 0 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5',
        'bg-white rounded-full',
        'shadow-[var(--shadow-puffy-sm)]',
        'border border-[var(--color-baby-blue-200)]',
        'text-xs font-bold text-[var(--color-denim)]',
        'cursor-default select-none',
        className
      )}
    >
      {emoji && <span className="text-base">{emoji}</span>}
      {children}
    </motion.div>
  );
}
