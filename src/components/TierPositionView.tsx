import React, { useState, useMemo } from 'react';
import { useHRM } from '../context/HRMContext';
import { Employee } from '../types/hrm';
import { formatNumberVN } from '../utils/payrollCalculator';
import {
  Award,
  Briefcase,
  TrendingUp,
  Users,
  HandCoins,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  X,
  Search,
  Building,
  Info,
  DollarSign,
  Plus,
} from 'lucide-react';

export const TierPositionView: React.FC = () => {
  const { grades, employees, departments, updateEmployeeSalaryConfig, showToast } = useHRM();

  const [activeTab, setActiveTab] = useState<'grades_scale' | 'negotiated_responsibility'>('grades_scale');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form state for editing salary mode & responsibility allowance
  const [formSalaryType, setFormSalaryType] = useState<'scale' | 'negotiated'>('scale');
  const [formNegotiatedType, setFormNegotiatedType] = useState<'monthly' | 'daily'>('monthly');
  const [formNegotiatedSalary, setFormNegotiatedSalary] = useState<number>(15000000);
  const [formNegotiatedDailyRate, setFormNegotiatedDailyRate] = useState<number>(576923);
  const [formResponsibilityAllowance, setFormResponsibilityAllowance] = useState<number>(0);

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormSalaryType(emp.salaryType || 'scale');
    setFormNegotiatedType(emp.negotiatedType || 'monthly');
    const salary = emp.negotiatedSalary || 15000000;
    setFormNegotiatedSalary(salary);
    setFormNegotiatedDailyRate(emp.negotiatedDailyRate || Math.round(salary / 26));
    setFormResponsibilityAllowance(emp.responsibilityAllowance || 0);
  };

  const handleSaveSalaryConfig = () => {
    if (!editingEmp) return;
    updateEmployeeSalaryConfig(editingEmp.id, {
      salaryType: formSalaryType,
      negotiatedType: formSalaryType === 'negotiated' ? formNegotiatedType : undefined,
      negotiatedSalary: formSalaryType === 'negotiated' ? formNegotiatedSalary : undefined,
      negotiatedDailyRate: formSalaryType === 'negotiated' && formNegotiatedType === 'daily' ? formNegotiatedDailyRate : undefined,
      responsibilityAllowance: formResponsibilityAllowance,
    });
    setEditingEmp(null);
  };

  // Filtered employees for negotiated & responsibility tab
  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Statistics
  const negotiatedCount = useMemo(
    () => employees.filter((e) => e.salaryType === 'negotiated').length,
    [employees]
  );
  const totalResponsibility = useMemo(
    () => employees.reduce((sum, e) => sum + (e.responsibilityAllowance || 0), 0),
    [employees]
  );

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#1E3A8A]" />
            Bậc Lương Vị Trí, Lương Thoả Thuận & Phụ Cấp Trách Nhiệm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy chuẩn lộ trình 8 bậc lương theo ngạch và chế độ linh hoạt: Lương thoả thuận & Phụ cấp trách nhiệm cho quản lý, chuyên gia.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveTab('grades_scale')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'grades_scale'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Thang 8 Bậc Vị Trí</span>
          </button>

          <button
            onClick={() => setActiveTab('negotiated_responsibility')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'negotiated_responsibility'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5 text-blue-700" />
            <span>Lương Thoả Thuận & Phụ Cấp Trách Nhiệm</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
              Tùy chọn mới
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Thang 8 Bậc Vị Trí */}
      {activeTab === 'grades_scale' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {grades.map((grade) => {
            const empInGrade = employees.filter((e) => e.gradeId === grade.id);

            return (
              <div
                key={grade.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{grade.name}</h3>
                    <p className="text-[11px] text-slate-500">Mã: {grade.code} · {grade.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-blue-800 bg-blue-100/60 px-2.5 py-1 rounded-full">
                      {empInGrade.length} nhân sự
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Lộ trình 8 bậc lương (Cơ bản + Năng lực):
                  </div>

                  <div className="space-y-1.5">
                    {grade.coefficients.map((coeff, idx) => {
                      const tier = idx + 1;
                      const base = Math.round(grade.standardBaseRate * coeff);
                      const comp = grade.competencySalaries[idx] || 0;
                      const totalTier = base + comp;
                      const activeCount = empInGrade.filter((e) => e.tierIndex === tier && e.salaryType !== 'negotiated').length;

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                            activeCount > 0
                              ? 'bg-blue-50/50 border-blue-200 font-medium'
                              : 'bg-white border-slate-100 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-14 font-bold text-slate-800">Bậc {tier}:</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              HS {coeff.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 font-mono tabular-nums">
                            <span className="text-slate-500 text-[11px]">
                              Lương: {formatNumberVN(base)} đ
                            </span>
                            {comp > 0 && (
                              <span className="text-blue-700 text-[11px]">
                                + {formatNumberVN(comp)} đ năng lực
                              </span>
                            )}
                            <span className="font-bold text-slate-900 min-w-[90px] text-right">
                              {formatNumberVN(totalTier)} đ
                            </span>
                            {activeCount > 0 && (
                              <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                                {activeCount} NV
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Tùy Chọn Lương Thỏa Thuận & Phụ Cấp Trách Nhiệm */}
      {activeTab === 'negotiated_responsibility' && (
        <div className="space-y-5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
                  Nhân sự Lương Thoả Thuận
                </span>
                <HandCoins className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-900 tabular-nums">
                {negotiatedCount} nhân sự
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Không theo thang 8 bậc truyền thống</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-800">
                  Tổng Quỹ Phụ Cấp Trách Nhiệm
                </span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-700 tabular-nums">
                {formatNumberVN(totalResponsibility)} đ / tháng
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Chi trả cho vị trí chủ chốt & quản lý</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                  Khung Định Mức Tham Chiếu
                </span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs text-slate-700 space-y-0.5 mt-1 font-medium">
                <div>• Chỉ huy trưởng / GĐ: <strong>3.000.000 - 10.000.000 đ</strong></div>
                <div>• Trưởng phòng / Kỹ sư chính: <strong>1.500.000 - 4.000.000 đ</strong></div>
              </div>
            </div>
          </div>

          {/* Quick Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhân sự cần cấu hình lương thoả thuận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-500 w-72"
              />
            </div>
            <div className="text-xs text-slate-500">
              Nhấp nút <strong>"Thiết lập lương"</strong> ở từng nhân sự để chọn Lương thỏa thuận và Phụ cấp trách nhiệm.
            </div>
          </div>

          {/* Employees Table with Salary Mode & Responsibility Allowance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                    <th className="py-3 px-3 text-center w-10">STT</th>
                    <th className="py-3 px-3 w-24">Mã NV</th>
                    <th className="py-3 px-4 w-48">Họ và tên</th>
                    <th className="py-3 px-3">Phòng ban</th>
                    <th className="py-3 px-3">Chức danh / Vị trí</th>
                    <th className="py-3 px-3 text-center">Hình thức lương</th>
                    <th className="py-3 px-3 text-right">Mức lương cơ bản / Thỏa thuận</th>
                    <th className="py-3 px-3 text-right">Phụ cấp trách nhiệm</th>
                    <th className="py-3 px-4 text-right font-bold text-blue-900 bg-blue-50/50">
                      Tổng cơ sở (Lương + Trách nhiệm)
                    </th>
                    <th className="py-3 px-3 text-center w-28">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredEmployees.map((emp, idx) => {
                    const dept = departments.find((d) => d.id === emp.departmentId);
                    const grade = grades.find((g) => g.id === emp.gradeId) || grades[0];
                    const coeff = grade.coefficients[emp.tierIndex - 1] || 1.0;
                    const scaleBase = Math.round(grade.standardBaseRate * coeff);

                    const isNegotiated = emp.salaryType === 'negotiated';
                    const baseSalary = isNegotiated ? (emp.negotiatedSalary || 15000000) : scaleBase;
                    const respAllowance = emp.responsibilityAllowance || 0;
                    const totalBase = baseSalary + respAllowance;

                    return (
                      <tr key={emp.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                          {emp.code}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {emp.fullName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{dept?.name || 'Chưa phân bổ'}</td>
                        <td className="py-2.5 px-3 text-slate-800">{emp.position}</td>
                        <td className="py-2.5 px-3 text-center">
                          {isNegotiated ? (
                            emp.negotiatedType === 'daily' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                ⏱️ Thỏa thuận ngày
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                📅 Trọn tháng
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                              Bậc {emp.tierIndex} (Thang lương)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-800">
                          {isNegotiated && emp.negotiatedType === 'daily' ? (
                            <div>
                              <div className="text-indigo-950 font-bold">
                                {formatNumberVN(emp.negotiatedDailyRate || Math.round(baseSalary / 26))} đ/ngày
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                ~{formatNumberVN(baseSalary)} đ/tháng
                              </div>
                            </div>
                          ) : (
                            <span>{formatNumberVN(baseSalary)} đ</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {respAllowance > 0 ? (
                            <span className="font-bold text-amber-700">
                              +{formatNumberVN(respAllowance)} đ
                            </span>
                          ) : (
                            <span className="text-slate-400">0 đ</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-extrabold text-blue-900 bg-blue-50/40 text-sm">
                          {formatNumberVN(totalBase)} đ
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Cấu hình</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH LƯƠNG THOẢ THUẬN & PHỤ CẤP TRÁCH NHIỆM */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HandCoins className="w-4 h-4 text-blue-700" />
                  Cấu Hình Hình Thức Lương & Phụ Cấp Trách Nhiệm
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân sự: <strong className="text-slate-800">{editingEmp.fullName}</strong> ({editingEmp.code})
                </p>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Radio: Chọn hình thức lương */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">Hình thức hưởng lương:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition-all ${
                      formSalaryType === 'scale'
                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-100 font-bold text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salaryTypeOption"
                      checked={formSalaryType === 'scale'}
                      onChange={() => setFormSalaryType('scale')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs">Theo Thang 8 Bậc</div>
                      <div className="text-[10px] text-slate-500 font-normal">Hệ số & năng lực quy định</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition-all ${
                      formSalaryType === 'negotiated'
                        ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-100 font-bold text-purple-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salaryTypeOption"
                      checked={formSalaryType === 'negotiated'}
                      onChange={() => setFormSalaryType('negotiated')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs">Lương Thoả Thuận</div>
                      <div className="text-[10px] text-slate-500 font-normal">Thỏa thuận riêng/Chuyên gia</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Input: Mức lương thỏa thuận nếu chọn Lương thỏa thuận */}
              {formSalaryType === 'negotiated' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1.5">
                      Chế độ tính lương thỏa thuận:
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-white/90 p-1.5 rounded-lg border border-purple-200">
                      <label className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-xs transition-all ${
                        formNegotiatedType === 'monthly'
                          ? 'bg-purple-100 text-purple-950 font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="formNegotiatedSubtype"
                          checked={formNegotiatedType === 'monthly'}
                          onChange={() => setFormNegotiatedType('monthly')}
                          className="text-purple-700"
                        />
                        <span>📅 Lương trọn tháng</span>
                      </label>

                      <label className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-xs transition-all ${
                        formNegotiatedType === 'daily'
                          ? 'bg-indigo-100 text-indigo-950 font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="formNegotiatedSubtype"
                          checked={formNegotiatedType === 'daily'}
                          onChange={() => setFormNegotiatedType('daily')}
                          className="text-indigo-700"
                        />
                        <span>⏱️ Lương theo ngày</span>
                      </label>
                    </div>
                  </div>

                  {formNegotiatedType === 'monthly' ? (
                    <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-1">
                      <label className="block font-bold text-purple-950 text-xs">
                        Mức Lương Thoả Thuận Trọn Tháng (VNĐ / tháng):
                      </label>
                      <input
                        type="number"
                        step="500000"
                        value={formNegotiatedSalary}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormNegotiatedSalary(val);
                          setFormNegotiatedDailyRate(Math.round(val / 26));
                        }}
                        className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg bg-purple-50/20 focus:outline-purple-500 font-mono font-bold text-purple-950"
                        placeholder="Ví dụ: 25000000"
                      />
                      <p className="text-[11px] text-purple-700 pt-0.5">
                        💡 <strong>Lương trọn tháng:</strong> Nhân sự hưởng trọn gói cả tháng theo thỏa thuận, thay thế cho lương cơ bản bậc {editingEmp.tierIndex}.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white rounded-lg border border-indigo-200 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-indigo-950 text-xs mb-1">
                            Đơn giá Lương / Ngày (VNĐ / ngày):
                          </label>
                          <input
                            type="number"
                            step="50000"
                            value={formNegotiatedDailyRate}
                            onChange={(e) => {
                              const daily = Number(e.target.value);
                              setFormNegotiatedDailyRate(daily);
                              setFormNegotiatedSalary(Math.round(daily * 26));
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-indigo-300 rounded-lg bg-indigo-50/20 focus:outline-indigo-500 font-mono font-bold text-indigo-950"
                            placeholder="Ví dụ: 850000"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1">
                            Quy đổi tháng (x26 ngày):
                          </label>
                          <input
                            type="number"
                            step="500000"
                            value={formNegotiatedSalary}
                            onChange={(e) => {
                              const monthly = Number(e.target.value);
                              setFormNegotiatedSalary(monthly);
                              setFormNegotiatedDailyRate(Math.round(monthly / 26));
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono text-slate-800"
                            placeholder="Ví dụ: 22100000"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-indigo-800 pt-0.5">
                        💡 <strong>Lương theo ngày công:</strong> Lương thực lĩnh = Đơn giá ngày × Số ngày công thực tế (gồm cả ngày phép có lương) trong tháng.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Input: Phụ cấp trách nhiệm */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-amber-900">
                  Phụ Cấp Trách Nhiệm (VNĐ / tháng):
                </label>
                <input
                  type="number"
                  step="200000"
                  value={formResponsibilityAllowance}
                  onChange={(e) => setFormResponsibilityAllowance(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:outline-amber-500 font-mono font-bold text-amber-950"
                  placeholder="Ví dụ: 2000000"
                />
                <p className="text-[11px] text-amber-800">
                  Áp dụng cho vị trí chỉ huy trưởng, quản lý dự án, trưởng phòng hoặc phụ trách trọng yếu.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditingEmp(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveSalaryConfig}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg shadow-xs"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
