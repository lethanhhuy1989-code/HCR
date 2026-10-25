import React, { useState, useRef } from 'react';
import { useHRM } from '../context/HRMContext';
import { DocumentTemplate, DocumentCategory } from '../types/contractTemplate';
import {
  templateMergeFields,
  renderTemplateContent,
  numberToVietnameseWords,
} from '../data/defaultContractTemplates';
import { formatVND } from '../utils/payrollCalculator';
import {
  FileText,
  Plus,
  Upload,
  Edit,
  Trash2,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  Code,
  FileCode,
  Info,
} from 'lucide-react';

interface ContractTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractTemplateModal: React.FC<ContractTemplateModalProps> = ({ isOpen, onClose }) => {
  const {
    documentTemplates,
    addDocumentTemplate,
    updateDocumentTemplate,
    deleteDocumentTemplate,
    resetDocumentTemplates,
    employees,
    departments,
    contracts,
    showToast,
  } = useHRM();

  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'preview'>('list');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    documentTemplates[0]?.id || ''
  );

  // Editor form state
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [editorData, setEditorData] = useState({
    code: '',
    name: '',
    category: 'contract' as DocumentCategory,
    description: '',
    content: '',
  });

  // Preview state
  const [previewEmployeeId, setPreviewEmployeeId] = useState(employees[0]?.id || '');
  const [tagCategoryFilter, setTagCategoryFilter] = useState<string>('all');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const currentTemplate =
    documentTemplates.find((t) => t.id === selectedTemplateId) || documentTemplates[0];

  // Open Editor for new or existing
  const handleOpenEdit = (t?: DocumentTemplate) => {
    if (t) {
      setEditingTemplate(t);
      setSelectedTemplateId(t.id);
      setEditorData({
        code: t.code,
        name: t.name,
        category: t.category,
        description: t.description,
        content: t.content,
      });
    } else {
      setEditingTemplate(null);
      setEditorData({
        code: `MAU_TUY_CHINH_${Date.now().toString().slice(-4)}`,
        name: 'Mẫu Văn Bản Tùy Chỉnh Mới',
        category: 'custom',
        description: 'Mẫu văn bản được tạo bởi người dùng với các trường ánh xạ tự động.',
        content: `<div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #1e293b; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-weight: bold; font-size: 11pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight: bold; font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
  </div>
  <h2 style="text-align: center; margin: 20px 0;">VĂN BẢN XÁC NHẬN NHÂN SỰ</h2>
  <p>Kính gửi: Ông / Bà <b>{{HO_TEN}}</b> (Mã NV: <b>{{MA_NV}}</b>)</p>
  <p>Chức danh: <b>{{CHUC_DANH}}</b> - Phòng ban: <b>{{PHONG_BAN}}</b></p>
  <p>Mức lương hiện tại: <b>{{LUONG_CO_BAN}}</b></p>
  <p>Địa điểm công tác: {{DIA_DIEM_LAM_VIEC}}</p>
</div>`,
      });
    }
    setActiveTab('editor');
  };

  // Save Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorData.name.trim()) {
      showToast('Vui lòng nhập tên mẫu văn bản!', 'error');
      return;
    }
    if (!editorData.content.trim()) {
      showToast('Nội dung mẫu văn bản không được để trống!', 'error');
      return;
    }

    if (editingTemplate) {
      updateDocumentTemplate({
        ...editingTemplate,
        code: editorData.code.trim().toUpperCase(),
        name: editorData.name.trim(),
        category: editorData.category,
        description: editorData.description.trim(),
        content: editorData.content,
      });
    } else {
      addDocumentTemplate({
        code: editorData.code.trim().toUpperCase(),
        name: editorData.name.trim(),
        category: editorData.category,
        description: editorData.description.trim(),
        content: editorData.content,
        isDefault: false,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }
    setActiveTab('list');
  };

  // Upload Template File (.doc, .docx, .html, .txt)
  const handleUploadTemplateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setEditorData((prev) => ({
          ...prev,
          name: prev.name === 'Mẫu Văn Bản Tùy Chỉnh Mới' ? file.name.replace(/\.[^/.]+$/, '') : prev.name,
          content: text,
        }));
        showToast(`Đã nạp nội dung từ tệp "${file.name}" vào trình soạn thảo!`, 'success');
      }
    };
    reader.readAsText(file);
  };

  // Insert Tag into Editor at cursor
  const handleInsertTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);

    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = editorData.content;
      const newText = currentText.substring(0, start) + tag + currentText.substring(end);
      setEditorData({ ...editorData, content: newText });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
      showToast(`Đã chèn thẻ "${tag}" vào vị trí con trỏ!`);
    } else {
      showToast(`Đã sao chép thẻ "${tag}" vào bộ nhớ tạm!`);
    }
  };

  // Build Sample Merged Data for Preview
  const selectedEmp = employees.find((e) => e.id === previewEmployeeId) || employees[0];
  const selectedEmpContract = contracts.find((c) => c.employeeId === selectedEmp?.id);
  const selectedDept = departments.find((d) => d.id === selectedEmp?.departmentId);

  const baseSal = selectedEmp?.salaryType === 'negotiated'
    ? selectedEmp.negotiatedSalary || 15000000
    : 12000000;

  const sampleData: Record<string, string | number> = {
    '{{HO_TEN}}': selectedEmp?.fullName || 'Nguyễn Văn A',
    '{{MA_NV}}': selectedEmp?.code || 'NV-001',
    '{{SO_CCCD}}': selectedEmp?.identityCard || '079090001234',
    '{{NGAY_CAP_CCCD}}': '15/04/2021',
    '{{NOI_CAP_CCCD}}': 'Cục CS QLHC về TTXH',
    '{{NGAY_SINH}}': selectedEmp?.birthDate || '01/01/1990',
    '{{GIOI_TINH}}': 'Nam',
    '{{QUOC_TICH}}': 'Việt Nam',
    '{{QUE_QUAN}}': selectedEmp?.hometown || 'Bến Tre',
    '{{CHO_O_HIEN_NAY}}': selectedEmp?.currentAddress || '120 Nguyễn Huệ, Quận 1, TP.HCM',
    '{{SO_DIEN_THOAI}}': selectedEmp?.phone || '0908 123 456',
    '{{EMAIL}}': selectedEmp?.email || 'nhansu@enterprise.vn',
    '{{SO_SO_BHXH}}': selectedEmp?.socialInsuranceCode || '7920194832',
    '{{SO_TAI_KHOAN}}': selectedEmp?.bankAccount || '1903456789012',
    '{{NGAN_HANG}}': selectedEmp?.bankName || 'Techcombank - CN Sài Gòn',
    '{{CHUC_DANH}}': selectedEmp?.position || 'Kỹ sư Chỉ huy trưởng',
    '{{PHONG_BAN}}': selectedDept?.name || 'Phòng Kỹ thuật Thi công',
    '{{DIA_DIEM_LAM_VIEC}}': 'Trụ sở Công ty & các công trình dự án',
    '{{THOI_GIO_LAM_VIEC}}': '48 giờ/tuần (Thứ Hai đến Thứ Bảy)',
    '{{SO_HOP_DONG}}': selectedEmpContract?.code || 'HĐLĐ-2026/01-IT',
    '{{LOAI_HOP_DONG}}': selectedEmpContract?.contractTypeName || 'Hợp đồng xác định thời hạn (12 tháng)',
    '{{NGAY_KY}}': selectedEmpContract?.signedDate || '01/01/2026',
    '{{NGAY_BAT_DAU}}': selectedEmpContract?.startDate || '01/01/2026',
    '{{NGAY_KET_THUC}}': selectedEmpContract?.endDate || '01/01/2027',
    '{{TY_LE_THU_VIEC}}': '85%',
    '{{LUONG_CO_BAN}}': formatVND(baseSal),
    '{{LUONG_CHU}}': numberToVietnameseWords(baseSal),
    '{{LUONG_BHXH}}': formatVND(baseSal),
    '{{LUONG_CU}}': formatVND(Math.round(baseSal * 0.85)),
    '{{LUONG_MOI}}': formatVND(baseSal),
    '{{MUC_TANG}}': formatVND(Math.round(baseSal * 0.15)),
    '{{PHU_CAP}}': 'Ăn trưa 50.000đ/ngày, Phụ cấp công trình và điện thoại theo quy chế',
    '{{HINH_THUC_TRA_LUONG}}': 'Chuyển khoản định kỳ vào ngày 05 - 10 hàng tháng',
    '{{SO_QUYET_DINH}}': 'QĐ-NL/2026/08',
    '{{NGAY_HIEU_LUC_QD}}': '01/11/2026',
    '{{LY_DO_NANG_LUONG}}': 'Hoàn thành xuất sắc nhiệm vụ và có nhiều sáng kiến cải tiến thi công',
    '{{NGAY_CHAM_DUT}}': '31/10/2026',
    '{{LY_DO_CHAM_DUT}}': 'Hai bên tự nguyện thỏa thuận chấm dứt hợp đồng lao động',
    '{{TIEN_TRO_CAP}}': formatVND(baseSal),
    '{{TAI_SAN_BAN_GIAO}}': 'Laptop Dell Latitude, Thẻ ra vào văn phòng, Dụng cụ đo lường thi công',
    '{{TEN_CONG_TY}}': 'CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG ENTERPRISE',
    '{{DIA_CHI_CONG_TY}}': 'Tòa nhà Enterprise Tower, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    '{{MST_CONG_TY}}': '0314892839',
    '{{SDT_CONG_TY}}': '(028) 3822 6868',
    '{{NGUOI_DAI_DIEN}}': 'Lê Thanh Huy',
    '{{CHUC_VU_DAI_DIEN}}': 'Tổng Giám Đốc',
    '{{NGAY_HIEN_TAI}}': new Date().getDate().toString().padStart(2, '0'),
    '{{THANG_HIEN_TAI}}': (new Date().getMonth() + 1).toString().padStart(2, '0'),
    '{{NAM_HIEN_TAI}}': new Date().getFullYear().toString(),
  };

  const renderedPreview = currentTemplate
    ? renderTemplateContent(currentTemplate.content, sampleData)
    : '';

  // Download Word for Preview
  const handleDownloadWordPreview = () => {
    if (!currentTemplate) return;
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${currentTemplate.name}</title></head>
      <body>${renderedPreview}</body>
      </html>
    `;
    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTemplate.code}_${selectedEmp.fullName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống văn bản Word mẫu thành công!', 'success');
  };

  const filteredTags = templateMergeFields.filter(
    (t) => tagCategoryFilter === 'all' || t.category === tagCategoryFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm">Quản Lý & Thiết Kế Mẫu Văn Bản - Ánh Xạ Trường Dữ Liệu</h3>
              <p className="text-[11px] text-slate-400">
                Tùy chỉnh HĐLĐ, Quyết định nâng lương, Chấm dứt, Biên bản thanh lý và tải mẫu tùy biến
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

        {/* Tab Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-5 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 text-xs overflow-x-auto touch-scroll-x no-scrollbar w-full sm:w-auto py-0.5">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh sách mẫu văn bản ({documentTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'editor' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chỉnh sửa & Ánh xạ trường
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xem trước văn bản với dữ liệu thật
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetDocumentTemplates}
              className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
              title="Khôi phục lại tất cả các mẫu mặc định ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Khôi phục mẫu mặc định</span>
            </button>

            <button
              onClick={() => handleOpenEdit()}
              className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mẫu mới</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {/* TAB 1: DANH SÁCH MẪU */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {documentTemplates.map((t) => (
                  <div
                    key={t.id}
                    className={`border rounded-xl p-4 transition-all bg-white shadow-2xs flex flex-col justify-between ${
                      selectedTemplateId === t.id
                        ? 'border-indigo-500 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                          {t.isDefault && (
                            <span className="px-2 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-semibold">
                              Chuẩn LĐ
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          {t.code}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mb-3 leading-relaxed">{t.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-400">
                        Cập nhật: {t.updatedAt || 'Hôm nay'}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedTemplateId(t.id);
                            setActiveTab('preview');
                          }}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Xem trước</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>

                        {!t.isDefault && (
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa mẫu "${t.name}"?`)) {
                                deleteDocumentTemplate(t.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TRÌNH SOẠN THẢO & ÁNH XẠ TRƯỜNG */}
          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left / Center: Form & Content Editor */}
              <div className="lg:col-span-2 space-y-3">
                <form onSubmit={handleSaveTemplate} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tên mẫu văn bản</label>
                      <input
                        type="text"
                        required
                        value={editorData.name}
                        onChange={(e) => setEditorData({ ...editorData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Mã định danh</label>
                      <input
                        type="text"
                        required
                        value={editorData.code}
                        onChange={(e) => setEditorData({ ...editorData, code: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:bg-white focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Phân loại mẫu</label>
                      <select
                        value={editorData.category}
                        onChange={(e) => setEditorData({ ...editorData, category: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                      >
                        <option value="contract">Hợp đồng lao động chính thức</option>
                        <option value="probation">Hợp đồng thử việc</option>
                        <option value="salary_raise">Quyết định nâng lương / tăng lương</option>
                        <option value="termination">Quyết định chấm dứt hợp đồng</option>
                        <option value="liquidation">Biên bản thanh lý & bàn giao</option>
                        <option value="addendum">Phụ lục hợp đồng</option>
                        <option value="custom">Mẫu văn bản tùy chỉnh khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Mô tả ngắn</label>
                      <input
                        type="text"
                        value={editorData.description}
                        onChange={(e) => setEditorData({ ...editorData, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Toolbar for Content */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-slate-800 text-xs">
                      Nội dung mẫu văn bản (Hỗ trợ HTML & Merge Tags):
                    </span>

                    <div className="flex items-center space-x-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".doc, .docx, .html, .txt"
                        className="hidden"
                        onChange={handleUploadTemplateFile}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                        title="Upload file mẫu Word (.doc), Text hoặc HTML từ máy tính"
                      >
                        <Upload className="w-3 h-3 text-slate-600" />
                        <span>Tải file mẫu từ máy</span>
                      </button>
                    </div>
                  </div>

                  {/* Textarea editor */}
                  <textarea
                    ref={contentTextareaRef}
                    rows={15}
                    value={editorData.content}
                    onChange={(e) => setEditorData({ ...editorData, content: e.target.value })}
                    className="w-full bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-lg border border-slate-700 focus:outline-indigo-500 leading-relaxed"
                  />

                  {/* Buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lưu Mẫu Văn Bản</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Panel: Merge Tags Library (Ánh Xạ Trường Dữ Liệu) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 flex flex-col max-h-[70vh]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Thư Viện Trường Ánh Xạ</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Nhấp để chèn</span>
                </div>

                {/* Filter tags by category */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'employee', label: 'Nhân sự' },
                    { id: 'contract', label: 'Hợp đồng' },
                    { id: 'salary', label: 'Tiền lương' },
                    { id: 'decision', label: 'Quyết định' },
                    { id: 'company', label: 'Doanh nghiệp' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTagCategoryFilter(cat.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        tagCategoryFilter === cat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Tag List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.key}
                      onClick={() => handleInsertTag(tag.key)}
                      className="p-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group flex items-start justify-between gap-2 shadow-2xs"
                      title={`Ví dụ: ${tag.example}`}
                    >
                      <div>
                        <div className="font-mono font-bold text-indigo-900 text-[11px] group-hover:text-indigo-700">
                          {tag.key}
                        </div>
                        <div className="text-[10px] text-slate-600">{tag.label}</div>
                      </div>

                      <span className="text-[10px] text-indigo-600 font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedTag === tag.key ? 'Đã chèn' : '+ Chèn'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: XEM TRƯỚC VĂN BẢN VỚI DỮ LIỆU THẬT */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Preview Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-semibold text-slate-700">Chọn mẫu văn bản:</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-indigo-500"
                    >
                      {documentTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-semibold text-slate-700">Ánh xạ dữ liệu nhân sự:</label>
                    <select
                      value={previewEmployeeId}
                      onChange={(e) => setPreviewEmployeeId(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-indigo-500"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.code} - {emp.position})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadWordPreview}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Word (.doc)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In A4</span>
                  </button>
                </div>
              </div>

              {/* Rendered View */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-10 overflow-x-auto shadow-inner">
                <div
                  className="bg-white p-8 sm:p-12 rounded shadow-md border border-slate-200 max-w-3xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: renderedPreview }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
