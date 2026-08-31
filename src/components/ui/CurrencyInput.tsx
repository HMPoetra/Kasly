'use client';

import React from 'react';

interface CurrencyInputProps {
  id?: string;
  name?: string;
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  min?: number;
  max?: number;
}

export function formatNumberWithDots(val: number | string): string {
  if (val === '' || val === undefined || val === null) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

export function parseNumberFromDots(val: string): number {
  const digits = String(val).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function CurrencyInput({
  id,
  name,
  value,
  onChange,
  placeholder = '0',
  required = false,
  disabled = false,
  readOnly = false,
  className = '',
  min,
  max,
}: CurrencyInputProps) {
  const displayValue = formatNumberWithDots(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    if (max !== undefined && num > max) return;
    onChange(num);
  };

  return (
    <div className="relative w-full">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 select-none pointer-events-none">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-bold bg-white focus:ring-2 focus:ring-[var(--color-baby-blue)] focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal ${
          readOnly ? 'bg-slate-100 text-slate-700 cursor-not-allowed border-slate-200' : ''
        } ${className}`}
      />
    </div>
  );
}
