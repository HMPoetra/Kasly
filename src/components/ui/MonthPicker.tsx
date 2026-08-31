'use client';

import React from 'react';
import { MONTH_NAMES_ID, getMonthName } from '@/lib/utils';

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  className?: string;
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

export function MonthPicker({ month, year, onChange, className = '' }: MonthPickerProps) {
  const handlePrev = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  const handleToday = () => {
    onChange(8, 2026);
  };

  const isCurrentMonth = month === 8 && year === 2026;

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
    >
      {/* Prev Month Button */}
      <button
        type="button"
        onClick={handlePrev}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        title="Bulan Sebelumnya"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Month Select */}
      <div className="relative">
        <select
          value={month}
          onChange={(e) => onChange(Number(e.target.value), year)}
          className="appearance-none bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 pr-7 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors cursor-pointer"
        >
          {MONTH_NAMES_ID.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Year Select */}
      <div className="relative">
        <select
          value={year}
          onChange={(e) => onChange(month, Number(e.target.value))}
          className="appearance-none bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 pr-7 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors cursor-pointer"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Next Month Button */}
      <button
        type="button"
        onClick={handleNext}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        title="Bulan Berikutnya"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Quick jump to Current Month */}
      {!isCurrentMonth && (
        <button
          type="button"
          onClick={handleToday}
          className="px-2 py-1 bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ml-0.5"
          title="Kembali ke Bulan Sekarang"
        >
          Bulan Ini
        </button>
      )}
    </div>
  );
}
