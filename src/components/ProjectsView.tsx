import React, { useState, useMemo } from 'react';
import { useHRM } from '../context/HRMContext';
import { ConstructionProject, RemoteAllowanceRate } from '../types/hrm';
import { standardAttendanceSymbols } from '../data/mockHrmData';
import { formatNumberVN } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import {
  HardHat,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  MapPin,
  Car,
  Award,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Calendar,
  Save,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    remoteAllowanceRates,
    employees,
    addProject,
    updateProject,
    deleteProject,
    updateRemoteAllowanceRates,
    showToast,
  } = useHRM();

  const [activeSubView, setActiveSubView] = useState<'symbols' | 'remote_allowance' | 'timesheet_preview'>('symbols');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<ConstructionProject | null>(null);

  // Form State for Project
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbolFull: '',
    symbolHalf: '',
    symbolLeave: '',
    distanceKm: 0,
    fuelAllowance: 0,
    remoteAllowanceTier: 'None' as 'I' | 'II' | 'None',
    managerName: '',
    location: '',
    status: 'active' as 'active' | 'completed' | 'paused',
  });

  // Rates draft for Remote Allowance Table (Image 2)
  const [draftRates, setDraftRates] = useState<RemoteAllowanceRate[]>(() =>
    JSON.parse(JSON.stringify(remoteAllowanceRates))
  );
  const [hasRateChanges, setHasRateChanges] = useState(false);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.symbolFull.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [projects, searchTerm]);

  // When user types Code, automatically suggest /2 and /P suffixes
  const handleCodeChange = (codeVal: string) => {
    const upper = codeVal.toUpperCase().trim();
    setFormData((prev) => ({
      ...prev,
      code: upper,
      symbolFull: upper,
      symbolHalf: upper ? `${upper}/2` : '',
      symbolLeave: upper ? `${upper}/P` : '',
    }));
  };

  const handleOpenAdd = () => {
    setFormData({
      code: '',
      name: '',
      symbolFull: '',
      symbolHalf: '',
      symbolLeave: '',
      distanceKm: 0,
      fuelAllowance: 0,
      remoteAllowanceTier: 'None',
      managerName: '',
      location: '',
      status: 'active',
    });
    setEditingProj(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: ConstructionProject) => {
    setEditingProj(proj);
    setFormData({
      code: proj.code,
      name: proj.name,
      symbolFull: proj.symbolFull,
      symbolHalf: proj.symbolHalf,
      symbolLeave: proj.symbolLeave,
      distanceKm: proj.distanceKm,
      fuelAllowance: proj.fuelAllowance,
      remoteAllowanceTier: proj.remoteAllowanceTier,
      managerName: proj.managerName || '',
      location: proj.location || '',
      status: proj.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên công trình', 'error');
      return;
    }
    if (!formData.code.trim()) {
      showToast('Vui lòng nhập ký hiệu công trình (VD: BC, PT, NH...)', 'error');
      return;
    }

    if (editingProj) {
      updateProject({
        ...editingProj,
        ...formData,
      });
    } else {
      addProject(formData);
    }
    setIsModalOpen(false);
  };

  const handleSaveRates = () => {
    updateRemoteAllowanceRates(draftRates);
    setHasRateChanges(false);
  };

  const handleExportProjectsExcel = () => {
    const headers = [
      'STT',
      'Tên Công Trình',
      'Ký Hiệu',
      'Cự Ly (Km)',
      'Phụ Cấp Xăng (VNĐ/ngày)',
      'Cấp CT Xa',
      'Địa Điểm / Ghi Chú',
      'Chỉ Huy Trưởng',
    ];
    const rows = filteredProjects.map((p, idx) => [
      idx + 1,
      p.name,
      p.code || p.symbolFull,
      p.distanceKm,
      p.fuelAllowance,
      p.remoteAllowanceTier !== 'None' ? `Cấp ${p.remoteAllowanceTier}` : '-',
      p.location || '',
      p.managerName || '',
    ]);
    exportToExcel({
      fileName: `Danh_Muc_Cong_Trinh_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'CongTrinh',
      title: 'DANH MỤC CÔNG TRÌNH & CỰ LY DI CHUYỂN',
      subtitles: [
        'Công ty Cổ phần Xây dựng | Định mức cự ly và phụ cấp xăng xe',
        `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
      ],
      headers,
      rows,
    });
    showToast('Đã xuất file Excel danh mục công trình thành công!');
  };

  const handleExportProjectsPDF = () => {
    const headers = ['STT', 'Ten Cong Trinh', 'Ky Hieu', 'Cu Ly (Km)', 'PC Xang', 'Cap CT Xa', 'Dia Diem'];
    const rows = filteredProjects.map((p, idx) => [
      idx + 1,
      p.name,
      p.code || p.symbolFull,
      p.distanceKm,
      formatNumberVN(p.fuelAllowance),
      p.remoteAllowanceTier !== 'None' ? `Cap ${p.remoteAllowanceTier}` : '-',
      p.location || '',
    ]);
    exportToPDF({
      fileName: `Danh_Muc_Cong_Trinh_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'DANH MUC CONG TRINH VA CU LY DI CHUYEN',
      subtitles: [`Cong ty CP Xay dung | Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`],
      headers,
      rows,
    });
    showToast('Đã xuất file PDF danh mục công trình thành công!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Top Banner & Main Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HardHat className="w-5 h-5 text-blue-700" />
            Quản Lý Công Trình & Ký Hiệu Chấm Công
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh mục công trình, quy định ký hiệu chấm công (đủ ngày, /2 nghỉ 1 buổi, /P nghỉ có phép), cự ly KM và phụ cấp xăng xe / công tác phí.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubView('symbols')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubView === 'symbols'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng Ký Hiệu & Cự Ly
          </button>
          <button
            onClick={() => setActiveSubView('remote_allowance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubView === 'remote_allowance'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Công Tác Phí Công Trình Xa
          </button>
          <button
            onClick={() => setActiveSubView('timesheet_preview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubView === 'timesheet_preview'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chấm Công Theo Ký Hiệu
          </button>
        </div>
      </div>

      {/* VIEW 1: BẢNG KÝ HIỆU & CỰ LY (IMAGE 1) */}
      {activeSubView === 'symbols' && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm công trình hoặc ký hiệu (BC, PT, NH...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-blue-500 w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportProjectsExcel}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
                title="Xuất danh mục công trình ra file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportProjectsPDF}
                className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-rose-300 shadow-2xs cursor-pointer"
                title="Xuất danh mục công trình ra file PDF (.pdf)"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Xuất PDF (.pdf)</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#1E3A8A] hover:bg-blue-800 text-white shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm công trình mới</span>
              </button>
            </div>
          </div>

          {/* Table matching Image 1: Blue Headers & Clean Grid */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                {/* Header matching Excel Image 1 */}
                <thead>
                  <tr className="bg-[#2E6B9E] text-white font-semibold text-center select-none border-b border-[#255780]">
                    <th className="py-3 px-4 text-left border-r border-[#3b7cb0] w-64 font-bold text-white tracking-wide">
                      Tên công trình
                    </th>
                    <th className="py-3 px-3 border-r border-[#3b7cb0] w-28 font-bold text-white tracking-wide">
                      Ký hiệu
                    </th>
                    <th className="py-3 px-3 border-r border-[#3b7cb0] w-36 font-bold text-white tracking-wide">
                      Cự ly (Km)
                    </th>
                    <th className="py-3 px-3 border-r border-[#3b7cb0] w-32 font-bold text-white tracking-wide">
                      Xăng xe (đ)
                    </th>
                    <th className="py-3 px-3 border-r border-[#3b7cb0] w-36 font-bold text-white tracking-wide">
                      Mức độ
                    </th>
                    <th className="py-3 px-3 w-24 font-bold text-white tracking-wide">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {/* Part A: Standard General Leave & Company Attendance (Image 1 top rows) */}
                  <tr className="bg-slate-100/70 font-semibold text-slate-700 text-[11px]">
                    <td colSpan={6} className="py-1.5 px-4 uppercase tracking-wider text-slate-500 bg-slate-100">
                      I. Quy định chấm công chung (Văn phòng / Nghỉ chế độ)
                    </td>
                  </tr>

                  {standardAttendanceSymbols.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-2 px-4 font-medium text-slate-800 border-r border-slate-200">
                        {item.name}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono text-blue-900 border-r border-slate-200 bg-slate-50/50">
                        {item.symbol}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200">
                        -
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600 border-r border-slate-200">
                        0
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200">
                        -
                      </td>
                      <td className="py-2 px-3 text-center text-[10px] text-slate-400">
                        Mặc định
                      </td>
                    </tr>
                  ))}

                  {/* Part B: Construction Projects - Clean single row per project */}
                  <tr className="bg-slate-100/70 font-semibold text-slate-700 text-[11px]">
                    <td colSpan={6} className="py-2 px-4 uppercase tracking-wider text-slate-700 bg-slate-100 font-bold">
                      II. Danh mục Công trình
                    </td>
                  </tr>

                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-blue-50/20 transition-colors">
                      {/* Project Name */}
                      <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                          <span className="text-xs">{proj.name}</span>
                        </div>
                        {proj.location && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center gap-1 pl-4.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{proj.location}</span>
                          </div>
                        )}
                        {proj.managerName && (
                          <div className="text-[10px] text-slate-500 font-normal pl-4.5">
                            Chỉ huy trưởng: {proj.managerName}
                          </div>
                        )}
                      </td>

                      {/* Project Symbol (Clean code e.g. BC, HT2, PT) */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-900 border-r border-slate-200 bg-blue-50/40">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-blue-100/80 border border-blue-200 text-xs shadow-2xs">
                          {proj.code || proj.symbolFull}
                        </span>
                      </td>

                      {/* Distance KM */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 border-r border-slate-200">
                        {proj.distanceKm > 0 ? `${proj.distanceKm} km` : '-'}
                      </td>

                      {/* Fuel Allowance */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 border-r border-slate-200">
                        {proj.fuelAllowance > 0 ? `${formatNumberVN(proj.fuelAllowance)}đ` : '0đ'}
                      </td>

                      {/* Remote Allowance Tier */}
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                        {proj.remoteAllowanceTier !== 'None' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300">
                            Cấp {proj.remoteAllowanceTier}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(proj)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                            title="Chỉnh sửa công trình"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProject(proj.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                            title="Xóa công trình"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation note box matching user's instruction */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ghi chú ký hiệu công trình:</span> Mục danh mục công trình hiển thị ký hiệu ngắn gọn, trực quan (ví dụ: <span className="inline-block mx-1 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">BC</span>, <span className="inline-block mx-1 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">HT2</span>, <span className="inline-block mx-1 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">PT</span>). Trong mục <strong>chấm công chi tiết</strong> theo từng ngày, hệ thống vẫn duy trì đầy đủ các ký hiệu mở rộng (<span className="font-mono font-bold text-amber-900">BC/2</span> làm nửa ngày, <span className="font-mono font-bold text-emerald-900">BC/P</span> nghỉ có phép) để chấm công chính xác.
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BẢNG CÔNG TÁC PHÍ CÔNG TRÌNH XA (IMAGE 2) */}
      {activeSubView === 'remote_allowance' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Header Banner matching Image 2 */}
          <div className="bg-[#26E5FF] text-slate-900 py-2 px-4 rounded-t-lg font-bold text-center uppercase tracking-wide shadow-xs border border-cyan-300">
            BẢNG CÔNG TÁC PHÍ CÔNG TRÌNH XA
          </div>

          <div className="bg-white rounded-b-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#2E6B9E] text-white font-semibold border-b border-[#255780]">
                  <th className="py-2.5 px-4 w-48 border-r border-[#3b7cb0]">
                    Hạng nhân sự
                  </th>
                  <th className="py-2.5 px-4 text-center border-r border-[#3b7cb0] w-40">
                    Mức I (VNĐ/ngày)
                  </th>
                  <th className="py-2.5 px-4 text-center w-40">
                    Mức II (VNĐ/ngày)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {draftRates.map((rate, idx) => (
                  <tr key={rate.rank} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 border-r border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-mono font-bold text-xs">
                          {rate.rank}
                        </span>
                        <span className="text-xs">{rate.rankDescription.split(':')[1] || rate.rank}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        step="1000"
                        value={rate.tierI}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...draftRates];
                          next[idx].tierI = val;
                          setDraftRates(next);
                          setHasRateChanges(true);
                        }}
                        className="w-32 px-2 py-1 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded focus:border-blue-500 mx-auto"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="number"
                        step="1000"
                        value={rate.tierII}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...draftRates];
                          next[idx].tierII = val;
                          setDraftRates(next);
                          setHasRateChanges(true);
                        }}
                        className="w-32 px-2 py-1 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded focus:border-blue-500 mx-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Áp dụng cho các công trình xa có quy định mức phụ cấp công tác phí I hoặc II (như Lộ Diêu, Phù Mỹ, Hà Thanh 2...).
              </span>
              <button
                onClick={handleSaveRates}
                disabled={!hasRateChanges}
                className={`px-4 py-2 text-xs font-semibold rounded shadow-xs flex items-center space-x-1.5 transition-colors ${
                  hasRateChanges
                    ? 'bg-[#1E3A8A] hover:bg-blue-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu định mức công tác phí</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CHẤM CÔNG THEO KÝ HIỆU CÔNG TRÌNH (IMAGE 3 PREVIEW) */}
      {activeSubView === 'timesheet_preview' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Mô Phỏng Bảng Chấm Công Theo Ký Hiệu Công Trình (Image 3)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhân sự được phân công theo từng công trình (Hà Thanh 2: HT2, Kho Phước Thành: PT, Cát Tiến: CTi, Đập Cây Dừa: CD...)
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center gap-1 font-mono">
                <span className="w-3 h-3 bg-amber-400 rounded-xs inline-block" /> Chủ nhật (CN)
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="w-3 h-3 bg-yellow-200 rounded-xs inline-block" /> Làm việc công trường
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="py-2 px-2 text-center w-8">STT</th>
                    <th className="py-2 px-2 w-20">Mã NV</th>
                    <th className="py-2 px-3 w-36">Họ và tên</th>
                    <th className="py-2 px-3 w-28">Chức vụ</th>
                    {/* Days 01 - 15 */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((d) => {
                      const isSun = d === 6 || d === 13;
                      return (
                        <th
                          key={d}
                          className={`py-1.5 px-1 text-center font-mono w-7 ${
                            isSun ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-100'
                          }`}
                        >
                          {String(d).padStart(2, '0')}
                        </th>
                      );
                    })}
                    <th className="py-2 px-2 text-center font-mono w-16 bg-slate-200">Công chuẩn</th>
                    <th className="py-2 px-2 text-center font-mono w-20 bg-blue-50">Công ty (+)</th>
                    <th className="py-2 px-2 text-center font-mono w-20 bg-blue-50">Công trình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {/* Sample Project 1: HÀ THANH 2 */}
                  <tr className="bg-amber-100/60 font-bold text-amber-950 font-sans text-xs">
                    <td colSpan={22} className="py-1 px-3">
                      II.1 CÔNG TRÌNH: HÀ THANH 2 (Ký hiệu: HT2)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-center text-slate-400">1</td>
                    <td className="py-1.5 px-2 font-semibold">TT-26130</td>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-900">Nguyễn Hà Thanh</td>
                    <td className="py-1.5 px-3 font-sans text-slate-600">Bảo vệ công trường</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((d) => {
                      const isSun = d === 6 || d === 13;
                      return (
                        <td
                          key={d}
                          className={`py-1.5 px-1 text-center font-bold text-blue-900 text-[10px] ${
                            isSun ? 'bg-amber-300' : 'bg-yellow-100/50'
                          }`}
                        >
                          HT2
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-center font-bold">30.0</td>
                    <td className="py-1.5 px-2 text-center text-slate-400">-</td>
                    <td className="py-1.5 px-2 text-center font-bold text-emerald-800">30.0 (HT2)</td>
                  </tr>

                  {/* Sample Project 2: KHO PHƯỚC THÀNH */}
                  <tr className="bg-amber-100/60 font-bold text-amber-950 font-sans text-xs">
                    <td colSpan={22} className="py-1 px-3">
                      II.2 CÔNG TRÌNH: KHO PHƯỚC THÀNH (Ký hiệu: PT)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-center text-slate-400">2</td>
                    <td className="py-1.5 px-2 font-semibold">TT-25085</td>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-900">Trịnh Vĩnh Hùng</td>
                    <td className="py-1.5 px-3 font-sans text-slate-600">Thủ kho kiêm bảo vệ</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((d) => {
                      const isSun = d === 6 || d === 13;
                      return (
                        <td
                          key={d}
                          className={`py-1.5 px-1 text-center font-bold text-indigo-900 text-[10px] ${
                            isSun ? 'bg-amber-300' : 'bg-yellow-100/50'
                          }`}
                        >
                          PT
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-center font-bold">30.0</td>
                    <td className="py-1.5 px-2 text-center text-slate-400">-</td>
                    <td className="py-1.5 px-2 text-center font-bold text-emerald-800">30.0 (PT)</td>
                  </tr>

                  {/* Sample Project 3: CÔNG TRÌNH ABC */}
                  <tr className="bg-amber-100/60 font-bold text-amber-950 font-sans text-xs">
                    <td colSpan={22} className="py-1 px-3">
                      II.3 CÔNG TRÌNH: CÔNG TRÌNH ABC (Ký hiệu: BC)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-center text-slate-400">3</td>
                    <td className="py-1.5 px-2 font-semibold">TT-26123</td>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-900">Phan Huy Đỉnh</td>
                    <td className="py-1.5 px-3 font-sans text-slate-600">Kỹ thuật cơ khí</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((d) => {
                      const isSun = d === 6 || d === 13;
                      const val = d === 1 ? 'BC/2' : d === 5 ? 'BC/P' : 'BC';
                      return (
                        <td
                          key={d}
                          className={`py-1.5 px-1 text-center font-bold text-blue-900 text-[10px] ${
                            isSun ? 'bg-amber-300' : val === 'BC/P' ? 'bg-green-100' : val === 'BC/2' ? 'bg-orange-100' : 'bg-yellow-100/50'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-center font-bold">26.0</td>
                    <td className="py-1.5 px-2 text-center text-slate-400">-</td>
                    <td className="py-1.5 px-2 text-center font-bold text-emerald-800">25.5 (BC)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HardHat className="w-4 h-4 text-[#1E3A8A]" />
                <span>{editingProj ? 'Chỉnh Sửa Công Trình' : 'Thêm Công Trình Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tên công trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: Công trình ABC, Kho Phước Thành, Nhơn Hội..."
                  required
                />
              </div>

              {/* Project Symbol */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ký hiệu công trình <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-40 px-3 py-2 border border-blue-300 rounded font-mono font-bold text-blue-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="VD: BC, HT2..."
                    required
                  />
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-[11px] text-slate-600">
                    Ký hiệu bảng công: <span className="font-mono font-bold text-blue-900">{formData.code || '...'}</span>
                    <span className="text-slate-400 mx-1.5">|</span>
                    Chấm công chi tiết: <span className="font-mono text-amber-800">{formData.code ? `${formData.code}/2` : '...'}</span>, <span className="font-mono text-emerald-800">{formData.code ? `${formData.code}/P` : '...'}</span>
                  </div>
                </div>
              </div>

              {/* Distance, Fuel, Remote Allowance */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Cự ly (Km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.distanceKm}
                    onChange={(e) => {
                      const dist = parseFloat(e.target.value) || 0;
                      let tier: 'I' | 'II' | 'None' = 'None';
                      if (dist > 100) tier = 'I';
                      else if (dist >= 50) tier = 'II';
                      setFormData({
                        ...formData,
                        distanceKm: dist,
                        remoteAllowanceTier: tier,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="VD: 18"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Khoảng cách</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Xăng xe (đ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.fuelAllowance}
                    onChange={(e) =>
                      setFormData({ ...formData, fuelAllowance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="VD: 25000"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Hỗ trợ đi lại</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Cấp công tác phí
                  </label>
                  <select
                    value={formData.remoteAllowanceTier}
                    onChange={(e) =>
                      setFormData({ ...formData, remoteAllowanceTier: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="None">Dưới 50km (Nội ô)</option>
                    <option value="II">Cấp II (50km - 100km)</option>
                    <option value="I">Cấp I (Trên 100km)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tự tính theo km</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Chỉ huy trưởng / Phụ trách
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="VD: Phan Huy Đỉnh"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Địa chỉ / Vị trí
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="VD: Tòa nhà ABC Center..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  {editingProj ? 'Lưu thay đổi' : 'Thêm công trình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
