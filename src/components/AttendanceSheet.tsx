import React, { useState, useMemo, useEffect } from 'react';
import { useHRM } from '../context/HRMContext';
import { TimesheetRecord, Employee } from '../types/hrm';
import { DailyTimesheetModal } from './DailyTimesheetModal';
import { MotorcycleIcon, CarIcon } from './VehicleIcons';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { exportDynamicExcel } from '../utils/dynamicExcelExporter';
import { exportDetailedAttendanceExcel } from '../utils/detailedAttendanceExcelExporter';
import {
  Calendar,
  Save,
  Search,
  CheckCircle2,
  HardHat,
  Layers,
  Download,
  Info,
  Clock,
  Timer,
  Fuel,
  FileSpreadsheet,
  FileText,
  Settings,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Shield,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AttendanceSheet: React.FC = () => {
  const {
    employees,
    departments,
    projects,
    timesheets,
    updateTimesheet,
    currentMonth,
    setCurrentMonth,
    settings,
    excelExportSettings,
    setActiveMainTab,
    showToast,
    lockedMonths,
    lockMonth,
    unlockMonth,
    advanceToNextMonth,
    adminAppEmail,
    isAppAdmin,
    activeRole,
    setActiveRole,
    rolePermissions,
    verifyAdminAppPasscode,
    updateAdminAppPasscode,
    updateRolePermissionByAdmin,
    canActiveRoleEdit,
    logoutAppAdmin,
  } = useHRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed_matrix'>('summary');
  const [selectedEmployeeForDaily, setSelectedEmployeeForDaily] = useState<Employee | null>(null);

  // Draft local state for editing
  const [draftTimesheets, setDraftTimesheets] = useState<TimesheetRecord[]>(() =>
    JSON.parse(JSON.stringify(timesheets))
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Sync draft timesheets when month or external timesheets change
  useEffect(() => {
    setDraftTimesheets(JSON.parse(JSON.stringify(timesheets)));
    setHasChanges(false);
  }, [currentMonth, timesheets]);

  // Lock & Permissions state
  const lockInfo = lockedMonths[currentMonth];
  const isMonthLocked = Boolean(lockInfo?.isLocked);
  const [sessionUnlockedMonths, setSessionUnlockedMonths] = useState<Record<string, boolean>>({});
  const isUnlockedForSession = Boolean(sessionUnlockedMonths[currentMonth]);

  // Exclusive role permission check: only admin app can grant edit rights to anyone (including Director)
  const hasRoleEditPermission = isAppAdmin || canActiveRoleEdit;

  // Effective read-only status
  const isReadOnly = (isMonthLocked && !isUnlockedForSession) || !hasRoleEditPermission;

  // Modal states
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isNextMonthModalOpen, setIsNextMonthModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // Form states
  const [lockPasswordInput, setLockPasswordInput] = useState('');
  const [confirmLockPasswordInput, setConfirmLockPasswordInput] = useState('');
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [unlockPermanent, setUnlockPermanent] = useState(false);
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [showLockPassword, setShowLockPassword] = useState(false);

  // Admin App Authentication & Passcode states in modal
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [showAdminAuthInput, setShowAdminAuthInput] = useState(false);
  const [isChangingAdminPasscode, setIsChangingAdminPasscode] = useState(false);
  const [oldAdminPasscodeInput, setOldAdminPasscodeInput] = useState('');
  const [newAdminPasscodeInput, setNewAdminPasscodeInput] = useState('');

  // Next month transition states
  const [nextMonthShouldLock, setNextMonthShouldLock] = useState(true);
  const [nextMonthLockPassword, setNextMonthLockPassword] = useState('123456');

  // Calculate days in the current selected month
  const [year, monthNum] = useMemo(() => {
    const parts = currentMonth.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [currentMonth]);

  // Compute next month info
  const nextMonthInfo = useMemo(() => {
    const nextDate = new Date(year, monthNum, 1);
    const nmStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    return {
      monthStr: nmStr,
      label: `Tháng ${nextDate.getMonth() + 1} / ${nextDate.getFullYear()}`,
      days: new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate(),
    };
  }, [year, monthNum]);

  const daysInMonth = useMemo(() => {
    return new Date(year, monthNum, 0).getDate();
  }, [year, monthNum]);

  // Days metadata (1 - 28/29/30/31) with weekday labels
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

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDeptFilter === 'all' || e.departmentId === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, selectedDeptFilter]);

  // Check if current user has edit permission
  const checkEditPermission = () => {
    if (isReadOnly) {
      if (isMonthLocked && !isUnlockedForSession) {
        showToast('Kỳ chấm công đã bị khóa! Vui lòng nhập mật khẩu mở khóa để chỉnh sửa.', 'error');
        setIsUnlockModalOpen(true);
      } else if (!hasRoleEditPermission) {
        const roleLabel =
          activeRole === 'director'
            ? 'Ban Giám Đốc'
            : activeRole === 'payroll_accountant'
            ? 'Kế toán tiền lương'
            : activeRole === 'site_manager'
            ? 'Chỉ huy trưởng / Quản lý'
            : 'Nhân viên';
        showToast(
          `CẢNH BÁO: ${roleLabel} chưa được Quản trị viên App (lethanhhuy1989@gmail.com) cấp quyền chỉnh sửa! Ban Giám Đốc không có quyền tự cấp quyền.`,
          'error'
        );
        setIsPermissionModalOpen(true);
      } else {
        showToast('Đang ở chế độ Chỉ xem. Vui lòng liên hệ Quản trị viên App.', 'info');
        setIsPermissionModalOpen(true);
      }
      return false;
    }
    return true;
  };

  // Get or initialize timesheet for an employee
  const getEmployeeTimesheet = (empId: string): TimesheetRecord => {
    const found = draftTimesheets.find((t) => t.employeeId === empId && t.month === currentMonth);
    if (found) return found;

    return {
      id: `ts-${empId}`,
      employeeId: empId,
      month: currentMonth,
      standardWorkingDays: 26,
      actualWorkingDays: 26,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      otHoursNormal: 0,
      otHoursWeekend: 0,
      lateArrivalMinutes: 0,
    };
  };

  const handleFieldChange = (empId: string, field: keyof TimesheetRecord, value: number) => {
    if (!checkEditPermission()) return;
    const updated = [...draftTimesheets];
    const idx = updated.findIndex((t) => t.employeeId === empId && t.month === currentMonth);
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], [field]: value };
    } else {
      updated.push({
        id: `ts-${Date.now()}-${empId}`,
        employeeId: empId,
        month: currentMonth,
        standardWorkingDays: 26,
        actualWorkingDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        otHoursNormal: 0,
        otHoursWeekend: 0,
        lateArrivalMinutes: 0,
        [field]: value,
      });
    }
    setDraftTimesheets(updated);
    setHasChanges(true);
  };

  const handleToggleOvertime = (empId: string) => {
    if (!checkEditPermission()) return;
    const updated = [...draftTimesheets];
    const idx = updated.findIndex((t) => t.employeeId === empId && t.month === currentMonth);
    if (idx !== -1) {
      const nextVal = !updated[idx].hasOvertime;
      const currentOt = updated[idx].totalOtHours || updated[idx].otHoursNormal || 0;
      updated[idx] = {
        ...updated[idx],
        hasOvertime: nextVal,
        totalOtHours: nextVal ? currentOt : 0,
        otConvertedDays: nextVal ? Math.round((currentOt / 8) * 100) / 100 : 0,
      };
    } else {
      updated.push({
        id: `ts-${Date.now()}-${empId}`,
        employeeId: empId,
        month: currentMonth,
        standardWorkingDays: 26,
        actualWorkingDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        otHoursNormal: 0,
        otHoursWeekend: 0,
        lateArrivalMinutes: 0,
        hasOvertime: true,
        totalOtHours: 0,
        otConvertedDays: 0,
      });
    }
    setDraftTimesheets(updated);
    setHasChanges(true);
  };

  const handleOtHoursChange = (empId: string, hours: number) => {
    if (!checkEditPermission()) return;
    const updated = [...draftTimesheets];
    const idx = updated.findIndex((t) => t.employeeId === empId && t.month === currentMonth);
    const converted = Math.round((hours / 8) * 100) / 100;
    if (idx !== -1) {
      updated[idx] = {
        ...updated[idx],
        hasOvertime: true,
        otHoursNormal: hours,
        totalOtHours: hours,
        otConvertedDays: converted,
      };
    } else {
      updated.push({
        id: `ts-${Date.now()}-${empId}`,
        employeeId: empId,
        month: currentMonth,
        standardWorkingDays: 26,
        actualWorkingDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        otHoursNormal: hours,
        otHoursWeekend: 0,
        lateArrivalMinutes: 0,
        hasOvertime: true,
        totalOtHours: hours,
        otConvertedDays: converted,
      });
    }
    setDraftTimesheets(updated);
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    if (!checkEditPermission()) return;
    draftTimesheets.forEach((ts) => updateTimesheet(ts));
    setHasChanges(false);
    showToast('Đã lưu toàn bộ dữ liệu chấm công tháng!', 'success');
  };

  // Callback when saving from DailyTimesheetModal
  const handleSaveDailySheet = (updatedRecord: TimesheetRecord) => {
    if (isReadOnly) {
      showToast('Kỳ chấm công đang bị khóa hoặc ở chế độ chỉ xem, không thể lưu!', 'error');
      return;
    }
    setDraftTimesheets((prev) => {
      const idx = prev.findIndex(
        (t) => t.employeeId === updatedRecord.employeeId && t.month === updatedRecord.month
      );
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updatedRecord;
        return next;
      }
      return [...prev, updatedRecord];
    });

    updateTimesheet(updatedRecord);
    setHasChanges(false);
    showToast(
      `Đã cập nhật chi tiết ngày (${updatedRecord.actualWorkingDays} công) cho ${selectedEmployeeForDaily?.fullName}!`,
      'success'
    );
  };

  // Toggle fuel allowance for employee in month
  const handleToggleFuelAllowance = (empId: string) => {
    if (!checkEditPermission()) return;
    const updated = [...draftTimesheets];
    const idx = updated.findIndex((t) => t.employeeId === empId && t.month === currentMonth);
    if (idx !== -1) {
      const currentVal = updated[idx].hasFuelAllowance !== false;
      const nextVal = !currentVal;
      updated[idx] = {
        ...updated[idx],
        hasFuelAllowance: nextVal,
      };
    } else {
      updated.push({
        id: `ts-${Date.now()}-${empId}`,
        employeeId: empId,
        month: currentMonth,
        standardWorkingDays: 26,
        actualWorkingDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        otHoursNormal: 0,
        otHoursWeekend: 0,
        lateArrivalMinutes: 0,
        hasFuelAllowance: false,
      });
    }
    setDraftTimesheets(updated);
    setHasChanges(true);
  };

  const getEmployeeFuelSummary = (emp: Employee, ts: TimesheetRecord) => {
    const isFuelOn = ts.hasFuelAllowance !== false;
    if (!isFuelOn) {
      return {
        isFuelOn: false,
        daysMotorcycle: 0,
        daysCar: 0,
        totalKm: 0,
        totalAmount: 0,
      };
    }

    if (ts.totalFuelAllowanceAmount !== undefined) {
      return {
        isFuelOn: true,
        daysMotorcycle: ts.totalFuelDays || 0,
        daysCar: Math.max(0, Math.floor(ts.actualWorkingDays) - (ts.totalFuelDays || 0)),
        totalKm: ts.totalFuelDistanceKm || 0,
        totalAmount: ts.totalFuelAllowanceAmount,
      };
    }

    // Dynamic resolution based on daily symbols and vehicles
    const gasPrice = settings?.gasolinePricePerKm || 1800;
    const defaultProj = projects.find((p) => emp.projectAllowances?.[p.id]?.assigned) || projects[0];
    const isProvidedCar = emp.projectAllowances?.[defaultProj?.id]?.hasCompanyVehicle ?? false;
    const dist = emp.projectAllowances?.[defaultProj?.id]?.customDistanceKm ?? defaultProj?.distanceKm ?? 15;

    let daysMotorcycle = 0;
    let daysCar = 0;
    let totalKm = 0;
    let totalAmount = 0;

    if (ts.dailySymbols && Object.keys(ts.dailySymbols).length > 0) {
      for (let d = 1; d <= daysInMonth; d++) {
        const sym = (ts.dailySymbols[d] || '').trim().toUpperCase();
        if (sym && sym !== 'CN' && sym !== 'KL' && sym !== 'P' && sym !== 'NL' && sym !== '-') {
          const veh = ts.dailyVehicle?.[d] || (isProvidedCar ? 'car' : 'motorcycle');
          if (veh === 'motorcycle') {
            daysMotorcycle += 1;
            totalKm += dist;
            totalAmount += Math.round(dist * gasPrice);
          } else {
            daysCar += 1;
          }
        }
      }
    } else {
      if (isProvidedCar) {
        daysCar = ts.actualWorkingDays;
      } else {
        daysMotorcycle = ts.actualWorkingDays;
        totalKm = daysMotorcycle * dist;
        totalAmount = Math.round(totalKm * gasPrice);
      }
    }

    return {
      isFuelOn: true,
      daysMotorcycle,
      daysCar,
      totalKm,
      totalAmount,
    };
  };

  // Export Excel (.xlsx) matching uploaded image structure (1-31 days, Sunday orange, projects, leave)
  const handleExportDetailedImageTemplate = () => {
    try {
      const res = exportDetailedAttendanceExcel({
        month: currentMonth,
        companyName: excelExportSettings.companyName || 'CÔNG TY CỔ PHẦN XÂY DỰNG & ĐẦU TƯ',
        employees: filteredEmployees,
        departments,
        projects,
        timesheets: draftTimesheets,
      });
      showToast(
        `Đã xuất file "${res.fileName}" chuẩn mẫu bảng chấm công theo hình ảnh (${res.colCount} cột, ${res.rowCount} nhân sự)!`,
        'success'
      );
    } catch (err: any) {
      console.error('Lỗi xuất bảng chấm công chuẩn mẫu:', err);
      showToast('Lỗi khi xuất file Excel chuẩn mẫu: ' + (err?.message || ''), 'error');
    }
  };

  // Export Excel (.xlsx) of Timesheet (Supports both Summary and Detailed Matrix)
  const handleExportExcel = () => {
    if (viewMode === 'detailed_matrix') {
      handleExportDetailedImageTemplate();
      return;
    }

    // Summary table export to Excel using dynamic user configuration
    try {
      const records = filteredEmployees.map((emp, index) => {
        const ts = getEmployeeTimesheet(emp.id);
        const dept = departments.find((d) => d.id === emp.departmentId)?.name || '';
        const fuel = getEmployeeFuelSummary(emp, ts);
        const totalPaidDays = ts.actualWorkingDays + (ts.paidLeaveDays || 0);

        // Project stats for this employee
        const projectStats: Record<string, any> = {};
        const projSummaryList: string[] = [];

        projects.forEach((proj) => {
          let days = 0;
          if (ts.dailySymbols) {
            Object.values(ts.dailySymbols).forEach((sym) => {
              if (!sym) return;
              const s = sym.trim().toUpperCase();
              if (s === proj.symbolFull.toUpperCase() || s === proj.code.toUpperCase() || s === proj.id.toUpperCase()) {
                days += 1;
              } else if (s === proj.symbolHalf.toUpperCase() || s === `${proj.code}/2`.toUpperCase()) {
                days += 0.5;
              }
            });
          } else if (emp.projectAllowances?.[proj.id]?.assigned) {
            days = Math.max(1, Math.min(ts.actualWorkingDays || 22, 22));
          }

          projectStats[`proj_days_${proj.id}`] = days;
          projectStats[`project_days_${proj.id}`] = days;

          if (days > 0) {
            projSummaryList.push(`${proj.name || proj.code}: ${days} ngày`);
          }
        });

        const allAssignedProjects =
          projSummaryList.length > 0 ? projSummaryList.join('; ') : 'Chưa phân bổ';

        return {
          stt: index + 1,
          code: emp.code,
          fullName: emp.fullName,
          departmentName: dept,
          position: emp.position,
          positionRank: emp.positionRank || 'C',
          standardDays: ts.standardWorkingDays,
          daysInMonth: daysInMonth,
          periodRange: `01/${String(monthNum).padStart(2, '0')}/${year} - ${String(daysInMonth).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}/${year}`,
          periodDaysLabel: `01 - ${daysInMonth} ngày`,
          actualDays: ts.actualWorkingDays,
          paidLeaveDays: ts.paidLeaveDays || 0,
          unpaidLeaveDays: ts.unpaidLeaveDays || 0,
          totalPaidDays,
          totalOtHours: ts.totalOtHours || ts.otHoursNormal || 0,
          otConvertedDays: ts.otConvertedDays || Math.round(((ts.totalOtHours || ts.otHoursNormal || 0) / 8) * 100) / 100,
          fuelToggleStatus: ts.hasFuelAllowance !== false ? 'Bật (Tính xăng)' : 'Tắt (Cấp xe / Không xăng)',
          motorcycleDays: fuel.daysMotorcycle,
          carDays: fuel.daysCar,
          totalDistanceKm: fuel.totalKm,
          fuelAllowanceAmt: fuel.totalAmount,
          all_assigned_projects: allAssignedProjects,
          identityCard: emp.identityCard || '',
          phone: emp.phone || '',
          email: emp.email || '',
          bankAccount: emp.bankAccount || '',
          bankName: emp.bankName || '',
          hometown: emp.hometown || '',
          currentAddress: emp.currentAddress || '',
          joinDate: emp.joinDate || '',
          dependentsCount: emp.dependentsCount || 0,
          ...projectStats,
        };
      });

      const config = excelExportSettings.tables.attendance;
      const res = exportDynamicExcel(
        config,
        excelExportSettings,
        records,
        {
          month: currentMonth,
          companyName: excelExportSettings.companyName,
          companyShortName: excelExportSettings.companyShortName,
        }
      );

      showToast(`Đã xuất file "${res.fileName}" thành công theo cài đặt (${res.colCount} cột, ${res.rowCount} dòng)!`, 'success');
    } catch (err: any) {
      console.error('Lỗi xuất Excel chấm công:', err);
      showToast('Có lỗi xảy ra khi xuất file Excel: ' + (err?.message || ''), 'error');
    }
  };

  // Export PDF (.pdf) of Timesheet
  const handleExportPDF = () => {
    const headers = [
      'STT',
      'Ma NV',
      'Ho va ten',
      'Phong ban',
      'Chuc vu',
      'Cong chuan',
      'Cong thuc te',
      'Tang ca (h)',
      'Quy doi (d)',
      'Phu cap xang',
      'Xe may (d)',
      'O to (d)',
      'Tien xang (VND)',
    ];

    const rows = filteredEmployees.map((emp, index) => {
      const ts = getEmployeeTimesheet(emp.id);
      const dept = departments.find((d) => d.id === emp.departmentId)?.name || '';
      const fuel = getEmployeeFuelSummary(emp, ts);

      return [
        index + 1,
        emp.code,
        emp.fullName,
        dept,
        emp.position,
        ts.standardWorkingDays,
        ts.actualWorkingDays,
        ts.totalOtHours || ts.otHoursNormal || 0,
        ts.otConvertedDays || Math.round(((ts.totalOtHours || ts.otHoursNormal || 0) / 8) * 100) / 100,
        ts.hasFuelAllowance !== false ? 'Bat' : 'Tat',
        fuel.daysMotorcycle,
        fuel.daysCar,
        fuel.totalAmount.toLocaleString('vi-VN'),
      ];
    });

    exportToPDF({
      fileName: `Bang_Cham_Cong_${currentMonth}.pdf`,
      title: `BANG TONG HOP CHAM CONG VA PHU CAP XANG - THANG ${currentMonth}`,
      subtitles: [
        `Ky cham cong: ${currentMonth} | So nhan su: ${filteredEmployees.length}`,
        `Quy dinh phuong tien: Xe may tinh xang | O to cong ty cap xe khong tinh xang`,
      ],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất file PDF bảng chấm công thành công!', 'success');
  };

  // Export CSV of Timesheet (Fallback)
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Phòng ban',
      'Chức vụ',
      'Kỳ chấm công',
      'Công chuẩn',
      'Công thực tế',
      'Nghỉ phép',
      'Nghỉ không lương',
      'OT ngày thường (h)',
      'OT cuối tuần (h)',
      'Phụ cấp xăng',
      'Số ngày xe máy',
      'Số ngày ô tô',
      'Tiền phụ cấp xăng (VNĐ)',
      'Đi trễ (phút)',
    ];

    const rows = filteredEmployees.map((emp, index) => {
      const ts = getEmployeeTimesheet(emp.id);
      const dept = departments.find((d) => d.id === emp.departmentId)?.name || '';
      const fuel = getEmployeeFuelSummary(emp, ts);

      return [
        index + 1,
        `"${emp.code}"`,
        `"${emp.fullName}"`,
        `"${dept}"`,
        `"${emp.position}"`,
        `"${currentMonth}"`,
        ts.standardWorkingDays,
        ts.actualWorkingDays,
        ts.paidLeaveDays,
        ts.unpaidLeaveDays,
        ts.otHoursNormal,
        ts.otHoursWeekend,
        ts.hasFuelAllowance !== false ? 'Bật' : 'Tắt',
        fuel.daysMotorcycle,
        fuel.daysCar,
        fuel.totalAmount,
        ts.lateArrivalMinutes,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Cham_Cong_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV bảng chấm công thành công!', 'success');
  };

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-4">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Kỳ chấm công:
            </label>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-blue-500"
            >
              {Array.from(new Set([currentMonth, '2026-11', '2026-10', '2026-09', '2026-08', '2026-02']))
                .sort()
                .reverse()
                .map((m) => {
                  const isLocked = Boolean(lockedMonths[m]?.isLocked);
                  const [y, mn] = m.split('-');
                  return (
                    <option key={m} value={m}>
                      Tháng {mn} / {y} {isLocked ? '🔒 (Đã khóa)' : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Trường số ngày trong tháng thể hiện từ ngày 1 đến ngày cuối tháng */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50/50 border border-sky-300 rounded-lg px-3 py-1 text-xs shadow-2xs">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-700" />
                Số ngày trong tháng:
              </span>
              <span className="font-mono font-bold text-sky-950 bg-white px-2 py-0.5 rounded border border-sky-300 shadow-2xs">
                {daysInMonth} ngày
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-1 font-mono text-[11px] text-sky-900">
              <span className="bg-white/90 px-1.5 py-0.5 rounded border border-sky-200 font-semibold text-blue-900" title="Ngày bắt đầu chu kỳ chấm công">
                01/{String(monthNum).padStart(2, '0')}/{year}
              </span>
              <span className="text-slate-400">➔</span>
              <span className="bg-white/90 px-1.5 py-0.5 rounded border border-sky-200 font-semibold text-blue-900" title="Ngày cuối cùng của tháng">
                {String(daysInMonth).padStart(2, '0')}/{String(monthNum).padStart(2, '0')}/{year}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'detailed_matrix' ? 'summary' : 'detailed_matrix')}
              className="ml-1 text-[10px] font-bold text-blue-700 hover:text-white hover:bg-blue-600 bg-white border border-blue-300 px-2 py-0.5 rounded transition-all cursor-pointer shadow-2xs"
              title="Xem ma trận toàn bộ dữ liệu chấm công chi tiết từ ngày 1 đến ngày cuối tháng"
            >
              {viewMode === 'detailed_matrix' ? 'Xem Tổng Hợp' : `Chi tiết 1 - ${daysInMonth}`}
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bảng tổng hợp công
            </button>
            <button
              onClick={() => setViewMode('detailed_matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'detailed_matrix'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-700" />
              <span>Ma trận chi tiết 1 - {daysInMonth} ngày</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-blue-500 w-44"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-blue-500"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-2 self-start xl:self-auto flex-wrap gap-y-2">
          {/* Lock / Unlock Status Button */}
          {isMonthLocked ? (
            <button
              type="button"
              onClick={() => setIsUnlockModalOpen(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isUnlockedForSession
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
              }`}
              title={
                isUnlockedForSession
                  ? 'Kỳ đã khóa nhưng đang được mở tạm thời trong phiên này. Nhấp để quản lý khóa'
                  : 'Kỳ này đã bị khóa bằng mật khẩu. Nhấp để mở khóa chỉnh sửa'
              }
            >
              {isUnlockedForSession ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-800" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>{isUnlockedForSession ? 'Mở tạm thời' : 'Đã khóa kỳ'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLockModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Đặt mật khẩu khóa kỳ chấm công hiện tại để bảo vệ số liệu"
            >
              <Key className="w-3.5 h-3.5 text-slate-600" />
              <span>Khóa kỳ</span>
            </button>
          )}

          {/* Grant permission button - Admin App exclusive */}
          <button
            type="button"
            onClick={() => setIsPermissionModalOpen(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              isAppAdmin
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
            title="Chỉ Quản trị viên App (lethanhhuy1989@gmail.com) mới có quyền cấp quyền chỉnh sửa cho tất cả kể cả Ban Giám Đốc"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {isAppAdmin
                ? '👑 Quản lý cấp quyền (Admin App)'
                : `Quyền sửa: ${hasRoleEditPermission ? 'Đã cấp' : 'Chỉ xem'}`}
            </span>
          </button>

          {/* Advance to next month button */}
          <button
            type="button"
            onClick={() => setIsNextMonthModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Chốt kỳ chấm công hiện tại, đặt mật khẩu khóa và tự động tính cho tháng tiếp theo"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Chốt kỳ & Tính tháng mới</span>
          </button>

          {/* Export Excel Chuẩn Mẫu Theo Ảnh */}
          <button
            type="button"
            onClick={handleExportDetailedImageTemplate}
            className="px-3 py-1.5 text-xs font-bold rounded bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer border border-emerald-400 hover:scale-[1.02]"
            title="Xuất bảng chấm công chuẩn mẫu theo hình ảnh (1-31 ngày, cột CN cam, phân bổ công trình, nghỉ phép, tăng ca)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Xuất Mẫu Bảng Chấm Công (Theo Ảnh)</span>
          </button>

          {/* Export buttons */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs font-semibold rounded-l bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Xuất bảng chấm công ra file Excel (.xlsx) theo cấu hình mẫu đã cài đặt"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('settings')}
              className="px-2 py-1.5 text-xs font-medium text-emerald-100 bg-emerald-800 hover:bg-emerald-900 rounded-r border-l border-emerald-600 transition-colors cursor-pointer"
              title="Cài đặt mẫu xuất Excel chấm công (Đổi tên file, ẩn/hiện cột, định dạng)"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-700 hover:bg-rose-800 text-white shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Xuất bảng chấm công ra file PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Xuất PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center space-x-1 transition-colors cursor-pointer"
            title="Xuất CSV"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!hasChanges || isReadOnly}
            className={`px-4 py-1.5 text-xs font-semibold rounded shadow-xs flex items-center space-x-1.5 transition-all ${
              hasChanges && !isReadOnly
                ? 'bg-[#1E3A8A] hover:bg-blue-800 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title={isReadOnly ? 'Kỳ chấm công đang bị khóa hoặc ở chế độ chỉ xem' : 'Lưu dữ liệu'}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Period Lock Status Banner */}
      {isMonthLocked && !isUnlockedForSession && (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50/60 to-amber-50 border border-amber-300 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-950 text-sm">
                  Kỳ chấm công {currentMonth} ĐÃ KHÓA (Bảo vệ bằng mật khẩu)
                </span>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-700" />
                  CHẾ ĐỘ CHỈ XEM
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-0.5">
                Toàn bộ số liệu công, tăng ca và phụ cấp đã được chốt và khóa cố định. Để chỉnh sửa số liệu, vui lòng nhập mật khẩu mở khóa hoặc cấp quyền chỉnh sửa.
                {lockInfo?.lockedAt && (
                  <span className="text-slate-500 ml-1.5 font-medium">
                    (Khóa lúc: {new Date(lockInfo.lockedAt).toLocaleString('vi-VN')} · Bởi: {lockInfo.lockedBy || 'Quản trị viên'})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsUnlockModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở khóa chỉnh sửa</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPermissionModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cấp quyền xem / sửa</span>
            </button>
          </div>
        </div>
      )}

      {isMonthLocked && isUnlockedForSession && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
              <Unlock className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-950 text-xs sm:text-sm">
                  Kỳ chấm công {currentMonth} đang MỞ KHÓA TẠM THỜI (Phiên hiện tại)
                </span>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">
                  TOÀN QUYỀN CHỈNH SỬA
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Bạn đã xác thực mật khẩu thành công. Các sửa đổi sẽ được lưu trữ vào hệ thống. Kỳ sẽ tự động khóa lại khi đóng trình duyệt hoặc nhấp 'Khóa lại ngay'.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSessionUnlockedMonths((prev) => ({ ...prev, [currentMonth]: false }));
                showToast(`Đã khóa lại kỳ chấm công ${currentMonth}`);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-700 hover:bg-slate-800 text-white shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Khóa lại ngay</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPermissionModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Phân quyền
            </button>
          </div>
        </div>
      )}

      {/* Guide Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 flex items-start space-x-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong>Chấm công chi tiết theo công trình:</strong> Nhấp trực tiếp vào ô <strong>"Công thực tế"</strong> của bất kỳ nhân viên nào để mở bảng chấm công chi tiết 1 - {daysInMonth} ngày. Các ngày sẽ được đánh dấu bằng các ký hiệu công trình (ví dụ: <span className="font-mono font-bold text-blue-900 bg-white px-1 py-0.5 rounded border border-blue-200">BC</span> cả ngày, <span className="font-mono font-bold text-orange-900 bg-white px-1 py-0.5 rounded border border-orange-200">BC/2</span> nghỉ 1 buổi, <span className="font-mono font-bold text-emerald-900 bg-white px-1 py-0.5 rounded border border-emerald-200">BC/P</span> có phép...) và tự động cộng dồn công chuẩn xác.
        </div>
      </div>

      {/* VIEW MODE 1: SUMMARY TABLE (Standard view with 1-click drill-down) */}
      {viewMode === 'summary' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-[#2E6B9E] text-white font-semibold text-center select-none border-b border-[#255780]">
                  <th className="py-3 px-3 text-center w-12 font-bold text-white border-r border-[#3b7cb0]">
                    #
                  </th>
                  <th className="py-3 px-4 text-left w-56 font-bold text-white border-r border-[#3b7cb0]">
                    Nhân viên
                  </th>
                  <th className="py-3 px-3 text-center w-36 font-bold text-sky-200 border-r border-[#3b7cb0] bg-sky-900/50" title={`Số ngày trong tháng từ ngày 1 đến ngày cuối tháng (01 - ${daysInMonth}) để lấy dữ liệu chấm công chi tiết`}>
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-300" />
                        Số ngày trong tháng
                      </span>
                      <span className="text-[10px] font-normal text-sky-300 font-mono">01 → {daysInMonth}/{monthNum} ({daysInMonth} ngày)</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center w-24 font-bold text-white border-r border-[#3b7cb0]">
                    Công chuẩn
                  </th>
                  <th className="py-3 px-3 text-center w-36 font-bold text-white border-r border-[#3b7cb0] bg-blue-700/60">
                    Công thực tế (1 - {daysInMonth} ngày)
                  </th>
                  <th className="py-3 px-3 text-center w-28 font-bold text-white border-r border-[#3b7cb0]">
                    Nghỉ phép
                  </th>
                  <th className="py-3 px-3 text-center w-28 font-bold text-white border-r border-[#3b7cb0]">
                    Nghỉ không lương
                  </th>
                  <th className="py-3 px-2 text-center w-24 font-bold text-amber-200 border-r border-[#3b7cb0] bg-amber-900/60" title="Tích vào để bật chấm tăng ca cho từng nhân sự">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Bật tăng ca</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center w-32 font-bold text-amber-200 border-r border-[#3b7cb0] bg-amber-900/50" title="Chấm giờ tăng ca từng ngày">
                    Giờ tăng ca (h)
                  </th>
                  <th className="py-3 px-3 text-center w-28 font-bold text-amber-200 border-r border-[#3b7cb0] bg-amber-900/40" title="Quy đổi ra ngày công = Tổng giờ / 8 tiếng">
                    Quy đổi ngày (÷ 8h)
                  </th>
                  <th className="py-3 px-2 text-center w-24 font-bold text-emerald-200 border-r border-[#3b7cb0] bg-emerald-900/60" title="Tích chọn bật/tắt phụ cấp xăng cho nhân sự này">
                    <div className="flex items-center justify-center space-x-1">
                      <Fuel className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Bật xăng</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center w-40 font-bold text-emerald-200 border-r border-[#3b7cb0] bg-emerald-900/50" title={`Chi tiết ${daysInMonth} ngày: Xe máy (tính xăng) vs Ô tô (không tính xăng)`}>
                    Phụ cấp xăng ({daysInMonth} ngày)
                  </th>
                  <th className="py-3 px-3 text-center w-28 font-bold text-white border-r border-[#3b7cb0]">
                    OT cuối tuần (h)
                  </th>
                  <th className="py-3 px-3 text-center w-28 font-bold text-white">
                    Đi trễ (phút)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredEmployees.map((emp, idx) => {
                  const ts = getEmployeeTimesheet(emp.id);
                  const dept = departments.find((d) => d.id === emp.departmentId);

                  return (
                    <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors font-sans">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono border-r border-slate-100">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-4 font-semibold text-slate-900 border-r border-slate-100">
                        <div className="flex items-center space-x-2">
                          <div>
                            <span className="text-slate-900 hover:text-blue-700 transition-colors">
                              {emp.fullName}
                            </span>
                            <div className="text-[10px] font-mono text-slate-500 font-normal">
                              {emp.code} · {dept?.name || emp.position}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SỐ NGÀY TRONG THÁNG (1 -> NGÀY CUỐI THÁNG) */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 bg-sky-50/20">
                        <div
                          onClick={() => setSelectedEmployeeForDaily(emp)}
                          className="inline-flex flex-col items-center justify-center bg-white hover:bg-sky-50 border border-sky-300 px-2 py-1 rounded cursor-pointer transition-all shadow-2xs group w-full max-w-[120px] mx-auto"
                          title={`Xem và lấy dữ liệu chấm công chi tiết từ ngày 01 đến ngày ${daysInMonth} cho ${emp.fullName}`}
                        >
                          <div className="flex items-center gap-1 font-mono font-bold text-sky-950 text-xs group-hover:text-blue-700">
                            <Calendar className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>{daysInMonth} ngày</span>
                          </div>
                          <span className="text-[9px] text-sky-700 font-mono mt-0.5 font-medium">
                            01 → {daysInMonth}/{monthNum}
                          </span>
                          <span className="text-[8px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors font-semibold">
                            Lấy chi tiết ➔
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600 bg-slate-50/50 border-r border-slate-100">
                        {ts.standardWorkingDays}
                      </td>

                      {/* ACTUAL WORKING DAYS CELL: Clickable to open 1-30/31 days daily timesheet */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 bg-blue-50/20">
                        <div className="flex items-center justify-center space-x-1.5">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="31"
                            value={ts.actualWorkingDays}
                            disabled={isReadOnly}
                            onClick={() => setSelectedEmployeeForDaily(emp)}
                            onFocus={() => setSelectedEmployeeForDaily(emp)}
                            onChange={(e) =>
                              handleFieldChange(emp.id, 'actualWorkingDays', parseFloat(e.target.value) || 0)
                            }
                            className={`w-16 px-2 py-1 text-center font-mono font-bold text-blue-900 border border-blue-300 rounded text-xs transition-all shadow-2xs ${
                              isReadOnly
                                ? 'bg-slate-100/80 text-slate-600 cursor-default'
                                : 'bg-blue-100/70 hover:bg-blue-200/70 cursor-pointer hover:scale-105'
                            }`}
                            title={
                              isReadOnly
                                ? 'Kỳ đã khóa - Nhấp để xem chi tiết'
                                : 'Tích vào ô này để mở bảng chấm công chi tiết 1-31 ngày theo ký hiệu công trình'
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeForDaily(emp)}
                            className="p-1 text-blue-600 hover:text-white hover:bg-blue-700 bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer"
                            title={isReadOnly ? 'Xem bảng chấm công chi tiết theo ngày' : 'Mở bảng chấm công chi tiết theo ngày'}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[9px] text-blue-600/80 block mt-0.5">
                          {isReadOnly ? 'Nhấp để xem chi tiết' : 'Nhấp để chấm chi tiết'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={ts.paidLeaveDays}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleFieldChange(emp.id, 'paidLeaveDays', parseFloat(e.target.value) || 0)
                          }
                          className={`w-16 px-2 py-1 text-center font-mono text-slate-800 border border-slate-300 rounded text-xs mx-auto focus:outline-blue-500 ${
                            isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                          }`}
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={ts.unpaidLeaveDays}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleFieldChange(emp.id, 'unpaidLeaveDays', parseFloat(e.target.value) || 0)
                          }
                          className={`w-16 px-2 py-1 text-center font-mono text-slate-800 border border-slate-300 rounded text-xs mx-auto focus:outline-blue-500 ${
                            isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                          }`}
                        />
                      </td>

                      {/* 1. Tích chọn tăng ca cho từng nhân sự */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 bg-amber-50/20">
                        <input
                          type="checkbox"
                          checked={!!ts.hasOvertime}
                          disabled={isReadOnly}
                          onChange={() => handleToggleOvertime(emp.id)}
                          className={`w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 mx-auto ${
                            isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={`Tích chọn bật/tắt tăng ca cho nhân sự ${emp.fullName}`}
                        />
                      </td>

                      {/* 2. Giờ tăng ca (h) */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 bg-amber-50/20">
                        {ts.hasOvertime ? (
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="150"
                              value={ts.totalOtHours !== undefined ? ts.totalOtHours : ts.otHoursNormal}
                              disabled={isReadOnly}
                              onChange={(e) =>
                                handleOtHoursChange(emp.id, parseFloat(e.target.value) || 0)
                              }
                              className={`w-14 px-1.5 py-1 text-center font-mono font-bold text-amber-950 border border-amber-300 rounded text-xs focus:outline-amber-500 ${
                                isReadOnly
                                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                                  : 'bg-amber-100/80 hover:bg-white'
                              }`}
                              title="Nhập tổng giờ hoặc nhấp nút đồng hồ để chấm chi tiết từng ngày"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedEmployeeForDaily(emp)}
                              className="p-1 text-amber-700 hover:text-white hover:bg-amber-700 bg-amber-100/90 rounded border border-amber-300 transition-colors cursor-pointer"
                              title="Mở lịch chấm giờ tăng ca chi tiết 1-31 ngày"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Không TC</span>
                        )}
                      </td>

                      {/* 3. Quy đổi ra ngày công = Tổng giờ / 8 tiếng */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 bg-amber-50/30">
                        {ts.hasOvertime ? (
                          <div className="inline-flex flex-col items-center justify-center bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded shadow-2xs">
                            <span className="font-mono font-bold text-amber-950 text-xs">
                              {ts.otConvertedDays !== undefined
                                ? ts.otConvertedDays
                                : Math.round(((ts.totalOtHours || ts.otHoursNormal || 0) / 8) * 100) / 100}{' '}
                              ngày
                            </span>
                            <span className="text-[9px] text-amber-800 font-normal">
                              ({ts.totalOtHours || ts.otHoursNormal || 0}h ÷ 8)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-center block">—</span>
                        )}
                      </td>

                      {/* Bật/Tắt Phụ cấp xăng */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-100 bg-emerald-50/20">
                        <input
                          type="checkbox"
                          checked={ts.hasFuelAllowance !== false}
                          disabled={isReadOnly}
                          onChange={() => handleToggleFuelAllowance(emp.id)}
                          className={`w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mx-auto ${
                            isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={`Tích chọn bật/tắt phụ cấp xăng cho nhân sự ${emp.fullName}`}
                        />
                      </td>

                      {/* Chi tiết Phụ cấp xăng (Xe máy vs Ô tô) */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 bg-emerald-50/20">
                        {(() => {
                          const fuel = getEmployeeFuelSummary(emp, ts);
                          if (ts.hasFuelAllowance === false) {
                            return <span className="text-[11px] text-slate-400 italic">Đang tắt</span>;
                          }
                          return (
                            <div
                              onClick={() => setSelectedEmployeeForDaily(emp)}
                              className="inline-flex flex-col items-center justify-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-all shadow-2xs group"
                              title="Nhấp để xem/đổi chế độ Xe máy 🏍️ vs Ô tô 🚗 cho từng ngày trong 31 ngày"
                            >
                              <span className="font-mono font-bold text-emerald-950 text-xs">
                                {fuel.totalAmount.toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-[9px] text-emerald-800 flex items-center gap-1 mt-0.5">
                                <span className="flex items-center gap-0.5 font-bold">
                                  <MotorcycleIcon className="w-2.5 h-2.5 text-emerald-700" />
                                  {fuel.daysMotorcycle}d
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <CarIcon className="w-2.5 h-2.5 text-slate-600" />
                                  {fuel.daysCar}d
                                </span>
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={ts.otHoursWeekend}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleFieldChange(emp.id, 'otHoursWeekend', parseFloat(e.target.value) || 0)
                          }
                          className={`w-16 px-2 py-1 text-center font-mono text-slate-800 border border-slate-300 rounded text-xs mx-auto focus:outline-blue-500 ${
                            isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                          }`}
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          step="5"
                          min="0"
                          max="500"
                          value={ts.lateArrivalMinutes}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleFieldChange(emp.id, 'lateArrivalMinutes', parseInt(e.target.value) || 0)
                          }
                          className={`w-16 px-2 py-1 text-center font-mono text-slate-800 border border-slate-300 rounded text-xs mx-auto focus:outline-blue-500 ${
                            isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DETAILED FULL-COMPANY MATRIX (MATCHING REFERENCE IMAGE) */}
      {viewMode === 'detailed_matrix' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-slate-100 via-sky-50/60 to-slate-100 border-b border-slate-300 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <HardHat className="w-4 h-4 text-blue-700" />
                BẢNG CHẤM CÔNG VÀ PHÂN BỔ DỰ ÁN THÁNG {monthNum}/{year}
              </span>
              <span className="font-mono font-bold text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
                Chu kỳ {daysInMonth} ngày (01/{String(monthNum).padStart(2, '0')} ➔ {String(daysInMonth).padStart(2, '0')}/{String(monthNum).padStart(2, '0')})
              </span>
              <span className="text-slate-500 font-medium">({filteredEmployees.length} nhân sự)</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2.5 text-slate-600 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-xs bg-amber-400 border border-amber-500 inline-block" />
                  <span className="font-semibold text-amber-900">Chủ nhật (CN)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-xs bg-yellow-100 border border-yellow-300 inline-block" />
                  <span>NV Công trình / Dự án</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-xs bg-white border border-slate-300 inline-block" />
                  <span>NV Văn phòng</span>
                </span>
              </div>

              {/* Instant Download Button directly on Matrix Card */}
              <button
                type="button"
                onClick={handleExportDetailedImageTemplate}
                className="px-3 py-1.5 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-600 hover:scale-[1.02]"
                title="Tải ngay file Excel ma trận chi tiết định dạng chuẩn như ảnh mẫu"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Tải Excel Chuẩn Mẫu (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[750px]">
            <table className="w-full text-[11px] text-center border-collapse min-w-[1700px]">
              <thead className="sticky top-0 z-20 shadow-xs">
                {/* Header Row 1: Section Groups */}
                <tr className="bg-[#1E3A8A] text-white font-bold select-none border-b border-blue-900">
                  <th rowSpan={3} className="py-2 px-2 text-center w-8 border-r border-blue-800 bg-[#1E3A8A]">
                    STT
                  </th>
                  <th rowSpan={3} className="py-2 px-2 text-center w-16 border-r border-blue-800 bg-[#1E3A8A]">
                    Mã NV
                  </th>
                  <th rowSpan={3} className="py-2 px-3 text-left w-44 border-r border-blue-800 bg-[#1E3A8A]">
                    Họ và tên
                  </th>
                  <th rowSpan={3} className="py-2 px-2 text-left w-32 border-r border-blue-800 bg-[#1E3A8A]">
                    Chức vụ
                  </th>
                  <th rowSpan={3} className="py-2 px-2 text-center w-24 border-r border-blue-800 bg-[#1E3A8A]">
                    Ngày vào làm
                  </th>

                  {/* Group: Ngày trong tháng */}
                  <th
                    colSpan={daysInMonth}
                    className="py-1.5 px-2 text-center border-r border-blue-800 bg-[#1E40AF] text-sky-100 font-extrabold uppercase tracking-wide"
                  >
                    Ngày trong tháng (Từ ngày 01 đến ngày {daysInMonth})
                  </th>

                  {/* Group: Tổng ngày công */}
                  <th
                    colSpan={2}
                    className="py-1.5 px-2 text-center border-r border-blue-800 bg-[#1E3A8A] text-white font-bold"
                  >
                    Tổng công
                  </th>

                  {/* Group: Ngày công theo dự án */}
                  <th
                    colSpan={projects.length}
                    className="py-1.5 px-2 text-center border-r border-blue-800 bg-[#1D4ED8] text-amber-200 font-extrabold uppercase tracking-wide"
                  >
                    Ngày công theo dự án / công trình
                  </th>

                  {/* Group: Nghỉ phép */}
                  <th
                    colSpan={4}
                    className="py-1.5 px-2 text-center border-r border-blue-800 bg-[#1E3A8A] text-white font-bold"
                  >
                    Nghỉ phép
                  </th>

                  {/* Group: Tăng ca */}
                  <th
                    colSpan={2}
                    className="py-1.5 px-2 text-center border-r border-blue-800 bg-[#1E3A8A] text-white font-bold"
                  >
                    Tăng ca
                  </th>

                  <th rowSpan={3} className="py-2 px-2 text-center w-24 bg-[#1E3A8A]">
                    Ghi chú
                  </th>
                </tr>

                {/* Header Row 2: Day Numbers & Subheadings */}
                <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                  {/* Days 01 - 31 Numbers */}
                  {daysInfo.map((info) => (
                    <th
                      key={`d-num-${info.day}`}
                      className={`py-1 px-1 font-mono text-center border-r border-slate-300 w-7 ${
                        info.isSunday ? 'bg-amber-500 text-white font-black' : 'text-slate-800'
                      }`}
                    >
                      {String(info.day).padStart(2, '0')}
                    </th>
                  ))}

                  {/* Tổng công */}
                  <th className="py-1 px-1.5 font-sans text-center border-r border-slate-300 w-16 bg-slate-100 text-slate-800">
                    Công chuẩn
                  </th>
                  <th className="py-1 px-1.5 font-sans text-center border-r border-slate-300 w-16 bg-blue-100 text-blue-900 font-extrabold">
                    Thực tế
                  </th>

                  {/* Projects */}
                  {projects.map((proj) => (
                    <th
                      key={`proj-hdr-${proj.id}`}
                      className="py-1 px-1.5 font-sans text-center border-r border-slate-300 w-24 bg-amber-100/90 text-amber-950 font-bold truncate max-w-[100px]"
                      title={proj.name}
                    >
                      {proj.name}
                    </th>
                  ))}

                  {/* Nghỉ phép */}
                  <th className="py-1 px-1 font-sans text-center border-r border-slate-300 w-12 bg-slate-100 text-slate-800">
                    Phép (P)
                  </th>
                  <th className="py-1 px-1 font-sans text-center border-r border-slate-300 w-12 bg-slate-100 text-slate-800">
                    Lễ (NL)
                  </th>
                  <th className="py-1 px-1 font-sans text-center border-r border-slate-300 w-12 bg-slate-100 text-slate-800">
                    K.Lương (KL)
                  </th>
                  <th className="py-1 px-1 font-sans text-center border-r border-slate-300 w-14 bg-orange-100 text-orange-950 font-bold">
                    Tổng nghỉ
                  </th>

                  {/* Tăng ca */}
                  <th className="py-1 px-1 font-sans text-center border-r border-slate-300 w-14 bg-slate-100 text-slate-800">
                    Giờ OT
                  </th>
                  <th className="py-1 px-1 font-sans text-center border-r border-slate-300 w-14 bg-slate-100 text-slate-800">
                    Quy đổi
                  </th>
                </tr>

                {/* Header Row 3: Weekdays (T2 - CN) & Column Codes */}
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[10px]">
                  {/* Days 01 - 31 Weekdays */}
                  {daysInfo.map((info) => (
                    <th
                      key={`d-lbl-${info.day}`}
                      className={`py-0.5 px-0.5 font-mono text-center border-r border-slate-300 ${
                        info.isSunday ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-600'
                      }`}
                    >
                      {info.dayLabel}
                    </th>
                  ))}

                  {/* Tổng công indices */}
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300 bg-slate-200">
                    (1)
                  </th>
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300 bg-blue-200 text-blue-950 font-bold">
                    (2)
                  </th>

                  {/* Project Symbols */}
                  {projects.map((proj) => (
                    <th
                      key={`proj-sym-${proj.id}`}
                      className="py-0.5 px-1 font-mono text-center border-r border-slate-300 bg-amber-200 text-amber-950 font-bold"
                    >
                      {proj.symbolFull || proj.code}
                    </th>
                  ))}

                  {/* Nghỉ phép indices */}
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300">P</th>
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300">NL</th>
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300">KL</th>
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300 bg-orange-200 text-orange-950 font-bold">Cộng</th>

                  {/* Tăng ca indices */}
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300">(h)</th>
                  <th className="py-0.5 px-1 font-mono text-center border-r border-slate-300">(÷8h)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredEmployees.map((emp, idx) => {
                  const ts = getEmployeeTimesheet(emp.id);
                  const dept = departments.find((d) => d.id === emp.departmentId)?.name || '';
                  const defaultProjSymbol =
                    emp.id === 'emp-01' ? 'BC' : emp.id === 'emp-02' ? 'PT' : emp.id === 'emp-03' ? 'HT2' : 'BC';

                  // Determine if site worker (construction crew gets warm yellow tint like image)
                  const isWorker =
                    dept.toLowerCase().includes('công trình') ||
                    dept.toLowerCase().includes('dự án') ||
                    dept.toLowerCase().includes('thi công') ||
                    emp.position.toLowerCase().includes('kỹ thuật') ||
                    emp.position.toLowerCase().includes('chỉ huy') ||
                    emp.position.toLowerCase().includes('công nhân') ||
                    emp.position.toLowerCase().includes('giám sát') ||
                    idx >= 3;

                  // Project days for this employee
                  const empProjDays: Record<string, number> = {};
                  let pDaysCount = 0;
                  let nlDaysCount = 0;
                  let klDaysCount = 0;

                  daysInfo.forEach((info) => {
                    const sym = ts.dailySymbols?.[info.day] || (info.isSunday ? '-' : defaultProjSymbol);
                    const upper = sym.trim().toUpperCase();
                    if (upper && upper !== 'CN' && upper !== '-' && upper !== 'P' && upper !== 'NL' && upper !== 'KL') {
                      const matched = projects.find(
                        (p) =>
                          p.symbolFull.toUpperCase() === upper ||
                          p.code.toUpperCase() === upper ||
                          upper.startsWith(p.code.toUpperCase()) ||
                          upper.startsWith(p.symbolFull.toUpperCase())
                      );
                      const pKey = matched ? matched.id : projects[0]?.id || 'proj-1';
                      empProjDays[pKey] = (empProjDays[pKey] || 0) + (upper.endsWith('/2') ? 0.5 : 1);
                    } else if (upper === 'P') {
                      pDaysCount += 1;
                    } else if (upper === 'NL') {
                      nlDaysCount += 1;
                    } else if (upper === 'KL') {
                      klDaysCount += 1;
                    }
                  });

                  // Join date
                  const joinDateFormatted = emp.joinDate
                    ? emp.joinDate.split('-').reverse().join('/')
                    : '01/01/2023';

                  const actualDays = ts.actualWorkingDays !== undefined ? ts.actualWorkingDays : 26;
                  const paidLeave = ts.paidLeaveDays || pDaysCount || 0;
                  const nlDays = nlDaysCount || 0;
                  const unpaidLeave = ts.unpaidLeaveDays || klDaysCount || 0;
                  const totalLeave = paidLeave + nlDays + unpaidLeave;
                  const otHours = ts.totalOtHours || ts.otHoursNormal || 0;
                  const otDays = ts.otConvertedDays || Math.round((otHours / 8) * 100) / 100;

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployeeForDaily(emp)}
                      className={`hover:bg-blue-100/40 transition-colors cursor-pointer group ${
                        isWorker ? 'bg-amber-50/40' : 'bg-white'
                      }`}
                      title="Nhấp vào hàng để xem và chỉnh sửa chấm công chi tiết theo ngày"
                    >
                      {/* Col 0: STT */}
                      <td className="py-2 px-1 text-center text-slate-400 border-r border-slate-200 font-sans">
                        {idx + 1}
                      </td>

                      {/* Col 1: Mã NV */}
                      <td className="py-2 px-1 text-center font-bold text-blue-900 border-r border-slate-200">
                        {emp.code}
                      </td>

                      {/* Col 2: Họ và tên */}
                      <td className="py-2 px-2.5 text-left font-sans font-medium text-slate-900 border-r border-slate-200 group-hover:text-blue-700 whitespace-nowrap">
                        {emp.fullName}
                      </td>

                      {/* Col 3: Chức vụ */}
                      <td className="py-2 px-2 text-left font-sans text-slate-600 border-r border-slate-200 truncate max-w-[130px]">
                        {emp.position}
                      </td>

                      {/* Col 4: Ngày vào làm */}
                      <td className="py-2 px-1.5 text-center font-mono text-[10px] text-slate-500 border-r border-slate-200">
                        {joinDateFormatted}
                      </td>

                      {/* Days 1 - 31 Symbols */}
                      {daysInfo.map((info) => {
                        const isSunday = info.isSunday;
                        const symbol =
                          ts.dailySymbols?.[info.day] !== undefined
                            ? ts.dailySymbols[info.day]
                            : isSunday
                            ? '-'
                            : defaultProjSymbol;

                        const isHalf = symbol.endsWith('/2');
                        const isLeave = symbol.endsWith('/P') || symbol === 'P';
                        const isWorkDay = symbol && symbol !== 'CN' && symbol !== 'KL' && symbol !== 'P' && symbol !== 'NL' && symbol !== '-';
                        const veh = ts.dailyVehicle?.[info.day];

                        return (
                          <td
                            key={info.day}
                            className={`py-1.5 px-0.5 text-center font-bold text-[10px] border-r border-slate-200 ${
                              isSunday
                                ? 'bg-amber-200/90 text-amber-950 border-r border-amber-300'
                                : isHalf
                                ? 'bg-orange-100 text-orange-900'
                                : isLeave
                                ? 'bg-emerald-100 text-emerald-900'
                                : isWorker
                                ? 'text-blue-950 bg-amber-50/50'
                                : 'text-slate-800'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center leading-tight">
                              <span>{symbol}</span>
                              {ts.hasFuelAllowance !== false && isWorkDay && !isSunday && (
                                <span
                                  className="text-[8px] leading-none mt-0.5 font-normal"
                                  title={veh === 'car' ? 'Ô tô (Cấp xe - 0đ)' : 'Xe máy (Tính phụ cấp xăng)'}
                                >
                                  {veh === 'car' ? '🚗' : '🏍️'}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Công chuẩn */}
                      <td className="py-2 px-1.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                        {ts.standardWorkingDays}
                      </td>

                      {/* Công thực tế */}
                      <td className="py-2 px-1.5 text-center font-extrabold text-blue-900 bg-blue-50 border-r border-slate-200">
                        {actualDays}
                      </td>

                      {/* Projects Breakdown */}
                      {projects.map((proj, pIdx) => {
                        let days = empProjDays[proj.id];
                        if (days === undefined) {
                          if (emp.projectAllowances?.[proj.id]?.assigned) {
                            days = actualDays;
                          } else if (pIdx === 0 && Object.keys(empProjDays).length === 0) {
                            days = actualDays;
                          } else {
                            days = 0;
                          }
                        }

                        return (
                          <td
                            key={`p-cell-${proj.id}`}
                            className={`py-2 px-1 text-center font-bold border-r border-slate-200 ${
                              days > 0 ? 'text-amber-950 bg-amber-50/80 font-mono' : 'text-slate-300 font-sans'
                            }`}
                          >
                            {days > 0 ? days : '—'}
                          </td>
                        );
                      })}

                      {/* Nghỉ phép */}
                      <td className="py-2 px-1 text-center border-r border-slate-200 text-slate-700">
                        {paidLeave > 0 ? paidLeave : '—'}
                      </td>
                      <td className="py-2 px-1 text-center border-r border-slate-200 text-slate-700">
                        {nlDays > 0 ? nlDays : '—'}
                      </td>
                      <td className="py-2 px-1 text-center border-r border-slate-200 text-slate-700">
                        {unpaidLeave > 0 ? unpaidLeave : '—'}
                      </td>
                      <td className="py-2 px-1 text-center font-bold border-r border-slate-200 bg-orange-50 text-orange-950">
                        {totalLeave > 0 ? totalLeave : '—'}
                      </td>

                      {/* Tăng ca */}
                      <td className="py-2 px-1 text-center border-r border-slate-200 text-slate-700">
                        {otHours > 0 ? otHours : '—'}
                      </td>
                      <td className="py-2 px-1 text-center border-r border-slate-200 font-semibold text-slate-800">
                        {otDays > 0 ? otDays : '—'}
                      </td>

                      {/* Ghi chú */}
                      <td className="py-2 px-2 text-center font-sans text-[10px] text-slate-500 whitespace-nowrap">
                        {isWorker ? 'Công trình' : 'Văn phòng'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* SUMMARY ROW (TỔNG CỘNG) */}
              <tfoot className="sticky bottom-0 z-20 bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-400 shadow-md">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-center border-r border-slate-300 bg-slate-300">
                    TỔNG CỘNG ({filteredEmployees.length} Nhân Sự)
                  </td>

                  {/* Day count totals */}
                  {daysInfo.map((info) => {
                    let dayPresentCount = 0;
                    filteredEmployees.forEach((e) => {
                      const t = getEmployeeTimesheet(e.id);
                      const s = t.dailySymbols?.[info.day];
                      if (s && s !== 'CN' && s !== 'KL' && s !== 'P' && s !== 'NL' && s !== '-') {
                        dayPresentCount++;
                      } else if (!s && !info.isSunday) {
                        dayPresentCount++;
                      }
                    });

                    return (
                      <td
                        key={`tot-day-${info.day}`}
                        className={`py-2 px-0.5 text-center font-mono border-r border-slate-300 ${
                          info.isSunday ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-900'
                        }`}
                      >
                        {info.isSunday ? '—' : dayPresentCount}
                      </td>
                    );
                  })}

                  {/* Công chuẩn tổng */}
                  <td className="py-2 px-1.5 text-center font-mono border-r border-slate-300 bg-slate-300">
                    {filteredEmployees.reduce((sum, e) => sum + (getEmployeeTimesheet(e.id).standardWorkingDays || 26), 0)}
                  </td>

                  {/* Công thực tế tổng */}
                  <td className="py-2 px-1.5 text-center font-mono font-extrabold text-blue-900 bg-blue-200 border-r border-slate-300">
                    {filteredEmployees.reduce((sum, e) => sum + (getEmployeeTimesheet(e.id).actualWorkingDays || 26), 0)}
                  </td>

                  {/* Projects totals */}
                  {projects.map((proj) => {
                    const totalProjDays = filteredEmployees.reduce((sum, e) => {
                      const t = getEmployeeTimesheet(e.id);
                      let d = 0;
                      if (t.dailySymbols) {
                        Object.values(t.dailySymbols).forEach((sym) => {
                          const u = (sym || '').toUpperCase();
                          if (u === proj.symbolFull.toUpperCase() || u === proj.code.toUpperCase()) d += 1;
                          else if (u.endsWith('/2')) d += 0.5;
                        });
                      } else if (e.projectAllowances?.[proj.id]?.assigned) {
                        d = t.actualWorkingDays || 26;
                      }
                      return sum + d;
                    }, 0);

                    return (
                      <td
                        key={`tot-proj-${proj.id}`}
                        className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-amber-200 text-amber-950 font-bold"
                      >
                        {totalProjDays > 0 ? totalProjDays : '—'}
                      </td>
                    );
                  })}

                  {/* Leave totals */}
                  <td className="py-2 px-1 text-center font-mono border-r border-slate-300">
                    {filteredEmployees.reduce((sum, e) => sum + (getEmployeeTimesheet(e.id).paidLeaveDays || 0), 0)}
                  </td>
                  <td className="py-2 px-1 text-center font-mono border-r border-slate-300">
                    —
                  </td>
                  <td className="py-2 px-1 text-center font-mono border-r border-slate-300">
                    {filteredEmployees.reduce((sum, e) => sum + (getEmployeeTimesheet(e.id).unpaidLeaveDays || 0), 0)}
                  </td>
                  <td className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-orange-200 text-orange-950">
                    {filteredEmployees.reduce(
                      (sum, e) =>
                        sum +
                        (getEmployeeTimesheet(e.id).paidLeaveDays || 0) +
                        (getEmployeeTimesheet(e.id).unpaidLeaveDays || 0),
                      0
                    )}
                  </td>

                  {/* OT totals */}
                  <td className="py-2 px-1 text-center font-mono border-r border-slate-300">
                    {filteredEmployees.reduce(
                      (sum, e) => sum + (getEmployeeTimesheet(e.id).totalOtHours || getEmployeeTimesheet(e.id).otHoursNormal || 0),
                      0
                    )}
                  </td>
                  <td className="py-2 px-1 text-center font-mono border-r border-slate-300">
                    {Math.round(
                      (filteredEmployees.reduce(
                        (sum, e) => sum + (getEmployeeTimesheet(e.id).totalOtHours || getEmployeeTimesheet(e.id).otHoursNormal || 0),
                        0
                      ) /
                        8) *
                        100
                    ) / 100}
                  </td>

                  <td className="py-2 px-1 text-center bg-slate-300 font-sans text-[10px] text-slate-600">
                    Xong
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Daily Timesheet Modal (Opened when clicking on "Công thực tế" or row) */}
      {selectedEmployeeForDaily && (
        <DailyTimesheetModal
          isOpen={!!selectedEmployeeForDaily}
          onClose={() => setSelectedEmployeeForDaily(null)}
          employee={selectedEmployeeForDaily}
          timesheet={getEmployeeTimesheet(selectedEmployeeForDaily.id)}
          month={currentMonth}
          projects={projects}
          departmentName={
            departments.find((d) => d.id === selectedEmployeeForDaily.departmentId)?.name
          }
          onSave={handleSaveDailySheet}
          readOnly={isReadOnly}
        />
      )}

      {/* MODAL 1: SET PASSWORD LOCK MODAL */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#1E3A8A] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-700/60 rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Đặt Mật Khẩu Khóa Kỳ Chấm Công</h3>
                  <p className="text-xs text-blue-200">Kỳ áp dụng: {currentMonth}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (lockPasswordInput && confirmLockPasswordInput && lockPasswordInput !== confirmLockPasswordInput) {
                  showToast('Mật khẩu xác nhận không trùng khớp!', 'error');
                  return;
                }
                const pwd = lockPasswordInput.trim() || '123456';
                lockMonth(currentMonth, pwd);
                setSessionUnlockedMonths((prev) => ({ ...prev, [currentMonth]: false }));
                setIsLockModalOpen(false);
                setLockPasswordInput('');
                setConfirmLockPasswordInput('');
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  Khi khóa kỳ, bảng chấm công tháng <strong>{currentMonth}</strong> sẽ chuyển sang chế độ <strong>CHỈ XEM</strong>. Không ai có thể chỉnh sửa số công, tăng ca hoặc phụ cấp nếu không có mật khẩu.
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mật khẩu khóa kỳ (Mặc định: 123456)
                </label>
                <div className="relative">
                  <input
                    type={showLockPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu (ví dụ: 123456)"
                    value={lockPasswordInput}
                    onChange={(e) => setLockPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLockPassword(!showLockPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Xác nhận lại mật khẩu
                </label>
                <input
                  type={showLockPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu để xác nhận"
                  value={confirmLockPasswordInput}
                  onChange={(e) => setConfirmLockPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 cursor-pointer font-medium text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center space-x-1.5 transition-colors text-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>Xác nhận khóa kỳ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UNLOCK MODAL */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-amber-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-700/60 rounded-lg">
                  <Unlock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Mở Khóa Chỉnh Sửa Kỳ Chấm Công</h3>
                  <p className="text-xs text-amber-100">Kỳ: {currentMonth}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                className="text-amber-100 hover:text-white p-1 rounded hover:bg-amber-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const entered = unlockPasswordInput.trim();
                const correctPwd = lockInfo?.password || '123456';
                if (entered !== correctPwd) {
                  showToast('Mật khẩu mở khóa không chính xác! Vui lòng thử lại.', 'error');
                  return;
                }

                if (unlockPermanent) {
                  unlockMonth(currentMonth, entered);
                } else {
                  setSessionUnlockedMonths((prev) => ({ ...prev, [currentMonth]: true }));
                  showToast(`Đã mở khóa kỳ chấm công ${currentMonth} cho phiên làm việc này!`, 'success');
                }
                setIsUnlockModalOpen(false);
                setUnlockPasswordInput('');
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhập mật khẩu mở khóa (Mặc định khi chốt: 123456)
                </label>
                <div className="relative">
                  <input
                    type={showUnlockPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mở khóa kỳ..."
                    value={unlockPasswordInput}
                    onChange={(e) => setUnlockPasswordInput(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="block font-semibold text-slate-700">Tùy chọn mở khóa:</span>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="unlockType"
                    checked={!unlockPermanent}
                    onChange={() => setUnlockPermanent(false)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700">
                    <strong>Mở tạm thời cho phiên này</strong> (An toàn, tự khóa lại khi thoát)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="unlockType"
                    checked={unlockPermanent}
                    onChange={() => setUnlockPermanent(true)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700">
                    <strong>Gỡ bỏ khóa hoàn toàn</strong> (Mở khóa vĩnh viễn cho kỳ này)
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 cursor-pointer font-medium text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center space-x-1.5 transition-colors text-xs"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Xác nhận mở khóa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADVANCE TO NEXT MONTH ("Chốt kỳ & Tính cho tháng tiếp theo") */}
      {isNextMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/50 rounded-lg border border-blue-400/30">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Chốt Kỳ & Bắt Đầu Tính Cho Tháng Tiếp Theo
                  </h3>
                  <p className="text-xs text-blue-200">
                    Từ kỳ {currentMonth} ➔ Chuyển sang kỳ {nextMonthInfo.monthStr}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNextMonthModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                  <span className="text-[11px] text-slate-500 block">Kỳ hiện tại sẽ chốt</span>
                  <strong className="text-sm text-slate-900">{currentMonth}</strong>
                  <span className="text-[10px] text-amber-700 block mt-0.5 font-semibold">
                    🔒 Sẽ được khóa cố định
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                  <span className="text-[11px] text-blue-600 block">Kỳ mới bắt đầu tính</span>
                  <strong className="text-sm text-blue-950">{nextMonthInfo.monthStr}</strong>
                  <span className="text-[10px] text-blue-700 block mt-0.5 font-semibold">
                    {nextMonthInfo.days} ngày ({employees.length} nhân sự)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 leading-relaxed">
                Hệ thống sẽ thực hiện các thao tác tự động:
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-700">
                  <li>Lưu giữ toàn bộ kết quả chấm công, tăng ca và phụ cấp kỳ <strong>{currentMonth}</strong>.</li>
                  <li>Tự động đặt mật khẩu khóa kỳ <strong>{currentMonth}</strong> để bảo vệ dữ liệu.</li>
                  <li>Chuyển kỳ làm việc hiện tại sang <strong>{nextMonthInfo.monthStr}</strong>.</li>
                  <li>Khởi tạo bảng chấm công chuẩn ({settings.standardMonthlyDays} công) cho tất cả <strong>{employees.length} nhân viên</strong> trong công ty.</li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-slate-50">
                <label className="flex items-center space-x-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nextMonthShouldLock}
                    onChange={(e) => setNextMonthShouldLock(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Đặt mật khẩu khóa kỳ {currentMonth} ngay khi chuyển</span>
                </label>

                {nextMonthShouldLock && (
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      Mật khẩu bảo vệ kỳ {currentMonth}:
                    </label>
                    <input
                      type="text"
                      value={nextMonthLockPassword}
                      onChange={(e) => setNextMonthLockPassword(e.target.value)}
                      placeholder="Nhập mật khẩu (ví dụ: 123456)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-blue-500 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNextMonthModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 cursor-pointer font-medium text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    advanceToNextMonth(nextMonthShouldLock, nextMonthLockPassword.trim() || '123456');
                    setSessionUnlockedMonths({});
                    setIsNextMonthModalOpen(false);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded font-bold shadow-xs cursor-pointer flex items-center space-x-1.5 transition-all text-xs"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Xác nhận chốt & Tính {nextMonthInfo.label}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PERMISSIONS MODAL - EXCLUSIVE ADMIN APP AUTHORITY */}
      {isPermissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#1E3A8A] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-700/60 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm sm:text-base">
                      Cấp Quyền Chỉnh Sửa Dữ Liệu
                    </h3>
                    <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs">
                      ĐẶC QUYỀN ADMIN APP
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Quản trị viên tối cao: <strong className="text-white">{adminAppEmail}</strong> (Lê Thanh Huy)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPermissionModalOpen(false);
                  setIsChangingAdminPasscode(false);
                }}
                className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Strict Security Policy Notice */}
              <div className="p-3.5 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-300 rounded-lg text-rose-950 flex items-start space-x-3 shadow-2xs">
                <div className="p-1.5 bg-rose-200 rounded-md shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4 text-rose-800" />
                </div>
                <div className="space-y-1">
                  <span className="font-black text-[12px] block text-rose-900 tracking-wide uppercase">
                    Quy định bảo mật phân quyền tối cao:
                  </span>
                  <p className="text-[11px] leading-relaxed text-rose-900">
                    <strong>Chỉ duy nhất Quản trị viên ứng dụng (Super Admin: {adminAppEmail}) mới có thẩm quyền cấp quyền chỉnh sửa cho tất cả mọi người, kể cả Ban Giám Đốc.</strong>
                  </p>
                  <p className="text-[11px] text-slate-700">
                    Ban Giám Đốc và các trưởng phòng <strong>hoàn toàn không có quyền tự cấp quyền sửa</strong> hoặc cấp quyền cho người khác. Giám đốc chỉ được chỉnh sửa số liệu khi Quản trị viên App cấp quyền.
                  </p>
                </div>
              </div>

              {/* VIEW 1: WHEN NOT YET AUTHENTICATED AS ADMIN APP */}
              {!isAppAdmin && (
                <div className="space-y-4">
                  <div>
                    <span className="block font-bold text-slate-800 mb-1.5 text-xs">
                      1. Trạng thái phân quyền hiện tại (Chế độ xem đối soát):
                    </span>
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden bg-slate-50/50">
                      {/* Director */}
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">Ban Giám Đốc (Giám đốc điều hành)</span>
                          <span className="block text-[10px] text-slate-500">
                            {rolePermissions.director === 'edit'
                              ? 'Đang được Admin App cấp quyền Chỉnh Sửa'
                              : 'Chưa được Admin App cấp quyền ➔ Chỉ có quyền xem'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            rolePermissions.director === 'edit'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {rolePermissions.director === 'edit' ? '✏️ Quyền Chỉnh Sửa' : '🔒 Chỉ Xem'}
                        </span>
                      </div>

                      {/* Payroll Accountant */}
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">Kế toán tiền lương (C&B)</span>
                          <span className="block text-[10px] text-slate-500">
                            {rolePermissions.payroll_accountant === 'edit'
                              ? 'Đang được Admin App cấp quyền Chỉnh Sửa'
                              : 'Chưa được Admin App cấp quyền ➔ Chỉ có quyền xem'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            rolePermissions.payroll_accountant === 'edit'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {rolePermissions.payroll_accountant === 'edit' ? '✏️ Quyền Chỉnh Sửa' : '🔒 Chỉ Xem'}
                        </span>
                      </div>

                      {/* Site Manager */}
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">Chỉ huy trưởng / Quản lý công trình</span>
                          <span className="block text-[10px] text-slate-500">
                            {rolePermissions.site_manager === 'edit'
                              ? 'Đang được Admin App cấp quyền Chỉnh Sửa'
                              : 'Chưa được Admin App cấp quyền ➔ Chỉ có quyền xem'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            rolePermissions.site_manager === 'edit'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {rolePermissions.site_manager === 'edit' ? '✏️ Quyền Chỉnh Sửa' : '🔒 Chỉ Xem'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Authentication Form for Admin App */}
                  <div className="bg-blue-50/70 border border-blue-300 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2 text-blue-950 font-bold text-xs">
                      <Key className="w-4 h-4 text-blue-700" />
                      <span>Xác thực danh tính Quản trị viên App ({adminAppEmail})</span>
                    </div>
                    <p className="text-[11px] text-blue-900">
                      Để thực hiện cấp quyền hoặc thu hồi quyền chỉnh sửa cho bất kỳ ai (kể cả Ban Giám Đốc), vui lòng nhập mã xác thực Quản trị viên App:
                    </p>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (verifyAdminAppPasscode(adminAuthInput)) {
                          setAdminAuthInput('');
                        }
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Mã xác thực Quản trị viên App (Super Admin Master Key)
                        </label>
                        <div className="relative">
                          <input
                            type={showAdminAuthInput ? 'text' : 'password'}
                            value={adminAuthInput}
                            onChange={(e) => setAdminAuthInput(e.target.value)}
                            placeholder="Nhập mã quản trị app (mặc định: admin@2026 hoặc 123456)..."
                            autoFocus
                            className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none pr-9 text-xs bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminAuthInput(!showAdminAuthInput)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showAdminAuthInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Gợi ý: Mật mã mặc định khi bàn giao là <strong>admin@2026</strong> hoặc <strong>123456</strong>.
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-bold shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 transition-colors text-xs"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Xác thực Quản trị viên App & Mở bảng cấp quyền</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* VIEW 2: WHEN AUTHENTICATED AS ADMIN APP */}
              {isAppAdmin && (
                <div className="space-y-4">
                  {/* Admin Verified Banner */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 text-xs sm:text-sm block">
                          👑 ĐÃ XÁC THỰC QUẢN TRỊ VIÊN APP: {adminAppEmail}
                        </span>
                        <span className="text-[11px] text-emerald-800 block">
                          Bạn có toàn quyền cấp hoặc thu hồi quyền chỉnh sửa dữ liệu cho tất cả các bên.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={logoutAppAdmin}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 bg-white border border-rose-300 rounded shadow-2xs cursor-pointer transition-colors shrink-0"
                    >
                      Đăng xuất Admin
                    </button>
                  </div>

                  {/* Role Permissions Control Panel */}
                  <div>
                    <span className="block font-bold text-slate-800 mb-2 text-xs">
                      Bảng điều phối quyền chỉnh sửa (Chỉ Quản trị viên App có quyền bật/tắt):
                    </span>

                    <div className="space-y-2.5">
                      {/* 1. Ban Giám Đốc */}
                      <div className="border border-slate-200 rounded-lg p-3.5 bg-white hover:border-blue-300 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">1. Ban Giám Đốc (CEO / Lãnh đạo)</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rolePermissions.director === 'edit'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {rolePermissions.director === 'edit' ? 'Được phép Chỉnh sửa' : 'Chỉ Xem'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            {rolePermissions.director === 'edit'
                              ? 'Giám đốc đang ĐƯỢC PHÉP chỉnh sửa số ngày công, tăng ca và phụ cấp.'
                              : 'Giám đốc đang ở chế độ CHỈ XEM (không thể tự ý sửa đổi số liệu bảng chấm công).'}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center space-x-2">
                          {rolePermissions.director === 'edit' ? (
                            <button
                              type="button"
                              onClick={() => updateRolePermissionByAdmin('director', 'view')}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold shadow-2xs cursor-pointer text-xs flex items-center space-x-1"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Thu hồi quyền sửa (Đặt Chỉ Xem)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateRolePermissionByAdmin('director', 'edit')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-2xs cursor-pointer text-xs flex items-center space-x-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Cấp quyền Chỉnh Sửa cho Giám Đốc</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2. Kế toán tiền lương */}
                      <div className="border border-slate-200 rounded-lg p-3.5 bg-white hover:border-blue-300 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">2. Kế toán tiền lương (C&B)</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rolePermissions.payroll_accountant === 'edit'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {rolePermissions.payroll_accountant === 'edit' ? 'Được phép Chỉnh sửa' : 'Chỉ Xem'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Cho phép phòng kế toán nhập công chuẩn, công thực tế, tăng ca và phụ cấp xe máy/ô tô.
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center space-x-2">
                          {rolePermissions.payroll_accountant === 'edit' ? (
                            <button
                              type="button"
                              onClick={() => updateRolePermissionByAdmin('payroll_accountant', 'view')}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold shadow-2xs cursor-pointer text-xs flex items-center space-x-1"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Thu hồi quyền sửa</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateRolePermissionByAdmin('payroll_accountant', 'edit')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-2xs cursor-pointer text-xs flex items-center space-x-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Cấp quyền Chỉnh Sửa cho Kế Toán</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3. Chỉ huy trưởng / Quản lý công trình */}
                      <div className="border border-slate-200 rounded-lg p-3.5 bg-white hover:border-blue-300 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">3. Chỉ huy trưởng / Quản lý công trình</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rolePermissions.site_manager === 'edit'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {rolePermissions.site_manager === 'edit' ? 'Được phép Chỉnh sửa' : 'Chỉ Xem'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Cho phép chấm công chi tiết theo ngày theo ký hiệu từng công trình (BC, PT, HT2...).
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center space-x-2">
                          {rolePermissions.site_manager === 'edit' ? (
                            <button
                              type="button"
                              onClick={() => updateRolePermissionByAdmin('site_manager', 'view')}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold shadow-2xs cursor-pointer text-xs flex items-center space-x-1"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Thu hồi quyền sửa</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateRolePermissionByAdmin('site_manager', 'edit')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-2xs cursor-pointer text-xs flex items-center space-x-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Cấp quyền Chỉnh Sửa cho CHT</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role Simulator to verify permissions */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">
                      Thử nghiệm vai trò đang thao tác trên giao diện:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRole('director');
                          showToast(`Đã chuyển vai trò đang thao tác sang: Ban Giám Đốc (Quyền: ${rolePermissions.director === 'edit' ? 'Được sửa' : 'Chỉ xem'})`);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                          activeRole === 'director'
                            ? 'bg-blue-800 text-white border-blue-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Ban Giám Đốc ({rolePermissions.director === 'edit' ? 'Sửa' : 'Chỉ xem'})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRole('payroll_accountant');
                          showToast(`Đã chuyển vai trò đang thao tác sang: Kế toán tiền lương (Quyền: ${rolePermissions.payroll_accountant === 'edit' ? 'Được sửa' : 'Chỉ xem'})`);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                          activeRole === 'payroll_accountant'
                            ? 'bg-blue-800 text-white border-blue-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Kế toán ({rolePermissions.payroll_accountant === 'edit' ? 'Sửa' : 'Chỉ xem'})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRole('site_manager');
                          showToast(`Đã chuyển vai trò đang thao tác sang: Chỉ huy trưởng (Quyền: ${rolePermissions.site_manager === 'edit' ? 'Được sửa' : 'Chỉ xem'})`);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                          activeRole === 'site_manager'
                            ? 'bg-blue-800 text-white border-blue-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Chỉ huy trưởng ({rolePermissions.site_manager === 'edit' ? 'Sửa' : 'Chỉ xem'})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRole('employee');
                          showToast('Đã chuyển vai trò đang thao tác sang: Nhân viên (Chỉ xem)');
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                          activeRole === 'employee'
                            ? 'bg-blue-800 text-white border-blue-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Nhân viên (Chỉ xem)
                      </button>
                    </div>
                  </div>

                  {/* Change Admin App Passcode Section */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-xs">
                        Đổi mã xác thực Quản trị viên App:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsChangingAdminPasscode(!isChangingAdminPasscode)}
                        className="text-blue-700 hover:underline text-[11px] font-semibold cursor-pointer"
                      >
                        {isChangingAdminPasscode ? 'Thu gọn' : 'Đổi mật mã mới'}
                      </button>
                    </div>

                    {isChangingAdminPasscode && (
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Mã hiện tại</label>
                          <input
                            type="password"
                            value={oldAdminPasscodeInput}
                            onChange={(e) => setOldAdminPasscodeInput(e.target.value)}
                            placeholder="Mã hiện tại"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Mã mới (tối thiểu 4 ký tự)</label>
                          <input
                            type="password"
                            value={newAdminPasscodeInput}
                            onChange={(e) => setNewAdminPasscodeInput(e.target.value)}
                            placeholder="Mã mới"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (updateAdminAppPasscode(oldAdminPasscodeInput, newAdminPasscodeInput)) {
                                setOldAdminPasscodeInput('');
                                setNewAdminPasscodeInput('');
                                setIsChangingAdminPasscode(false);
                              }
                            }}
                            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold cursor-pointer"
                          >
                            Lưu mã mới
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  Vai trò đang áp dụng: <strong>{activeRole === 'director' ? 'Ban Giám Đốc' : activeRole === 'payroll_accountant' ? 'Kế toán tiền lương' : 'Chỉ huy trưởng / Nhân viên'}</strong> ({hasRoleEditPermission ? '✏️ Có quyền Sửa' : '🔒 Chỉ Xem'})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPermissionModalOpen(false);
                    setIsChangingAdminPasscode(false);
                  }}
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-bold shadow-xs cursor-pointer transition-colors text-xs"
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
