import * as XLSXModule from 'xlsx-js-style';
import { Employee, Department, ConstructionProject, TimesheetRecord } from '../types/hrm';

// Safe interop across ESM, CJS, Vite bundler and browser environments
const XLSX: any = (XLSXModule as any).default || XLSXModule;

export interface DetailedAttendanceExportOptions {
  month: string; // e.g. "2026-10"
  companyName?: string;
  employees: Employee[];
  departments: Department[];
  projects: ConstructionProject[];
  timesheets: TimesheetRecord[];
}

/**
 * Creates and downloads a detailed, multi-tier attendance and project allocation Excel file
 * matching the exact structure and visual styling of the reference construction company timesheet:
 * - 3-level merged headers
 * - Days 1 to 31 with weekday labels (T2 - CN)
 * - Sunday columns (CN) highlighted in orange/amber (Header and all rows)
 * - Worksite / Project distribution columns (PL, PT, NH, LD, PM, HT2, CTi, CD, BC, VP...)
 * - Leave columns (P, NL, KL, Total)
 * - Overtime columns (Hours, Converted Days)
 * - Summary Totals row
 * - Accounting / Director signatures
 */
export function exportDetailedAttendanceExcel(options: DetailedAttendanceExportOptions): {
  fileName: string;
  rowCount: number;
  colCount: number;
} {
  const {
    month = '2026-10',
    companyName = 'CÔNG TY CỔ PHẦN XÂY DỰNG & ĐẦU TƯ',
    employees = [],
    departments = [],
    projects = [],
    timesheets = [],
  } = options || {};

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];

  const [yearStr, monthStr] = (month || '2026-10').split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const monthNum = parseInt(monthStr, 10) || 10;
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const daysInfo = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const date = new Date(year, monthNum - 1, d);
    const dow = date.getDay();
    return {
      day: d,
      dow,
      label: weekdayLabels[dow],
      isSunday: dow === 0,
    };
  });

  // Calculate project list to display (use all active projects or top projects)
  const displayProjects = safeProjects.length > 0 ? safeProjects : [
    { id: 'proj-1', code: 'PL', name: 'Xưởng Phước Lộc', symbolFull: 'PL' } as ConstructionProject,
    { id: 'proj-2', code: 'PT', name: 'Kho Phước Thành', symbolFull: 'PT' } as ConstructionProject,
    { id: 'proj-9', code: 'BC', name: 'Công trình Bcons', symbolFull: 'BC' } as ConstructionProject,
  ];

  // Helper map for employee timesheets
  const tsMap = new Map<string, TimesheetRecord>();
  safeTimesheets.forEach((ts) => {
    if (ts && ts.month === month) {
      tsMap.set(ts.employeeId, ts);
    }
  });

  const getTs = (empId: string): TimesheetRecord => {
    return (
      tsMap.get(empId) || {
        id: `ts-${empId}`,
        employeeId: empId,
        month,
        standardWorkingDays: 26,
        actualWorkingDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        otHoursNormal: 0,
        otHoursWeekend: 0,
        lateArrivalMinutes: 0,
      }
    );
  };

  // Color Palette (RGB hex codes without # for xlsx-js-style)
  const COLORS = {
    navyHeader: '1E3A8A', // Dark Navy Blue #1E3A8A
    navyHeaderLight: '2563EB', // Blue #2563EB
    blueSubHeader: 'DBEAFE', // Soft blue #DBEAFE
    orangeSundayHeader: 'F59E0B', // Vibrant Amber/Orange #F59E0B
    orangeSundayCell: 'FDE68A', // Light Amber for Sunday column body #FDE68A
    yellowSiteWorkerRow: 'FEF9C3', // Warm light yellow for construction/site rows #FEF9C3
    whiteRow: 'FFFFFF',
    borderGray: '94A3B8', // Slate border #94A3B8
    borderLight: 'CBD5E1', // Slate light border #CBD5E1
    summaryRowBg: 'E2E8F0', // Gray-blue for summary row #E2E8F0
    textNavy: '0F172A',
    textWhite: 'FFFFFF',
    textOrange: '92400E',
    greenCell: 'DCFCE7',
  };

  const thinBorder = {
    top: { style: 'thin', color: { rgb: COLORS.borderLight } },
    bottom: { style: 'thin', color: { rgb: COLORS.borderLight } },
    left: { style: 'thin', color: { rgb: COLORS.borderLight } },
    right: { style: 'thin', color: { rgb: COLORS.borderLight } },
  };

  const mediumBorder = {
    top: { style: 'medium', color: { rgb: COLORS.borderGray } },
    bottom: { style: 'medium', color: { rgb: COLORS.borderGray } },
    left: { style: 'thin', color: { rgb: COLORS.borderGray } },
    right: { style: 'thin', color: { rgb: COLORS.borderGray } },
  };

  // Column offsets
  // Col 0: STT
  // Col 1: Mã NV
  // Col 2: Họ và tên
  // Col 3: Chức vụ
  // Col 4: Ngày vào làm
  // Col 5 to (5 + daysInMonth - 1): Days 1 to daysInMonth
  // Col (5 + daysInMonth): Công chuẩn
  // Col (5 + daysInMonth + 1): Công thực tế
  // Next displayProjects.length cols: Projects
  // Next 4 cols: Leave (P, NL, KL, Tổng nghỉ)
  // Next 2 cols: Overtime (Giờ OT, Quy đổi công)
  // Last col: Ghi chú

  const startDayCol = 5;
  const endDayCol = startDayCol + daysInMonth - 1;
  const colStdDays = endDayCol + 1;
  const colActDays = endDayCol + 2;
  const startProjCol = colActDays + 1;
  const endProjCol = startProjCol + displayProjects.length - 1;
  const colP = endProjCol + 1;
  const colNL = endProjCol + 2;
  const colKL = endProjCol + 3;
  const colTotalLeave = endProjCol + 4;
  const colOtHours = colTotalLeave + 1;
  const colOtDays = colTotalLeave + 2;
  const colNotes = colOtDays + 1;

  const totalCols = colNotes + 1;

  // Row Indices
  const rowHeader1 = 4;
  const rowHeader2 = 5;
  const rowHeader3 = 6;
  const rowDataStart = 7;

  // Create empty worksheet object
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  // Helper to set cell value and style with NaN protection
  const setCell = (r: number, c: number, v: any, style: any = {}) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    const isNum = typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v);
    ws[cellRef] = {
      v: isNum ? v : (v === undefined || v === null ? '' : String(v)),
      t: isNum ? 'n' : 's',
      s: style,
    };
  };

  // 1. Company Name & Main Title Header
  setCell(0, 0, companyName.toUpperCase(), {
    font: { name: 'Arial', sz: 11, bold: true, color: { rgb: COLORS.navyHeader } },
    alignment: { horizontal: 'left', vertical: 'center' },
  });

  const titleText = `BẢNG CHẤM CÔNG VÀ PHÂN BỔ CÔNG TRÌNH / DỰ ÁN - THÁNG ${String(monthNum).padStart(2, '0')}/${year}`;
  setCell(1, 0, titleText, {
    font: { name: 'Arial', sz: 15, bold: true, color: { rgb: COLORS.navyHeader } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } });

  const subtitleText = `Kỳ chấm công: 01/${String(monthNum).padStart(2, '0')}/${year} đến ${String(daysInMonth).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}/${year} (Chu kỳ ${daysInMonth} ngày) | Tổng số nhân sự: ${safeEmployees.length} người`;
  setCell(2, 0, subtitleText, {
    font: { name: 'Arial', sz: 10, italic: true, color: { rgb: '475569' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } });

  // 2. BUILD MULTI-TIER HEADERS

  // Base Header Style
  const headerStyleNavy = {
    fill: { fgColor: { rgb: COLORS.navyHeader } },
    font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.textWhite } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder,
  };

  const headerStyleBlueLight = {
    fill: { fgColor: { rgb: '1E40AF' } },
    font: { name: 'Arial', sz: 9, bold: true, color: { rgb: COLORS.textWhite } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder,
  };

  const headerStyleSunday = {
    fill: { fgColor: { rgb: COLORS.orangeSundayHeader } },
    font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.textWhite } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder,
  };

  const headerStyleTier2 = {
    fill: { fgColor: { rgb: 'F1F5F9' } },
    font: { name: 'Arial', sz: 9, bold: true, color: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder,
  };

  // --- Tier 1 Columns ---
  // STT
  setCell(rowHeader1, 0, 'STT', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: 0 }, e: { r: rowHeader3, c: 0 } });

  // Mã NV
  setCell(rowHeader1, 1, 'Mã NV', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: 1 }, e: { r: rowHeader3, c: 1 } });

  // Họ và tên
  setCell(rowHeader1, 2, 'Họ và tên', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: 2 }, e: { r: rowHeader3, c: 2 } });

  // Chức vụ
  setCell(rowHeader1, 3, 'Chức vụ', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: 3 }, e: { r: rowHeader3, c: 3 } });

  // Ngày vào làm
  setCell(rowHeader1, 4, 'Ngày vào làm', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: 4 }, e: { r: rowHeader3, c: 4 } });

  // "Ngày trong tháng" (Spans Day 1 to Day N)
  setCell(rowHeader1, startDayCol, `NGÀY TRONG THÁNG (Từ ngày 01 đến ngày ${daysInMonth})`, headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: startDayCol }, e: { r: rowHeader1, c: endDayCol } });

  // "Tổng ngày công" (Spans Công chuẩn & Công thực tế)
  setCell(rowHeader1, colStdDays, 'TỔNG CÔNG', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: colStdDays }, e: { r: rowHeader1, c: colActDays } });

  // "Ngày công theo dự án / công trình"
  setCell(rowHeader1, startProjCol, 'NGÀY CÔNG THEO DỰ ÁN / CÔNG TRÌNH', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: startProjCol }, e: { r: rowHeader1, c: endProjCol } });

  // "Nghỉ phép"
  setCell(rowHeader1, colP, 'NGHỈ PHÉP / NGHỈ VIỆC', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: colP }, e: { r: rowHeader1, c: colTotalLeave } });

  // "Tăng ca"
  setCell(rowHeader1, colOtHours, 'TĂNG CA (OT)', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: colOtHours }, e: { r: rowHeader1, c: colOtDays } });

  // "Ghi chú"
  setCell(rowHeader1, colNotes, 'Ghi chú', headerStyleNavy);
  merges.push({ s: { r: rowHeader1, c: colNotes }, e: { r: rowHeader3, c: colNotes } });

  // Fill empty tier 1 merged spots with border styling
  for (let c = 0; c < totalCols; c++) {
    for (let r = rowHeader1; r <= rowHeader3; r++) {
      if (!ws[XLSX.utils.encode_cell({ r, c })]) {
        setCell(r, c, '', headerStyleNavy);
      }
    }
  }

  // --- Tier 2 & 3: Days 1 to 31 ---
  daysInfo.forEach((info, idx) => {
    const colIdx = startDayCol + idx;
    const isSunday = info.isSunday;

    // Tier 2: Day number (01, 02, ..., 31)
    setCell(rowHeader2, colIdx, info.day, {
      fill: { fgColor: { rgb: isSunday ? COLORS.orangeSundayHeader : 'E2E8F0' } },
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: isSunday ? COLORS.textWhite : '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    });

    // Tier 3: Weekday label (T2, T3, ..., CN)
    setCell(rowHeader3, colIdx, info.label, {
      fill: { fgColor: { rgb: isSunday ? COLORS.orangeSundayHeader : 'CBD5E1' } },
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: isSunday ? COLORS.textWhite : '1E293B' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    });
  });

  // --- Tier 2 & 3: Tổng công ---
  setCell(rowHeader2, colStdDays, 'Công chuẩn', headerStyleTier2);
  setCell(rowHeader3, colStdDays, '(1)', headerStyleTier2);

  setCell(rowHeader2, colActDays, 'Công thực tế', {
    ...headerStyleTier2,
    fill: { fgColor: { rgb: 'BFDBFE' } }, // Soft blue
    font: { name: 'Arial', sz: 9, bold: true, color: { rgb: '1E3A8A' } },
  });
  setCell(rowHeader3, colActDays, '(2)', headerStyleTier2);

  // --- Tier 2 & 3: Projects ---
  displayProjects.forEach((proj, idx) => {
    const colIdx = startProjCol + idx;
    setCell(rowHeader2, colIdx, proj.name || proj.code, {
      fill: { fgColor: { rgb: 'FEF3C7' } }, // soft amber
      font: { name: 'Arial', sz: 8.5, bold: true, color: { rgb: '78350F' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: thinBorder,
    });

    setCell(rowHeader3, colIdx, proj.symbolFull || proj.code, {
      fill: { fgColor: { rgb: 'FDE68A' } },
      font: { name: 'Arial', sz: 8.5, bold: true, color: { rgb: '92400E' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    });
  });

  // --- Tier 2 & 3: Leave ---
  setCell(rowHeader2, colP, 'Phép năm', headerStyleTier2);
  setCell(rowHeader3, colP, 'P', headerStyleTier2);

  setCell(rowHeader2, colNL, 'Nghỉ lễ', headerStyleTier2);
  setCell(rowHeader3, colNL, 'NL', headerStyleTier2);

  setCell(rowHeader2, colKL, 'Không lương', headerStyleTier2);
  setCell(rowHeader3, colKL, 'KL', headerStyleTier2);

  setCell(rowHeader2, colTotalLeave, 'Tổng nghỉ', {
    ...headerStyleTier2,
    fill: { fgColor: { rgb: 'FED7AA' } },
  });
  setCell(rowHeader3, colTotalLeave, 'Cộng', headerStyleTier2);

  // --- Tier 2 & 3: Overtime ---
  setCell(rowHeader2, colOtHours, 'Giờ OT', headerStyleTier2);
  setCell(rowHeader3, colOtHours, 'Giờ (h)', headerStyleTier2);

  setCell(rowHeader2, colOtDays, 'Quy đổi', headerStyleTier2);
  setCell(rowHeader3, colOtDays, '(÷8h)', headerStyleTier2);

  // 3. DATA ROWS
  let currentRow = rowDataStart;

  // Track column totals for numeric columns
  let totalStd = 0;
  let totalAct = 0;
  const projectTotals: number[] = new Array(displayProjects.length).fill(0);
  let totalP = 0;
  let totalNL = 0;
  let totalKL = 0;
  let totalLeaveAll = 0;
  let totalOtHoursSum = 0;
  let totalOtDaysSum = 0;
  const dailyWorkdayTotals: number[] = new Array(daysInMonth).fill(0);

  // Helper to determine if employee is site/construction team (tinted warm yellow like reference image)
  const isSiteWorker = (emp: Employee): boolean => {
    const dept = safeDepartments.find((d) => d.id === emp.departmentId)?.name?.toLowerCase() || '';
    const pos = (emp.position || '').toLowerCase();
    return (
      dept.includes('công trình') ||
      dept.includes('dự án') ||
      dept.includes('thi công') ||
      pos.includes('chỉ huy') ||
      pos.includes('kỹ thuật') ||
      pos.includes('giám sát') ||
      pos.includes('đội trưởng') ||
      pos.includes('công nhân') ||
      pos.includes('thợ')
    );
  };

  safeEmployees.forEach((emp, empIdx) => {
    const ts = getTs(emp.id);
    const dept = safeDepartments.find((d) => d.id === emp.departmentId)?.name || '';
    const isWorker = isSiteWorker(emp);
    const rowBgColor = isWorker ? COLORS.yellowSiteWorkerRow : COLORS.whiteRow;

    const baseCellStyle = {
      fill: { fgColor: { rgb: rowBgColor } },
      font: { name: 'Arial', sz: 9, color: { rgb: COLORS.textNavy } },
      border: thinBorder,
      alignment: { vertical: 'center' },
    };

    // Col 0: STT
    setCell(currentRow, 0, empIdx + 1, {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Col 1: Mã NV
    setCell(currentRow, 1, emp.code, {
      ...baseCellStyle,
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: COLORS.navyHeader } },
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Col 2: Họ và tên
    setCell(currentRow, 2, emp.fullName, {
      ...baseCellStyle,
      font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.textNavy } },
      alignment: { horizontal: 'left', vertical: 'center' },
    });

    // Col 3: Chức vụ
    setCell(currentRow, 3, emp.position || dept, {
      ...baseCellStyle,
      alignment: { horizontal: 'left', vertical: 'center' },
    });

    // Col 4: Ngày vào làm
    const joinDateFormatted = emp.joinDate
      ? emp.joinDate.split('-').reverse().join('/')
      : '01/01/2023';
    setCell(currentRow, 4, joinDateFormatted, {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Default project symbol for this employee
    const defaultProjSymbol =
      displayProjects.find((p) => emp.projectAllowances?.[p.id]?.assigned)?.symbolFull ||
      displayProjects[empIdx % displayProjects.length]?.symbolFull ||
      'BC';

    // Daily attendance cells (1 to daysInMonth)
    let empLeaveDaysCount = 0;
    let empNLDaysCount = 0;
    let empKLDaysCount = 0;
    const empProjDaysCount: Record<string, number> = {};

    daysInfo.forEach((info, dIdx) => {
      const colIdx = startDayCol + dIdx;
      const isSunday = info.isSunday;

      let symbol = '';
      if (ts.dailySymbols && ts.dailySymbols[info.day] !== undefined) {
        symbol = ts.dailySymbols[info.day];
      } else if (isSunday) {
        symbol = '-';
      } else {
        // Fallback realistic simulation matching reference image
        symbol = defaultProjSymbol;
      }

      // Check symbol meaning
      const upperSym = symbol.trim().toUpperCase();
      const isWork = upperSym && upperSym !== 'CN' && upperSym !== '-' && upperSym !== 'P' && upperSym !== 'NL' && upperSym !== 'KL';

      if (isWork) {
        dailyWorkdayTotals[dIdx] += 1;
        // Count for project
        const matchedProj = displayProjects.find(
          (p) =>
            p.symbolFull.toUpperCase() === upperSym ||
            p.code.toUpperCase() === upperSym ||
            upperSym.startsWith(p.code.toUpperCase()) ||
            upperSym.startsWith(p.symbolFull.toUpperCase())
        );
        const pKey = matchedProj ? matchedProj.id : displayProjects[0].id;
        empProjDaysCount[pKey] = (empProjDaysCount[pKey] || 0) + (upperSym.endsWith('/2') ? 0.5 : 1);
      } else if (upperSym === 'P') {
        empLeaveDaysCount += 1;
      } else if (upperSym === 'NL') {
        empNLDaysCount += 1;
      } else if (upperSym === 'KL') {
        empKLDaysCount += 1;
      }

      // Styling: Sunday columns ALWAYS get orange fill
      const cellBg = isSunday
        ? COLORS.orangeSundayCell
        : upperSym.endsWith('/2')
        ? 'FED7AA'
        : upperSym.endsWith('/P') || upperSym === 'P'
        ? COLORS.greenCell
        : rowBgColor;

      setCell(currentRow, colIdx, symbol || (isSunday ? '-' : defaultProjSymbol), {
        fill: { fgColor: { rgb: cellBg } },
        font: {
          name: 'Arial',
          sz: 9,
          bold: isSunday || isWork,
          color: { rgb: isSunday ? COLORS.textOrange : COLORS.textNavy },
        },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder,
      });
    });

    // Summary numbers for employee
    const stdDays = ts.standardWorkingDays || 26;
    const actDays = ts.actualWorkingDays !== undefined ? ts.actualWorkingDays : 26;
    totalStd += stdDays;
    totalAct += actDays;

    // Col: Công chuẩn
    setCell(currentRow, colStdDays, stdDays, {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Col: Công thực tế
    setCell(currentRow, colActDays, actDays, {
      ...baseCellStyle,
      fill: { fgColor: { rgb: 'DBEAFE' } },
      font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Cols: Projects
    displayProjects.forEach((proj, pIdx) => {
      const colIdx = startProjCol + pIdx;
      let days = empProjDaysCount[proj.id];
      if (days === undefined) {
        if (emp.projectAllowances?.[proj.id]?.assigned) {
          days = actDays;
        } else if (pIdx === 0 && Object.keys(empProjDaysCount).length === 0) {
          days = actDays;
        } else {
          days = 0;
        }
      }
      projectTotals[pIdx] += days;

      setCell(currentRow, colIdx, days > 0 ? days : '-', {
        ...baseCellStyle,
        font: { name: 'Arial', sz: 9, bold: days > 0, color: { rgb: days > 0 ? '78350F' : '94A3B8' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      });
    });

    // Cols: Leave
    const pDays = ts.paidLeaveDays || empLeaveDaysCount || 0;
    const nlDays = empNLDaysCount || 0;
    const klDays = ts.unpaidLeaveDays || empKLDaysCount || 0;
    const totalLeave = pDays + nlDays + klDays;

    totalP += pDays;
    totalNL += nlDays;
    totalKL += klDays;
    totalLeaveAll += totalLeave;

    setCell(currentRow, colP, pDays > 0 ? pDays : '-', {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    setCell(currentRow, colNL, nlDays > 0 ? nlDays : '-', {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    setCell(currentRow, colKL, klDays > 0 ? klDays : '-', {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    setCell(currentRow, colTotalLeave, totalLeave > 0 ? totalLeave : '-', {
      ...baseCellStyle,
      fill: { fgColor: { rgb: totalLeave > 0 ? 'FFEDD5' : rowBgColor } },
      font: { name: 'Arial', sz: 9, bold: totalLeave > 0 },
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Cols: Overtime
    const otHours = ts.totalOtHours || ts.otHoursNormal || 0;
    const otDays = ts.otConvertedDays || Math.round((otHours / 8) * 100) / 100;
    totalOtHoursSum += otHours;
    totalOtDaysSum += otDays;

    setCell(currentRow, colOtHours, otHours > 0 ? otHours : '-', {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    setCell(currentRow, colOtDays, otDays > 0 ? otDays : '-', {
      ...baseCellStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Col: Notes
    setCell(currentRow, colNotes, isWorker ? 'Công trình' : 'Văn phòng', {
      ...baseCellStyle,
      alignment: { horizontal: 'left', vertical: 'center' },
    });

    currentRow += 1;
  });

  // 4. SUMMARY ROW (TỔNG CỘNG)
  const summaryStyle = {
    fill: { fgColor: { rgb: COLORS.summaryRowBg } },
    font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.textNavy } },
    border: mediumBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  setCell(currentRow, 0, 'TỔNG CỘNG', {
    ...summaryStyle,
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });

  for (let c = 1; c <= 4; c++) {
    setCell(currentRow, c, '', summaryStyle);
  }

  // Days workday totals
  daysInfo.forEach((info, dIdx) => {
    const colIdx = startDayCol + dIdx;
    const isSunday = info.isSunday;
    setCell(currentRow, colIdx, isSunday ? '-' : dailyWorkdayTotals[dIdx], {
      ...summaryStyle,
      fill: { fgColor: { rgb: isSunday ? COLORS.orangeSundayHeader : COLORS.summaryRowBg } },
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: isSunday ? COLORS.textWhite : COLORS.textNavy } },
    });
  });

  setCell(currentRow, colStdDays, totalStd, summaryStyle);
  setCell(currentRow, colActDays, totalAct, {
    ...summaryStyle,
    fill: { fgColor: { rgb: '93C5FD' } },
  });

  // Projects totals
  projectTotals.forEach((tot, pIdx) => {
    const colIdx = startProjCol + pIdx;
    setCell(currentRow, colIdx, tot, {
      ...summaryStyle,
      fill: { fgColor: { rgb: 'FDE68A' } },
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: '78350F' } },
    });
  });

  // Leave totals
  setCell(currentRow, colP, totalP, summaryStyle);
  setCell(currentRow, colNL, totalNL, summaryStyle);
  setCell(currentRow, colKL, totalKL, summaryStyle);
  setCell(currentRow, colTotalLeave, totalLeaveAll, {
    ...summaryStyle,
    fill: { fgColor: { rgb: 'FED7AA' } },
  });

  // OT totals
  setCell(currentRow, colOtHours, totalOtHoursSum, summaryStyle);
  setCell(currentRow, colOtDays, totalOtDaysSum, summaryStyle);
  setCell(currentRow, colNotes, '', summaryStyle);

  currentRow += 2; // Space before signatures

  // 5. SIGNATURE BLOCK
  const sigDateLine = `Ngày ..... tháng ..... năm ${year}`;
  const sigRow1 = currentRow;
  const sigRow2 = currentRow + 1;
  const sigRow3 = currentRow + 4; // Space for signature

  const sigCol1 = 1; // Người lập biểu
  const sigCol2 = Math.floor(totalCols / 2) - 1; // Kế toán trưởng
  const sigCol3 = totalCols - 4; // Giám đốc duyệt

  // Date above Director
  setCell(sigRow1 - 1, sigCol3, sigDateLine, {
    font: { name: 'Arial', sz: 10, italic: true },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: sigRow1 - 1, c: sigCol3 }, e: { r: sigRow1 - 1, c: sigCol3 + 3 } });

  // Titles
  setCell(sigRow1, sigCol1, 'NGƯỜI LẬP BIỂU', {
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: COLORS.navyHeader } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: sigRow1, c: sigCol1 }, e: { r: sigRow1, c: sigCol1 + 2 } });

  setCell(sigRow2, sigCol1, '(Ký, ghi rõ họ tên)', {
    font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '64748B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: sigRow2, c: sigCol1 }, e: { r: sigRow2, c: sigCol1 + 2 } });

  setCell(sigRow1, sigCol2, 'KẾ TOÁN TRƯỞNG', {
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: COLORS.navyHeader } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: sigRow1, c: sigCol2 }, e: { r: sigRow1, c: sigCol2 + 2 } });

  setCell(sigRow2, sigCol2, '(Ký, ghi rõ họ tên)', {
    font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '64748B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: sigRow2, c: sigCol2 }, e: { r: sigRow2, c: sigCol2 + 2 } });

  setCell(sigRow1, sigCol3, 'GIÁM ĐỐC DUYỆT', {
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: COLORS.navyHeader } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: sigRow1, c: sigCol3 }, e: { r: sigRow1, c: sigCol3 + 3 } });

  setCell(sigRow2, sigCol3, '(Ký tên, đóng dấu)', {
    font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '64748B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
  merges.push({ s: { r: sigRow2, c: sigCol3 }, e: { r: sigRow2, c: sigCol3 + 3 } });

  // 6. COLUMN WIDTHS CONFIGURATION
  const cols: XLSX.ColInfo[] = [];
  cols[0] = { wch: 6 }; // STT
  cols[1] = { wch: 11 }; // Mã NV
  cols[2] = { wch: 24 }; // Họ và tên
  cols[3] = { wch: 18 }; // Chức vụ
  cols[4] = { wch: 13 }; // Ngày vào làm

  // Days 1..31
  for (let c = startDayCol; c <= endDayCol; c++) {
    cols[c] = { wch: 4.8 };
  }

  // Summary cols
  cols[colStdDays] = { wch: 11 };
  cols[colActDays] = { wch: 12 };

  // Projects cols
  for (let c = startProjCol; c <= endProjCol; c++) {
    cols[c] = { wch: 12 };
  }

  // Leave cols
  cols[colP] = { wch: 9 };
  cols[colNL] = { wch: 8 };
  cols[colKL] = { wch: 11 };
  cols[colTotalLeave] = { wch: 10 };

  // OT cols
  cols[colOtHours] = { wch: 9 };
  cols[colOtDays] = { wch: 11 };
  cols[colNotes] = { wch: 14 };

  ws['!cols'] = cols;
  ws['!merges'] = merges;

  // Set standard sheet range dimensions
  const maxRow = currentRow + 6;
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: maxRow, c: Math.max(totalCols - 1, 0) },
  });

  // 7. CREATE WORKBOOK AND EXPORT
  const wb = XLSX.utils.book_new();
  const sheetName = `BangChamCong_${monthStr}_${year}`.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const resolvedFileName = `Bang_Cham_Cong_Va_Phan_Bo_Du_An_${month}.xlsx`;

  // Safe browser download via Blob and URL.createObjectURL (prevents iframe sandbox write crashes)
  let downloadSuccess = false;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resolvedFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 300);
      downloadSuccess = true;
    } catch (blobErr) {
      console.warn('Blob URL download failed, attempting XLSX.writeFile fallback:', blobErr);
    }
  }

  if (!downloadSuccess) {
    try {
      XLSX.writeFile(wb, resolvedFileName);
    } catch (writeErr: any) {
      console.error('XLSX.writeFile failed:', writeErr);
      throw new Error('Lỗi xuất file Excel: ' + (writeErr?.message || 'Không thể tạo file'));
    }
  }

  return {
    fileName: resolvedFileName,
    rowCount: safeEmployees.length,
    colCount: totalCols,
  };
}
