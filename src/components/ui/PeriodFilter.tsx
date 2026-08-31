'use client';

import React from 'react';
import { MONTH_NAMES_ID } from '@/lib/utils';

export type PeriodMode = 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY';

export interface PeriodState {
  mode: PeriodMode;
  date: string; // 'YYYY-MM-DD'
  month: number; // 1-12
  year: number; // e.g. 2026
}

interface PeriodFilterProps {
  state: PeriodState;
  onChange: (newState: PeriodState) => void;
  className?: string;
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

export function PeriodFilter({ state, onChange, className = '' }: PeriodFilterProps) {
  const { mode, date, month, year } = state;

  const setMode = (newMode: PeriodMode) => {
    onChange({ ...state, mode: newMode });
  };

  const handlePrevDay = () => {
    const d = new Date(date || '2026-08-31');
    d.setDate(d.getDate() - 1);
    onChange({ ...state, date: d.toISOString().slice(0, 10) });
  };

  const handleNextDay = () => {
    const d = new Date(date || '2026-08-31');
    d.setDate(d.getDate() + 1);
    onChange({ ...state, date: d.toISOString().slice(0, 10) });
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      onChange({ ...state, month: 12, year: year - 1 });
    } else {
      onChange({ ...state, month: month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onChange({ ...state, month: 1, year: year + 1 });
    } else {
      onChange({ ...state, month: month + 1 });
    }
  };

  const handlePrevYear = () => {
    onChange({ ...state, year: year - 1 });
  };

  const handleNextYear = () => {
    onChange({ ...state, year: year + 1 });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Mode Pills */}
      <div className="inline-flex bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
        {(
          [
            { id: 'ALL', label: 'Semua Periode' },
            { id: 'DAILY', label: '📅 Per Hari' },
            { id: 'MONTHLY', label: '🗓️ Per Bulan' },
            { id: 'YEARLY', label: '📊 Per Tahun' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Controls based on selected mode */}
      {mode === 'DAILY' && (
        <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevDay}
            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Hari Sebelumnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => onChange({ ...state, date: e.target.value })}
            className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
          />
          <button
            type="button"
            onClick={handleNextDay}
            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Hari Berikutnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {mode === 'MONTHLY' && (
        <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Bulan Sebelumnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <select
            value={month}
            onChange={(e) => onChange({ ...state, month: Number(e.target.value) })}
            className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
          >
            {MONTH_NAMES_ID.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => onChange({ ...state, year: Number(e.target.value) })}
            className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
          >
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Bulan Berikutnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {mode === 'YEARLY' && (
        <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevYear}
            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Tahun Sebelumnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <select
            value={year}
            onChange={(e) => onChange({ ...state, year: Number(e.target.value) })}
            className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
          >
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNextYear}
            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Tahun Berikutnya"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Filter transactions by PeriodState
 */
export function filterTransactionsByPeriod<T extends { rawDate?: string; date?: string }>(
  transactions: T[],
  period: PeriodState
): T[] {
  if (period.mode === 'ALL') return transactions;

  const monthStr = String(period.month).padStart(2, '0');
  const yearMonthPrefix = `${period.year}-${monthStr}`;
  const yearPrefix = String(period.year);

  return transactions.filter((tx) => {
    const dateStr = tx.rawDate || tx.date || '';

    if (period.mode === 'DAILY') {
      return dateStr.startsWith(period.date);
    }
    if (period.mode === 'MONTHLY') {
      return dateStr.startsWith(yearMonthPrefix);
    }
    if (period.mode === 'YEARLY') {
      return dateStr.startsWith(yearPrefix);
    }
    return true;
  });
}
