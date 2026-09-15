'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'paper' | 'denim' | 'glass';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, variant = 'paper', hover = true, onClick }: CardProps) {
  const variants: Record<string, string> = {
    paper: 'paper-card dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100',
    denim: 'denim-card',
    glass: [
      'backdrop-blur-lg bg-white/70 dark:bg-slate-900/70',
      'border border-white/30 dark:border-slate-700/30',
      'rounded-2xl',
      'shadow-[var(--shadow-card)]',
    ].join(' '),
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        variants[variant],
        'p-6 rounded-2xl',
        hover && variant === 'paper' && 'hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-lg font-bold font-[var(--font-display)] text-[var(--color-accent)] dark:text-slate-100',
        className
      )}
    >
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}
