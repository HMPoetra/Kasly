'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PuffyTextProps {
  text: string;
  className?: string;
  letterClassName?: string;
  delay?: number;
}

export function PuffyText({
  text,
  className,
  letterClassName,
  delay = 0,
}: PuffyTextProps) {
  const letters = text.split('');

  return (
    <div className={cn('flex items-center gap-1 select-none', className)}>
      {letters.map((letter, i) => (
        <motion.span
          key={`${letter}-${i}`}
          initial={{ opacity: 0, y: 30, rotateZ: -10, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, rotateZ: 0, scale: 1 }}
          transition={{
            delay: delay + i * 0.08,
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className={cn(
            'inline-block font-black text-4xl md:text-6xl lg:text-7xl',
            'bg-gradient-to-b from-[var(--color-baby-blue-light)] via-[var(--color-baby-blue)] to-[var(--color-denim)]',
            '-webkit-background-clip-text bg-clip-text text-transparent',
            'drop-shadow-[0_3px_6px_rgba(43,108,176,0.3)]',
            letter === ' ' && 'w-4',
            letterClassName
          )}
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          whileHover={{
            scale: 1.2,
            rotateZ: i % 2 === 0 ? 5 : -5,
            transition: { duration: 0.2 },
          }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
}
