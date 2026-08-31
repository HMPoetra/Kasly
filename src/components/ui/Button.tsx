'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'denim';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center gap-2',
      'font-semibold rounded-xl',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.97]',
      'cursor-pointer',
    ].join(' ');

    const variants: Record<string, string> = {
      primary: [
        'bg-gradient-to-b from-[var(--color-denim-light)] to-[var(--color-denim)]',
        'text-white',
        'shadow-[var(--shadow-puffy)]',
        'hover:shadow-[var(--shadow-puffy-lg)]',
        'hover:-translate-y-0.5',
        'focus:ring-[var(--color-denim)]',
        'border border-[var(--color-denim)]',
      ].join(' '),
      secondary: [
        'bg-[var(--color-baby-blue-100)]',
        'text-[var(--color-denim-dark)]',
        'hover:bg-[var(--color-baby-blue-200)]',
        'focus:ring-[var(--color-baby-blue)]',
        'border border-[var(--color-baby-blue-200)]',
      ].join(' '),
      outline: [
        'border-2 border-[var(--color-denim)]',
        'text-[var(--color-denim)]',
        'hover:bg-[var(--color-denim)]',
        'hover:text-white',
        'focus:ring-[var(--color-denim)]',
      ].join(' '),
      ghost: [
        'text-[var(--color-denim)]',
        'hover:bg-[var(--color-baby-blue-50)]',
        'focus:ring-[var(--color-baby-blue)]',
      ].join(' '),
      danger: [
        'bg-gradient-to-b from-[#FC8181] to-[var(--color-expense)]',
        'text-white',
        'shadow-[0_4px_8px_rgba(245,101,101,0.25)]',
        'hover:shadow-[0_6px_16px_rgba(245,101,101,0.35)]',
        'focus:ring-[var(--color-expense)]',
      ].join(' '),
      denim: [
        'bg-denim text-white',
        'shadow-[var(--shadow-denim)]',
        'hover:shadow-[var(--shadow-puffy-lg)]',
        'hover:-translate-y-0.5',
        'focus:ring-[var(--color-denim-dark)]',
      ].join(' '),
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-7 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
