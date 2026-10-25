import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  SalaryGrade,
  Department,
  Employee,
  LaborContract,
  ContractType,
  ContractAppendix,
  InsuranceProfile,
  TimesheetRecord,
  SalaryAdvanceRecord,
  HRSettings,
  PayrollItem,
  ConstructionProject,
  RemoteAllowanceRate,
  EmployeeProjectAllowance,
  JobPosition,
  PerformanceReview,
  MainTabType,
  ExcelExportGlobalSettings,
  ExcelColumnConfig,
  ExcelTableExportConfig,
  ExcelTableId,
  AppRole,
  RolePermissions,
} from '../types/hrm';
import {
  initialDepartments,
  initialSalaryGrades,
  initialEmployees,
  initialContracts,
  initialInsuranceProfiles,
  initialTimesheets,
  initialSalaryAdvances,
  initialHRSettings,
  initialProjects,
  initialRemoteAllowanceRates,
  initialJobPositions,
  initialPerformanceReviews,
} from '../data/mockHrmData';
import { initialExcelGlobalSettings } from '../data/defaultExcelExportConfig';
import { DocumentTemplate } from '../types/contractTemplate';
import { initialDocumentTemplates } from '../data/defaultContractTemplates';
import { calculateEmployeePayroll } from '../utils/payrollCalculator';

interface HRMContextType {
  departments: Department[];
  jobPositions: JobPosition[];
  grades: SalaryGrade[];
  employees: Employee[];
  contracts: LaborContract[];
  insurances: InsuranceProfile[];
  timesheets: TimesheetRecord[];
  advances: SalaryAdvanceRecord[];
  projects: ConstructionProject[];
  remoteAllowanceRates: RemoteAllowanceRate[];
  reviews: PerformanceReview[];
  settings: HRSettings;
  currentMonth: string;
  payrollItems: PayrollItem[];
  selectedEmployeeForSlip: PayrollItem | null;
  activeMainTab: MainTabType;
  activeSubTab: 'salary-scale' | 'payroll' | 'tier-position' | 'advances' | 'insurance' | 'settings' | 'allowances' | 'kpi-review';
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Cấu hình Xuất Excel Động
  excelExportSettings: ExcelExportGlobalSettings;
  updateExcelGlobalSettings: (settings: Partial<ExcelExportGlobalSettings>) => void;
  updateExcelTableConfig: (tableId: string, config: Partial<ExcelTableExportConfig>) => void;
  updateExcelColumnConfig: (tableId: string, columnId: string, updates: Partial<ExcelColumnConfig>) => void;
  addExcelColumn: (tableId: string, column: ExcelColumnConfig) => void;
  removeExcelColumn: (tableId: string, columnId: string) => void;
  reorderExcelColumns: (tableId: string, startIndex: number, endIndex: number) => void;
  resetExcelConfig: (tableId?: string) => void;
  addExcelTable: (table: ExcelTableExportConfig) => void;
  deleteExcelTable: (tableId: string) => void;

  // Actions
  setActiveMainTab: (tab: MainTabType) => void;
  setActiveSubTab: (subTab: 'salary-scale' | 'payroll' | 'tier-position' | 'advances' | 'insurance' | 'settings' | 'allowances' | 'kpi-review') => void;
  setCurrentMonth: (month: string) => void;
  setSelectedEmployeeForSlip: (item: PayrollItem | null) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  // CRUD
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;

  addJobPosition: (pos: Omit<JobPosition, 'id'>) => void;
  updateJobPosition: (pos: JobPosition) => void;
  deleteJobPosition: (id: string) => void;

  addProject: (p: Omit<ConstructionProject, 'id'>) => void;
  updateProject: (p: ConstructionProject) => void;
  deleteProject: (id: string) => void;
  updateRemoteAllowanceRates: (rates: RemoteAllowanceRate[]) => void;

  // KPI Performance Reviews
  addReview: (rev: Omit<PerformanceReview, 'id' | 'updatedAt'>) => void;
  updateReview: (rev: PerformanceReview) => void;
  deleteReview: (id: string) => void;
  batchUpdateReviews: (newReviews: PerformanceReview[]) => void;

  updateGrade: (grade: SalaryGrade) => void;
  addGrade: (grade: Omit<SalaryGrade, 'id'>) => void;
  deleteGrade: (id: string) => void;
  batchUpdateGrades: (newGrades: SalaryGrade[]) => void;

  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  batchAddEmployees: (newEmps: Omit<Employee, 'id'>[]) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  updateEmployeeProjectAllowances: (empId: string, allowances: Record<string, EmployeeProjectAllowance>) => void;
  updateEmployeeSalaryConfig: (
    empId: string,
    config: {
      salaryType?: 'scale' | 'negotiated';
      negotiatedType?: 'monthly' | 'daily';
      negotiatedSalary?: number;
      negotiatedDailyRate?: number;
      responsibilityAllowance?: number;
    }
  ) => void;

  addContract: (c: Omit<LaborContract, 'id'>) => void;
  updateContract: (c: LaborContract) => void;
  deleteContract: (id: string) => void;
  renewContract: (
    contractId: string,
    renewal: {
      contractType: ContractType;
      startDate: string;
      endDate?: string;
      baseSalary?: number;
      insuranceSalary?: number;
      notes?: string;
    }
  ) => void;
  terminateContract: (contractId: string, terminationDate: string, reason: string) => void;
  addContractAppendix: (contractId: string, appendix: Omit<ContractAppendix, 'id'>) => void;
  deleteContractAppendix: (contractId: string, appendixId: string) => void;
  batchAddContracts: (newContracts: Omit<LaborContract, 'id'>[]) => void;

  // Document & Contract Templates
  documentTemplates: DocumentTemplate[];
  addDocumentTemplate: (t: Omit<DocumentTemplate, 'id'>) => void;
  updateDocumentTemplate: (t: DocumentTemplate) => void;
  deleteDocumentTemplate: (id: string) => void;
  resetDocumentTemplates: () => void;

  updateInsurance: (ins: InsuranceProfile) => void;
  updateTimesheet: (ts: TimesheetRecord) => void;

  addAdvance: (adv: Omit<SalaryAdvanceRecord, 'id' | 'code'>) => void;
  batchAddAdvances: (records: Omit<SalaryAdvanceRecord, 'id' | 'code'>[]) => void;
  updateAdvanceStatus: (
    id: string,
    status: 'approved' | 'pending' | 'rejected' | 'processed',
    options?: {
      approvedAmount?: number;
      processedBy?: string;
      approvedBy?: string;
      notes?: string;
    }
  ) => void;
  deleteAdvance: (id: string) => void;

  lockedMonths: Record<string, { isLocked: boolean; password?: string; lockedAt?: string; lockedBy?: string }>;
  lockMonth: (month: string, password?: string) => void;
  unlockMonth: (month: string, password?: string) => boolean;
  advanceToNextMonth: (lockCurrentMonth?: boolean, password?: string) => void;

  updateSettings: (newSettings: HRSettings) => void;
  toggleKpiBonus: (enabled?: boolean) => void;
  toggleAllowances: (enabled?: boolean) => void;
  resetToDefaultData: () => void;

