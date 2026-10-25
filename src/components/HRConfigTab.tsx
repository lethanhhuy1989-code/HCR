import React, { useState } from 'react';
import { useHRM } from '../context/HRMContext';
import { HRSettings } from '../types/hrm';
import { formatNumberVN } from '../utils/payrollCalculator';
import { Sliders, Save, RotateCcw, AlertCircle, Shield, Receipt, Clock, Fuel, Utensils, Plane, Plus, Trash2 } from 'lucide-react';
import { initialHRSettings, initialRemoteAllowanceRates } from '../data/mockHrmData';
import { RemoteAllowanceRate } from '../types/hrm';

export const HRConfigTab: React.FC = () => {
  const { settings, updateSettings, remoteAllowanceRates, updateRemoteAllowanceRates, showToast } = useHRM();
  const [draft, setDraft] = useState<HRSettings>(() => ({ ...settings }));
  const [draftRemoteRates, setDraftRemoteRates] = useState<RemoteAllowanceRate[]>(() =>
    remoteAllowanceRates && remoteAllowanceRates.length > 0 ? [...remoteAllowanceRates] : [...initialRemoteAllowanceRates]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(draft);
    updateRemoteAllowanceRates(draftRemoteRates);
    showToast('Đã lưu cấu hình hệ thống & bảng phụ cấp công trình!');
  };

  const handleReset = () => {
    setDraft({ ...initialHRSettings });
    setDraftRemoteRates([...initialRemoteAllowanceRates]);
    updateSettings(initialHRSettings);
    updateRemoteAllowanceRates(initialRemoteAllowanceRates);
    showToast('Đã khôi phục cài đặt tỷ lệ theo Luật Lao Động Việt Nam chuẩn!', 'info');
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-700" />
            Cấu Hình Tỷ Lệ Bảo Hiểm & Giảm Trừ Thuế TNCN
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tùy biến linh hoạt mức trích đóng BHXH, BHYT, BHTN và các hạn mức giảm trừ gia cảnh theo quy định doanh nghiệp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Khôi phục luật chuẩn</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Section 0: Chế độ Bật / Tắt Phân Hệ Lương Thưởng (KPI & Phụ cấp) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-800 text-sm">
                Chính Sách Bật / Tắt Phân Hệ (KPI & Phụ Cấp)
              </h3>
            </div>
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
              Chế độ linh hoạt cho doanh nghiệp
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle KPI */}
            <div
              className={`p-4 rounded-lg border transition-colors ${
                draft.enableKpiBonus ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  Đánh Giá & Thưởng KPI
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.enableKpiBonus ?? false}
                    onChange={(e) => setDraft({ ...draft, enableKpiBonus: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-600">
                {draft.enableKpiBonus
                  ? 'ĐANG BẬT: Thưởng hiệu quả theo xếp loại KPI được tính vào Tổng Gross.'
                  : 'ĐANG TẮT (Mặc định): Công ty chưa áp dụng, thưởng KPI = 0đ. Có thể bật khi áp dụng.'}
              </p>
            </div>

            {/* Toggle Allowances */}
            <div
              className={`p-4 rounded-lg border transition-colors ${
                draft.enableAllowances ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  Chế Độ Các Khoản Phụ Cấp
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.enableAllowances ?? false}
                    onChange={(e) => setDraft({ ...draft, enableAllowances: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-600">
                {draft.enableAllowances
                  ? 'ĐANG BẬT: Tính phụ cấp xăng xe, tiền ăn, công tác phí xa, phụ cấp trách nhiệm vào bảng lương.'
                  : 'ĐANG TẮT (Mặc định): Công ty chưa áp dụng phụ cấp, các khoản phụ cấp = 0đ. Có thể bật khi áp dụng.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Tỷ lệ Người Lao Động Đóng */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200">
            <Shield className="w-4 h-4 text-blue-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              1. Tỷ Lệ Trích Đóng Của Người Lao Động (Trừ Vào Lương)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bảo hiểm Xã hội (BHXH) %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={draft.employeeBhxhRate * 100}
                  onChange={(e) =>
                    setDraft({ ...draft, employeeBhxhRate: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Mặc định chuẩn: 8.0%</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bảo hiểm Y tế (BHYT) %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={draft.employeeBhytRate * 100}
                  onChange={(e) =>
                    setDraft({ ...draft, employeeBhytRate: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Mặc định chuẩn: 1.5%</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bảo hiểm Thất nghiệp (BHTN) %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={draft.employeeBhtnRate * 100}
                  onChange={(e) =>
                    setDraft({ ...draft, employeeBhtnRate: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Mặc định chuẩn: 1.0%</p>
            </div>
          </div>
        </div>

        {/* Section 2: Tỷ lệ Doanh Nghiệp (NSDLĐ) Đóng */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200">
            <Shield className="w-4 h-4 text-indigo-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              2. Tỷ Lệ Trích Đóng Của Doanh Nghiệp (Người Sử Dụng Lao Động)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">BHXH Cty đóng %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={draft.employerBhxhRate * 100}
                  onChange={(e) =>
                    setDraft({ ...draft, employerBhxhRate: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Chuẩn: 17.5%</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">BHYT Cty đóng %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={draft.employerBhytRate * 100}
                  onChange={(e) =>
                    setDraft({ ...draft, employerBhytRate: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Chuẩn: 3.0%</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">BHTN Cty đóng %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={draft.employerBhtnRate * 100}
                  onChange={(e) =>
                    setDraft({ ...draft, employerBhtnRate: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Chuẩn: 1.0%</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">BHTNLĐ-BNN %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={draft.employerBhtnldRate * 100}
                  onChange={(e) =>
                    setDraft({ ...draft, employerBhtnldRate: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Chuẩn: 0.5%</p>
            </div>
          </div>
        </div>

        {/* Section 3: Giảm Trừ Thuế TNCN & Tiêu Chuẩn */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200">
            <Receipt className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              3. Giảm Trừ Thuế TNCN & Tiêu Chuẩn Công Ca
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mức giảm trừ gia cảnh bản thân (VNĐ/tháng)
              </label>
              <input
                type="number"
                step="500000"
                value={draft.personalDeduction}
                onChange={(e) =>
                  setDraft({ ...draft, personalDeduction: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Mặc định: 11,000,000 đ</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mức giảm trừ mỗi người phụ thuộc (VNĐ/tháng)
              </label>
              <input
                type="number"
                step="200000"
                value={draft.dependentDeduction}
                onChange={(e) =>
                  setDraft({ ...draft, dependentDeduction: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Mặc định: 4,400,000 đ</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Số ngày công chuẩn trong tháng
              </label>
              <input
                type="number"
                min="20"
                max="31"
                value={draft.standardMonthlyDays}
                onChange={(e) =>
                  setDraft({ ...draft, standardMonthlyDays: parseInt(e.target.value) || 26 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Thông thường: 26 ngày (hoặc 22 ngày nếu nghỉ thứ 7)</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Hệ số lương làm thêm giờ ngày thường (OT)
              </label>
              <input
                type="number"
                step="0.1"
                value={draft.otNormalMultiplier}
                onChange={(e) =>
                  setDraft({ ...draft, otNormalMultiplier: parseFloat(e.target.value) || 1.5 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Luật lao động: 1.5 (150%) ngày thường, 2.0 ngày nghỉ</p>
            </div>
          </div>
        </div>

        {/* Section 4: Định Mức Giá Xăng, Tiền Ăn & Phụ Cấp Công Tác Phí */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <Fuel className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              4. Định Mức Giá Xăng, Tiền Ăn & Phụ Cấp Công Tác Phí (Cấp I & Cấp II)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Đơn giá xăng phụ cấp trên 1 km (VNĐ / km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={draft.gasolinePricePerKm || 1800}
                  onChange={(e) =>
                    setDraft({ ...draft, gasolinePricePerKm: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ/km</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Phụ cấp xăng = Cự ly (km) × {formatNumberVN(draft.gasolinePricePerKm || 1800)} đ/km (0 đ nếu cấp xe)
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tiền ăn công trình tiêu chuẩn theo ngày (VNĐ / ngày)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={draft.projectDailyMealStandard || 50000}
                  onChange={(e) =>
                    setDraft({ ...draft, projectDailyMealStandard: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ/ngày</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Phụ cấp tiền ăn theo từng ngày làm việc tại công trình
              </p>
            </div>
          </div>

          {/* Bảng tùy chỉnh công tác phí theo cự ly & chức danh */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-purple-700" />
                Phụ cấp công tác phí công trình xa theo vị trí cấp chức danh (Cấp II: 50-100km, Cấp I: &gt;100km):
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraftRemoteRates((prev) => [
                    ...prev,
                    {
                      id: `rate-${Date.now()}`,
                      rank: `C${prev.length + 1}`,
                      rankDescription: 'Vị trí chức danh mới',
                      applicablePositions: '',
                      tierI: 35000,
                      tierII: 25000,
                    },
                  ])
                }
                className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm chức danh</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3 w-14 text-center">Hạng</th>
                    <th className="py-2 px-3">Vị trí chức danh áp dụng</th>
                    <th className="py-2 px-3 w-32 text-right bg-blue-50/50">Cấp II (50-100km)</th>
                    <th className="py-2 px-3 w-32 text-right bg-purple-50/50">Cấp I (&gt;100km)</th>
                    <th className="py-2 px-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draftRemoteRates.map((rate, idx) => (
                    <tr key={rate.id || idx}>
                      <td className="py-1.5 px-3 text-center">
                        <input
                          type="text"
                          value={rate.rank}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftRemoteRates((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx], rank: val };
                              return n;
                            });
                          }}
                          className="w-8 text-center font-bold px-1 py-0.5 border border-slate-300 rounded text-xs uppercase"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={rate.rankDescription}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftRemoteRates((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx], rankDescription: val };
                              return n;
                            });
                          }}
                          className="w-full px-2 py-0.5 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right bg-blue-50/20">
                        <input
                          type="number"
                          step="1000"
                          value={rate.tierII}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDraftRemoteRates((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx], tierII: val };
                              return n;
                            });
                          }}
                          className="w-24 text-right font-mono font-bold px-2 py-0.5 border border-blue-300 rounded text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right bg-purple-50/20">
                        <input
                          type="number"
                          step="1000"
                          value={rate.tierI}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDraftRemoteRates((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx], tierI: val };
                              return n;
                            });
                          }}
                          className="w-24 text-right font-mono font-bold px-2 py-0.5 border border-purple-300 rounded text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (draftRemoteRates.length <= 1) return;
                            setDraftRemoteRates((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg font-bold shadow-sm flex items-center space-x-2 text-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình và cập nhật bảng lương</span>
          </button>
        </div>
      </form>
    </div>
  );
};
