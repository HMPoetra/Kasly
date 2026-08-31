'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchasesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finance/expense');
  }, [router]);

  return (
    <div className="py-16 text-center text-sm text-[var(--color-denim-light)]">
      <span className="inline-block animate-spin mr-2">🌀</span>
      Mengalihkan ke halaman <strong>Finance &gt; Expense</strong>...
    </div>
  );
}
