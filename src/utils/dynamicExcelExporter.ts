import * as XLSXModule from 'xlsx';
import { ExcelTableExportConfig, ExcelExportGlobalSettings, ExcelColumnConfig } from '../types/hrm';
import { formatNumberVN } from './payrollCalculator';

// Safe interop across ESM, CJS, Vite bundler and browser environments
const XLSX: any = (XLSXModule as any).default || XLSXModule;

export interface DynamicExportContext {
  month?: string;
  companyName?: string;
  companyShortName?: string;
}

/**
 * Resolves file name template tokens like {month}, {date}, {year}, {company}, {module}
 */
export function resolveFileName(
  template: string,
  tableId: string,
  ctx?: DynamicExportContext
): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const yearStr = String(now.getFullYear());
  const monthStr = ctx?.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const companyShort = ctx?.companyShortName || 'CP_XayDung';

  let result = template
    .replace(/{module}/g, tableId)
    .replace(/{month}/g, monthStr)
    .replace(/{date}/g, dateStr)
    .replace(/{year}/g, yearStr)
    .replace(/{company}/g, companyShort);

  // Clean illegal file name characters
  result = result.replace(/[/\\?%*:|"<>]/g, '_');
  if (!result.toLowerCase().endsWith('.xlsx')) {
    result += '.xlsx';
  }
  return result;
}

/**
 * Resolves title / subtitle text tokens
 */
export function resolveTextTokens(
  text: string,
  ctx?: DynamicExportContext
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN');
  const monthStr = ctx?.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const companyName = ctx?.companyName || 'Công ty Cổ phần Xây dựng';

  return text
    .replace(/{month}/g, monthStr)
    .replace(/{date}/g, dateStr)
    .replace(/{year}/g, String(now.getFullYear()))
    .replace(/{company}/g, companyName);
}

/**
 * Generates and downloads a customized dynamic Excel (.xlsx) file
 */
export function exportDynamicExcel(
  config: ExcelTableExportConfig,
  globalSettings: ExcelExportGlobalSettings,
  rawData: Record<string, any>[],
  ctx?: DynamicExportContext
): { fileName: string; rowCount: number; colCount: number } {
  const safeConfig = config || {
    tableId: 'attendance',
    tableName: 'Bảng Chấm Công',
    fileNameTemplate: 'Bang_Cham_Cong_{month}',
    sheetName: 'ChamCong',
    tableTitle: 'BẢNG CHẤM CÔNG',
    tableStyle: 'standard',
    includeSubtitles: true,
    includeSummaryRow: true,
    includeSignatures: true,
    autoColumnWidth: true,
    useCustomNumberFormat: true,
    columns: [],
  };

  const resolvedFileName = resolveFileName(
    safeConfig.fileNameTemplate || `${safeConfig.tableId}_{month}`,
    safeConfig.tableId,
    {
      month: ctx?.month,
      companyName: globalSettings?.companyName || 'Công ty Cổ phần Xây dựng',
      companyShortName: globalSettings?.companyShortName || 'CP_XayDung',
    }
  );

  // 1. Get enabled columns sorted by order
  const rawCols = Array.isArray(safeConfig.columns) ? safeConfig.columns : [];
  const activeColumns: ExcelColumnConfig[] = [...rawCols]
    .filter((col) => col.enabled)
    .sort((a, b) => a.order - b.order);

  const aoa: (string | number)[][] = [];
  const isRaw = safeConfig.tableStyle === 'raw';

  // 2. Add Title & Subtitles if not raw data
  if (!isRaw) {
    // Header Title
    const titleText = resolveTextTokens(
      safeConfig.tableTitle || safeConfig.tableName.toUpperCase(),
      ctx
    );
    aoa.push([titleText]);

    // Subtitles
    if (config.includeSubtitles && config.subtitles && config.subtitles.length > 0) {
      config.subtitles.forEach((sub) => {
        aoa.push([resolveTextTokens(sub, ctx)]);
      });
    }
    // Blank line before table header
    aoa.push([]);
  }

  // 3. Header row
  const headerLabels = activeColumns.map((col) => col.customLabel?.trim() || col.defaultLabel);
  aoa.push(headerLabels);

  // Track totals for numeric/currency columns if summary row is requested
  const columnTotals: Record<string, number> = {};
  activeColumns.forEach((col) => {
    if (col.type === 'number' || col.type === 'currency') {
      columnTotals[col.id] = 0;
    }
  });

  // 4. Data rows
  rawData.forEach((item, rowIdx) => {
    const rowCells: (string | number)[] = [];

    activeColumns.forEach((col) => {
      let cellValue: any;

      if (col.id === 'stt') {
        cellValue = rowIdx + 1;
      } else if (item[col.id] !== undefined && item[col.id] !== null) {
        cellValue = item[col.id];
      } else if (col.projectId || col.id.startsWith('proj_days_') || col.id.startsWith('project_days_')) {
        // Resolve project days worked
        const pid = col.projectId || col.id.replace('project_days_', '').replace('proj_days_', '');
        if (item.projectsDays && item.projectsDays[pid] !== undefined) {
          cellValue = item.projectsDays[pid];
        } else if (item.projectAllowanceDetails && Array.isArray(item.projectAllowanceDetails)) {
          const found = item.projectAllowanceDetails.find((p: any) => p.projectId === pid || p.projectCode === pid);
          cellValue = found ? found.daysWorked : 0;
        } else {
          cellValue = item[col.id] ?? 0;
        }
      } else if (col.id === 'all_assigned_projects' || col.projectFieldType === 'all_projects_summary') {
        if (item.all_assigned_projects) {
          cellValue = item.all_assigned_projects;
        } else if (item.projectAllowanceDetails && Array.isArray(item.projectAllowanceDetails)) {
          cellValue = item.projectAllowanceDetails
            .filter((p: any) => p.daysWorked > 0)
            .map((p: any) => `${p.projectName || p.projectCode} (${p.daysWorked} ngày)`)
            .join('; ');
        } else {
          cellValue = '';
        }
      } else if (col.defaultValue !== undefined) {
        cellValue = col.defaultValue;
      } else {
        cellValue = '';
      }

      if (cellValue === undefined || cellValue === null) {
        cellValue = '';
      }

      // Add to totals if numeric
      if (col.type === 'currency' || (col.type === 'number' && col.id !== 'stt' && col.id !== 'tierIndex' && col.id !== 'coefficient')) {
        const num = Number(cellValue);
        if (!isNaN(num)) {
          columnTotals[col.id] = (columnTotals[col.id] || 0) + num;
        }
      }

      rowCells.push(cellValue);
    });

    aoa.push(rowCells);
  });

  // 5. Summary Row (TỔNG CỘNG)
  if (!isRaw && config.includeSummaryRow && rawData.length > 0) {
    const summaryRow: (string | number)[] = [];
    activeColumns.forEach((col, colIdx) => {
      if (colIdx === 0) {
        summaryRow.push('TỔNG CỘNG');
      } else if (colIdx === 1) {
        summaryRow.push(`${rawData.length} dòng`);
      } else if (col.type === 'currency' || (col.type === 'number' && col.id !== 'stt' && col.id !== 'tierIndex' && col.id !== 'coefficient')) {
        summaryRow.push(columnTotals[col.id] || 0);
      } else {
        summaryRow.push('');
      }
    });
    aoa.push(summaryRow);
  }

  // 6. Signatures row for Accounting style
  if (!isRaw && config.includeSignatures && config.tableStyle === 'accounting') {
    aoa.push([]); // blank line
    aoa.push([]); // blank line
    const dateLine = `Ngày ..... tháng ..... năm ${new Date().getFullYear()}`;
    const sigHeaders: string[] = [];
    const sigTitles: string[] = [];
    const sigSub: string[] = [];

    const numCols = activeColumns.length;
    const pos1 = 1;
    const pos2 = Math.floor(numCols / 2);
    const pos3 = Math.max(numCols - 2, pos2 + 1);

    for (let c = 0; c < numCols; c++) {
      if (c === pos1) {
        sigHeaders.push('NGƯỜI LẬP BIỂU');
        sigTitles.push('(Ký, ghi rõ họ tên)');
        sigSub.push('');
      } else if (c === pos2) {
        sigHeaders.push('KẾ TOÁN TRƯỞNG');
        sigTitles.push('(Ký, ghi rõ họ tên)');
        sigSub.push('');
      } else if (c === pos3) {
        sigHeaders.push('GIÁM ĐỐC / DUYỆT');
        sigTitles.push('(Ký, đóng dấu)');
        sigSub.push(dateLine);
      } else {
        sigHeaders.push('');
        sigTitles.push('');
        sigSub.push('');
      }
    }

    aoa.push(sigSub);
    aoa.push(sigHeaders);
    aoa.push(sigTitles);
  }

  // 7. Create Sheet & Workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // 8. Auto column widths
  if (config.autoColumnWidth) {
    ws['!cols'] = activeColumns.map((col, colIdx) => {
      let maxLen = (col.customLabel || col.defaultLabel).length;
      aoa.forEach((r) => {
        const val = r[colIdx];
        if (val !== undefined && val !== null) {
          const s = String(val);
          if (s.length > maxLen && s.length < 50) {
            maxLen = s.length;
          }
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, col.width || 10), 45) };
    });
  }

  const sheetTitle = (config.sheetName || 'DuLieu').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  // 9. Write and trigger download
  XLSX.writeFile(wb, resolvedFileName);

  return {
    fileName: resolvedFileName,
    rowCount: rawData.length,
    colCount: activeColumns.length,
  };
}
