import React, { useState } from 'react';
import {
  ExcelTableId,
  ExcelColumnConfig,
  ConstructionProject,
} from '../types/hrm';
import {
  X,
  Plus,
  PlusCircle,
  Briefcase,
  User,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface AddCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTableId: ExcelTableId;
  projects: ConstructionProject[];
  existingColumns: ExcelColumnConfig[];
  onAddColumn: (column: ExcelColumnConfig) => void;
}

export const AddCustomFieldModal: React.FC<AddCustomFieldModalProps> = ({
  isOpen,
  onClose,
  selectedTableId,
  projects,
  existingColumns,
  onAddColumn,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'employee' | 'attendance' | 'custom'>('project');

  // Project selector state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [projectMetricType, setProjectMetricType] = useState<
    'days_worked' | 'fuel' | 'meal' | 'remote' | 'total' | 'vehicle'
  >('days_worked');
  const [projectCustomLabel, setProjectCustomLabel] = useState<string>('');

  // Free text custom field state
  const [customKey, setCustomKey] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [customType, setCustomType] = useState<'text' | 'number' | 'currency' | 'date'>('text');
  const [customDefaultVal, setCustomDefaultVal] = useState<string>('');

  if (!isOpen) return null;

  const selectedProj = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Helper to check if a column ID already exists
  const isColumnAdded = (colId: string) => {
    return existingColumns.some((c) => c.id === colId);
  };

  // Auto set project label when project or metric changes if user hasn't typed custom
  const getSuggestedProjectLabel = (
    proj: ConstructionProject | undefined,
    metric: 'days_worked' | 'fuel' | 'meal' | 'remote' | 'total' | 'vehicle'
  ) => {
    if (!proj) return '';
    const projName = proj.name || proj.code;
    switch (metric) {
      case 'days_worked':
        return `Số ngày tại ${projName}`;
      case 'fuel':
        return `Tiền xăng ${projName}`;
      case 'meal':
        return `Tiền ăn ${projName}`;
      case 'remote':
        return `Công tác phí xa ${projName}`;
      case 'total':
        return `Tổng phụ cấp ${projName}`;
      case 'vehicle':
        return `Phương tiện ${projName}`;
      default:
        return `Dự án ${projName}`;
    }
  };

  // Add specific project column
  const handleAddProjectColumn = () => {
    if (!selectedProj) return;

    let colId = `proj_days_${selectedProj.id}`;
    let colType: 'text' | 'number' | 'currency' | 'date' = 'number';
    let defaultLabel = `Số ngày tại ${selectedProj.name}`;

    if (projectMetricType === 'days_worked') {
      colId = `proj_days_${selectedProj.id}`;
      colType = 'number';
      defaultLabel = `Số ngày tại ${selectedProj.name}`;
    } else if (projectMetricType === 'fuel') {
      colId = `proj_fuel_${selectedProj.id}`;
      colType = 'currency';
      defaultLabel = `Tiền xăng tại ${selectedProj.name} (VNĐ)`;
    } else if (projectMetricType === 'meal') {
      colId = `proj_meal_${selectedProj.id}`;
      colType = 'currency';
      defaultLabel = `Tiền ăn tại ${selectedProj.name} (VNĐ)`;
    } else if (projectMetricType === 'remote') {
      colId = `proj_remote_${selectedProj.id}`;
      colType = 'currency';
      defaultLabel = `Công tác phí xa ${selectedProj.name} (VNĐ)`;
    } else if (projectMetricType === 'total') {
      colId = `proj_total_${selectedProj.id}`;
      colType = 'currency';
      defaultLabel = `Tổng phụ cấp ${selectedProj.name} (VNĐ)`;
    } else if (projectMetricType === 'vehicle') {
      colId = `proj_vehicle_${selectedProj.id}`;
      colType = 'text';
      defaultLabel = `Phương tiện ${selectedProj.name}`;
    }

    const finalLabel = projectCustomLabel.trim() || defaultLabel;

    onAddColumn({
      id: colId,
      defaultLabel: finalLabel,
      customLabel: finalLabel,
      enabled: true,
      order: existingColumns.length + 1,
      type: colType,
      isCustom: true,
      category: 'project',
      projectId: selectedProj.id,
      projectFieldType:
        projectMetricType === 'days_worked'
          ? 'days_worked'
          : projectMetricType === 'fuel'
          ? 'fuel_allowance'
          : projectMetricType === 'meal'
          ? 'meal_allowance'
          : projectMetricType === 'remote'
          ? 'remote_allowance'
          : projectMetricType === 'total'
          ? 'total_allowance'
          : 'vehicle_type',
    });

    setProjectCustomLabel('');
    onClose();
  };

  // Add all assigned projects summary column
  const handleAddAllProjectsSummary = () => {
    onAddColumn({
      id: 'all_assigned_projects',
      defaultLabel: 'Công Trình & Số Ngày Làm Việc Trong Tháng',
      customLabel: 'Công Trình & Số Ngày Làm Việc Trong Tháng',
      enabled: true,
      order: existingColumns.length + 1,
      type: 'text',
      isCustom: true,
      category: 'project',
      projectFieldType: 'all_projects_summary',
    });
    onClose();
  };

  // Preset employee profile fields
  const employeePresetFields: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date';
    description: string;
  }[] = [
    { id: 'identityCard', label: 'Số CCCD / CMND', type: 'text', description: 'Căn cước công dân của người lao động' },
    { id: 'hometown', label: 'Quê Quán / Nguyên Quán', type: 'text', description: 'Tỉnh/thành phố nguyên quán' },
    { id: 'currentAddress', label: 'Nơi Ở Hiện Nay', type: 'text', description: 'Địa chỉ thường trú / tạm trú' },
    { id: 'phone', label: 'Số Điện Thoại Liên Hệ', type: 'text', description: 'Số di động cá nhân' },
    { id: 'email', label: 'Email Công Việc', type: 'text', description: 'Hòm thư điện tử' },
    { id: 'joinDate', label: 'Ngày Bắt Đầu Làm Việc', type: 'date', description: 'Thời gian gia nhập công ty' },
    { id: 'dependentsCount', label: 'Số Người Phụ Thuộc', type: 'number', description: 'Số người phụ thuộc giảm trừ gia cảnh thuế TNCN' },
    { id: 'bankAccount', label: 'Số Tài Khoản Ngân Hàng', type: 'text', description: 'STK nhận lương chuyển khoản' },
    { id: 'bankName', label: 'Tên Ngân Hàng Mở Tài Khoản', type: 'text', description: 'Ngân hàng thụ hưởng' },
    { id: 'socialInsuranceCode', label: 'Mã Số Sổ BHXH', type: 'text', description: 'Mã số sổ bảo hiểm xã hội' },
    { id: 'positionRank', label: 'Hạng Chức Danh (A, B, C, D)', type: 'text', description: 'Hạng chức danh liên kết công tác phí công trình' },
    { id: 'status', label: 'Tình Trạng Hợp Đồng', type: 'text', description: 'Chính thức / Thử việc' },
  ];

  // Preset attendance & overtime fields
  const attendancePresetFields: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date';
    description: string;
  }[] = [
    { id: 'standardDays', label: 'Số Ngày Công Chuẩn', type: 'number', description: 'Định mức ngày công quy định trong tháng (VD: 26)' },
    { id: 'actualDays', label: 'Số Ngày Đi Làm Thực Tế', type: 'number', description: 'Ngày công thực tế đã đi làm' },
    { id: 'paidLeaveDays', label: 'Số Ngày Nghỉ Phép Hưởng Lương (P)', type: 'number', description: 'Nghỉ phép năm hưởng nguyên lương' },
    { id: 'unpaidLeaveDays', label: 'Số Ngày Nghỉ Không Lương (KP)', type: 'number', description: 'Nghỉ không phép / không hưởng lương' },
    { id: 'otHoursNormal', label: 'Giờ Tăng Ca Ngày Thường (h)', type: 'number', description: 'Làm thêm giờ ngày bình thường (hệ số 1.5)' },
    { id: 'otHoursWeekend', label: 'Giờ Tăng Ca Cuối Tuần / Nghỉ (h)', type: 'number', description: 'Làm thêm giờ ngày chủ nhật (hệ số 2.0)' },
    { id: 'otHours', label: 'Tổng Số Giờ Tăng Ca (h)', type: 'number', description: 'Tổng cộng số giờ làm thêm trong tháng' },
    { id: 'otConvertedDays', label: 'Công Tăng Ca Quy Đổi (÷ 8 tiếng)', type: 'number', description: 'Quy đổi tổng giờ tăng ca ra ngày công' },
    { id: 'motorcycleDays', label: 'Số Ngày Đi Xe Máy (Tính Phụ Cấp Xăng)', type: 'number', description: 'Ngày nhân sự tự túc đi xe máy được tính tiền xăng' },
    { id: 'carDays', label: 'Số Ngày Đi Ô Tô (Cấp Xe 0đ)', type: 'number', description: 'Ngày công ty điều xe ô tô đưa đón (0đ xăng)' },
    { id: 'fuelToggleStatus', label: 'Trạng Thái Phụ Cấp Xăng Xe', type: 'text', description: 'Chế độ BẬT tính xăng hoặc TẮT cấp xe' },
    { id: 'lateArrivalMinutes', label: 'Số Phút Đi Muộn / Về Sớm', type: 'number', description: 'Phút vi phạm giờ giấc trong tháng' },
  ];

  const handleAddPresetField = (item: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date';
  }, category: 'employee' | 'attendance') => {
    onAddColumn({
      id: item.id,
      defaultLabel: item.label,
      customLabel: item.label,
      enabled: true,
      order: existingColumns.length + 1,
      type: item.type,
      isCustom: true,
      category,
    });
    onClose();
  };

  // Add custom free text field
  const handleAddCustomFreeField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim()) return;

    const rawId = customKey.trim() || `custom_${Date.now()}`;
    const sanitizedId = rawId.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    onAddColumn({
      id: sanitizedId,
      defaultLabel: customLabel.trim(),
      customLabel: customLabel.trim(),
      enabled: true,
      order: existingColumns.length + 1,
      type: customType,
      isCustom: true,
      category: 'custom_note',
      defaultValue: customDefaultVal.trim() || undefined,
    });

    setCustomKey('');
    setCustomLabel('');
    setCustomDefaultVal('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
              <PlusCircle className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Thêm Trường Dữ Liệu Tùy Biến Vào Bảng Xuất Excel
                <span className="text-[10px] bg-emerald-400 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">
                  Linh hoạt 100%
                </span>
              </h2>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Bổ sung thông tin công trình, số ngày công ở từng dự án, hồ sơ nhân sự, chấm công hoặc cột tự do.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('project')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'project'
                ? 'bg-white text-blue-900 border-slate-200 -mb-px shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4 text-amber-600" />
            <span>🏗️ Công Trình & Số Ngày Làm Việc</span>
          </button>

          <button
            onClick={() => setActiveTab('employee')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'employee'
                ? 'bg-white text-blue-900 border-slate-200 -mb-px shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>👤 Hồ Sơ Cán Bộ Nhân Viên</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-white text-blue-900 border-slate-200 -mb-px shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>⏱️ Chấm Công & Tăng Ca Chi Tiết</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'custom'
                ? 'bg-white text-blue-900 border-slate-200 -mb-px shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>✍️ Cột Ghi Chú / Tự Nhập Tự Do</span>
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          {/* TAB 1: CÔNG TRÌNH & SỐ NGÀY LÀM VIỆC */}
          {activeTab === 'project' && (
            <div className="space-y-4">
              {/* Option A: Quick Add Summary Column for all projects */}
              <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Cột Tổng Hợp Toàn Bộ Công Trình Đã Đi Trong Tháng
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Khuyên Dùng
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">
                    Tự động thống kê nhân sự đó đã làm việc ở công trình nào, bao nhiêu ngày trong tháng.
                    <br />
                    <span className="font-mono text-[11px] text-amber-900 font-semibold">
                      Ví dụ hiển thị trong Excel: &quot;CT Cầu Vàm Cống: 14 ngày; KĐT Sala: 8 ngày&quot;
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddAllProjectsSummary}
                  disabled={isColumnAdded('all_assigned_projects')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    isColumnAdded('all_assigned_projects')
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {isColumnAdded('all_assigned_projects') ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã có trong bảng</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ Thêm cột tổng hợp công trình</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option B: Add a column for a specific project */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Thêm Cột Cho Một Công Trình Cụ Thể (Đi công trình nào, bao nhiêu ngày ở công trình đó...)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Có {projects.length} công trình trong danh mục
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Select Project */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      1. Chọn Công Trình / Dự Án:
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        const p = projects.find((x) => x.id === e.target.value);
                        setProjectCustomLabel(getSuggestedProjectLabel(p, projectMetricType));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-blue-600"
                    >
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.code ? `[${proj.code}] ` : ''}{proj.name} ({proj.distanceKm} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Metric */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      2. Chọn Loại Dữ Liệu Cần Lấy:
                    </label>
                    <select
                      value={projectMetricType}
                      onChange={(e) => {
                        const m = e.target.value as any;
                        setProjectMetricType(m);
                        setProjectCustomLabel(getSuggestedProjectLabel(selectedProj, m));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-blue-900 focus:outline-blue-600"
                    >
                      <option value="days_worked">📅 Số ngày công làm việc tại công trình này trong tháng (Số)</option>
                      <option value="fuel">⛽ Tiền phụ cấp xăng tại công trình này (Tiền VNĐ)</option>
                      <option value="meal">🍲 Tiền phụ cấp ăn tại công trình này (Tiền VNĐ)</option>
                      <option value="remote">🚗 Công tác phí công trình xa tại công trình này (Tiền VNĐ)</option>
                      <option value="total">💰 Tổng phụ cấp công trình này (Tiền VNĐ)</option>
                      <option value="vehicle">🚙 Phương tiện di chuyển (Xe máy / Cấp ô tô)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Label Input */}
                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">
                    3. Tên Nhãn Hiển Thị Trong File Excel (Tùy biến):
                  </label>
                  <input
                    type="text"
                    value={projectCustomLabel || getSuggestedProjectLabel(selectedProj, projectMetricType)}
                    onChange={(e) => setProjectCustomLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white font-semibold text-slate-900 focus:outline-blue-600"
                    placeholder="VD: Số ngày làm việc tại Dự án Cầu Vàm Cống"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mã khóa trường tự động: <code className="font-mono text-blue-700 font-bold">proj_{projectMetricType === 'days_worked' ? 'days' : projectMetricType}_{selectedProj?.id}</code>
                  </p>
                </div>

                {/* Add button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddProjectColumn}
                    className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Trường Công Trình Này Vào Bảng Excel</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HỒ SƠ NHÂN SỰ */}
          {activeTab === 'employee' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Bấm <strong>+ Thêm vào bảng</strong> để bổ sung bất kỳ trường hồ sơ nhân sự nào vào bảng xuất Excel hiện tại:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {employeePresetFields.map((field) => {
                  const already = isColumnAdded(field.id);
                  return (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{field.label}</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {field.type === 'date' ? 'Ngày' : field.type === 'number' ? 'Số' : 'Chữ'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{field.description}</p>
                      </div>

                      <button
                        type="button"
                        disabled={already}
                        onClick={() => handleAddPresetField(field, 'employee')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded shrink-0 transition-colors cursor-pointer ${
                          already
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        {already ? 'Đã có' : '+ Thêm'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CHẤM CÔNG & TĂNG CA */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Bấm <strong>+ Thêm vào bảng</strong> để bổ sung trường theo dõi chấm công, làm thêm giờ, hoặc phương tiện:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attendancePresetFields.map((field) => {
                  const already = isColumnAdded(field.id);
                  return (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{field.label}</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {field.type === 'number' ? 'Số' : 'Chữ'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{field.description}</p>
                      </div>

                      <button
                        type="button"
                        disabled={already}
                        onClick={() => handleAddPresetField(field, 'attendance')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded shrink-0 transition-colors cursor-pointer ${
                          already
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {already ? 'Đã có' : '+ Thêm'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CỘT GHI CHÚ / TỰ DO */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustomFreeField} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900">
                <p className="font-semibold">
                  Tạo bất kỳ trường ghi chú, cột ký duyệt hoặc cột trống để điền tay trong file Excel:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên Tiêu Đề Cột Trong Excel (* Bắt buộc):
                  </label>
                  <input
                    type="text"
                    required
                    value={customLabel}
                    onChange={(e) => {
                      setCustomLabel(e.target.value);
                      if (!customKey) {
                        setCustomKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                      }
                    }}
                    placeholder="VD: Ký Nhận Của Người Lao Động"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã Trường (Key / ID - Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="VD: ky_nhan_nld"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-slate-800 focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kiểu Dữ Liệu:
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-purple-600"
                  >
                    <option value="text">Văn bản / Chuỗi ký tự</option>
                    <option value="number">Số (Number)</option>
                    <option value="currency">Số tiền VNĐ (Currency)</option>
                    <option value="date">Ngày tháng (Date)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá Trị Mặc Định Điền Sẵn (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={customDefaultVal}
                    onChange={(e) => setCustomDefaultVal(e.target.value)}
                    placeholder="VD: Đã ký / Để trống"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-purple-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tạo Trường Dữ Liệu Tùy Biến Này</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Trường dữ liệu sau khi thêm có thể kéo lên/xuống và đổi tên nhãn tự do.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
