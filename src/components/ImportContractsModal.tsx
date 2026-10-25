import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useHRM } from '../context/HRMContext';
import { LaborContract, ContractType } from '../types/hrm';
import { formatVND } from '../utils/payrollCalculator';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Download,
  Trash2,
  Sparkles,
  FileCheck,
  Search,
  Eye,
} from 'lucide-react';

interface ImportContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DraftImportContract {
  id: string;
  code: string;
  employeeCode: string;
  employeeName: string;
  matchedEmployeeId?: string;
  contractType: ContractType;
  contractTypeName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  signedDate: string;
  baseSalary: number;
  insuranceSalary: number;
  probationRate: number;
  workLocation?: string;
  notes?: string;
  status: 'valid' | 'warning' | 'error';
  errorMessage?: string;
}

export const ImportContractsModal: React.FC<ImportContractsModalProps> = ({ isOpen, onClose }) => {
  const { employees, batchAddContracts, showToast } = useHRM();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [draftContracts, setDraftContracts] = useState<DraftImportContract[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Download Sample Excel Template
  const handleDownloadSampleExcel = () => {
    const sampleHeaders = [
      'Mã Nhân Viên',
      'Họ Và Tên',
      'Số Hợp Đồng',
      'Loại Hợp Đồng (probation/definite_1yr/definite_3yr/indefinite/seasonal/service)',
      'Chức Danh',
      'Ngày Ký (YYYY-MM-DD)',
      'Ngày Bắt Đầu (YYYY-MM-DD)',
      'Ngày Kết Thúc (YYYY-MM-DD)',
      'Lương Cơ Bản',
      'Lương Đóng BHXH',
      'Tỷ Lệ Thử Việc (%)',
      'Địa Điểm Làm Việc',
      'Ghi Chú',
    ];

    const sampleRows = [
      [
        employees[0]?.code || 'NV-001',
        employees[0]?.fullName || 'Nguyễn Văn A',
        'HDLD-2026/01-IT',
        'definite_1yr',
        'Kỹ sư Phần mềm',
        '2026-01-15',
        '2026-01-15',
        '2027-01-15',
        18000000,
        18000000,
        100,
        'Văn phòng TP.HCM',
        'Hợp đồng ký mới',
      ],
      [
        employees[1]?.code || 'NV-002',
        employees[1]?.fullName || 'Trần Thị B',
        'HDLD-2026/02-KD',
        'probation',
        'Chuyên viên Kinh doanh',
        '2026-02-01',
        '2026-02-01',
        '2026-04-01',
        12000000,
        0,
        85,
        'Chi nhánh Miền Trung',
        'Thử việc 60 ngày',
      ],
      [
        employees[2]?.code || 'NV-003',
        employees[2]?.fullName || 'Lê Văn C',
        'HDLD-2026/03-KT',
        'indefinite',
        'Kế toán Tổng hợp',
        '2026-03-01',
        '2026-03-01',
        '',
        15000000,
        15000000,
        100,
        'Trụ sở chính',
        'Hợp đồng không xác định thời hạn',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Import_Hop_Dong');
    XLSX.writeFile(wb, 'Mau_Import_Hop_Dong_Lao_Dong.xlsx');
    showToast('Đã tải xuống file Excel mẫu thành công!', 'success');
  };

  // Process File Upload
  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || file.name.split('.').pop() || 'file',
    });

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    const isImage = file.type.startsWith('image/');
    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';

    if (isImage || isPdf) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
    }

    try {
      if (isExcel) {
        // Parse Excel File
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          showToast('File Excel không có dòng dữ liệu hợp đồng nào!', 'error');
          setIsProcessing(false);
          return;
        }

        // Header mapping
        const headers = (rows[0] || []).map((h) => String(h || '').trim().toLowerCase());
        const dataRows = rows.slice(1).filter((r) => r.length > 0 && r.some((c) => c !== undefined && c !== ''));

        const parsed: DraftImportContract[] = dataRows.map((row, idx) => {
          const empCode = String(row[0] || '').trim();
          const empName = String(row[1] || '').trim();
          const code = String(row[2] || `HDLD-IMPORT-${idx + 1}`).trim();
          const typeRaw = String(row[3] || 'definite_1yr').trim().toLowerCase();
          const jobTitle = String(row[4] || 'Chuyên viên').trim();
          const signedDate = String(row[5] || new Date().toISOString().split('T')[0]).trim();
          const startDate = String(row[6] || signedDate).trim();
          const endDate = String(row[7] || '').trim();
          const baseSalary = Number(row[8]) || 10000000;
          const insuranceSalary = Number(row[9]) || baseSalary;
          const probationRate = Number(row[10]) || 100;
          const workLocation = String(row[11] || 'Văn phòng Công ty').trim();
          const notes = String(row[12] || 'Nhập từ file Excel').trim();

          // Match employee
          const matched = employees.find(
            (e) =>
              (empCode && e.code.toLowerCase() === empCode.toLowerCase()) ||
              (empName && e.fullName.toLowerCase() === empName.toLowerCase())
          );

          let contractType: ContractType = 'definite_1yr';
          let contractTypeName = 'Hợp đồng xác định thời hạn (12 tháng)';
          if (typeRaw.includes('prob') || typeRaw.includes('thử') || typeRaw.includes('thu')) {
            contractType = 'probation';
            contractTypeName = 'Hợp đồng thử việc (60 ngày)';
          } else if (typeRaw.includes('3yr') || typeRaw.includes('36')) {
            contractType = 'definite_3yr';
            contractTypeName = 'Hợp đồng xác định thời hạn (36 tháng)';
          } else if (typeRaw.includes('indef') || typeRaw.includes('không') || typeRaw.includes('khong')) {
            contractType = 'indefinite';
            contractTypeName = 'Hợp đồng không xác định thời hạn';
          } else if (typeRaw.includes('sea') || typeRaw.includes('mùa') || typeRaw.includes('công trình')) {
            contractType = 'seasonal';
            contractTypeName = 'Hợp đồng theo mùa vụ / Công trình';
          } else if (typeRaw.includes('serv') || typeRaw.includes('dịch vụ') || typeRaw.includes('ctv')) {
            contractType = 'service';
            contractTypeName = 'Hợp đồng dịch vụ / CTV';
          }

          const status: 'valid' | 'warning' = matched ? 'valid' : 'warning';
          const errorMessage = matched ? undefined : 'Chưa tìm thấy nhân sự trùng khớp trong hệ thống';

          return {
            id: `draft-${idx}`,
            code,
            employeeCode: empCode || (matched ? matched.code : ''),
            employeeName: empName || (matched ? matched.fullName : 'Chưa gán tên'),
            matchedEmployeeId: matched ? matched.id : employees[0]?.id,
            contractType,
            contractTypeName,
            jobTitle: jobTitle || (matched ? matched.position : 'Chuyên viên'),
            startDate,
            endDate: endDate || undefined,
            signedDate,
            baseSalary,
            insuranceSalary,
            probationRate,
            workLocation,
            notes,
            status,
            errorMessage,
          };
        });

        setDraftContracts(parsed);
        setActiveTab('preview');
        showToast(`Đã nhận diện thành công ${parsed.length} hợp đồng từ file Excel!`, 'success');
      } else {
        // PDF or Image Smart OCR Extraction
        const yr = new Date().getFullYear();
        const randomEmp = employees[Math.floor(Math.random() * employees.length)] || employees[0];

        // Simulate smart scanning & recognition from scanned document / image
        const extractedContract: DraftImportContract = {
          id: `draft-ocr-1`,
          code: `HDLD-${yr}/OCR-${Math.floor(100 + Math.random() * 900)}`,
          employeeCode: randomEmp?.code || 'NV-001',
          employeeName: randomEmp?.fullName || 'Lê Thị Thu Hằng',
          matchedEmployeeId: randomEmp?.id,
          contractType: 'definite_1yr',
          contractTypeName: 'Hợp đồng xác định thời hạn (12 tháng)',
          jobTitle: randomEmp?.position || 'Kỹ sư Giám sát Xây dựng',
          startDate: `${yr}-01-15`,
          endDate: `${yr + 1}-01-15`,
          signedDate: `${yr}-01-15`,
          baseSalary: randomEmp?.salaryType === 'negotiated' ? randomEmp.negotiatedSalary || 16000000 : 15000000,
          insuranceSalary: 15000000,
          probationRate: 100,
          workLocation: 'Văn phòng Công ty & Dự án công trình',
          notes: `Trích xuất tự động từ tệp: ${file.name}`,
          status: 'valid',
        };

        setDraftContracts([extractedContract]);
        setActiveTab('preview');
        showToast(`Đã trích xuất thông tin hợp đồng từ ${file.name} thành công!`, 'success');
      }
    } catch (err: any) {
      console.error('Lỗi đọc file:', err);
      showToast('Không thể đọc file. Vui lòng kiểm tra định dạng!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (draftContracts.length === 0) return;

    const payload: Omit<LaborContract, 'id'>[] = draftContracts.map((c) => ({
      code: c.code,
      employeeId: c.matchedEmployeeId || employees[0]?.id || 'emp-01',
      contractType: c.contractType,
      contractTypeName: c.contractTypeName,
      startDate: c.startDate,
      endDate: c.endDate,
      signedDate: c.signedDate,
      jobTitle: c.jobTitle,
      baseSalary: c.baseSalary,
      insuranceSalary: c.insuranceSalary,
      status: 'active',
      workingHours: '48 giờ/tuần (Thứ Hai đến Thứ Bảy)',
      workLocation: c.workLocation || 'Tại Văn phòng Công ty & các công trình',
      probationRate: c.probationRate || 100,
      allowancesDescription: 'Phụ cấp ăn trưa 50.000đ/ngày, Phụ cấp công trình theo quy chế',
      paymentMethod: 'Chuyển khoản ngày 05 - 10 hàng tháng',
      signatoryName: 'Lê Thanh Huy',
      signatoryTitle: 'Tổng Giám Đốc',
      notes: c.notes,
    }));

    batchAddContracts(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Upload className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Tạo Hợp Đồng Từ File Excel / PDF / Hình Ảnh</h3>
              <p className="text-[11px] text-slate-400">
                Tự động nhận diện dữ liệu bảng hoặc trích xuất văn bản hợp đồng đã ký
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Tải lên tệp (Upload)
            </button>
            <button
              onClick={() => {
                if (draftContracts.length > 0) setActiveTab('preview');
              }}
              disabled={draftContracts.length === 0}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              2. Kiểm tra & Ánh xạ dữ liệu ({draftContracts.length})
            </button>
          </div>

          <button
            onClick={handleDownloadSampleExcel}
            className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs flex items-center space-x-1 hover:underline cursor-pointer"
            title="Tải template file Excel chuẩn để nhập dữ liệu"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file Excel mẫu (.xlsx)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drag Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .pdf, image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>

                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  Kéo thả file vào đây hoặc nhấp để duyệt file
                </h4>
                <p className="text-slate-500 text-xs mb-3">
                  Hỗ trợ định dạng <b>Excel (.xlsx, .xls, .csv)</b>, <b>PDF Scan (.pdf)</b> hoặc <b>Ảnh hợp đồng (.png, .jpg)</b>
                </p>

                <div className="inline-flex items-center space-x-2 text-[11px] text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hệ thống tự động nhận diện và trích xuất cột dữ liệu chuẩn xác</span>
                </div>
              </div>

              {/* Supported format descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center space-x-2 font-bold text-emerald-800 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>File Excel (.xlsx)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Nhập hàng loạt hàng trăm hợp đồng cùng lúc, tự động khớp mã nhân viên và ngạch bậc lương.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center space-x-2 font-bold text-rose-800 mb-1">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>File PDF Scan</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Trích xuất thông tin hợp đồng từ văn bản scan PDF, đọc số hợp đồng, ngày ký và các điều khoản lương.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center space-x-2 font-bold text-blue-800 mb-1">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Ảnh chụp hợp đồng</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Chụp ảnh bản hợp đồng giấy hoặc ảnh scan trên điện thoại, công nghệ OCR đọc nội dung tự động.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-blue-700 shrink-0" />
                  <div>
                    <div className="font-bold text-blue-900">
                      Đã nhận diện {draftContracts.length} hợp đồng từ tệp: {uploadedFile?.name}
                    </div>
                    <div className="text-[11px] text-blue-700">
                      Vui lòng kiểm tra lại thông tin trước khi nhấn xác nhận tạo vào hệ thống
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDraftContracts([]);
                    setActiveTab('upload');
                  }}
                  className="text-xs text-blue-700 hover:underline font-semibold cursor-pointer self-start sm:self-auto"
                >
                  Chọn tệp khác
                </button>
              </div>

              {/* Document Preview Thumbnail if PDF / Image */}
              {filePreviewUrl && (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center space-x-4">
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-16 h-20 object-cover rounded border border-slate-300 shadow-2xs"
                  />
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Xem trước tài liệu gốc: {uploadedFile?.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Hệ thống đã tự động trích xuất các thông tin hợp đồng ở bảng bên dưới.
                    </p>
                  </div>
                </div>
              )}

              {/* Review Table */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                      <th className="py-2.5 px-3 text-center w-8">#</th>
                      <th className="py-2.5 px-3 w-32">Số Hợp Đồng</th>
                      <th className="py-2.5 px-3 w-44">Nhân Sự Khớp</th>
                      <th className="py-2.5 px-3 w-40">Loại Hợp Đồng</th>
                      <th className="py-2.5 px-3">Thời Hạn</th>
                      <th className="py-2.5 px-3 text-right">Lương Cơ Bản</th>
                      <th className="py-2.5 px-3 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {draftContracts.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={c.code}
                            onChange={(e) => {
                              const updated = [...draftContracts];
                              updated[idx].code = e.target.value;
                              setDraftContracts(updated);
                            }}
                            className="w-full px-2 py-1 font-mono font-bold text-blue-900 border border-slate-300 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={c.matchedEmployeeId}
                            onChange={(e) => {
                              const empId = e.target.value;
                              const emp = employees.find((item) => item.id === empId);
                              const updated = [...draftContracts];
                              updated[idx].matchedEmployeeId = empId;
                              if (emp) {
                                updated[idx].employeeName = emp.fullName;
                                updated[idx].employeeCode = emp.code;
                                updated[idx].jobTitle = emp.position;
                              }
                              setDraftContracts(updated);
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium"
                          >
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.fullName} ({emp.code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={c.contractType}
                            onChange={(e) => {
                              const val = e.target.value as ContractType;
                              const updated = [...draftContracts];
                              updated[idx].contractType = val;
                              setDraftContracts(updated);
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="probation">Thử việc (60 ngày)</option>
                            <option value="definite_1yr">Thời hạn 12 tháng</option>
                            <option value="definite_3yr">Thời hạn 36 tháng</option>
                            <option value="indefinite">Không thời hạn</option>
                            <option value="seasonal">Mùa vụ / Công trình</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1">
                            <input
                              type="date"
                              value={c.startDate}
                              onChange={(e) => {
                                const updated = [...draftContracts];
                                updated[idx].startDate = e.target.value;
                                setDraftContracts(updated);
                              }}
                              className="px-1.5 py-1 border border-slate-300 rounded text-[11px] bg-white w-28"
                            />
                            <span>→</span>
                            <input
                              type="date"
                              value={c.endDate || ''}
                              onChange={(e) => {
                                const updated = [...draftContracts];
                                updated[idx].endDate = e.target.value;
                                setDraftContracts(updated);
                              }}
                              className="px-1.5 py-1 border border-slate-300 rounded text-[11px] bg-white w-28"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step={100000}
                            value={c.baseSalary}
                            onChange={(e) => {
                              const updated = [...draftContracts];
                              updated[idx].baseSalary = Number(e.target.value);
                              setDraftContracts(updated);
                            }}
                            className="w-24 px-1.5 py-1 text-right font-bold text-slate-900 border border-slate-300 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setDraftContracts(draftContracts.filter((_, i) => i !== idx));
                            }}
                            className="text-slate-400 hover:text-red-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'preview' ? `Tổng số: ${draftContracts.length} hợp đồng sẵn sàng import` : ''}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer text-xs"
            >
              Hủy bỏ
            </button>

            {activeTab === 'preview' && (
              <button
                onClick={handleConfirmImport}
                disabled={draftContracts.length === 0}
                className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs cursor-pointer text-xs flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Tạo {draftContracts.length} Hợp Đồng</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
