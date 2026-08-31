'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'card';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants: Record<string, string> = {
    text: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-2xl',
  };

  return (
    <div
      className={cn('skeleton', variants[variant], className)}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton variant="circle" className="h-14 w-14" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-28" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="card" className="h-72" />
        <Skeleton variant="card" className="h-72" />
      </div>
    </div>
  );
}
