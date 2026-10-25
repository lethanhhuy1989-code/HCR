import React, { useState, useMemo } from 'react';
import { useHRM } from '../context/HRMContext';
import { PayrollItem } from '../types/hrm';
import { formatVND, formatNumberVN } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { exportDynamicExcel } from '../utils/dynamicExcelExporter';
import {
  FileText,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  Receipt,
  Users,
  Download,
  Printer,
  ChevronRight,
  Sliders,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  HandCoins,
  Settings,
  Calendar,
} from 'lucide-react';
import { PayslipModal } from './PayslipModal';

export const PayrollSheet: React.FC = () => {
  const {
    payrollItems,
    departments,
    jobPositions,
    employees,
    projects,
    currentMonth,
    setCurrentMonth,
    selectedEmployeeForSlip,
    setSelectedEmployeeForSlip,
    setActiveSubTab,
    setActiveMainTab,
    settings,
    excelExportSettings,
    toggleKpiBonus,
    toggleAllowances,
    showToast,
  } = useHRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedSalaryType, setSelectedSalaryType] = useState('all');

  // Compute days in the current selected month for payroll
  const [payrollYear, payrollMonthNum] = useMemo(() => {
    const parts = currentMonth.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [currentMonth]);

  const payrollDaysInMonth = useMemo(() => {
    return new Date(payrollYear, payrollMonthNum, 0).getDate();
  }, [payrollYear, payrollMonthNum]);

  // Extract unique sorted list of job positions (from configured positions and employee records)
  const allPositions = useMemo(() => {
    const set = new Set<string>();
    jobPositions.forEach((p) => {
      if (p.title && p.title.trim()) set.add(p.title.trim());
    });
    employees.forEach((emp) => {
      if (emp.position && emp.position.trim()) set.add(emp.position.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [jobPositions, employees]);

  // Map employee lookup for quick metadata access (Bank account, BHXH, address)
  const employeeMap = useMemo(() => {
    const map = new Map<string, (typeof employees)[0]>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Filtered items (by search, department, job position, and salary type)
  const filteredItems = useMemo(() => {
    return payrollItems.filter((item) => {
      const emp = employeeMap.get(item.employeeId);
      const matchSearch =
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp?.bankAccount && emp.bankAccount.includes(searchTerm)) ||
        (emp?.socialInsuranceCode && emp.socialInsuranceCode.includes(searchTerm));
      const matchDept =
        selectedDept === 'all' || item.departmentName.includes(selectedDept);
      const matchPosition =
        selectedPosition === 'all' ||
        item.position.toLowerCase().trim() === selectedPosition.toLowerCase().trim() ||
        item.position.toLowerCase().includes(selectedPosition.toLowerCase().trim());
      const matchSalaryType =
        selectedSalaryType === 'all' ||
        (selectedSalaryType === 'scale' && item.salaryType === 'scale') ||
        (selectedSalaryType === 'negotiated_monthly' && item.salaryType === 'negotiated' && item.negotiatedType !== 'daily') ||
        (selectedSalaryType === 'negotiated_daily' && item.salaryType === 'negotiated' && item.negotiatedType === 'daily');

      return matchSearch && matchDept && matchPosition && matchSalaryType;
    });
  }, [payrollItems, searchTerm, selectedDept, selectedPosition, selectedSalaryType, employeeMap]);

  // Aggregate KPI figures
  const totalGross = useMemo(() => filteredItems.reduce((sum, i) => sum + i.grossIncome, 0), [filteredItems]);
  const totalNet = useMemo(() => filteredItems.reduce((sum, i) => sum + i.netIncome, 0), [filteredItems]);
  const totalInsurance = useMemo(() => filteredItems.reduce((sum, i) => sum + i.totalEmployeeInsurance, 0), [filteredItems]);
  const totalTax = useMemo(() => filteredItems.reduce((sum, i) => sum + i.personalIncomeTax, 0), [filteredItems]);
  const totalAdvances = useMemo(() => filteredItems.reduce((sum, i) => sum + i.salaryAdvanceDeduction, 0), [filteredItems]);

  // Export Excel (.xlsx) of Payroll using Dynamic Settings (File name template, selected columns, styles, etc.)
  const handleExportExcel = () => {
    try {
      const payrollExportRecords = filteredItems.map((item, idx) => {
        const emp = employeeMap.get(item.employeeId);
        const otHours = item.totalOtHours || item.otHoursNormal || 0;
        const otConvertedDays = item.otConvertedDays || Math.round((otHours / 8) * 100) / 100;
        
        // Project stats for this item
        const projectStats: Record<string, any> = {};
        const projSummaryList: string[] = [];

        projects.forEach((proj) => {
          const detail = item.projectAllowanceDetails?.find(
            (d) => d.projectId === proj.id || d.projectCode === proj.code
          );
          const days = detail ? detail.daysWorked : 0;
          projectStats[`proj_days_${proj.id}`] = days;
          projectStats[`project_days_${proj.id}`] = days;
          projectStats[`proj_fuel_${proj.id}`] = detail ? detail.fuelAllowance : 0;
          projectStats[`proj_meal_${proj.id}`] = detail ? detail.mealAllowance : 0;
          projectStats[`proj_remote_${proj.id}`] = detail ? detail.remoteAllowance : 0;
          projectStats[`proj_total_${proj.id}`] = detail ? detail.totalAllowance : 0;
          projectStats[`proj_vehicle_${proj.id}`] = detail
            ? detail.hasCompanyVehicle
              ? 'Cấp xe (0đ)'
              : 'Tự túc xe'
            : '';

          if (days > 0) {
            projSummaryList.push(`${proj.name || proj.code}: ${days} ngày`);
          }
        });

        const allAssignedProjects =
          projSummaryList.length > 0 ? projSummaryList.join('; ') : 'Chưa phân bổ';

        return {
          stt: idx + 1,
          employeeCode: item.employeeCode,
          fullName: item.fullName,
          departmentName: item.departmentName,
          position: item.position,
          positionRank: emp?.positionRank || 'C',
          socialInsuranceCode: emp?.socialInsuranceCode || '',
          bankAccount: emp?.bankAccount || '',
          bankName: emp?.bankName || 'Vietcombank',
          salaryType: item.salaryType === 'negotiated'
            ? (item.negotiatedType === 'daily'
                ? `Thỏa thuận ngày (${formatNumberVN(item.negotiatedDailyRate || item.dailyRate || 0)} đ/ngày)`
                : `Thỏa thuận trọn tháng (${formatNumberVN(item.negotiatedSalary || item.baseSalaryRate)} đ)`)
            : 'Theo thang bảng 8 bậc',
          gradeName: item.gradeName,
          tierIndex: item.tierIndex,
          coefficient: item.coefficient,
          baseSalaryRate: item.baseSalaryRate,
          negotiatedDailyRate: item.negotiatedDailyRate || item.dailyRate || 0,
          standardDays: item.standardDays,
          actualDays: item.actualDays,
          actualBaseSalary: item.actualBaseSalary,
          actualCompetencySalary: item.actualCompetencySalary,
          responsibilityAllowance: item.responsibilityAllowance,
          allowanceFuelProject: item.allowanceFuelProject,
          allowanceMealProject: item.allowanceMealProject,
          allowanceRemoteProject: item.allowanceRemoteProject,
          companyVehicle: item.hasCompanyVehicle ? 'Có cấp xe (0đ xăng)' : 'Tự túc xe (Tính xăng)',
          otHours: otHours,
          otConvertedDays: otConvertedDays,
          otPay: item.otPay,
          kpiRating: item.kpiRating || 'B',
          performanceBonus: item.performanceBonus,
          grossIncome: item.grossIncome,
          totalEmployeeInsurance: item.totalEmployeeInsurance,
          personalIncomeTax: item.personalIncomeTax,
          salaryAdvanceDeduction: item.salaryAdvanceDeduction,
          netIncome: item.netIncome,
          all_assigned_projects: allAssignedProjects,
          identityCard: emp?.identityCard || '',
          hometown: emp?.hometown || '',
          currentAddress: emp?.currentAddress || '',
          joinDate: emp?.joinDate || '',
          phone: emp?.phone || '',
          email: emp?.email || '',
          dependentsCount: emp?.dependentsCount || 0,
          status: emp?.status === 'active' ? 'Chính thức' : 'Thử việc',
          ...projectStats,
        };
      });

      const config = excelExportSettings.tables.payroll;
      const res = exportDynamicExcel(
        config,
        excelExportSettings,
        payrollExportRecords,
        {
          month: currentMonth,
          companyName: excelExportSettings.companyName,
          companyShortName: excelExportSettings.companyShortName,
        }
      );

      showToast(`Đã xuất file "${res.fileName}" thành công theo cài đặt (${res.colCount} cột, ${res.rowCount} dòng)!`);
    } catch (err: any) {
      console.error('Lỗi xuất Excel:', err);
      showToast('Có lỗi xảy ra khi xuất file Excel: ' + (err?.message || ''));
    }
  };

  // Export PDF (.pdf) of Payroll
  const handleExportPDF = () => {
    const headers = [
      'STT',
      'Ma NV',
      'Ho va Ten',
      'Phong Ban',
      'Chuc Vu',
      'Cong',
      'Luong Co Ban',
      'Phu Cap',
      'OT/TC',
      'Thuong KPI',
      'Tong Gross',
      'BHXH NLD',
      'Thue TNCN',
      'Tam Ung',
      'Thuc Linh',
    ];

    const rows = filteredItems.map((item, idx) => {
      const totalPhuCap = (item.responsibilityAllowance || 0) + (item.allowanceFuelProject || 0) + (item.allowanceMealProject || 0);
      return [
        idx + 1,
        item.employeeCode,
        item.fullName,
        item.departmentName,
        item.position,
        item.actualDays,
        item.baseSalaryRate.toLocaleString('vi-VN'),
        totalPhuCap.toLocaleString('vi-VN'),
        item.otPay.toLocaleString('vi-VN'),
        item.performanceBonus.toLocaleString('vi-VN'),
        item.grossIncome.toLocaleString('vi-VN'),
        item.totalEmployeeInsurance.toLocaleString('vi-VN'),
        item.personalIncomeTax.toLocaleString('vi-VN'),
        item.salaryAdvanceDeduction.toLocaleString('vi-VN'),
        item.netIncome.toLocaleString('vi-VN'),
      ];
    });

    exportToPDF({
      fileName: `Bang_Luong_Thang_${currentMonth}.pdf`,
      title: `BANG THANH TOAN TIEN LUONG - THANG ${currentMonth}`,
      subtitles: [
        `Ky luong: ${currentMonth} | Tong nhan su: ${filteredItems.length} | Tong thuc linh: ${formatVND(totalNet)}`,
      ],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất file PDF bảng tiền lương thành công!');
  };

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và Tên',
      'Phòng Ban',
      'Chức Vụ',
      'Mã Số BHXH',
      'STK Ngân Hàng',
      'Ngân Hàng Chi Nhánh',
      'Nguyên Quán',
      'Chỗ Ở Hiện Nay',
      'Hình Thức Lương',
      'Ngạch Lương',
      'Bậc Lương',
      'Hệ Số',
      'Lương Cơ Bản / Thỏa Thuận',
      'Lương Năng Lực',
      'Phụ Cấp Trách Nhiệm',
      'Phụ Cấp Tiền Xăng',
      'Phụ Cấp Tiền Ăn CT',
      'Cấp Xe Đi Công Trình',
      'Công Chuẩn',
      'Công Thực Tế',
      'Có Tăng Ca',
      'Tổng Giờ Tăng Ca (h)',
      'Công Tăng Ca Quy Đổi (÷8h)',
      'Tiền Làm Thêm (OT)',
      'Điểm KPI',
      'Xếp Hạng KPI',
      'Thưởng Hiệu Quả KPI',
      'Tổng Thu Nhập (Gross)',
      'BHXH (8%)',
      'BHYT (1.5%)',
      'BHTN (1%)',
      'Tổng BHXH NLĐ',
      'Thuế TNCN',
      'Tạm Ứng',
      'Thực Lĩnh (Net)',
    ];

    const rows = filteredItems.map((item, idx) => {
      const emp = employeeMap.get(item.employeeId);
      return [
        idx + 1,
        item.employeeCode,
        `"${item.fullName}"`,
        `"${item.departmentName}"`,
        `"${item.position}"`,
        `"${emp?.socialInsuranceCode || ''}"`,
        `"${emp?.bankAccount || ''}"`,
        `"${emp?.bankName || ''}"`,
        `"${emp?.hometown || ''}"`,
        `"${emp?.currentAddress || ''}"`,
        item.salaryType === 'negotiated'
          ? (item.negotiatedType === 'daily'
              ? `Thoa thuan ngay (${item.negotiatedDailyRate || item.dailyRate || 0}d/ngay)`
              : `Thoa thuan thang (${item.negotiatedSalary || item.baseSalaryRate}d)`)
          : 'Theo thang bac',
        `"${item.gradeName}"`,
        item.tierIndex,
        item.coefficient,
        item.baseSalaryRate,
        item.competencySalary,
        item.responsibilityAllowance,
        item.allowanceFuelProject,
        item.allowanceMealProject,
        item.hasCompanyVehicle ? 'Có cấp xe (Miễn xăng)' : 'Tự túc xe',
        item.standardDays,
        item.actualDays,
        item.hasOvertime ? 'Có' : 'Không',
        item.totalOtHours || item.otHoursNormal || 0,
        item.otConvertedDays || Math.round(((item.totalOtHours || item.otHoursNormal || 0) / 8) * 100) / 100,
        item.otPay,
        item.kpiScore || 100,
        `"${item.kpiRating || 'B'}"`,
        item.performanceBonus,
        item.grossIncome,
        item.employeeBhxh,
        item.employeeBhyt,
        item.employeeBhtn,
        item.totalEmployeeInsurance,
        item.personalIncomeTax,
        item.salaryAdvanceDeduction,
        item.netIncome,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Luong_Chi_Tiet_Thang_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất bảng chi tiết lương và STK ngân hàng ra CSV thành công!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Kỳ lương:</label>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-blue-500"
            >
              <option value="2026-10">Tháng 10 / 2026</option>
              <option value="2026-09">Tháng 09 / 2026</option>
              <option value="2026-08">Tháng 08 / 2026</option>
              <option value="2026-11">Tháng 11 / 2026 (Dự tính)</option>
            </select>
          </div>

          {/* Trường số ngày trong tháng thể hiện từ ngày 1 đến ngày cuối tháng */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg px-3 py-1 text-xs shadow-2xs">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Số ngày trong tháng:
            </span>
            <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
              {payrollDaysInMonth} ngày
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border border-blue-100">
              01/{String(payrollMonthNum).padStart(2, '0')} ➔ {String(payrollDaysInMonth).padStart(2, '0')}/{String(payrollMonthNum).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setActiveMainTab('attendance')}
              className="text-[10px] font-bold text-blue-700 hover:text-white hover:bg-blue-600 bg-white border border-blue-300 px-2 py-0.5 rounded transition-all cursor-pointer shadow-2xs"
              title="Chuyển sang bảng chấm công chi tiết 1 - ngày cuối tháng"
            >
              Xem Chấm Công ➔
            </button>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Phòng ban:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Position Filter (Lọc theo vị trí việc làm) */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              Vị trí việc làm:
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-blue-500 font-medium max-w-[200px]"
            >
              <option value="all">Tất cả vị trí ({allPositions.length})</option>
              {allPositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            {selectedPosition !== 'all' && (
              <button
                onClick={() => setSelectedPosition('all')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
                title="Bỏ lọc vị trí"
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Salary Type Filter (Lọc theo hình thức lương) */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <HandCoins className="w-3.5 h-3.5 text-slate-500" />
              Hình thức lương:
            </label>
            <select
              value={selectedSalaryType}
              onChange={(e) => setSelectedSalaryType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-blue-500 font-medium"
            >
              <option value="all">Tất cả hình thức ({payrollItems.length})</option>
              <option value="scale">Thang bảng 8 bậc chuẩn</option>
              <option value="negotiated_monthly">Thỏa thuận - Trọn tháng</option>
              <option value="negotiated_daily">Thỏa thuận - Theo ngày</option>
            </select>
            {selectedSalaryType !== 'all' && (
              <button
                onClick={() => setSelectedSalaryType('all')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
                title="Bỏ lọc hình thức lương"
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã NV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-blue-500 w-44 sm:w-52"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 self-start lg:self-auto flex-wrap gap-y-2">
          <button
            onClick={() => setActiveSubTab('settings')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center space-x-1.5 transition-colors"
            title="Tùy chỉnh tỷ lệ đóng BHXH và mức giảm trừ thuế"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cấu hình BHXH & Thuế</span>
          </button>

          <div className="flex items-center">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-l flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Xuất toàn bộ bảng thanh toán tiền lương ra file Excel (.xlsx) theo cấu hình cài đặt"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => setActiveMainTab('settings')}
              className="px-2 py-1.5 text-xs font-medium text-emerald-100 bg-emerald-800 hover:bg-emerald-900 rounded-r border-l border-emerald-600 transition-colors cursor-pointer"
              title="Tùy chỉnh cấu hình xuất Excel (Đổi tên file tự động, chọn cột, đổi tên cột, dạng bảng chuẩn / kế toán / thô)"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Xuất toàn bộ bảng thanh toán tiền lương ra file PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Xuất PDF (.pdf)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center space-x-1 transition-colors cursor-pointer"
            title="Xuất định dạng CSV"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => showToast('Đã phát lệnh chuyển tiền chi lương qua cổng kết nối Ngân hàng thành công!')}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Chi trả kỳ lương</span>
          </button>
        </div>
      </div>

      {/* Policy ON/OFF Status and Quick Toggle Banner */}
      <div
        className={`mb-5 p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
          !settings.enableKpiBonus || !settings.enableAllowances
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50/50 border-emerald-200'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
              <span>Chính sách áp dụng bảng lương:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  settings.enableKpiBonus
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                KPI & Thưởng: {settings.enableKpiBonus ? 'ĐANG BẬT (Tính thưởng)' : 'ĐANG TẮT (Chưa áp dụng)'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  settings.enableAllowances
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                Phụ cấp: {settings.enableAllowances ? 'ĐANG BẬT (Tính phụ cấp)' : 'ĐANG TẮT (Chưa áp dụng)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {!settings.enableKpiBonus && !settings.enableAllowances
                ? 'Do công ty hiện không áp dụng KPI và phụ cấp nên thưởng và phụ cấp = 0đ trong bảng lương. Bạn có thể bật bất cứ khi nào cần áp dụng trong tương lai.'
                : !settings.enableKpiBonus
                ? 'KPI & Thưởng đang tắt (thưởng KPI = 0đ). Phụ cấp đang bật.'
                : !settings.enableAllowances
                ? 'Phụ cấp đang tắt (phụ cấp = 0đ). KPI & Thưởng đang bật.'
                : 'Cả hai phân hệ KPI & Thưởng và Phụ cấp đang được tính tự động vào Tổng Gross.'}
            </p>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => toggleKpiBonus()}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
              settings.enableKpiBonus
                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {settings.enableKpiBonus ? (
              <ToggleRight className="w-4 h-4 text-white" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400" />
            )}
            <span>KPI: {settings.enableKpiBonus ? 'Đang Bật' : 'Bấm để Bật'}</span>
          </button>

          <button
            onClick={() => toggleAllowances()}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
              settings.enableAllowances
                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {settings.enableAllowances ? (
              <ToggleRight className="w-4 h-4 text-white" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400" />
            )}
            <span>Phụ cấp: {settings.enableAllowances ? 'Đang Bật' : 'Bấm để Bật'}</span>
          </button>
        </div>
      </div>

      {/* Filter summary when position or salary type filter is active */}
      {(selectedPosition !== 'all' || selectedSalaryType !== 'all') && (
        <div className="mb-3 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-blue-950">Bộ lọc đang áp dụng:</span>
            {selectedPosition !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-300 font-medium">
                Vị trí: <strong>{selectedPosition}</strong>
                <button
                  onClick={() => setSelectedPosition('all')}
                  className="text-slate-400 hover:text-red-600 font-bold ml-1 text-xs"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedSalaryType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-300 font-medium">
                Hình thức: <strong>
                  {selectedSalaryType === 'scale'
                    ? 'Thang 8 bậc'
                    : selectedSalaryType === 'negotiated_monthly'
                    ? 'Thỏa thuận trọn tháng'
                    : 'Thỏa thuận theo ngày'}
                </strong>
                <button
                  onClick={() => setSelectedSalaryType('all')}
                  className="text-slate-400 hover:text-red-600 font-bold ml-1 text-xs"
                >
                  ✕
                </button>
              </span>
            )}
            <span className="text-slate-500">({filteredItems.length} nhân sự)</span>
          </div>
          <button
            onClick={() => {
              setSelectedPosition('all');
              setSelectedSalaryType('all');
            }}
            className="text-blue-700 hover:text-blue-900 font-semibold underline text-[11px]"
          >
            Hiện tất cả
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tổng quỹ Gross</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
            {formatNumberVN(totalGross)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredItems.length} nhân sự</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Thực lĩnh (Net)</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-emerald-700">
            {formatNumberVN(totalNet)} đ
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Thực nhận về tài khoản</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">BHXH (10.5% NLĐ)</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-indigo-900">
            {formatNumberVN(totalInsurance)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Trích trừ tiền lương</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Thuế TNCN tạm tính</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-amber-800">
            {formatNumberVN(totalTax)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Biểu thuế lũy tiến</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Đã tạm ứng</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-purple-900">
            {formatNumberVN(totalAdvances)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Thu hồi trong kỳ lương</div>
        </div>
      </div>

      {/* Main Payroll Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1280px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 text-center w-10">STT</th>
                <th className="py-3 px-3 w-24">Mã NV</th>
                <th className="py-3 px-4 w-44">Họ và tên</th>
                <th className="py-3 px-3">Phòng ban</th>
                <th className="py-3 px-3">Ngạch / Bậc</th>
                <th className="py-3 px-3 text-center" title={`Công thực tế / Chuẩn kỳ ${payrollMonthNum}/${payrollYear} (01 - ${payrollDaysInMonth})`}>
                  <div>Công / Chuẩn</div>
                  <div className="text-[10px] font-normal text-slate-400 font-mono">01 → {payrollDaysInMonth}/{payrollMonthNum}</div>
                </th>
                <th className="py-3 px-3 text-right">Lương thời gian</th>
                <th className="py-3 px-3 text-right">Lương năng lực</th>
                <th className="py-3 px-3 text-right">
                  <div>OT & Phụ cấp</div>
                  {(!settings.enableAllowances || !settings.enableKpiBonus) && (
                    <div className="text-[9px] font-normal text-slate-400">
                      {!settings.enableAllowances && !settings.enableKpiBonus
                        ? '(PC & KPI: Tắt)'
                        : !settings.enableAllowances
                        ? '(Phụ cấp: Tắt)'
                        : '(KPI: Tắt)'}
                    </div>
                  )}
                </th>
                <th className="py-3 px-3 text-right font-bold text-blue-900 bg-blue-50/50">
                  Tổng Gross
                </th>
                <th className="py-3 px-3 text-right text-slate-700">BHXH (10.5%)</th>
                <th className="py-3 px-3 text-right text-slate-700">Thuế TNCN</th>
                <th className="py-3 px-3 text-right text-slate-700">Tạm ứng</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-800 bg-emerald-50/70">
                  Thực Lĩnh (Net)
                </th>
                <th className="py-3 px-3 text-center w-28">Phiếu lương</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  onClick={() => setSelectedEmployeeForSlip(item)}
                >
                  <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                    {item.employeeCode}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>{item.fullName}</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500">{item.position}</div>
                    {(() => {
                      const emp = employeeMap.get(item.employeeId);
                      return emp ? (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span title={`Số tài khoản: ${emp.bankAccount} (${emp.bankName})`}>
                            STK: <strong className="text-slate-700">{emp.bankAccount}</strong>
                          </span>
                          <span>·</span>
                          <span title={`Mã BHXH: ${emp.socialInsuranceCode || 'Chờ cấp'}`}>
                            BHXH: <strong className="text-slate-700">{emp.socialInsuranceCode || 'Chờ cấp'}</strong>
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{item.departmentName}</td>
                  <td className="py-2.5 px-3">
                    {item.salaryType === 'negotiated' ? (
                      <div>
                        {item.negotiatedType === 'daily' ? (
                          <div>
                            <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px] inline-flex items-center gap-1">
                              ⏱️ Thỏa thuận ngày
                            </span>
                            <div className="text-[10px] text-indigo-950 font-mono font-bold mt-0.5">
                              {formatNumberVN(item.negotiatedDailyRate || item.dailyRate || 0)} đ/ngày
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              ({item.actualDays} công × {formatNumberVN(item.negotiatedDailyRate || item.dailyRate || 0)}đ)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px] inline-flex items-center gap-1">
                              📅 Trọn tháng
                            </span>
                            <div className="text-[10px] text-purple-950 font-mono font-bold mt-0.5">
                              {formatNumberVN(item.negotiatedSalary || item.baseSalaryRate)} đ/tháng
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              (Khoán trọn gói)
                            </div>
                          </div>
                        )}
                        {settings.enableAllowances && item.responsibilityAllowance > 0 && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            +TN: {formatNumberVN(item.responsibilityAllowance)}đ
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium text-slate-800">{item.gradeName}</span>
                        <div className="text-[10px] text-slate-500">
                          Bậc {item.tierIndex} (HS {item.coefficient.toFixed(2)})
                          {settings.enableAllowances && item.responsibilityAllowance > 0 && (
                            <span className="text-amber-700 font-semibold ml-1">
                              · +TN: {formatNumberVN(item.responsibilityAllowance)}đ
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700">
                    <div>
                      <span className="font-semibold text-blue-900">{item.actualDays}</span> /{' '}
                      <span className="text-slate-400">{item.standardDays}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans mt-0.5">
                      (01 ➔ {payrollDaysInMonth}/{payrollMonthNum})
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                    {formatNumberVN(item.actualBaseSalary)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                    {formatNumberVN(item.actualCompetencySalary)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    <div className="font-semibold text-slate-800">
                      {formatNumberVN(
                        item.otPay +
                        item.allowanceMeal +
                        item.allowanceTransport +
                        item.performanceBonus +
                        item.allowanceFuelProject +
                        item.allowanceMealProject +
                        (item.allowanceRemoteProject || 0) +
                        item.responsibilityAllowance
                      )}
                    </div>
                    <div className="text-[10px] space-y-0.5 mt-0.5 font-sans">
                      {item.hasOvertime && (
                        <div className="text-amber-800 font-semibold bg-amber-50 px-1 py-0.2 rounded border border-amber-200 inline-block">
                          ⏱️ TC: {item.otConvertedDays || Math.round(((item.totalOtHours || item.otHoursNormal || 0) / 8) * 100) / 100} ngày ({item.totalOtHours || item.otHoursNormal}h ÷ 8h)
                        </div>
                      )}
                      {settings.enableKpiBonus && item.kpiRating && (
                        <div className="text-blue-800 font-medium bg-blue-50 px-1 py-0.2 rounded border border-blue-200 inline-block ml-1">
                          🎯 KPI {item.kpiRating} ({item.kpiScore}đ): +{formatNumberVN(item.performanceBonus)}đ
                        </div>
                      )}
                      {settings.enableAllowances && (item.allowanceFuelProject > 0 || item.allowanceMealProject > 0 || (item.allowanceRemoteProject || 0) > 0 || item.hasCompanyVehicle) && (
                        <div className="flex items-center space-x-1 flex-wrap mt-0.5">
                          {item.hasCompanyVehicle ? (
                            <span className="text-emerald-700 font-medium bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              🚗 Cấp xe (0đ)
                            </span>
                          ) : item.allowanceFuelProject > 0 ? (
                            <span className="text-amber-700 font-medium">
                              ⛽ {formatNumberVN(item.allowanceFuelProject)}đ
                            </span>
                          ) : null}
                          {item.allowanceMealProject > 0 && (
                            <span className="text-blue-700 font-medium">
                              🍱 {formatNumberVN(item.allowanceMealProject)}đ
                            </span>
                          )}
                          {(item.allowanceRemoteProject || 0) > 0 && (
                            <span className="text-purple-700 font-medium">
                              ✈️ {formatNumberVN(item.allowanceRemoteProject)}đ
                            </span>
                          )}
                        </div>
                      )}
                      {!settings.enableAllowances && !settings.enableKpiBonus && !item.hasOvertime && (
                        <span className="text-slate-400 italic">0 đ (PC & KPI tắt)</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-blue-900 bg-blue-50/30">
                    {formatNumberVN(item.grossIncome)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    {formatNumberVN(item.totalEmployeeInsurance)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700">
                    {formatNumberVN(item.personalIncomeTax)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    {formatNumberVN(item.salaryAdvanceDeduction)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-extrabold text-emerald-800 bg-emerald-50/50 text-sm">
                    {formatNumberVN(item.netIncome)}
                  </td>
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedEmployeeForSlip(item)}
                      className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Xem phiếu</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Table Footer with Summary */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                  Tổng cộng ({filteredItems.length} nhân sự):
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                  {formatNumberVN(filteredItems.reduce((s, i) => s + i.actualBaseSalary, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                  {formatNumberVN(filteredItems.reduce((s, i) => s + i.actualCompetencySalary, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                  {formatNumberVN(filteredItems.reduce((s, i) => s + (i.otPay + i.allowanceMeal + i.allowanceTransport + i.performanceBonus), 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-blue-900 bg-blue-100/50 text-xs font-extrabold">
                  {formatNumberVN(totalGross)} đ
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                  {formatNumberVN(totalInsurance)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-800 text-xs">
                  {formatNumberVN(totalTax)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                  {formatNumberVN(totalAdvances)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 bg-emerald-100/70 text-sm font-extrabold">
                  {formatNumberVN(totalNet)} đ
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payslip Modal view */}
      {selectedEmployeeForSlip && (
        <PayslipModal
          item={selectedEmployeeForSlip}
          onClose={() => setSelectedEmployeeForSlip(null)}
        />
      )}
    </div>
  );
};
