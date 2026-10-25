import React, { useState, useMemo } from 'react';
import { useHRM } from '../context/HRMContext';
import { PerformanceReview, Employee } from '../types/hrm';
import { formatVND, formatNumberVN } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import {
  Award,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Edit,
  Plus,
  X,
  Save,
  Download,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
  DollarSign,
  Users,
  Star,
  FileCheck,
  ToggleLeft,
  ToggleRight,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const PerformanceReviewModule: React.FC = () => {
  const {
    employees,
    departments,
    reviews,
    currentMonth,
    setCurrentMonth,
    updateReview,
    addReview,
    batchUpdateReviews,
    setActiveMainTab,
    setActiveSubTab,
    settings,
    toggleKpiBonus,
    showToast,
  } = useHRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);

  // Form criteria state
  const [formData, setFormData] = useState({
    taskCompletion: 90,
    qualitySafety: 90,
    disciplineAttendance: 90,
    initiativeCollaboration: 90,
    targetBonusAmount: 2000000,
    evaluatorName: 'Hội đồng Đánh giá',
    comments: '',
  });

  // Calculate weighted KPI Score from criteria
  // 35% Tiến độ & Khối lượng + 30% Chất lượng An toàn + 20% Kỷ luật Chuyên cần + 15% Tinh thần Sáng tạo
  const calculatedKpiScore = useMemo(() => {
    const score =
      formData.taskCompletion * 0.35 +
      formData.qualitySafety * 0.3 +
      formData.disciplineAttendance * 0.2 +
      formData.initiativeCollaboration * 0.15;
    return Math.round(score * 10) / 10;
  }, [formData.taskCompletion, formData.qualitySafety, formData.disciplineAttendance, formData.initiativeCollaboration]);

  // Determine Rating and Multiplier
  const { calculatedRating, calculatedMultiplier } = useMemo(() => {
    if (calculatedKpiScore >= 95) return { calculatedRating: 'A+' as const, calculatedMultiplier: 1.3 };
    if (calculatedKpiScore >= 85) return { calculatedRating: 'A' as const, calculatedMultiplier: 1.1 };
    if (calculatedKpiScore >= 70) return { calculatedRating: 'B' as const, calculatedMultiplier: 1.0 };
    if (calculatedKpiScore >= 50) return { calculatedRating: 'C' as const, calculatedMultiplier: 0.7 };
    return { calculatedRating: 'D' as const, calculatedMultiplier: 0.0 };
  }, [calculatedKpiScore]);

  const calculatedActualBonus = useMemo(() => {
    return Math.round(formData.targetBonusAmount * calculatedMultiplier);
  }, [formData.targetBonusAmount, calculatedMultiplier]);

  // Combined Employee + Review table data
  const evaluationList = useMemo(() => {
    return employees.map((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const review = reviews.find((r) => r.employeeId === emp.id && r.month === currentMonth);

      // Default review baseline if not yet evaluated
      const baseTargetBonus = emp.position.toLowerCase().includes('trưởng') || emp.position.toLowerCase().includes('giám') ? 2500000 : 1500000;
      const kpiScore = review?.kpiScore ?? 80;
      const rating = review?.rating ?? 'B';
      const multiplier = review?.bonusMultiplier ?? 1.0;
      const targetBonus = review?.targetBonusAmount ?? baseTargetBonus;
      const actualBonus = review?.actualBonusAmount ?? Math.round(targetBonus * multiplier);

      return {
        employee: emp,
        departmentName: dept?.name || 'Chưa phân bổ',
        review,
        hasReview: !!review,
        kpiScore,
        rating,
        multiplier,
        targetBonus,
        actualBonus,
        evaluatorName: review?.evaluatorName || 'Chưa đánh giá',
        comments: review?.comments || '',
        updatedAt: review?.updatedAt || '—',
      };
    });
  }, [employees, departments, reviews, currentMonth]);

  // Filtered list
  const filteredList = useMemo(() => {
    return evaluationList.filter((item) => {
      const matchesSearch =
        item.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDeptFilter === 'all' || item.employee.departmentId === selectedDeptFilter;
      const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter;
      return matchesSearch && matchesDept && matchesRating;
    });
  }, [evaluationList, searchTerm, selectedDeptFilter, ratingFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalCount = evaluationList.length;
    const evaluatedCount = evaluationList.filter((i) => i.hasReview).length;
    const totalBonusFund = evaluationList.reduce((sum, i) => sum + i.actualBonus, 0);
    const avgScore = totalCount > 0
      ? Math.round((evaluationList.reduce((sum, i) => sum + i.kpiScore, 0) / totalCount) * 10) / 10
      : 0;

    const countAplus = evaluationList.filter((i) => i.rating === 'A+').length;
    const countA = evaluationList.filter((i) => i.rating === 'A').length;
    const countB = evaluationList.filter((i) => i.rating === 'B').length;
    const countC = evaluationList.filter((i) => i.rating === 'C').length;
    const countD = evaluationList.filter((i) => i.rating === 'D').length;

    return {
      totalCount,
      evaluatedCount,
      totalBonusFund,
      avgScore,
      countAplus,
      countA,
      countB,
      countC,
      countD,
    };
  }, [evaluationList]);

  // Open Edit Modal
  const handleOpenEdit = (item: (typeof evaluationList)[0]) => {
    setEditingEmployee(item.employee);
    setEditingReview(item.review || null);

    if (item.review) {
      setFormData({
        taskCompletion: item.review.criteria?.taskCompletion ?? 85,
        qualitySafety: item.review.criteria?.qualitySafety ?? 85,
        disciplineAttendance: item.review.criteria?.disciplineAttendance ?? 85,
        initiativeCollaboration: item.review.criteria?.initiativeCollaboration ?? 85,
        targetBonusAmount: item.review.targetBonusAmount ?? 2000000,
        evaluatorName: item.review.evaluatorName || 'Ban Giám Đốc',
        comments: item.review.comments || '',
      });
    } else {
      const defaultTarget = item.employee.position.toLowerCase().includes('trưởng') || item.employee.position.toLowerCase().includes('giám') ? 2500000 : 1500000;
      setFormData({
        taskCompletion: 85,
        qualitySafety: 85,
        disciplineAttendance: 85,
        initiativeCollaboration: 85,
        targetBonusAmount: defaultTarget,
        evaluatorName: 'Ban Giám Đốc',
        comments: 'Hoàn thành tốt nhiệm vụ được giao trong tháng.',
      });
    }
    setIsModalOpen(true);
  };

  // Submit Evaluation
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const reviewPayload: PerformanceReview = {
      id: editingReview?.id || `rev-${Date.now()}-${editingEmployee.id}`,
      employeeId: editingEmployee.id,
      month: currentMonth,
      kpiScore: calculatedKpiScore,
      rating: calculatedRating,
      bonusMultiplier: calculatedMultiplier,
      targetBonusAmount: formData.targetBonusAmount,
      actualBonusAmount: calculatedActualBonus,
      criteria: {
        taskCompletion: formData.taskCompletion,
        qualitySafety: formData.qualitySafety,
        disciplineAttendance: formData.disciplineAttendance,
        initiativeCollaboration: formData.initiativeCollaboration,
      },
      evaluatorName: formData.evaluatorName,
      comments: formData.comments,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    updateReview(reviewPayload);
    setIsModalOpen(false);
    showToast(
      `Đã cập nhật KPI ${calculatedKpiScore}% (${calculatedRating}) cho ${editingEmployee.fullName}. Thưởng ${formatVND(calculatedActualBonus)} đã đồng bộ vào Bảng Lương!`,
      'success'
    );
  };

  // Export Excel (.xlsx) of KPI & Bonus
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Phòng ban',
      'Chức vụ',
      'Kỳ đánh giá',
      'Tiến độ & Khối lượng (35%)',
      'Chất lượng & An toàn (30%)',
      'Kỷ luật & Chuyên cần (20%)',
      'Tinh thần & Sáng tạo (15%)',
      'Điểm KPI Tổng (%)',
      'Xếp loại',
      'Hệ số thưởng KPI',
      'Mức thưởng cơ sở (VNĐ)',
      'Thưởng KPI thực nhận (VNĐ)',
      'Người đánh giá',
      'Nhận xét',
    ];

    const rows = filteredList.map((item, idx) => [
      idx + 1,
      item.employee.code,
      item.employee.fullName,
      item.departmentName,
      item.employee.position,
      currentMonth,
      item.review?.criteria?.taskCompletion ?? 80,
      item.review?.criteria?.qualitySafety ?? 80,
      item.review?.criteria?.disciplineAttendance ?? 80,
      item.review?.criteria?.initiativeCollaboration ?? 80,
      item.kpiScore,
      item.rating,
      item.multiplier,
      item.targetBonus,
      item.actualBonus,
      item.evaluatorName,
      item.comments || '',
    ]);

    const totalBonusSum = filteredList.reduce((s, i) => s + i.actualBonus, 0);

    // Summary row
    rows.push([
      'TỔNG CỘNG',
      '',
      `${filteredList.length} nhân sự`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      Math.round(filteredList.reduce((s, i) => s + i.kpiScore, 0) / (filteredList.length || 1)),
      '',
      '',
      filteredList.reduce((s, i) => s + i.targetBonus, 0),
      totalBonusSum,
      '',
      '',
    ]);

    exportToExcel({
      fileName: `Bang_Danh_Gia_KPI_Thuong_${currentMonth}.xlsx`,
      sheetName: 'DanhGiaKPI',
      title: `BẢNG ĐÁNH GIÁ HIỆU SUẤT KPI VÀ KHEN THƯỞNG - THÁNG ${currentMonth}`,
      subtitles: [
        `Công ty Cổ phần Xây dựng | Tổng tiền thưởng: ${totalBonusSum.toLocaleString('vi-VN')} VNĐ | Số nhân sự: ${filteredList.length}`,
        `Chế độ: ${settings.enableKpiBonus ? 'Đang BẬT áp dụng vào bảng lương' : 'Đang TẮT (Chưa tính vào bảng lương)'}`,
      ],
      headers,
      rows,
    });
    showToast('Đã xuất file Excel bảng KPI & thưởng thành công!');
  };

  // Export PDF (.pdf) of KPI & Bonus
  const handleExportPDF = () => {
    const totalBonusSum = filteredList.reduce((s, i) => s + i.actualBonus, 0);
    const headers = [
      'STT',
      'Ma NV',
      'Ho va ten',
      'Phong ban',
      'Chuc vu',
      'Diem KPI',
      'Xep loai',
      'He so',
      'Thuong co so',
      'Thuc nhan (VND)',
    ];

    const rows = filteredList.map((item, idx) => [
      idx + 1,
      item.employee.code,
      item.employee.fullName,
      item.departmentName,
      item.employee.position,
      `${item.kpiScore}%`,
      item.rating,
      `${item.multiplier}x`,
      item.targetBonus.toLocaleString('vi-VN'),
      item.actualBonus.toLocaleString('vi-VN'),
    ]);

    exportToPDF({
      fileName: `Bang_Danh_Gia_KPI_Thuong_${currentMonth}.pdf`,
      title: `BANG DANH GIA KPI VA KHEN THUONG - THANG ${currentMonth}`,
      subtitles: [
        `Ky: ${currentMonth} | Tong nhan su: ${filteredList.length} | Tong tien thuong: ${totalBonusSum.toLocaleString('vi-VN')} VND`,
      ],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất file PDF bảng KPI & thưởng thành công!');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Phòng ban',
      'Chức vụ',
      'Kỳ đánh giá',
      'Tiến độ & Khối lượng (35%)',
      'Chất lượng & An toàn (30%)',
      'Kỷ luật & Chuyên cần (20%)',
      'Tinh thần & Sáng tạo (15%)',
      'Điểm KPI Tổng (%)',
      'Xếp loại',
      'Hệ số thưởng KPI',
      'Mức thưởng cơ sở (VNĐ)',
      'Thưởng KPI thực nhận (VNĐ)',
      'Người đánh giá',
      'Nhận xét',
    ];

    const rows = filteredList.map((item, idx) => [
      idx + 1,
      item.employee.code,
      `"${item.employee.fullName}"`,
      `"${item.departmentName}"`,
      `"${item.employee.position}"`,
      currentMonth,
      item.review?.criteria?.taskCompletion ?? 80,
      item.review?.criteria?.qualitySafety ?? 80,
      item.review?.criteria?.disciplineAttendance ?? 80,
      item.review?.criteria?.initiativeCollaboration ?? 80,
      item.kpiScore,
      item.rating,
      item.multiplier,
      item.targetBonus,
      item.actualBonus,
      `"${item.evaluatorName}"`,
      `"${(item.comments || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Danh_Gia_KPI_Thuong_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất báo cáo đánh giá KPI & Thưởng ra file CSV!', 'success');
  };

  // Badge renderer
  const renderRatingBadge = (rating: 'A+' | 'A' | 'B' | 'C' | 'D') => {
    switch (rating) {
      case 'A+':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold text-xs">
            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
            A+ (Xuất sắc · 130%)
          </span>
        );
      case 'A':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold text-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            A (Tốt · 110%)
          </span>
        );
      case 'B':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-full font-semibold text-xs">
            B (Đạt · 100%)
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-900 border border-orange-300 px-2 py-0.5 rounded-full font-medium text-xs">
            C (Cần cải thiện · 70%)
          </span>
        );
      case 'D':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-full font-medium text-xs">
            D (Không đạt · 0%)
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Banner & Module Info */}
      <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-indigo-900 text-white rounded-xl p-5 shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Đánh Giá Hiệu Suất & Thưởng KPI (Performance Review)
              </h1>
              <p className="text-xs text-blue-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Điểm số KPI liên kết trực tiếp vào cột <strong>"Thưởng hiệu quả"</strong> và <strong>"Tổng thu nhập Gross"</strong> trên Bảng Lương tháng {currentMonth}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Quick Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-xs">
            <Calendar className="w-4 h-4 text-blue-200" />
            <span className="text-blue-100 font-medium">Kỳ đánh giá:</span>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-white text-slate-900 font-bold px-2 py-0.5 rounded border border-slate-300 text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setActiveMainTab('compensation');
              setActiveSubTab('payroll');
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Chuyển sang Bảng Tiền Lương để xem tiền thưởng KPI đã được cộng dồn"
          >
            <DollarSign className="w-4 h-4" />
            <span>Xem Bảng Lương ({currentMonth})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Informative Status Banner for KPI ON/OFF state */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs ${
          !settings.enableKpiBonus
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Sparkles className={`w-5 h-5 shrink-0 ${!settings.enableKpiBonus ? 'text-amber-600' : 'text-emerald-600'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {settings.enableKpiBonus
                  ? 'Chế độ Đánh giá & Thưởng KPI: ĐANG BẬT'
                  : 'Chế độ Đánh giá & Thưởng KPI: ĐANG TẮT (Chưa áp dụng)'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  settings.enableKpiBonus
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {settings.enableKpiBonus ? 'Áp dụng vào bảng lương' : 'Hiện chưa áp dụng'}
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${!settings.enableKpiBonus ? 'text-amber-800' : 'text-emerald-800'}`}>
              {settings.enableKpiBonus
                ? 'Điểm đánh giá KPI và tiền thưởng hiệu quả của từng nhân sự đang được tính tự động vào cột "Thưởng hiệu quả" và "Tổng Gross" trong Bảng Lương.'
                : 'Do hiện tại công ty chưa áp dụng KPI và thưởng, toàn bộ thưởng KPI trong bảng lương đang = 0đ. Bạn vẫn có thể nhập liệu đánh giá hoặc cấu hình tiêu chí sẵn tại đây, và bấm BẬT bất cứ lúc nào trong tương lai để kích hoạt tính thưởng.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleKpiBonus()}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer ${
              settings.enableKpiBonus
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {settings.enableKpiBonus ? (
              <ToggleRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-white" />
            )}
            <span>{settings.enableKpiBonus ? 'Tắt áp dụng KPI & Thưởng' : 'Bật áp dụng KPI & Thưởng ngay'}</span>
          </button>
        </div>
      </div>

      {/* KPI Policy & Rating Formula Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quy Chế Tính Điểm KPI & Hệ Số Thưởng Doanh Nghiệp
            </h2>
          </div>
          <div className="text-[11px] text-slate-500">
            Công thức: <strong>Điểm KPI = Tiến độ (35%) + Chất lượng (30%) + Kỷ luật (20%) + Sáng tạo (15%)</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 text-xs">
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-center">
            <div className="font-bold text-amber-900 text-sm">Hạng A+ (≥ 95%)</div>
            <div className="text-[11px] font-semibold text-amber-700 mt-0.5">Thưởng: 130% định mức</div>
            <div className="text-[10px] text-amber-600 mt-1">Xuất sắc vượt chỉ tiêu</div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-center">
            <div className="font-bold text-emerald-900 text-sm">Hạng A (85% - 94%)</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">Thưởng: 110% định mức</div>
            <div className="text-[10px] text-emerald-600 mt-1">Hoàn thành rất tốt</div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-center">
            <div className="font-bold text-blue-900 text-sm">Hạng B (70% - 84%)</div>
            <div className="text-[11px] font-semibold text-blue-700 mt-0.5">Thưởng: 100% định mức</div>
            <div className="text-[10px] text-blue-600 mt-1">Đạt chỉ tiêu tiêu chuẩn</div>
          </div>

          <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-2.5 text-center">
            <div className="font-bold text-orange-900 text-sm">Hạng C (50% - 69%)</div>
            <div className="text-[11px] font-semibold text-orange-700 mt-0.5">Thưởng: 70% định mức</div>
            <div className="text-[10px] text-orange-600 mt-1">Cần cải thiện năng suất</div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5 text-center col-span-2 sm:col-span-1">
            <div className="font-bold text-rose-900 text-sm">Hạng D (&lt; 50%)</div>
            <div className="text-[11px] font-semibold text-rose-700 mt-0.5">Thưởng: 0% (Không thưởng)</div>
            <div className="text-[10px] text-rose-600 mt-1">Chưa đạt yêu cầu</div>
          </div>
        </div>
      </div>

      {/* KPI Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng quỹ thưởng KPI</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-2">
            {formatVND(stats.totalBonusFund)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tự động liên kết vào bảng lương</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Điểm KPI trung bình</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-900 mt-2">
            {stats.avgScore}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Đạt mức: </span>
            <strong className="text-blue-800">Loại {stats.avgScore >= 85 ? 'A' : 'B'}</strong>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Phân bố loại A+ & A</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-2">
            {stats.countAplus + stats.countA}{' '}
            <span className="text-xs font-normal text-slate-500">/ {stats.totalCount} NV</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            A+: {stats.countAplus} NV · A: {stats.countA} NV · B: {stats.countB} NV
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tiến độ đánh giá</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-900 mt-2">
            {stats.evaluatedCount} / {stats.totalCount}{' '}
            <span className="text-xs font-normal text-emerald-600 font-sans">
              ({Math.round((stats.evaluatedCount / (stats.totalCount || 1)) * 100)}%)
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã khóa dữ liệu tháng {currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã, họ tên, chức danh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-blue-500"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-blue-500 cursor-pointer"
            >
              <option value="all">Tất cả phòng ban ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-blue-500 cursor-pointer"
            >
              <option value="all">Tất cả xếp loại KPI</option>
              <option value="A+">Hạng A+ (≥ 95% · 1.3x)</option>
              <option value="A">Hạng A (85 - 94% · 1.1x)</option>
              <option value="B">Hạng B (70 - 84% · 1.0x)</option>
              <option value="C">Hạng C (50 - 69% · 0.7x)</option>
              <option value="D">Hạng D (&lt; 50% · 0.0x)</option>
            </select>
          </div>

          {/* Export Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Xuất bảng đánh giá KPI ra Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Xuất bảng đánh giá KPI ra PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất PDF (.pdf)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
              title="Xuất CSV"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Evaluation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3">Nhân sự & Chức danh</th>
                <th className="py-2.5 px-3">Phòng ban</th>
                <th className="py-2.5 px-3 text-center" title="Tiến độ 35% | Chất lượng 30% | Kỷ luật 20% | Sáng tạo 15%">
                  Chi tiết 4 tiêu chí
                </th>
                <th className="py-2.5 px-3 text-center">Điểm KPI</th>
                <th className="py-2.5 px-3 text-center">Xếp loại</th>
                <th className="py-2.5 px-3 text-center">Hệ số</th>
                <th className="py-2.5 px-3 text-right">Mức thưởng cơ sở</th>
                <th className="py-2.5 px-3 text-right bg-emerald-50/50 text-emerald-950 font-bold">
                  Thưởng thực nhận
                </th>
                <th className="py-2.5 px-3">Nhận xét đánh giá</th>
                <th className="py-2.5 px-3 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item, idx) => {
                const crit = item.review?.criteria;
                return (
                  <tr key={item.employee.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.employee.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.employee.code} · <span className="font-sans text-slate-700">{item.employee.position}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{item.departmentName}</td>
                    <td className="py-3 px-3 text-center">
                      {crit ? (
                        <div className="flex items-center justify-center space-x-1.5 text-[10px] font-mono">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700" title="Tiến độ & Khối lượng (35%)">
                            TĐ: {crit.taskCompletion}
                          </span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700" title="Chất lượng & An toàn (30%)">
                            CL: {crit.qualitySafety}
                          </span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700" title="Kỷ luật & Chuyên cần (20%)">
                            KL: {crit.disciplineAttendance}
                          </span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700" title="Tinh thần & Phối hợp (15%)">
                            ST: {crit.initiativeCollaboration}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Mặc định</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.kpiScore}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">{renderRatingBadge(item.rating)}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-900">
                      {item.multiplier}x
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatVND(item.targetBonus)}
                    </td>
                    <td className="py-3 px-3 text-right bg-emerald-50/50 font-mono font-bold text-emerald-800 text-sm">
                      {formatVND(item.actualBonus)}
                    </td>
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="text-[11px] text-slate-700 line-clamp-2" title={item.comments}>
                        {item.comments || <span className="text-slate-400 italic">Chưa có ghi chú</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Người ĐG: {item.evaluatorName}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold text-xs flex items-center justify-center gap-1 mx-auto cursor-pointer border border-blue-200 transition-colors"
                        title="Đánh giá hoặc điều chỉnh tiêu chí KPI cho nhân sự"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Hiển thị <strong>{filteredList.length}</strong> / {employees.length} nhân sự · Đã liên kết thưởng tự động sang Bảng Lương tháng {currentMonth}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Tổng thưởng KPI toàn công ty:</span>
            <strong className="text-emerald-700 font-mono text-sm">{formatVND(stats.totalBonusFund)}</strong>
          </div>
        </div>
      </div>

      {/* Edit Evaluation Modal */}
      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1E3A8A] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Đánh Giá KPI Tháng {currentMonth}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Nhân sự: <strong className="text-white">{editingEmployee.fullName}</strong> ({editingEmployee.code}) · {editingEmployee.position}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="p-5 space-y-4 text-xs">
              {/* Live KPI & Bonus Banner */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Điểm KPI Tổng Hợp:</span>
                  <div className="text-2xl font-bold font-mono text-blue-900">
                    {calculatedKpiScore}%
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-slate-500 block text-[11px]">Xếp loại & Hệ số:</span>
                  <div className="mt-1">{renderRatingBadge(calculatedRating)}</div>
                  <span className="text-[11px] font-mono font-bold text-blue-700 block mt-0.5">
                    Hệ số {calculatedMultiplier}x
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Thưởng KPI thực nhận:</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    {formatVND(calculatedActualBonus)}
                  </div>
                  <span className="text-[10px] text-emerald-600 block">Đồng bộ sang Bảng Lương</span>
                </div>
              </div>

              {/* 4 Criteria Sliders / Inputs */}
              <div className="space-y-3 pt-1">
                <label className="font-bold text-slate-800 block text-xs border-b border-slate-200 pb-1">
                  Đánh giá 4 tiêu chí thành phần (Thang điểm 0 - 100):
                </label>

                {/* Criterion 1 */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>1. Tiến độ & Khối lượng công việc (Trọng số 35%)</span>
                    <span className="font-mono font-bold text-blue-800 text-sm">{formData.taskCompletion} đ</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.taskCompletion}
                    onChange={(e) => setFormData({ ...formData, taskCompletion: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0: Chậm tiến độ</span>
                    <span>50: Đạt 50%</span>
                    <span>85: Đúng hạn</span>
                    <span>100: Vượt mức</span>
                  </div>
                </div>

                {/* Criterion 2 */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>2. Chất lượng thi công & An toàn lao động (Trọng số 30%)</span>
                    <span className="font-mono font-bold text-blue-800 text-sm">{formData.qualitySafety} đ</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.qualitySafety}
                    onChange={(e) => setFormData({ ...formData, qualitySafety: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0: Có sự cố / lỗi</span>
                    <span>80: Đạt chuẩn KT</span>
                    <span>100: Tuyệt đối an toàn & đẹp</span>
                  </div>
                </div>

                {/* Criterion 3 */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>3. Kỷ luật & Chuyên cần (Trọng số 20%)</span>
                    <span className="font-mono font-bold text-blue-800 text-sm">{formData.disciplineAttendance} đ</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.disciplineAttendance}
                    onChange={(e) => setFormData({ ...formData, disciplineAttendance: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0: Đi muộn / vi phạm</span>
                    <span>85: Chuyên cần tốt</span>
                    <span>100: Điểm chuyên cần tối đa</span>
                  </div>
                </div>

                {/* Criterion 4 */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>4. Tinh thần trách nhiệm & Sáng tạo (Trọng số 15%)</span>
                    <span className="font-mono font-bold text-blue-800 text-sm">{formData.initiativeCollaboration} đ</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.initiativeCollaboration}
                    onChange={(e) => setFormData({ ...formData, initiativeCollaboration: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0: Thụ động</span>
                    <span>80: Phối hợp tốt</span>
                    <span>100: Có sáng kiến cải tiến</span>
                  </div>
                </div>
              </div>

              {/* Bonus Base Amount & Evaluator Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mức thưởng cơ sở mục tiêu (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="100000"
                    value={formData.targetBonusAmount}
                    onChange={(e) => setFormData({ ...formData, targetBonusAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">
                    Thực nhận = {formatNumberVN(formData.targetBonusAmount)} x {calculatedMultiplier} = {formatNumberVN(calculatedActualBonus)} đ
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Người / Hội đồng đánh giá
                  </label>
                  <input
                    type="text"
                    value={formData.evaluatorName}
                    onChange={(e) => setFormData({ ...formData, evaluatorName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 focus:outline-blue-500"
                    placeholder="VD: Ban Giám Đốc, Trưởng bộ phận..."
                    required
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nhận xét & Đánh giá cụ thể
                </label>
                <textarea
                  rows={2}
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-blue-500"
                  placeholder="Ghi chú thành tích, điểm cộng hoặc các lưu ý cần khắc phục..."
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu & Đồng bộ sang Bảng Lương</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
