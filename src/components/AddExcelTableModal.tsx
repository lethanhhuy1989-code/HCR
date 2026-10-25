import React, { useState } from 'react';
import { ExcelTableExportConfig, ExcelColumnConfig } from '../types/hrm';
import {
  X,
  Plus,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Tag,
  FileType,
  Database,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface AddExcelTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTable: (newTable: ExcelTableExportConfig) => void;
  existingTables: Record<string, ExcelTableExportConfig>;
}

export const AddExcelTableModal: React.FC<AddExcelTableModalProps> = ({
  isOpen,
  onClose,
  onAddTable,
  existingTables,
}) => {
  const [tableName, setTableName] = useState('');
  const [tableId, setTableId] = useState('');
  const [baseSource, setBaseSource] = useState<string>('payroll');
  const [fileNameTemplate, setFileNameTemplate] = useState('Bang_Xuat_Moi_{month}_{company}');
  const [sheetName, setSheetName] = useState('BangXuat');
  const [tableTitle, setTableTitle] = useState('BẢNG DỮ LIỆU XUẤT DOANH NGHIỆP');
  const [tableStyle, setTableStyle] = useState<'standard' | 'accounting' | 'raw'>('accounting');
  const [columnOption, setColumnOption] = useState<'all_source' | 'core_identity' | 'empty'>('all_source');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Auto-generate slug ID when typing name if not manually modified
  const handleNameChange = (val: string) => {
    setTableName(val);
    setErrorMsg('');
    const slug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    setTableId(slug || 'bang_moi');
    if (!sheetName || sheetName === 'BangXuat' || sheetName.length < 5) {
      const cleanSheet = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 20);
      if (cleanSheet) setSheetName(cleanSheet);
    }
    if (!tableTitle || tableTitle === 'BẢNG DỮ LIỆU XUẤT DOANH NGHIỆP') {
      setTableTitle(val.toUpperCase());
    }
    if (fileNameTemplate.includes('Bang_Xuat_Moi')) {
      setFileNameTemplate(`${slug || 'bang'}_{month}_{company}`);
    }
  };

  const handleApplyPreset = (preset: {
    name: string;
    id: string;
    source: string;
    template: string;
    sheet: string;
    title: string;
    style: 'standard' | 'accounting' | 'raw';
  }) => {
    setTableName(preset.name);
    setTableId(preset.id);
    setBaseSource(preset.source);
    setFileNameTemplate(preset.template);
    setSheetName(preset.sheet);
    setTableTitle(preset.title);
    setTableStyle(preset.style);
    setErrorMsg('');
  };

  const insertToken = (token: string) => {
    setFileNameTemplate((prev) => `${prev}_${token}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      setErrorMsg('Vui lòng nhập tên bảng dữ liệu!');
      return;
    }
    const cleanId = tableId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId) {
      setErrorMsg('Mã bảng không hợp lệ!');
      return;
    }

    if (existingTables[cleanId]) {
      setErrorMsg(`Mã bảng "${cleanId}" đã tồn tại. Vui lòng chọn mã khác!`);
      return;
    }

    // Prepare columns
    let initialCols: ExcelColumnConfig[] = [];
    const sourceTable = existingTables[baseSource] || existingTables['payroll'];

    if (columnOption === 'all_source' && sourceTable?.columns) {
      // Clone all columns from source table
      initialCols = sourceTable.columns.map((c, idx) => ({
        ...c,
        order: idx + 1,
      }));
    } else if (columnOption === 'core_identity') {
      initialCols = [
        { id: 'stt', defaultLabel: 'STT', enabled: true, order: 1, type: 'number', width: 6 },
        { id: 'employeeCode', defaultLabel: 'Mã NV', enabled: true, order: 2, type: 'text', width: 12 },
        { id: 'fullName', defaultLabel: 'Họ và Tên', enabled: true, order: 3, type: 'text', width: 24 },
        { id: 'departmentName', defaultLabel: 'Phòng Ban', enabled: true, order: 4, type: 'text', width: 18 },
        { id: 'position', defaultLabel: 'Chức Vụ', enabled: true, order: 5, type: 'text', width: 20 },
      ];
    } else {
      // Empty
      initialCols = [
        { id: 'stt', defaultLabel: 'STT', enabled: true, order: 1, type: 'number', width: 6 },
      ];
    }

    const newConfig: ExcelTableExportConfig = {
      tableId: cleanId,
      tableName: tableName.trim(),
      fileNameTemplate: fileNameTemplate.trim() || `${cleanId}_{month}_{company}`,
      sheetName: sheetName.trim() || 'Sheet1',
      tableTitle: tableTitle.trim() || tableName.trim().toUpperCase(),
      subtitles: [
        'Công ty Cổ phần Xây dựng | Báo Cáo Dữ Liệu Tùy Biến',
        'Kỳ dữ liệu: Tháng {month} | Ngày xuất: {date}',
      ],
      tableStyle,
      includeSubtitles: true,
      includeSummaryRow: tableStyle === 'accounting',
      includeSignatures: tableStyle !== 'raw',
      autoColumnWidth: true,
      useCustomNumberFormat: true,
      columns: initialCols,
      isCustom: true,
      baseSource,
      createdAt: new Date().toISOString(),
    };

    onAddTable(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Thêm Bảng Dữ Liệu Xuất Excel Mới
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                  Tùy Biến
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo cấu hình bảng xuất Excel mới với nguồn dữ liệu cơ sở, mẫu tên file và cấu hình cột riêng biệt.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gợi ý mẫu bảng nhanh (Nhấp để điền tự động):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Bảng Phụ Cấp Công Trình & Đi Lại Chi Tiết',
                    id: 'phu_cap_cong_trinh_chi_tiet',
                    source: 'payroll',
                    template: 'Bang_Phu_Cap_Cong_Trinh_{month}_{company}',
                    sheet: 'PhuCapCongTrinh',
                    title: 'BẢNG TỔNG HỢP CHI TIẾT PHỤ CẤP CÔNG TRÌNH VÀ TIỀN XĂNG',
                    style: 'accounting',
                  })
                }
                className="text-left p-2 rounded border border-emerald-200 bg-white hover:bg-emerald-100/60 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-emerald-950 group-hover:text-emerald-800">
                  Phụ Cấp Công Trình & Đi Lại
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Dữ liệu: Bảng Lương | Cột: Xăng xe, tiền ăn, công trình xa
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Bảng Thống Kê Giờ Làm Thêm (OT) & Công Quy Đổi',
                    id: 'thong_ke_tang_ca_ot',
                    source: 'attendance',
                    template: 'Bang_Tang_Ca_OT_{month}_{company}',
                    sheet: 'TangCaOT',
                    title: 'BẢNG THỐNG KÊ CHI TIẾT GIỜ LÀM THÊM VÀ CÔNG QUY ĐỔI',
                    style: 'standard',
                  })
                }
                className="text-left p-2 rounded border border-emerald-200 bg-white hover:bg-emerald-100/60 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-emerald-950 group-hover:text-emerald-800">
                  Thống Kê Tăng Ca OT & Công Quy Đổi
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Dữ liệu: Chấm Công | Cột: Giờ OT, công quy đổi (÷8h)
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Bảng Khen Thưởng & Xếp Hạng Đánh Giá KPI',
                    id: 'khen_thuong_kpi',
                    source: 'kpi',
                    template: 'Bang_Thuong_KPI_{month}_{company}',
                    sheet: 'ThuongKPI',
                    title: 'BẢNG TỔNG HỢP XẾP LOẠI KPI VÀ TIỀN THƯỞNG HIỆU QUẢ',
                    style: 'accounting',
                  })
                }
                className="text-left p-2 rounded border border-emerald-200 bg-white hover:bg-emerald-100/60 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-emerald-950 group-hover:text-emerald-800">
                  Khen Thưởng & Đánh Giá KPI
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Dữ liệu: Đánh Giá KPI | Cột: Điểm KPI, xếp loại, tiền thưởng
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Bảng Đối Chiếu Cấp Xe & Tiền Ăn Công Trình',
                    id: 'xe_va_tien_an_cong_trinh',
                    source: 'payroll',
                    template: 'Bang_Doi_Chieu_Xe_Tien_An_{month}_{company}',
                    sheet: 'XeTienAn',
                    title: 'BẢNG ĐỐI CHIẾU CẤP XE VÀ PHỤ CẤP TIỀN ĂN THEO NHÂN SỰ',
                    style: 'standard',
                  })
                }
                className="text-left p-2 rounded border border-emerald-200 bg-white hover:bg-emerald-100/60 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-emerald-950 group-hover:text-emerald-800">
                  Đối Chiếu Cấp Xe & Tiền Ăn
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Dữ liệu: Bảng Lương | Cột: Cấp xe công ty, tiền ăn ngày
                </div>
              </button>
            </div>
          </div>

          {/* Table Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                Tên bảng dữ liệu xuất: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tableName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: Bảng Phụ Cấp Công Trình Chi Tiết"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium text-slate-900 bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Mã bảng (ID nhận diện, không dấu):
              </label>
              <input
                type="text"
                required
                value={tableId}
                onChange={(e) => setTableId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="VD: phu_cap_cong_trinh"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-mono text-slate-800 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Base Source Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              Nguồn dữ liệu cơ sở (Cung cấp các dòng và dữ liệu mẫu):
            </label>
            <select
              value={baseSource}
              onChange={(e) => setBaseSource(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium text-slate-900 bg-slate-50/50 focus:bg-white"
            >
              <option value="payroll">Bảng Lương & Thưởng (Đầy đủ nhất: Nhân sự, công trình, OT, KPI, lương, phụ cấp, thực lĩnh)</option>
              <option value="attendance">Bảng Chấm Công (Dữ liệu ngày công chuẩn/thực tế, nghỉ phép, tăng ca OT, công trình)</option>
              <option value="employees">Hồ Sơ Cán Bộ Nhân Viên (CCCD, địa chỉ, phòng ban, chức vụ, ngạch bậc, STK ngân hàng)</option>
              <option value="kpi">Đánh Giá & Thưởng KPI (Điểm KPI 4 tiêu chí, xếp loại, tiền thưởng mục tiêu & thực tế)</option>
              <option value="insurance">Bảo Hiểm Xã Hội (Sổ BHXH, nơi KCB, mức lương đóng, tỷ lệ trích nộp)</option>
              <option value="projects">Danh Mục Công Trình (Cự ly km, phụ cấp xăng, cấp công trình xa, chỉ huy trưởng)</option>
            </select>
          </div>

          {/* File Name Template & Tokens */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileType className="w-3.5 h-3.5 text-emerald-600" />
                Mẫu tên file xuất tự động (.xlsx):
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Hỗ trợ {}</span>
            </label>
            <input
              type="text"
              value={fileNameTemplate}
              onChange={(e) => setFileNameTemplate(e.target.value)}
              placeholder="VD: Bang_Phu_Cap_{month}_{company}"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white"
            />
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Chèn biến nhanh:</span>
              {['{month}', '{date}', '{year}', '{company}'].map((tok) => (
                <button
                  type="button"
                  key={tok}
                  onClick={() => insertToken(tok)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded font-mono text-[10px] border border-slate-200 transition-colors cursor-pointer"
                >
                  +{tok}
                </button>
              ))}
            </div>
          </div>

          {/* Sheet Name & Table Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên Sheet Excel:
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="VD: PhuCapCongTrinh"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-mono text-slate-800 bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tiêu đề trên cùng biểu mẫu Excel:
              </label>
              <input
                type="text"
                value={tableTitle}
                onChange={(e) => setTableTitle(e.target.value)}
                placeholder="VD: BẢNG TỔNG HỢP PHỤ CẤP CÔNG TRÌNH"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold text-slate-800 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Table Style & Initial Column Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Định dạng biểu mẫu Excel:
              </label>
              <select
                value={tableStyle}
                onChange={(e) => setTableStyle(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium text-slate-900 bg-slate-50/50 focus:bg-white"
              >
                <option value="accounting">Kế toán chi tiết (Có dòng Tổng, Chữ ký)</option>
                <option value="standard">Tiêu chuẩn Doanh Nghiệp (Gọn gàng)</option>
                <option value="raw">Dữ liệu thô (Dễ import phần mềm khác/ERP)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Khởi tạo danh sách cột ban đầu:
              </label>
              <select
                value={columnOption}
                onChange={(e) => setColumnOption(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium text-slate-900 bg-slate-50/50 focus:bg-white"
              >
                <option value="all_source">Sao chép tất cả cột từ nguồn cơ sở (Khuyên dùng)</option>
                <option value="core_identity">Chỉ lấy cột nhận diện (STT, Mã NV, Họ tên, PB, Chức vụ)</option>
                <option value="empty">Bảng trống (chỉ có cột STT để tự thêm)</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tạo Bảng Xuất Dữ Liệu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
