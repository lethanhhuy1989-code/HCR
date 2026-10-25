import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Employee,
  Department,
  JobPosition,
  SalaryGrade,
  ConstructionProject,
  EmployeeProjectAllowance,
} from '../types/hrm';
import {
  X,
  Plus,
  Trash2,
  Copy,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ClipboardPaste,
  Sparkles,
  Eraser,
  HelpCircle,
  Table,
  UserCheck,
  Building,
  Briefcase,
  DollarSign,
  Info,
  Download,
  Upload,
  FileUp,
} from 'lucide-react';

export interface GridEmployeeRow {
  id: string; // Temporary ID for React key
  code: string;
  fullName: string;
  departmentId: string;
  position: string;
  positionRank: string;
  salaryType: 'scale' | 'negotiated';
  negotiatedType: 'monthly' | 'daily';
  negotiatedSalary: number;
  negotiatedDailyRate: number;
  responsibilityAllowance: number;
  phone: string;
  email: string;
  identityCard: string;
  socialInsuranceCode: string;
  bankAccount: string;
  bankName: string;
  hometown: string;
  currentAddress: string;
  joinDate: string;
  status: 'active' | 'probation';
  gradeId?: string;
  tierIndex?: number;
}

interface BulkEmployeeGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (employees: Omit<Employee, 'id'>[]) => void;
  departments: Department[];
  jobPositions: JobPosition[];
  grades: SalaryGrade[];
  projects: ConstructionProject[];
  existingEmployees: Employee[];
}

