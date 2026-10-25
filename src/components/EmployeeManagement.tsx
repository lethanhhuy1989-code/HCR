import React, { useState } from 'react';
import { useHRM } from '../context/HRMContext';
import { Employee, LaborContract, EmployeeProjectAllowance } from '../types/hrm';
import { formatNumberVN, formatVND } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { exportDynamicExcel } from '../utils/dynamicExcelExporter';
import { BulkEmployeeGridModal } from './BulkEmployeeGridModal';
import {
  Users,
  UserPlus,
  Search,
  Building,
  FileCheck2,
  Trash2,
  Edit,
  Shield,
  Briefcase,
  Calendar,
  X,
  Check,
  Download,
  Car,
  Fuel,
  Utensils,
  Award,
  HandCoins,
  ShieldCheck,
  Info,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FileSignature,
  Settings,
  Table,
} from 'lucide-react';

export const EmployeeManagement: React.FC = () => {
  const {
    employees,
    departments,
    jobPositions,
    grades,
    contracts,
    projects,
    settings,
    excelExportSettings,
    setActiveMainTab,
    addEmployee,
    batchAddEmployees,
    updateEmployee,
    deleteEmployee,
    addContract,
    updateEmployeeProjectAllowances,
    updateEmployeeSalaryConfig,
    showToast,
  } = useHRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkGridModalOpen, setIsBulkGridModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Quick Project Allowance Modal state
  const [allowanceEmp, setAllowanceEmp] = useState<Employee | null>(null);
  const [draftProjectAllowances, setDraftProjectAllowances] = useState<Record<string, EmployeeProjectAllowance>>({});

  // Export Excel (.xlsx) of Employee List using dynamic user configuration
  const handleExportEmployeesExcel = () => {
    try {
      const records = filteredEmployees.map((emp, idx) => {
        const dept = departments.find((d) => d.id === emp.departmentId);
        const grade = grades.find((g) => g.id === emp.gradeId);
        const isNegotiated = emp.salaryType === 'negotiated';
        const baseSalary = isNegotiated
          ? (emp.negotiatedSalary || 15000000)
          : Math.round((grade?.standardBaseRate || 5000000) * (grade?.coefficients[emp.tierIndex - 1] || 1));

        let hasVehicle = false;
        if (emp.projectAllowances) {
          Object.values(emp.projectAllowances).forEach((cfg) => {
            if (cfg.assigned && cfg.hasCompanyVehicle) hasVehicle = true;
          });
        }

        return {
          stt: idx + 1,
          code: emp.code,
          fullName: emp.fullName,
          departmentName: dept?.name || '',
          position: emp.position,
          positionRank: emp.positionRank || 'C',
          salaryTypeDisplay: isNegotiated
            ? (emp.negotiatedType === 'daily'
                ? `Thỏa thuận ngày (${formatNumberVN(emp.negotiatedDailyRate || Math.round((emp.negotiatedSalary || 15000000) / 26))} đ/ngày)`
                : `Thỏa thuận trọn tháng (${formatNumberVN(emp.negotiatedSalary || 15000000)} đ)`)
            : `Theo ngạch bậc (Bậc ${emp.tierIndex})`,
          baseSalaryDisplay: baseSalary,
          responsibilityAllowance: emp.responsibilityAllowance || 0,
          vehicleStatus: hasVehicle ? 'Có cấp xe (0đ xăng)' : 'Tự túc xe (Tính xăng)',
          socialInsuranceCode: emp.socialInsuranceCode || '',
          identityCard: emp.identityCard || '',
          phone: emp.phone || '',
          email: emp.email || '',
          bankAccount: emp.bankAccount || '',
          bankName: emp.bankName || '',
          dependentsCount: emp.dependentsCount || 0,
          joinDate: emp.joinDate || '',
          statusDisplay: emp.status === 'active' ? 'Chính thức' : emp.status === 'probation' ? 'Thử việc' : 'Đã nghỉ',
        };
      });

      const config = excelExportSettings.tables.employees;
      const res = exportDynamicExcel(
        config,
        excelExportSettings,
        records,
        {
          companyName: excelExportSettings.companyName,
          companyShortName: excelExportSettings.companyShortName,
        }
      );

      showToast(`Đã xuất file "${res.fileName}" thành công theo cài đặt (${res.colCount} cột, ${res.rowCount} dòng)!`);
    } catch (err: any) {
      console.error('Lỗi xuất Excel nhân sự:', err);
      showToast('Có lỗi xảy ra khi xuất file Excel: ' + (err?.message || ''));
    }
  };

  // Export PDF (.pdf) of Employee List
  const handleExportEmployeesPDF = () => {
    const headers = [
      'STT',
      'Ma NV',
      'Ho va Ten',
      'Phong Ban',
      'Chuc Vu',
      'Luong Co Ban',
      'Phu Cap',
      'Cap Xe',
      'So Dien Thoai',
      'Trang Thai',
    ];

    const rows = filteredEmployees.map((emp, idx) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const grade = grades.find((g) => g.id === emp.gradeId);
      const isNegotiated = emp.salaryType === 'negotiated';
      const baseSalary = isNegotiated
        ? (emp.negotiatedSalary || 15000000)
        : Math.round((grade?.standardBaseRate || 5000000) * (grade?.coefficients[emp.tierIndex - 1] || 1));

      let hasVehicle = false;
      if (emp.projectAllowances) {
        Object.values(emp.projectAllowances).forEach((cfg) => {
          if (cfg.assigned && cfg.hasCompanyVehicle) hasVehicle = true;
        });
      }

      return [
        idx + 1,
        emp.code,
        emp.fullName,
        dept?.name || '',
        emp.position,
        baseSalary.toLocaleString('vi-VN'),
        (emp.responsibilityAllowance || 0).toLocaleString('vi-VN'),
        hasVehicle ? 'Co cap xe' : 'Tu tuc',
        emp.phone,
        emp.status === 'active' ? 'Chinh thuc' : emp.status === 'probation' ? 'Thu viec' : 'Da nghi',
      ];
    });

    exportToPDF({
      fileName: `Danh_Sach_Nhan_Su_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'DANH SACH CAN BO NHAN VIEN',
      subtitles: [
        `Tong so nhan su: ${filteredEmployees.length} | Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`,
      ],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất file PDF danh sách nhân sự thành công!');
  };

  const handleExportEmployeesCSV = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và Tên',
      'Phòng Ban',
      'Chức Vụ',
      'Hình Thức Lương',
      'Lương Cơ Bản / Thỏa Thuận',
      'Phụ Cấp Trách Nhiệm',
      'Cấp Xe Đi Công Trình',
      'Công Trình Phân Bổ',
      'Mã Số BHXH',
      'Nguyên Quán',
      'Chỗ Ở Hiện Nay',
      'Số TK Ngân Hàng',
      'Ngân Hàng',
      'Số CCCD/CMND',
      'Số Điện Thoại',
      'Email',
      'Số Người Phụ Thuộc',
      'Trạng Thái',
    ];

    const rows = filteredEmployees.map((emp, idx) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const grade = grades.find((g) => g.id === emp.gradeId);
      const isNegotiated = emp.salaryType === 'negotiated';
      const baseSalary = isNegotiated
        ? (emp.negotiatedSalary || 15000000)
        : Math.round((grade?.standardBaseRate || 5000000) * (grade?.coefficients[emp.tierIndex - 1] || 1));

      const assignedProjs: string[] = [];
      let hasVehicle = false;
      if (emp.projectAllowances) {
        Object.entries(emp.projectAllowances).forEach(([pid, cfg]) => {
          if (cfg.assigned) {
            const p = projects.find((proj) => proj.id === pid);
            if (p) assignedProjs.push(p.code);
            if (cfg.hasCompanyVehicle) hasVehicle = true;
          }
        });
      }

      return [
        idx + 1,
        emp.code,
        `"${emp.fullName}"`,
        `"${dept?.name || ''}"`,
        `"${emp.position}"`,
        isNegotiated ? 'Lương thỏa thuận' : `Bậc ${emp.tierIndex}`,
        baseSalary,
        emp.responsibilityAllowance || 0,
        hasVehicle ? 'Có cấp xe (Miễn xăng)' : 'Tự túc xe',
        `"${assignedProjs.join(', ')}"`,
        `"${emp.socialInsuranceCode || ''}"`,
        `"${emp.hometown || ''}"`,
        `"${emp.currentAddress || ''}"`,
        `"${emp.bankAccount}"`,
        `"${emp.bankName}"`,
        `"${emp.identityCard}"`,
        `"${emp.phone}"`,
        `"${emp.email}"`,
        emp.dependentsCount,
        emp.status === 'active' ? 'Chính thức' : emp.status === 'probation' ? 'Thử việc' : 'Đã nghỉ',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_Sach_Nhan_Su_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất danh sách nhân sự đầy đủ ra file CSV!', 'success');
  };

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    fullName: '',
    departmentId: departments[0]?.id || '',
    position: '',
    positionRank: 'C',
    gradeId: grades[0]?.id || '',
    tierIndex: 1,
    salaryType: 'scale' as 'scale' | 'negotiated',
    negotiatedType: 'monthly' as 'monthly' | 'daily',
    negotiatedSalary: 15000000,
    negotiatedDailyRate: 576923,
    responsibilityAllowance: 0,
    email: '',
    phone: '',
    identityCard: '',
    joinDate: new Date().toISOString().split('T')[0],
    bankAccount: '',
    bankName: 'Techcombank - CN Sài Gòn',
    socialInsuranceCode: '',
    hometown: '',
    currentAddress: '',
    dependentsCount: 0,
    status: 'active' as 'active' | 'probation' | 'leave' | 'terminated',
    projectAllowances: {} as Record<string, EmployeeProjectAllowance>,
  });

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.socialInsuranceCode && emp.socialInsuranceCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.hometown && emp.hometown.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.currentAddress && emp.currentAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.bankAccount.includes(searchTerm);
    const matchDept = selectedDept === 'all' || emp.departmentId === selectedDept;
    return matchSearch && matchDept;
  });

  const handleOpenAdd = () => {
    const nextNum = employees.length + 1;
    const initialAllowances: Record<string, EmployeeProjectAllowance> = {};
    projects.forEach((p) => {
      initialAllowances[p.id] = {
        projectId: p.id,
        assigned: false,
        hasCompanyVehicle: false,
        hasFuelAllowance: true,
        hasMealAllowance: true,
      };
    });

    const defaultPos = jobPositions[0]?.title || 'Chỉ huy trưởng';
    const defaultRank = jobPositions[0]?.rank || 'A';

    setFormData({
      code: `NV-${String(nextNum).padStart(3, '0')}`,
      fullName: '',
      departmentId: departments[0]?.id || '',
      position: defaultPos,
      positionRank: defaultRank,
      gradeId: grades[0]?.id || '',
      tierIndex: 1,
      salaryType: 'scale',
      negotiatedType: 'monthly',
      negotiatedSalary: 15000000,
      negotiatedDailyRate: 576923,
      responsibilityAllowance: 0,
      email: '',
      phone: '',
      identityCard: '079' + Math.floor(100000000 + Math.random() * 900000000),
      joinDate: new Date().toISOString().split('T')[0],
      bankAccount: '190' + Math.floor(1000000000 + Math.random() * 9000000000),
      bankName: 'Techcombank - CN Sài Gòn',
      socialInsuranceCode: '792' + Math.floor(1000000 + Math.random() * 9000000),
      hometown: '',
      currentAddress: '',
      dependentsCount: 0,
      status: 'active',
      projectAllowances: initialAllowances,
    });
    setEditingEmp(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    const initialAllowances: Record<string, EmployeeProjectAllowance> = {};
    projects.forEach((p) => {
      if (emp.projectAllowances?.[p.id]) {
        initialAllowances[p.id] = { ...emp.projectAllowances[p.id] };
      } else {
        initialAllowances[p.id] = {
          projectId: p.id,
          assigned: false,
          hasCompanyVehicle: false,
          hasFuelAllowance: true,
          hasMealAllowance: true,
        };
      }
    });

    const matchedRank =
      emp.positionRank ||
      jobPositions.find((p) => p.title.toLowerCase() === emp.position.toLowerCase())?.rank ||
      'C';

    const empNegotiatedSalary = emp.negotiatedSalary || 15000000;
    const empDailyRate = emp.negotiatedDailyRate || Math.round(empNegotiatedSalary / 26);

    setFormData({
      code: emp.code,
      fullName: emp.fullName,
      departmentId: emp.departmentId,
      position: emp.position,
      positionRank: matchedRank,
      gradeId: emp.gradeId,
      tierIndex: emp.tierIndex,
      salaryType: emp.salaryType || 'scale',
      negotiatedType: emp.negotiatedType || 'monthly',
      negotiatedSalary: empNegotiatedSalary,
      negotiatedDailyRate: empDailyRate,
      responsibilityAllowance: emp.responsibilityAllowance || 0,
      email: emp.email,
      phone: emp.phone,
      identityCard: emp.identityCard,
      joinDate: emp.joinDate,
      bankAccount: emp.bankAccount,
      bankName: emp.bankName,
      socialInsuranceCode: emp.socialInsuranceCode || '',
      hometown: emp.hometown || '',
      currentAddress: emp.currentAddress || '',
      dependentsCount: emp.dependentsCount,
      status: emp.status,
      projectAllowances: initialAllowances,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showToast('Vui lòng nhập họ và tên nhân viên', 'error');
      return;
    }

    if (editingEmp) {
      updateEmployee({
        ...editingEmp,
        ...formData,
      });
    } else {
      addEmployee(formData);
    }
    setIsAddModalOpen(false);
  };

  // Quick Allowance Modal
  const handleOpenAllowanceModal = (emp: Employee) => {
    setAllowanceEmp(emp);
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

  const handleSaveDraftAllowances = () => {
    if (!allowanceEmp) return;
    updateEmployeeProjectAllowances(allowanceEmp.id, draftProjectAllowances);
    setAllowanceEmp(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân sự..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500 w-52 sm:w-64"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Phòng ban:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center">
            <button
              onClick={handleExportEmployeesExcel}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-l-lg flex items-center space-x-1.5 transition-colors border border-emerald-300 shadow-2xs"
              title="Xuất danh sách nhân sự ra file Excel (.xlsx) theo cấu hình mẫu đã cài đặt"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => setActiveMainTab('settings')}
              className="px-2 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-r-lg border-y border-r border-emerald-300 transition-colors"
              title="Cài đặt mẫu xuất Excel nhân sự (Đổi tên file, ẩn/hiện cột, định dạng)"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-700" />
            </button>
          </div>

          <button
            onClick={handleExportEmployeesPDF}
            className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-rose-300 shadow-2xs"
            title="Xuất danh sách nhân sự ra file PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Xuất PDF (.pdf)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm nhân sự</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkGridModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            title="Mở bảng tính lưới (Grid spreadsheet) để nhập liệu hoặc dán nhiều nhân sự cùng lúc từ Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Nhập hàng loạt (Grid)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('contracts')}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center space-x-1.5 border border-blue-300 shadow-2xs transition-colors cursor-pointer"
            title="Chuyển đến màn hình Quản lý Hợp đồng lao động chuyên sâu"
          >
            <FileSignature className="w-3.5 h-3.5 text-blue-700" />
            <span>Quản lý Hợp đồng</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-4 w-44">Nhân sự</th>
                <th className="py-3 px-3">Phòng ban & Vị trí</th>
                <th className="py-3 px-3">Hình thức lương</th>
                <th className="py-3 px-3">Phụ cấp trách nhiệm</th>
                <th className="py-3 px-4">Tùy chọn phụ cấp công trình</th>
                <th className="py-3 px-3">Mã số BHXH</th>
                <th className="py-3 px-3">STK Ngân hàng</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredEmployees.map((emp, idx) => {
                const dept = departments.find((d) => d.id === emp.departmentId);
                const grade = grades.find((g) => g.id === emp.gradeId);
                const isNegotiated = emp.salaryType === 'negotiated';

                // Count projects and vehicle status
                let assignedCount = 0;
                let hasVehicle = false;
                const assignedCodes: string[] = [];
                if (emp.projectAllowances) {
                  Object.entries(emp.projectAllowances).forEach(([pid, cfg]) => {
                    if (cfg.assigned) {
                      assignedCount++;
                      const p = projects.find((proj) => proj.id === pid);
                      if (p) assignedCodes.push(p.code);
                      if (cfg.hasCompanyVehicle) hasVehicle = true;
                    }
                  });
                }

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {emp.fullName.split(' ').pop()?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{emp.fullName}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {emp.code} · {emp.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{emp.position}</div>
                      <div className="text-[11px] text-slate-500">{dept?.name || 'Chưa gán'}</div>
                    </td>

                    {/* Hình thức lương */}
                    <td className="py-3 px-3">
                      {isNegotiated ? (
                        <div>
                          {emp.negotiatedType === 'daily' ? (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                ⏱️ Thỏa thuận ngày
                              </span>
                              <div className="text-[11px] font-mono font-bold text-indigo-950 mt-0.5">
                                {formatNumberVN(emp.negotiatedDailyRate || Math.round((emp.negotiatedSalary || 15000000) / 26))} đ/ngày
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                (~{formatNumberVN(emp.negotiatedSalary || 15000000)} đ/tháng)
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                📅 Thỏa thuận trọn tháng
                              </span>
                              <div className="text-[11px] font-mono font-bold text-purple-950 mt-0.5">
                                {formatNumberVN(emp.negotiatedSalary || 15000000)} đ / tháng
                              </div>
                              <div className="text-[10px] text-slate-500 font-normal">
                                Khoán trọn gói
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-slate-800">{grade?.name || 'Ngạch'}</span>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Bậc {emp.tierIndex} (HS: {grade?.coefficients[emp.tierIndex - 1]?.toFixed(2) || '1.00'})
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Phụ cấp trách nhiệm */}
                    <td className="py-3 px-3 font-mono tabular-nums">
                      {emp.responsibilityAllowance && emp.responsibilityAllowance > 0 ? (
                        <span className="inline-flex items-center font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                          +{formatNumberVN(emp.responsibilityAllowance)} đ
                        </span>
                      ) : (
                        <span className="text-slate-400">0 đ</span>
                      )}
                    </td>

                    {/* Tùy chọn phụ cấp công trình (Xăng, Ăn, Cấp xe) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenAllowanceModal(emp)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                          title="Tùy chọn phụ cấp công trình cho nhân sự này"
                        >
                          <Car className="w-3.5 h-3.5 text-blue-700" />
                          <span>Tùy chọn phụ cấp</span>
                          {assignedCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px]">
                              {assignedCount} CT
                            </span>
                          )}
                        </button>

                        {hasVehicle ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200" title="Được cấp xe công trình đưa đón - Không tính tiền xăng">
                            <Car className="w-3 h-3 text-emerald-700" />
                            <span>Cấp xe (0đ xăng)</span>
                          </span>
                        ) : (
                          assignedCount > 0 && (
                            <span className="text-[11px] bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded-full border border-amber-200">
                              Tự túc xe (Xăng + Ăn)
                            </span>
                          )
                        )}
                      </div>

                      {assignedCodes.length > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Áp dụng: {assignedCodes.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Mã số BHXH */}
                    <td className="py-3 px-3 font-mono">
                      <div className="font-semibold text-blue-900 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200 inline-block text-xs">
                        {emp.socialInsuranceCode || 'Chờ cấp sổ'}
                      </div>
                    </td>

                    {/* STK Ngân hàng */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-900 text-xs">
                        {emp.bankAccount || 'Chưa có'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                        {emp.bankName}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {emp.status === 'active' ? (
                        <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium border border-green-200">
                          Chính thức
                        </span>
                      ) : emp.status === 'probation' ? (
                        <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium border border-amber-200">
                          Thử việc
                        </span>
                      ) : (
                        <span className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-medium border border-rose-200">
                          Đã nghỉ việc
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setActiveMainTab('contracts')}
                          className="p-1.5 text-blue-700 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Xem / Quản lý Hợp đồng lao động của nhân sự này"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenAllowanceModal(emp)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Tùy chọn tích phụ cấp từng công trình"
                        >
                          <Car className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin nhân viên"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Xóa hồ sơ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TÙY CHỌN PHỤ CẤP CÔNG TRÌNH THEO TỪNG NHÂN SỰ */}
      {allowanceEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-700" />
                  Tùy Chọn Phụ Cấp Công Trình Theo Từng Nhân Sự
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân viên: <strong className="text-slate-800">{allowanceEmp.fullName}</strong> ({allowanceEmp.code}) - {allowanceEmp.position}
                </p>
              </div>
              <button
                onClick={() => setAllowanceEmp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Quy tắc tính phụ cấp công trình:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-blue-800">
                    <li><strong>Phụ cấp tiền xăng:</strong> Cự ly từng công trình × Giá xăng ({formatNumberVN(settings.gasolinePricePerKm || 1800)} đ/km)</li>
                    <li><strong>Phụ cấp tiền ăn theo ngày:</strong> Tiền ăn theo ngày cho từng công trình ({formatNumberVN(settings.projectDailyMealStandard || 50000)} đ/ngày)</li>
                    <li><strong>Cấp xe đi công trình:</strong> Nếu cấp xe sẽ <strong>KHÔNG tính tiền phụ cấp xăng</strong> (Hệ thống tự động miễn tính xăng)</li>
                  </ul>
                </div>
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

                  return (
                    <div
                      key={proj.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        draft.assigned
                          ? 'bg-white border-blue-300 shadow-2xs ring-1 ring-blue-100'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.assigned}
                            onChange={() => handleToggleAssigned(proj.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-slate-800 text-xs">
                              [{proj.code}] {proj.name}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              Cự ly: <strong>{proj.distanceKm} km</strong>
                            </span>
                          </div>
                        </label>

                        {draft.assigned && draft.hasCompanyVehicle && (
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                            <Car className="w-3 h-3 text-emerald-700" />
                            Đã cấp xe (Miễn tiền xăng)
                          </span>
                        )}
                      </div>

                      {draft.assigned && (
                        <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          {/* 1. Tích Cấp xe công trình */}
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
                              <span className="block text-xs font-semibold">Cấp xe công trình</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                (Không tính tiền xăng)
                              </span>
                            </div>
                          </label>

                          {/* 2. Tích Phụ cấp tiền xăng */}
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
                              <span className="block text-xs font-semibold">Phụ cấp tiền xăng</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {draft.hasCompanyVehicle ? 'Được cấp xe: 0 đ' : `${proj.distanceKm}km × Giá xăng`}
                              </span>
                            </div>
                          </label>

                          {/* 3. Tích Phụ cấp tiền ăn */}
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
                              <span className="block text-xs font-semibold">Phụ cấp tiền ăn</span>
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

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setAllowanceEmp(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveDraftAllowances}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg shadow-xs"
              >
                Lưu tùy chọn phụ cấp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT EMPLOYEE MODAL (Full profile + Salary Type + Allowances) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingEmp ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mã nhân viên</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phòng ban</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Vị trí việc làm</label>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                      List sổ xuống
                    </span>
                  </div>
                  <select
                    value={formData.position}
                    onChange={(e) => {
                      const selectedTitle = e.target.value;
                      const matched = jobPositions.find((p) => p.title === selectedTitle);
                      setFormData({
                        ...formData,
                        position: selectedTitle,
                        positionRank: matched?.rank || formData.positionRank || 'C',
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-900 focus:outline-blue-500"
                    required
                  >
                    <option value="">-- Chọn vị trí việc làm --</option>
                    {jobPositions.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title} ({p.code}){p.rank ? ` · Hạng ${p.rank}` : ''}
                      </option>
                    ))}
                    {formData.position &&
                      !jobPositions.some((p) => p.title.toLowerCase() === formData.position.toLowerCase()) && (
                        <option value={formData.position}>{formData.position} (Khác)</option>
                      )}
                  </select>
                </div>
              </div>

              {/* Hạng chức danh phụ cấp công tác phí xa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Hạng chức danh (Phụ cấp công tác phí xa)
                  </label>
                  <select
                    value={formData.positionRank || 'C'}
                    onChange={(e) => setFormData({ ...formData, positionRank: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium"
                  >
                    <option value="A">Hạng A: Chỉ huy trưởng, Ban Lãnh đạo, Giám đốc</option>
                    <option value="B">Hạng B: Kỹ thuật, Kỹ sư giám sát, Trưởng bộ phận</option>
                    <option value="C">Hạng C: Kế toán, Hành chính, Vật tư, Chuyên viên</option>
                    <option value="D">Hạng D: Thủ kho, Thủ quỹ, Lái xe, Công nhân</option>
                  </select>
                </div>
                <div className="flex items-center text-[11px] text-slate-500 pt-5">
                  Áp dụng tính phụ cấp công tác phí khi làm việc tại công trình có cự ly từ 50km trở lên.
                </div>
              </div>

              {/* Ngày vào làm & Trạng thái nhân sự (Đồng bộ với Hợp đồng) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/40 rounded-xl border border-blue-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày vào làm việc
                  </label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Trạng thái nhân sự (Đồng bộ Hợp đồng)
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value="active">🟢 Chính thức (Đang làm việc / HĐLĐ hiệu lực)</option>
                    <option value="probation">🟡 Thử việc (Đang trong thời gian thử việc)</option>
                    <option value="terminated">🔴 Đã nghỉ việc (Thanh lý / Chấm dứt HĐLĐ)</option>
                  </select>
                </div>
              </div>

              {/* KHUNG HÌNH THỨC LƯƠNG & PHỤ CẤP TRÁCH NHIỆM */}
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
                <div className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                  <HandCoins className="w-4 h-4 text-purple-700" />
                  Hình Thức Lương & Phụ Cấp Trách Nhiệm
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formSalaryTypeChoice"
                      checked={formData.salaryType === 'scale'}
                      onChange={() => setFormData({ ...formData, salaryType: 'scale' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">Theo Thang 8 Bậc</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formSalaryTypeChoice"
                      checked={formData.salaryType === 'negotiated'}
                      onChange={() => setFormData({ ...formData, salaryType: 'negotiated' })}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-purple-900">Lương Thoả Thuận</span>
                  </label>
                </div>

                {formData.salaryType === 'scale' ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Xếp Ngạch lương</label>
                      <select
                        value={formData.gradeId}
                        onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      >
                        {grades.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Xếp Bậc lương (1 - 8)</label>
                      <select
                        value={formData.tierIndex}
                        onChange={(e) => setFormData({ ...formData, tierIndex: parseInt(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
                          <option key={t} value={t}>
                            Bậc {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {/* Sub-type switcher: Trọn tháng vs Theo ngày */}
                    <div>
                      <label className="block text-purple-900 font-semibold mb-1.5 text-xs">
                        Phương thức tính lương thỏa thuận:
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-white/80 p-1.5 rounded-lg border border-purple-200">
                        <label className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-xs transition-all ${
                          formData.negotiatedType === 'monthly'
                            ? 'bg-purple-100 text-purple-950 font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="negotiatedSubtype"
                            checked={formData.negotiatedType === 'monthly'}
                            onChange={() => setFormData({ ...formData, negotiatedType: 'monthly' })}
                            className="text-purple-700"
                          />
                          <span>📅 Lương trọn tháng</span>
                        </label>

                        <label className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-xs transition-all ${
                          formData.negotiatedType === 'daily'
                            ? 'bg-indigo-100 text-indigo-950 font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="negotiatedSubtype"
                            checked={formData.negotiatedType === 'daily'}
                            onChange={() => setFormData({ ...formData, negotiatedType: 'daily' })}
                            className="text-indigo-700"
                          />
                          <span>⏱️ Lương theo ngày</span>
                        </label>
                      </div>
                    </div>

                    {formData.negotiatedType === 'monthly' ? (
                      <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-1">
                        <label className="block text-purple-950 font-bold text-xs">
                          Mức Lương Thoả Thuận Trọn Tháng (VNĐ / tháng)
                        </label>
                        <input
                          type="number"
                          step="500000"
                          value={formData.negotiatedSalary}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData({
                              ...formData,
                              negotiatedSalary: val,
                              negotiatedDailyRate: Math.round(val / 26),
                            });
                          }}
                          className="w-full px-3 py-1.5 border border-purple-300 rounded bg-purple-50/30 font-mono font-bold text-purple-950 text-xs"
                          placeholder="VD: 25000000"
                        />
                        <p className="text-[11px] text-purple-700 pt-0.5">
                          💡 <strong>Lương trọn tháng (Khoán trọn gói):</strong> Nhân sự nhận nguyên mức lương thỏa thuận cả tháng (không trừ theo ngày công bình thường, trừ khi có ngày nghỉ không phép).
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white rounded-lg border border-indigo-200 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-indigo-950 font-bold text-xs mb-1">
                              Đơn giá Lương / Ngày (VNĐ / ngày)
                            </label>
                            <input
                              type="number"
                              step="50000"
                              value={formData.negotiatedDailyRate || Math.round((formData.negotiatedSalary || 15000000) / 26)}
                              onChange={(e) => {
                                const daily = Number(e.target.value);
                                setFormData({
                                  ...formData,
                                  negotiatedDailyRate: daily,
                                  negotiatedSalary: Math.round(daily * 26),
                                });
                              }}
                              className="w-full px-2.5 py-1.5 border border-indigo-300 rounded bg-indigo-50/30 font-mono font-bold text-indigo-950 text-xs"
                              placeholder="VD: 850000"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold text-xs mb-1">
                              Quy đổi tháng (x26 ngày chuẩn)
                            </label>
                            <input
                              type="number"
                              step="500000"
                              value={formData.negotiatedSalary}
                              onChange={(e) => {
                                const monthly = Number(e.target.value);
                                setFormData({
                                  ...formData,
                                  negotiatedSalary: monthly,
                                  negotiatedDailyRate: Math.round(monthly / 26),
                                });
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 font-mono text-slate-800 text-xs"
                              placeholder="VD: 22100000"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-indigo-800 pt-0.5">
                          💡 <strong>Lương tính theo ngày công:</strong> Lương thực tế = <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-indigo-900">Đơn giá ngày × Số ngày công thực tế</code> (gồm cả ngày phép có lương) trong tháng.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-amber-900 font-semibold mb-1">
                    Phụ Cấp Trách Nhiệm (VNĐ / tháng)
                  </label>
                  <input
                    type="number"
                    step="200000"
                    value={formData.responsibilityAllowance}
                    onChange={(e) => setFormData({ ...formData, responsibilityAllowance: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded bg-white font-mono font-bold text-amber-950"
                    placeholder="VD: 2000000"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Chi trả cho vai trò chỉ huy trưởng, quản lý, trưởng nhóm, trách nhiệm dự án
                  </span>
                </div>
              </div>

              {/* TÙY CHỌN PHỤ CẤP CÔNG TRÌNH */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2.5">
                <div className="font-bold text-blue-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-blue-700" />
                    Tùy Chọn Phụ Cấp Từng Công Trình
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Tích chọn: Xăng, Ăn theo ngày, Cấp xe)
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {projects.map((proj) => {
                    const draft = formData.projectAllowances[proj.id] || {
                      projectId: proj.id,
                      assigned: false,
                      hasCompanyVehicle: false,
                      hasFuelAllowance: true,
                      hasMealAllowance: true,
                    };

                    return (
                      <div
                        key={proj.id}
                        className={`p-2.5 rounded-lg border text-xs transition-colors ${
                          draft.assigned ? 'bg-white border-blue-200 shadow-2xs' : 'bg-slate-50/70 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draft.assigned}
                              onChange={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  projectAllowances: {
                                    ...prev.projectAllowances,
                                    [proj.id]: {
                                      ...draft,
                                      assigned: !draft.assigned,
                                    },
                                  },
                                }));
                              }}
                              className="w-3.5 h-3.5 text-blue-600 rounded"
                            />
                            <span className="font-semibold text-slate-800">
                              [{proj.code}] {proj.name} ({proj.distanceKm}km)
                            </span>
                          </label>

                          {draft.assigned && draft.hasCompanyVehicle && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Cấp xe (0đ xăng)
                            </span>
                          )}
                        </div>

                        {draft.assigned && (
                          <div className="mt-2 pl-5 grid grid-cols-3 gap-2 text-[11px]">
                            {/* Cấp xe */}
                            <label className="flex items-center space-x-1.5 cursor-pointer text-emerald-800">
                              <input
                                type="checkbox"
                                checked={draft.hasCompanyVehicle}
                                onChange={() => {
                                  const nextV = !draft.hasCompanyVehicle;
                                  setFormData((prev) => ({
                                    ...prev,
                                    projectAllowances: {
                                      ...prev.projectAllowances,
                                      [proj.id]: {
                                        ...draft,
                                        hasCompanyVehicle: nextV,
                                        hasFuelAllowance: nextV ? false : true,
                                      },
                                    },
                                  }));
                                }}
                                className="w-3 h-3 text-emerald-600 rounded"
                              />
                              <span>Cấp xe (Miễn xăng)</span>
                            </label>

                            {/* Tiền xăng */}
                            <label className={`flex items-center space-x-1.5 ${draft.hasCompanyVehicle ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer text-amber-800'}`}>
                              <input
                                type="checkbox"
                                disabled={draft.hasCompanyVehicle}
                                checked={draft.hasCompanyVehicle ? false : draft.hasFuelAllowance}
                                onChange={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    projectAllowances: {
                                      ...prev.projectAllowances,
                                      [proj.id]: {
                                        ...draft,
                                        hasFuelAllowance: !draft.hasFuelAllowance,
                                      },
                                    },
                                  }));
                                }}
                                className="w-3 h-3 text-amber-600 rounded"
                              />
                              <span>Phụ cấp xăng</span>
                            </label>

                            {/* Tiền ăn */}
                            <label className="flex items-center space-x-1.5 cursor-pointer text-blue-800">
                              <input
                                type="checkbox"
                                checked={draft.hasMealAllowance}
                                onChange={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    projectAllowances: {
                                      ...prev.projectAllowances,
                                      [proj.id]: {
                                        ...draft,
                                        hasMealAllowance: !draft.hasMealAllowance,
                                      },
                                    },
                                  }));
                                }}
                                className="w-3 h-3 text-blue-600 rounded"
                              />
                              <span>Phụ cấp ăn/ngày</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Thông tin liên hệ & pháp lý */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="09xx xxx xxx"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="email@enterprise.vn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số CCCD / CMND</label>
                  <input
                    type="text"
                    value={formData.identityCard}
                    onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                    placeholder="079..."
                  />
                </div>
                <div>
                  <label className="block text-blue-900 font-semibold mb-1">Mã số BHXH (Số sổ)</label>
                  <input
                    type="text"
                    value={formData.socialInsuranceCode}
                    onChange={(e) => setFormData({ ...formData, socialInsuranceCode: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-blue-300 bg-blue-50/30 rounded font-mono font-medium"
                    placeholder="VD: 7920194832"
                  />
                </div>
              </div>

              {/* Nguyên quán & Giảm trừ gia cảnh */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nguyên quán (Quê quán)</label>
                  <input
                    type="text"
                    value={formData.hometown}
                    onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="VD: Bến Tre / Nam Định..."
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Người phụ thuộc giảm trừ</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.dependentsCount}
                    onChange={(e) => setFormData({ ...formData, dependentsCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Chỗ ở hiện nay</label>
                <input
                  type="text"
                  value={formData.currentAddress}
                  onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  placeholder="Địa chỉ cư trú hiện tại..."
                />
              </div>

              {/* STK Ngân Hàng */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số tài khoản ngân hàng (STK)</label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-semibold"
                    placeholder="VD: 1903456789101"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngân hàng & Chi nhánh</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="VD: Techcombank - CN Sài Gòn"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-semibold shadow-xs"
                >
                  {editingEmp ? 'Lưu thay đổi' : 'Thêm nhân sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NHẬP LIỆU NHÂN SỰ HÀNG LOẠT (SPREADSHEET GRID) */}
      <BulkEmployeeGridModal
        isOpen={isBulkGridModalOpen}
        onClose={() => setIsBulkGridModalOpen(false)}
        onSaveBatch={(newEmps) => batchAddEmployees(newEmps)}
        departments={departments}
        jobPositions={jobPositions}
        grades={grades}
        projects={projects}
        existingEmployees={employees}
      />
    </div>
  );
};
