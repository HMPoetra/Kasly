'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'income' | 'expense' | 'pending' | 'info' | 'denim';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[var(--color-baby-blue-100)] text-[var(--color-denim-dark)] border-[var(--color-baby-blue-200)]',
    income: 'status-paid',
    expense: 'status-unpaid',
    pending: 'status-pending',
    info: 'status-partial',
    denim: 'bg-[var(--color-denim)] text-white border-[var(--color-denim-dark)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5',
        'text-xs font-semibold rounded-full',
        'border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
