import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportDataOptions {
  fileName: string;
  sheetName?: string;
  title: string;
  subtitles?: string[];
  headers: string[] | string[][];
  rows: (string | number | undefined | null)[][];
  columnWidths?: number[];
  orientation?: 'portrait' | 'landscape';
}

/**
 * Remove Vietnamese accents safely for ASCII fallback where needed
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Export table data directly to real Excel (.xlsx) file
 */
export function exportToExcel(options: ExportDataOptions): void {
  const { fileName, sheetName = 'DuLieu', title, subtitles = [], headers, rows } = options;

  // Build array-of-arrays (AOA)
  const aoa: (string | number)[][] = [];

  // Title row
  aoa.push([title.toUpperCase()]);
  
  // Subtitle rows
  subtitles.forEach((sub) => {
    aoa.push([sub]);
  });
  aoa.push([]); // blank separator row

  // Headers (handle both 1D and 2D headers)
  if (headers.length > 0) {
    if (Array.isArray(headers[0])) {
      (headers as string[][]).forEach((hRow) => aoa.push(hRow));
    } else {
      aoa.push(headers as string[]);
    }
  }

  // Data rows
  rows.forEach((row) => {
    const cleanRow = row.map((cell) => (cell === undefined || cell === null ? '' : cell));
    aoa.push(cleanRow);
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set default column widths if headers exist
  const firstHeader = Array.isArray(headers[0]) ? (headers[0] as string[]) : (headers as string[]);
  if (firstHeader && firstHeader.length > 0) {
    ws['!cols'] = firstHeader.map((_, colIdx) => {
      // Find max length in column
      let maxLen = 10;
      aoa.forEach((r) => {
        const val = r[colIdx];
        if (val !== undefined && val !== null) {
          const s = String(val);
          if (s.length > maxLen && s.length < 50) {
            maxLen = s.length;
          }
        }
      });
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  const targetFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, targetFileName);
}

/**
 * Export table data to PDF (.pdf) with clean professional styling
 * Also provides high-fidelity styled printable dialog as fallback/direct save
 */
export function exportToPDF(options: ExportDataOptions): void {
  const {
    fileName,
    title,
    subtitles = [],
    headers,
    rows,
    orientation = 'landscape',
  } = options;

  try {
    const doc = new jsPDF({
      orientation,
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 30;

    // Company branding header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138); // #1E3A8A
    doc.text(removeVietnameseAccents(title.toUpperCase()), pageWidth / 2, currentY, { align: 'center' });
    currentY += 18;

    // Subtitles
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    subtitles.forEach((sub) => {
      doc.text(removeVietnameseAccents(sub), pageWidth / 2, currentY, { align: 'center' });
      currentY += 13;
    });

    currentY += 8;

    // Headers array
    const headerRow: string[] = Array.isArray(headers[0])
      ? (headers[headers.length - 1] as string[]).map((h) => removeVietnameseAccents(String(h)))
      : (headers as string[]).map((h) => removeVietnameseAccents(String(h)));

    // Clean rows (remove diacritics for jsPDF helvetica core font to avoid glyph corruption)
    const bodyRows = rows.map((row) =>
      row.map((cell) => {
        if (cell === undefined || cell === null) return '';
        if (typeof cell === 'number') return cell.toLocaleString('vi-VN');
        return removeVietnameseAccents(String(cell));
      })
    );

    autoTable(doc, {
      startY: currentY,
      head: [headerRow],
      body: bodyRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { top: 20, right: 20, bottom: 30, left: 20 },
      didDrawPage: (data) => {
        // Page footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        const str = `Trang ${data.pageNumber}`;
        doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
      },
    });

    const targetFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    doc.save(targetFileName);
  } catch (err) {
    console.error('jsPDF generation error, falling back to print HTML:', err);
    printTableToPDF(options);
  }
}

/**
 * Print-ready HTML fallback for 100% perfect Vietnamese font diacritics and custom styling
 */
export function printTableToPDF(options: ExportDataOptions): void {
  const { title, subtitles = [], headers, rows } = options;

  const headerRows = Array.isArray(headers[0]) ? (headers as string[][]) : [headers as string[]];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 15px; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; }
          .header h1 { font-size: 18px; color: #1E3A8A; margin: 0 0 6px 0; text-transform: uppercase; }
          .header p { font-size: 11px; color: #64748b; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 10px; text-align: center; }
          th { background-color: #1E3A8A; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .footer { margin-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          ${subtitles.map((s) => `<p>${s}</p>`).join('')}
        </div>
        <table>
          <thead>
            ${headerRows
              .map(
                (hRow) =>
                  `<tr>${hRow
                    .map((h) => `<th>${h}</th>`)
                    .join('')}</tr>`
              )
              .join('')}
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map((cell) => `<td>${cell === undefined || cell === null ? '' : cell}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>Xuất từ Hệ Thống Quản Lý Nhân Sự & Tiền Lương</div>
          <div>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  }
}
