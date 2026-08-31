/**
 * Helper to export array of objects to CSV with clean formatting and Excel support.
 * Uses semicolon (;) separator and sep=; directive for 100% compatibility with
 * Microsoft Excel (Indonesian & International Windows Regional Settings).
 */
export interface ExportCSVOptions {
  title?: string;
  subtitle?: string;
  generatedBy?: string;
  includeNumbering?: boolean;
  summaryRows?: { label: string; value: string | number }[];
}

export function exportToCSV<T extends object>(
  filename: string,
  data: T[],
  columns: { header: string; key: keyof T | ((row: T, index: number) => string | number) }[],
  options: ExportCSVOptions = {}
) {
  if (!data || data.length === 0) {
    console.warn('Tidak ada data untuk diekspor.');
    return;
  }

  const {
    title,
    subtitle,
    generatedBy = 'Kasly App - Hoarizon Class',
    includeNumbering = true,
    summaryRows = [],
  } = options;

  const DELIMITER = ';';
  const lines: string[] = [];

  // Directive to tell Microsoft Excel to use semicolon (;) as column separator
  lines.push('sep=;');

  // 1. Metadata Header Banner
  if (title) {
    lines.push(`"${title.replace(/"/g, '""')}"`);
    if (subtitle) {
      lines.push(`"${subtitle.replace(/"/g, '""')}"`);
    }
    const exportTime = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    lines.push(`"Waktu Ekspor:"${DELIMITER}"${exportTime} WIB"`);
    lines.push(`"Dibuat Oleh:"${DELIMITER}"${generatedBy.replace(/"/g, '""')}"`);
    lines.push(`"Jumlah Data:"${DELIMITER}"${data.length} baris"`);
    lines.push('""'); // Empty line
  }

  // 2. Table Column Headers
  const effectiveColumns = includeNumbering
    ? [{ header: 'No.', key: (_: T, idx: number) => idx + 1 }, ...columns]
    : columns;

  const headerRow = effectiveColumns
    .map((col) => `"${col.header.replace(/"/g, '""')}"`)
    .join(DELIMITER);
  lines.push(headerRow);

  // 3. Table Data Rows
  data.forEach((row, index) => {
    const rowValues = effectiveColumns.map((col) => {
      let val: unknown;
      if (typeof col.key === 'function') {
        val = col.key(row, index);
      } else {
        val = row[col.key];
      }

      if (val === null || val === undefined) {
        return '""';
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(rowValues.join(DELIMITER));
  });

  // 4. Optional Summary / Footer Rows
  if (summaryRows && summaryRows.length > 0) {
    lines.push('""');
    lines.push(`"=== RINGKASAN LAPORAN ==="${DELIMITER}""`);
    summaryRows.forEach((s) => {
      lines.push(`"${s.label.replace(/"/g, '""')}"${DELIMITER}"${String(s.value).replace(/"/g, '""')}"`);
    });
  }

  // UTF-8 BOM for Excel character compatibility
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanFilename = filename.toLowerCase().endsWith('.csv')
    ? filename.slice(0, -4)
    : filename;

  const dateStamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanFilename}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to trigger print dialog for PDF export
 */
export function exportToPrint() {
  window.print();
}
