import React, { useState, useMemo, useRef } from 'react';
import { useHRM } from '../context/HRMContext';
import { LaborContract, ContractType, ContractAppendix, Employee } from '../types/hrm';
import { formatNumberVN, formatVND } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import JSZip from 'jszip';
import { ImportContractsModal } from './ImportContractsModal';
import { ContractTemplateModal } from './ContractTemplateModal';
import { SalaryDecisionModal } from './SalaryDecisionModal';
import { TerminationDecisionModal } from './TerminationDecisionModal';
import { BatchPrintModal } from './BatchPrintModal';
import { numberToVietnameseWords } from '../data/defaultContractTemplates';
import {
  FileText,
  FileCheck2,
  FilePlus2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Printer,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Building,
  User,
  ShieldAlert,
  ArrowRight,
  Eye,
  RotateCw,
  X,
  Check,
  Paperclip,
  TrendingUp,
  FileSignature,
  FileClock,
  Sparkles,
  Award,
  Upload,
  Layers,
  Archive,
  FileSpreadsheet,
  CheckSquare,
  Square,
} from 'lucide-react';

// Helper: Tính ngày kết thúc tự động từ ngày bắt đầu + thời hạn hợp đồng
export const computeContractEndDate = (startDateStr: string, contractType: ContractType): string => {
  if (!startDateStr || contractType === 'indefinite') return '';
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return '';

  if (contractType === 'probation') {
    d.setDate(d.getDate() + 60);
  } else if (contractType === 'definite_1yr') {
    d.setFullYear(d.getFullYear() + 1);
  } else if (contractType === 'definite_3yr') {
    d.setFullYear(d.getFullYear() + 3);
  } else if (contractType === 'seasonal') {
    d.setMonth(d.getMonth() + 6);
  } else if (contractType === 'service') {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().split('T')[0];
};

// Helper: Nhãn thời hạn hợp đồng
export const getContractDurationLabel = (contractType: ContractType): string => {
  switch (contractType) {
    case 'probation':
      return '60 ngày';
    case 'definite_1yr':
      return '12 tháng';
    case 'definite_3yr':
      return '36 tháng';
    case 'seasonal':
      return '6 tháng';
    case 'service':
      return '12 tháng';
    case 'indefinite':
    default:
      return 'Không thời hạn';
  }
};

export const ContractManagement: React.FC = () => {
  const {
    contracts,
    employees,
    departments,
    jobPositions,
    grades,
    addContract,
    updateContract,
    deleteContract,
    renewContract,
    terminateContract,
    addContractAppendix,
    deleteContractAppendix,
    showToast,
  } = useHRM();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ContractType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired' | 'terminated'>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'expiry_asc' | 'signed_desc' | 'salary_desc'>('expiry_asc');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<LaborContract | null>(null);

  const [previewContract, setPreviewContract] = useState<LaborContract | null>(null);
  const [renewingContract, setRenewingContract] = useState<LaborContract | null>(null);
  const [appendixModalContract, setAppendixModalContract] = useState<LaborContract | null>(null);
  const [terminatingContract, setTerminatingContract] = useState<LaborContract | null>(null);

  // Batch selection & New feature modals state
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSalaryDecisionModalOpen, setIsSalaryDecisionModalOpen] = useState(false);
  const [isTerminationDecisionModalOpen, setIsTerminationDecisionModalOpen] = useState(false);
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false);
  const [decisionDefaultEmpId, setDecisionDefaultEmpId] = useState<string | undefined>();
  const [decisionDefaultContractId, setDecisionDefaultContractId] = useState<string | undefined>();

  // Form State for Add / Edit Contract
  const initialStartDate = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    code: '',
    contractType: 'definite_1yr' as ContractType,
    contractTypeName: 'Hợp đồng xác định thời hạn (12 tháng)',
    startDate: initialStartDate,
    endDate: computeContractEndDate(initialStartDate, 'definite_1yr'),
    signedDate: initialStartDate,
    jobTitle: '',
    baseSalary: 10000000,
    insuranceSalary: 10000000,
    status: 'active' as LaborContract['status'],
    workingHours: '48 giờ/tuần (Từ Thứ Hai đến Thứ Bảy, 08h00 - 17h00)',
    workLocation: 'Văn phòng Công ty & các công trình trực thuộc tại TP.HCM và các tỉnh',
    probationRate: 100,
    probationSalary: 10000000,
    probationMode: '100_percent' as '85_percent' | '100_percent' | 'custom_amount',
    allowancesDescription: 'Phụ cấp ăn trưa 50.000đ/ngày, Phụ cấp xăng xe và công tác phí theo quy chế công ty',
    paymentMethod: 'Chuyển khoản vào tài khoản ngân hàng của NLĐ vào ngày 05 - 10 hàng tháng',
    signatoryName: 'Lê Thanh Huy',
    signatoryTitle: 'Tổng Giám Đốc',
    notes: '',
  });

  // Renewal Form State
  const [renewalData, setRenewalData] = useState({
    contractType: 'indefinite' as ContractType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    baseSalary: 12000000,
    insuranceSalary: 12000000,
    notes: '',
  });

  // Appendix Form State
  const [appendixData, setAppendixData] = useState({
    code: '',
    title: 'Phụ lục điều chỉnh mức lương & chức danh',
    type: 'salary_adjustment' as ContractAppendix['type'],
    signedDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    description: 'Điều chỉnh nâng bậc lương và bổ sung trách nhiệm công việc mới theo quyết định Ban Giám Đốc',
    newBaseSalary: 15000000,
    newInsuranceSalary: 15000000,
    newJobTitle: '',
    newEndDate: '',
  });

  // Termination Form State
  const [terminationData, setTerminationData] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    reason: 'Hai bên thỏa thuận chấm dứt hợp đồng lao động',
    settlementNotes: 'Đã hoàn tất bàn giao công việc, tài sản và thanh toán quyết toán lương, hoàn trả sổ BHXH.',
  });

  // Helpers to calculate days left
  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to determine dynamic contract status
  const getEffectiveStatus = (c: LaborContract) => {
    if (c.status === 'terminated') return 'terminated';
    if (!c.endDate) return 'active';
    const daysLeft = getDaysRemaining(c.endDate);
    if (daysLeft === null) return 'active';
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 45) return 'expiring_soon';
    return 'active';
  };

  // Dashboard Metrics
  const metrics = useMemo(() => {
    let total = contracts.length;
    let active = 0;
    let expiringSoon = 0;
    let probation = 0;
    let expired = 0;
    let terminated = 0;

    contracts.forEach((c) => {
      const effStatus = getEffectiveStatus(c);
      if (effStatus === 'terminated') {
        terminated++;
      } else if (effStatus === 'expired') {
        expired++;
      } else if (effStatus === 'expiring_soon') {
        expiringSoon++;
      } else {
        active++;
      }

      if (c.contractType === 'probation') {
        probation++;
      }
    });

    return { total, active, expiringSoon, probation, expired, terminated };
  }, [contracts]);

  // Filtered & Sorted Contracts
  const filteredContracts = useMemo(() => {
    return contracts
      .filter((c) => {
        const emp = employees.find((e) => e.id === c.employeeId);
        const effStatus = getEffectiveStatus(c);

        // Search match
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch =
          term === '' ||
          c.code.toLowerCase().includes(term) ||
          c.jobTitle.toLowerCase().includes(term) ||
          (emp &&
            (emp.fullName.toLowerCase().includes(term) ||
              emp.code.toLowerCase().includes(term) ||
              emp.identityCard.toLowerCase().includes(term) ||
              emp.phone.toLowerCase().includes(term)));

        // Type match
        const matchesType = typeFilter === 'all' || c.contractType === typeFilter;

        // Status match
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'expiring_soon' && effStatus === 'expiring_soon') ||
          (statusFilter === 'active' && (effStatus === 'active' || effStatus === 'expiring_soon')) ||
          (statusFilter === 'expired' && effStatus === 'expired') ||
          (statusFilter === 'terminated' && effStatus === 'terminated');

        // Department match
        const matchesDept = deptFilter === 'all' || (emp && emp.departmentId === deptFilter);

        return matchesSearch && matchesType && matchesStatus && matchesDept;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') {
          // Put expiring soonest first; indefinite at the end
          if (!a.endDate && !b.endDate) return 0;
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        }
        if (sortBy === 'signed_desc') {
          return new Date(b.signedDate).getTime() - new Date(a.signedDate).getTime();
        }
        if (sortBy === 'salary_desc') {
          return (b.baseSalary || 0) - (a.baseSalary || 0);
        }
        return 0;
      });
  }, [contracts, employees, searchTerm, typeFilter, statusFilter, deptFilter, sortBy]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingContract(null);
    const firstEmp = employees[0];
    const yr = new Date().getFullYear();
    const generatedCode = `HDLD-${yr}/${String(contracts.length + 1).padStart(2, '0')}-${firstEmp ? firstEmp.code.replace('NV-', '') : '01'}`;

    const today = new Date().toISOString().split('T')[0];
    const contractType: ContractType = 'definite_1yr';
    // Ngày bắt đầu = ngày ký kết; ngày kết thúc = ngày bắt đầu + thời gian trong HĐ
    const endDate = computeContractEndDate(today, contractType);
    const defaultSalary = 12000000;

    setFormData({
      employeeId: firstEmp?.id || '',
      code: generatedCode,
      contractType,
      contractTypeName: 'Hợp đồng xác định thời hạn (12 tháng)',
      startDate: today,
      endDate,
      signedDate: today,
      jobTitle: firstEmp?.position || 'Chuyên viên',
      baseSalary: defaultSalary,
      insuranceSalary: defaultSalary,
      status: 'active',
      workingHours: '48 giờ/tuần (Từ Thứ Hai đến Thứ Bảy, 08h00 - 17h00)',
      workLocation: 'Văn phòng Công ty & các công trình trực thuộc tại TP.HCM và các tỉnh',
      probationRate: 100,
      probationSalary: defaultSalary,
      probationMode: '100_percent',
      allowancesDescription: 'Phụ cấp ăn trưa 50.000đ/ngày, Phụ cấp xăng xe và công tác phí theo quy chế công ty',
      paymentMethod: 'Chuyển khoản vào tài khoản ngân hàng của NLĐ vào ngày 05 - 10 hàng tháng',
      signatoryName: 'Lê Thanh Huy',
      signatoryTitle: 'Tổng Giám Đốc',
      notes: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: LaborContract) => {
    setEditingContract(c);
    const rate = c.probationRate || 100;
    const computedProbSalary = c.probationSalary || Math.round((c.baseSalary * rate) / 100);
    const mode = rate === 85 ? '85_percent' : rate === 100 ? '100_percent' : 'custom_amount';

    setFormData({
      employeeId: c.employeeId,
      code: c.code,
      contractType: c.contractType,
      contractTypeName: c.contractTypeName,
      startDate: c.startDate,
      endDate: c.endDate || '',
      signedDate: c.signedDate,
      jobTitle: c.jobTitle,
      baseSalary: c.baseSalary,
      insuranceSalary: c.insuranceSalary,
      status: c.status,
      workingHours: c.workingHours || '48 giờ/tuần (Từ Thứ Hai đến Thứ Bảy, 08h00 - 17h00)',
      workLocation: c.workLocation || 'Văn phòng Công ty & các công trình trực thuộc tại TP.HCM và các tỉnh',
      probationRate: rate,
      probationSalary: computedProbSalary,
      probationMode: mode,
      allowancesDescription: c.allowancesDescription || 'Phụ cấp ăn trưa 50.000đ/ngày, Phụ cấp xăng xe theo quy chế',
      paymentMethod: c.paymentMethod || 'Chuyển khoản vào tài khoản ngân hàng của NLĐ vào ngày 05 - 10 hàng tháng',
      signatoryName: c.signatoryName || 'Lê Thanh Huy',
      signatoryTitle: c.signatoryTitle || 'Tổng Giám Đốc',
      notes: c.notes || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Auto-fill when employee selected in form
  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    const targetGrade = grades.find((g) => g.id === emp.gradeId);
    const coeff = targetGrade?.coefficients[(emp.tierIndex || 1) - 1] || 1;
    const computedSal = emp.salaryType === 'negotiated'
      ? (emp.negotiatedSalary || 15000000)
      : Math.round((targetGrade?.standardBaseRate || 5000000) * coeff);

    setFormData((prev) => {
      const probSal = prev.probationMode === '85_percent'
        ? Math.round(computedSal * 0.85)
        : prev.probationMode === '100_percent'
        ? computedSal
        : Math.round((computedSal * (prev.probationRate || 85)) / 100);

      return {
        ...prev,
        employeeId: empId,
        jobTitle: emp.position,
        baseSalary: computedSal,
        insuranceSalary: computedSal,
        probationSalary: probSal,
      };
    });
  };

  // 1. Ngày bắt đầu = ngày ký kết; tự động tính lại ngày kết thúc
  const handleSignedDateChange = (newSignedDate: string) => {
    const newEndDate = computeContractEndDate(newSignedDate, formData.contractType);
    setFormData((prev) => ({
      ...prev,
      signedDate: newSignedDate,
      startDate: newSignedDate, // Ngày bắt đầu = Ngày ký kết
      endDate: prev.contractType === 'indefinite' ? '' : newEndDate,
    }));
  };

  // 2. Ngày kết thúc = ngày bắt đầu + thời gian trong HĐ
  const handleStartDateChange = (newStartDate: string) => {
    const newEndDate = computeContractEndDate(newStartDate, formData.contractType);
    setFormData((prev) => ({
      ...prev,
      startDate: newStartDate,
      endDate: prev.contractType === 'indefinite' ? '' : newEndDate,
    }));
  };

  // Auto-adjust dates, names and probation defaults when contract type changes
  const handleContractTypeChange = (type: ContractType) => {
    let name = 'Hợp đồng lao động';
    if (type === 'probation') {
      name = 'Hợp đồng thử việc (60 ngày)';
    } else if (type === 'definite_1yr') {
      name = 'Hợp đồng xác định thời hạn (12 tháng)';
    } else if (type === 'definite_3yr') {
      name = 'Hợp đồng xác định thời hạn (36 tháng)';
    } else if (type === 'indefinite') {
      name = 'Hợp đồng không xác định thời hạn';
    } else if (type === 'seasonal') {
      name = 'Hợp đồng theo mùa vụ / Công trình';
    } else if (type === 'service') {
      name = 'Hợp đồng dịch vụ / Cộng tác viên';
    }

    const newEndDate = computeContractEndDate(formData.startDate, type);
    const newRate = type === 'probation' ? 85 : 100;
    const newProbMode = type === 'probation' ? '85_percent' : '100_percent';
    const newProbSalary = Math.round((formData.baseSalary * newRate) / 100);

    setFormData((prev) => ({
      ...prev,
      contractType: type,
      contractTypeName: name,
      endDate: newEndDate,
      probationRate: newRate,
      probationSalary: newProbSalary,
      probationMode: newProbMode,
    }));
  };

  // Base salary change handler
  const handleBaseSalaryChange = (newBaseSalary: number) => {
    setFormData((prev) => {
      let probSal = prev.probationSalary;
      if (prev.probationMode === '85_percent') {
        probSal = Math.round(newBaseSalary * 0.85);
      } else if (prev.probationMode === '100_percent') {
        probSal = newBaseSalary;
      } else {
        probSal = Math.round((newBaseSalary * (prev.probationRate || 85)) / 100);
      }
      return {
        ...prev,
        baseSalary: newBaseSalary,
        probationSalary: probSal,
      };
    });
  };

  // 3. Mức lương thử việc: 85% theo luật
  const handleSetProbation85 = () => {
    const rate = 85;
    const amount = Math.round(formData.baseSalary * 0.85);
    setFormData((prev) => ({
      ...prev,
      probationRate: rate,
      probationSalary: amount,
      probationMode: '85_percent',
    }));
  };

  // Mức lương thử việc: 100% lương
  const handleSetProbation100 = () => {
    const rate = 100;
    const amount = formData.baseSalary;
    setFormData((prev) => ({
      ...prev,
      probationRate: rate,
      probationSalary: amount,
      probationMode: '100_percent',
    }));
  };

  // Mức lương thử việc: Tự nhập số tiền (VNĐ)
  const handleCustomProbationSalaryChange = (amount: number) => {
    const rate = formData.baseSalary > 0
      ? Number(((amount / formData.baseSalary) * 100).toFixed(1))
      : 85;
    setFormData((prev) => ({
      ...prev,
      probationSalary: amount,
      probationRate: rate,
      probationMode: 'custom_amount',
    }));
  };

  // Mức lương thử việc: Tự nhập tỷ lệ (%)
  const handleCustomProbationRateChange = (rate: number) => {
    const amount = Math.round((formData.baseSalary * rate) / 100);
    setFormData((prev) => ({
      ...prev,
      probationRate: rate,
      probationSalary: amount,
      probationMode: rate === 85 ? '85_percent' : rate === 100 ? '100_percent' : 'custom_amount',
    }));
  };

  // Save Add/Edit
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showToast('Vui lòng nhập số / mã hợp đồng!', 'error');
      return;
    }
    if (!formData.employeeId) {
      showToast('Vui lòng chọn nhân viên!', 'error');
      return;
    }

    const payload: Omit<LaborContract, 'id'> = {
      code: formData.code.trim().toUpperCase(),
      employeeId: formData.employeeId,
      contractType: formData.contractType,
      contractTypeName: formData.contractTypeName,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      signedDate: formData.signedDate,
      jobTitle: formData.jobTitle.trim(),
      baseSalary: Number(formData.baseSalary) || 0,
      insuranceSalary: Number(formData.insuranceSalary) || 0,
      status: formData.status,
      workingHours: formData.workingHours,
      workLocation: formData.workLocation,
      probationRate: Number(formData.probationRate) || 100,
      probationSalary: Number(formData.probationSalary) || Math.round((Number(formData.baseSalary) || 0) * ((Number(formData.probationRate) || 100) / 100)),
      allowancesDescription: formData.allowancesDescription,
      paymentMethod: formData.paymentMethod,
      signatoryName: formData.signatoryName,
      signatoryTitle: formData.signatoryTitle,
      notes: formData.notes,
      appendices: editingContract?.appendices || [],
    };

    if (editingContract) {
      updateContract({ ...payload, id: editingContract.id });
    } else {
      addContract(payload);
    }

    setIsAddEditModalOpen(false);
    setEditingContract(null);
  };

  // Open Renew Modal
  const handleOpenRenew = (c: LaborContract) => {
    setRenewingContract(c);
    const start = c.endDate ? c.endDate : new Date().toISOString().split('T')[0];
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    setRenewalData({
      contractType: c.contractType === 'probation' ? 'definite_1yr' : 'indefinite',
      startDate: start,
      endDate: c.contractType === 'probation' ? end.toISOString().split('T')[0] : '',
      baseSalary: c.baseSalary ? Math.round(c.baseSalary * 1.1) : 12000000,
      insuranceSalary: c.insuranceSalary ? Math.round(c.insuranceSalary * 1.1) : 12000000,
      notes: `Gia hạn tái ký chu kỳ mới từ hợp đồng ${c.code}`,
    });
  };

  const handleSaveRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingContract) return;

    renewContract(renewingContract.id, {
      contractType: renewalData.contractType,
      startDate: renewalData.startDate,
      endDate: renewalData.endDate || undefined,
      baseSalary: Number(renewalData.baseSalary),
      insuranceSalary: Number(renewalData.insuranceSalary),
      notes: renewalData.notes,
    });

    setRenewingContract(null);
  };

  // Open Appendix Modal
  const handleOpenAppendix = (c: LaborContract) => {
    setAppendixModalContract(c);
    const appCount = (c.appendices?.length || 0) + 1;
    setAppendixData({
      code: `PL-${String(appCount).padStart(2, '0')}/${c.code}`,
      title: 'Phụ lục điều chỉnh mức lương và chế độ đãi ngộ',
      type: 'salary_adjustment',
      signedDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      description: 'Điều chỉnh tăng lương cơ bản và phụ cấp chức vụ theo năng lực hoàn thành dự án',
      newBaseSalary: c.baseSalary + 2000000,
      newInsuranceSalary: c.insuranceSalary + 2000000,
      newJobTitle: c.jobTitle,
      newEndDate: c.endDate || '',
    });
  };

  const handleSaveAppendix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appendixModalContract) return;
    if (!appendixData.code.trim()) {
      showToast('Vui lòng nhập mã phụ lục!', 'error');
      return;
    }

    addContractAppendix(appendixModalContract.id, {
      contractId: appendixModalContract.id,
      code: appendixData.code.trim().toUpperCase(),
      title: appendixData.title,
      type: appendixData.type,
      signedDate: appendixData.signedDate,
      effectiveDate: appendixData.effectiveDate,
      description: appendixData.description,
      newBaseSalary: appendixData.newBaseSalary,
      newInsuranceSalary: appendixData.newInsuranceSalary,
      newJobTitle: appendixData.newJobTitle,
      newEndDate: appendixData.newEndDate || undefined,
    });

    setAppendixModalContract(null);
  };

  // Open Termination Modal
  const handleOpenTerminate = (c: LaborContract) => {
    setTerminatingContract(c);
    setTerminationData({
      terminationDate: new Date().toISOString().split('T')[0],
      reason: 'Hai bên thỏa thuận chấm dứt hợp đồng lao động',
      settlementNotes: 'Đã hoàn tất bàn giao công việc, tài sản, quyết toán công nợ và trả sổ BHXH.',
    });
  };

  const handleSaveTermination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminatingContract) return;

    terminateContract(
      terminatingContract.id,
      terminationData.terminationDate,
      `${terminationData.reason}. ${terminationData.settlementNotes}`
    );

    setTerminatingContract(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Số / Mã HĐ',
      'Mã NV',
      'Họ và Tên',
      'Phòng Ban',
      'Chức Danh Công Việc',
      'Loại Hợp Đồng',
      'Ngày Ký',
      'Ngày Bắt Đầu',
      'Ngày Kết Thúc',
      'Thời Hạn Còn Lại',
      'Lương Cơ Bản (VNĐ)',
      'Lương Đóng BHXH (VNĐ)',
      'Tỷ Lệ Lương (%)',
      'Trạng Thái',
      'Số Phụ Lục',
      'Ghi Chú',
    ];

    const rows = filteredContracts.map((c, idx) => {
      const emp = employees.find((e) => e.id === c.employeeId);
      const dept = departments.find((d) => d.id === emp?.departmentId);
      const effStatus = getEffectiveStatus(c);
      const daysLeft = getDaysRemaining(c.endDate);

      let remainText = 'Vô thời hạn';
      if (c.endDate) {
        if (daysLeft === null) remainText = 'Chưa xác định';
        else if (daysLeft < 0) remainText = `Đã quá hạn ${Math.abs(daysLeft)} ngày`;
        else remainText = `Còn ${daysLeft} ngày`;
      }

      let statusText = 'Đang hiệu lực';
      if (effStatus === 'terminated') statusText = 'Đã thanh lý';
      else if (effStatus === 'expired') statusText = 'Đã hết hạn';
      else if (effStatus === 'expiring_soon') statusText = 'Sắp hết hạn (cần tái ký)';

      return [
        idx + 1,
        c.code,
        emp?.code || '',
        emp?.fullName || '',
        dept?.name || '',
        c.jobTitle,
        c.contractTypeName,
        c.signedDate,
        c.startDate,
        c.endDate || 'Vô thời hạn',
        remainText,
        c.baseSalary,
        c.insuranceSalary,
        c.probationRate || 100,
        statusText,
        c.appendices?.length || 0,
        c.notes || '',
      ];
    });

    exportToExcel({
      fileName: `So_Theo_Doi_Hop_Dong_Lao_Dong_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'HopDongLaoDong',
      title: 'SỔ THEO DÕI HỢP ĐỒNG LAO ĐỘNG DOANH NGHIỆP',
      subtitles: [
        `Tổng số hợp đồng: ${filteredContracts.length} | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
        'Đơn vị quản lý: Phòng Nhân sự & C&B Enterprise',
      ],
      headers,
      rows,
    });
    showToast('Đã xuất file Excel sổ theo dõi hợp đồng thành công!', 'success');
  };

  // Export to PDF Report
  const handleExportPDF = () => {
    const headers = [
      'STT',
      'So Hop Dong',
      'Nhan Vien',
      'Phong Ban',
      'Chuc Danh',
      'Loai HD',
      'Tu Ngay',
      'Den Ngay',
      'Luong Co Ban',
      'Trang Thai',
    ];

    const rows = filteredContracts.map((c, idx) => {
      const emp = employees.find((e) => e.id === c.employeeId);
      const dept = departments.find((d) => d.id === emp?.departmentId);
      const effStatus = getEffectiveStatus(c);

      let statusText = 'Hieu luc';
      if (effStatus === 'terminated') statusText = 'Thanh ly';
      else if (effStatus === 'expired') statusText = 'Het han';
      else if (effStatus === 'expiring_soon') statusText = 'Sap het han';

      return [
        idx + 1,
        c.code,
        emp?.fullName || '',
        dept?.name || '',
        c.jobTitle,
        c.contractType === 'indefinite' ? 'Vo thoi han' : c.contractType === 'probation' ? 'Thu viec' : 'Co thoi han',
        c.startDate,
        c.endDate || 'Vo thoi han',
        c.baseSalary.toLocaleString('vi-VN'),
        statusText,
      ];
    });

    exportToPDF({
      fileName: `Danh_Sach_Hop_Dong_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'BAO CAO DANH SACH HOP DONG LAO DONG',
      subtitles: [
        `Tong hop dong: ${filteredContracts.length} | Ngay lap: ${new Date().toLocaleDateString('vi-VN')}`,
      ],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất báo cáo PDF hợp đồng lao động!', 'success');
  };

  // Batch Download Word ZIP of selected contracts
  const handleDownloadZipSelected = async () => {
    const selected = contracts.filter((c) => selectedContractIds.includes(c.id));
    if (selected.length === 0) return;
    try {
      const zip = new JSZip();
      selected.forEach((c) => {
        const emp = employees.find((e) => e.id === c.employeeId);
        const fileName = `HDLD_${c.code.replace(/[/\\?%*:|"<>]/g, '-')}_${emp?.fullName || 'NV'}.doc`;
        const htmlDoc = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><title>${c.code}</title></head>
          <body>
            <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; padding: 20px;">
              <h2 style="text-align: center;">HỢP ĐỒNG LAO ĐỘNG</h2>
              <p style="text-align: center; font-style: italic;">Số: ${c.code}</p>
              <p>Hôm nay, ngày ${c.signedDate}, đại diện Công ty và Người lao động ${emp?.fullName} (CCCD: ${emp?.identityCard}) thỏa thuận ký kết hợp đồng lao động.</p>
              <p>- Loại hợp đồng: <b>${c.contractTypeName}</b></p>
              <p>- Thời hạn: Từ ${c.startDate} đến ${c.endDate || 'Vô thời hạn'}</p>
              <p>- Chức danh: <b>${c.jobTitle}</b></p>
              <p>- Lương cơ bản: <b>${formatVND(c.baseSalary)}</b>/tháng (Bằng chữ: <i>${numberToVietnameseWords(c.baseSalary)}</i>)</p>
              <p>- Lương đóng BHXH: <b>${formatVND(c.insuranceSalary)}</b>/tháng</p>
            </div>
          </body>
          </html>
        `;
        zip.file(fileName, '\ufeff' + htmlDoc);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Goi_Hop_Dong_Lao_Dong_${selected.length}_ban.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Đã xuất thành công gói ZIP ${selected.length} hợp đồng Word!`, 'success');
    } catch (err: any) {
      showToast('Lỗi xuất tệp ZIP: ' + (err?.message || ''), 'error');
    }
  };

  // Batch download merged Word document
  const handleDownloadMergedWordSelected = () => {
    const selected = contracts.filter((c) => selectedContractIds.includes(c.id));
    if (selected.length === 0) return;
    const bodyContent = selected
      .map((c) => {
        const emp = employees.find((e) => e.id === c.employeeId);
        return `
        <div style="page-break-after: always; padding: 25px; font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5;">
          <h2 style="text-align: center;">HỢP ĐỒNG LAO ĐỘNG</h2>
          <p style="text-align: center; font-style: italic;">Số: ${c.code}</p>
          <p>Bên A: CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE</p>
          <p>Bên B: Ông/Bà <b>${emp?.fullName}</b> (Mã NV: ${emp?.code}, CCCD: ${emp?.identityCard})</p>
          <p>Chức danh: <b>${c.jobTitle}</b></p>
          <p>Thời hạn: ${c.startDate} → ${c.endDate || 'Vô thời hạn'}</p>
          <p>Lương cơ bản: <b>${formatVND(c.baseSalary)}</b> (<i>${numberToVietnameseWords(c.baseSalary)}</i>)</p>
        </div>
      `;
      })
      .join('\n');

    const mergedDocHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Tap_Hop_Dong</title></head>
      <body>${bodyContent}</body>
      </html>
    `;
    const blob = new Blob(['\ufeff', mergedDocHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tap_Hop_Dong_Gop_${selected.length}_nhan_su.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file Word gộp ${selected.length} hợp đồng thành công!`, 'success');
  };

  // Export selected to Excel
  const handleExportExcelSelected = () => {
    const selected = contracts.filter((c) => selectedContractIds.includes(c.id));
    if (selected.length === 0) return;
    const headers = ['STT', 'Số HĐ', 'Mã NV', 'Họ Tên', 'Chức Danh', 'Từ Ngày', 'Đến Ngày', 'Lương Cơ Bản', 'Lương BHXH'];
    const rows = selected.map((c, idx) => {
      const emp = employees.find((e) => e.id === c.employeeId);
      return [idx + 1, c.code, emp?.code || '', emp?.fullName || '', c.jobTitle, c.startDate, c.endDate || 'Vô thời hạn', c.baseSalary, c.insuranceSalary];
    });
    exportToExcel({
      fileName: `Hop_Dong_Da_Chon_${selected.length}.xlsx`,
      sheetName: 'HopDongChon',
      title: `DANH SÁCH ${selected.length} HỢP ĐỒNG ĐÃ CHỌN`,
      headers,
      rows,
    });
    showToast(`Đã xuất ${selected.length} hợp đồng ra file Excel!`, 'success');
  };

  // Direct Contract Printing
  const handlePrintContract = () => {
    window.print();
  };

  // Download printable contract as Word (.doc)
  const handleDownloadWordContract = (c: LaborContract) => {
    const emp = employees.find((e) => e.id === c.employeeId);
    const dept = departments.find((d) => d.id === emp?.departmentId);

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${c.code}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; padding: 20px; }
        h1, h2, h3 { text-align: center; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .table-sign { width: 100%; margin-top: 40px; }
        .table-sign td { width: 50%; text-align: center; vertical-align: top; }
      </style>
      </head>
      <body>
        <div class="center">
          <p class="bold" style="font-size: 11pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p class="bold" style="font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
          <p style="margin: 0;">-------------------</p>
        </div>
        <br/>
        <h2 style="margin-bottom: 2px;">HỢP ĐỒNG LAO ĐỘNG</h2>
        <p class="center" style="font-style: italic; margin-top: 0;">Số: ${c.code}</p>
        <br/>
        <p>Hôm nay, ngày ${c.signedDate.split('-')[2]} tháng ${c.signedDate.split('-')[1]} năm ${c.signedDate.split('-')[0]}, chúng tôi gồm có:</p>
        
        <p class="bold">BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG</p>
        <p>- Đại diện: <b>${c.signatoryName || 'Lê Thanh Huy'}</b> - Chức vụ: <b>${c.signatoryTitle || 'Tổng Giám Đốc'}</b></p>
        <p>- Quốc tịch: Việt Nam</p>
        <p>- Đại diện cho: CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG & THƯƠNG MẠI ENTERPRISE</p>
        <p>- Địa chỉ: Tòa nhà Enterprise Tower, Quận 1, TP. Hồ Chí Minh</p>
        <p>- Mã số thuế: 0314892839 - Điện thoại: (028) 3822 6868</p>

        <p class="bold">BÊN B: NGƯỜI LAO ĐỘNG</p>
        <p>- Ông/Bà: <b>${emp?.fullName || ''}</b> - Quốc tịch: Việt Nam</p>
        <p>- Sinh ngày: ${emp?.birthDate || '01/01/1990'}</p>
        <p>- Số CCCD/CMND: ${emp?.identityCard || ''} cấp tại Cục CS QLHC về TTXH</p>
        <p>- Nơi cư trú thường trú: ${emp?.hometown || 'Việt Nam'}</p>
        <p>- Chỗ ở hiện nay: ${emp?.currentAddress || ''}</p>
        <p>- Điện thoại: ${emp?.phone || ''} - Email: ${emp?.email || ''}</p>

        <p>Hai bên cùng thỏa thuận ký kết hợp đồng lao động với các điều khoản sau:</p>
        <p><b>Điều 1: Thời hạn và công việc hợp đồng</b></p>
        <p>- Loại hợp đồng: <b>${c.contractTypeName}</b></p>
        <p>- Từ ngày: <b>${c.startDate}</b> đến ngày: <b>${c.endDate || 'Không thời hạn'}</b></p>
        <p>- Địa điểm làm việc: ${c.workLocation || 'Tại Trụ sở Công ty và các công trình dự án'}</p>
        <p>- Chức danh chuyên môn: <b>${c.jobTitle}</b> (Phòng ban: ${dept?.name || ''})</p>

        <p><b>Điều 2: Chế độ làm việc</b></p>
        <p>- Thời giờ làm việc: ${c.workingHours || '48 giờ/tuần (Thứ Hai đến Thứ Bảy)'}</p>
        <p>- Được trang bị các công cụ và đồ bảo hộ lao động theo yêu cầu công việc.</p>

        <p><b>Điều 3: Quyền lợi và nghĩa vụ của người lao động</b></p>
        <p>- Mức lương cơ bản: <b>${formatVND(c.baseSalary)}</b>/tháng.</p>
        <p>- Mức lương tham gia BHXH, BHYT, BHTN: <b>${formatVND(c.insuranceSalary)}</b>/tháng.</p>
        <p>- Phụ cấp và đãi ngộ: ${c.allowancesDescription || 'Phụ cấp ăn trưa, xăng xe công trình và thưởng theo hiệu quả công việc'}</p>
        <p>- Hình thức trả lương: ${c.paymentMethod || 'Chuyển khoản định kỳ vào ngày 05 - 10 hàng tháng'}</p>

        <p><b>Điều 4: Điều khoản thi hành</b></p>
        <p>- Hợp đồng này có hiệu lực từ ngày ký. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>

        <table class="table-sign">
          <tr>
            <td>
              <p class="bold">NGƯỜI LAO ĐỘNG (BÊN B)</p>
              <p style="font-style: italic;">(Ký và ghi rõ họ tên)</p>
              <br/><br/><br/><br/>
              <p class="bold">${emp?.fullName || ''}</p>
            </td>
            <td>
              <p class="bold">ĐẠI DIỆN NGƯỜI SỬ DỤNG LAO ĐỘNG (BÊN A)</p>
              <p style="font-style: italic;">(Ký, đóng dấu và ghi rõ họ tên)</p>
              <br/><br/><br/><br/>
              <p class="bold">${c.signatoryName || 'Lê Thanh Huy'}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], {
      type: 'application/msword',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hop_Dong_Lao_Dong_${c.code}_${emp?.fullName || 'NV'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file Word hợp đồng: ${c.code}`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-5">
      {/* 1. Header & Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <FileSignature className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Quản Lý Hợp Đồng Lao Động
              </h1>
              <p className="text-xs text-slate-500">
                Hệ thống lưu trữ, tự động hóa thời hạn, tái ký, phụ lục và in ấn hợp đồng theo luật lao động Việt Nam
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nhập từ Excel/PDF/Ảnh */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
            title="Tạo hợp đồng tự động từ file Excel, PDF scan hoặc Ảnh chụp"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhập Excel / PDF / Ảnh</span>
          </button>

          {/* Quản lý & Thiết kế Mẫu */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-indigo-300 shadow-2xs cursor-pointer"
            title="Quản lý kho mẫu HĐ, upload mẫu tùy ý và ánh xạ trường dữ liệu"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mẫu & Ánh Xạ Trường</span>
          </button>

          {/* Quyết định nâng lương */}
          <button
            onClick={() => {
              setDecisionDefaultEmpId(undefined);
              setIsSalaryDecisionModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
            title="Ban hành quyết định nâng bậc lương và tạo phụ lục hợp đồng"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>QĐ Nâng Lương</span>
          </button>

          {/* Quyết định chấm dứt */}
          <button
            onClick={() => {
              setDecisionDefaultContractId(undefined);
              setIsTerminationDecisionModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-rose-300 shadow-2xs cursor-pointer"
            title="Ban hành quyết định chấm dứt và lập biên bản thanh lý hợp đồng"
          >
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            <span>QĐ Chấm Dứt & Thanh Lý</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
            title="Xuất danh sách hợp đồng ra file Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
            title="Xuất báo cáo PDF"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất PDF</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Hợp Đồng Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Tổng hợp đồng */}
        <div
          onClick={() => {
            setTypeFilter('all');
            setStatusFilter('all');
          }}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Tổng hợp đồng</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{metrics.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tất cả nhân sự</div>
        </div>

        {/* Card 2: Đang hiệu lực */}
        <div
          onClick={() => setStatusFilter('active')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Đang hiệu lực</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{metrics.active}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Thực hiện chuẩn</div>
        </div>

        {/* Card 3: Sắp hết hạn (<= 45 ngày) */}
        <div
          onClick={() => setStatusFilter('expiring_soon')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'expiring_soon'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 shadow-2xs hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-amber-800">Cần gia hạn (≤45d)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">{metrics.expiringSoon}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Cảnh báo tái ký</div>
        </div>

        {/* Card 4: Thử việc */}
        <div
          onClick={() => setTypeFilter('probation')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'probation'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200'
              : 'bg-white border-slate-200 shadow-2xs hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Thử việc</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-700">{metrics.probation}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">Chờ đánh giá</div>
        </div>

        {/* Card 5: Đã hết hạn */}
        <div
          onClick={() => setStatusFilter('expired')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'expired'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 shadow-2xs hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Đã hết hạn</span>
            <FileClock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600">{metrics.expired}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Quá hạn chưa gia hạn</div>
        </div>

        {/* Card 6: Đã thanh lý */}
        <div
          onClick={() => setStatusFilter('terminated')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'terminated'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Đã thanh lý</span>
            <Ban className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-700">{metrics.terminated}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Đã chấm dứt</div>
        </div>
      </div>

      {/* 3. Toolbar: Search, Filters & Sorters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm số HĐ, tên NV, mã NV, CCCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500 w-56 sm:w-64"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-medium text-slate-600">Loại HĐ:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-blue-500"
            >
              <option value="all">Tất cả loại HĐ</option>
              <option value="probation">Thử việc (60 ngày)</option>
              <option value="definite_1yr">Xác định thời hạn 12 tháng</option>
              <option value="definite_3yr">Xác định thời hạn 36 tháng</option>
              <option value="indefinite">Không xác định thời hạn</option>
              <option value="seasonal">Theo mùa vụ / Công trình</option>
              <option value="service">Dịch vụ / CTV</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-medium text-slate-600">Phòng ban:</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-blue-500"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-medium text-slate-600">Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiệu lực</option>
              <option value="expiring_soon">Sắp hết hạn (≤ 45 ngày)</option>
              <option value="expired">Đã hết hạn</option>
              <option value="terminated">Đã thanh lý</option>
            </select>
          </div>
        </div>

        {/* Sorter */}
        <div className="flex items-center space-x-2 self-end lg:self-auto">
          <span className="text-xs text-slate-500 font-medium">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-blue-500 font-medium"
          >
            <option value="expiry_asc">Hết hạn sớm nhất</option>
            <option value="signed_desc">Ngày ký mới nhất</option>
            <option value="salary_desc">Lương từ cao xuống thấp</option>
          </select>
        </div>
      </div>

      {/* 4. Main Contract Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredContracts.length > 0 &&
                      filteredContracts.every((c) => selectedContractIds.includes(c.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allIds = Array.from(new Set([...selectedContractIds, ...filteredContracts.map((c) => c.id)]));
                        setSelectedContractIds(allIds);
                      } else {
                        const currentFilteredIds = new Set(filteredContracts.map((c) => c.id));
                        setSelectedContractIds(selectedContractIds.filter((id) => !currentFilteredIds.has(id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Chọn / Bỏ chọn tất cả"
                  />
                </th>
                <th className="py-3 px-2 text-center w-8">#</th>
                <th className="py-3 px-4 w-44">Số / Mã Hợp Đồng</th>
                <th className="py-3 px-4 w-52">Người Lao Động</th>
                <th className="py-3 px-3">Phòng Ban & Chức Danh</th>
                <th className="py-3 px-3">Loại Hợp Đồng</th>
                <th className="py-3 px-3">Thời Hạn Hiệu Lực</th>
                <th className="py-3 px-3 text-right">Lương Cơ Bản</th>
                <th className="py-3 px-3 text-right">Lương Đóng BHXH</th>
                <th className="py-3 px-3 text-center">Phụ Lục</th>
                <th className="py-3 px-3 text-center">Tình Trạng</th>
                <th className="py-3 px-3 text-center w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">Không tìm thấy hợp đồng nào phù hợp bộ lọc</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setStatusFilter('all');
                        setDeptFilter('all');
                      }}
                      className="mt-2 text-xs text-blue-700 hover:underline cursor-pointer"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c, idx) => {
                  const emp = employees.find((e) => e.id === c.employeeId);
                  const dept = departments.find((d) => d.id === emp?.departmentId);
                  const effStatus = getEffectiveStatus(c);
                  const daysLeft = getDaysRemaining(c.endDate);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        selectedContractIds.includes(c.id) ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedContractIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContractIds([...selectedContractIds, c.id]);
                            } else {
                              setSelectedContractIds(selectedContractIds.filter((id) => id !== c.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* # */}
                      <td className="py-3 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>

                      {/* Mã HĐ */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setPreviewContract(c)}
                          className="font-mono font-bold text-blue-900 hover:text-blue-700 hover:underline cursor-pointer flex items-center space-x-1.5"
                          title="Click để xem toàn văn bản hợp đồng chuẩn in"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{c.code}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Ký ngày: {c.signedDate}
                        </div>
                      </td>

                      {/* Người Lao Động */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {emp ? emp.fullName.split(' ').pop()?.charAt(0) : 'N'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{emp?.fullName || 'Chưa gán NV'}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {emp?.code || ''} · CCCD: {emp?.identityCard || 'Chưa nhập'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phòng ban & Chức danh */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{c.jobTitle}</div>
                        <div className="text-[11px] text-slate-500">{dept?.name || 'Chưa gán phòng'}</div>
                      </td>

                      {/* Loại hợp đồng */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {c.contractType === 'indefinite' && 'Không thời hạn'}
                          {c.contractType === 'definite_3yr' && 'Có thời hạn 36 tháng'}
                          {c.contractType === 'definite_1yr' && 'Có thời hạn 12 tháng'}
                          {c.contractType === 'probation' && 'Thử việc (60 ngày)'}
                          {c.contractType === 'seasonal' && 'Mùa vụ / Công trình'}
                          {c.contractType === 'service' && 'Dịch vụ / CTV'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.probationRate && c.probationRate < 100
                            ? `Lương thử việc ${c.probationRate}% (${formatVND(c.probationSalary || Math.round((c.baseSalary * c.probationRate) / 100))})`
                            : 'Hưởng 100% lương'}
                        </div>
                      </td>

                      {/* Thời hạn hiệu lực */}
                      <td className="py-3 px-3">
                        <div className="text-slate-900 font-medium">
                          {c.startDate} {c.endDate ? `→ ${c.endDate}` : '→ Vô thời hạn'}
                        </div>
                        {c.endDate ? (
                          <div className="text-[11px] mt-0.5">
                            {daysLeft === null ? (
                              <span className="text-slate-400">Chưa xác định</span>
                            ) : daysLeft < 0 ? (
                              <span className="text-rose-600 font-semibold">
                                Đã quá hạn {Math.abs(daysLeft)} ngày
                              </span>
                            ) : daysLeft <= 45 ? (
                              <span className="text-amber-600 font-semibold flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3 inline" />
                                <span>Còn {daysLeft} ngày (Cần tái ký)</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">Còn {daysLeft} ngày</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-600 font-medium">Không giới hạn thời gian</div>
                        )}
                      </td>

                      {/* Lương cơ bản */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-900">{formatVND(c.baseSalary)}</div>
                        <div className="text-[10px] text-slate-500">/tháng</div>
                      </td>

                      {/* Lương đóng BHXH */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-slate-700">
                          {c.insuranceSalary > 0 ? formatVND(c.insuranceSalary) : '0 đ'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.insuranceSalary > 0 ? 'Có đóng BHXH' : 'Không đóng BHXH'}
                        </div>
                      </td>

                      {/* Phụ lục */}
                      <td className="py-3 px-3 text-center">
                        {c.appendices && c.appendices.length > 0 ? (
                          <button
                            onClick={() => handleOpenAppendix(c)}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Xem chi tiết các phụ lục hợp đồng"
                          >
                            {c.appendices.length} phụ lục
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAppendix(c)}
                            className="text-slate-400 hover:text-blue-600 transition-colors text-[11px] cursor-pointer"
                            title="Thêm phụ lục hợp đồng mới"
                          >
                            + Thêm PL
                          </button>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center">
                        {effStatus === 'terminated' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            Đã thanh lý
                          </span>
                        )}
                        {effStatus === 'expired' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Đã hết hạn
                          </span>
                        )}
                        {effStatus === 'expiring_soon' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            Sắp hết hạn
                          </span>
                        )}
                        {effStatus === 'active' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Đang hiệu lực
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Xem & In HĐ */}
                          <button
                            onClick={() => setPreviewContract(c)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Xem chi tiết và In hợp đồng mẫu chuẩn"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Sửa HĐ */}
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                            title="Chỉnh sửa thông tin hợp đồng"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Gia hạn / Tái ký */}
                          <button
                            onClick={() => handleOpenRenew(c)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Tái ký / Gia hạn hợp đồng mới"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {/* QĐ Nâng Lương */}
                          <button
                            onClick={() => {
                              setDecisionDefaultEmpId(c.employeeId);
                              setIsSalaryDecisionModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Tạo Quyết định Nâng lương & Phụ lục lương cho nhân sự này"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {/* QĐ Chấm dứt & Biên bản Thanh lý */}
                          <button
                            onClick={() => {
                              setDecisionDefaultContractId(c.id);
                              setIsTerminationDecisionModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Tạo Quyết định Chấm dứt & Biên bản Thanh lý cho HĐ này"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>

                          {/* Thanh lý nhanh */}
                          {effStatus !== 'terminated' && (
                            <button
                              onClick={() => handleOpenTerminate(c)}
                              className="p-1.5 text-slate-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                              title="Thanh lý / Chấm dứt hợp đồng"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Xóa */}
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa hợp đồng "${c.code}" khỏi hệ thống?`)) {
                                deleteContract(c.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Xóa hợp đồng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Selection Toolbar for Batch Operations */}
      {selectedContractIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center gap-3 animate-in fade-in-50 slide-in-from-bottom-5">
          <div className="flex items-center space-x-2 pr-3 border-r border-slate-700">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">
              Đã chọn: <b className="text-blue-400 font-bold">{selectedContractIds.length}</b> hợp đồng
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsBatchPrintModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Mở trình xem và in hàng loạt khổ A4 hoặc xuất file"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Hàng Loạt (A4)</span>
            </button>

            <button
              onClick={handleDownloadZipSelected}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Nén tất cả hợp đồng đã chọn thành từng file Word riêng lẻ trong gói .ZIP"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Tải Gói Word (.ZIP)</span>
            </button>

            <button
              onClick={handleDownloadMergedWordSelected}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Gộp tất cả hợp đồng đã chọn vào 1 file Word duy nhất (phân trang chuẩn)"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Word Gộp (.DOC)</span>
            </button>

            <button
              onClick={handleExportExcelSelected}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Xuất danh sách các hợp đồng đã chọn ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất Excel</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedContractIds([])}
            className="ml-2 px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM MỚI / CHỈNH SỬA HỢP ĐỒNG LAO ĐỘNG                           */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingContract ? 'Chỉnh Sửa Hợp Đồng Lao Động' : 'Tạo Hợp Đồng Lao Động Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveContract} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Nhân sự & Số HĐ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nhân viên áp dụng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    disabled={!!editingContract}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500 disabled:opacity-60"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.code} - {emp.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số / Mã Hợp Đồng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="VD: HĐLĐ-2026/01-IT"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:bg-white focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* Loại Hợp Đồng & Chức danh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Loại Hợp Đồng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500 font-medium"
                  >
                    <option value="probation">Thử việc (60 ngày)</option>
                    <option value="definite_1yr">Xác định thời hạn (12 tháng)</option>
                    <option value="definite_3yr">Xác định thời hạn (36 tháng)</option>
                    <option value="indefinite">Không xác định thời hạn (Vô thời hạn)</option>
                    <option value="seasonal">Theo mùa vụ / Theo công trình</option>
                    <option value="service">Hợp đồng dịch vụ / Cộng tác viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Chức danh công việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="VD: Kỹ sư lập trình, Kế toán..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* Ngày ký, Bắt đầu, Kết thúc (Tự động đồng bộ & tính toán) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">
                      Ngày ký kết <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-medium">Tự động gán BĐ</span>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.signedDate}
                    onChange={(e) => handleSignedDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500 shadow-2xs font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Đổi ngày ký sẽ tự đổi Ngày BĐ & Ngày KT
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">
                      Ngày bắt đầu hiệu lực <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-blue-700 bg-blue-100/70 border border-blue-200 px-1.5 py-0.5 rounded font-bold">
                      = Ngày ký kết
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white border border-blue-300 ring-1 ring-blue-100 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500 shadow-2xs font-medium"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Hiệu lực từ ngày ký</span>
                    {formData.startDate !== formData.signedDate && (
                      <button
                        type="button"
                        onClick={() => handleSignedDateChange(formData.signedDate)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                        title="Đồng bộ lại theo ngày ký kết"
                      >
                        Đồng bộ lại ngày ký
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">
                      Ngày kết thúc {formData.contractType === 'indefinite' ? '(Bỏ trống)' : ''}
                    </label>
                    {formData.contractType !== 'indefinite' ? (
                      <span className="text-[10px] text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        = BĐ + {getContractDurationLabel(formData.contractType)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                        Vô thời hạn
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    disabled={formData.contractType === 'indefinite'}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500 disabled:bg-slate-100 disabled:opacity-60 shadow-2xs font-medium"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                    {formData.contractType === 'indefinite' ? (
                      <span className="text-slate-400">Không xác định thời hạn</span>
                    ) : (
                      <>
                        <span className="text-emerald-700 font-medium">Tự tính theo thời hạn HĐ</span>
                        <button
                          type="button"
                          onClick={() => {
                            const calculated = computeContractEndDate(formData.startDate, formData.contractType);
                            setFormData((prev) => ({ ...prev, endDate: calculated }));
                          }}
                          className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          title="Tính lại ngày kết thúc từ ngày bắt đầu và thời hạn HĐ"
                        >
                          ⚡ Tính lại
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Lương cơ bản, Lương đóng BHXH, Mức lương thử việc */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {/* 1. Lương cơ bản */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Lương cơ bản / chính thức (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step={100000}
                    value={formData.baseSalary}
                    onChange={(e) => handleBaseSalaryChange(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-blue-500"
                  />
                  <span className="text-[11px] font-bold text-slate-700 mt-1 block">
                    {formatVND(formData.baseSalary)}/tháng
                  </span>
                </div>

                {/* 2. Lương đóng BHXH */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mức lương đóng BHXH (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={formData.insuranceSalary}
                    onChange={(e) => setFormData({ ...formData, insuranceSalary: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-blue-500"
                  />
                  <span className="text-[11px] font-medium text-slate-600 mt-1 block">
                    {formatVND(formData.insuranceSalary)}/tháng
                  </span>
                </div>

                {/* 3. Mức lương thử việc (85% hoặc tự nhập số tiền) */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-300 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold text-[11px]">
                      Mức lương thử việc
                    </label>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={handleSetProbation85}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                          formData.probationMode === '85_percent'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                        title="Áp dụng 85% lương chính thức theo Điều 26 Bộ luật Lao Động"
                      >
                        85% Luật LĐ
                      </button>
                      <button
                        type="button"
                        onClick={handleSetProbation100}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                          formData.probationMode === '100_percent'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                        title="Hưởng 100% lương thử việc"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Dual Inputs: Tự nhập số tiền VNĐ hoặc Tự nhập % */}
                  <div className="grid grid-cols-5 gap-1.5 items-center">
                    <div className="col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          step={100000}
                          value={formData.probationSalary}
                          onChange={(e) => handleCustomProbationSalaryChange(Number(e.target.value))}
                          placeholder="Số tiền (VNĐ)"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-md pl-2.5 pr-6 py-1.5 text-xs font-bold text-blue-900 focus:outline-blue-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                          đ
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={200}
                          step={1}
                          value={formData.probationRate}
                          onChange={(e) => handleCustomProbationRateChange(Number(e.target.value))}
                          placeholder="%"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-md pl-2 pr-5 py-1.5 text-xs font-bold text-slate-900 focus:outline-blue-500 text-center"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-label & Info */}
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-bold text-blue-700">
                      {formatVND(formData.probationSalary)} ({formData.probationRate}%)
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {formData.probationMode === '85_percent'
                        ? 'Chuẩn 85% Luật LĐ'
                        : formData.probationMode === '100_percent'
                        ? 'Hưởng 100%'
                        : 'Tự nhập số tiền'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chế độ làm việc & Địa điểm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thời giờ làm việc</label>
                  <input
                    type="text"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Địa điểm làm việc</label>
                  <input
                    type="text"
                    value={formData.workLocation}
                    onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* Phụ cấp thỏa thuận */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phụ cấp & Đãi ngộ theo HĐ</label>
                <input
                  type="text"
                  value={formData.allowancesDescription}
                  onChange={(e) => setFormData({ ...formData, allowancesDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500"
                />
              </div>

              {/* Đại diện Bên A ký */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Đại diện Công ty (Bên A) ký</label>
                  <input
                    type="text"
                    value={formData.signatoryName}
                    onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chức vụ người ký</label>
                  <input
                    type="text"
                    value={formData.signatoryTitle}
                    onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Điều khoản cam kết, thời gian báo trước khi thôi việc..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-blue-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingContract ? 'Lưu Cập Nhật' : 'Tạo Hợp Đồng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XEM TOÀN VĂN BẢN HỢP ĐỒNG LAO ĐỘNG (CHUẨN BỘ LAO ĐỘNG)           */}
      {/* ========================================================================= */}
      {previewContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
            {/* Modal Top Bar */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">
                  Văn bản Hợp Đồng Lao Động: {previewContract.code}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadWordContract(previewContract)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Tải văn bản Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Word (.doc)</span>
                </button>

                <button
                  onClick={handlePrintContract}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  title="In trực tiếp ra giấy A4"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Hợp Đồng</span>
                </button>

                <button
                  onClick={() => setPreviewContract(null)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50 text-slate-800 font-serif leading-relaxed text-sm">
              <div className="bg-white p-8 sm:p-12 shadow-md border border-slate-200 rounded max-w-3xl mx-auto space-y-6">
                {/* Quốc hiệu tiêu ngữ */}
                <div className="text-center space-y-1">
                  <div className="font-bold text-sm tracking-wide uppercase text-slate-900">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="font-bold text-sm text-slate-900">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-slate-400 text-xs">---------------------------</div>
                </div>

                {/* Tiêu đề Hợp đồng */}
                <div className="text-center pt-2">
                  <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                    HỢP ĐỒNG LAO ĐỘNG
                  </h2>
                  <p className="text-xs italic text-slate-600 mt-1">Số: {previewContract.code}</p>
                </div>

                {/* Lời mở đầu */}
                <p className="text-justify text-xs">
                  Hôm nay, ngày {previewContract.signedDate.split('-')[2]} tháng{' '}
                  {previewContract.signedDate.split('-')[1]} năm {previewContract.signedDate.split('-')[0]}, tại Trụ sở
                  Công ty, chúng tôi gồm các bên dưới đây cùng thỏa thuận ký kết hợp đồng lao động:
                </p>

                {/* BÊN A */}
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
                    <div>
                      - Đại diện: <b>{previewContract.signatoryName || 'Lê Thanh Huy'}</b>
                    </div>
                    <div>
                      - Chức vụ: <b>{previewContract.signatoryTitle || 'Tổng Giám Đốc'}</b>
                    </div>
                    <div className="col-span-2">
                      - Đại diện cho: <b>CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG & THƯƠNG MẠI ENTERPRISE</b>
                    </div>
                    <div className="col-span-2">
                      - Địa chỉ trụ sở: Tòa nhà Enterprise Tower, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                    </div>
                    <div>- Mã số thuế: 0314892839</div>
                    <div>- Điện thoại: (028) 3822 6868</div>
                  </div>
                </div>

                {/* BÊN B */}
                {(() => {
                  const emp = employees.find((e) => e.id === previewContract.employeeId);
                  const dept = departments.find((d) => d.id === emp?.departmentId);

                  return (
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                        BÊN B: NGƯỜI LAO ĐỘNG
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
                        <div>
                          - Ông / Bà: <b>{emp?.fullName || ''}</b>
                        </div>
                        <div>- Quốc tịch: Việt Nam</div>
                        <div>- Ngày sinh: {emp?.birthDate || '01/01/1990'}</div>
                        <div>- Giới tính: Nam</div>
                        <div>
                          - Số CCCD / CMND: <b>{emp?.identityCard || 'Chưa cập nhật'}</b>
                        </div>
                        <div>- Nơi cấp: Cục CS QLHC về TTXH</div>
                        <div className="col-span-2">- Quê quán: {emp?.hometown || 'Việt Nam'}</div>
                        <div className="col-span-2">- Chỗ ở hiện nay: {emp?.currentAddress || ''}</div>
                        <div>- Số điện thoại: {emp?.phone || ''}</div>
                        <div>- Email: {emp?.email || ''}</div>
                      </div>

                      {/* NỘI DUNG ĐIỀU KHOẢN */}
                      <div className="pt-4 space-y-4">
                        {/* Điều 1 */}
                        <div>
                          <p className="font-bold text-slate-900 uppercase">
                            Điều 1: Thời hạn và công việc theo hợp đồng
                          </p>
                          <ul className="list-disc pl-5 space-y-1 mt-1 text-justify">
                            <li>
                              Loại hợp đồng lao động: <b>{previewContract.contractTypeName}</b>.
                            </li>
                            <li>
                              Thời hạn hợp đồng: Từ ngày <b>{previewContract.startDate}</b> đến ngày{' '}
                              <b>{previewContract.endDate || 'Vô thời hạn (Không xác định thời hạn)'}</b>.
                            </li>
                            <li>
                              Địa điểm làm việc:{' '}
                              {previewContract.workLocation ||
                                'Tại Trụ sở Công ty và các công trình dự án được phân công.'}
                            </li>
                            <li>
                              Chức danh chuyên môn / Vị trí việc làm: <b>{previewContract.jobTitle}</b> (Thuộc:{' '}
                              {dept?.name || 'Văn phòng Công ty'}).
                            </li>
                          </ul>
                        </div>

                        {/* Điều 2 */}
                        <div>
                          <p className="font-bold text-slate-900 uppercase">Điều 2: Chế độ làm việc</p>
                          <ul className="list-disc pl-5 space-y-1 mt-1 text-justify">
                            <li>
                              Thời giờ làm việc:{' '}
                              {previewContract.workingHours ||
                                '48 giờ/tuần (Từ Thứ Hai đến Thứ Bảy, 08h00 - 17h00).'}
                            </li>
                            <li>Được cấp phát đầy đủ phương tiện bảo hộ lao động và trang thiết bị làm việc.</li>
                            <li>Nghỉ lễ, tết, phép năm hưởng nguyên lương theo quy định của Bộ luật Lao động.</li>
                          </ul>
                        </div>

                        {/* Điều 3 */}
                        <div>
                          <p className="font-bold text-slate-900 uppercase">
                            Điều 3: Quyền lợi và nghĩa vụ của Người lao động
                          </p>
                          <ul className="list-disc pl-5 space-y-1 mt-1 text-justify">
                            <li>
                              Mức lương cơ bản / chính thức:{' '}
                              <b>{formatVND(previewContract.baseSalary)}</b>/tháng.
                            </li>
                            <li>
                              Mức lương làm căn cứ đóng BHXH, BHYT, BHTN:{' '}
                              <b>{formatVND(previewContract.insuranceSalary)}</b>/tháng.
                            </li>
                            {previewContract.probationRate && previewContract.probationRate < 100 && (
                              <li>
                                Trong thời gian thử việc, Người lao động được hưởng{' '}
                                <b>{previewContract.probationRate}%</b> mức lương chính thức (tương đương{' '}
                                <b>
                                  {formatVND(
                                    previewContract.probationSalary ||
                                      Math.round(
                                        (previewContract.baseSalary * previewContract.probationRate) / 100
                                      )
                                  )}
                                </b>
                                /tháng).
                              </li>
                            )}
                            <li>
                              Chế độ phụ cấp và đãi ngộ:{' '}
                              {previewContract.allowancesDescription ||
                                'Phụ cấp ăn trưa, xăng xe công trình, thưởng năng lực theo quy chế.'}
                            </li>
                            <li>
                              Hình thức chi trả:{' '}
                              {previewContract.paymentMethod ||
                                'Chuyển khoản vào tài khoản ngân hàng của NLĐ vào ngày 05 - 10 hàng tháng.'}
                            </li>
                          </ul>
                        </div>

                        {/* Điều 4 */}
                        <div>
                          <p className="font-bold text-slate-900 uppercase">Điều 4: Điều khoản thi hành</p>
                          <p className="mt-1 text-justify">
                            Những vấn đề về quyền và nghĩa vụ lao động không ghi trong hợp đồng này sẽ do Thỏa ước lao
                            động tập thể và Nội quy lao động của Công ty cùng các quy định của Bộ luật Lao động Nước
                            Cộng hòa Xã hội Chủ nghĩa Việt Nam điều chỉnh. Hợp đồng này được lập thành 02 (hai) bản có giá
                            trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.
                          </p>
                        </div>

                        {/* Chữ ký hai bên */}
                        <div className="grid grid-cols-2 gap-8 pt-8 text-center">
                          <div>
                            <p className="font-bold uppercase text-slate-900">NGƯỜI LAO ĐỘNG (BÊN B)</p>
                            <p className="text-[11px] italic text-slate-500">(Ký và ghi rõ họ tên)</p>
                            <div className="h-20" />
                            <p className="font-bold text-slate-900">{emp?.fullName || ''}</p>
                          </div>

                          <div>
                            <p className="font-bold uppercase text-slate-900">
                              ĐẠI DIỆN NGƯỜI SỬ DỤNG LAO ĐỘNG (BÊN A)
                            </p>
                            <p className="text-[11px] italic text-slate-500">(Ký tên và đóng dấu)</p>
                            <div className="h-20" />
                            <p className="font-bold text-slate-900">
                              {previewContract.signatoryName || 'Lê Thanh Huy'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GIA HẠN / TÁI KÝ HỢP ĐỒNG NHANH                                  */}
      {/* ========================================================================= */}
      {renewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCw className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">Gia Hạn / Tái Ký Hợp Đồng Lao Động</h3>
              </div>
              <button
                onClick={() => setRenewingContract(null)}
                className="text-emerald-200 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRenewal} className="p-5 space-y-3.5 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg space-y-1">
                <div className="font-bold text-emerald-900">
                  Hợp đồng gốc: {renewingContract.code} ({renewingContract.contractTypeName})
                </div>
                <div className="text-slate-600">
                  Nhân sự: {employees.find((e) => e.id === renewingContract.employeeId)?.fullName} -{' '}
                  {renewingContract.jobTitle}
                </div>
                <div className="text-slate-600">
                  Thời hạn cũ: {renewingContract.startDate} → {renewingContract.endDate || 'Vô thời hạn'}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Loại hợp đồng mới tái ký <span className="text-red-500">*</span>
                </label>
                <select
                  value={renewalData.contractType}
                  onChange={(e) => {
                    const type = e.target.value as ContractType;
                    const start = new Date(renewalData.startDate);
                    let endDate = '';
                    if (type === 'definite_1yr') {
                      const end = new Date(start);
                      end.setFullYear(end.getFullYear() + 1);
                      endDate = end.toISOString().split('T')[0];
                    } else if (type === 'definite_3yr') {
                      const end = new Date(start);
                      end.setFullYear(end.getFullYear() + 3);
                      endDate = end.toISOString().split('T')[0];
                    }
                    setRenewalData({
                      ...renewalData,
                      contractType: type,
                      endDate,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-emerald-600"
                >
                  <option value="definite_1yr">Xác định thời hạn 12 tháng</option>
                  <option value="definite_3yr">Xác định thời hạn 36 tháng</option>
                  <option value="indefinite">Không xác định thời hạn (Ký chính thức lâu dài)</option>
                  <option value="seasonal">Theo mùa vụ / Công trình</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngày bắt đầu chu kỳ mới</label>
                  <input
                    type="date"
                    required
                    value={renewalData.startDate}
                    onChange={(e) => setRenewalData({ ...renewalData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    disabled={renewalData.contractType === 'indefinite'}
                    value={renewalData.endDate}
                    onChange={(e) => setRenewalData({ ...renewalData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mức lương thỏa thuận mới</label>
                  <input
                    type="number"
                    step={100000}
                    value={renewalData.baseSalary}
                    onChange={(e) => setRenewalData({ ...renewalData, baseSalary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500">{formatVND(renewalData.baseSalary)}</span>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lương đóng BHXH mới</label>
                  <input
                    type="number"
                    step={100000}
                    value={renewalData.insuranceSalary}
                    onChange={(e) => setRenewalData({ ...renewalData, insuranceSalary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500">{formatVND(renewalData.insuranceSalary)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ghi chú tái ký</label>
                <textarea
                  rows={2}
                  value={renewalData.notes}
                  onChange={(e) => setRenewalData({ ...renewalData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRenewingContract(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Tái Ký Hợp Đồng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PHỤ LỤC HỢP ĐỒNG (APPENDICES)                                     */}
      {/* ========================================================================= */}
      {appendixModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FilePlus2 className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-sm">
                  Phụ Lục Hợp Đồng Lao Động - {appendixModalContract.code}
                </h3>
              </div>
              <button
                onClick={() => setAppendixModalContract(null)}
                className="text-indigo-200 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Existing Appendices */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <FileSignature className="w-4 h-4 text-indigo-600" />
                  <span>Các phụ lục đã ký kết:</span>
                </h4>
                {appendixModalContract.appendices && appendixModalContract.appendices.length > 0 ? (
                  <div className="space-y-2">
                    {appendixModalContract.appendices.map((app) => (
                      <div
                        key={app.id}
                        className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-3 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-indigo-900">{app.code}</span>
                            <span className="font-semibold text-slate-800">· {app.title}</span>
                          </div>
                          <p className="text-slate-600">{app.description}</p>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
                            <span>Ngày ký: {app.signedDate}</span>
                            <span>Hiệu lực từ: {app.effectiveDate}</span>
                            {app.newBaseSalary && (
                              <span className="font-semibold text-emerald-700">
                                Lương mới: {formatVND(app.newBaseSalary)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteContractAppendix(appendixModalContract.id, app.id)}
                          className="text-slate-400 hover:text-red-700 p-1 rounded hover:bg-white transition-colors cursor-pointer"
                          title="Xóa phụ lục này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Chưa có phụ lục nào được ký cho hợp đồng này.</p>
                )}
              </div>

              {/* Add New Appendix Form */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Ký thêm phụ lục mới:</span>
                </h4>

                <form onSubmit={handleSaveAppendix} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Số / Mã phụ lục</label>
                      <input
                        type="text"
                        required
                        value={appendixData.code}
                        onChange={(e) => setAppendixData({ ...appendixData, code: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Loại phụ lục</label>
                      <select
                        value={appendixData.type}
                        onChange={(e) => setAppendixData({ ...appendixData, type: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                      >
                        <option value="salary_adjustment">Điều chỉnh nâng lương / phụ cấp</option>
                        <option value="position_change">Thay đổi chức danh / phòng ban</option>
                        <option value="term_extension">Gia hạn thời hạn hợp đồng</option>
                        <option value="other">Điều chỉnh điều khoản khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tiêu đề phụ lục</label>
                    <input
                      type="text"
                      required
                      value={appendixData.title}
                      onChange={(e) => setAppendixData({ ...appendixData, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Ngày ký</label>
                      <input
                        type="date"
                        value={appendixData.signedDate}
                        onChange={(e) => setAppendixData({ ...appendixData, signedDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Ngày có hiệu lực</label>
                      <input
                        type="date"
                        value={appendixData.effectiveDate}
                        onChange={(e) => setAppendixData({ ...appendixData, effectiveDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Mức lương mới (VNĐ)</label>
                      <input
                        type="number"
                        step={100000}
                        value={appendixData.newBaseSalary}
                        onChange={(e) => setAppendixData({ ...appendixData, newBaseSalary: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-indigo-500"
                      />
                      <span className="text-[10px] text-slate-500">{formatVND(appendixData.newBaseSalary)}</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Chức danh công việc mới</label>
                      <input
                        type="text"
                        value={appendixData.newJobTitle}
                        onChange={(e) => setAppendixData({ ...appendixData, newJobTitle: e.target.value })}
                        placeholder="Để trống nếu không đổi"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Nội dung chi tiết phụ lục</label>
                    <textarea
                      rows={2}
                      value={appendixData.description}
                      onChange={(e) => setAppendixData({ ...appendixData, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAppendixModalContract(null)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu Phụ Lục Hợp Đồng</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: THANH LÝ / CHẤM DỨT HỢP ĐỒNG                                     */}
      {/* ========================================================================= */}
      {terminatingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ban className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">Thanh Lý / Chấm Dứt Hợp Đồng</h3>
              </div>
              <button
                onClick={() => setTerminatingContract(null)}
                className="text-rose-200 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTermination} className="p-5 space-y-3.5 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg space-y-1">
                <div className="font-bold text-rose-900">Hợp đồng: {terminatingContract.code}</div>
                <div className="text-slate-700">
                  Nhân sự: {employees.find((e) => e.id === terminatingContract.employeeId)?.fullName} (
                  {terminatingContract.jobTitle})
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ngày chấm dứt hiệu lực <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={terminationData.terminationDate}
                  onChange={(e) => setTerminationData({ ...terminationData, terminationDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-rose-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lý do chấm dứt</label>
                <select
                  value={terminationData.reason}
                  onChange={(e) => setTerminationData({ ...terminationData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-rose-600"
                >
                  <option value="Hai bên thỏa thuận chấm dứt hợp đồng lao động">
                    Hai bên thỏa thuận chấm dứt hợp đồng lao động
                  </option>
                  <option value="Hết hạn hợp đồng lao động và không tái ký">
                    Hết hạn hợp đồng lao động và không tái ký
                  </option>
                  <option value="Người lao động đơn phương chấm dứt hợp đồng hợp pháp">
                    Người lao động đơn phương chấm dứt hợp đồng hợp pháp
                  </option>
                  <option value="Chấm dứt trong giai đoạn thử việc do không đạt yêu cầu">
                    Chấm dứt trong giai đoạn thử việc do không đạt yêu cầu
                  </option>
                  <option value="Điều chuyển công tác sang đơn vị liên kết khác">
                    Điều chuyển công tác sang đơn vị liên kết khác
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Biên bản bàn giao & Quyết toán</label>
                <textarea
                  rows={2}
                  value={terminationData.settlementNotes}
                  onChange={(e) => setTerminationData({ ...terminationData, settlementNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-rose-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTerminatingContract(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Thanh Lý</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: NHẬP HỢP ĐỒNG TỪ FILE EXCEL / PDF / HÌNH ẢNH                     */}
      {/* ========================================================================= */}
      <ImportContractsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* MODAL 7: KHO MẪU HỢP ĐỒNG & ÁNH XẠ TRƯỜNG DỮ LIỆU NHÂN SỰ                 */}
      {/* ========================================================================= */}
      <ContractTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* MODAL 8: QUYẾT ĐỊNH NÂNG LƯƠNG & TỰ ĐỘNG CẬP NHẬT PHỤ LỤC / HỒ SƠ          */}
      {/* ========================================================================= */}
      <SalaryDecisionModal
        isOpen={isSalaryDecisionModalOpen}
        onClose={() => setIsSalaryDecisionModalOpen(false)}
        defaultEmployeeId={decisionDefaultEmpId}
      />

      {/* ========================================================================= */}
      {/* MODAL 9: QUYẾT ĐỊNH CHẤM DỨT & BIÊN BẢN THANH LÝ HỢP ĐỒNG                 */}
      {/* ========================================================================= */}
      <TerminationDecisionModal
        isOpen={isTerminationDecisionModalOpen}
        onClose={() => setIsTerminationDecisionModalOpen(false)}
        defaultContractId={decisionDefaultContractId}
      />

      {/* ========================================================================= */}
      {/* MODAL 10: XUẤT IN HÀNG LOẠT HỢP ĐỒNG KHỔ A4 & TẢI FILE NÉN WORD (.ZIP)    */}
      {/* ========================================================================= */}
      <BatchPrintModal
        isOpen={isBatchPrintModalOpen}
        onClose={() => setIsBatchPrintModalOpen(false)}
        selectedContractIds={selectedContractIds}
      />
    </div>
  );
};