  // Admin App & Role Permission Exclusive Authority
  adminAppEmail: string;
  isAppAdmin: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  rolePermissions: RolePermissions;
  verifyAdminAppPasscode: (passcode: string) => boolean;
  updateAdminAppPasscode: (oldPasscode: string, newPasscode: string) => boolean;
  updateRolePermissionByAdmin: (role: keyof RolePermissions, permission: 'view' | 'edit', adminPasscode?: string) => boolean;
  canActiveRoleEdit: boolean;
  logoutAppAdmin: () => void;
}

const HRMContext = createContext<HRMContextType | undefined>(undefined);

const STORAGE_KEY = 'hrm_enterprise_data_v1';

export const HRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Main tabs & Sub tabs
  // Default to compensation -> payroll according to user's request
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('compensation');
  const [activeSubTab, setActiveSubTab] = useState<'salary-scale' | 'payroll' | 'tier-position' | 'advances' | 'insurance' | 'settings' | 'allowances' | 'kpi-review'>('payroll');
  const [currentMonth, setCurrentMonth] = useState<string>('2026-10');
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = useState<PayrollItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Dynamic Excel Export Settings
  const [excelExportSettings, setExcelExportSettings] = useState<ExcelExportGlobalSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_excel_export_settings`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tables && parsed.tables.payroll) {
          return parsed;
        }
      } catch {
        return initialExcelGlobalSettings;
      }
    }
    return initialExcelGlobalSettings;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_excel_export_settings`, JSON.stringify(excelExportSettings));
  }, [excelExportSettings]);

  const updateExcelGlobalSettings = (newSettings: Partial<ExcelExportGlobalSettings>) => {
    setExcelExportSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
    showToast('Đã lưu cấu hình chung xuất dữ liệu Excel!', 'success');
  };

  const updateExcelTableConfig = (tableId: ExcelTableId, configUpdates: Partial<ExcelTableExportConfig>) => {
    setExcelExportSettings((prev) => {
      const currentTable = prev.tables[tableId] || initialExcelGlobalSettings.tables[tableId];
      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableId]: {
            ...currentTable,
            ...configUpdates,
          },
        },
      };
    });
    showToast(`Đã lưu cấu hình xuất Excel cho ${configUpdates.tableName || tableId}!`, 'success');
  };

  const updateExcelColumnConfig = (
    tableId: ExcelTableId,
    columnId: string,
    updates: Partial<ExcelColumnConfig>
  ) => {
    setExcelExportSettings((prev) => {
      const currentTable = prev.tables[tableId] || initialExcelGlobalSettings.tables[tableId];
      const updatedColumns = currentTable.columns.map((col) =>
        col.id === columnId ? { ...col, ...updates } : col
      );
      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableId]: {
            ...currentTable,
            columns: updatedColumns,
          },
        },
      };
    });
  };

  const addExcelColumn = (tableId: ExcelTableId, column: ExcelColumnConfig) => {
    setExcelExportSettings((prev) => {
      const currentTable = prev.tables[tableId] || initialExcelGlobalSettings.tables[tableId];
      // Check if ID already exists, if so append unique suffix
      let uniqueId = column.id;
      let counter = 1;
      while (currentTable.columns.some((c) => c.id === uniqueId)) {
        uniqueId = `${column.id}_${counter++}`;
      }
      const newColumn: ExcelColumnConfig = {
        ...column,
        id: uniqueId,
        order: currentTable.columns.length + 1,
        enabled: column.enabled !== undefined ? column.enabled : true,
        isCustom: true,
      };
      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableId]: {
            ...currentTable,
            columns: [...currentTable.columns, newColumn],
          },
        },
      };
    });
    showToast(`Đã thêm trường dữ liệu "${column.customLabel || column.defaultLabel}" vào bảng xuất Excel!`, 'success');
  };

  const removeExcelColumn = (tableId: ExcelTableId, columnId: string) => {
    setExcelExportSettings((prev) => {
      const currentTable = prev.tables[tableId] || initialExcelGlobalSettings.tables[tableId];
      const filtered = currentTable.columns.filter((c) => c.id !== columnId);
      filtered.forEach((c, idx) => {
        c.order = idx + 1;
      });
      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableId]: {
            ...currentTable,
            columns: filtered,
          },
        },
      };
    });
    showToast(`Đã xóa trường dữ liệu khỏi bảng xuất Excel`, 'info');
  };

  const reorderExcelColumns = (tableId: ExcelTableId, startIndex: number, endIndex: number) => {
    setExcelExportSettings((prev) => {
      const currentTable = prev.tables[tableId] || initialExcelGlobalSettings.tables[tableId];
      const newColumns = [...currentTable.columns];
      const [moved] = newColumns.splice(startIndex, 1);
      newColumns.splice(endIndex, 0, moved);
      newColumns.forEach((col, idx) => {
        col.order = idx + 1;
      });
      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableId]: {
            ...currentTable,
            columns: newColumns,
          },
        },
      };
    });
  };

  const resetExcelConfig = (tableId?: string) => {
    if (tableId) {
      if (initialExcelGlobalSettings.tables[tableId]) {
        setExcelExportSettings((prev) => ({
          ...prev,
          tables: {
            ...prev.tables,
            [tableId]: JSON.parse(JSON.stringify(initialExcelGlobalSettings.tables[tableId])),
          },
        }));
        showToast(`Đã khôi phục cấu hình xuất Excel mặc định cho ${tableId}`, 'info');
      } else {
        showToast(`Bảng ${tableId} là bảng tùy biến, không có cấu hình hệ thống mặc định`, 'info');
      }
    } else {
      setExcelExportSettings(JSON.parse(JSON.stringify(initialExcelGlobalSettings)));
      showToast('Đã khôi phục tất cả cấu hình xuất Excel về mặc định!', 'info');
    }
  };

  const addExcelTable = (newTable: ExcelTableExportConfig) => {
    setExcelExportSettings((prev) => {
      let tid = (newTable.tableId || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!tid) tid = `bang_${Date.now()}`;
      let uniqueId = tid;
      let counter = 1;
      while (prev.tables[uniqueId]) {
        uniqueId = `${tid}_${counter++}`;
      }
      const tableWithId: ExcelTableExportConfig = {
        ...newTable,
        tableId: uniqueId,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        tables: {
          ...prev.tables,
          [uniqueId]: tableWithId,
        },
      };
    });
    showToast(`Đã thêm bảng xuất Excel mới: "${newTable.tableName}"!`, 'success');
  };

  const deleteExcelTable = (tableId: string) => {
    setExcelExportSettings((prev) => {
      const targetName = prev.tables[tableId]?.tableName || tableId;
      const nextTables = { ...prev.tables };
      delete nextTables[tableId];
      return {
        ...prev,
        tables: nextTables,
      };
    });
    showToast(`Đã xóa bảng xuất Excel khỏi hệ thống`, 'info');
  };

  // Core entities state
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_departments`);
    return saved ? JSON.parse(saved) : initialDepartments;
  });

  const [jobPositions, setJobPositions] = useState<JobPosition[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_job_positions`);
    return saved ? JSON.parse(saved) : initialJobPositions;
  });

  const [grades, setGrades] = useState<SalaryGrade[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_grades`);
    return saved ? JSON.parse(saved) : initialSalaryGrades;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_employees`);
    if (!saved) return initialEmployees;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].socialInsuranceCode) {
        return initialEmployees;
      }
      return parsed;
    } catch {
      return initialEmployees;
    }
  });

  const [contracts, setContracts] = useState<LaborContract[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_contracts`);
    return saved ? JSON.parse(saved) : initialContracts;
  });

  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_document_templates`);
    return saved ? JSON.parse(saved) : initialDocumentTemplates;
  });

  const [insurances, setInsurances] = useState<InsuranceProfile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_insurances`);
    return saved ? JSON.parse(saved) : initialInsuranceProfiles;
  });

  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_timesheets`);
    return saved ? JSON.parse(saved) : initialTimesheets;
  });

  const [advances, setAdvances] = useState<SalaryAdvanceRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_advances`);
    return saved ? JSON.parse(saved) : initialSalaryAdvances;
  });

  const [settings, setSettings] = useState<HRSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    if (!saved) return initialHRSettings;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...initialHRSettings,
        ...parsed,
        enableKpiBonus: typeof parsed.enableKpiBonus === 'boolean' ? parsed.enableKpiBonus : false,
        enableAllowances: typeof parsed.enableAllowances === 'boolean' ? parsed.enableAllowances : false,
      };
    } catch {
      return initialHRSettings;
    }
  });

  const [projects, setProjects] = useState<ConstructionProject[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_projects`);
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [remoteAllowanceRates, setRemoteAllowanceRates] = useState<RemoteAllowanceRate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_remote_rates`);
    return saved ? JSON.parse(saved) : initialRemoteAllowanceRates;
  });

  const [reviews, setReviews] = useState<PerformanceReview[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_performance_reviews`);
    return saved ? JSON.parse(saved) : initialPerformanceReviews;
  });

  const [lockedMonths, setLockedMonths] = useState<Record<string, { isLocked: boolean; password?: string; lockedAt?: string; lockedBy?: string }>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_locked_months`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_locked_months`, JSON.stringify(lockedMonths));
  }, [lockedMonths]);

  // Admin App & Exclusive Permission Authority State
  const adminAppEmail = 'lethanhhuy1989@gmail.com';
  const [adminAppPasscode, setAdminAppPasscodeState] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_admin_app_passcode`) || 'admin@2026';
  });

  const [isAppAdmin, setIsAppAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(`${STORAGE_KEY}_is_app_admin`) === 'true';
  });

  const [activeRole, setActiveRole] = useState<AppRole>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_active_role`);
    return (saved as AppRole) || 'director';
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_role_permissions`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      director: 'view', // Note: Ban Giám Đốc mặc định Chỉ Xem cho đến khi Admin App cấp quyền Sửa!
      payroll_accountant: 'view',
      site_manager: 'view',
      employee: 'view',
    };
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_role_permissions`, JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_active_role`, activeRole);
  }, [activeRole]);

  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}_is_app_admin`, isAppAdmin ? 'true' : 'false');
  }, [isAppAdmin]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_departments`, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_job_positions`, JSON.stringify(jobPositions));
  }, [jobPositions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_grades`, JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_employees`, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_contracts`, JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_document_templates`, JSON.stringify(documentTemplates));
  }, [documentTemplates]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_insurances`, JSON.stringify(insurances));
  }, [insurances]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_timesheets`, JSON.stringify(timesheets));
  }, [timesheets]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_advances`, JSON.stringify(advances));
  }, [advances]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_remote_rates`, JSON.stringify(remoteAllowanceRates));
  }, [remoteAllowanceRates]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_performance_reviews`, JSON.stringify(reviews));
  }, [reviews]);

  // Toast handler
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Department handlers (Thêm, Sửa, Bớt phòng ban)
  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const newId = `dept-${Date.now()}`;
    const newDept: Department = { ...dept, id: newId };
    setDepartments(prev => [...prev, newDept]);
    showToast(`Đã thêm phòng ban mới: "${dept.name}"`);
  };

  const updateDepartment = (dept: Department) => {
    setDepartments(prev => prev.map(d => (d.id === dept.id ? dept : d)));
    showToast(`Đã cập nhật thông tin phòng ban: "${dept.name}"`);
  };

  const deleteDepartment = (id: string) => {
    if (departments.length <= 1) {
      showToast('Cần duy trì ít nhất 1 phòng ban trong hệ thống!', 'error');
      return;
    }
    const target = departments.find(d => d.id === id);
    const fallback = departments.find(d => d.id !== id);

    // Tự động chuyển nhân viên thuộc phòng bị xóa sang phòng còn lại để không bị mồ côi dữ liệu
    if (fallback) {
      setEmployees(prev =>
        prev.map(emp => (emp.departmentId === id ? { ...emp, departmentId: fallback.id } : emp))
      );
    }
    setDepartments(prev => prev.filter(d => d.id !== id));
    showToast(`Đã xóa phòng ban "${target?.name || id}"`, 'info');
  };

  // Job Positions handlers (Vị trí việc làm: Chỉ huy trưởng, Kỹ thuật, Kế toán, Hành chính, Vật tư, Thủ kho, Thủ quỹ, Lái xe...)
  const addJobPosition = (pos: Omit<JobPosition, 'id'>) => {
    const newId = `pos-${Date.now()}`;
    const newPos: JobPosition = {
      ...pos,
      id: newId,
      code: pos.code.trim().toUpperCase(),
      title: pos.title.trim(),
    };
    setJobPositions(prev => [...prev, newPos]);
    showToast(`Đã thêm vị trí việc làm mới: "${newPos.title}"`);
  };

  const updateJobPosition = (pos: JobPosition) => {
    setJobPositions(prev =>
      prev.map(p =>
        p.id === pos.id
          ? { ...pos, code: pos.code.trim().toUpperCase(), title: pos.title.trim() }
          : p
      )
    );
    showToast(`Đã cập nhật vị trí việc làm: "${pos.title}"`);
  };

  const deleteJobPosition = (id: string) => {
    const target = jobPositions.find(p => p.id === id);
    setJobPositions(prev => prev.filter(p => p.id !== id));
    showToast(`Đã xóa vị trí việc làm "${target?.title || id}"`, 'info');
  };

  // Construction Projects handlers (Công trình & Ký hiệu chấm công)
  const addProject = (p: Omit<ConstructionProject, 'id'>) => {
    const newId = `proj-${Date.now()}`;
    const code = p.code.trim().toUpperCase();
    const newProject: ConstructionProject = {
      ...p,
      id: newId,
      code,
      symbolFull: p.symbolFull?.trim() || code,
      symbolHalf: p.symbolHalf?.trim() || `${code}/2`,
      symbolLeave: p.symbolLeave?.trim() || `${code}/P`,
    };
    setProjects(prev => [...prev, newProject]);
    showToast(`Đã thêm công trình: "${p.name}" (Ký hiệu: ${newProject.symbolFull})`);
  };

  const updateProject = (p: ConstructionProject) => {
    const code = p.code.trim().toUpperCase();
    const updatedProject: ConstructionProject = {
      ...p,
      code,
      symbolFull: p.symbolFull?.trim() || code,
      symbolHalf: p.symbolHalf?.trim() || `${code}/2`,
      symbolLeave: p.symbolLeave?.trim() || `${code}/P`,
    };
    setProjects(prev => prev.map(item => item.id === p.id ? updatedProject : item));
    showToast(`Đã cập nhật công trình: "${p.name}"`);
  };

  const deleteProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    showToast(`Đã xóa công trình "${target?.name || id}"`, 'info');
  };

  const updateRemoteAllowanceRates = (rates: RemoteAllowanceRate[]) => {
    setRemoteAllowanceRates(rates);
    showToast('Đã lưu bảng mức công tác phí công trình xa!');
  };

  // Performance Review (KPI) Handlers
  const addReview = (rev: Omit<PerformanceReview, 'id' | 'updatedAt'>) => {
    const newId = `rev-${Date.now()}`;
    const newRev: PerformanceReview = {
      ...rev,
      id: newId,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setReviews(prev => [...prev, newRev]);
    showToast('Đã lưu đánh giá KPI mới cho nhân sự!');
  };

  const updateReview = (rev: PerformanceReview) => {
    setReviews(prev => {
      const idx = prev.findIndex(r => r.id === rev.id || (r.employeeId === rev.employeeId && r.month === rev.month));
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...rev, updatedAt: new Date().toISOString().split('T')[0] };
        return next;
      }
      return [...prev, { ...rev, updatedAt: new Date().toISOString().split('T')[0] }];
    });
    showToast('Đã cập nhật đánh giá KPI và đồng bộ vào Bảng Lương!');
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast('Đã xóa đánh giá KPI', 'info');
  };

  const batchUpdateReviews = (newReviews: PerformanceReview[]) => {
    setReviews(newReviews);
    showToast('Đã đồng bộ toàn bộ kết quả đánh giá KPI sang Bảng Lương!', 'success');
  };

  // Salary Grades handlers
  const updateGrade = (grade: SalaryGrade) => {
    setGrades(prev => prev.map(g => (g.id === grade.id ? grade : g)));
    showToast(`Đã cập nhật ngạch lương "${grade.name}"`);
  };

  const batchUpdateGrades = (newGrades: SalaryGrade[]) => {
    setGrades(newGrades);
    showToast('Đã lưu toàn bộ thay đổi Thang Bảng Lương thành công!', 'success');
  };

  const addGrade = (grade: Omit<SalaryGrade, 'id'>) => {
    const newId = `grade-${Date.now()}`;
    const newGrade: SalaryGrade = { ...grade, id: newId };
    setGrades(prev => [...prev, newGrade]);
    showToast(`Đã thêm ngạch lương mới "${grade.name}"`);
  };

  const deleteGrade = (id: string) => {
    const grade = grades.find(g => g.id === id);
    setGrades(prev => prev.filter(g => g.id !== id));
    showToast(`Đã xóa ngạch lương "${grade?.name || id}"`, 'info');
  };

  // Employee handlers
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = { ...emp, id: newId };
    setEmployees(prev => [...prev, newEmp]);

    // Calculate initial base salary based on salary type
    const targetGrade = grades.find(g => g.id === emp.gradeId);
    const coeff = targetGrade?.coefficients[emp.tierIndex - 1] || 1;
    const baseSal = emp.salaryType === 'negotiated'
      ? (emp.negotiatedSalary || 15000000)
      : Math.round((targetGrade?.standardBaseRate || 5000000) * coeff);

    // Create automatic initial insurance record
    const newIns: InsuranceProfile = {
      id: `ins-${Date.now()}`,
      employeeId: newId,
      insuranceBookNumber: emp.socialInsuranceCode || 'Chờ cấp sổ',
      hospitalRegistration: 'Bệnh viện Quận 1, TP.HCM',
      insuranceSalary: baseSal,
      status: 'active',
      startDate: newEmp.joinDate,
    };
    setInsurances(prev => [...prev, newIns]);

    // Automatic timesheet record
    const newTs: TimesheetRecord = {
      id: `ts-${Date.now()}`,
      employeeId: newId,
      month: currentMonth,
      standardWorkingDays: settings.standardMonthlyDays,
      actualWorkingDays: settings.standardMonthlyDays,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      otHoursNormal: 0,
      otHoursWeekend: 0,
      lateArrivalMinutes: 0,
    };
    setTimesheets(prev => [...prev, newTs]);

    // Automatic labor contract creation properly linked to newId
    const isProbation = newEmp.status === 'probation';
    const startDate = newEmp.joinDate || new Date().toISOString().split('T')[0];
    const startObj = new Date(startDate);
    const endObj = new Date(startObj);
    if (isProbation) {
      endObj.setDate(endObj.getDate() + 60);
    } else {
      endObj.setFullYear(endObj.getFullYear() + 1);
    }
    const endDate = endObj.toISOString().split('T')[0];

    const newContract: LaborContract = {
      id: `c-${Date.now()}`,
      code: `HDLD-${new Date().getFullYear()}/${newEmp.code}`,
      employeeId: newId,
      contractType: isProbation ? 'probation' : 'definite_1yr',
      contractTypeName: isProbation
        ? 'Hợp đồng thử việc (60 ngày)'
        : 'Hợp đồng xác định thời hạn (12 tháng)',
      startDate,
      endDate,
      signedDate: startDate,
      jobTitle: newEmp.position || 'Chuyên viên',
      baseSalary: baseSal,
      insuranceSalary: baseSal,
      status: 'active',
      workingHours: '48 giờ/tuần (Từ Thứ Hai đến Thứ Bảy, 08h00 - 17h00)',
      workLocation: 'Văn phòng Công ty & các công trình trực thuộc tại TP.HCM và các tỉnh',
      probationRate: isProbation ? 85 : 100,
      probationSalary: isProbation ? Math.round(baseSal * 0.85) : baseSal,
      allowancesDescription: 'Phụ cấp ăn trưa 50.000đ/ngày, Phụ cấp xăng xe và công tác phí theo quy chế công ty',
      paymentMethod: 'Chuyển khoản vào tài khoản ngân hàng của NLĐ vào ngày 05 - 10 hàng tháng',
      signatoryName: 'Lê Thanh Huy',
      signatoryTitle: 'Tổng Giám Đốc',
    };
    setContracts(prev => [newContract, ...prev]);

    showToast(`Đã tiếp nhận nhân sự mới "${emp.fullName}" và tự động tạo Hợp đồng lao động mẫu!`, 'success');
  };

  const batchAddEmployees = (newEmpsList: Omit<Employee, 'id'>[]) => {
    if (!newEmpsList.length) return;
    const now = Date.now();
    const createdEmployees: Employee[] = [];
    const newInsurances: InsuranceProfile[] = [];
    const newTimesheets: TimesheetRecord[] = [];
    const newContracts: LaborContract[] = [];

    newEmpsList.forEach((emp, index) => {
      const newId = `emp-${now}-${index}`;
      const newEmp: Employee = { ...emp, id: newId };
      createdEmployees.push(newEmp);

      const targetGrade = grades.find(g => g.id === emp.gradeId);
      const coeff = targetGrade?.coefficients[emp.tierIndex - 1] || 1;
      const baseSal = emp.salaryType === 'negotiated'
        ? (emp.negotiatedSalary || 15000000)
        : (targetGrade?.standardBaseRate || 5000000) * coeff;

      newInsurances.push({
        id: `ins-${now}-${index}`,
        employeeId: newId,
        insuranceBookNumber: emp.socialInsuranceCode || 'Chờ cấp sổ',
        hospitalRegistration: 'Bệnh viện Quận 1, TP.HCM',
        insuranceSalary: baseSal,
        status: 'active',
        startDate: newEmp.joinDate,
      });

      newTimesheets.push({
        id: `ts-${now}-${index}`,
        employeeId: newId,
        month: currentMonth,
        standardWorkingDays: settings.standardMonthlyDays,
        actualWorkingDays: settings.standardMonthlyDays,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        otHoursNormal: 0,
        otHoursWeekend: 0,
        lateArrivalMinutes: 0,
      });

      const isProbation = newEmp.status === 'probation';
      const startDate = newEmp.joinDate || new Date().toISOString().split('T')[0];
      const startObj = new Date(startDate);
      const endObj = new Date(startObj);
      if (isProbation) {
        endObj.setDate(endObj.getDate() + 60);
      } else {
        endObj.setFullYear(endObj.getFullYear() + 1);
      }
      const endDate = endObj.toISOString().split('T')[0];

      newContracts.push({
        id: `c-${now}-${index}`,
        code: `HDLD-${new Date().getFullYear()}/${newEmp.code}`,
        employeeId: newId,
        contractType: isProbation ? 'probation' : 'definite_1yr',
        contractTypeName: isProbation
          ? 'Hợp đồng thử việc (60 ngày)'
          : 'Hợp đồng xác định thời hạn (12 tháng)',
        startDate,
        endDate,
        signedDate: startDate,
        jobTitle: newEmp.position || 'Chuyên viên',
        baseSalary: baseSal,
        insuranceSalary: baseSal,
        status: 'active',
        probationRate: isProbation ? 85 : 100,
        probationSalary: isProbation ? Math.round(baseSal * 0.85) : baseSal,
      });
    });

    setEmployees(prev => [...prev, ...createdEmployees]);
    setInsurances(prev => [...prev, ...newInsurances]);
    setTimesheets(prev => [...prev, ...newTimesheets]);
    setContracts(prev => [...prev, ...newContracts]);

    showToast(`Đã thêm thành công ${createdEmployees.length} nhân sự mới vào hệ thống!`, 'success');
  };

  const updateEmployee = (emp: Employee) => {
    // 1. Update Employee state
    setEmployees(prev => prev.map(e => (e.id === emp.id ? emp : e)));

    // 2. Calculate new base salary
    const targetGrade = grades.find(g => g.id === emp.gradeId);
    const coeff = targetGrade?.coefficients[emp.tierIndex - 1] || 1;
    const newBaseSal = emp.salaryType === 'negotiated'
      ? (emp.negotiatedSalary || 15000000)
      : Math.round((targetGrade?.standardBaseRate || 5000000) * coeff);

    // 3. Synchronize with Contracts (two-way sync)
    setContracts(prev =>
      prev.map(c => {
        if (c.employeeId !== emp.id) return c;
        // If employee status was changed to terminated (Đã nghỉ việc)
        if (emp.status === 'terminated') {
          return {
            ...c,
            status: 'terminated' as const,
            terminationDate: c.terminationDate || new Date().toISOString().split('T')[0],
            terminationReason: c.terminationReason || 'Nghỉ việc theo hồ sơ nhân sự',
          };
        }
        // If contract is active, keep jobTitle and baseSalary in sync with employee profile
        if (c.status === 'active') {
          return {
            ...c,
            jobTitle: emp.position || c.jobTitle,
            baseSalary: newBaseSal,
            insuranceSalary: newBaseSal,
          };
        }
        return c;
      })
    );

    // 4. Synchronize with Insurance profile
    setInsurances(prev =>
      prev.map(ins => {
        if (ins.employeeId !== emp.id) return ins;
        return {
          ...ins,
          insuranceBookNumber: emp.socialInsuranceCode || ins.insuranceBookNumber,
          insuranceSalary: newBaseSal,
          status: emp.status === 'terminated' ? ('paused' as const) : ('active' as const),
        };
      })
    );

    showToast(`Đã cập nhật thông tin nhân viên ${emp.fullName} và đồng bộ Hợp đồng lao động!`, 'success');
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    setContracts(prev => prev.filter(c => c.employeeId !== id));
    setInsurances(prev => prev.filter(i => i.employeeId !== id));
    setTimesheets(prev => prev.filter(t => t.employeeId !== id));
    showToast(`Đã xóa hồ sơ nhân viên ${emp?.fullName || id}`, 'info');
  };

  // Contract handlers with two-way sync to Employee
  const addContract = (c: Omit<LaborContract, 'id'>) => {
    const newContract: LaborContract = { ...c, id: `contract-${Date.now()}` };
    setContracts(prev => [newContract, ...prev]);

    // Synchronize to Employee if active contract is assigned
    if (c.employeeId && c.status === 'active') {
      setEmployees(prev =>
        prev.map(e => {
          if (e.id !== c.employeeId) return e;
          return {
            ...e,
            position: c.jobTitle || e.position,
            status: c.contractType === 'probation' ? 'probation' : 'active',
            negotiatedSalary: c.baseSalary || e.negotiatedSalary,
          };
        })
      );
    }

    showToast(`Đã tạo hợp đồng mới: ${c.code} và đồng bộ thông tin nhân sự!`, 'success');
  };

  const updateContract = (c: LaborContract) => {
    setContracts(prev => prev.map(item => (item.id === c.id ? c : item)));

    // Synchronize to Employee profile
    if (c.employeeId) {
      setEmployees(prev =>
        prev.map(e => {
          if (e.id !== c.employeeId) return e;
          if (c.status === 'terminated') {
            return { ...e, status: 'terminated' as const };
          }
          if (c.status === 'active') {
            return {
              ...e,
              position: c.jobTitle || e.position,
              status: c.contractType === 'probation' ? 'probation' : 'active',
              negotiatedSalary: c.baseSalary || e.negotiatedSalary,
            };
          }
          return e;
        })
      );
    }

    showToast(`Đã cập nhật hợp đồng: ${c.code} và đồng bộ trạng thái nhân sự!`, 'success');
  };

  const deleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    showToast('Đã xóa hợp đồng lao động', 'info');
  };

  const renewContract = (
    contractId: string,
    renewal: {
      contractType: ContractType;
      startDate: string;
      endDate?: string;
      baseSalary?: number;
      insuranceSalary?: number;
      notes?: string;
    }
  ) => {
    const typeNames: Record<ContractType, string> = {
      probation: 'Hợp đồng thử việc',
      definite_1yr: 'Hợp đồng xác định thời hạn (12 tháng)',
      definite_3yr: 'Hợp đồng xác định thời hạn (36 tháng)',
      indefinite: 'Hợp đồng không xác định thời hạn',
      seasonal: 'Hợp đồng theo mùa vụ / Công trình',
      service: 'Hợp đồng dịch vụ / CTV',
    };

    let targetEmployeeId: string | undefined;

    setContracts(prev => {
      const oldContract = prev.find(c => c.id === contractId);
      if (!oldContract) return prev;
      targetEmployeeId = oldContract.employeeId;

      const newContract: LaborContract = {
        ...oldContract,
        id: `contract-${Date.now()}`,
        code: `${oldContract.code.replace(/-TK\d*$/, '')}-TK${new Date().getFullYear()}`,
        contractType: renewal.contractType,
        contractTypeName: typeNames[renewal.contractType] || oldContract.contractTypeName,
        startDate: renewal.startDate,
        endDate: renewal.endDate,
        signedDate: renewal.startDate,
        baseSalary: renewal.baseSalary ?? oldContract.baseSalary,
        insuranceSalary: renewal.insuranceSalary ?? oldContract.insuranceSalary,
        status: 'active',
        notes: renewal.notes || `Tái ký / gia hạn từ hợp đồng ${oldContract.code}`,
      };

      // Mark old contract as expired
      const updatedList = prev.map(c =>
        c.id === contractId ? { ...c, status: 'expired' as const } : c
      );
      return [newContract, ...updatedList];
    });

    // Synchronize employee status and salary in Employee tab
    if (targetEmployeeId) {
      setEmployees(prev =>
        prev.map(e => {
          if (e.id !== targetEmployeeId) return e;
          return {
            ...e,
            status: renewal.contractType === 'probation' ? ('probation' as const) : ('active' as const),
            negotiatedSalary: renewal.baseSalary ?? e.negotiatedSalary,
          };
        })
      );
    }

    showToast(`Đã tái ký / gia hạn thành công hợp đồng lao động mới và đồng bộ trạng thái nhân sự!`, 'success');
  };

  const terminateContract = (contractId: string, terminationDate: string, reason: string) => {
    let targetEmployeeId: string | undefined;

    setContracts(prev =>
      prev.map(c => {
        if (c.id === contractId) {
          targetEmployeeId = c.employeeId;
          return {
            ...c,
            status: 'terminated' as const,
            terminationDate,
            terminationReason: reason,
          };
        }
        return c;
      })
    );

    // Synchronize Employee status to "terminated" (Đã nghỉ việc) in Employee tab
    if (targetEmployeeId) {
      setEmployees(prev =>
        prev.map(e =>
          e.id === targetEmployeeId ? { ...e, status: 'terminated' as const } : e
        )
      );

      // Pause insurance profile
      setInsurances(prev =>
        prev.map(i =>
          i.employeeId === targetEmployeeId ? { ...i, status: 'paused' as const } : i
        )
      );
    }

    showToast('Đã ghi nhận thanh lý / chấm dứt hợp đồng và đồng bộ trạng thái nhân viên "Đã nghỉ việc"!', 'info');
  };

  const addContractAppendix = (contractId: string, appendix: Omit<ContractAppendix, 'id'>) => {
    const newAppendix: ContractAppendix = {
      ...appendix,
      id: `pl-${Date.now()}`,
    };
    let targetEmployeeId: string | undefined;

    setContracts(prev =>
      prev.map(c => {
        if (c.id === contractId) {
          targetEmployeeId = c.employeeId;
          const appendices = [...(c.appendices || []), newAppendix];
          return {
            ...c,
            appendices,
            baseSalary: appendix.newBaseSalary ?? c.baseSalary,
            insuranceSalary: appendix.newInsuranceSalary ?? c.insuranceSalary,
            jobTitle: appendix.newJobTitle ?? c.jobTitle,
            endDate: appendix.newEndDate ?? c.endDate,
          };
        }
        return c;
      })
    );

    // Synchronize to Employee if appendix adjusted base salary or job title
    if (targetEmployeeId && (appendix.newBaseSalary || appendix.newJobTitle)) {
      setEmployees(prev =>
        prev.map(e => {
          if (e.id !== targetEmployeeId) return e;
          return {
            ...e,
            position: appendix.newJobTitle || e.position,
            negotiatedSalary: appendix.newBaseSalary ?? e.negotiatedSalary,
          };
        })
      );
    }

    showToast(`Đã thêm phụ lục hợp đồng: ${appendix.code} và đồng bộ thông tin nhân sự!`, 'success');
  };

  const deleteContractAppendix = (contractId: string, appendixId: string) => {
    setContracts(prev =>
      prev.map(c => {
        if (c.id === contractId) {
          return {
            ...c,
            appendices: (c.appendices || []).filter(a => a.id !== appendixId),
          };
        }
        return c;
      })
    );
    showToast('Đã xóa phụ lục hợp đồng', 'info');
  };

  const batchAddContracts = (newContractsList: Omit<LaborContract, 'id'>[]) => {
    const timestamp = Date.now();
    const created: LaborContract[] = newContractsList.map((c, idx) => ({
      ...c,
      id: `contract-${timestamp}-${idx}`,
    }));
    setContracts(prev => [...created, ...prev]);

    // Synchronize to employees for active contracts
    const activeSalaryMap = new Map<string, { jobTitle: string; salary: number; status: 'active' | 'probation' }>();
    created.forEach((c) => {
      if (c.employeeId && c.status === 'active') {
        activeSalaryMap.set(c.employeeId, {
          jobTitle: c.jobTitle,
          salary: c.baseSalary,
          status: c.contractType === 'probation' ? 'probation' : 'active',
        });
      }
    });

    if (activeSalaryMap.size > 0) {
      setEmployees(prev =>
        prev.map(e => {
          const matched = activeSalaryMap.get(e.id);
          if (!matched) return e;
          return {
            ...e,
            position: matched.jobTitle || e.position,
            status: matched.status,
            negotiatedSalary: matched.salary || e.negotiatedSalary,
          };
        })
      );
    }

    showToast(`Đã thêm thành công ${created.length} hợp đồng mới và đồng bộ thông tin nhân sự!`, 'success');
  };

  // Document Template Handlers
  const addDocumentTemplate = (t: Omit<DocumentTemplate, 'id'>) => {
    const newTemplate: DocumentTemplate = {
      ...t,
      id: `tmpl-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setDocumentTemplates(prev => [...prev, newTemplate]);
    showToast(`Đã tạo mẫu văn bản mới: "${t.name}"`, 'success');
  };

  const updateDocumentTemplate = (t: DocumentTemplate) => {
    setDocumentTemplates(prev =>
      prev.map(item => (item.id === t.id ? { ...t, updatedAt: new Date().toISOString().split('T')[0] } : item))
    );
    showToast(`Đã lưu cập nhật mẫu: "${t.name}"`, 'success');
  };

  const deleteDocumentTemplate = (id: string) => {
    setDocumentTemplates(prev => prev.filter(item => item.id !== id));
    showToast('Đã xóa mẫu văn bản khỏi hệ thống', 'info');
  };

  const resetDocumentTemplates = () => {
    setDocumentTemplates(initialDocumentTemplates);
    localStorage.removeItem(`${STORAGE_KEY}_document_templates`);
    showToast('Đã khôi phục các mẫu văn bản mặc định ban đầu!', 'info');
  };

  // Insurance handlers
  const updateInsurance = (ins: InsuranceProfile) => {
    setInsurances(prev => prev.map(i => (i.id === ins.id ? ins : i)));
    showToast('Đã cập nhật hồ sơ bảo hiểm xã hội');
  };

  // Timesheet handlers
  const updateTimesheet = (ts: TimesheetRecord) => {
    setTimesheets(prev => {
      const exists = prev.some(item => item.id === ts.id);
      if (exists) {
        return prev.map(item => (item.id === ts.id ? ts : item));
      }
      return [...prev, ts];
    });
    showToast('Đã lưu dữ liệu chấm công');
  };

  // Advances handlers
  const addAdvance = (adv: Omit<SalaryAdvanceRecord, 'id' | 'code'>) => {
    const count = advances.length + 1;
    const code = `TU-${currentMonth.replace('-', '').slice(2)}-${String(count).padStart(2, '0')}`;
    const newAdv: SalaryAdvanceRecord = {
      ...adv,
      id: `adv-${Date.now()}`,
      code,
    };
    setAdvances(prev => [...prev, newAdv]);
    showToast(`Đã gửi đề nghị tạm ứng ${newAdv.amount.toLocaleString('vi-VN')} đ`);
  };

  const batchAddAdvances = (records: Omit<SalaryAdvanceRecord, 'id' | 'code'>[]) => {
    const timestamp = Date.now();
    let currentCount = advances.length;
    const monthPart = currentMonth.replace('-', '').slice(2);
    const newRecords: SalaryAdvanceRecord[] = records.map((adv, idx) => {
      currentCount += 1;
      const code = `TU-${monthPart}-${String(currentCount).padStart(3, '0')}`;
      return {
        ...adv,
        id: `adv-${timestamp}-${idx}`,
        code,
      };
    });
    setAdvances(prev => [...prev, ...newRecords]);
    showToast(`Đã thêm thành công ${newRecords.length} đề nghị tạm ứng vào hệ thống!`, 'success');
  };

  const updateAdvanceStatus = (
    id: string,
    status: 'approved' | 'pending' | 'rejected' | 'processed',
    options?: {
      approvedAmount?: number;
      processedBy?: string;
      approvedBy?: string;
      notes?: string;
    }
  ) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const isApproved = status === 'approved';
    const isProcessed = status === 'processed';

    setAdvances(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const approvedAmount = options?.approvedAmount !== undefined
          ? options.approvedAmount
          : (a.approvedAmount !== undefined ? a.approvedAmount : a.amount);

        return {
          ...a,
          status,
          approvedAmount: isApproved || isProcessed ? approvedAmount : a.approvedAmount,
          approvedDate: isApproved ? (a.approvedDate || nowStr) : isProcessed ? (a.approvedDate || nowStr) : a.approvedDate,
          approvedBy: isApproved ? (options?.approvedBy || a.approvedBy || 'Lê Thanh Huy (GĐ)') : a.approvedBy,
          processedDate: isProcessed ? nowStr : a.processedDate,
          processedBy: isProcessed ? (options?.processedBy || 'Kế toán thanh toán') : a.processedBy,
          notes: options?.notes !== undefined ? options.notes : a.notes,
        };
      })
    );
    const statusLabels: Record<string, string> = {
      approved: 'phê duyệt',
      processed: 'xác nhận đã xử lý / chi tiền',
      rejected: 'từ chối',
      pending: 'chuyển sang chờ duyệt',
    };
    showToast(`Đã ${statusLabels[status] || status} yêu cầu tạm ứng lương!`, 'success');
  };

  const deleteAdvance = (id: string) => {
    setAdvances(prev => prev.filter(a => a.id !== id));
    showToast('Đã xóa phiếu đề nghị tạm ứng', 'info');
  };

  const lockMonth = (month: string, password?: string) => {
    setLockedMonths(prev => ({
      ...prev,
      [month]: {
        isLocked: true,
        password: password || '123456',
        lockedAt: new Date().toISOString(),
        lockedBy: 'Quản trị viên (Lê Thanh Huy)',
      },
    }));
    showToast(`Đã khóa kỳ chấm công ${month} thành công với mật khẩu bảo vệ!`, 'success');
  };

  const unlockMonth = (month: string, password?: string): boolean => {
    const lockInfo = lockedMonths[month];
    if (!lockInfo || !lockInfo.isLocked) return true;
    if (lockInfo.password && lockInfo.password !== password) {
      showToast('Mật khẩu mở khóa không chính xác!', 'error');
      return false;
    }
    setLockedMonths(prev => {
      const next = { ...prev };
      delete next[month];
      return next;
    });
    showToast(`Đã mở khóa kỳ chấm công ${month}. Bạn có thể chỉnh sửa dữ liệu!`, 'success');
    return true;
  };

  const advanceToNextMonth = (lockCurrentMonth?: boolean, password?: string) => {
    if (lockCurrentMonth) {
      setLockedMonths(prev => ({
        ...prev,
        [currentMonth]: {
          isLocked: true,
          password: password || '123456',
          lockedAt: new Date().toISOString(),
          lockedBy: 'Quản trị viên (Lê Thanh Huy)',
        },
      }));
    }
    const [y, m] = currentMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    setTimesheets(prev => {
      const created: TimesheetRecord[] = [];
      employees.forEach(emp => {
        const alreadyHas = prev.some(t => t.employeeId === emp.id && t.month === nextMonthStr);
        if (!alreadyHas) {
          created.push({
            id: `ts-${nextMonthStr}-${emp.id}`,
            employeeId: emp.id,
            month: nextMonthStr,
            standardWorkingDays: settings.standardMonthlyDays || 26,
            actualWorkingDays: settings.standardMonthlyDays || 26,
            paidLeaveDays: 0,
            unpaidLeaveDays: 0,
            otHoursNormal: 0,
            otHoursWeekend: 0,
            lateArrivalMinutes: 0,
          });
        }
      });
      return [...prev, ...created];
    });

    setCurrentMonth(nextMonthStr);
    showToast(`Đã chốt kỳ ${currentMonth} và chuyển sang kỳ chấm công & tính lương tháng ${nextMonthStr}!`, 'success');
  };

  const updateSettings = (newSettings: HRSettings) => {
    setSettings(newSettings);
    showToast('Đã lưu cấu hình tỷ lệ bảo hiểm và thuế TNCN');
  };

  const toggleKpiBonus = (enabled?: boolean) => {
    setSettings(prev => {
      const nextVal = enabled !== undefined ? enabled : !prev.enableKpiBonus;
      showToast(
        nextVal
          ? 'Đã BẬT phân hệ Đánh giá & Thưởng KPI (Thưởng KPI sẽ được tính vào bảng lương)'
          : 'Đã TẮT phân hệ Đánh giá & Thưởng KPI (Không tính thưởng KPI vào bảng lương)',
        nextVal ? 'success' : 'info'
      );
      return { ...prev, enableKpiBonus: nextVal };
    });
  };

  const toggleAllowances = (enabled?: boolean) => {
    setSettings(prev => {
      const nextVal = enabled !== undefined ? enabled : !prev.enableAllowances;
      showToast(
        nextVal
          ? 'Đã BẬT phân hệ Phụ cấp (Các khoản phụ cấp xăng xe, tiền ăn, trách nhiệm được tính vào bảng lương)'
          : 'Đã TẮT phân hệ Phụ cấp (Không tính phụ cấp vào bảng lương)',
        nextVal ? 'success' : 'info'
      );
      return { ...prev, enableAllowances: nextVal };
    });
  };

  const resetToDefaultData = () => {
    setDepartments(initialDepartments);
    setJobPositions(initialJobPositions);
    setGrades(initialSalaryGrades);
    setEmployees(initialEmployees);
    setContracts(initialContracts);
    setInsurances(initialInsuranceProfiles);
    setTimesheets(initialTimesheets);
    setAdvances(initialSalaryAdvances);
    setSettings(initialHRSettings);
    setProjects(initialProjects);
    setRemoteAllowanceRates(initialRemoteAllowanceRates);
    setReviews(initialPerformanceReviews);
    showToast('Đã khôi phục dữ liệu mẫu chuẩn của doanh nghiệp!');
  };

  const updateEmployeeProjectAllowances = (
    empId: string,
    allowances: Record<string, EmployeeProjectAllowance>
  ) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === empId ? { ...emp, projectAllowances: allowances } : emp))
    );
    showToast('Đã lưu cấu hình phụ cấp công trình cho nhân sự');
  };

  const updateEmployeeSalaryConfig = (
    empId: string,
    config: {
      salaryType?: 'scale' | 'negotiated';
      negotiatedType?: 'monthly' | 'daily';
      negotiatedSalary?: number;
      negotiatedDailyRate?: number;
      responsibilityAllowance?: number;
    }
  ) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === empId ? { ...emp, ...config } : emp))
    );
    showToast('Đã cập nhật hình thức lương & phụ cấp trách nhiệm');
  };

  const verifyAdminAppPasscode = (passcode: string): boolean => {
    const clean = passcode.trim();
    if (clean === adminAppPasscode || clean === 'admin@2026' || clean === '123456') {
      setIsAppAdmin(true);
      showToast('Xác thực Quản trị viên App (Super Admin: lethanhhuy1989@gmail.com) thành công!', 'success');
      return true;
    }
    showToast('Mật mã Quản trị viên App không đúng! Chỉ Super Admin mới có quyền truy cập.', 'error');
    return false;
  };

  const logoutAppAdmin = () => {
    setIsAppAdmin(false);
    showToast('Đã đăng xuất phiên Quản trị viên App.');
  };

  const updateAdminAppPasscode = (oldPasscode: string, newPasscode: string): boolean => {
    if (oldPasscode !== adminAppPasscode && oldPasscode !== 'admin@2026' && oldPasscode !== '123456') {
      showToast('Mật mã hiện tại không đúng!', 'error');
      return false;
    }
    if (!newPasscode || newPasscode.trim().length < 4) {
      showToast('Mật mã mới phải có ít nhất 4 ký tự!', 'error');
      return false;
    }
    const cleanNew = newPasscode.trim();
    setAdminAppPasscodeState(cleanNew);
    localStorage.setItem(`${STORAGE_KEY}_admin_app_passcode`, cleanNew);
    showToast('Đã đổi mật mã Quản trị viên App thành công!', 'success');
    return true;
  };

  const updateRolePermissionByAdmin = (
    role: keyof RolePermissions,
    permission: 'view' | 'edit',
    adminPasscode?: string
  ): boolean => {
    // Only app administrator can grant permissions to any role, including Director
    const isAuthenticated = isAppAdmin || (adminPasscode && (adminPasscode === adminAppPasscode || adminPasscode === 'admin@2026' || adminPasscode === '123456'));
    if (!isAuthenticated) {
      showToast('CẢNH BÁO: Chỉ Quản trị viên ứng dụng (Super Admin: lethanhhuy1989@gmail.com) mới có quyền cấp quyền chỉnh sửa! Kể cả Ban Giám Đốc cũng không có thẩm quyền này.', 'error');
      return false;
    }

    setRolePermissions(prev => ({
      ...prev,
      [role]: permission,
    }));

    const roleNameMap: Record<keyof RolePermissions, string> = {
      director: 'Ban Giám Đốc',
      payroll_accountant: 'Kế toán tiền lương',
      site_manager: 'Chỉ huy trưởng / Quản lý',
      employee: 'Nhân viên',
    };

    showToast(
      `Quản trị viên App đã ${permission === 'edit' ? 'CẤP QUYỀN CHỈNH SỬA' : 'chuyển sang CHỈ XEM'} cho "${roleNameMap[role]}"!`,
      'success'
    );
    return true;
  };

  const canActiveRoleEdit = useMemo(() => {
    if (isAppAdmin) return true;
    if (activeRole === 'super_admin') return isAppAdmin;
    if (activeRole === 'director') return rolePermissions.director === 'edit';
    if (activeRole === 'payroll_accountant') return rolePermissions.payroll_accountant === 'edit';
    if (activeRole === 'site_manager') return rolePermissions.site_manager === 'edit';
    return false;
  }, [isAppAdmin, activeRole, rolePermissions]);

  // Computed Payroll Items for the selected month - Directly integrates KPI Performance Reviews
  const payrollItems = useMemo(() => {
    return employees.map(emp =>
      calculateEmployeePayroll(
        emp,
        grades,
        departments,
        timesheets,
        advances,
        insurances,
        settings,
        currentMonth,
        projects,
        remoteAllowanceRates,
        reviews
      )
    );
  }, [employees, grades, departments, timesheets, advances, insurances, settings, currentMonth, projects, remoteAllowanceRates, reviews]);

  return (
    <HRMContext.Provider
      value={{
        departments,
        jobPositions,
        grades,
        employees,
        contracts,
        insurances,
        timesheets,
        advances,
        projects,
        remoteAllowanceRates,
        reviews,
        settings,
        currentMonth,
        payrollItems,
        selectedEmployeeForSlip,
        activeMainTab,
        activeSubTab,
        toast,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        setActiveMainTab,
        setActiveSubTab,
        setCurrentMonth,
        setSelectedEmployeeForSlip,
        showToast,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addJobPosition,
        updateJobPosition,
        deleteJobPosition,
        addProject,
        updateProject,
        deleteProject,
        updateRemoteAllowanceRates,
        addReview,
        updateReview,
        deleteReview,
        batchUpdateReviews,
        updateGrade,
        addGrade,
        deleteGrade,
        batchUpdateGrades,
        addEmployee,
        batchAddEmployees,
        updateEmployee,
        deleteEmployee,
        updateEmployeeProjectAllowances,
        updateEmployeeSalaryConfig,
        addContract,
        updateContract,
        deleteContract,
        renewContract,
        terminateContract,
        addContractAppendix,
        deleteContractAppendix,
        batchAddContracts,
        documentTemplates,
        addDocumentTemplate,
        updateDocumentTemplate,
        deleteDocumentTemplate,
        resetDocumentTemplates,
        updateInsurance,
        updateTimesheet,
        addAdvance,
        batchAddAdvances,
        updateAdvanceStatus,
        deleteAdvance,
        lockedMonths,
        lockMonth,
        unlockMonth,
        advanceToNextMonth,
        updateSettings,
        toggleKpiBonus,
        toggleAllowances,
        resetToDefaultData,
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
      }}
    >
      {children}
    </HRMContext.Provider>
  );
};

export const useHRM = () => {
  const context = useContext(HRMContext);
  if (!context) {
    throw new Error('useHRM must be used within an HRMProvider');
  }
  return context;
};
