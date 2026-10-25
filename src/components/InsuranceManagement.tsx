import React, { useState } from 'react';
import { useHRM } from '../context/HRMContext';
import { InsuranceProfile } from '../types/hrm';
import { formatVND, formatNumberVN } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Shield, ShieldAlert, ShieldCheck, HeartPulse, Hospital, Edit3, Sliders, CheckCircle2, FileSpreadsheet, FileText } from 'lucide-react';

export const InsuranceManagement: React.FC = () => {
  const { employees, insurances, settings, updateInsurance, setActiveSubTab, showToast } = useHRM();

  const [editingIns, setEditingIns] = useState<InsuranceProfile | null>(null);
  const [formData, setFormData] = useState({
    insuranceBookNumber: '',
    hospitalRegistration: '',
    insuranceSalary: 0,
    status: 'active' as 'active' | 'paused' | 'not_eligible',
  });

  const totalInsSalary = insurances
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.insuranceSalary, 0);

  const totalEmployeeMonthly = Math.round(
    totalInsSalary * (settings.employeeBhxhRate + settings.employeeBhytRate + settings.employeeBhtnRate)
  );

  const totalEmployerMonthly = Math.round(
    totalInsSalary *
      (settings.employerBhxhRate +
        settings.employerBhytRate +
        settings.employerBhtnRate +
        settings.employerBhtnldRate)
  );

  const handleOpenEdit = (ins: InsuranceProfile) => {
    setEditingIns(ins);
    setFormData({
      insuranceBookNumber: ins.insuranceBookNumber,
      hospitalRegistration: ins.hospitalRegistration,
      insuranceSalary: ins.insuranceSalary,
      status: ins.status,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIns) return;
    updateInsurance({
      ...editingIns,
      ...formData,
    });
    setEditingIns(null);
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã NV',
      'Họ và Tên',
      'Chức Vụ',
      'Số Sổ BHXH',
      'Nơi Đăng Ký KCB Ban Đầu',
      'Mức Lương Đóng BHXH (VNĐ)',
      'NLĐ Đóng 10.5% (VNĐ)',
      'Doanh Nghiệp Đóng 21.5% (VNĐ)',
      'Tổng Trích Nộp 32% (VNĐ)',
      'Trạng Thái',
    ];
    const rows = insurances.map((ins, idx) => {
      const emp = employees.find((e) => e.id === ins.employeeId);
      const nldAmt = Math.round(
        ins.insuranceSalary *
          (settings.employeeBhxhRate + settings.employeeBhytRate + settings.employeeBhtnRate)
      );
      const ctyAmt = Math.round(
        ins.insuranceSalary *
          (settings.employerBhxhRate +
            settings.employerBhytRate +
            settings.employerBhtnRate +
            settings.employerBhtnldRate)
      );
      return [
        idx + 1,
        emp?.code || '',
        emp?.fullName || '',
        emp?.position || '',
        ins.insuranceBookNumber,
        ins.hospitalRegistration,
        ins.insuranceSalary,
        nldAmt,
        ctyAmt,
        nldAmt + ctyAmt,
        ins.status === 'active' ? 'Đang đóng' : 'Chưa đóng',
      ];
    });
    exportToExcel({
      fileName: `Danh_Sach_Dong_BHXH_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'BHXH',
      title: 'BÁO CÁO DANH SÁCH TRÍCH NỘP BẢO HIỂM XÃ HỘI (BHXH, BHYT, BHTN)',
      subtitles: [
        'Công ty Cổ phần Xây dựng | Tỷ lệ trích: NLĐ 10.5% - Doanh nghiệp 21.5%',
        `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
      ],
      headers,
      rows,
    });
    showToast('Đã xuất file Excel BHXH thành công!');
  };

  // Export PDF (.pdf)
  const handleExportPDF = () => {
    const headers = ['STT', 'Ma NV', 'Ho va Ten', 'So So BHXH', 'Luong BHXH', 'NLD Dong', 'Cty Dong', 'Tong Nop', 'Trang Thai'];
    const rows = insurances.map((ins, idx) => {
      const emp = employees.find((e) => e.id === ins.employeeId);
      const nldAmt = Math.round(
        ins.insuranceSalary *
          (settings.employeeBhxhRate + settings.employeeBhytRate + settings.employeeBhtnRate)
      );
      const ctyAmt = Math.round(
        ins.insuranceSalary *
          (settings.employerBhxhRate +
            settings.employerBhytRate +
            settings.employerBhtnRate +
            settings.employerBhtnldRate)
      );
      return [
        idx + 1,
        emp?.code || '',
        emp?.fullName || '',
        ins.insuranceBookNumber,
        ins.insuranceSalary.toLocaleString('vi-VN'),
        nldAmt.toLocaleString('vi-VN'),
        ctyAmt.toLocaleString('vi-VN'),
        (nldAmt + ctyAmt).toLocaleString('vi-VN'),
        ins.status === 'active' ? 'Dang dong' : 'Chua dong',
      ];
    });
    exportToPDF({
      fileName: `Danh_Sach_Dong_BHXH_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'DANH SACH TRICH NOP BAO HIEM XA HOI',
      subtitles: [`Cong ty CP Xay dung | Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất file PDF BHXH thành công!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Top Banner and Settings Jump */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Quản Lý Bảo Hiểm Xã Hội (BHXH, BHYT, BHTN)
            <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              Chuẩn Luật Lao Động VN
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi danh sách cấp sổ BHXH, nơi đăng ký khám chữa bệnh ban đầu và mức trích nộp bắt buộc.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
            title="Xuất danh sách BHXH ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-rose-300 shadow-2xs cursor-pointer"
            title="Xuất danh sách BHXH ra file PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Xuất PDF (.pdf)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Điều chỉnh tỷ lệ %</span>
          </button>
        </div>
      </div>

      {/* Statutory Rates & Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Người Lao Động Đóng</span>
            <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
              {(settings.employeeBhxhRate + settings.employeeBhytRate + settings.employeeBhtnRate) * 100}%
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatNumberVN(totalEmployeeMonthly)} đ / tháng
          </div>
          <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
            <div className="flex justify-between">
              <span>BHXH: {settings.employeeBhxhRate * 100}%</span>
              <span>BHYT: {settings.employeeBhytRate * 100}%</span>
              <span>BHTN: {settings.employeeBhtnRate * 100}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Doanh Nghiệp Đóng</span>
            <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
              {(
                settings.employerBhxhRate +
                settings.employerBhytRate +
                settings.employerBhtnRate +
                settings.employerBhtnldRate
              ) * 100}
              %
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-indigo-900">
            {formatNumberVN(totalEmployerMonthly)} đ / tháng
          </div>
          <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
            <div className="flex justify-between">
              <span>BHXH: {settings.employerBhxhRate * 100}%</span>
              <span>BHYT: {settings.employerBhytRate * 100}%</span>
              <span>BHTN: {(settings.employerBhtnRate + settings.employerBhtnldRate) * 100}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Quỹ Trích Nộp</span>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              32.0%
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {formatNumberVN(totalEmployeeMonthly + totalEmployerMonthly)} đ / tháng
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Cơ quan BHXH: BHXH TP. Hồ Chí Minh
          </div>
        </div>
      </div>

      {/* Insurance Records Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4 w-44">Họ và tên</th>
                <th className="py-3 px-3">Mã số BHXH</th>
                <th className="py-3 px-3">Bệnh viện KCB ban đầu</th>
                <th className="py-3 px-3 text-right">Lương đóng BHXH</th>
                <th className="py-3 px-3 text-right">NLĐ đóng (10.5%)</th>
                <th className="py-3 px-3 text-right">Cty đóng (21.5%)</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3 text-center w-20">Sửa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {insurances.map((ins, idx) => {
                const emp = employees.find((e) => e.id === ins.employeeId);
                const nldAmt = Math.round(
                  ins.insuranceSalary *
                    (settings.employeeBhxhRate + settings.employeeBhytRate + settings.employeeBhtnRate)
                );
                const ctyAmt = Math.round(
                  ins.insuranceSalary *
                    (settings.employerBhxhRate +
                      settings.employerBhytRate +
                      settings.employerBhtnRate +
                      settings.employerBhtnldRate)
                );

                return (
                  <tr key={ins.id} className="hover:bg-slate-50 transition-colors font-sans">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {emp?.fullName || 'Nhân sự'}
                      <div className="text-[10px] font-mono text-slate-500 font-normal">
                        {emp?.code} · {emp?.position}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-900">
                      {ins.insuranceBookNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 flex items-center space-x-1.5 pt-3">
                      <Hospital className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ins.hospitalRegistration}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatNumberVN(ins.insuranceSalary)} đ
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatNumberVN(nldAmt)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatNumberVN(ctyAmt)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {ins.status === 'active' ? (
                        <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium border border-green-200">
                          Đang đóng
                        </span>
                      ) : (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          Chưa đóng
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleOpenEdit(ins)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin bảo hiểm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Insurance Modal */}
      {editingIns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Cập Nhật Hồ Sơ BHXH</h3>
              <button
                onClick={() => setEditingIns(null)}
                className="text-slate-500 hover:text-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã số sổ BHXH</label>
                <input
                  type="text"
                  value={formData.insuranceBookNumber}
                  onChange={(e) => setFormData({ ...formData, insuranceBookNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nơi khám chữa bệnh ban đầu (BHYT)</label>
                <input
                  type="text"
                  value={formData.hospitalRegistration}
                  onChange={(e) => setFormData({ ...formData, hospitalRegistration: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mức lương đóng BHXH (VNĐ)</label>
                <input
                  type="number"
                  step="100000"
                  value={formData.insuranceSalary}
                  onChange={(e) => setFormData({ ...formData, insuranceSalary: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Trạng thái tham gia</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="active">Đang đóng BHXH bắt buộc</option>
                  <option value="paused">Tạm dừng đóng (Nghỉ thai sản/không lương)</option>
                  <option value="not_eligible">Chưa đóng (Thử việc/Thực tập)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingIns(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-semibold"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
