import React, { useState, useMemo } from 'react';
import { useHRM } from '../context/HRMContext';
import { Department, JobPosition } from '../types/hrm';
import {
  Building2,
  Users,
  MapPin,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Briefcase,
  Layers,
  Award,
  CheckCircle2,
  Tag,
  Filter,
} from 'lucide-react';

export const DepartmentsView: React.FC = () => {
  const {
    departments,
    jobPositions,
    employees,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addJobPosition,
    updateJobPosition,
    deleteJobPosition,
    setActiveMainTab,
    showToast,
  } = useHRM();

  // Sub-view tab switcher: Phòng ban vs Vị trí việc làm
  const [activeSubView, setActiveSubView] = useState<'departments' | 'positions'>('departments');

  const [searchTerm, setSearchTerm] = useState('');
  
  // Department Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    managerName: '',
    location: '',
  });

  // Job Position Modal State
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<JobPosition | null>(null);
  const [deletingPos, setDeletingPos] = useState<JobPosition | null>(null);

  const [posFormData, setPosFormData] = useState({
    code: '',
    title: '',
    departmentId: '',
    rank: 'C',
    description: '',
  });

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.managerName && d.managerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.location && d.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  // Filtered job positions
  const filteredPositions = useMemo(() => {
    return jobPositions.filter(
      (p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.rank && p.rank.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [jobPositions, searchTerm]);

  // Statistics
  const totalEmployeesInDepts = employees.length;
  const largestDept = useMemo(() => {
    if (departments.length === 0) return null;
    let maxDept = departments[0];
    let maxCount = -1;
    departments.forEach((d) => {
      const count = employees.filter((e) => e.departmentId === d.id).length;
      if (count > maxCount) {
        maxCount = count;
      }
      maxDept = d;
    });
    return { dept: maxDept, count: maxCount };
  }, [departments, employees]);

  // Department Handlers
  const handleOpenAddDept = () => {
    const nextIdx = departments.length + 1;
    setFormData({
      code: `PB-${String(nextIdx).padStart(2, '0')}`,
      name: '',
      managerName: '',
      location: 'Tầng 5, Tòa Nhà Bitexco, Q.1, TP.HCM',
    });
    setEditingDept(null);
    setIsModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      managerName: dept.managerName || '',
      location: dept.location || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên phòng ban', 'error');
      return;
    }

    if (editingDept) {
      updateDepartment({
        ...editingDept,
        ...formData,
      });
    } else {
      addDepartment({
        ...formData,
      });
    }
    setIsModalOpen(false);
  };

  const handleConfirmDeleteDept = () => {
    if (!deletingDept) return;
    deleteDepartment(deletingDept.id);
    setDeletingDept(null);
  };

  // Job Position Handlers
  const handleOpenAddPos = () => {
    const nextNum = jobPositions.length + 1;
    setPosFormData({
      code: `VT-${String(nextNum).padStart(2, '0')}`,
      title: '',
      departmentId: '',
      rank: 'C',
      description: '',
    });
    setEditingPos(null);
    setIsPosModalOpen(true);
  };

  const handleOpenEditPos = (pos: JobPosition) => {
    setEditingPos(pos);
    setPosFormData({
      code: pos.code,
      title: pos.title,
      departmentId: pos.departmentId || '',
      rank: pos.rank || 'C',
      description: pos.description || '',
    });
    setIsPosModalOpen(true);
  };

  const handleSubmitPos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posFormData.title.trim()) {
      showToast('Vui lòng nhập tên vị trí việc làm', 'error');
      return;
    }
    if (!posFormData.code.trim()) {
      showToast('Vui lòng nhập mã vị trí viết tắt', 'error');
      return;
    }

    if (editingPos) {
      updateJobPosition({
        ...editingPos,
        ...posFormData,
      });
    } else {
      addJobPosition({
        ...posFormData,
      });
    }
    setIsPosModalOpen(false);
  };

  const handleConfirmDeletePos = () => {
    if (!deletingPos) return;
    deleteJobPosition(deletingPos.id);
    setDeletingPos(null);
  };

  const getRankBadgeClass = (rank?: string) => {
    switch (rank?.toUpperCase()) {
      case 'A':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'D':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-5">
      {/* Top Header Card & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1E3A8A]" />
            Cơ Cấu Tổ Chức & Vị Trí Việc Làm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý sơ đồ phòng ban và danh mục vị trí việc làm (Chỉ huy trưởng, Kỹ thuật, Kế toán, Hành chính, Vật tư, Thủ kho, Thủ quỹ, Lái xe...).
          </p>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveSubView('departments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubView === 'departments'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Phòng Ban</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {departments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('positions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubView === 'positions'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-700" />
            <span>Vị Trí Việc Làm</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
              {jobPositions.length}
            </span>
          </button>
        </div>
      </div>

      {/* SUBVIEW 1: PHÒNG BAN */}
      {activeSubView === 'departments' && (
        <>
          {/* Action & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng ban, mã PB, địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500"
              />
            </div>

            <button
              onClick={handleOpenAddDept}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E3A8A] hover:bg-blue-800 text-white shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm phòng ban mới</span>
            </button>
          </div>

          {/* KPI Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Tổng số phòng ban</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {departments.length} <span className="text-xs font-normal text-slate-400">đơn vị</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Hoạt động chính thức</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Tổng số nhân sự trực thuộc</div>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
                {totalEmployeesInDepts} <span className="text-xs font-normal text-blue-500">nhân viên</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Đã phân bổ đầy đủ</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Phòng ban có quy mô lớn nhất</div>
              <div className="text-sm font-bold text-slate-800 truncate mt-1">
                {largestDept?.dept.name || 'Chưa có'}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {largestDept?.count || 0} nhân sự trực thuộc
              </div>
            </div>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => {
              const deptEmps = employees.filter((e) => e.departmentId === dept.id);

              return (
                <div
                  key={dept.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Code & Action icons */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {dept.code}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditDept(dept)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Sửa tên hoặc thông tin phòng ban"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingDept(dept)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Xóa phòng ban này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Department Name */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {dept.name}
                    </h3>

                    {/* Details */}
                    <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500">Phụ trách:</span>
                        <span className="font-semibold text-slate-800">
                          {dept.managerName || 'Chưa bổ nhiệm'}
                        </span>
                      </div>

                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-500 line-clamp-2">
                          {dept.location || 'Chưa cập nhật địa điểm'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats & Jump to Employees */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-slate-800 font-mono">{deptEmps.length}</span>
                      <span>nhân sự</span>
                    </div>

                    <button
                      onClick={() => setActiveMainTab('employees')}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform cursor-pointer"
                    >
                      <span>Xem nhân sự</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* SUBVIEW 2: VỊ TRÍ VIỆC LÀM (Job Positions) */}
      {activeSubView === 'positions' && (
        <>
          {/* Action & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên vị trí, mã viết tắt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenAddPos}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E3A8A] hover:bg-blue-800 text-white shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vị trí việc làm mới</span>
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start space-x-3 text-xs text-blue-950">
            <Briefcase className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-900">
                Danh mục Vị trí việc làm chuẩn hóa cho toàn doanh nghiệp & công trường
              </div>
              <p className="text-[11px] text-blue-800/90 mt-0.5">
                Bao gồm các vị trí cốt lõi: <strong>Chỉ huy trưởng, Kỹ thuật, Kế toán, Hành chính, Vật tư, Thủ kho, Thủ quỹ, Lái xe...</strong> Khi chỉnh sửa hồ sơ nhân sự, danh sách này sẽ tự động hiển thị dạng <strong>list sổ xuống</strong> để người dùng lựa chọn nhanh chóng và đồng bộ.
              </p>
            </div>
          </div>

          {/* Positions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredPositions.map((pos) => {
              const matchedEmps = employees.filter(
                (e) => e.position.toLowerCase() === pos.title.toLowerCase() || e.position.toLowerCase().includes(pos.title.toLowerCase())
              );
              const dept = departments.find((d) => d.id === pos.departmentId);

              return (
                <div
                  key={pos.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {pos.code}
                        </span>
                        {pos.rank && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRankBadgeClass(pos.rank)}`}>
                            Hạng {pos.rank}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditPos(pos)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Sửa vị trí việc làm"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPos(pos)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Xóa vị trí này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>{pos.title}</span>
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[32px]">
                      {pos.description || 'Chức danh vị trí việc làm thuộc hệ thống nhân sự.'}
                    </p>

                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{dept ? dept.name : 'Áp dụng toàn công ty'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Nhân sự hiện tại:</span>
                    <span className="font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {matchedEmps.length} người
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODAL 1: Thêm / Sửa Phòng Ban */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingDept ? 'Chỉnh Sửa Thông Tin Phòng Ban' : 'Thêm Phòng Ban Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDept} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">Mã phòng ban</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-semibold"
                    placeholder="VD: PB-01"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Tên phòng ban</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-slate-900"
                    placeholder="VD: Phòng Kỹ Thuật & Giám Sát"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Trưởng phòng / Người phụ trách
                </label>
                <input
                  type="text"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Địa điểm làm việc / Khu vực tầng
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  placeholder="VD: Tầng 5, Tòa Nhà Bitexco, Q.1, TP.HCM"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingDept ? 'Lưu thay đổi' : 'Tạo phòng ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Thêm / Sửa Vị Trí Việc Làm */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-700" />
                <span>{editingPos ? 'Chỉnh Sửa Vị Trí Việc Làm' : 'Thêm Vị Trí Việc Làm Mới'}</span>
              </h3>
              <button
                onClick={() => setIsPosModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPos} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">Mã viết tắt</label>
                  <input
                    type="text"
                    value={posFormData.code}
                    onChange={(e) => setPosFormData({ ...posFormData, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-semibold"
                    placeholder="VD: CHT, KT..."
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Tên vị trí việc làm</label>
                  <input
                    type="text"
                    value={posFormData.title}
                    onChange={(e) => setPosFormData({ ...posFormData, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-slate-900"
                    placeholder="VD: Chỉ huy trưởng / Kỹ thuật / Kế toán..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Hạng chức danh phụ cấp
                  </label>
                  <select
                    value={posFormData.rank}
                    onChange={(e) => setPosFormData({ ...posFormData, rank: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="A">Hạng A (Lãnh đạo, CHT, Giám đốc)</option>
                    <option value="B">Hạng B (Kỹ thuật, Kỹ sư, Trưởng nhóm)</option>
                    <option value="C">Hạng C (Kế toán, Hành chính, Vật tư)</option>
                    <option value="D">Hạng D (Thủ kho, Thủ quỹ, Lái xe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Thuộc phòng ban
                  </label>
                  <select
                    value={posFormData.departmentId}
                    onChange={(e) => setPosFormData({ ...posFormData, departmentId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="">Dùng chung toàn công ty</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mô tả công việc & Trách nhiệm
                </label>
                <textarea
                  rows={3}
                  value={posFormData.description}
                  onChange={(e) => setPosFormData({ ...posFormData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  placeholder="Mô tả tóm tắt nhiệm vụ công việc chính..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPosModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingPos ? 'Lưu thay đổi' : 'Tạo vị trí việc làm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Department */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-center font-bold text-slate-900 text-sm mb-1">
              Xác Nhận Xóa Phòng Ban?
            </h3>
            <p className="text-center text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa phòng ban{' '}
              <strong className="text-red-600">"{deletingDept.name}"</strong>?
              {employees.filter((e) => e.departmentId === deletingDept.id).length > 0 && (
                <span className="block mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  Lưu ý: Có{' '}
                  {employees.filter((e) => e.departmentId === deletingDept.id).length} nhân sự
                  đang thuộc phòng này. Hệ thống sẽ tự động chuyển các nhân sự sang phòng ban khác để
                  tránh mất dữ liệu.
                </span>
              )}
            </p>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="w-1/2 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDept}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Job Position */}
      {deletingPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-center font-bold text-slate-900 text-sm mb-1">
              Xác Nhận Xóa Vị Trí Việc Làm?
            </h3>
            <p className="text-center text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa vị trí việc làm{' '}
              <strong className="text-red-600">"{deletingPos.title}"</strong> ({deletingPos.code})?
            </p>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setDeletingPos(null)}
                className="w-1/2 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePos}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
