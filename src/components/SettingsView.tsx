import React, { useState, useMemo, useEffect } from 'react';
import { useHRM } from '../context/HRMContext';
import { ExcelTableId, ExcelColumnConfig, ExcelTableExportConfig } from '../types/hrm';
import { exportDynamicExcel, resolveFileName } from '../utils/dynamicExcelExporter';
import { HRConfigTab } from './HRConfigTab';
import { AddCustomFieldModal } from './AddCustomFieldModal';
import { AddExcelTableModal } from './AddExcelTableModal';
import { formatNumberVN } from '../utils/payrollCalculator';
import {
  Settings,
  FileSpreadsheet,
  Layers,
  Shield,
  Clock,
  Car,
  CheckCircle2,
  RotateCcw,
  Save,
  Download,
  Eye,
  ArrowUp,
  ArrowDown,
  Tag,
  CheckSquare,
  Square,
  HelpCircle,
  Sparkles,
  Sliders,
  DollarSign,
  FileText,
  Building,
  PlusCircle,
  Plus,
  Trash2,
  MapPin,
  X,
  User,
  Calendar,
  Briefcase,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    excelExportSettings,
    updateExcelGlobalSettings,
    updateExcelTableConfig,
    updateExcelColumnConfig,
    addExcelColumn,
    removeExcelColumn,
    reorderExcelColumns,
    resetExcelConfig,
    addExcelTable,
    deleteExcelTable,
    payrollItems,
    timesheets,
    employees,
    reviews,
    insurances,
    projects,
    currentMonth,
    departments,
    settings,
    showToast,
  } = useHRM();

  const [activeSettingsTab, setActiveSettingsTab] = useState<'excel' | 'tax_insurance' | 'allowances' | 'company_rules'>('excel');
  const [selectedTableId, setSelectedTableId] = useState<string>('payroll');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<{ id: string; name: string; isCustom?: boolean } | null>(null);

  // Fallback to first available table if current selectedTableId was deleted or doesn't exist
  useEffect(() => {
    const tableKeys = Object.keys(excelExportSettings.tables);
    if (tableKeys.length > 0 && !excelExportSettings.tables[selectedTableId]) {
      setSelectedTableId(tableKeys[0]);
    }
  }, [excelExportSettings.tables, selectedTableId]);

  // Current table config draft
  const currentTableConfig: ExcelTableExportConfig =
    excelExportSettings.tables[selectedTableId] ||
    excelExportSettings.tables[Object.keys(excelExportSettings.tables)[0]] || {
      tableId: 'payroll',
      tableName: 'Bảng Thanh Toán Lương & Thưởng',
      fileNameTemplate: 'Bang_Luong_{month}_{company}',
      sheetName: 'BangLuong',
      tableTitle: 'BẢNG THANH TOÁN TIỀN LƯƠNG',
      subtitles: [],
      tableStyle: 'accounting',
      includeSubtitles: true,
      includeSummaryRow: true,
      includeSignatures: true,
      autoColumnWidth: true,
      useCustomNumberFormat: true,
      columns: [],
    };

  // Local draft for table name & template for instant editing
  const [templateDraft, setTemplateDraft] = useState(currentTableConfig.fileNameTemplate);
  const [sheetNameDraft, setSheetNameDraft] = useState(currentTableConfig.sheetName);
  const [tableTitleDraft, setTableTitleDraft] = useState(currentTableConfig.tableTitle);

  // Sync draft when selected table changes
  useEffect(() => {
    if (currentTableConfig) {
      setTemplateDraft(currentTableConfig.fileNameTemplate);
      setSheetNameDraft(currentTableConfig.sheetName);
      setTableTitleDraft(currentTableConfig.tableTitle);
    }
  }, [selectedTableId, currentTableConfig]);

  // Insert token to file name template
  const insertToken = (token: string) => {
    setTemplateDraft((prev) => `${prev}_${token}`);
    updateExcelTableConfig(selectedTableId, {
      fileNameTemplate: `${templateDraft}_${token}`,
    });
  };

  // Preview file name resolved
  const previewResolvedFileName = useMemo(() => {
    return resolveFileName(templateDraft, selectedTableId, {
      month: currentMonth,
      companyName: excelExportSettings.companyName,
      companyShortName: excelExportSettings.companyShortName,
    });
  }, [templateDraft, selectedTableId, currentMonth, excelExportSettings]);

  // Count active columns
  const activeColumnsCount = currentTableConfig.columns.filter((c) => c.enabled).length;

  // Helper to compute project days and allowances for any employee in the selected month
  const getEmployeeProjectBreakdown = (empId: string, employeeCode?: string) => {
    const ts = timesheets.find((t) => t.employeeId === empId && t.month === currentMonth);
    const pItem = payrollItems.find((p) => p.employeeId === empId);
    const emp = employees.find((e) => e.id === empId || e.code === employeeCode);

    const stats: Record<string, any> = {};
    const summaryList: string[] = [];

    projects.forEach((proj) => {
      let days = 0;
      const found = pItem?.projectAllowanceDetails?.find((d) => d.projectId === proj.id || d.projectCode === proj.code);
      if (found && found.daysWorked > 0) {
        days = found.daysWorked;
      } else if (ts?.dailySymbols) {
        Object.values(ts.dailySymbols).forEach((sym) => {
          if (!sym) return;
          const s = sym.trim().toUpperCase();
          if (s === proj.symbolFull.toUpperCase() || s === proj.code.toUpperCase() || s === proj.id.toUpperCase()) {
            days += 1;
          } else if (s === proj.symbolHalf.toUpperCase() || s === `${proj.code}/2`.toUpperCase()) {
            days += 0.5;
          }
        });
      } else if (emp?.projectAllowances?.[proj.id]?.assigned) {
        days = Math.max(1, Math.min(ts?.actualWorkingDays || 22, 22));
      }

      stats[`proj_days_${proj.id}`] = days;
      stats[`project_days_${proj.id}`] = days;
      stats[`proj_fuel_${proj.id}`] = found ? found.fuelAllowance : 0;
      stats[`proj_meal_${proj.id}`] = found ? found.mealAllowance : 0;
      stats[`proj_remote_${proj.id}`] = found ? found.remoteAllowance : 0;
      stats[`proj_total_${proj.id}`] = found ? found.totalAllowance : 0;
      stats[`proj_vehicle_${proj.id}`] = emp?.projectAllowances?.[proj.id]?.hasCompanyVehicle ? 'Cấp xe (0đ)' : 'Tự túc xe';

      if (days > 0) {
        summaryList.push(`${proj.name || proj.code}: ${days} ngày`);
      }
    });

    stats['all_assigned_projects'] = summaryList.length > 0 ? summaryList.join('; ') : 'Chưa phân bổ';
    return { stats, summaryList };
  };

  // Get raw sample dataset for the current selected table
  const rawDataset = useMemo(() => {
    const curTable = excelExportSettings.tables[selectedTableId];
    const sourceKey = curTable?.baseSource || selectedTableId;
    switch (sourceKey) {
      case 'payroll':
        return payrollItems.map((p, idx) => {
          const emp = employees.find((e) => e.id === p.employeeId || e.code === p.employeeCode);
          const { stats } = getEmployeeProjectBreakdown(p.employeeId, p.employeeCode);
          return {
            stt: idx + 1,
            employeeCode: p.employeeCode,
            fullName: p.fullName,
            departmentName: p.departmentName,
            position: p.position,
            positionRank: emp?.positionRank || 'C',
            socialInsuranceCode: emp?.socialInsuranceCode || (p.employeeCode ? `792${idx}849` : ''),
            bankAccount: emp?.bankAccount || `190${idx}8472910`,
            bankName: emp?.bankName || 'Techcombank',
            salaryType: p.salaryType === 'negotiated' ? (p.negotiatedType === 'daily' ? 'Thỏa thuận ngày' : 'Thỏa thuận trọn tháng') : 'Thang bậc',
            gradeName: p.gradeName,
            tierIndex: p.tierIndex,
            coefficient: p.coefficient,
            baseSalaryRate: p.baseSalaryRate,
            negotiatedDailyRate: p.negotiatedDailyRate || p.dailyRate || 0,
            standardDays: p.standardDays,
            actualDays: p.actualDays,
            actualBaseSalary: p.actualBaseSalary,
            actualCompetencySalary: p.actualCompetencySalary,
            responsibilityAllowance: p.responsibilityAllowance,
            allowanceFuelProject: p.allowanceFuelProject,
            allowanceMealProject: p.allowanceMealProject,
            allowanceRemoteProject: p.allowanceRemoteProject || 0,
            companyVehicle: p.hasCompanyVehicle ? 'Cấp xe (0đ)' : 'Tự túc xe',
            otHours: p.totalOtHours || p.otHoursNormal || 0,
            otConvertedDays: p.otConvertedDays || 0,
            otPay: p.otPay,
            kpiRating: p.kpiRating || 'B',
            performanceBonus: p.performanceBonus,
            grossIncome: p.grossIncome,
            totalEmployeeInsurance: p.totalEmployeeInsurance,
            personalIncomeTax: p.personalIncomeTax,
            salaryAdvanceDeduction: p.salaryAdvanceDeduction,
            netIncome: p.netIncome,
            identityCard: emp?.identityCard || '079200000000',
            hometown: emp?.hometown || 'TP. Hồ Chí Minh',
            currentAddress: emp?.currentAddress || 'Quận 1, TP.HCM',
            phone: emp?.phone || '0901234567',
            email: emp?.email || 'nv@congty.com',
            joinDate: emp?.joinDate || '2023-01-15',
            dependentsCount: emp?.dependentsCount || 0,
            status: emp?.status === 'active' ? 'Chính thức' : 'Thử việc',
            ...stats,
          };
        });
      case 'attendance':
        return timesheets.map((ts, idx) => {
          const emp = employees.find((e) => e.id === ts.employeeId);
          const dept = departments.find((d) => d.id === emp?.departmentId);
          const { stats } = getEmployeeProjectBreakdown(ts.employeeId, emp?.code);
          return {
            stt: idx + 1,
            code: emp?.code || `NV-${idx + 1}`,
            fullName: emp?.fullName || 'Nhân sự',
            departmentName: dept?.name || '',
            position: emp?.position || '',
            positionRank: emp?.positionRank || 'C',
            standardDays: ts.standardWorkingDays,
            actualDays: ts.actualWorkingDays,
            paidLeaveDays: ts.paidLeaveDays,
            unpaidLeaveDays: ts.unpaidLeaveDays,
            totalPaidDays: ts.actualWorkingDays + ts.paidLeaveDays,
            totalOtHours: ts.totalOtHours || ts.otHoursNormal || 0,
            otConvertedDays: Math.round(((ts.totalOtHours || ts.otHoursNormal || 0) / 8) * 100) / 100,
            fuelToggleStatus: ts.hasFuelAllowance !== false ? 'BẬT (Tính xăng)' : 'TẮT (0đ)',
            motorcycleDays: Object.values(ts.dailyVehicle || {}).filter((v) => v === 'motorcycle').length,
            carDays: Object.values(ts.dailyVehicle || {}).filter((v) => v === 'car').length,
            totalDistanceKm: ts.totalFuelDistanceKm || (Object.values(ts.dailyVehicle || {}).filter((v) => v === 'motorcycle').length * 20),
            fuelAllowanceAmt: ts.totalFuelAllowanceAmount || (Object.values(ts.dailyVehicle || {}).filter((v) => v === 'motorcycle').length * 20 * 1800),
            identityCard: emp?.identityCard || '',
            phone: emp?.phone || '',
            email: emp?.email || '',
            bankAccount: emp?.bankAccount || '',
            bankName: emp?.bankName || '',
            hometown: emp?.hometown || '',
            joinDate: emp?.joinDate || '',
            dependentsCount: emp?.dependentsCount || 0,
            status: emp?.status === 'active' ? 'Chính thức' : 'Thử việc',
            ...stats,
          };
        });
      case 'employees':
        return employees.map((emp, idx) => {
          const dept = departments.find((d) => d.id === emp.departmentId);
          const { stats } = getEmployeeProjectBreakdown(emp.id, emp.code);
          return {
            stt: idx + 1,
            code: emp.code,
            fullName: emp.fullName,
            departmentName: dept?.name || '',
            position: emp.position,
            positionRank: emp.positionRank || 'C',
            salaryTypeDisplay: emp.salaryType === 'negotiated' ? (emp.negotiatedType === 'daily' ? 'Thỏa thuận ngày' : 'Thỏa thuận tháng') : `Bậc ${emp.tierIndex}`,
            baseSalaryDisplay: emp.salaryType === 'negotiated' ? (emp.negotiatedSalary || 15000000) : 10000000,
            responsibilityAllowance: emp.responsibilityAllowance || 0,
            assignedProjects: stats['all_assigned_projects'] || 'BC, HT2',
            companyVehicle: 'Tự túc xe',
            socialInsuranceCode: emp.socialInsuranceCode || '',
            identityCard: emp.identityCard,
            phone: emp.phone,
            email: emp.email,
            bankAccount: emp.bankAccount,
            bankName: emp.bankName,
            hometown: emp.hometown || '',
            currentAddress: emp.currentAddress || '',
            joinDate: emp.joinDate,
            dependentsCount: emp.dependentsCount,
            status: emp.status === 'active' ? 'Chính thức' : 'Thử việc',
            ...stats,
          };
        });
      case 'kpi':
        return reviews.map((rev, idx) => {
          const emp = employees.find((e) => e.id === rev.employeeId);
          const dept = departments.find((d) => d.id === emp?.departmentId);
          return {
            stt: idx + 1,
            code: emp?.code || `NV-${idx + 1}`,
            fullName: emp?.fullName || 'Nhân sự',
            departmentName: dept?.name || '',
            position: emp?.position || '',
            taskCompletion: rev.criteria?.taskCompletion || 85,
            qualitySafety: rev.criteria?.qualitySafety || 85,
            disciplineAttendance: rev.criteria?.disciplineAttendance || 85,
            initiativeCollaboration: rev.criteria?.initiativeCollaboration || 85,
            kpiScore: rev.kpiScore,
            rating: rev.rating,
            bonusMultiplier: rev.bonusMultiplier,
            targetBonusAmount: rev.targetBonusAmount || 2000000,
            actualBonusAmount: rev.actualBonusAmount || 2000000,
            evaluatorName: rev.evaluatorName || 'Ban Giám Đốc',
            comments: rev.comments || '',
          };
        });
      case 'insurance':
        return insurances.map((ins, idx) => {
          const emp = employees.find((e) => e.id === ins.employeeId);
          const nldAmt = Math.round(ins.insuranceSalary * 0.105);
          const ctyAmt = Math.round(ins.insuranceSalary * 0.215);
          return {
            stt: idx + 1,
            code: emp?.code || `NV-${idx + 1}`,
            fullName: emp?.fullName || 'Nhân sự',
            position: emp?.position || '',
            insuranceBookNumber: ins.insuranceBookNumber,
            hospitalRegistration: ins.hospitalRegistration,
            insuranceSalary: ins.insuranceSalary,
            employeeBhxh: Math.round(ins.insuranceSalary * 0.08),
            employeeBhyt: Math.round(ins.insuranceSalary * 0.015),
            employeeBhtn: Math.round(ins.insuranceSalary * 0.01),
            totalEmployeeAmt: nldAmt,
            employerAmt: ctyAmt,
            totalContribution: nldAmt + ctyAmt,
            status: ins.status === 'active' ? 'Đang đóng' : 'Chưa đóng',
          };
        });
      case 'projects':
        return projects.map((p, idx) => ({
          stt: idx + 1,
          name: p.name,
          code: p.code || p.symbolFull,
          distanceKm: p.distanceKm,
          fuelAllowance: p.fuelAllowance,
          remoteTier: p.remoteAllowanceTier !== 'None' ? `Cấp ${p.remoteAllowanceTier}` : '-',
          location: p.location || '',
          managerName: p.managerName || '',
          status: p.status === 'active' ? 'Đang thi công' : 'Hoàn thành',
        }));
      default:
        // Default to payroll source for custom tables
        return payrollItems.map((p, idx) => {
          const emp = employees.find((e) => e.id === p.employeeId || e.code === p.employeeCode);
          const { stats } = getEmployeeProjectBreakdown(p.employeeId, p.employeeCode);
          return {
            stt: idx + 1,
            employeeCode: p.employeeCode,
            fullName: p.fullName,
            departmentName: p.departmentName,
            position: p.position,
            positionRank: emp?.positionRank || 'C',
            socialInsuranceCode: emp?.socialInsuranceCode || (p.employeeCode ? `792${idx}849` : ''),
            bankAccount: emp?.bankAccount || `190${idx}8472910`,
            bankName: emp?.bankName || 'Techcombank',
            salaryType: p.salaryType === 'negotiated' ? (p.negotiatedType === 'daily' ? 'Thỏa thuận ngày' : 'Thỏa thuận trọn tháng') : 'Thang bậc',
            gradeName: p.gradeName,
            tierIndex: p.tierIndex,
            coefficient: p.coefficient,
            baseSalaryRate: p.baseSalaryRate,
            negotiatedDailyRate: p.negotiatedDailyRate || p.dailyRate || 0,
            standardDays: p.standardDays,
            actualDays: p.actualDays,
            actualBaseSalary: p.actualBaseSalary,
            actualCompetencySalary: p.actualCompetencySalary,
            responsibilityAllowance: p.responsibilityAllowance,
            allowanceFuelProject: p.allowanceFuelProject,
            allowanceMealProject: p.allowanceMealProject,
            allowanceRemoteProject: p.allowanceRemoteProject || 0,
            companyVehicle: p.hasCompanyVehicle ? 'Cấp xe (0đ)' : 'Tự túc xe',
            otHours: p.totalOtHours || p.otHoursNormal || 0,
            otConvertedDays: p.otConvertedDays || 0,
            otPay: p.otPay,
            kpiRating: p.kpiRating || 'B',
            performanceBonus: p.performanceBonus,
            grossIncome: p.grossIncome,
            totalEmployeeInsurance: p.totalEmployeeInsurance,
            personalIncomeTax: p.personalIncomeTax,
            salaryAdvanceDeduction: p.salaryAdvanceDeduction,
            netIncome: p.netIncome,
            identityCard: emp?.identityCard || '079200000000',
            hometown: emp?.hometown || 'TP. Hồ Chí Minh',
            currentAddress: emp?.currentAddress || 'Quận 1, TP.HCM',
            phone: emp?.phone || '0901234567',
            email: emp?.email || 'nv@congty.com',
            joinDate: emp?.joinDate || '2023-01-15',
            dependentsCount: emp?.dependentsCount || 0,
            status: emp?.status === 'active' ? 'Chính thức' : 'Thử việc',
            ...stats,
          };
        });
    }
  }, [selectedTableId, currentTableConfig?.baseSource, payrollItems, timesheets, employees, reviews, insurances, projects, departments]);

  // Execute actual test export
  const handleTestExport = () => {
    const res = exportDynamicExcel(
      {
        ...currentTableConfig,
        fileNameTemplate: templateDraft,
        sheetName: sheetNameDraft,
        tableTitle: tableTitleDraft,
      },
      excelExportSettings,
      rawDataset,
      {
        month: currentMonth,
        companyName: excelExportSettings.companyName,
        companyShortName: excelExportSettings.companyShortName,
      }
    );
    showToast(`Đã xuất file Excel mẫu thành công: ${res.fileName} (${res.colCount} cột, ${res.rowCount} dòng)!`);
  };

  // Toggle all columns
  const handleToggleAllColumns = (enabled: boolean) => {
    const updated = currentTableConfig.columns.map((col) => ({ ...col, enabled }));
    updateExcelTableConfig(selectedTableId, { columns: updated });
  };

  // Save changes to table configuration
  const handleSaveConfig = () => {
    updateExcelTableConfig(selectedTableId, {
      fileNameTemplate: templateDraft,
      sheetName: sheetNameDraft,
      tableTitle: tableTitleDraft,
    });
    showToast(`Đã lưu toàn bộ cấu hình xuất Excel cho ${currentTableConfig.tableName}!`);
  };

  // Dynamic table list from excelExportSettings.tables
  const tablesList = useMemo(() => {
    return Object.keys(excelExportSettings.tables).map((id) => {
      const cfg = excelExportSettings.tables[id];
      const source = cfg?.baseSource || id;
      let count = 0;
      switch (source) {
        case 'payroll':
          count = payrollItems.length;
          break;
        case 'attendance':
          count = timesheets.length;
          break;
        case 'employees':
          count = employees.length;
          break;
        case 'kpi':
          count = reviews.length;
          break;
        case 'insurance':
          count = insurances.length;
          break;
        case 'projects':
          count = projects.length;
          break;
        default:
          count = payrollItems.length;
          break;
      }
      return {
        id,
        name: cfg?.tableName || id,
        count,
        isCustom: Boolean(cfg?.isCustom || !['payroll', 'attendance', 'employees', 'kpi', 'insurance', 'projects'].includes(id)),
      };
    });
  }, [
    excelExportSettings.tables,
    payrollItems.length,
    timesheets.length,
    employees.length,
    reviews.length,
    insurances.length,
    projects.length,
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-900">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Cài Đặt Hệ Thống & Tùy Biến Xuất Dữ Liệu Excel
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                  Động & Linh Hoạt
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tùy biến mẫu tên file xuất, dạng bảng, chọn lọc và sắp xếp cột dữ liệu xuất ra file Excel (.xlsx) theo nhu cầu doanh nghiệp.
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => resetExcelConfig()}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Khôi phục toàn bộ cấu hình xuất Excel về ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục tất cả mặc định</span>
          </button>
        </div>
      </div>

      {/* Primary Sub Tabs */}
      <div className="flex items-center space-x-1 mb-5 bg-slate-200/80 p-1 rounded-lg max-w-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSettingsTab('excel')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeSettingsTab === 'excel'
              ? 'bg-white text-emerald-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Cấu hình Xuất Excel Động</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('tax_insurance')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeSettingsTab === 'tax_insurance'
              ? 'bg-white text-blue-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Thuế TNCN & BHXH</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('company_rules')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeSettingsTab === 'company_rules'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4 text-slate-600" />
          <span>Thông Tin Doanh Nghiệp</span>
        </button>
      </div>

      {/* TAB 1: CẤU HÌNH XUẤT EXCEL ĐỘNG */}
      {activeSettingsTab === 'excel' && (
        <div className="space-y-6">
          {/* Table Selector Pills */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>Chọn Bảng Dữ Liệu Cần Cấu Hình Xuất Excel</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-normal">
                  {tablesList.length} bảng
                </span>
              </label>

              {/* Action buttons: Thêm bảng & Xóa bảng */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTableModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Thêm bảng dữ liệu xuất Excel mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Bảng Mới</span>
                </button>

                {currentTableConfig && (
                  <button
                    type="button"
                    onClick={() =>
                      setTableToDelete({
                        id: selectedTableId,
                        name: currentTableConfig.tableName,
                        isCustom: currentTableConfig.isCustom,
                      })
                    }
                    disabled={Object.keys(excelExportSettings.tables).length <= 1}
                    className="px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={`Xóa bảng "${currentTableConfig.tableName}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa bảng này</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {tablesList.map((tbl) => {
                const isSelected = selectedTableId === tbl.id;
                return (
                  <div key={tbl.id} className="relative group inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center space-x-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs pr-2'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {tbl.isCustom && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`}
                          title="Bảng tùy biến do người dùng tạo"
                        />
                      )}
                      <span>{tbl.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {tbl.count} dòng
                      </span>
                    </button>
                    {tbl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTableToDelete({
                            id: tbl.id,
                            name: tbl.name,
                            isCustom: true,
                          });
                        }}
                        className="ml-1 p-1 rounded hover:bg-rose-100 hover:text-rose-700 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title={`Xóa bảng "${tbl.name}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Config */}
            <div className="lg:col-span-2 space-y-5">
              {/* SECTION 1: TÙY CHỈNH TÊN FILE XUẤT ĐỘNG */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    1. Tùy Chỉnh Đặt Tên File Xuất Động
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Đuôi tự động: .xlsx
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mẫu Tên File Xuất (Hỗ trợ biến động {}):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={templateDraft}
                      onChange={(e) => {
                        setTemplateDraft(e.target.value);
                        updateExcelTableConfig(selectedTableId, {
                          fileNameTemplate: e.target.value,
                        });
                      }}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-emerald-600 font-mono font-bold text-slate-900"
                      placeholder="VD: Bang_Luong_{month}_{date}"
                    />
                    <button
                      onClick={handleSaveConfig}
                      className="px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu tên</span>
                    </button>
                  </div>
                </div>

                {/* Quick Tokens Click-to-Insert */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 mr-2">Bấm để chèn biến:</span>
                  <div className="inline-flex items-center gap-1.5 flex-wrap mt-1">
                    <button
                      type="button"
                      onClick={() => insertToken('{month}')}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Chèn kỳ tháng (VD: 2026-10)"
                    >
                      +&#123;month&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToken('{date}')}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Chèn ngày hiện tại (VD: 2026-10-22)"
                    >
                      +&#123;date&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToken('{company}')}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                      title="Chèn tên viết tắt công ty (VD: CP_XayDung)"
                    >
                      +&#123;company&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToken('{year}')}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Chèn năm hiện tại (VD: 2026)"
                    >
                      +&#123;year&#125;
                    </button>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-950">
                      Tên file thực tế khi tải về:
                    </span>
                    <code className="text-xs font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {previewResolvedFileName}
                    </code>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TÙY CHỈNH DẠNG BẢNG & BỐ CỤC EXCEL */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-700" />
                    2. Tùy Chỉnh Dạng Bảng & Bố Cục Trang Tính
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    SheetJS .xlsx
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên Sheet (Worksheet Name):
                    </label>
                    <input
                      type="text"
                      maxLength={31}
                      value={sheetNameDraft}
                      onChange={(e) => {
                        setSheetNameDraft(e.target.value);
                        updateExcelTableConfig(selectedTableId, {
                          sheetName: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white font-mono"
                      placeholder="VD: BangLuong"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tiêu Đề In Hoa Đầu Trang:
                    </label>
                    <input
                      type="text"
                      value={tableTitleDraft}
                      onChange={(e) => {
                        setTableTitleDraft(e.target.value);
                        updateExcelTableConfig(selectedTableId, {
                          tableTitle: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white font-bold text-slate-900 uppercase"
                      placeholder="VD: BẢNG THANH TOÁN TIỀN LƯƠNG"
                    />
                  </div>
                </div>

                {/* 3 Layout Styles (Radio Cards) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Kiểu Bố Cục Dạng Bảng:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Style 1: Standard */}
                    <label
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        currentTableConfig.tableStyle === 'standard'
                          ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tableStyleOption"
                        checked={currentTableConfig.tableStyle === 'standard'}
                        onChange={() => updateExcelTableConfig(selectedTableId, { tableStyle: 'standard' })}
                        className="sr-only"
                      />
                      <div className="font-bold text-xs text-blue-950 flex items-center justify-between">
                        <span>🏢 Chuẩn Doanh Nghiệp</span>
                        {currentTableConfig.tableStyle === 'standard' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Có tiêu đề công ty, phụ đề ngày tháng, định dạng lưới chuẩn và thẩm mỹ cao.
                      </p>
                    </label>

                    {/* Style 2: Accounting */}
                    <label
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        currentTableConfig.tableStyle === 'accounting'
                          ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tableStyleOption"
                        checked={currentTableConfig.tableStyle === 'accounting'}
                        onChange={() => updateExcelTableConfig(selectedTableId, { tableStyle: 'accounting' })}
                        className="sr-only"
                      />
                      <div className="font-bold text-xs text-emerald-950 flex items-center justify-between">
                        <span>📑 Kế Toán & Ký Duyệt</span>
                        {currentTableConfig.tableStyle === 'accounting' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Tự động thêm hàng TỔNG CỘNG ở cuối và 3 chữ ký: Lập biểu, Kế toán, Giám đốc.
                      </p>
                    </label>

                    {/* Style 3: Raw Data */}
                    <label
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        currentTableConfig.tableStyle === 'raw'
                          ? 'bg-purple-50/80 border-purple-400 ring-1 ring-purple-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tableStyleOption"
                        checked={currentTableConfig.tableStyle === 'raw'}
                        onChange={() => updateExcelTableConfig(selectedTableId, { tableStyle: 'raw' })}
                        className="sr-only"
                      />
                      <div className="font-bold text-xs text-purple-950 flex items-center justify-between">
                        <span>📊 Dữ Liệu Thô (Import ERP)</span>
                        {currentTableConfig.tableStyle === 'raw' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Chỉ 1 dòng header và data, không phụ đề, tối ưu để nhập khẩu vào MISA, FAST, SAP.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Additional Checkbox Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTableConfig.autoColumnWidth}
                      onChange={(e) => updateExcelTableConfig(selectedTableId, { autoColumnWidth: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tự động căn chỉnh độ rộng cột theo nội dung (Auto-fit Width)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTableConfig.includeSummaryRow}
                      onChange={(e) => updateExcelTableConfig(selectedTableId, { includeSummaryRow: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tính và thêm hàng TỔNG CỘNG ở cuối bảng</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTableConfig.includeSignatures}
                      onChange={(e) => updateExcelTableConfig(selectedTableId, { includeSignatures: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Thêm phần chữ ký xác nhận (Người lập biểu, Kế toán trưởng, Giám đốc)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTableConfig.includeSubtitles}
                      onChange={(e) => updateExcelTableConfig(selectedTableId, { includeSubtitles: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Hiển thị thông tin phụ đề (Công ty, kỳ thanh toán, ngày xuất)</span>
                  </label>
                </div>
              </div>

              {/* SECTION 3: CỘT DỮ LIỆU LẤY TÙY BIẾN ĐỘNG */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      3. Cột Dữ Liệu Lấy Tùy Biến Động
                      <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                        {activeColumnsCount} / {currentTableConfig.columns.length} cột đã chọn
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bật/tắt cột dữ liệu cần xuất, tùy biến tên tiêu đề cột, bấm ▲ ▼ để đổi thứ tự xuất, hoặc bấm <strong>+ Thêm trường dữ liệu</strong> để bổ sung bất kỳ thông tin nào (công trình nhân sự đi làm, số ngày công tại công trình, v.v.).
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 self-start sm:self-auto flex-wrap gap-y-1">
                    <button
                      type="button"
                      onClick={() => setIsAddColumnModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-blue-800 active:scale-95"
                      title="Thêm cột dữ liệu mới: công trình, số ngày làm việc tại công trình, phụ cấp, hồ sơ,..."
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Thêm trường dữ liệu</span>
                    </button>
                    <button
                      onClick={() => handleToggleAllColumns(true)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      onClick={() => handleToggleAllColumns(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      Bỏ chọn hết
                    </button>
                    <button
                      onClick={() => resetExcelConfig(selectedTableId)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors cursor-pointer"
                      title="Khôi phục thứ tự và tên cột mặc định của bảng này"
                    >
                      Mặc định
                    </button>
                  </div>
                </div>

                {/* Column Table / List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">Bật</th>
                        <th className="py-2 px-2 text-center w-12">Thứ tự</th>
                        <th className="py-2 px-3">Tên trường dữ liệu (Gốc)</th>
                        <th className="py-2 px-3">Tên nhãn hiển thị trong Excel (Tùy biến)</th>
                        <th className="py-2 px-3 text-center w-24">Kiểu dữ liệu</th>
                        <th className="py-2 px-2 text-center w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentTableConfig.columns.map((col, idx) => {
                        return (
                          <tr
                            key={col.id}
                            className={`transition-colors ${
                              col.enabled ? 'bg-white hover:bg-emerald-50/20' : 'bg-slate-50/60 opacity-60'
                            }`}
                          >
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={col.enabled}
                                onChange={(e) => updateExcelColumnConfig(selectedTableId, col.id, { enabled: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-400 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-800">{col.defaultLabel}</span>
                                {col.isCustom && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      col.category === 'project'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : col.category === 'employee'
                                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                                        : col.category === 'attendance'
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                        : 'bg-purple-100 text-purple-900 border-purple-300'
                                    }`}
                                  >
                                    {col.category === 'project'
                                      ? '🏗️ Công trình'
                                      : col.category === 'employee'
                                      ? '👤 Nhân sự'
                                      : col.category === 'attendance'
                                      ? '⏱️ Chấm công'
                                      : '✨ Tùy biến'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">{col.id}</div>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={col.customLabel !== undefined ? col.customLabel : col.defaultLabel}
                                onChange={(e) => updateExcelColumnConfig(selectedTableId, col.id, { customLabel: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-emerald-600 font-medium"
                                placeholder={col.defaultLabel}
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                  col.type === 'currency'
                                    ? 'bg-amber-100 text-amber-900'
                                    : col.type === 'number'
                                    ? 'bg-blue-100 text-blue-900'
                                    : col.type === 'date'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {col.type === 'currency' ? 'Tiền VNĐ' : col.type === 'number' ? 'Số' : col.type === 'date' ? 'Ngày' : 'Chuỗi'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => reorderExcelColumns(selectedTableId, idx, idx - 1)}
                                  className={`p-1 rounded transition-colors ${
                                    idx === 0
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer'
                                  }`}
                                  title="Di chuyển lên trên"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === currentTableConfig.columns.length - 1}
                                  onClick={() => reorderExcelColumns(selectedTableId, idx, idx + 1)}
                                  className={`p-1 rounded transition-colors ${
                                    idx === currentTableConfig.columns.length - 1
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer'
                                  }`}
                                  title="Di chuyển xuống dưới"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                {col.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => removeExcelColumn(selectedTableId, col.id)}
                                    className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Xóa cột tùy biến này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Col: Live Actions, Summary & Test Download */}
            <div className="space-y-5">
              {/* Card 1: Immediate Test Export */}
              <div className="bg-linear-to-br from-emerald-800 to-teal-900 text-white p-5 rounded-xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Xuất Thử Nghiệm Ngay
                  </span>
                  <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                </div>

                <div>
                  <h4 className="font-bold text-base text-white">
                    {currentTableConfig.tableName}
                  </h4>
                  <p className="text-xs text-emerald-100/90 mt-1">
                    Bấm để tải về máy tính file Excel (.xlsx) chuẩn theo đúng các cột và cấu hình vừa thiết lập.
                  </p>
                </div>

                <div className="p-3 bg-black/25 rounded-lg border border-white/15 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-emerald-200">Số cột lấy:</span>
                    <strong className="font-mono text-white">{activeColumnsCount} cột</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200">Số dòng dữ liệu:</span>
                    <strong className="font-mono text-white">{rawDataset.length} dòng</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200">Bố cục:</span>
                    <strong className="text-white">
                      {currentTableConfig.tableStyle === 'accounting'
                        ? 'Kế toán & Ký duyệt'
                        : currentTableConfig.tableStyle === 'raw'
                        ? 'Dữ liệu thô (ERP)'
                        : 'Chuẩn Doanh nghiệp'}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={handleTestExport}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải File Excel Này Ngay (.xlsx)</span>
                </button>

                <button
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-xs border border-white/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isPreviewOpen ? 'Ẩn bảng xem trước' : 'Xem trước 5 dòng dữ liệu mẫu'}</span>
                </button>
              </div>

              {/* Card 2: Quick Tips */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-700" />
                  Hướng Dẫn Cấu Hình Hiệu Quả:
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600 text-[11px]">
                  <li>
                    <strong>Tùy chỉnh tên cột:</strong> Gõ trực tiếp vào ô nhãn cột để đổi tên hiển thị (ví dụ: đổi <em>Lương cơ bản thực tế</em> thành <em>Lương chính</em>).
                  </li>
                  <li>
                    <strong>Sắp xếp thứ tự:</strong> Bấm mũi tên ▲ ▼ để đưa các cột quan trọng (Họ tên, Thực lĩnh, Số tài khoản) lên đầu bảng.
                  </li>
                  <li>
                    <strong>Dạng thô (Raw Data):</strong> Khi cần nộp file cho phần mềm kế toán khác (MISA, SAP), hãy chọn <em>Dạng dữ liệu thô</em> để loại bỏ các dòng tiêu đề trên cùng.
                  </li>
                  <li>
                    <strong>Đồng bộ tự động:</strong> Cấu hình bạn lưu tại đây sẽ được áp dụng trực tiếp cho các nút xuất Excel ở tab Lương, Chấm công và Nhân sự.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Collapsible Live Data Preview Table */}
          {isPreviewOpen && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Bảng Xem Trước 5 Dòng Dữ Liệu Thực Tế Theo Cấu Hình Đã Chọn
                </h4>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Đóng lại
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#1E3A8A] text-white">
                    <tr>
                      {currentTableConfig.columns
                        .filter((c) => c.enabled)
                        .map((col) => (
                          <th key={col.id} className="py-2.5 px-3 border-r border-blue-800 whitespace-nowrap font-bold">
                            {col.customLabel?.trim() || col.defaultLabel}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawDataset.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {currentTableConfig.columns
                          .filter((c) => c.enabled)
                          .map((col) => {
                            const val = col.id === 'stt' ? rIdx + 1 : (row as Record<string, any>)[col.id];
                            return (
                              <td
                                key={col.id}
                                className={`py-2 px-3 border-r border-slate-100 whitespace-nowrap ${
                                  col.type === 'currency'
                                    ? 'text-right font-mono font-semibold text-slate-800'
                                    : col.type === 'number'
                                    ? 'text-center font-mono'
                                    : ''
                                }`}
                              >
                                {col.type === 'currency' && typeof val === 'number'
                                  ? `${formatNumberVN(val)} đ`
                                  : String(val ?? '')}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: THUẾ TNCN & BẢO HIỂM (EMBEDDED HR CONFIG TAB) */}
      {activeSettingsTab === 'tax_insurance' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-1">
          <HRConfigTab />
        </div>
      )}

      {/* TAB 3: THÔNG TIN DOANH NGHIỆP */}
      {activeSettingsTab === 'company_rules' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs max-w-2xl mx-auto space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-700" />
            Thông Tin Nhận Diện Doanh Nghiệp Trên Báo Cáo Xuất Excel
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên đầy đủ của Công ty / Doanh nghiệp:
              </label>
              <input
                type="text"
                value={excelExportSettings.companyName}
                onChange={(e) => updateExcelGlobalSettings({ companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white font-medium"
                placeholder="VD: Công ty Cổ phần Xây dựng"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên viết tắt dùng cho mã file export (Token &#123;company&#125;):
              </label>
              <input
                type="text"
                value={excelExportSettings.companyShortName}
                onChange={(e) => updateExcelGlobalSettings({ companyShortName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white font-mono font-bold"
                placeholder="VD: CP_XayDung"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => showToast('Đã lưu thông tin doanh nghiệp thành công!')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-2xs text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Cập nhật thông tin doanh nghiệp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM TRƯỜNG DỮ LIỆU TÙY BIẾN VÀO BẢNG XUẤT EXCEL */}
      <AddCustomFieldModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        selectedTableId={selectedTableId}
        projects={projects}
        existingColumns={currentTableConfig.columns}
        onAddColumn={(newCol) => addExcelColumn(selectedTableId, newCol)}
      />

      {/* MODAL THÊM BẢNG DỮ LIỆU XUẤT EXCEL MỚI */}
      <AddExcelTableModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        onAddTable={(newTable) => {
          addExcelTable(newTable);
          setSelectedTableId(newTable.tableId);
        }}
        existingTables={excelExportSettings.tables}
      />

      {/* MODAL XÁC NHẬN XÓA BẢNG DỮ LIỆU */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  Xác nhận xóa bảng dữ liệu xuất Excel
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Bạn có chắc chắn muốn xóa bảng{' '}
                  <span className="font-bold text-slate-900">"{tableToDelete.name}"</span> (Mã:{' '}
                  <code className="text-[11px] font-mono bg-slate-100 px-1 py-0.5 rounded text-rose-700">
                    {tableToDelete.id}
                  </code>
                  ) khỏi hệ thống cấu hình xuất Excel không?
                </p>
                {!tableToDelete.isCustom && (
                  <div className="mt-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded">
                    Lưu ý: Đây là bảng mặc định của hệ thống. Bạn có thể khôi phục lại bảng này bất cứ lúc nào qua nút "Khôi phục tất cả mặc định".
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = tableToDelete.id;
                  deleteExcelTable(targetId);
                  const remaining = Object.keys(excelExportSettings.tables).filter(
                    (k) => k !== targetId
                  );
                  if (remaining.length > 0) {
                    setSelectedTableId(remaining[0]);
                  }
                  setTableToDelete(null);
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa bảng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
