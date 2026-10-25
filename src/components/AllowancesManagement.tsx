import React, { useState, useMemo } from 'react';
import { useHRM } from '../context/HRMContext';
import { ConstructionProject, Employee, EmployeeProjectAllowance, RemoteAllowanceRate } from '../types/hrm';
import { formatNumberVN, getEmployeeRankRate } from '../utils/payrollCalculator';
import { initialRemoteAllowanceRates } from '../data/mockHrmData';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import {
  Car,
  Fuel,
  Utensils,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Settings,
  HelpCircle,
  Plus,
  Edit3,
  X,
  Check,
  Building,
  Info,
  Calendar,
  Layers,
  MapPin,
  TrendingDown,
  Sparkles,
  Plane,
  Briefcase,
  RotateCcw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const AllowancesManagement: React.FC = () => {
  const {
    employees,
    departments,
    projects,
    settings,
    remoteAllowanceRates,
    currentMonth,
    updateSettings,
    updateRemoteAllowanceRates,
    updateEmployeeProjectAllowances,
    toggleAllowances,
    showToast,
  } = useHRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'has_vehicle' | 'no_vehicle'>('all');
  const [distanceTierFilter, setDistanceTierFilter] = useState<'all' | 'tierI' | 'tierII' | 'none'>('all');

  // Modal configuring allowances for an employee
  const [configEmployee, setConfigEmployee] = useState<Employee | null>(null);
  const [draftProjectAllowances, setDraftProjectAllowances] = useState<Record<string, EmployeeProjectAllowance>>({});

  // Quick edit global rates modal/state: Giá xăng, Tiền ăn & Phụ cấp công tác phí Cấp I & Cấp II
  const [isEditingGlobalRates, setIsEditingGlobalRates] = useState(false);
  const [draftGasPrice, setDraftGasPrice] = useState(settings.gasolinePricePerKm || 1800);
  const [draftMealPrice, setDraftMealPrice] = useState(settings.projectDailyMealStandard || 50000);
  const [draftRemoteRates, setDraftRemoteRates] = useState<RemoteAllowanceRate[]>(() => [...remoteAllowanceRates]);

  const handleOpenGlobalRates = () => {
    setDraftGasPrice(settings.gasolinePricePerKm || 1800);
    setDraftMealPrice(settings.projectDailyMealStandard || 50000);
    setDraftRemoteRates(remoteAllowanceRates && remoteAllowanceRates.length > 0 ? [...remoteAllowanceRates] : [...initialRemoteAllowanceRates]);
    setIsEditingGlobalRates(true);
  };

  const handleOpenConfig = (emp: Employee) => {
    setConfigEmployee(emp);
    const initialDraft: Record<string, EmployeeProjectAllowance> = {};
    projects.forEach((proj) => {
      const existing = emp.projectAllowances?.[proj.id];
      if (existing) {
        initialDraft[proj.id] = { ...existing };
      } else {
        initialDraft[proj.id] = {
          projectId: proj.id,
          assigned: false,
          hasCompanyVehicle: false,
          hasFuelAllowance: true,
          hasMealAllowance: true,
        };
      }
    });
    setDraftProjectAllowances(initialDraft);
  };

  const handleToggleAssigned = (projId: string) => {
    setDraftProjectAllowances((prev) => {
      const curr = prev[projId] || {
        projectId: projId,
        assigned: false,
        hasCompanyVehicle: false,
        hasFuelAllowance: true,
        hasMealAllowance: true,
      };
      return {
        ...prev,
        [projId]: {
          ...curr,
          assigned: !curr.assigned,
        },
      };
    });
  };

  const handleToggleVehicle = (projId: string) => {
    setDraftProjectAllowances((prev) => {
      const curr = prev[projId] || {
        projectId: projId,
        assigned: true,
        hasCompanyVehicle: false,
        hasFuelAllowance: true,
        hasMealAllowance: true,
      };
      const nextVehicle = !curr.hasCompanyVehicle;
      return {
        ...prev,
        [projId]: {
          ...curr,
          assigned: true,
          hasCompanyVehicle: nextVehicle,
          // Nếu cấp xe: tự động tắt phụ cấp xăng
          hasFuelAllowance: nextVehicle ? false : true,
        },
      };
    });
  };

  const handleToggleFuel = (projId: string) => {
    setDraftProjectAllowances((prev) => {
      const curr = prev[projId] || {
        projectId: projId,
        assigned: true,
        hasCompanyVehicle: false,
        hasFuelAllowance: true,
        hasMealAllowance: true,
      };
      if (curr.hasCompanyVehicle) {
        showToast('Nhân sự đang được cấp xe công trình nên không tính tiền phụ cấp xăng!', 'info');
        return prev;
      }
      return {
        ...prev,
        [projId]: {
          ...curr,
          assigned: true,
          hasFuelAllowance: !curr.hasFuelAllowance,
        },
      };
    });
  };

  const handleToggleMeal = (projId: string) => {
    setDraftProjectAllowances((prev) => {
      const curr = prev[projId] || {
        projectId: projId,
        assigned: true,
        hasCompanyVehicle: false,
        hasFuelAllowance: true,
        hasMealAllowance: true,
      };
      return {
        ...prev,
        [projId]: {
          ...curr,
          assigned: true,
          hasMealAllowance: !curr.hasMealAllowance,
        },
      };
    });
  };

  const handleSaveEmpConfig = () => {
    if (!configEmployee) return;
    updateEmployeeProjectAllowances(configEmployee.id, draftProjectAllowances);
    setConfigEmployee(null);
  };

  // Cập nhật mức phụ cấp công tác phí trong draft
  const handleUpdateRemoteRateRow = (idx: number, field: keyof RemoteAllowanceRate, value: any) => {
    setDraftRemoteRates((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleAddRemoteRateRow = () => {
    const nextCode = `C${draftRemoteRates.length + 1}`;
    setDraftRemoteRates((prev) => [
      ...prev,
      {
        id: `rate-${Date.now()}`,
        rank: nextCode,
        rankDescription: `Hạng ${nextCode}: Vị trí chức danh mới`,
        applicablePositions: 'Vị trí công việc mới',
        tierI: 35000,
        tierII: 25000,
      },
    ]);
  };

  const handleDeleteRemoteRateRow = (idx: number) => {
    if (draftRemoteRates.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 cấp chức danh định mức!', 'error');
      return;
    }
    setDraftRemoteRates((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleResetRemoteRates = () => {
    setDraftRemoteRates([...initialRemoteAllowanceRates]);
    setDraftGasPrice(1800);
    setDraftMealPrice(50000);
    showToast('Đã khôi phục định mức phụ cấp công tác phí & xăng ăn chuẩn!', 'info');
  };

  const handleSaveGlobalRates = () => {
    updateSettings({
      ...settings,
      gasolinePricePerKm: Number(draftGasPrice) || 1800,
      projectDailyMealStandard: Number(draftMealPrice) || 50000,
    });
    updateRemoteAllowanceRates(draftRemoteRates);
    setIsEditingGlobalRates(false);
    showToast('Đã lưu định mức giá xăng, tiền ăn và phụ cấp công tác phí toàn hệ thống!');
  };

  // Detailed allowance records for all employees & projects
  const allowanceData = useMemo(() => {
    const list: Array<{
      employee: Employee;
      departmentName: string;
      project: ConstructionProject;
      daysWorked: number;
      distanceKm: number;
      hasCompanyVehicle: boolean;
      fuelAllowance: number;
      mealAllowance: number;
      remoteTier: 'I' | 'II' | 'None';
      remoteAllowance: number;
      rankName: string;
      totalAllowance: number;
    }> = [];

    employees.forEach((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      projects.forEach((proj) => {
        const cfg = emp.projectAllowances?.[proj.id];
        const isAssigned = cfg?.assigned ?? false;
        if (!isAssigned && !cfg) return;

        const daysWorked = 22; // chuẩn tháng hoặc theo ngày công trình
        const distance = cfg?.customDistanceKm ?? proj.distanceKm ?? 0;
        const fuelPrice = cfg?.customFuelPrice ?? proj.fuelPricePerKm ?? settings.gasolinePricePerKm ?? 1800;
        const mealPrice = cfg?.customMealPerDay ?? proj.mealAllowanceDaily ?? settings.projectDailyMealStandard ?? 50000;

        const hasVehicle = cfg?.hasCompanyVehicle ?? false;
        const hasFuel = cfg ? cfg.hasFuelAllowance : true;
        const hasMeal = cfg ? cfg.hasMealAllowance : true;

        // 1. Phụ cấp tiền xăng = Cự ly x Giá xăng x Ngày công (0 đ nếu đã cấp xe)
        const fuelAllowance = hasVehicle ? 0 : (hasFuel ? Math.round(distance * fuelPrice * daysWorked) : 0);

        // 2. Phụ cấp tiền ăn theo ngày
        const mealAllowance = hasMeal ? Math.round(mealPrice * daysWorked) : 0;

        // 3. Phụ cấp công tác phí theo cự ly:
        // Cấp II: Cự ly từ 50km - 100km
        // Cấp I: Cự ly trên 100km (>100km)
        let remoteTier: 'I' | 'II' | 'None' = 'None';
        if (distance > 100) {
          remoteTier = 'I';
        } else if (distance >= 50) {
          remoteTier = 'II';
        }

        const rankRate = getEmployeeRankRate(emp, remoteAllowanceRates);
        let remoteAllowance = 0;
        if (daysWorked > 0) {
          if (remoteTier === 'I') {
            remoteAllowance = Math.round(rankRate.tierI * daysWorked);
          } else if (remoteTier === 'II') {
            remoteAllowance = Math.round(rankRate.tierII * daysWorked);
          }
        }

        const totalAllowance = fuelAllowance + mealAllowance + remoteAllowance;

        list.push({
          employee: emp,
          departmentName: dept?.name || 'Chưa phân bổ',
          project: proj,
          daysWorked,
          distanceKm: distance,
          hasCompanyVehicle: hasVehicle,
          fuelAllowance,
          mealAllowance,
          remoteTier,
          remoteAllowance,
          rankName: rankRate.rank,
          totalAllowance,
        });
      });
    });

    return list;
  }, [employees, departments, projects, settings, remoteAllowanceRates]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return allowanceData.filter((row) => {
      const matchSearch =
        row.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.employee.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.project.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept === 'all' || row.employee.departmentId === selectedDept;
      const matchProj = selectedProjectFilter === 'all' || row.project.id === selectedProjectFilter;
      const matchVehicle =
        vehicleFilter === 'all'
          ? true
          : vehicleFilter === 'has_vehicle'
          ? row.hasCompanyVehicle
          : !row.hasCompanyVehicle;
      const matchTier =
        distanceTierFilter === 'all'
          ? true
          : distanceTierFilter === 'tierI'
          ? row.remoteTier === 'I'
          : distanceTierFilter === 'tierII'
          ? row.remoteTier === 'II'
          : row.remoteTier === 'None';

      return matchSearch && matchDept && matchProj && matchVehicle && matchTier;
    });
  }, [allowanceData, searchTerm, selectedDept, selectedProjectFilter, vehicleFilter, distanceTierFilter]);

  // Totals
  const totalFuel = useMemo(() => filteredData.reduce((sum, r) => sum + r.fuelAllowance, 0), [filteredData]);
  const totalMeal = useMemo(() => filteredData.reduce((sum, r) => sum + r.mealAllowance, 0), [filteredData]);
  const totalRemote = useMemo(() => filteredData.reduce((sum, r) => sum + r.remoteAllowance, 0), [filteredData]);
  const vehicleAssignedCount = useMemo(() => {
    const setEmp = new Set<string>();
    allowanceData.filter((r) => r.hasCompanyVehicle).forEach((r) => setEmp.add(r.employee.id));
    return setEmp.size;
  }, [allowanceData]);
  const totalAllowances = totalFuel + totalMeal + totalRemote;

  // Export Excel (.xlsx) of Allowances
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và Tên',
      'Vị Trí Việc Làm',
      'Hạng Chức Danh',
      'Phòng Ban',
      'Mã Công Trình',
      'Tên Công Trình',
      'Cự Ly (km)',
      'Phân Cấp Cự Ly',
      'Số Ngày Công',
      'Cấp Xe Đi Công Trình',
      'Phụ Cấp Tiền Xăng (VNĐ)',
      'Phụ Cấp Tiền Ăn (VNĐ)',
      'Phụ Cấp Công Tác Phí (VNĐ)',
      'Tổng Phụ Cấp (VNĐ)',
    ];

    const rows = filteredData.map((r, idx) => [
      idx + 1,
      r.employee.code,
      r.employee.fullName,
      r.employee.position,
      `Hạng ${r.rankName}`,
      r.departmentName,
      r.project.code,
      r.project.name,
      r.distanceKm,
      r.remoteTier === 'I' ? 'Cấp I (>100km)' : r.remoteTier === 'II' ? 'Cấp II (50-100km)' : 'Dưới 50km',
      r.daysWorked,
      r.hasCompanyVehicle ? 'CÓ CẤP XE (0đ xăng)' : 'Tự túc xe (Tính xăng)',
      r.fuelAllowance,
      r.mealAllowance,
      r.remoteAllowance,
      r.totalAllowance,
    ]);

    // Summary row
    rows.push([
      'TỔNG CỘNG',
      '',
      `${filteredData.length} lượt công trình`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      filteredData.reduce((s, r) => s + r.daysWorked, 0),
      '',
      totalFuel,
      totalMeal,
      totalRemote,
      totalAllowances,
    ]);

    exportToExcel({
      fileName: `Bang_Phu_Cap_Cong_Trinh_Thang_${currentMonth}.xlsx`,
      sheetName: 'PhuCapCongTrinh',
      title: `BẢNG TỔNG HỢP PHỤ CẤP CÔNG TRÌNH - THÁNG ${currentMonth}`,
      subtitles: [
        `Công ty Cổ phần Xây dựng | Tổng phụ cấp: ${totalAllowances.toLocaleString('vi-VN')} VNĐ`,
        `Quy định: Xe máy tính phụ cấp xăng theo cự ly km; Ô tô cấp xe miễn tính xăng`,
      ],
      headers,
      rows,
    });
    showToast('Đã xuất file Excel bảng phụ cấp công trình thành công!');
  };

  // Export PDF (.pdf) of Allowances
  const handleExportPDF = () => {
    const headers = [
      'STT',
      'Ma NV',
      'Ho va Ten',
      'Chuc Vu',
      'Cong Trinh',
      'Cu Ly',
      'Cong',
      'Cap Xe',
      'Tien Xang',
      'Tien An',
      'Cong Tac Phi',
      'Tong Phu Cap',
    ];

    const rows = filteredData.map((r, idx) => [
      idx + 1,
      r.employee.code,
      r.employee.fullName,
      r.employee.position,
      r.project.code,
      `${r.distanceKm} km`,
      r.daysWorked,
      r.hasCompanyVehicle ? 'Co cap xe' : 'Tu tuc',
      r.fuelAllowance.toLocaleString('vi-VN'),
      r.mealAllowance.toLocaleString('vi-VN'),
      r.remoteAllowance.toLocaleString('vi-VN'),
      r.totalAllowance.toLocaleString('vi-VN'),
    ]);

    exportToPDF({
      fileName: `Bang_Phu_Cap_Cong_Trinh_Thang_${currentMonth}.pdf`,
      title: `BANG TONG HOP PHU CAP CONG TRINH - THANG ${currentMonth}`,
      subtitles: [
        `Ky: ${currentMonth} | Tong tien: ${totalAllowances.toLocaleString('vi-VN')} VND`,
      ],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất file PDF bảng phụ cấp công trình thành công!');
  };

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và Tên',
      'Vị Trí Việc Làm',
      'Hạng Chức Danh',
      'Phòng Ban',
      'Mã Công Trình',
      'Tên Công Trình',
      'Cự Ly (km)',
      'Phân Cấp Cự Ly',
      'Số Ngày Công',
      'Cấp Xe Đi Công Trình',
      'Phụ Cấp Tiền Xăng (VNĐ)',
      'Phụ Cấp Tiền Ăn (VNĐ)',
      'Phụ Cấp Công Tác Phí (VNĐ)',
      'Tổng Phụ Cấp (VNĐ)',
    ];

    const rows = filteredData.map((r, idx) => [
      idx + 1,
      r.employee.code,
      `"${r.employee.fullName}"`,
      `"${r.employee.position}"`,
      `"Hạng ${r.rankName}"`,
      `"${r.departmentName}"`,
      r.project.code,
      `"${r.project.name}"`,
      r.distanceKm,
      r.remoteTier === 'I' ? 'Cấp I (>100km)' : r.remoteTier === 'II' ? 'Cấp II (50-100km)' : 'Dưới 50km',
      r.daysWorked,
      r.hasCompanyVehicle ? 'CÓ CẤP XE (Miễn xăng)' : 'Tự túc xe',
      r.fuelAllowance,
      r.mealAllowance,
      r.remoteAllowance,
      r.totalAllowance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Phu_Cap_Cong_Trinh_Thang_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất báo cáo chi tiết phụ cấp công trình ra CSV!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-5">
      {/* 1. Header Banner & Global Price Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-100/70 text-blue-800 rounded-lg">
                <Car className="w-5 h-5 text-[#1E3A8A]" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Chính Sách & Danh Mục Phụ Cấp Công Trình
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Kỳ {currentMonth}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  1. Phụ cấp xăng = Cự ly × Giá xăng · 2. Phụ cấp tiền ăn theo ngày · 3. Cấp xe (Miễn xăng) · 4. Phụ cấp công tác phí (50-100km Cấp II, &gt;100km Cấp I theo chức danh)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start lg:self-auto">
            {/* Quick Toggle Allowances */}
            <button
              onClick={() => toggleAllowances()}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border transition-colors cursor-pointer shadow-2xs ${
                settings.enableAllowances
                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Bật/Tắt phân hệ Phụ cấp"
            >
              {settings.enableAllowances ? (
                <ToggleRight className="w-4 h-4 text-white" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-400" />
              )}
              <span>Chế độ phụ cấp: {settings.enableAllowances ? 'Đang BẬT' : 'Đang TẮT'}</span>
            </button>

            <button
              onClick={handleOpenGlobalRates}
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-blue-200 cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-blue-700" />
              <span>Định mức giá xăng, tiền ăn & công tác phí</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Xuất bảng phụ cấp công trình ra Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Xuất bảng phụ cấp công trình ra PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất PDF (.pdf)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              title="Xuất CSV"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Informative Status Banner for ON/OFF state */}
        <div
          className={`mt-4 p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs ${
            !settings.enableAllowances
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Sparkles className={`w-4 h-4 shrink-0 ${!settings.enableAllowances ? 'text-amber-600' : 'text-emerald-600'}`} />
            <div>
              <span className="font-bold">
                {settings.enableAllowances
                  ? 'Chế độ phụ cấp đang BẬT (Áp dụng vào bảng lương)'
                  : 'Chế độ phụ cấp đang TẮT (Hiện công ty chưa áp dụng)'}
              </span>
              <p className={`text-[11px] mt-0.5 ${!settings.enableAllowances ? 'text-amber-800' : 'text-emerald-800'}`}>
                {settings.enableAllowances
                  ? 'Toàn bộ phụ cấp tiền xăng, tiền ăn, công tác phí xa và phụ cấp trách nhiệm đang được tính vào Tổng Gross của nhân sự.'
                  : 'Do hiện tại công ty chưa áp dụng phụ cấp nên các khoản phụ cấp hiển thị = 0đ trong bảng lương. Bạn vẫn có thể thiết lập chính sách và định mức tại đây, sau đó bấm BẬT bất kỳ lúc nào để áp dụng trong tương lai.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleAllowances()}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors shadow-2xs ${
              settings.enableAllowances
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {settings.enableAllowances ? 'Tắt áp dụng phụ cấp' : 'Bật áp dụng phụ cấp ngay'}
          </button>
        </div>

        {/* Highlight 4 Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 flex items-start space-x-2.5">
            <Fuel className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900">1. Phụ cấp tiền xăng</div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Tính theo: <strong>Cự ly × Đơn giá xăng ({formatNumberVN(settings.gasolinePricePerKm || 1800)} đ/km)</strong>
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 flex items-start space-x-2.5">
            <Utensils className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-900">2. Phụ cấp tiền ăn theo ngày</div>
              <p className="text-[11px] text-blue-800/90 mt-0.5">
                Tính theo: <strong>Mức tiền ăn ({formatNumberVN(settings.projectDailyMealStandard || 50000)} đ/ngày) × Ngày công</strong>
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 flex items-start space-x-2.5">
            <Car className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-900">3. Cấp xe đi công trình</div>
              <p className="text-[11px] text-emerald-800/90 mt-0.5">
                <strong>Nếu cấp xe:</strong> Hệ thống tự động <strong>KHÔNG tính tiền phụ cấp xăng</strong> (= 0 đ).
              </p>
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-200 flex items-start space-x-2.5">
            <Plane className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-purple-900">4. Phụ cấp công tác phí xa</div>
              <p className="text-[11px] text-purple-800/90 mt-0.5">
                <strong>50km - 100km (Cấp II)</strong> và <strong>&gt;100km (Cấp I)</strong> tùy chỉnh theo cấp chức danh.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Tổng phụ cấp xăng
            </span>
            <Fuel className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {formatNumberVN(totalFuel)} đ
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Cự ly × Đơn giá xăng</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
              Tổng phụ cấp tiền ăn
            </span>
            <Utensils className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 tabular-nums">
            {formatNumberVN(totalMeal)} đ
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tiền ăn theo ngày công</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-800">
              Tổng công tác phí xa
            </span>
            <Plane className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-700 tabular-nums">
            {formatNumberVN(totalRemote)} đ
          </div>
          <p className="text-[11px] text-purple-600 font-medium mt-0.5">Cấp I & Cấp II theo chức danh</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Được cấp xe công trình
            </span>
            <Car className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {vehicleAssignedCount} nhân sự
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Miễn tính tiền xăng</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
              Tổng chi phí phụ cấp
            </span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1E3A8A] tabular-nums">
            {formatNumberVN(totalAllowances)} đ
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{filteredData.length} phân bổ công trình</p>
        </div>
      </div>

      {/* 3. Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên NV, mã NV, vị trí, công trình..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500 w-64"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-semibold text-slate-600">Phòng ban:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-semibold text-slate-600">Công trình:</label>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-blue-500 max-w-[180px] truncate"
            >
              <option value="all">Tất cả công trình</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Distance Tier Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-semibold text-slate-600">Cự ly công tác:</label>
            <select
              value={distanceTierFilter}
              onChange={(e) => setDistanceTierFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
            >
              <option value="all">Tất cả cự ly</option>
              <option value="tierI">Cấp I: Trên 100km</option>
              <option value="tierII">Cấp II: 50km - 100km</option>
              <option value="none">Dưới 50km (Nội ô)</option>
            </select>
          </div>

          {/* Vehicle Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-semibold text-slate-600">Cấp xe:</label>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
            >
              <option value="all">Tất cả chế độ</option>
              <option value="has_vehicle">Được cấp xe công trình (Miễn xăng)</option>
              <option value="no_vehicle">Tự túc xe (Hưởng phụ cấp xăng)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredData.length}</strong> dòng phân bổ
        </div>
      </div>

      {/* 4. Allowances Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1250px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 text-center w-10">STT</th>
                <th className="py-3 px-3 w-20">Mã NV</th>
                <th className="py-3 px-4 w-44">Họ và tên</th>
                <th className="py-3 px-3 w-36">Vị trí việc làm</th>
                <th className="py-3 px-3">Phòng ban</th>
                <th className="py-3 px-4">Công trình</th>
                <th className="py-3 px-3 text-center">Cự ly & Cấp</th>
                <th className="py-3 px-3 text-center">Số công</th>
                <th className="py-3 px-3 text-center">Xe công trình</th>
                <th className="py-3 px-3 text-right">Phụ cấp xăng</th>
                <th className="py-3 px-3 text-right">Phụ cấp ăn</th>
                <th className="py-3 px-3 text-right text-purple-800 bg-purple-50/50">
                  Công tác phí xa
                </th>
                <th className="py-3 px-4 text-right font-bold text-blue-900 bg-blue-50/50">
                  Tổng phụ cấp
                </th>
                <th className="py-3 px-3 text-center w-24">Tùy chọn</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-10 text-center text-slate-400">
                    <Car className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-medium text-slate-600 text-sm">Chưa có phân bổ phụ cấp nào khớp với bộ lọc</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hãy mở tab Nhân sự để tích chọn công trình và chế độ phụ cấp cho từng nhân viên
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={`${row.employee.id}-${row.project.id}`} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                      {row.employee.code}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      <div>{row.employee.fullName}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">
                      <div className="font-medium text-slate-800">{row.employee.position}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Hạng {row.rankName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{row.departmentName}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                          {row.project.code}
                        </span>
                        <span>{row.project.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{row.project.location || 'Chưa cập nhật địa chỉ'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="font-mono font-bold text-slate-800">{row.distanceKm} km</div>
                      {row.remoteTier === 'I' && (
                        <span className="inline-flex text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                          Cấp I (&gt;100km)
                        </span>
                      )}
                      {row.remoteTier === 'II' && (
                        <span className="inline-flex text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          Cấp II (50-100km)
                        </span>
                      )}
                      {row.remoteTier === 'None' && (
                        <span className="text-[10px] text-slate-400">Dưới 50km</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                      {row.daysWorked} ngày
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.hasCompanyVehicle ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Car className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Cấp xe (0đ)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          <span>Tự túc xe</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {row.hasCompanyVehicle ? (
                        <span className="text-slate-400 line-through" title="Đã cấp xe công ty nên không tính tiền xăng">
                          0 đ
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700">
                          {formatNumberVN(row.fuelAllowance)} đ
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-blue-700">
                      {formatNumberVN(row.mealAllowance)} đ
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-purple-700 bg-purple-50/30">
                      {row.remoteAllowance > 0 ? (
                        <span>+{formatNumberVN(row.remoteAllowance)} đ</span>
                      ) : (
                        <span className="text-slate-400">0 đ</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-extrabold text-blue-900 bg-blue-50/40 text-sm">
                      {formatNumberVN(row.totalAllowance)} đ
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleOpenConfig(row.employee)}
                        className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                        title="Tùy chỉnh phụ cấp cho nhân sự"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa tích</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td colSpan={9} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    Tổng cộng {filteredData.length} phân bổ:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-800 tabular-nums">
                    {formatNumberVN(totalFuel)} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-800 tabular-nums">
                    {formatNumberVN(totalMeal)} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-purple-800 bg-purple-100/50 tabular-nums">
                    {formatNumberVN(totalRemote)} đ
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#1E3A8A] bg-blue-100/60 tabular-nums text-sm font-extrabold">
                    {formatNumberVN(totalAllowances)} đ
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 5. Modal Tùy Chọn Phụ Cấp Cho Từng Nhân Sự & Từng Công Trình */}
      {configEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-700" />
                  Cấu Hình Phụ Cấp Công Trình: {configEmployee.fullName} ({configEmployee.code})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vị trí: <strong>{configEmployee.position}</strong> (Hạng chức danh:{' '}
                  <strong>{configEmployee.positionRank || 'C'}</strong>)
                </p>
              </div>
              <button
                onClick={() => setConfigEmployee(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 leading-relaxed text-[11px]">
                <strong>Ghi chú chính sách:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Nếu tích <strong>Cấp xe đi công trình</strong>: Hệ thống sẽ tự động miễn tính phụ cấp xăng (= 0 đ).</li>
                  <li>Nếu không cấp xe: Tính <strong>Cự ly × Đơn giá xăng</strong> theo ngày công.</li>
                  <li>Công trình từ <strong>50km - 100km</strong> tự động tính phụ cấp công tác phí <strong>Cấp II</strong>.</li>
                  <li>Công trình <strong>trên 100km</strong> tự động tính phụ cấp công tác phí <strong>Cấp I</strong> theo vị trí chức danh.</li>
                </ul>
              </div>

              <div className="space-y-3">
                {projects.map((proj) => {
                  const draft = draftProjectAllowances[proj.id] || {
                    projectId: proj.id,
                    assigned: false,
                    hasCompanyVehicle: false,
                    hasFuelAllowance: true,
                    hasMealAllowance: true,
                  };

                  const tierBadge =
                    proj.distanceKm > 100
                      ? 'Cấp I (>100km)'
                      : proj.distanceKm >= 50
                      ? 'Cấp II (50-100km)'
                      : 'Dưới 50km';

                  return (
                    <div
                      key={proj.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        draft.assigned
                          ? 'bg-blue-50/30 border-blue-200 shadow-2xs'
                          : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.assigned}
                            onChange={() => handleToggleAssigned(proj.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 text-xs">
                              [{proj.code}] {proj.name}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              Cự ly: <strong>{proj.distanceKm} km</strong> ({tierBadge})
                            </span>
                          </div>
                        </label>
                      </div>

                      {draft.assigned && (
                        <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          {/* Checkbox 1: Cấp xe công trình */}
                          <label
                            className={`p-2.5 rounded-lg border flex items-center space-x-2 cursor-pointer transition-colors ${
                              draft.hasCompanyVehicle
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={draft.hasCompanyVehicle}
                              onChange={() => handleToggleVehicle(proj.id)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <div className="leading-tight">
                              <span className="block text-xs">Cấp xe công trình</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                (Không tính tiền xăng)
                              </span>
                            </div>
                          </label>

                          {/* Checkbox 2: Phụ cấp xăng */}
                          <label
                            className={`p-2.5 rounded-lg border flex items-center space-x-2 transition-colors ${
                              draft.hasCompanyVehicle
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                : draft.hasFuelAllowance
                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold cursor-pointer'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={draft.hasCompanyVehicle}
                              checked={draft.hasCompanyVehicle ? false : draft.hasFuelAllowance}
                              onChange={() => handleToggleFuel(proj.id)}
                              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 disabled:opacity-50"
                            />
                            <div className="leading-tight">
                              <span className="block text-xs">Phụ cấp tiền xăng</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {draft.hasCompanyVehicle ? 'Miễn tính do có xe' : `${proj.distanceKm}km × Giá xăng`}
                              </span>
                            </div>
                          </label>

                          {/* Checkbox 3: Phụ cấp tiền ăn */}
                          <label
                            className={`p-2.5 rounded-lg border flex items-center space-x-2 cursor-pointer transition-colors ${
                              draft.hasMealAllowance
                                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={draft.hasMealAllowance}
                              onChange={() => handleToggleMeal(proj.id)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <div className="leading-tight">
                              <span className="block text-xs">Phụ cấp tiền ăn</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {formatNumberVN(proj.mealAllowanceDaily || settings.projectDailyMealStandard || 50000)} đ/ngày
                              </span>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setConfigEmployee(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveEmpConfig}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Lưu cấu hình phụ cấp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL TOÀN DIỆN: Cài đặt định mức giá xăng, tiền ăn & Phụ cấp công tác phí Cấp I, Cấp II */}
      {isEditingGlobalRates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-700" />
                Định Mức Giá Xăng, Tiền Ăn & Phụ Cấp Công Tác Phí Công Trình Xa
              </h3>
              <button
                onClick={() => setIsEditingGlobalRates(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Phần 1: Giá xăng & Tiền ăn */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  <span>1. Định Mức Giá Xăng & Tiền Ăn Tiêu Chuẩn</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Đơn giá xăng phụ cấp trên 1 km (VNĐ / km):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={draftGasPrice}
                        onChange={(e) => setDraftGasPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-blue-500 font-mono font-bold bg-white"
                        placeholder="Ví dụ: 1800"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                        đ/km
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Công thức: Cự ly (km) × {formatNumberVN(draftGasPrice)} đ/km × Ngày công (0đ nếu cấp xe)
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mức tiền ăn công trình tiêu chuẩn (VNĐ / ngày):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={draftMealPrice}
                        onChange={(e) => setDraftMealPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-blue-500 font-mono font-bold bg-white"
                        placeholder="Ví dụ: 50000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                        đ/ngày
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Công thức: {formatNumberVN(draftMealPrice)} đ/ngày × Số ngày công trình
                    </p>
                  </div>
                </div>
              </div>

              {/* Phần 2: Phụ cấp công tác phí Cấp I (>100km) và Cấp II (50km-100km) tùy chỉnh theo vị trí cấp chức danh */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Plane className="w-4 h-4 text-purple-700" />
                      <span>2. Phụ Cấp Công Tác Phí Cho Công Trình Xa (Cấp I & Cấp II)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tùy chỉnh số tiền phụ cấp theo ngày (VNĐ/ngày) cho từng vị trí cấp chức danh.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleResetRemoteRates}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Mặc định</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddRemoteRateRow}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm cấp chức danh</span>
                    </button>
                  </div>
                </div>

                {/* Banner giải thích phân cấp cự ly chuẩn */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                    <div className="font-bold text-blue-900 text-[11px]">
                      Công trình Cấp II: Cự ly từ 50km - 100km
                    </div>
                    <div className="text-[10px] text-blue-800/80 mt-0.5">
                      Áp dụng cho các dự án xa ngoại tỉnh/ngoại thành cự ly trung bình.
                    </div>
                  </div>

                  <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg">
                    <div className="font-bold text-purple-900 text-[11px]">
                      Công trình Cấp I: Cự ly trên 100km (&gt;100km)
                    </div>
                    <div className="text-[10px] text-purple-800/80 mt-0.5">
                      Áp dụng cho các dự án liên tỉnh cự ly xa, phụ cấp cao hơn.
                    </div>
                  </div>
                </div>

                {/* Bảng tùy chỉnh số tiền phụ cấp theo vị trí cấp chức danh */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-16 text-center">Hạng</th>
                        <th className="py-2.5 px-3">Vị trí cấp chức danh áp dụng</th>
                        <th className="py-2.5 px-3 w-36 text-right text-blue-900 bg-blue-50/50">
                          Mức Cấp II (50-100km)
                        </th>
                        <th className="py-2.5 px-3 w-36 text-right text-purple-900 bg-purple-50/50">
                          Mức Cấp I (&gt;100km)
                        </th>
                        <th className="py-2.5 px-2 text-center w-12">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {draftRemoteRates.map((rate, idx) => (
                        <tr key={rate.id || idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              value={rate.rank}
                              onChange={(e) => handleUpdateRemoteRateRow(idx, 'rank', e.target.value)}
                              className="w-10 text-center font-bold px-1 py-1 border border-slate-300 rounded font-mono text-xs uppercase"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={rate.rankDescription}
                              onChange={(e) => handleUpdateRemoteRateRow(idx, 'rankDescription', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-slate-800 text-xs mb-1"
                              placeholder="Mô tả nhóm chức danh"
                            />
                            <input
                              type="text"
                              value={rate.applicablePositions || ''}
                              onChange={(e) => handleUpdateRemoteRateRow(idx, 'applicablePositions', e.target.value)}
                              className="w-full px-2 py-0.5 border border-slate-200 rounded text-[11px] text-slate-500 bg-slate-50"
                              placeholder="Các vị trí: Chỉ huy trưởng, Kỹ thuật, Kế toán..."
                            />
                          </td>
                          <td className="py-2 px-3 text-right bg-blue-50/20">
                            <div className="relative">
                              <input
                                type="number"
                                step="1000"
                                value={rate.tierII}
                                onChange={(e) => handleUpdateRemoteRateRow(idx, 'tierII', Number(e.target.value))}
                                className="w-full text-right font-mono font-bold px-2 py-1 border border-blue-300 rounded text-xs text-blue-900 focus:outline-blue-500"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">đ/ngày</span>
                          </td>
                          <td className="py-2 px-3 text-right bg-purple-50/20">
                            <div className="relative">
                              <input
                                type="number"
                                step="1000"
                                value={rate.tierI}
                                onChange={(e) => handleUpdateRemoteRateRow(idx, 'tierI', Number(e.target.value))}
                                className="w-full text-right font-mono font-bold px-2 py-1 border border-purple-300 rounded text-xs text-purple-900 focus:outline-purple-500"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">đ/ngày</span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRemoteRateRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Xóa dòng chức danh này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
              <button
                onClick={() => setIsEditingGlobalRates(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveGlobalRates}
                className="px-5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                Lưu toàn bộ định mức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
