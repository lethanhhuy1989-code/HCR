import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useHRM } from '../context/HRMContext';
import { SalaryAdvanceRecord, Employee } from '../types/hrm';
import { formatVND, formatNumberVN } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import {
  CreditCard,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  X,
  FileSpreadsheet,
  FileText,
  Upload,
  Image as ImageIcon,
  Paperclip,
  CheckCheck,
  Eye,
  AlertTriangle,
  FileCheck,
  Building,
  User,
  DollarSign,
  TrendingDown,
  ShieldAlert,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
  Receipt,
  Banknote,
  Send,
} from 'lucide-react';

export const SalaryAdvance: React.FC = () => {
  const {
    employees,
    departments,
    payrollItems,
    timesheets,
    advances,
    addAdvance,
    updateAdvanceStatus,
    deleteAdvance,
    currentMonth,
    showToast,
  } = useHRM();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'processed' | 'rejected'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [selectedAdvanceForDetail, setSelectedAdvanceForDetail] = useState<SalaryAdvanceRecord | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);

  // Partial approval popover state
  const [partialApprovalState, setPartialApprovalState] = useState<{
    advanceId: string;
    amount: number;
    notes: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    amount: 2000000,
    reason: '',
    attachmentUrl: '',
    attachmentName: '',
    attachmentType: 'other' as 'image' | 'pdf' | 'excel' | 'other',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);

  // Month advances
  const monthAdvances = useMemo(() => {
    return advances.filter((a) => a.month === currentMonth);
  }, [advances, currentMonth]);

  // Total statistics
  const stats = useMemo(() => {
    let totalRequested = 0;
    let totalApproved = 0;
    let totalProcessed = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let processedCount = 0;
    let rejectedCount = 0;

    monthAdvances.forEach((a) => {
      totalRequested += a.amount;
      const actualAmt = a.approvedAmount !== undefined ? a.approvedAmount : a.amount;

      if (a.status === 'approved') {
        totalApproved += actualAmt;
        approvedCount++;
      } else if (a.status === 'processed') {
        totalProcessed += actualAmt;
        processedCount++;
      } else if (a.status === 'pending') {
        pendingCount++;
      } else if (a.status === 'rejected') {
        rejectedCount++;
      }
    });

    return {
      totalRequested,
      totalApproved,
      totalProcessed,
      totalGranted: totalApproved + totalProcessed,
      pendingCount,
      approvedCount,
      processedCount,
      rejectedCount,
      totalCount: monthAdvances.length,
    };
  }, [monthAdvances]);

  // Filtered advances
  const filteredAdvances = useMemo(() => {
    return monthAdvances.filter((adv) => {
      const emp = employees.find((e) => e.id === adv.employeeId);
      const matchSearch =
        (emp?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp?.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || adv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [monthAdvances, employees, searchTerm, statusFilter]);

  // Smart File Parser for Drag & Drop
  const handleProcessUploadedFile = (file: File) => {
    const fileName = file.name;
    const fileType = file.type;
    const lowerName = fileName.toLowerCase();

    // Check file category
    let category: 'image' | 'pdf' | 'excel' | 'other' = 'other';
    if (fileType.startsWith('image/') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      category = 'image';
    } else if (fileType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      category = 'pdf';
    } else if (
      fileType.includes('spreadsheet') ||
      fileType.includes('excel') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv')
    ) {
      category = 'excel';
    }

    // Read as Base64 for receipt preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;

      // Smart Extraction Logic
      let matchedEmpId = formData.employeeId || employees[0]?.id || '';
      let extractedAmount = formData.amount;
      let extractedReason = formData.reason || `Tạm ứng theo chứng từ đính kèm (${fileName})`;

      // 1. If Excel, parse table content using xlsx
      if (category === 'excel') {
        try {
          const binaryStr = atob(base64Url.split(',')[1] || '');
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

          // Scan cells for employee name/code and amounts
          let foundAmount = 0;
          let foundEmp: Employee | undefined;

          for (let r = 0; r < Math.min(jsonData.length, 30); r++) {
            const row = jsonData[r];
            if (!Array.isArray(row)) continue;

            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();

              // Search employee
              if (!foundEmp && val.length > 2) {
                const empMatch = employees.find(
                  (emp) =>
                    emp.fullName.toLowerCase().includes(val.toLowerCase()) ||
                    emp.code.toLowerCase() === val.toLowerCase()
                );
                if (empMatch) foundEmp = empMatch;
              }

              // Search amount (numbers between 500k and 100M)
              if (typeof row[c] === 'number' && row[c] >= 500000 && row[c] <= 100000000) {
                foundAmount = row[c];
              } else if (typeof row[c] === 'string') {
                const cleanNum = parseInt(val.replace(/[^0-9]/g, ''), 10);
                if (cleanNum >= 500000 && cleanNum <= 100000000) {
                  foundAmount = cleanNum;
                }
              }
            }
          }

          if (foundEmp) {
            matchedEmpId = foundEmp.id;
          }
          if (foundAmount > 0) {
            extractedAmount = foundAmount;
          }
          extractedReason = `Tạm ứng lương theo file Excel "${fileName}"`;
          setExtractionNote(
            `Đã tự động nhận diện từ Excel: ${foundEmp ? foundEmp.fullName : 'Chưa rõ nhân viên'} | Số tiền: ${formatNumberVN(extractedAmount)} đ`
          );
        } catch {
          setExtractionNote(`Đã đính kèm file Excel: ${fileName}`);
        }
      } else {
        // Image or PDF: Parse filename
        // E.g. "Tam_ung_Nguyen_Van_A_3000000.jpg"
        const numbersInName = fileName.match(/\d{6,9}/);
        if (numbersInName) {
          const parsedNum = parseInt(numbersInName[0], 10);
          if (parsedNum >= 500000 && parsedNum <= 100000000) {
            extractedAmount = parsedNum;
          }
        }

        const foundEmpByName = employees.find((emp) =>
          fileName.toLowerCase().replace(/_/g, ' ').includes(emp.fullName.toLowerCase())
        );
        if (foundEmpByName) {
          matchedEmpId = foundEmpByName.id;
        }

        setExtractionNote(
          `Đã đính kèm chứng từ: ${fileName} (${(file.size / 1024).toFixed(1)} KB)`
        );
      }

      setFormData((prev) => ({
        ...prev,
        employeeId: matchedEmpId,
        amount: extractedAmount,
        reason: extractedReason,
        attachmentUrl: base64Url,
        attachmentName: fileName,
        attachmentType: category,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showToast('Vui lòng nhập lý do tạm ứng', 'error');
      return;
    }
    if (formData.amount <= 0) {
      showToast('Số tiền tạm ứng phải lớn hơn 0', 'error');
      return;
    }

    addAdvance({
      employeeId: formData.employeeId,
      month: currentMonth,
      requestDate: new Date().toISOString().split('T')[0],
      amount: formData.amount,
      reason: formData.reason,
      status: 'pending',
      attachmentUrl: formData.attachmentUrl || undefined,
      attachmentName: formData.attachmentName || undefined,
      attachmentType: formData.attachmentType,
    });

    setIsModalOpen(false);
    setExtractionNote(null);
    setFormData({
      employeeId: employees[0]?.id || '',
      amount: 2000000,
      reason: '',
      attachmentUrl: '',
      attachmentName: '',
      attachmentType: 'other',
    });
  };

  // Helper to get employee insight details (Payroll accumulated, debt, safe limit)
  const getEmployeeInsight = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    const pItem = payrollItems.find((p) => p.employeeId === empId);
    const ts = timesheets.find((t) => t.employeeId === empId && t.month === currentMonth);
    const empMonthAdvances = monthAdvances.filter((a) => a.employeeId === empId);

    const totalProcessed = empMonthAdvances
      .filter((a) => a.status === 'processed')
      .reduce((sum, a) => sum + (a.approvedAmount !== undefined ? a.approvedAmount : a.amount), 0);

    const totalApproved = empMonthAdvances
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + (a.approvedAmount !== undefined ? a.approvedAmount : a.amount), 0);

    const totalPending = empMonthAdvances
      .filter((a) => a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);

    // Estimated current accumulated salary (Lương tích lũy tới thời điểm hiện tại)
    const baseSal = pItem?.actualBaseSalary || pItem?.baseSalaryRate || 10000000;
    const grossEst = pItem?.grossIncome || baseSal;
    const actualDays = ts?.actualWorkingDays || 22;
    const standardDays = ts?.standardWorkingDays || 26;

    // Remaining safe advance limit (Hạn mức tạm ứng tối đa an toàn = 70% Gross ước tính - đã chi - đã duyệt)
    const maxSafeCap = Math.round(grossEst * 0.7);
    const remainingSafeLimit = Math.max(0, maxSafeCap - totalProcessed - totalApproved);

    // Debt ratio
    const debtRatio = grossEst > 0 ? Math.min(100, Math.round(((totalProcessed + totalApproved) / grossEst) * 100)) : 0;

    return {
      employee: emp,
      payrollItem: pItem,
      timesheet: ts,
      actualDays,
      standardDays,
      grossEst,
      totalProcessed,
      totalApproved,
      totalPending,
      totalGranted: totalProcessed + totalApproved,
      maxSafeCap,
      remainingSafeLimit,
      debtRatio,
      historyAdvances: empMonthAdvances,
    };
  };

  // Open detail insight for an employee
  const handleOpenEmployeeDetail = (empId: string, advance?: SalaryAdvanceRecord) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setSelectedEmployeeForDetail(emp);
      setSelectedAdvanceForDetail(advance || null);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã Phiếu',
      'Mã NV',
      'Họ và Tên',
      'Phòng Ban',
      'Chức Vụ',
      'STK Ngân Hàng',
      'Số Tiền Đề Nghị (VNĐ)',
      'Số Tiền Duyệt Chi (VNĐ)',
      'Ngày Đề Nghị',
      'Lý Do Tạm Ứng',
      'Trạng Thái',
      'Ngày Phê Duyệt',
      'Người Duyệt',
      'Ngày Chi Tiền',
      'Người Chi Tiền',
      'Chứng Từ Đính Kèm',
    ];

    const rows = filteredAdvances.map((adv, idx) => {
      const emp = employees.find((e) => e.id === adv.employeeId);
      const dept = departments.find((d) => d.id === emp?.departmentId);
      const actualAmt = adv.approvedAmount !== undefined ? adv.approvedAmount : adv.amount;

      let statusText = 'Chờ duyệt';
      if (adv.status === 'approved') statusText = 'Đã duyệt';
      else if (adv.status === 'processed') statusText = 'Đã xử lý (Đã chi tiền)';
      else if (adv.status === 'rejected') statusText = 'Từ chối';

      return [
        idx + 1,
        adv.code,
        emp?.code || '',
        emp?.fullName || '',
        dept?.name || '',
        emp?.position || '',
        emp?.bankAccount || '',
        adv.amount,
        actualAmt,
        adv.requestDate,
        adv.reason,
        statusText,
        adv.approvedDate || '',
        adv.approvedBy || '',
        adv.processedDate || '',
        adv.processedBy || '',
        adv.attachmentName || 'Không có',
      ];
    });

    exportToExcel({
      fileName: `Danh_Sach_Tam_Ung_Luong_Thang_${currentMonth}.xlsx`,
      sheetName: 'TamUngLuong',
      title: `BẢNG TỔNG HỢP THEO DÕI TẠM ỨNG LƯƠNG - KỲ THÁNG ${currentMonth}`,
      subtitles: [
        'Công ty Cổ phần Xây dựng | Phân hệ Tài chính - Tiền lương HRM',
        `Kỳ tạm ứng: Tháng ${currentMonth} | Tổng đã duyệt & chi: ${formatVND(stats.totalGranted)} | Tổng phiếu: ${filteredAdvances.length}`,
      ],
      headers,
      rows,
    });
    showToast('Đã xuất danh sách tạm ứng lương ra file Excel (.xlsx) thành công!');
  };

  // Export to PDF (.pdf)
  const handleExportPDF = () => {
    const headers = [
      'STT',
      'Mã Phiếu',
      'Mã NV',
      'Họ và Tên',
      'Phòng Ban',
      'Đề Nghị (đ)',
      'Duyệt Chi (đ)',
      'Ngày Đề Nghị',
      'Trạng Thái',
      'Ngày Chi',
    ];

    const rows = filteredAdvances.map((adv, idx) => {
      const emp = employees.find((e) => e.id === adv.employeeId);
      const dept = departments.find((d) => d.id === emp?.departmentId);
      const actualAmt = adv.approvedAmount !== undefined ? adv.approvedAmount : adv.amount;

      let statusText = 'Chờ duyệt';
      if (adv.status === 'approved') statusText = 'Đã duyệt';
      else if (adv.status === 'processed') statusText = 'Đã chi';
      else if (adv.status === 'rejected') statusText = 'Từ chối';

      return [
        idx + 1,
        adv.code,
        emp?.code || '',
        emp?.fullName || '',
        dept?.name || '',
        formatNumberVN(adv.amount),
        formatNumberVN(actualAmt),
        adv.requestDate,
        statusText,
        adv.processedDate || '-',
      ];
    });

    exportToPDF({
      fileName: `Bang_Ke_Tam_Ung_Thang_${currentMonth}.pdf`,
      title: `BANG TONG HOP TAM UNG TIEN LUONG - THANG ${currentMonth}`,
      subtitles: [
        `Ky luong: ${currentMonth} | Tong nhan su tam ung: ${filteredAdvances.length} | Tong tien da xu ly: ${formatVND(stats.totalProcessed)}`,
      ],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất bảng tổng hợp tạm ứng lương ra file PDF thành công!');
  };

  // Execute Partial Approval
  const handleConfirmPartialApproval = () => {
    if (!partialApprovalState) return;
    const { advanceId, amount, notes } = partialApprovalState;

    updateAdvanceStatus(advanceId, 'approved', {
      approvedAmount: amount,
      notes: notes || undefined,
      approvedBy: 'Lê Thanh Huy (GĐ)',
    });

    setPartialApprovalState(null);
  };

  // Active insight employee data
  const currentInsight = selectedEmployeeForDetail
    ? getEmployeeInsight(selectedEmployeeForDetail.id)
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Top Banner & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-[#1E3A8A] rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Quản Lý Tạm Ứng Lương & Phê Duyệt Chi Tiền
                <span className="text-[11px] bg-blue-100 text-blue-900 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  Kỳ {currentMonth}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý đề nghị tạm ứng, kéo thả chứng từ hóa đơn, kiểm tra hạn mức lương còn nợ, duyệt chi một phần và xác nhận đã xử lý chi tiền.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Xuất bảng kê chi tiết tạm ứng ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Xuất phiếu tổng hợp tạm ứng ra file PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Xuất PDF (.pdf)</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo đề nghị tạm ứng</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Đã xử lý (Đã chi tiền)</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {formatNumberVN(stats.totalProcessed)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>{stats.processedCount} phiếu đã chi</span>
            <span className="text-emerald-700 font-semibold">Khấu trừ lương kỳ này</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Đã duyệt (Chờ kế toán chi)</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {formatNumberVN(stats.totalApproved)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>{stats.approvedCount} phiếu chờ chi</span>
            <span className="text-blue-700 font-semibold">Đã được GĐ duyệt</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yêu cầu chờ phê duyệt</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {stats.pendingCount} đề nghị
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Cần duyệt xét duyệt</span>
            <span className="text-amber-700 font-semibold">Duyệt 1 phần / Toàn bộ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tổng nhu cầu đề xuất</span>
            <TrendingDown className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {formatNumberVN(stats.totalRequested)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Tổng số {stats.totalCount} phiếu</span>
            <span>Tháng {currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Quick Drag & Drop Box at Top */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (fileInputRef.current) fileInputRef.current.click();
        }}
        className={`mb-5 p-3.5 border-2 border-dashed rounded-lg transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDragging
            ? 'border-blue-600 bg-blue-50/80 scale-[1.005]'
            : 'border-slate-300 bg-slate-50/60 hover:bg-blue-50/30 hover:border-blue-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleProcessUploadedFile(e.target.files[0]);
              setIsModalOpen(true);
            }
          }}
        />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Kéo thả hình chụp chứng từ tạm ứng, file Excel (.xlsx), hoặc PDF vào đây</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-full">
                Tự động lấy dữ liệu
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Hệ thống tự động đọc tên nhân sự, số tiền tạm ứng, lý do và đính kèm phiếu chi tương ứng.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-800 bg-white px-3 py-1.5 rounded-md border border-blue-200 shadow-2xs hover:bg-blue-50">
            Chọn tệp từ máy tính
          </span>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tất cả ({monthAdvances.length})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ duyệt ({stats.pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Đã duyệt ({stats.approvedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('processed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'processed'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đã xử lý / Đã chi ({stats.processedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Từ chối ({stats.rejectedCount})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhân sự, mã phiếu, lý do..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500 w-56 sm:w-64"
          />
        </div>
      </div>

      {/* Main Advances Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3 w-28">Mã phiếu</th>
                <th className="py-3 px-4 w-52">Nhân sự đề nghị</th>
                <th className="py-3 px-3 w-28">Ngày đề nghị</th>
                <th className="py-3 px-3 text-right w-36">Đề nghị (VNĐ)</th>
                <th className="py-3 px-3 text-right w-36">Duyệt chi thực tế</th>
                <th className="py-3 px-4">Lý do & Chứng từ</th>
                <th className="py-3 px-3 text-center w-36">Trạng thái</th>
                <th className="py-3 px-3 text-center w-48">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy đề nghị tạm ứng lương nào trong kỳ {currentMonth}
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv, idx) => {
                  const emp = employees.find((e) => e.id === adv.employeeId);
                  const dept = departments.find((d) => d.id === emp?.departmentId);
                  const isPartial = adv.approvedAmount !== undefined && adv.approvedAmount !== adv.amount;
                  const actualApproved = adv.approvedAmount !== undefined ? adv.approvedAmount : adv.amount;

                  return (
                    <tr
                      key={adv.id}
                      onClick={() => handleOpenEmployeeDetail(adv.employeeId, adv)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-900 group-hover:underline">
                        {adv.code}
                      </td>

                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{emp?.fullName || 'Nhân sự'}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEmployeeDetail(adv.employeeId, adv);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-100"
                            title="Xem chi tiết lương & công nợ tạm ứng của nhân viên này"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 font-normal">
                          {emp?.code} · {emp?.position} ({dept?.name})
                        </div>
                      </td>

                      {/* Request Date */}
                      <td className="py-3 px-3 text-slate-600 font-mono">{adv.requestDate}</td>

                      {/* Requested Amount */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                        {formatNumberVN(adv.amount)} đ
                      </td>

                      {/* Approved Amount (Partial vs Full) */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {adv.status === 'approved' || adv.status === 'processed' ? (
                          <div>
                            <span className="text-emerald-700">{formatNumberVN(actualApproved)} đ</span>
                            {isPartial && (
                              <div className="text-[10px] text-amber-700 font-sans font-medium">
                                (Duyệt một phần)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Reason & Attachment */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 line-clamp-1">{adv.reason}</div>
                        {adv.attachmentName && (
                          <div className="mt-1 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (adv.attachmentUrl) {
                                  setPreviewAttachment({
                                    url: adv.attachmentUrl,
                                    name: adv.attachmentName || 'Chung_Tu',
                                    type: adv.attachmentType || 'other',
                                  });
                                }
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-medium hover:bg-blue-100"
                            >
                              <Paperclip className="w-3 h-3 text-blue-600" />
                              <span className="truncate max-w-[140px]">{adv.attachmentName}</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {adv.status === 'pending' && (
                          <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Chờ duyệt
                          </span>
                        )}
                        {adv.status === 'approved' && (
                          <div>
                            <span className="text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                              Đã duyệt
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Chờ chi tiền
                            </div>
                          </div>
                        )}
                        {adv.status === 'processed' && (
                          <div>
                            <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded font-bold border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Đã xử lý (Đã chi)
                            </span>
                            {adv.processedDate && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Ngày {adv.processedDate}
                              </div>
                            )}
                          </div>
                        )}
                        {adv.status === 'rejected' && (
                          <span className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-medium border border-rose-200 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Từ chối
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* BUTTON ĐÃ XỬ LÝ (Nút trọng tâm theo yêu cầu của user) */}
                          {adv.status !== 'processed' && adv.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => updateAdvanceStatus(adv.id, 'processed')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Xác nhận kế toán đã chi tiền / đã xử lý khoản tạm ứng này"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Đã xử lý</span>
                            </button>
                          )}

                          {/* Quick Approve or Partial Approve if pending */}
                          {adv.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateAdvanceStatus(adv.id, 'approved')}
                                className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                title="Duyệt toàn bộ số tiền đề nghị"
                              >
                                Duyệt đủ
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setPartialApprovalState({
                                    advanceId: adv.id,
                                    amount: Math.round(adv.amount * 0.7),
                                    notes: '',
                                  })
                                }
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                title="Duyệt chi một phần số tiền đề nghị"
                              >
                                Duyệt 1 phần
                              </button>

                              <button
                                type="button"
                                onClick={() => updateAdvanceStatus(adv.id, 'rejected')}
                                className="px-1.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                title="Từ chối đề nghị tạm ứng"
                              >
                                Từ chối
                              </button>
                            </>
                          )}

                          {adv.status === 'processed' && (
                            <button
                              type="button"
                              onClick={() => updateAdvanceStatus(adv.id, 'approved')}
                              className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                              title="Hoàn tác về trạng thái đã duyệt"
                            >
                              Hoàn tác
                            </button>
                          )}
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

      {/* MODAL 1: TẠO ĐỀ NGHỊ TẠM ỨNG & KÉO THẢ CHỨNG TỪ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-[#1E3A8A] rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tạo Đề Nghị Tạm Ứng Lương</h3>
                  <p className="text-[11px] text-slate-500">Kỳ tạm ứng: Tháng {currentMonth}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Dropzone inside form */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>Kéo thả chứng từ tạm ứng (Hóa đơn / Phiếu tạm ứng / Excel):</span>
                  <span className="text-[10px] text-blue-600 font-normal">Hỗ trợ .jpg, .png, .pdf, .xlsx</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                    isDragging ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/50'
                  }`}
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <div className="font-semibold text-slate-700">Kéo thả file hình hoặc Excel vào đây</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Hệ thống sẽ tự nhận diện họ tên & số tiền</div>
                  <input
                    type="file"
                    accept="image/*,.pdf,.xlsx,.xls,.csv"
                    className="hidden"
                    id="modal-file-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessUploadedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor="modal-file-upload"
                    className="inline-block mt-2 px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer font-medium text-[11px]"
                  >
                    Tải file lên
                  </label>
                </div>

                {extractionNote && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{extractionNote}</span>
                  </div>
                )}
              </div>

              {/* Employee selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nhân viên đề nghị tạm ứng: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-900 focus:outline-blue-600"
                >
                  {employees.map((e) => {
                    const dept = departments.find((d) => d.id === e.departmentId);
                    return (
                      <option key={e.id} value={e.id}>
                        {e.code} - {e.fullName} ({e.position} · {dept?.name || ''})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>Số tiền muốn tạm ứng (VNĐ): <span className="text-rose-500">*</span></span>
                  <span className="font-mono text-emerald-700 font-bold">{formatVND(formData.amount)}</span>
                </label>
                <input
                  type="number"
                  step="500000"
                  min="500000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:outline-blue-600"
                  required
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[1000000, 2000000, 3000000, 5000000, 10000000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setFormData({ ...formData, amount: amt })}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded font-mono text-[10px] border border-slate-200"
                    >
                      {formatNumberVN(amt)} đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Lý do tạm ứng: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-600"
                  placeholder="Ghi rõ lý do tạm ứng công tác phí, việc gia đình đột xuất..."
                  required
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Đề Nghị Tạm Ứng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DUYỆT CHI MỘT PHẦN TIỀN TẠM ỨNG (Partial Approval Popover) */}
      {partialApprovalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-600" />
                Duyệt Chi Một Phần Tiền Tạm Ứng
              </h3>
              <button
                type="button"
                onClick={() => setPartialApprovalState(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Nhân sự đề nghị mức tạm ứng ban đầu. Bạn có thể duyệt chi một phần ngân sách phù hợp với ngày công và công nợ thực tế.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số tiền duyệt chi thực tế (VNĐ):
              </label>
              <input
                type="number"
                step="200000"
                min="100000"
                value={partialApprovalState.amount}
                onChange={(e) =>
                  setPartialApprovalState({
                    ...partialApprovalState,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:outline-emerald-600"
              />
              <div className="text-[11px] font-mono text-emerald-700 font-bold mt-1 text-right">
                {formatVND(partialApprovalState.amount)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú phê duyệt của Ban Giám Đốc / Trưởng phòng:
              </label>
              <input
                type="text"
                value={partialApprovalState.notes}
                onChange={(e) =>
                  setPartialApprovalState({
                    ...partialApprovalState,
                    notes: e.target.value,
                  })
                }
                placeholder="VD: Duyệt chi 70% theo định mức công tác phí đợt 1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setPartialApprovalState(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmPartialApproval}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Xác nhận Duyệt {formatNumberVN(partialApprovalState.amount)} đ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 3: CHI TIẾT LƯƠNG & CÔNG NỢ KHI CHỌN VÀO NHÂN VIÊN */}
      {selectedEmployeeForDetail && currentInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  {selectedEmployeeForDetail.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    {selectedEmployeeForDetail.fullName}
                    <span className="text-[11px] bg-blue-800 text-blue-200 font-mono px-2 py-0.5 rounded">
                      {selectedEmployeeForDetail.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedEmployeeForDetail.position} · {departments.find((d) => d.id === selectedEmployeeForDetail.departmentId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployeeForDetail(null);
                  setSelectedAdvanceForDetail(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Payroll & Debt Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-500 font-medium">Lương ước tính kỳ {currentMonth}</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {formatNumberVN(currentInsight.grossEst)} đ
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Đã chấm: {currentInsight.actualDays}/{currentInsight.standardDays} công
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] text-emerald-800 font-medium">Đã chi tiền (Đã xử lý)</div>
                  <div className="text-sm font-bold font-mono text-emerald-700 mt-1">
                    {formatNumberVN(currentInsight.totalProcessed)} đ
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Khấu trừ lương</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[11px] text-amber-800 font-medium">Đang chờ duyệt</div>
                  <div className="text-sm font-bold font-mono text-amber-700 mt-1">
                    {formatNumberVN(currentInsight.totalPending)} đ
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Chưa duyệt chi</div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-[11px] text-blue-800 font-medium">Hạn mức tạm ứng an toàn</div>
                  <div className="text-sm font-bold font-mono text-blue-700 mt-1">
                    {formatNumberVN(currentInsight.remainingSafeLimit)} đ
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Tối đa 70% lương</div>
                </div>
              </div>

              {/* Debt Gauge Progress */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Tỷ lệ dư nợ tạm ứng so với tổng lương tháng:
                  </span>
                  <span className={`font-mono font-bold ${currentInsight.debtRatio > 70 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {currentInsight.debtRatio}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentInsight.debtRatio > 70
                        ? 'bg-rose-500'
                        : currentInsight.debtRatio > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, currentInsight.debtRatio)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentInsight.debtRatio > 70
                    ? 'Cảnh báo: Nhân sự này đã tạm ứng vượt 70% lương ước tính. Cân nhắc duyệt chi một phần.'
                    : 'Mức dư nợ trong ngưỡng an toàn cho phép.'}
                </div>
              </div>

              {/* History of Advances in current month */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                  Danh Sách Phiếu Tạm Ứng Trong Tháng Của {selectedEmployeeForDetail.fullName}:
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Mã phiếu</th>
                        <th className="p-2">Ngày</th>
                        <th className="p-2 text-right">Đề nghị</th>
                        <th className="p-2 text-right">Duyệt chi</th>
                        <th className="p-2">Trạng thái</th>
                        <th className="p-2 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentInsight.historyAdvances.map((hAdv) => (
                        <tr key={hAdv.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-900">{hAdv.code}</td>
                          <td className="p-2 font-mono text-slate-500">{hAdv.requestDate}</td>
                          <td className="p-2 text-right font-mono">{formatNumberVN(hAdv.amount)} đ</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">
                            {formatNumberVN(hAdv.approvedAmount !== undefined ? hAdv.approvedAmount : hAdv.amount)} đ
                          </td>
                          <td className="p-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                hAdv.status === 'processed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : hAdv.status === 'approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : hAdv.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {hAdv.status === 'processed'
                                ? 'Đã chi tiền'
                                : hAdv.status === 'approved'
                                ? 'Đã duyệt'
                                : hAdv.status === 'pending'
                                ? 'Chờ duyệt'
                                : 'Từ chối'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {hAdv.status !== 'processed' && hAdv.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => updateAdvanceStatus(hAdv.id, 'processed')}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold"
                              >
                                Chi tiền ngay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                STK: {selectedEmployeeForDetail.bankAccount} ({selectedEmployeeForDetail.bankName})
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployeeForDetail(null);
                  setSelectedAdvanceForDetail(null);
                }}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: XEM TRƯỚC HÌNH ẢNH / CHỨNG TỪ ĐÍNH KÈM */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-xs truncate max-w-sm">
                  {previewAttachment.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-50">
              {previewAttachment.type === 'image' || previewAttachment.url.startsWith('data:image') ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-[70vh] object-contain rounded-lg border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="text-center p-8 space-y-2">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                  <div className="font-bold text-slate-800">{previewAttachment.name}</div>
                  <div className="text-xs text-slate-500">File đính kèm chứng từ tạm ứng</div>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về xem chi tiết</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
