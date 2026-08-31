'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpenseRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finance/cashflow?filter=EXPENSE');
  }, [router]);

  return (
    <div className="py-16 text-center text-sm text-[var(--color-denim-light)]">
      <span className="inline-block animate-spin mr-2">🌀</span>
      Mengalihkan ke halaman <strong>Finance &gt; Cashflow (Arus Kas)</strong>...
    </div>
  );
}
