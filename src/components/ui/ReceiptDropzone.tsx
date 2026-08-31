'use client';

import React, { useState, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

interface ReceiptDropzoneProps {
  receiptBase64?: string;
  receiptFileName?: string;
  receiptFileSize?: number;
  onFileChange: (data: {
    base64: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null) => void;
  label?: string;
  required?: boolean;
  helperText?: string;
}

export function ReceiptDropzone({
  receiptBase64,
  receiptFileName,
  receiptFileSize,
  onFileChange,
  label = 'Bukti Pembayaran / Nota / Struk',
  required = false,
  helperText = 'Format JPG, PNG, WEBP. Maksimal 5 MB.',
}: ReceiptDropzoneProps) {
  const toast = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('Hanya file gambar (JPG, PNG, WEBP) yang didukung.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ukuran file maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onFileChange({
        base64: event.target?.result as string,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileChange(null);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
            : receiptBase64
            ? 'border-emerald-400 bg-emerald-50/40'
            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {receiptBase64 ? (
          <div className="flex items-center gap-3.5 text-left">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-300 shadow-xs flex-shrink-0 bg-white">
              <img
                src={receiptBase64}
                alt="Preview Bukti"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span>✓</span>
                <span className="truncate">{receiptFileName || 'Bukti Terlampir'}</span>
              </div>
              {receiptFileSize ? (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(receiptFileSize / 1024).toFixed(1)} KB
                </p>
              ) : null}
              <p className="text-[10px] text-slate-500 mt-1">
                Klik atau seret file lain untuk mengganti
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100/80 transition-colors text-xs font-semibold"
              title="Hapus Bukti"
            >
              ✕ Hapus
            </button>
          </div>
        ) : (
          <div className="py-2 space-y-1.5">
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-xs">
              📷
            </div>
            <p className="text-xs font-semibold text-slate-700">
              <span className="text-blue-600 font-bold hover:underline">Pilih file</span> atau seret foto bukti ke sini
            </p>
            <p className="text-[10px] text-slate-400">{helperText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