export const BulkEmployeeGridModal: React.FC<BulkEmployeeGridModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
  departments,
  jobPositions,
  grades,
  projects,
  existingEmployees,
}) => {
  const [rows, setRows] = useState<GridEmployeeRow[]>([]);
  const [isPasteAreaOpen, setIsPasteAreaOpen] = useState(false);
  const [pasteRawText, setPasteRawText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Next sequential employee code generator
  const getNextSequentialCode = (offset: number = 0, currentList: GridEmployeeRow[] = []) => {
    const allCodes = [
      ...existingEmployees.map((e) => e.code),
      ...currentList.map((r) => r.code),
    ];
    let maxNum = 0;
    allCodes.forEach((c) => {
      const match = c?.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1 + offset;
    return `NV-${String(nextNum).padStart(3, '0')}`;
  };

  // Helper to create an empty default row
  const createEmptyRow = (offset: number = 0, currentList: GridEmployeeRow[] = []): GridEmployeeRow => {
    const code = getNextSequentialCode(offset, currentList);
    const defaultDept = departments[0]?.id || '';
    const defaultPos = jobPositions[0]?.title || 'Chỉ huy trưởng';
    const defaultRank = jobPositions[0]?.rank || 'C';
    const defaultGrade = grades[0]?.id || '';

    return {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      code,
      fullName: '',
      departmentId: defaultDept,
      position: defaultPos,
      positionRank: defaultRank,
      salaryType: 'negotiated',
      negotiatedType: 'monthly',
      negotiatedSalary: 15000000,
      negotiatedDailyRate: 576923,
      responsibilityAllowance: 0,
      phone: '',
      email: '',
      identityCard: '079' + Math.floor(100000000 + Math.random() * 900000000),
      socialInsuranceCode: '792' + Math.floor(1000000 + Math.random() * 9000000),
      bankAccount: '190' + Math.floor(1000000000 + Math.random() * 9000000000),
      bankName: 'Techcombank - CN Sài Gòn',
      hometown: 'TP. Hồ Chí Minh',
      currentAddress: 'Quận 1, TP.HCM',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      gradeId: defaultGrade,
      tierIndex: 1,
    };
  };

  // Initialize with 3 rows when modal is opened and empty
  useEffect(() => {
    if (isOpen && rows.length === 0) {
      const initial: GridEmployeeRow[] = [];
      for (let i = 0; i < 3; i++) {
        initial.push(createEmptyRow(i, initial));
      }
      setRows(initial);
    }
  }, [isOpen]);

  // Add 1 or N rows
  const handleAddRows = (count: number = 1) => {
    setRows((prev) => {
      const newItems: GridEmployeeRow[] = [];
      for (let i = 0; i < count; i++) {
        newItems.push(createEmptyRow(i, [...prev, ...newItems]));
      }
      return [...prev, ...newItems];
    });
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Duplicate row
  const handleDuplicateRow = (row: GridEmployeeRow) => {
    setRows((prev) => {
      const newCode = getNextSequentialCode(0, prev);
      const cloned: GridEmployeeRow = {
        ...row,
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        code: newCode,
        fullName: `${row.fullName} (Bản sao)`,
      };
      return [...prev, cloned];
    });
  };

  // Update specific cell in row
  const handleCellChange = (id: string, field: keyof GridEmployeeRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };

        // Automatically update daily rate if monthly salary changes
        if (field === 'negotiatedSalary') {
          updated.negotiatedDailyRate = Math.round(Number(value || 0) / 26);
        }
        // Automatically sync positionRank when position changes
        if (field === 'position') {
          const matched = jobPositions.find(
            (p) => p.title.toLowerCase() === String(value).toLowerCase()
          );
          if (matched && matched.rank) {
            updated.positionRank = matched.rank;
          }
        }
        // Automatically calculate salary when switching to scale
        if (field === 'salaryType' && value === 'scale') {
          const g = grades.find((gr) => gr.id === (updated.gradeId || grades[0]?.id)) || grades[0];
          const coeff = g?.coefficients[(updated.tierIndex || 1) - 1] || 1;
          updated.negotiatedSalary = Math.round((g?.standardBaseRate || 5000000) * coeff);
          updated.negotiatedDailyRate = Math.round(updated.negotiatedSalary / 26);
        }
        return updated;
      })
    );
  };

  // Clear blank rows (where fullName is empty)
  const handleCleanEmptyRows = () => {
    setRows((prev) => prev.filter((r) => r.fullName.trim() !== ''));
  };

  // Clear all rows
  const handleClearAll = () => {
    if (rows.length > 0 && window.confirm('Bạn có chắc chắn muốn xóa tất cả các dòng trong bảng tính này?')) {
      setRows([]);
    }
  };

  // Fill sample data
  const handleFillSampleData = () => {
    const deptTech = departments.find((d) => d.code === 'KT' || d.name.includes('Kỹ thuật'))?.id || departments[0]?.id;
    const deptOffice = departments.find((d) => d.code === 'HC' || d.name.includes('Hành chính') || d.name.includes('Kế toán'))?.id || departments[0]?.id;
    const deptSite = departments.find((d) => d.name.includes('Công trình') || d.name.includes('Xây dựng'))?.id || departments[0]?.id;

    const samples: GridEmployeeRow[] = [
      {
        id: `sample-1-${Date.now()}`,
        code: getNextSequentialCode(0, []),
        fullName: 'Nguyễn Văn Hoàng',
        departmentId: deptSite,
        position: 'Chỉ huy trưởng',
        positionRank: 'A',
        salaryType: 'negotiated',
        negotiatedType: 'monthly',
        negotiatedSalary: 28000000,
        negotiatedDailyRate: 1076923,
        responsibilityAllowance: 3000000,
        phone: '0912345678',
        email: 'hoang.nguyen@congtrinh.vn',
        identityCard: '079090001234',
        socialInsuranceCode: '7921234567',
        bankAccount: '190345678901',
        bankName: 'Techcombank - CN Sài Gòn',
        hometown: 'Hà Nội',
        currentAddress: 'TP. Thủ Đức, TP.HCM',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        gradeId: grades[0]?.id || '',
        tierIndex: 1,
      },
      {
        id: `sample-2-${Date.now()}`,
        code: getNextSequentialCode(1, []),
        fullName: 'Trần Thị Thu Thảo',
        departmentId: deptOffice,
        position: 'Kế toán tiền lương',
        positionRank: 'B',
        salaryType: 'negotiated',
        negotiatedType: 'monthly',
        negotiatedSalary: 18000000,
        negotiatedDailyRate: 692308,
        responsibilityAllowance: 1000000,
        phone: '0987654321',
        email: 'thao.tran@congty.com',
        identityCard: '079195005678',
        socialInsuranceCode: '7927654321',
        bankAccount: '0071000987654',
        bankName: 'Vietcombank - CN Kỳ Đồng',
        hometown: 'Đà Nẵng',
        currentAddress: 'Quận 3, TP.HCM',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        gradeId: grades[0]?.id || '',
        tierIndex: 1,
      },
      {
        id: `sample-3-${Date.now()}`,
        code: getNextSequentialCode(2, []),
        fullName: 'Lê Quốc Bảo',
        departmentId: deptTech,
        position: 'Kỹ sư hiện trường',
        positionRank: 'C',
        salaryType: 'negotiated',
        negotiatedType: 'monthly',
        negotiatedSalary: 16500000,
        negotiatedDailyRate: 634615,
        responsibilityAllowance: 1500000,
        phone: '0903112233',
        email: 'bao.le@xaydung.vn',
        identityCard: '079201009876',
        socialInsuranceCode: '7923344556',
        bankAccount: '102874659201',
        bankName: 'VietinBank - CN Chợ Lớn',
        hometown: 'Bình Định',
        currentAddress: 'Quận 7, TP.HCM',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        gradeId: grades[0]?.id || '',
        tierIndex: 1,
      },
    ];

    setRows((prev) => [...prev, ...samples]);
  };

  // Helper to strip quotes and clean text
  const cleanStr = (val: any): string => {
    if (val === undefined || val === null) return '';
    return String(val).trim().replace(/^["'](.*)["']$/, '$1');
  };

  // Robust column parser that works for both pasted clipboard text and Excel file uploads
  const parseRowCols = (
    rawCols: any[],
    offsetIdx: number,
    currentRows: GridEmployeeRow[]
  ): GridEmployeeRow | null => {
    if (!rawCols || rawCols.length === 0) return null;
    let cols = rawCols.map(cleanStr);
    if (cols.every((c) => c === '')) return null;

    // Detect and remove STT column if present (e.g. "1", "2", 1, 2)
    if (cols.length >= 2 && /^\d{1,4}$/.test(cols[0])) {
      cols = cols.slice(1);
    }

    if (cols.length === 0 || !cols[0]) return null;

    let code = '';
    let fullName = '';
    let deptNameOrId = '';
    let pos = '';
    let rank = 'C';
    let salType: 'negotiated' | 'scale' = 'negotiated';
    let salStr = '15000000';
    let respStr = '0';
    let phone = '';
    let email = '';
    let cccd = '';
    let bhxh = '';
    let bankAcc = '';
    let bankName = 'Techcombank - CN Sài Gòn';
    let joinDate = new Date().toISOString().split('T')[0];
    let status: 'active' | 'probation' = 'active';

    // Check if cols[0] is an Employee Code (e.g. NV-001, CB01, EMP_12) without spaces and not pure numbers
    const looksLikeCode =
      /^[A-Za-z0-9_-]{2,12}$/.test(cols[0]) &&
      !cols[0].includes(' ') &&
      !/^[0-9]+$/.test(cols[0]);

    if (looksLikeCode && cols.length >= 2) {
      code = cols[0];
      fullName = cols[1];
      deptNameOrId = cols[2] || '';
      pos = cols[3] || '';
      if (cols[4] && ['A', 'B', 'C', 'D'].includes(cols[4].toUpperCase())) {
        rank = cols[4].toUpperCase();
        if (
          cols[5]?.toLowerCase().includes('thang') ||
          cols[5]?.toLowerCase().includes('bậc') ||
          cols[5]?.toLowerCase().includes('ngạch')
        ) {
          salType = 'scale';
          salStr = cols[6] || salStr;
          respStr = cols[7] || '0';
          phone = cols[8] || '';
          email = cols[9] || '';
          cccd = cols[10] || '';
          bhxh = cols[11] || '';
          bankAcc = cols[12] || '';
          bankName = cols[13] || bankName;
          joinDate = cols[14] || joinDate;
          status = cols[15]?.toLowerCase().includes('thử') ? 'probation' : 'active';
        } else {
          salStr = cols[5] || salStr;
          respStr = cols[6] || '0';
          phone = cols[7] || '';
          email = cols[8] || '';
          cccd = cols[9] || '';
          bhxh = cols[10] || '';
          bankAcc = cols[11] || '';
          bankName = cols[12] || bankName;
          joinDate = cols[13] || joinDate;
          status = cols[14]?.toLowerCase().includes('thử') ? 'probation' : 'active';
        }
      } else {
        salStr = cols[4] || salStr;
        respStr = cols[5] || '0';
        phone = cols[6] || '';
        email = cols[7] || '';
        cccd = cols[8] || '';
        bhxh = cols[9] || '';
        bankAcc = cols[10] || '';
        bankName = cols[11] || bankName;
        joinDate = cols[12] || joinDate;
        status = cols[13]?.toLowerCase().includes('thử') ? 'probation' : 'active';
      }
    } else {
      // cols[0] is fullName
      fullName = cols[0];
      deptNameOrId = cols[1] || '';
      pos = cols[2] || '';
      if (cols[3] && ['A', 'B', 'C', 'D'].includes(cols[3].toUpperCase())) {
        rank = cols[3].toUpperCase();
        salStr = cols[4] || salStr;
        respStr = cols[5] || '0';
        phone = cols[6] || '';
        email = cols[7] || '';
        cccd = cols[8] || '';
        bhxh = cols[9] || '';
        bankAcc = cols[10] || '';
        bankName = cols[11] || bankName;
        joinDate = cols[12] || joinDate;
      } else {
        salStr = cols[3] || salStr;
        respStr = cols[4] || '0';
        phone = cols[5] || '';
        email = cols[6] || '';
        cccd = cols[7] || '';
        bhxh = cols[8] || '';
        bankAcc = cols[9] || '';
        bankName = cols[10] || bankName;
        joinDate = cols[11] || joinDate;
      }
    }

    if (!fullName) return null;

    if (!code) {
      code = getNextSequentialCode(offsetIdx, currentRows);
    }

    // Match department
    let matchedDeptId = departments[0]?.id || '';
    if (deptNameOrId) {
      const searchD = deptNameOrId.toLowerCase();
      const foundDept = departments.find(
        (d) =>
          d.id === deptNameOrId ||
          d.name.toLowerCase().includes(searchD) ||
          d.code.toLowerCase() === searchD ||
          searchD.includes(d.name.toLowerCase())
      );
      if (foundDept) matchedDeptId = foundDept.id;
    }

    // Match position and rank
    if (!pos) pos = jobPositions[0]?.title || 'Chỉ huy trưởng';
    const matchedPos = jobPositions.find(
      (p) => p.title.toLowerCase() === pos.toLowerCase() || pos.toLowerCase().includes(p.title.toLowerCase())
    );
    if (matchedPos && matchedPos.rank) {
      rank = matchedPos.rank;
    }

    // Parse salary
    const cleanedSal = parseInt(salStr.replace(/[^0-9]/g, ''), 10) || 15000000;
    const cleanedResp = parseInt(respStr.replace(/[^0-9]/g, ''), 10) || 0;

    let parsedDate = joinDate;
    if (!parsedDate || !/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
      parsedDate = new Date().toISOString().split('T')[0];
    }

    return {
      id: `row-${Date.now()}-${offsetIdx}-${Math.random().toString(36).substr(2, 4)}`,
      code: code.toUpperCase(),
      fullName,
      departmentId: matchedDeptId,
      position: pos,
      positionRank: rank,
      salaryType: salType,
      negotiatedType: 'monthly',
      negotiatedSalary: cleanedSal,
      negotiatedDailyRate: Math.round(cleanedSal / 26),
      responsibilityAllowance: cleanedResp,
      phone,
      email,
      identityCard: cccd || '079' + Math.floor(100000000 + Math.random() * 900000000),
      socialInsuranceCode: bhxh || '792' + Math.floor(1000000 + Math.random() * 9000000),
      bankAccount: bankAcc || '190' + Math.floor(1000000000 + Math.random() * 9000000000),
      bankName: bankName || 'Techcombank - CN Sài Gòn',
      hometown: 'TP. Hồ Chí Minh',
      currentAddress: 'Quận 1, TP.HCM',
      joinDate: parsedDate,
      status,
      gradeId: grades[0]?.id || '',
      tierIndex: 1,
    };
  };

  // Check if a line is a header row
  const isHeaderRow = (cols: any[]): boolean => {
    const lineStr = cols.map((v) => String(v || '').toLowerCase()).join(' ');
    return (
      lineStr.includes('họ và tên') ||
      lineStr.includes('họ tên') ||
      lineStr.includes('ho va ten') ||
      lineStr.includes('mã nv') ||
      lineStr.includes('ma nv') ||
      lineStr.includes('phòng ban') ||
      lineStr.includes('chức vụ') ||
      lineStr.includes('full name') ||
      lineStr.includes('employee code') ||
      lineStr.includes('stt')
    );
  };

  // Process rows from 2D array (AOA)
  const processRowsFromAoa = (aoa: any[][]) => {
    if (!aoa || aoa.length === 0) return;
    let startIdx = 0;
    if (isHeaderRow(aoa[0])) {
      startIdx = 1;
    }

    const newRows: GridEmployeeRow[] = [];
    for (let i = startIdx; i < aoa.length; i++) {
      const parsed = parseRowCols(aoa[i], newRows.length, [...rows, ...newRows]);
      if (parsed) newRows.push(parsed);
    }

    if (newRows.length > 0) {
      setRows((prev) => [...prev, ...newRows]);
      setIsPasteAreaOpen(false);
      setPasteRawText('');
    }
  };

  // Clipboard paste parser (tab-separated \t and newlines \r\n or \n)
  const processPastedText = (text: string) => {
    if (!text.trim()) return;

    const lines = text
      .split(/\r\n|\n|\r/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const aoa = lines.map((l) => l.split('\t'));
    processRowsFromAoa(aoa);
  };

  // File upload handler (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          alert('File Excel không có trang tính nào hợp lệ!');
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        const rowsAoa = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rowsAoa && rowsAoa.length > 0) {
          processRowsFromAoa(rowsAoa);
        } else {
          alert('Bảng tính trong file Excel rỗng hoặc không có dữ liệu!');
        }
      } catch (err: any) {
        console.error('Lỗi đọc file Excel:', err);
        alert('Không thể đọc file Excel: ' + (err?.message || 'Vui lòng kiểm tra định dạng file!'));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const headers = [
        'STT',
        'Mã Nhân Viên',
        'Họ và Tên (*)',
        'Phòng Ban',
        'Chức Vụ',
        'Hạng CD (A/B/C/D)',
        'Hình Thức Lương',
        'Mức Lương Tháng (VNĐ)',
        'Phụ Cấp Trách Nhiệm (VNĐ)',
        'Số Điện Thoại',
        'Email',
        'Số CCCD / CMND',
        'Mã Số BHXH',
        'Số Tài Khoản Ngân Hàng',
        'Tên Ngân Hàng & Chi Nhánh',
        'Ngày Vào Làm (YYYY-MM-DD)',
        'Trạng Thái (Chính thức / Thử việc)',
      ];

      const sampleRows = [
        [
          1,
          getNextSequentialCode(0, []),
          'Nguyễn Văn Hoàng',
          departments[0]?.name || 'Ban Điều Hành & Dự Án',
          'Chỉ huy trưởng',
          'A',
          'Thỏa thuận',
          28000000,
          3000000,
          '0912345678',
          'hoang.nguyen@congtrinh.vn',
          '079090001234',
          '7921234567',
          '190345678901',
          'Techcombank - CN Sài Gòn',
          new Date().toISOString().split('T')[0],
          'Chính thức',
        ],
        [
          2,
          getNextSequentialCode(1, []),
          'Trần Thị Thu Thảo',
          departments[1]?.name || 'Phòng Kế Toán',
          'Kế toán tiền lương',
          'B',
          'Thỏa thuận',
          18000000,
          1000000,
          '0987654321',
          'thao.tran@congty.com',
          '079195005678',
          '7927654321',
          '0071000987654',
          'Vietcombank - CN Kỳ Đồng',
          new Date().toISOString().split('T')[0],
          'Chính thức',
        ],
        [
          3,
          getNextSequentialCode(2, []),
          'Lê Quốc Bảo',
          departments[0]?.name || 'Phòng Kỹ Thuật',
          'Kỹ sư hiện trường',
          'C',
          'Thỏa thuận',
          16500000,
          1500000,
          '0903112233',
          'bao.le@xaydung.vn',
          '079201009876',
          '7923344556',
          '102874659201',
          'VietinBank - CN Chợ Lớn',
          new Date().toISOString().split('T')[0],
          'Chính thức',
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 24 },
        { wch: 22 },
        { wch: 22 },
        { wch: 14 },
        { wch: 18 },
        { wch: 22 },
        { wch: 24 },
        { wch: 15 },
        { wch: 26 },
        { wch: 16 },
        { wch: 14 },
        { wch: 18 },
        { wch: 25 },
        { wch: 15 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhan_Su');
      XLSX.writeFile(wb, 'Mau_Nhap_Lieu_Nhan_Su_Grid.xlsx');
    } catch (err: any) {
      console.error('Lỗi tải file mẫu:', err);
      alert('Có lỗi xảy ra khi tạo file mẫu Excel: ' + (err?.message || ''));
    }
  };

  // Global paste handler on the table container
  const handleTableContainerPaste = (e: React.ClipboardEvent) => {
    // Only intercept if multi-line or tab-separated text is pasted
    const clipboardData = e.clipboardData.getData('text');
    if (clipboardData && (clipboardData.includes('\t') || clipboardData.includes('\n'))) {
      e.preventDefault();
      processPastedText(clipboardData);
    }
  };

  // Row validation calculation
  const validatedRows = useMemo(() => {
    const existingCodeSet = new Set(existingEmployees.map((e) => e.code.toLowerCase().trim()));
    const seenCodes = new Set<string>();

    return rows.map((r) => {
      const errors: string[] = [];
      const codeTrimmed = r.code.toLowerCase().trim();

      if (!r.fullName.trim()) {
        errors.push('Thiếu họ và tên');
      }
      if (!r.code.trim()) {
        errors.push('Thiếu mã nhân sự');
      } else {
        if (existingCodeSet.has(codeTrimmed)) {
          errors.push(`Mã ${r.code} đã tồn tại trên hệ thống`);
        }
        if (seenCodes.has(codeTrimmed)) {
          errors.push(`Mã ${r.code} bị trùng lặp trong bảng này`);
        }
        seenCodes.add(codeTrimmed);
      }

      return {
        ...r,
        isValid: errors.length === 0,
        errors,
        isCompletelyBlank: !r.fullName.trim() && !r.phone && !r.email,
      };
    });
  }, [rows, existingEmployees]);

  // Count valid and ready to import rows (ignoring completely blank rows)
  const validRowsReady = validatedRows.filter((r) => r.isValid && !r.isCompletelyBlank);
  const invalidRowsCount = validatedRows.filter((r) => !r.isValid && !r.isCompletelyBlank).length;

  // Final submit
  const handleSaveAll = () => {
    if (validRowsReady.length === 0) {
      alert('Không có dòng nhân sự hợp lệ nào để tạo. Vui lòng kiểm tra lại họ tên và mã nhân sự!');
      return;
    }

    // Default project allowances for each newly created employee
    const defaultProjectAllowances: Record<string, EmployeeProjectAllowance> = {};
    projects.forEach((p) => {
      defaultProjectAllowances[p.id] = {
        projectId: p.id,
        assigned: false,
        hasCompanyVehicle: false,
        hasFuelAllowance: true,
        hasMealAllowance: true,
      };
    });

    const employeesToCreate: Omit<Employee, 'id'>[] = validRowsReady.map((r) => {
      const targetGrade = grades.find((g) => g.id === r.gradeId) || grades[0];
      return {
        code: r.code.trim().toUpperCase(),
        fullName: r.fullName.trim(),
        departmentId: r.departmentId || departments[0]?.id || '',
        position: r.position.trim() || 'Nhân viên',
        positionRank: r.positionRank || 'C',
        gradeId: r.gradeId || targetGrade?.id || '',
        tierIndex: r.tierIndex || 1,
        salaryType: r.salaryType || 'negotiated',
        negotiatedType: r.negotiatedType || 'monthly',
        negotiatedSalary: r.negotiatedSalary || 15000000,
        negotiatedDailyRate: r.negotiatedDailyRate || Math.round((r.negotiatedSalary || 15000000) / 26),
        responsibilityAllowance: r.responsibilityAllowance || 0,
        email: r.email.trim(),
        phone: r.phone.trim(),
        identityCard: r.identityCard.trim(),
        socialInsuranceCode: r.socialInsuranceCode.trim(),
        bankAccount: r.bankAccount.trim(),
        bankName: r.bankName.trim() || 'Techcombank - CN Sài Gòn',
        hometown: r.hometown.trim() || 'TP. Hồ Chí Minh',
        currentAddress: r.currentAddress.trim() || 'Quận 1, TP.HCM',
        joinDate: r.joinDate || new Date().toISOString().split('T')[0],
        status: r.status || 'active',
        dependentsCount: 0,
        projectAllowances: defaultProjectAllowances,
      };
    });

    onSaveBatch(employeesToCreate);
    setRows([]);
    onClose();
  };

  // Filtered rows for viewing inside grid if searching
  const displayRows = validatedRows.filter(
    (r) =>
      !searchTerm ||
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-[97vw] h-[94vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-[#1E3A8A] rounded-xl shadow-2xs">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Nhập Liệu Nhân Sự Hàng Loạt (Bảng Tính Excel Grid)
                </h2>
                <span className="text-[11px] bg-blue-100 text-blue-900 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  Bulk Creation
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập nhanh danh sách nhân sự trên ô bảng tính, sao chép & dán trực tiếp từ Excel / Google Sheets (`Ctrl+V`), hoặc tải dữ liệu mẫu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500">Tổng dòng:</span>
              <span className="font-bold text-slate-800">{rows.length}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {validRowsReady.length} hợp lệ
              </span>
              {invalidRowsCount > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    {invalidRowsCount} cần sửa
                  </span>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleAddRows(1)}
              className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Thêm 1 dòng trống mới vào bảng tính"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm 1 dòng</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddRows(5)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Thêm 5 dòng trống mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm 5 dòng</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Tải lên danh sách nhân sự từ tệp Excel (.xlsx, .xls, .csv)"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Tải file Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải file mẫu Excel chuẩn để điền dữ liệu"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Tải file mẫu (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPasteAreaOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Dán dữ liệu được sao chép từ file Excel hoặc Google Sheets"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Dán từ Excel / Sheets</span>
            </button>

            <button
              type="button"
              onClick={handleFillSampleData}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Điền tự động 3 nhân sự mẫu để trải nghiệm tạo nhanh"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Điền dữ liệu mẫu</span>
            </button>

            <button
              type="button"
              onClick={handleCleanEmptyRows}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Lọc bỏ các dòng chưa nhập họ tên"
            >
              <Eraser className="w-3.5 h-3.5 text-slate-500" />
              <span>Xóa dòng trống</span>
            </button>

            {rows.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Xóa trắng bảng tính"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Lọc nhanh dòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500 w-36 sm:w-48"
            />
          </div>
        </div>

        {/* Quick Paste Modal Sub-Panel */}
        {isPasteAreaOpen && (
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 animate-in fade-in duration-100">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <ClipboardPaste className="w-4 h-4 text-emerald-700" />
                  Dán Dữ Liệu Từ Excel / Google Sheets
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Sao chép các dòng trong Excel (bôi đen các cột: Mã NV, Họ tên, Phòng ban, Chức vụ, Mức lương...) rồi dán (`Ctrl+V`) vào ô bên dưới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteAreaOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={4}
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
              placeholder="Dán (Ctrl+V) dữ liệu các cột từ Excel vào đây...&#10;VD: NV-015	Lê Quốc Bảo	Kỹ thuật	Kỹ sư hiện trường	16500000	0903112233"
              className="w-full p-2.5 text-xs font-mono bg-white border border-emerald-300 rounded-lg focus:outline-emerald-600 focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsPasteAreaOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => processPastedText(pasteRawText)}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Nhận diện & Chèn vào bảng</span>
              </button>
            </div>
          </div>
        )}

        {/* Spreadsheet Table Container */}
        <div
          onPaste={handleTableContainerPaste}
          className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-3 relative select-none"
        >
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xs inline-block min-w-full">
            <table className="text-xs text-left border-collapse w-full">
              <thead>
                <tr className="bg-slate-200 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-20 shadow-2xs">
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300 bg-slate-200">#</th>
                  <th className="py-2 px-2.5 w-28 border-r border-slate-300">
                    Mã NV <span className="text-rose-500">*</span>
                  </th>
                  <th className="py-2 px-3 w-48 border-r border-slate-300">
                    Họ và Tên <span className="text-rose-500">*</span>
                  </th>
                  <th className="py-2 px-2.5 w-44 border-r border-slate-300">Phòng ban</th>
                  <th className="py-2 px-2.5 w-40 border-r border-slate-300">Chức vụ / Vị trí</th>
                  <th className="py-2 px-2 text-center w-24 border-r border-slate-300" title="Hạng chức danh áp dụng phụ cấp công tác phí (A/B/C/D)">
                    Hạng CD
                  </th>
                  <th className="py-2 px-2.5 w-36 border-r border-slate-300">Hình thức lương</th>
                  <th className="py-2 px-2.5 w-44 border-r border-slate-300 text-right">Lương tháng / Bậc</th>
                  <th className="py-2 px-2.5 w-32 border-r border-slate-300 text-right">PC Trách nhiệm</th>
                  <th className="py-2 px-2.5 w-32 border-r border-slate-300">Số điện thoại</th>
                  <th className="py-2 px-2.5 w-40 border-r border-slate-300">Email</th>
                  <th className="py-2 px-2.5 w-32 border-r border-slate-300">Số CCCD</th>
                  <th className="py-2 px-2.5 w-32 border-r border-slate-300">Mã số BHXH</th>
                  <th className="py-2 px-2.5 w-36 border-r border-slate-300">STK Ngân hàng</th>
                  <th className="py-2 px-2.5 w-36 border-r border-slate-300">Ngân hàng</th>
                  <th className="py-2 px-2.5 w-32 border-r border-slate-300">Ngày vào làm</th>
                  <th className="py-2 px-2.5 w-28 border-r border-slate-300">Trạng thái</th>
                  <th className="py-2 px-2 text-center w-16">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-12 text-center text-slate-400">
                      Chưa có dòng nào. Nhấn "+ Thêm 1 dòng" hoặc "Dán từ Excel" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row, idx) => {
                    const rowNumber = idx + 1;
                    const hasError = !row.isValid && !row.isCompletelyBlank;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          hasError ? 'bg-rose-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        {/* Row Index with status */}
                        <td className="py-1 px-1.5 text-center font-mono text-[11px] text-slate-500 border-r border-slate-200 bg-slate-100/60 sticky left-0 z-10">
                          <div className="flex items-center justify-center gap-1">
                            <span>{rowNumber}</span>
                            {row.isCompletelyBlank ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" title="Dòng trống" />
                            ) : row.isValid ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Hợp lệ" />
                            ) : (
                              <span
                                className="w-2 h-2 rounded-full bg-rose-500"
                                title={row.errors.join(', ')}
                              />
                            )}
                          </div>
                        </td>

                        {/* Code */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.code}
                            onChange={(e) => handleCellChange(row.id, 'code', e.target.value)}
                            className={`w-full px-2 py-1.5 text-xs font-mono font-bold focus:outline-blue-600 bg-transparent ${
                              row.errors.some((err) => err.includes('mã') || err.includes('Mã'))
                                ? 'text-rose-700 bg-rose-100/50'
                                : 'text-slate-800'
                            }`}
                            placeholder="NV-001"
                          />
                        </td>

                        {/* Full Name */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.fullName}
                            onChange={(e) => handleCellChange(row.id, 'fullName', e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs font-semibold focus:outline-blue-600 bg-transparent ${
                              !row.fullName.trim() && !row.isCompletelyBlank
                                ? 'bg-rose-100/60 text-rose-800'
                                : 'text-slate-900'
                            }`}
                            placeholder="Nhập họ và tên..."
                          />
                        </td>

                        {/* Department */}
                        <td className="p-0 border-r border-slate-200">
                          <select
                            value={row.departmentId}
                            onChange={(e) => handleCellChange(row.id, 'departmentId', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs focus:outline-blue-600 bg-transparent text-slate-800 font-medium"
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Position */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            list={`pos-list-${row.id}`}
                            value={row.position}
                            onChange={(e) => handleCellChange(row.id, 'position', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs focus:outline-blue-600 bg-transparent text-slate-800"
                            placeholder="Chỉ huy trưởng..."
                          />
                          <datalist id={`pos-list-${row.id}`}>
                            {jobPositions.map((p) => (
                              <option key={p.id} value={p.title} />
                            ))}
                          </datalist>
                        </td>

                        {/* Position Rank */}
                        <td className="p-0 border-r border-slate-200 text-center">
                          <select
                            value={row.positionRank}
                            onChange={(e) => handleCellChange(row.id, 'positionRank', e.target.value)}
                            className="w-full px-1.5 py-1.5 text-xs text-center font-bold text-blue-900 focus:outline-blue-600 bg-transparent"
                          >
                            <option value="A">Cấp A</option>
                            <option value="B">Cấp B</option>
                            <option value="C">Cấp C</option>
                            <option value="D">Cấp D</option>
                          </select>
                        </td>

                        {/* Salary Type */}
                        <td className="p-0 border-r border-slate-200">
                          <select
                            value={row.salaryType}
                            onChange={(e) => handleCellChange(row.id, 'salaryType', e.target.value as any)}
                            className="w-full px-2 py-1.5 text-xs focus:outline-blue-600 bg-transparent text-slate-800"
                          >
                            <option value="negotiated">Thỏa thuận tháng</option>
                            <option value="scale">Theo thang 8 bậc</option>
                          </select>
                        </td>

                        {/* Monthly Salary */}
                        <td className="p-0 border-r border-slate-200">
                          {row.salaryType === 'scale' ? (
                            <div className="flex items-center gap-1 px-1.5 py-1">
                              <select
                                value={row.gradeId || grades[0]?.id || ''}
                                onChange={(e) => {
                                  const nextGId = e.target.value;
                                  const g = grades.find((gr) => gr.id === nextGId) || grades[0];
                                  const coeff = g?.coefficients[(row.tierIndex || 1) - 1] || 1;
                                  const sal = Math.round((g?.standardBaseRate || 5000000) * coeff);
                                  handleCellChange(row.id, 'gradeId', nextGId);
                                  handleCellChange(row.id, 'negotiatedSalary', sal);
                                }}
                                className="text-[11px] border border-slate-200 rounded px-1 py-1 bg-white max-w-[105px] truncate font-medium"
                                title="Chọn ngạch lương"
                              >
                                {grades.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={row.tierIndex || 1}
                                onChange={(e) => {
                                  const nextTier = parseInt(e.target.value, 10);
                                  const g = grades.find((gr) => gr.id === (row.gradeId || grades[0]?.id)) || grades[0];
                                  const coeff = g?.coefficients[nextTier - 1] || 1;
                                  const sal = Math.round((g?.standardBaseRate || 5000000) * coeff);
                                  handleCellChange(row.id, 'tierIndex', nextTier);
                                  handleCellChange(row.id, 'negotiatedSalary', sal);
                                }}
                                className="text-[11px] font-mono border border-slate-200 rounded px-1 py-1 bg-white font-bold text-blue-900"
                                title="Chọn bậc lương 1-8"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
                                  <option key={t} value={t}>
                                    B{t}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <input
                              type="number"
                              step={500000}
                              value={row.negotiatedSalary}
                              onChange={(e) =>
                                handleCellChange(row.id, 'negotiatedSalary', parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full px-2 py-1.5 text-xs font-mono font-semibold text-right focus:outline-blue-600 bg-transparent text-slate-900"
                              placeholder="15000000"
                            />
                          )}
                        </td>

                        {/* Responsibility Allowance */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="number"
                            step={100000}
                            value={row.responsibilityAllowance}
                            onChange={(e) =>
                              handleCellChange(row.id, 'responsibilityAllowance', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full px-2 py-1.5 text-xs font-mono text-right focus:outline-blue-600 bg-transparent text-slate-800"
                          />
                        </td>

                        {/* Phone */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.phone}
                            onChange={(e) => handleCellChange(row.id, 'phone', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-mono focus:outline-blue-600 bg-transparent text-slate-800"
                            placeholder="09..."
                          />
                        </td>

                        {/* Email */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="email"
                            value={row.email}
                            onChange={(e) => handleCellChange(row.id, 'email', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs focus:outline-blue-600 bg-transparent text-slate-800"
                            placeholder="email@..."
                          />
                        </td>

                        {/* CCCD */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.identityCard}
                            onChange={(e) => handleCellChange(row.id, 'identityCard', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-mono focus:outline-blue-600 bg-transparent text-slate-800"
                          />
                        </td>

                        {/* BHXH */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.socialInsuranceCode}
                            onChange={(e) => handleCellChange(row.id, 'socialInsuranceCode', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-mono focus:outline-blue-600 bg-transparent text-slate-800"
                          />
                        </td>

                        {/* Bank Account */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.bankAccount}
                            onChange={(e) => handleCellChange(row.id, 'bankAccount', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-mono focus:outline-blue-600 bg-transparent text-slate-800"
                          />
                        </td>

                        {/* Bank Name */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.bankName}
                            onChange={(e) => handleCellChange(row.id, 'bankName', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs focus:outline-blue-600 bg-transparent text-slate-800"
                          />
                        </td>

                        {/* Join Date */}
                        <td className="p-0 border-r border-slate-200">
                          <input
                            type="date"
                            value={row.joinDate}
                            onChange={(e) => handleCellChange(row.id, 'joinDate', e.target.value)}
                            className="w-full px-1.5 py-1.5 text-xs font-mono focus:outline-blue-600 bg-transparent text-slate-800"
                          />
                        </td>

                        {/* Status */}
                        <td className="p-0 border-r border-slate-200">
                          <select
                            value={row.status}
                            onChange={(e) => handleCellChange(row.id, 'status', e.target.value as any)}
                            className="w-full px-1.5 py-1.5 text-xs font-semibold focus:outline-blue-600 bg-transparent text-slate-800"
                          >
                            <option value="active">Chính thức</option>
                            <option value="probation">Thử việc</option>
                          </select>
                        </td>

                        {/* Delete Action */}
                        <td className="py-1 px-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(row)}
                              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                              title="Nhân bản dòng này"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                              title="Xóa dòng này"
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

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Hệ thống sẽ tự động khởi tạo Hồ sơ bảo hiểm (BHXH), Bảng chấm công tháng, và Hợp đồng lao động mẫu tương ứng cho tất cả nhân sự mới được tạo.
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={validRowsReady.length === 0}
              className="px-5 py-2 text-xs bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tạo Hàng Loạt ({validRowsReady.length} Nhân Sự)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
