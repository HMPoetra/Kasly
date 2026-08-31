/**
 * Format a number as Rupiah currency.
 * @example formatRupiah(25000) => "Rp25.000"
 * @example formatRupiah(1250000) => "Rp1.250.000"
 */
export function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp0';

  return (
    'Rp' +
    Math.abs(num)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

/**
 * Parse a Rupiah-formatted string back to a number.
 * @example parseRupiah("Rp25.000") => 25000
 */
export function parseRupiah(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Get initials from a name.
 * @example getInitials("Ahmad Budi") => "AB"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get greeting based on time of day.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Calculate percentage.
 */
export function calcPercentage(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Get days remaining from today to a target date.
 */
export function getDaysRemaining(targetDate: string | Date): number {
  const target = new Date(targetDate);
  const today = new Date();
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Truncate text to a maximum length.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * cn() — merge class names (Tailwind-safe).
 * Simple implementation without clsx/tailwind-merge dependency.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Delay utility.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Month names for contribution display (Indonesian & English).
 */
export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April',
  'Mei', 'Juni', 'Juli', 'Agustus',
  'September', 'Oktober', 'November', 'Desember',
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
] as const;

/**
 * Get month name from month number (1-indexed).
 */
export function getMonthName(month: number, locale: 'id' | 'en' = 'id'): string {
  if (locale === 'id') {
    return MONTH_NAMES_ID[month - 1] ?? `Bulan ${month}`;
  }
  return MONTH_NAMES[month - 1] ?? 'Unknown';
}
