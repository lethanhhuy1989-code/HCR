import React, { useState, useMemo } from 'react';
import { Employee, TimesheetRecord, ConstructionProject } from '../types/hrm';
import { standardAttendanceSymbols } from '../data/mockHrmData';
import { useHRM } from '../context/HRMContext';
import { MotorcycleIcon, CarIcon } from './VehicleIcons';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { formatVND, formatNumberVN } from '../utils/payrollCalculator';
import {
  X,
  Calendar,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  HardHat,
  Eraser,
  Trash2,
  Clock,
  Timer,
  CheckSquare,
  Square,
  Fuel,
  FileSpreadsheet,
  FileText,
  ToggleLeft,
  ToggleRight,
  Download,
  Lock,
} from 'lucide-react';

interface DailyTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  timesheet: TimesheetRecord;
  month: string; // "YYYY-MM"
  projects: ConstructionProject[];
  departmentName?: string;
  onSave: (updatedRecord: TimesheetRecord) => void;
  readOnly?: boolean;
}

export const DailyTimesheetModal: React.FC<DailyTimesheetModalProps> = ({
  isOpen,
  onClose,
  employee,
  timesheet,
  month,
  projects,
  departmentName,
  onSave,
  readOnly = false,
}) => {
  // Parse month and calculate days in month (1-28, 29, 30 or 31)
  const [year, monthNum] = useMemo(() => {
    const parts = month.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [month]);

  const daysInMonth = useMemo(() => {
    return new Date(year, monthNum, 0).getDate();
  }, [year, monthNum]);

  // Determine weekday names for each day
  const daysInfo = useMemo(() => {
    const list: { day: number; dayOfWeek: number; dayLabel: string; isSunday: boolean }[] = [];
    const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthNum - 1, d);
      const dow = date.getDay();
      list.push({
        day: d,
        dayOfWeek: dow,
        dayLabel: weekdayLabels[dow],
        isSunday: dow === 0,
      });
    }
    return list;
  }, [year, monthNum, daysInMonth]);

  // Default project for this employee
  const defaultProject = useMemo(() => {
    // If employee matches any specific assignment, or pick BC / HT2 / PT
    if (employee.id === 'emp-01') return projects.find((p) => p.code === 'BC') || projects[0];
    if (employee.id === 'emp-02') return projects.find((p) => p.code === 'PT') || projects[0];
    if (employee.id === 'emp-03') return projects.find((p) => p.code === 'HT2') || projects[0];
    return projects[0];
  }, [employee, projects]);

  // Initialize daily symbols from existing timesheet or generate default
  const [dailySymbols, setDailySymbols] = useState<Record<number, string>>(() => {
    if (timesheet.dailySymbols && Object.keys(timesheet.dailySymbols).length > 0) {
      return { ...timesheet.dailySymbols };
    }

    // Generate defaults
    const initial: Record<number, string> = {};
    const defaultCode = defaultProject?.code || 'BC';

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthNum - 1, d);
      if (date.getDay() === 0) {
        initial[d] = 'CN';
      } else {
        // Sample variation for demo: day 1 is half-day or day 5 is leave
        if (d === 1 && employee.id === 'emp-01') initial[d] = `${defaultCode}/2`;
        else if (d === 5 && employee.id === 'emp-01') initial[d] = `${defaultCode}/P`;
        else initial[d] = defaultCode;
      }
    }
    return initial;
  });

  // Selected project for quick tool stamps (keeps interface compact & scientific even with many projects)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProject?.id || projects[0]?.id || '');

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || defaultProject || projects[0];
  }, [projects, selectedProjectId, defaultProject]);

  // Active selected symbol stamp (allows quick 1-click marking onto any day)
  const [activeStamp, setActiveStamp] = useState<string>(defaultProject?.code || 'BC');

  // Currently opened day picker modal/popover (if user clicks on a day cell)
  const [selectedDayForPicker, setSelectedDayForPicker] = useState<number | null>(null);

  // Selected project for quick whole-month batch fill
  const [batchProjectCode, setBatchProjectCode] = useState<string>(defaultProject?.code || 'BC');

  // Mục tăng ca cho từng nhân sự (khi tích vào sẽ chấm theo giờ cho từng ngày, cuối tính ra ngày, sẽ chia cho 8 tiếng)
  const [hasOvertime, setHasOvertime] = useState<boolean>(() => !!timesheet.hasOvertime);
  const [dailyOtHours, setDailyOtHours] = useState<Record<number, number>>(() => {
    if (timesheet.dailyOtHours && Object.keys(timesheet.dailyOtHours).length > 0) {
      return { ...timesheet.dailyOtHours };
    }
    return {};
  });

  // Tính tổng số giờ tăng ca và quy đổi ra số ngày công (= tổng giờ / 8 tiếng)
  const otStats = useMemo(() => {
    if (!hasOvertime) return { totalOtHours: 0, otConvertedDays: 0 };
    let sum = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      sum += Number(dailyOtHours[d]) || 0;
    }
    const convertedDays = sum > 0 ? Math.round((sum / 8) * 100) / 100 : 0;
    return {
      totalOtHours: sum,
      otConvertedDays: convertedDays,
    };
  }, [hasOvertime, dailyOtHours, daysInMonth]);

  const handleSetOtHour = (day: number, hours: number) => {
    const val = Math.max(0, Math.min(24, hours));
    setDailyOtHours((prev) => ({
      ...prev,
      [day]: val,
    }));
  };

  const handleBatchOt = (hours: number) => {
    const next: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const sym = dailySymbols[d];
      if (sym && sym !== 'CN' && sym !== 'KL' && sym !== 'P') {
        next[d] = hours;
      }
    }
    setDailyOtHours(next);
  };

  const handleClearOt = () => {
    setDailyOtHours({});
  };

  const { settings, showToast } = useHRM();
  const gasPrice = settings?.gasolinePricePerKm || 1800;

  // Mục Phụ cấp xăng (Bật / Tắt và chi tiết 31 ngày)
  const [hasFuelAllowance, setHasFuelAllowance] = useState<boolean>(() => {
    return timesheet.hasFuelAllowance !== false;
  });

  // Chi tiết phương tiện từng ngày 1-31: 'motorcycle' (xe máy) | 'car' (ô tô)
  const [dailyVehicle, setDailyVehicle] = useState<Record<number, 'motorcycle' | 'car'>>(() => {
    if (timesheet.dailyVehicle && Object.keys(timesheet.dailyVehicle).length > 0) {
      return { ...timesheet.dailyVehicle };
    }
    const initial: Record<number, 'motorcycle' | 'car'> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      initial[d] = 'motorcycle';
    }
    return initial;
  });

  // Con dấu phương tiện đang chọn để vuốt nhanh (Xe máy 🏍️ hoặc Ô tô 🚗)
  const [activeVehicleTool, setActiveVehicleTool] = useState<'motorcycle' | 'car'>('motorcycle');
  const [isFuelMouseDown, setIsFuelMouseDown] = useState(false);
  const [fuelDragType, setFuelDragType] = useState<'motorcycle' | 'car'>('motorcycle');

  const handleToggleDayVehicle = (day: number) => {
    setDailyVehicle((prev) => {
      const current = prev[day] || 'motorcycle';
      const next = current === 'motorcycle' ? 'car' : 'motorcycle';
      return {
        ...prev,
        [day]: next,
      };
    });
  };

  // Áp dụng con dấu phương tiện vào ô ngày (hỗ trợ vuốt nhanh)
  const handleApplyVehicleToDay = (day: number, forceType?: 'motorcycle' | 'car') => {
    const typeToApply = forceType || activeVehicleTool;
    setDailyVehicle((prev) => {
      if (prev[day] === typeToApply) return prev;
      return {
        ...prev,
        [day]: typeToApply,
      };
    });
  };

  const handleBatchVehicle = (type: 'motorcycle' | 'car') => {
    const next: Record<number, 'motorcycle' | 'car'> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      next[d] = type;
    }
    setDailyVehicle(next);
    showToast(
      type === 'motorcycle'
        ? 'Đã áp dụng cả tháng đi Xe máy (Sẽ tính phụ cấp xăng)!'
        : 'Đã áp dụng cả tháng đi Ô tô (Không tính phụ cấp xăng - Cấp xe công ty)!'
    );
  };

  // Tiện ích gán nhanh riêng cho các ngày Chủ nhật
  const handleBatchSundaysVehicle = (type: 'motorcycle' | 'car') => {
    setDailyVehicle((prev) => {
      const next = { ...prev };
      daysInfo.forEach((info) => {
        if (info.isSunday) {
          next[info.day] = type;
        }
      });
      return next;
    });
    showToast(
      type === 'motorcycle'
        ? 'Đã áp dụng toàn bộ ngày Chủ nhật đi Xe máy (Sẽ tính phụ cấp xăng)!'
        : 'Đã áp dụng toàn bộ ngày Chủ nhật đi Ô tô (0đ phụ cấp xăng)!'
    );
  };

  // Helper to determine day project & distance (Hỗ trợ ngày Chủ nhật vẫn chấm và tính phụ cấp xăng)
  const getDayDistanceInfo = (day: number): { project?: ConstructionProject; distanceKm: number } => {
    const symbol = (dailySymbols[day] || '').trim();
    let proj: ConstructionProject | undefined;

    if (symbol && symbol !== 'CN' && symbol !== 'KL' && symbol !== 'P' && symbol !== 'NL' && symbol !== '-') {
      const cleanSym = symbol.replace(/\/2$/, '').replace(/\/P$/, '').trim().toUpperCase();
      proj = projects.find((p) => p.code.toUpperCase() === cleanSym) || defaultProject;
    } else {
      // Chủ nhật (CN) hoặc ngày nghỉ nhưng vẫn chấm phụ cấp xăng:
      // Lấy công trình phân bổ của nhân viên hoặc công trình chính
      proj = defaultProject || projects[0];
    }

    if (!proj) return { project: undefined, distanceKm: 0 };
    const empCfg = employee.projectAllowances?.[proj.id];
    const distanceKm = empCfg?.customDistanceKm ?? proj.distanceKm ?? 0;
    return { project: proj, distanceKm };
  };

  // Real-time calculation of fuel allowance statistics across 31 days (CHỦ NHẬT VẪN TÍNH PHỤ CẤP XĂNG)
  const fuelStats = useMemo(() => {
    let daysMotorcycle = 0;
    let daysCar = 0;
    let totalKm = 0;
    let totalAmount = 0;

    const breakdown: Record<number, {
      vehicle: 'motorcycle' | 'car';
      distanceKm: number;
      dayAmount: number;
      isSunday: boolean;
      projectCode?: string;
      isWorkDay: boolean;
    }> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const isSunday = daysInfo[d - 1]?.isSunday ?? false;
      const { project, distanceKm } = getDayDistanceInfo(d);
      const vehicle = dailyVehicle[d] || 'motorcycle';
      const sym = (dailySymbols[d] || '').trim();
      const isWorkDay = Boolean(sym && sym !== 'KL' && sym !== 'P' && sym !== 'NL' && sym !== '-');

      let dayAmount = 0;
      if (hasFuelAllowance && distanceKm > 0) {
        if (vehicle === 'motorcycle') {
          // Đi xe máy: TÍNH PHỤ CẤP XĂNG = cự ly km x tiền xăng (Chủ nhật vẫn tính đầy đủ)
          dayAmount = Math.round(distanceKm * gasPrice);
          daysMotorcycle += 1;
          totalKm += distanceKm;
          totalAmount += dayAmount;
        } else {
          // Đi ô tô: KHÔNG TÍNH PHỤ CẤP XĂNG (0 đ - Cấp xe công ty)
          daysCar += 1;
        }
      }

      breakdown[d] = {
        vehicle,
        distanceKm,
        dayAmount,
        isSunday,
        projectCode: project?.code,
        isWorkDay,
      };
    }

    return {
      hasFuelAllowance,
      daysMotorcycle,
      daysCar,
      totalKm,
      totalAmount,
      gasPrice,
      breakdown,
    };
  }, [hasFuelAllowance, dailyVehicle, dailySymbols, daysInMonth, gasPrice, projects, defaultProject, employee, daysInfo]);

  const handleExportDailyExcel = () => {
    const headers = [
      'Ngày',
      'Thứ',
      'Ký hiệu công',
      'Loại ngày công',
      'Giờ tăng ca (h)',
      'Phụ cấp xăng',
      'Phương tiện',
      'Công trình / Cự ly (km)',
      'Đơn giá xăng (đ/km)',
      'Tiền phụ cấp xăng (VNĐ)',
    ];

    const rows = daysInfo.map((info) => {
      const sym = dailySymbols[info.day] || '';
      const otH = hasOvertime ? (dailyOtHours[info.day] || 0) : 0;
      const b = fuelStats.breakdown[info.day];
      const isMoto = b?.vehicle === 'motorcycle';
      return [
        `Ngày ${info.day}`,
        info.dayLabel,
        sym || '—',
        info.isSunday ? 'Chủ nhật' : sym.endsWith('/2') ? 'Nửa ngày (0.5)' : sym.endsWith('/P') ? 'Nghỉ phép (0.5+P)' : sym ? 'Cả ngày (1.0)' : 'Nghỉ / Trống',
        otH,
        hasFuelAllowance ? 'Bật' : 'Tắt',
        !b?.isWorkDay ? '—' : isMoto ? 'Xe máy (Tính xăng)' : 'Ô tô (Cấp xe - 0đ)',
        b?.isWorkDay ? `${b?.projectCode || ''} (${b?.distanceKm} km)` : '—',
        hasFuelAllowance && isMoto && b?.isWorkDay ? gasPrice : 0,
        b?.dayAmount || 0,
      ];
    });

    // Summary row
    rows.push([
      'TỔNG CỘNG',
      '',
      `${stats.actualDays} công`,
      '',
      hasOvertime ? `${otStats.totalOtHours}h (${otStats.otConvertedDays} ngày)` : 0,
      hasFuelAllowance ? 'Đang BẬT' : 'Đang TẮT',
      `${fuelStats.daysMotorcycle} ngày xe máy / ${fuelStats.daysCar} ngày ô tô`,
      `${fuelStats.totalKm} km`,
      gasPrice,
      fuelStats.totalAmount,
    ]);

    exportToExcel({
      fileName: `Bang_Cong_Chi_Tiet_${employee.code}_${month}.xlsx`,
      sheetName: `Cong_${employee.code}`,
      title: `BẢNG CHẤM CÔNG VÀ PHỤ CẤP XĂNG CHI TIẾT - THÁNG ${monthNum}/${year}`,
      subtitles: [
        `Nhân viên: ${employee.fullName} (${employee.code}) - Chức vụ: ${employee.position} - Phòng ban: ${departmentName || 'Công ty'}`,
        `Quy định xăng: ${gasPrice.toLocaleString('vi-VN')} đ/km | Xe máy: Tính xăng | Ô tô: Không tính xăng`,
      ],
      headers,
      rows,
    });
    showToast('Đã xuất file Excel bảng công chi tiết thành công!');
  };

  const handleExportDailyPDF = () => {
    const headers = [
      'Ngay',
      'Thu',
      'Ky hieu',
      'Tang ca (h)',
      'Phuong tien',
      'Cu ly (km)',
      'Tien xang (VND)',
    ];

    const rows = daysInfo.map((info) => {
      const sym = dailySymbols[info.day] || '—';
      const otH = hasOvertime ? `${dailyOtHours[info.day] || 0}h` : '—';
      const b = fuelStats.breakdown[info.day];
      const isMoto = b?.vehicle === 'motorcycle';
      return [
        String(info.day).padStart(2, '0'),
        info.dayLabel,
        sym,
        otH,
        !b?.isWorkDay ? '—' : isMoto ? 'Xe may (Tinh)' : 'O to (0d)',
        b?.isWorkDay ? `${b.distanceKm} km` : '—',
        b?.dayAmount ? b.dayAmount.toLocaleString('vi-VN') : '0',
      ];
    });

    exportToPDF({
      fileName: `Bang_Cong_Chi_Tiet_${employee.code}_${month}.pdf`,
      title: `BANG CHAM CONG VA PHU CAP XANG - ${employee.fullName.toUpperCase()}`,
      subtitles: [
        `Ma NV: ${employee.code} | Chuc vu: ${employee.position} | Thang: ${month}`,
        `Tong cong: ${stats.actualDays} | Tong phu cap xang: ${fuelStats.totalAmount.toLocaleString('vi-VN')} VND (${fuelStats.daysMotorcycle} ngay xe may, ${fuelStats.daysCar} ngay o to)`,
      ],
      headers,
      rows,
      orientation: 'portrait',
    });
    showToast('Đã xuất file PDF bảng công chi tiết thành công!');
  };

  // Calculate actual working days and leave days from symbols in real time
  const stats = useMemo(() => {
    let actualDays = 0;
    let paidLeave = 0;
    let unpaidLeave = 0;
    let sundayCount = 0;
    let emptyOffDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const symbol = dailySymbols[d];
      const upper = (symbol || '').toUpperCase().trim();

      if (!upper || upper === '' || upper === '-') {
        emptyOffDays += 1;
        continue;
      }

      if (upper === 'CN') {
        sundayCount += 1;
        continue;
      }

      if (upper.endsWith('/2')) {
        // Half day work
        actualDays += 0.5;
      } else if (upper.endsWith('/P')) {
        // Work half day, half day paid leave
        actualDays += 0.5;
        paidLeave += 0.5;
      } else if (upper === 'P' || upper === 'NL' || upper === 'CĐ') {
        paidLeave += 1;
      } else if (upper === 'KL') {
        unpaidLeave += 1;
      } else {
        // Full day work (e.g. BC, HT2, PT, +, CT...)
        actualDays += 1;
      }
    }

    return {
      actualDays,
      paidLeave,
      unpaidLeave,
      sundayCount,
      emptyOffDays,
    };
  }, [dailySymbols, daysInMonth]);

  // Mouse drag-to-paint state
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Global mouseup listener to cancel drag smoothly anywhere
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      setIsFuelMouseDown(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Apply active stamp to day (supports normal symbols or CLEAR eraser)
  const handleApplyStampToDay = (day: number) => {
    const symbolToApply = activeStamp === 'CLEAR' ? '' : activeStamp;
    setDailySymbols((prev) => {
      if (prev[day] === symbolToApply) return prev; // Avoid unnecessary re-render
      return {
        ...prev,
        [day]: symbolToApply,
      };
    });
  };

  // Touch drag support for tablet / mobile devices for timesheet row
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const dayCell = target?.closest('[data-day-cell]') as HTMLElement | null;
    if (dayCell && dayCell.dataset.day) {
      const dayNum = Number(dayCell.dataset.day);
      if (dayNum) {
        handleApplyStampToDay(dayNum);
      }
    }
  };

  // Touch drag support for tablet / mobile devices for fuel allowance row
  const handleFuelTouchMove = (e: React.TouchEvent) => {
    if (!hasFuelAllowance) return;
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const fuelCell = target?.closest('[data-fuel-day-cell]') as HTMLElement | null;
    if (fuelCell && fuelCell.dataset.fuelDay) {
      const dayNum = Number(fuelCell.dataset.fuelDay);
      if (dayNum) {
        handleApplyVehicleToDay(dayNum, activeVehicleTool);
      }
    }
  };

  // Set symbol for a specific day
  const handleSetDaySymbol = (day: number, symbol: string) => {
    setDailySymbols((prev) => ({
      ...prev,
      [day]: symbol,
    }));
    setSelectedDayForPicker(null);
  };

  // Batch fill whole month with a project
  const handleBatchFill = (code: string) => {
    const next: Record<number, string> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthNum - 1, d);
      if (date.getDay() === 0) {
        next[d] = 'CN';
      } else {
        next[d] = code;
      }
    }
    setDailySymbols(next);
  };

  // Reset to default
  const handleReset = () => {
    const code = defaultProject?.code || 'BC';
    handleBatchFill(code);
  };

  // Clear all working days in month (leave completely blank)
  const handleClearAll = () => {
    const next: Record<number, string> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthNum - 1, d);
      if (date.getDay() === 0) {
        next[d] = 'CN';
      } else {
        next[d] = '';
      }
    }
    setDailySymbols(next);
  };

  // Save changes
  const handleSave = () => {
    onSave({
      ...timesheet,
      actualWorkingDays: stats.actualDays,
      paidLeaveDays: stats.paidLeave,
      unpaidLeaveDays: stats.unpaidLeave,
      dailySymbols,
      hasOvertime,
      dailyOtHours: hasOvertime ? dailyOtHours : {},
      totalOtHours: otStats.totalOtHours,
      otConvertedDays: otStats.otConvertedDays,
      otHoursNormal: hasOvertime ? otStats.totalOtHours : timesheet.otHoursNormal,
      hasFuelAllowance,
      dailyVehicle,
      totalFuelDistanceKm: fuelStats.totalKm,
      totalFuelDays: fuelStats.daysMotorcycle,
      totalFuelAllowanceAmount: fuelStats.totalAmount,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700/60 flex items-center justify-center border border-blue-500/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base">
                  Bảng Chấm Công Chi Tiết Theo Ngày (1 - {daysInMonth} Ngày)
                </h3>
                <span className="bg-blue-800 text-blue-200 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                  {month} ({daysInMonth} ngày)
                </span>
                {readOnly && (
                  <span className="bg-amber-500/90 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                    <Lock className="w-3 h-3 text-slate-950" />
                    Chỉ xem (Đã khóa kỳ)
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200">
                Nhân viên: <strong className="text-white">{employee.fullName}</strong> ({employee.code}) · {employee.position} · {departmentName || 'Công ty'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportDailyExcel}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center space-x-1 transition-colors cursor-pointer"
              title="Xuất bảng công chi tiết 31 ngày ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportDailyPDF}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center space-x-1 transition-colors cursor-pointer"
              title="Xuất bảng công chi tiết 31 ngày ra file PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TRƯỜNG SỐ NGÀY TRONG THÁNG (TỪ NGÀY 1 ĐẾN NGÀY CUỐI THÁNG) & DỮ LIỆU CHẤM CÔNG CHI TIẾT */}
          <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-800 text-xs">Số ngày trong tháng:</span>
                    <span className="font-mono font-bold text-blue-950 bg-white border border-blue-300 px-2 py-0.5 rounded shadow-2xs">
                      {daysInMonth} ngày
                    </span>
                    <span className="font-mono text-[11px] text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded font-semibold">
                      Từ 01/{String(monthNum).padStart(2, '0')}/{year} ➔ {String(daysInMonth).padStart(2, '0')}/{String(monthNum).padStart(2, '0')}/{year}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5 font-medium">
                    <span>Chu kỳ tính: {daysInMonth} ngày</span>
                    <span>·</span>
                    <span className="text-slate-600">{daysInMonth - daysInfo.filter((d) => d.isSunday).length} ngày thường</span>
                    <span>·</span>
                    <span className="text-amber-800 font-bold">{daysInfo.filter((d) => d.isSunday).length} Chủ nhật</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dữ liệu chấm công chi tiết đã ghi nhận */}
            <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto bg-white/90 border border-blue-200 p-1.5 rounded-lg shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold px-1">Dữ liệu ghi nhận:</span>
              <span className="font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]" title="Tổng số ngày công thực tế">
                {stats.actualDays} công
              </span>
              <span className="font-mono font-bold text-purple-900 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-[10px]" title="Nghỉ phép hưởng lương">
                {stats.paidLeave} phép
              </span>
              <span className="font-mono font-bold text-red-900 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px]" title="Nghỉ không lương">
                {stats.unpaidLeave} KL
              </span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]" title="Số ngày trống / chưa chấm">
                {stats.emptyOffDays} trống
              </span>
            </div>
          </div>

          {/* Quick Toolbar: Scientific & Compact Multi-Project Attendance Tools */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            {/* Row 1: Active Project Selector & Its 3 Dedicated Stamps */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 shrink-0">
                  <HardHat className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-slate-800 text-xs">Công trình chấm:</span>
                </div>

                {/* Project Selector Dropdown: Handles 1 to 100+ projects cleanly without clutter */}
                <div className="relative">
                  <select
                    value={activeProject?.id || ''}
                    onChange={(e) => {
                      const chosenId = e.target.value;
                      setSelectedProjectId(chosenId);
                      const found = projects.find((p) => p.id === chosenId);
                      if (found) {
                        setActiveStamp(found.symbolFull);
                      }
                    }}
                    className="bg-white border-2 border-blue-600/70 hover:border-blue-700 text-blue-950 font-bold rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-2xs max-w-[220px] truncate"
                    title="Chọn công trình để lấy bộ ký hiệu chấm công"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3 Dedicated Dynamic Stamps of the Selected Project */}
                {activeProject && (
                  <div className="flex items-center space-x-1.5 bg-white border border-blue-200/90 rounded-md p-0.5 shadow-2xs">
                    {/* Full day */}
                    <button
                      type="button"
                      onClick={() => setActiveStamp(activeProject.symbolFull)}
                      className={`px-2.5 py-1 rounded font-mono font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        activeStamp === activeProject.symbolFull
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400 font-extrabold'
                          : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                      }`}
                      title={`${activeProject.name}: Làm cả ngày (1.0 công)`}
                    >
                      <span>{activeProject.symbolFull}</span>
                      <span className="text-[10px] font-sans font-normal opacity-80 hidden sm:inline">(Cả ngày)</span>
                    </button>

                    {/* Half day */}
                    <button
                      type="button"
                      onClick={() => setActiveStamp(activeProject.symbolHalf)}
                      className={`px-2 py-1 rounded font-mono font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        activeStamp === activeProject.symbolHalf
                          ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400 font-extrabold'
                          : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      }`}
                      title={`${activeProject.name}: Nghỉ 1 buổi (0.5 công)`}
                    >
                      <span>{activeProject.symbolHalf}</span>
                      <span className="text-[10px] font-sans font-normal opacity-80 hidden sm:inline">(Nửa ngày)</span>
                    </button>

                    {/* Leave with permission */}
                    <button
                      type="button"
                      onClick={() => setActiveStamp(activeProject.symbolLeave)}
                      className={`px-2 py-1 rounded font-mono font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        activeStamp === activeProject.symbolLeave
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400 font-extrabold'
                          : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title={`${activeProject.name}: Nghỉ có phép (0.5 công + P)`}
                    >
                      <span>{activeProject.symbolLeave}</span>
                      <span className="text-[10px] font-sans font-normal opacity-80 hidden sm:inline">(Có phép)</span>
                    </button>
                  </div>
                )}

                {/* Quick chip switcher for top 3 projects */}
                {projects.length > 1 && (
                  <div className="hidden xl:flex items-center space-x-1 text-[11px] text-slate-500">
                    <span className="text-[10px] text-slate-400">Gợi ý:</span>
                    {projects.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setActiveStamp(p.symbolFull);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          activeProject?.id === p.id
                            ? 'bg-blue-100 text-blue-900 border border-blue-300 font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={`Chuyển nhanh sang ${p.name}`}
                      >
                        {p.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Actions: Fill Month & Clear Month */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <span className="text-slate-600 font-medium text-[11px]">Điền cả tháng:</span>
                <select
                  value={batchProjectCode}
                  onChange={(e) => {
                    setBatchProjectCode(e.target.value);
                    handleBatchFill(e.target.value);
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold font-mono text-blue-900 focus:outline-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                  <option value="+">Văn phòng (+)</option>
                </select>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Khôi phục trạng thái chuẩn cả tháng"
                >
                  <RotateCcw className="w-3 h-3 text-slate-600" />
                  <span>Mặc định</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Xóa để trống toàn bộ các ngày làm trong tháng (0 công)"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Xóa trống</span>
                </button>
              </div>
            </div>

            {/* Row 2: Standard Symbols & Dedicated Eraser Tool */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                {/* Standard Common Symbols */}
                <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Quy định chung:</span>
                  <button
                    type="button"
                    onClick={() => setActiveStamp('+')}
                    className={`px-2 py-0.5 rounded font-mono font-bold text-xs cursor-pointer transition-all ${
                      activeStamp === '+' ? 'bg-blue-700 text-white ring-2 ring-blue-400 font-extrabold' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                    title="Văn phòng Công ty (+)"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStamp('P')}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs cursor-pointer transition-all ${
                      activeStamp === 'P' ? 'bg-purple-700 text-white ring-2 ring-purple-400 font-extrabold' : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                    }`}
                    title="Nghỉ phép hưởng lương (P)"
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStamp('NL')}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs cursor-pointer transition-all ${
                      activeStamp === 'NL' ? 'bg-rose-700 text-white ring-2 ring-rose-400 font-extrabold' : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
                    }`}
                    title="Nghỉ Lễ, Tết (NL)"
                  >
                    NL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStamp('CT')}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs cursor-pointer transition-all ${
                      activeStamp === 'CT' ? 'bg-indigo-700 text-white ring-2 ring-indigo-400 font-extrabold' : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                    title="Công tác (CT)"
                  >
                    CT
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStamp('KL')}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs cursor-pointer transition-all ${
                      activeStamp === 'KL' ? 'bg-slate-700 text-white ring-2 ring-slate-400 font-extrabold' : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                    }`}
                    title="Nghỉ không lương (KL)"
                  >
                    KL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStamp('CN')}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs cursor-pointer transition-all ${
                      activeStamp === 'CN' ? 'bg-amber-500 text-slate-900 ring-2 ring-amber-300 font-extrabold' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                    title="Chủ nhật (CN)"
                  >
                    CN
                  </button>
                </div>

                {/* Dedicated ERASER / CLEAR TOOL */}
                <div className="flex items-center space-x-1 bg-white border border-rose-200 rounded-md px-1.5 py-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveStamp('CLEAR')}
                    className={`px-2.5 py-0.5 rounded font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                      activeStamp === 'CLEAR'
                        ? 'bg-rose-600 text-white font-bold shadow-xs ring-2 ring-rose-400'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                    title="Cục tẩy: Xóa ô / Để trống ngày nghỉ (Giữ chuột và kéo ngang qua các ngày cần xóa)"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Xóa / Để trống ô</span>
                  </button>
                </div>
              </div>

              {/* Active Stamp Feedback Indicator */}
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="text-slate-500">Đang chọn:</span>
                {activeStamp === 'CLEAR' ? (
                  <span className="font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded border border-rose-300 shadow-2xs flex items-center gap-1">
                    <Eraser className="w-3.5 h-3.5 text-rose-700" />
                    Cục tẩy (Để trống ô ngày nghỉ)
                  </span>
                ) : (
                  <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded border border-blue-200 shadow-2xs flex items-center gap-1.5">
                    <span className="text-xs">{activeStamp}</span>
                    <span className="text-[10px] font-sans font-normal text-blue-700">
                      {activeStamp === activeProject?.symbolFull
                        ? `(${activeProject.name} - Cả ngày)`
                        : activeStamp === activeProject?.symbolHalf
                        ? `(${activeProject.name} - Nửa ngày)`
                        : activeStamp === activeProject?.symbolLeave
                        ? `(${activeProject.name} - Có phép)`
                        : ''}
                    </span>
                  </span>
                )}
                {activeStamp === 'CLEAR' ? (
                  <span className="text-rose-800 font-semibold bg-rose-100/90 px-2 py-0.5 rounded border border-rose-300 flex items-center gap-1 text-[10px] hidden sm:flex">
                    🧹 Giữ chuột & kéo ngang để xóa trắng nhiều ngày
                  </span>
                ) : (
                  <span className="text-emerald-800 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 text-[10px] hidden sm:flex">
                    ✨ Giữ chuột & kéo ngang để nhập liên tiếp (nhấp lại ô để xóa)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Tăng ca cho từng nhân sự (khi tích vào sẽ chấm theo giờ cho từng ngày, cuối tính ra ngày, sẽ chia cho 8 tiếng) */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center space-x-3">
              <label className="relative flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasOvertime}
                  onChange={(e) => setHasOvertime(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
              </label>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Chấm tăng ca theo giờ cho nhân sự này
                  </span>
                  {hasOvertime ? (
                    <span className="bg-amber-200 text-amber-950 text-[10px] px-2 py-0.2 rounded font-bold">
                      Đang bật chấm tăng ca
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.2 rounded font-medium">
                      Đang tắt
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900/80">
                  Quy tắc: Chấm theo giờ cho từng ngày, cuối tháng hệ thống tự động tính tổng giờ và <strong>chia cho 8 tiếng</strong> để quy đổi ra ngày công.
                </p>
              </div>
            </div>

            {hasOvertime && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="bg-white border border-amber-300 rounded px-2.5 py-1 text-[11px] font-mono shadow-2xs">
                  Tổng giờ: <strong className="text-amber-950 text-xs">{otStats.totalOtHours} giờ</strong>
                  <span className="mx-1 text-slate-300">|</span>
                  Quy đổi: <strong className="text-blue-900 text-xs">{otStats.otConvertedDays} ngày công</strong> (÷ 8h)
                </div>

                <div className="flex items-center space-x-1 text-[11px]">
                  <span className="text-slate-500 text-[10px] hidden sm:inline">Điền nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleBatchOt(1)}
                    className="px-1.5 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold cursor-pointer"
                    title="Điền 1 giờ tăng ca cho tất cả các ngày làm việc"
                  >
                    +1h
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchOt(2)}
                    className="px-1.5 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold cursor-pointer"
                    title="Điền 2 giờ tăng ca cho tất cả các ngày làm việc"
                  >
                    +2h
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchOt(3)}
                    className="px-1.5 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold cursor-pointer"
                    title="Điền 3 giờ tăng ca cho tất cả các ngày làm việc"
                  >
                    +3h
                  </button>
                  <button
                    type="button"
                    onClick={handleClearOt}
                    className="px-1.5 py-0.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded text-[10px] font-semibold cursor-pointer"
                    title="Xóa toàn bộ giờ tăng ca của tháng"
                  >
                    Xóa giờ TC
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Phụ cấp xăng công trình (Bật / Tắt & 2 chế độ: Xe máy tính xăng vs Ô tô không tính xăng) */}
          <div className="bg-emerald-50/80 border border-emerald-300 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center space-x-3">
              <label className="relative flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasFuelAllowance}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    setHasFuelAllowance(nextVal);
                    showToast(
                      nextVal
                        ? 'Đã BẬT phụ cấp xăng (Có tính theo ngày đi xe máy 🏍️)!'
                        : 'Đã TẮT phụ cấp xăng (Chưa áp dụng cho nhân sự này)!'
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </label>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-emerald-700" />
                    Phụ cấp xăng xe công trình (Chi tiết 31 ngày)
                  </span>
                  {hasFuelAllowance ? (
                    <span className="bg-emerald-200 text-emerald-950 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-800" />
                      Đang bật phụ cấp xăng
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">
                      Đang tắt (Chưa áp dụng)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-900/80">
                  Quy định 2 chế độ: Đi <strong>Xe máy 🏍️</strong> = <em>SẼ tính phụ cấp xăng</em> (Cự ly km × đơn giá {gasPrice.toLocaleString('vi-VN')} đ/km). Đi <strong>Ô tô 🚗</strong> = <em>KHÔNG tính phụ cấp xăng</em> (Cấp xe công ty đưa đón).
                </p>
              </div>
            </div>

            {hasFuelAllowance && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="bg-white border border-emerald-300 rounded px-2.5 py-1 text-[11px] font-mono shadow-2xs">
                  Xe máy: <strong className="text-emerald-900 text-xs">{fuelStats.daysMotorcycle} ngày</strong> ({fuelStats.totalKm} km)
                  <span className="mx-1.5 text-slate-300">|</span>
                  Ô tô: <strong className="text-slate-700 text-xs">{fuelStats.daysCar} ngày</strong>
                  <span className="mx-1.5 text-slate-300">|</span>
                  Tiền xăng: <strong className="text-blue-900 text-xs">{fuelStats.totalAmount.toLocaleString('vi-VN')} đ</strong>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className="text-slate-500 text-[10px] hidden sm:inline">Điền nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleBatchVehicle('motorcycle')}
                    className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-colors"
                    title="Cả tháng đi xe máy: Sẽ tính phụ cấp xăng cho tất cả các ngày làm việc"
                  >
                    <MotorcycleIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Cả tháng Xe máy 🏍️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchVehicle('car')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-colors"
                    title="Cả tháng đi ô tô: Công ty cấp xe đưa đón, không tính phụ cấp xăng (0 đ)"
                  >
                    <CarIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Cả tháng Ô tô 🚗</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timesheet Days Matrix (1 - 30/31 days) matching Excel format */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden">
            <div className="p-2.5 bg-slate-100 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                Lịch chấm công chi tiết tháng {monthNum}/{year} ({daysInMonth} ngày)
              </span>
              <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                <span>Nhân viên: <strong className="text-slate-900">{employee.fullName}</strong></span>
              </div>
            </div>

            <div
              className="overflow-x-auto select-none"
              onMouseUp={() => setIsMouseDown(false)}
              onMouseLeave={() => setIsMouseDown(false)}
              onTouchMove={handleTouchMove}
            >
              <table className="w-full text-center border-collapse min-w-[980px] select-none">
                <thead>
                  {/* Row 1: Day of Week (T2, T3... CN) */}
                  <tr className="bg-slate-200/80 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                    <th className="py-2 px-2 text-left w-24 bg-slate-200 text-slate-800 border-r border-slate-300">
                      Thứ
                    </th>
                    {daysInfo.map((info) => (
                      <th
                        key={info.day}
                        className={`py-2 px-1 font-mono text-center border-r border-slate-300 ${
                          info.isSunday
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'text-slate-700'
                        }`}
                      >
                        {info.dayLabel}
                      </th>
                    ))}
                  </tr>

                  {/* Row 2: Day Numbers (01 - 30/31) */}
                  <tr className="bg-slate-100 text-[11px] font-bold text-slate-800 border-b-2 border-slate-400">
                    <th className="py-2 px-2 text-left bg-slate-100 border-r border-slate-300">
                      Ngày
                    </th>
                    {daysInfo.map((info) => (
                      <th
                        key={info.day}
                        className={`py-2 px-1 font-mono border-r border-slate-300 ${
                          info.isSunday
                            ? 'bg-amber-300/80 text-slate-950 font-black'
                            : 'text-slate-800'
                        }`}
                      >
                        {String(info.day).padStart(2, '0')}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Row 3: Interactive Symbols for Each Day */}
                  <tr className="bg-white">
                    <td className="py-3 px-2 text-left font-bold text-slate-800 border-r border-slate-300 bg-slate-50 text-[11px]">
                      Ký hiệu công
                    </td>

                    {daysInfo.map((info) => {
                      const symbol = dailySymbols[info.day] || '';
                      const isSunday = info.isSunday;
                      const isBlank = !symbol || symbol.trim() === '' || symbol === '-';
                      const isHalf = symbol.endsWith('/2');
                      const isLeave = symbol.endsWith('/P');
                      const isPaidLeave = symbol === 'P' || symbol === 'NL' || symbol === 'CĐ';
                      const isUnpaid = symbol === 'KL';

                      return (
                        <td
                          key={info.day}
                          data-day-cell={info.day}
                          data-day={info.day}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' || e.key === 'Delete') {
                              e.preventDefault();
                              handleSetDaySymbol(info.day, '');
                            }
                          }}
                          onMouseDown={(e) => {
                            if (e.button === 0) {
                              e.preventDefault();
                              setIsMouseDown(true);
                              if (activeStamp === 'CLEAR') {
                                handleSetDaySymbol(info.day, '');
                              } else {
                                // If clicking cell that already has this stamp, toggle to blank/empty
                                if (symbol === activeStamp) {
                                  handleSetDaySymbol(info.day, '');
                                } else {
                                  handleApplyStampToDay(info.day);
                                }
                              }
                            }
                          }}
                          onMouseEnter={() => {
                            if (isMouseDown) {
                              handleApplyStampToDay(info.day);
                            }
                          }}
                          className={`py-3 px-1 border-r border-slate-300 transition-all select-none group relative focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isMouseDown ? 'cursor-cell ring-1 ring-blue-400 inset-0' : 'cursor-pointer'
                          } ${
                            isSunday
                              ? 'bg-amber-100/60 hover:bg-amber-200/80'
                              : isBlank
                              ? 'bg-white hover:bg-slate-100/80'
                              : isHalf
                              ? 'bg-orange-50 hover:bg-orange-100'
                              : isLeave
                              ? 'bg-emerald-50 hover:bg-emerald-100'
                              : isPaidLeave
                              ? 'bg-purple-50 hover:bg-purple-100'
                              : isUnpaid
                              ? 'bg-red-50 hover:bg-red-100'
                              : 'hover:bg-blue-50/80 bg-blue-50/20'
                          }`}
                          title={`Ngày ${info.day} (${info.dayLabel}): ${
                            isBlank ? 'Để trống (Ngày nghỉ - Không tính công)' : symbol
                          }. Nhấp lại để xóa, hoặc nhấn Backspace/Delete để xóa ô`}
                        >
                          {/* Quick delete button '×' on cell hover */}
                          {!isBlank && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDaySymbol(info.day, '');
                              }}
                              className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-2xs text-[9px] font-bold"
                              title="Xóa ô này (để trống ngày nghỉ)"
                            >
                              ×
                            </button>
                          )}

                          <div className="flex flex-col items-center justify-center min-h-[36px] pointer-events-none">
                            {isBlank ? (
                              <span className="font-mono text-xs text-slate-300 font-normal select-none group-hover:text-slate-400">
                                {isSunday ? 'CN' : '—'}
                              </span>
                            ) : (
                              <span
                                className={`font-mono text-xs font-bold leading-tight ${
                                  isSunday
                                    ? 'text-amber-900 font-extrabold'
                                    : isHalf
                                    ? 'text-orange-900'
                                    : isLeave
                                    ? 'text-emerald-900'
                                    : isPaidLeave
                                    ? 'text-purple-900'
                                    : isUnpaid
                                    ? 'text-red-900'
                                    : 'text-blue-900'
                                }`}
                              >
                                {symbol}
                              </span>
                            )}

                            {/* Small indicator */}
                            <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isBlank ? 'Trống' : 'Xóa / Đổi'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 4: Daily Overtime Hours (chấm theo giờ cho từng ngày, cuối chia 8 tiếng tính ra ngày công) */}
                  {hasOvertime && (
                    <tr className="bg-amber-50/40 border-t border-amber-300">
                      <td className="py-2.5 px-2 text-left font-bold text-amber-950 border-r border-slate-300 bg-amber-100/70 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Tăng ca (h)</span>
                        </div>
                        <span className="text-[9px] text-amber-800 font-normal block">
                          ÷ 8h tính ngày
                        </span>
                      </td>

                      {daysInfo.map((info) => {
                        const otVal = dailyOtHours[info.day] !== undefined ? dailyOtHours[info.day] : '';
                        const isSunday = info.isSunday;

                        return (
                          <td
                            key={info.day}
                            className={`py-1 px-0.5 border-r border-slate-300 text-center ${
                              isSunday ? 'bg-amber-100/60' : 'bg-amber-50/20'
                            }`}
                          >
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              value={otVal}
                              onChange={(e) => handleSetOtHour(info.day, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-8 sm:w-9 px-0.5 py-1 text-center font-mono font-bold text-[11px] text-amber-950 bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-2xs hover:border-amber-400"
                              title={`Ngày ${info.day} (${info.dayLabel}): ${otVal ? `${otVal} giờ tăng ca` : '0 giờ'}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* Row 5: Daily Fuel Allowance & Vehicle (Chi tiết 31 ngày: Xe máy tính xăng vs Ô tô không tính xăng) */}
                  <tr className="bg-emerald-50/20 border-t border-emerald-300">
                    <td className="py-2.5 px-2 text-left font-bold text-emerald-950 border-r border-slate-300 bg-emerald-100/70 text-[11px]">
                      <div className="flex items-center space-x-1">
                        <Fuel className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Phụ cấp xăng</span>
                      </div>
                      <span className="text-[9px] text-emerald-800 font-normal block">
                        {hasFuelAllowance ? '🏍️ Xe máy / 🚗 Ô tô' : 'Đang Tắt'}
                      </span>
                    </td>

                    {daysInfo.map((info) => {
                      const b = fuelStats.breakdown[info.day];
                      const isWorkDay = b?.isWorkDay;
                      const isMoto = b?.vehicle === 'motorcycle';
                      const isSunday = info.isSunday;

                      if (!hasFuelAllowance) {
                        return (
                          <td
                            key={info.day}
                            className={`py-1 px-0.5 border-r border-slate-300 text-center ${
                              isSunday ? 'bg-amber-100/30' : 'bg-slate-50'
                            }`}
                            title="Chế độ phụ cấp xăng đang tắt"
                          >
                            <span className="text-[10px] text-slate-300 font-mono select-none">—</span>
                          </td>
                        );
                      }

                      if (!isWorkDay) {
                        return (
                          <td
                            key={info.day}
                            className={`py-1 px-0.5 border-r border-slate-300 text-center ${
                              isSunday ? 'bg-amber-100/30' : 'bg-slate-50/50'
                            }`}
                            title={`Ngày ${info.day} (${info.dayLabel}): Ngày nghỉ / không làm việc`}
                          >
                            <span className="text-[10px] text-slate-300 font-mono select-none">—</span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={info.day}
                          className={`py-1 px-0.5 border-r border-slate-300 text-center transition-colors ${
                            isMoto ? 'bg-emerald-50/70 hover:bg-emerald-100' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleDayVehicle(info.day)}
                            className={`w-full py-1 px-0.5 rounded flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xs border ${
                              isMoto
                                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 hover:scale-105'
                                : 'bg-slate-600 text-white border-slate-700 hover:bg-slate-700 hover:scale-105'
                            }`}
                            title={`Ngày ${info.day} (${info.dayLabel}): ${
                              isMoto
                                ? `Đang chọn: XE MÁY 🏍️ (SẼ TÍNH PHỤ CẤP XĂNG)\nCông trình: ${b?.projectCode || ''} (${b?.distanceKm} km)\nTiền xăng = ${b?.distanceKm} km x ${gasPrice.toLocaleString('vi-VN')} đ = ${b?.dayAmount.toLocaleString('vi-VN')} đ\n(Nhấp chuột để đổi sang Ô tô 🚗)`
                                : `Đang chọn: Ô TÔ 🚗 (KHÔNG TÍNH PHỤ CẤP XĂNG - Cấp xe công ty = 0 đ)\n(Nhấp chuột để đổi sang Xe máy 🏍️)`
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {isMoto ? (
                                <MotorcycleIcon className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <CarIcon className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                            <span className="text-[8px] font-bold leading-none mt-0.5 font-mono">
                              {isMoto ? `+${Math.round((b?.dayAmount || 0) / 1000)}k` : '0đ'}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Summary Bar */}
          <div className={`grid grid-cols-2 ${hasOvertime ? 'sm:grid-cols-7' : 'sm:grid-cols-6'} gap-2.5`}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center">
              <span className="text-slate-600 text-[11px] block">Tổng công thực tế</span>
              <span className="text-xl font-bold font-mono text-blue-900">
                {stats.actualDays} <span className="text-xs font-normal">công</span>
              </span>
              <span className="text-[10px] text-blue-700 block mt-0.5">Làm tại công trình / cty</span>
            </div>

            {hasOvertime && (
              <div className="bg-amber-100/80 border border-amber-300 rounded-lg p-2.5 text-center">
                <span className="text-amber-900 text-[11px] block font-bold">Tăng ca (Chia 8h)</span>
                <span className="text-xl font-bold font-mono text-amber-950">
                  {otStats.otConvertedDays} <span className="text-xs font-normal">ngày</span>
                </span>
                <span className="text-[10px] text-amber-800 block mt-0.5">
                  Tổng {otStats.totalOtHours} giờ ÷ 8 tiếng
                </span>
              </div>
            )}

            {/* Thẻ phụ cấp xăng */}
            {hasFuelAllowance ? (
              <div className="bg-emerald-100/90 border border-emerald-300 rounded-lg p-2.5 text-center shadow-2xs">
                <span className="text-emerald-950 text-[11px] block font-bold flex items-center justify-center gap-1">
                  <Fuel className="w-3 h-3 text-emerald-800" />
                  Phụ cấp xăng (31 ngày)
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-950">
                  {fuelStats.totalAmount.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
                </span>
                <span className="text-[10px] text-emerald-800 block mt-0.5 truncate">
                  {fuelStats.daysMotorcycle} ngày 🏍️ · {fuelStats.daysCar} ngày 🚗
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-center">
                <span className="text-slate-600 text-[11px] block font-medium">Phụ cấp xăng</span>
                <span className="text-base font-bold font-mono text-slate-500">
                  Đang TẮT
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">0 đ (Chưa áp dụng)</span>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
              <span className="text-slate-600 text-[11px] block">Nghỉ phép hưởng lương</span>
              <span className="text-xl font-bold font-mono text-emerald-900">
                {stats.paidLeave} <span className="text-xs font-normal">ngày</span>
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">Phép năm (P), Lễ, /P</span>
            </div>

            <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-center">
              <span className="text-slate-600 text-[11px] block">Nghỉ (Để trống ô)</span>
              <span className="text-xl font-bold font-mono text-slate-800">
                {stats.emptyOffDays} <span className="text-xs font-normal">ngày</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Ô trống không tính công</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
              <span className="text-slate-600 text-[11px] block">Nghỉ không lương (KL)</span>
              <span className="text-xl font-bold font-mono text-rose-900">
                {stats.unpaidLeave} <span className="text-xs font-normal">ngày</span>
              </span>
              <span className="text-[10px] text-rose-700 block mt-0.5">Ký hiệu KL</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center col-span-2 sm:col-span-1">
              <span className="text-slate-600 text-[11px] block">Số ngày Chủ nhật</span>
              <span className="text-xl font-bold font-mono text-amber-950">
                {stats.sundayCount} <span className="text-xs font-normal">ngày</span>
              </span>
              <span className="text-[10px] text-amber-800 block mt-0.5">Ký hiệu CN</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Số ngày tháng: <strong>{daysInMonth} ngày</strong> · Chuẩn định mức: <strong>26 công</strong>
            {hasOvertime && (
              <span className="ml-2 text-amber-900 font-semibold">
                · Tăng ca: <strong>{otStats.totalOtHours}h</strong> = <strong>{otStats.otConvertedDays} ngày</strong> (chia 8h)
              </span>
            )}
            {hasFuelAllowance && fuelStats.totalAmount > 0 && (
              <span className="ml-2 text-emerald-900 font-semibold hidden md:inline">
                · Xăng xe: <strong>{fuelStats.daysMotorcycle} ngày 🏍️</strong> ({fuelStats.totalKm}km) = <strong>{fuelStats.totalAmount.toLocaleString('vi-VN')} đ</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportDailyExcel}
              className="px-3 py-2 border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 rounded font-semibold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              title="Xuất bảng công chi tiết 31 ngày ra Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportDailyPDF}
              className="px-3 py-2 border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 rounded font-semibold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              title="Xuất bảng công chi tiết 31 ngày ra PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Xuất PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-200 cursor-pointer font-medium text-xs"
            >
              {readOnly ? 'Đóng' : 'Hủy'}
            </button>
            {readOnly ? (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Kỳ đã khóa - Không thể chỉnh sửa</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-bold shadow-xs cursor-pointer flex items-center space-x-1.5 transition-colors text-xs"
              >
                <Save className="w-4 h-4" />
                <span>
                  Lưu & Cập nhật ({stats.actualDays} công
                  {hasOvertime && otStats.otConvertedDays > 0 ? ` + ${otStats.otConvertedDays} ngày TC = ${(stats.actualDays + otStats.otConvertedDays).toFixed(2)} ngày` : ''}
                  {hasFuelAllowance && fuelStats.totalAmount > 0 ? ` · ${fuelStats.totalAmount.toLocaleString('vi-VN')}đ xăng` : ''})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
