import React from 'react';
import { PayrollItem } from '../types/hrm';
import { formatVND, formatNumberVN } from '../utils/payrollCalculator';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { useHRM } from '../context/HRMContext';

interface PayslipModalProps {
  item: PayrollItem;
  onClose: () => void;
}

// Chuyển số tiền thành chữ Tiếng Việt
function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readThreeDigits(n: number, showZeroHundred: boolean): string {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' trăm ';
    }

    if (ten > 1) {
      res += digits[ten] + ' mươi ';
      if (unit === 1) res += 'mốt ';
      else if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += digits[unit] + ' ';
    } else if (ten === 1) {
      res += 'mười ';
      if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += digits[unit] + ' ';
    } else if (ten === 0 && unit > 0) {
      if (hundred > 0 || showZeroHundred) res += 'lẻ ';
      res += digits[unit] + ' ';
    }

    return res.trim();
  }

  let str = '';
  let i = 0;
  let remaining = Math.round(num);

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkStr = readThreeDigits(chunk, remaining > chunk && chunk < 100);
      str = chunkStr + ' ' + units[i] + ' ' + str;
    }
    remaining = Math.floor(remaining / 1000);
    i++;
  }

  const result = str.trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn.';
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ item, onClose }) => {
  const { currentMonth, employees, insurances } = useHRM();
  const emp = employees.find(e => e.id === item.employeeId);
  const ins = insurances.find(i => i.employeeId === item.employeeId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Phiếu Lương Điện Tử (Payslip)
            </span>
            <span className="text-[11px] bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Đã kiểm duyệt C&B
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu lương</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Sheet */}
        <div className="p-6 sm:p-8 bg-white text-slate-800">
          {/* Company & Title Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-base font-bold uppercase tracking-tight text-slate-900">
                TẬP ĐOÀN CÔNG NGHỆ & THƯƠNG MẠI ENTERPRISE
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM
              </p>
              <p className="text-xs text-slate-500">Mã số thuế: 0314892019 · Hotline: 1900 6868</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-blue-900 uppercase">
                PHIẾU LƯƠNG NHÂN VIÊN
              </span>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                Kỳ lương: Tháng {currentMonth.split('-')[1]}/{currentMonth.split('-')[0]}
              </p>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-5">
            <div>
              <span className="text-slate-500">Mã nhân viên:</span>
              <span className="font-semibold text-slate-900 ml-1.5">{item.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-500">Họ và tên:</span>
              <span className="font-bold text-slate-900 ml-1.5">{item.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500">Phòng ban:</span>
              <span className="font-medium text-slate-900 ml-1.5">{item.departmentName}</span>
            </div>
            <div>
              <span className="text-slate-500">Chức vụ:</span>
              <span className="font-medium text-slate-900 ml-1.5">{item.position}</span>
            </div>
            <div>
              <span className="text-slate-500">Hình thức lương:</span>
              <span className="font-semibold text-blue-800 ml-1.5">
                {item.salaryType === 'negotiated'
                  ? (item.negotiatedType === 'daily'
                      ? `Lương thoả thuận (Theo ngày: ${formatNumberVN(item.negotiatedDailyRate || item.dailyRate || 0)} đ/ngày)`
                      : `Lương thoả thuận (Trọn tháng: ${formatNumberVN(item.negotiatedSalary || item.baseSalaryRate)} đ)`)
                  : `${item.gradeName} - Bậc ${item.tierIndex} (HS ${item.coefficient.toFixed(2)})`}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Số sổ BHXH:</span>
              <span className="font-mono text-slate-900 ml-1.5 font-semibold">
                {emp?.socialInsuranceCode || ins?.insuranceBookNumber || 'Đang cập nhật'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Nguyên quán:</span>
              <span className="text-slate-900 ml-1.5 font-medium">
                {emp?.hometown || 'Chưa cập nhật'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Chỗ ở hiện nay:</span>
              <span className="text-slate-900 ml-1.5 truncate inline-block max-w-[200px] align-bottom" title={emp?.currentAddress}>
                {emp?.currentAddress || 'Chưa cập nhật'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Tài khoản NH:</span>
              <span className="font-mono text-slate-900 ml-1.5 font-semibold">
                {emp?.bankAccount} ({emp?.bankName})
              </span>
            </div>
            <div>
              <span className="text-slate-500">Công chuẩn / Thực tế:</span>
              <span className="font-semibold text-slate-900 ml-1.5">
                {item.actualDays} / {item.standardDays} ngày
              </span>
            </div>
            <div>
              <span className="text-slate-500">Tăng ca (OT):</span>
              <span className="font-semibold text-slate-900 ml-1.5">
                {item.hasOvertime ? (
                  <span className="text-amber-800 font-bold">
                    {item.otConvertedDays || Math.round(((item.totalOtHours || item.otHoursNormal) / 8) * 100) / 100} ngày ({item.totalOtHours || item.otHoursNormal}h ÷ 8)
                  </span>
                ) : (
                  `${item.otHoursNormal + item.otHoursWeekend} giờ`
                )}
              </span>
            </div>
            {item.kpiRating && (
              <div>
                <span className="text-slate-500">Đánh giá KPI:</span>
                <span className="font-bold text-blue-900 ml-1.5 bg-blue-100/70 px-1.5 py-0.5 rounded text-[11px]">
                  Hạng {item.kpiRating} ({item.kpiScore} điểm)
                </span>
              </div>
            )}
          </div>

          {/* Detailed Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs">
            {/* Left: Earnings */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                <span>I. CÁC KHOẢN THU NHẬP (GROSS)</span>
                <span>Số tiền (VNĐ)</span>
              </div>
              <div className="divide-y divide-slate-100 font-mono tabular-nums">
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">
                    {item.salaryType === 'negotiated'
                      ? (item.negotiatedType === 'daily'
                          ? `1. Lương thỏa thuận ngày (${item.actualDays} công × ${formatNumberVN(item.negotiatedDailyRate || item.dailyRate || 0)}đ):`
                          : '1. Lương thỏa thuận trọn tháng:')
                      : '1. Lương thời gian thực tế:'}
                  </span>
                  <span className="font-semibold text-slate-900">{formatNumberVN(item.actualBaseSalary)}</span>
                </div>
                {item.salaryType !== 'negotiated' && (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span className="font-sans text-slate-600">2. Lương năng lực theo bậc:</span>
                    <span className="font-semibold text-slate-900">{formatNumberVN(item.actualCompetencySalary)}</span>
                  </div>
                )}
                {item.responsibilityAllowance > 0 && (
                  <div className="px-3 py-1.5 flex justify-between bg-amber-50/40">
                    <span className="font-sans font-medium text-amber-900">⭐ Phụ cấp trách nhiệm:</span>
                    <span className="font-bold text-amber-700">+{formatNumberVN(item.responsibilityAllowance)}</span>
                  </div>
                )}
                {item.hasCompanyVehicle ? (
                  <div className="px-3 py-1.5 flex justify-between bg-emerald-50/40">
                    <span className="font-sans text-emerald-900">🚗 Cấp xe công trình:</span>
                    <span className="text-emerald-700 font-sans text-[11px] font-semibold">Được cấp xe (0 đ xăng)</span>
                  </div>
                ) : item.allowanceFuelProject > 0 ? (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span className="font-sans text-slate-600">⛽ Phụ cấp tiền xăng công trình:</span>
                    <span className="text-slate-800 font-semibold">{formatNumberVN(item.allowanceFuelProject)}</span>
                  </div>
                ) : null}
                {item.allowanceMealProject > 0 && (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span className="font-sans text-slate-600">🍱 Phụ cấp tiền ăn theo ngày CT:</span>
                    <span className="text-slate-800 font-semibold">{formatNumberVN(item.allowanceMealProject)}</span>
                  </div>
                )}
                {(item.allowanceRemoteProject || 0) > 0 && (
                  <div className="px-3 py-1.5 flex justify-between bg-purple-50/40">
                    <span className="font-sans font-medium text-purple-900">✈️ Phụ cấp công tác phí xa (Cấp I/II):</span>
                    <span className="font-bold text-purple-700">+{formatNumberVN(item.allowanceRemoteProject)}</span>
                  </div>
                )}
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">
                    Tiền làm thêm giờ (OT):
                    {item.hasOvertime && (
                      <span className="block text-[10px] text-amber-700">
                        {item.totalOtHours || item.otHoursNormal}h chia 8 = {item.otConvertedDays || Math.round(((item.totalOtHours || item.otHoursNormal) / 8) * 100) / 100} ngày công quy đổi
                      </span>
                    )}
                  </span>
                  <span className="text-slate-800 font-semibold">{formatNumberVN(item.otPay)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">Phụ cấp ăn trưa văn phòng:</span>
                  <span className="text-slate-800">{formatNumberVN(item.allowanceMeal)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">Phụ cấp đi lại chung:</span>
                  <span className="text-slate-800">{formatNumberVN(item.allowanceTransport)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between bg-blue-50/30">
                  <span className="font-sans text-slate-700">
                    Thưởng hiệu quả KPI:
                    {item.kpiRating && (
                      <span className="block text-[10px] text-blue-700 font-medium">
                        Điểm: {item.kpiScore}/100 · Xếp hạng {item.kpiRating}
                      </span>
                    )}
                  </span>
                  <span className="text-blue-900 font-bold">+{formatNumberVN(item.performanceBonus)}</span>
                </div>
                <div className="px-3 py-2 bg-blue-50/60 font-bold flex justify-between border-t border-slate-200">
                  <span className="font-sans text-blue-900">TỔNG THU NHẬP (A):</span>
                  <span className="text-blue-900">{formatNumberVN(item.grossIncome)} đ</span>
                </div>
              </div>
            </div>

            {/* Right: Deductions */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                <span>II. CÁC KHOẢN TRÍCH TRỪ</span>
                <span>Số tiền (VNĐ)</span>
              </div>
              <div className="divide-y divide-slate-100 font-mono tabular-nums">
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">1. Bảo hiểm Xã hội (8%):</span>
                  <span className="text-slate-800">{formatNumberVN(item.employeeBhxh)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">2. Bảo hiểm Y tế (1.5%):</span>
                  <span className="text-slate-800">{formatNumberVN(item.employeeBhyt)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">3. Bảo hiểm Thất nghiệp (1%):</span>
                  <span className="text-slate-800">{formatNumberVN(item.employeeBhtn)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">4. Thuế Thu nhập cá nhân (TNCN):</span>
                  <span className="font-semibold text-amber-700">{formatNumberVN(item.personalIncomeTax)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">5. Tạm ứng lương đã giải ngân:</span>
                  <span className="text-slate-800">{formatNumberVN(item.salaryAdvanceDeduction)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="font-sans text-slate-600">6. Khấu trừ khác:</span>
                  <span className="text-slate-800">{formatNumberVN(item.otherDeductions)}</span>
                </div>
                <div className="px-3 py-2 bg-red-50/60 font-bold flex justify-between border-t border-slate-200">
                  <span className="font-sans text-red-900">TỔNG CỘNG TRỪ (B):</span>
                  <span className="text-red-900">
                    {formatNumberVN(
                      item.totalEmployeeInsurance + item.personalIncomeTax + item.salaryAdvanceDeduction + item.otherDeductions
                    )}{' '}
                    đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Total Net Pay Banner */}
          <div className="p-4 bg-linear-to-r from-blue-900 to-indigo-900 rounded-lg text-white mb-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider block">
                THỰC LĨNH CHUYỂN KHOẢN (A - B)
              </span>
              <p className="text-xs text-blue-100 italic mt-0.5">
                {numberToVietnameseWords(item.netIncome)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                {formatVND(item.netIncome)}
              </span>
            </div>
          </div>

          {/* Signatures block */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs text-slate-600 pt-3 border-t border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">Người Lập Phiếu</p>
              <p className="text-[10px] text-slate-400 italic mb-10">(Ký, họ tên)</p>
              <p className="font-medium text-slate-700">Vũ Hoàng Yến</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Kế Toán Tiền Lương</p>
              <p className="text-[10px] text-slate-400 italic mb-10">(Ký, họ tên)</p>
              <p className="font-medium text-slate-700">Phạm Minh Đức</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Giám Đốc Nhân Sự</p>
              <p className="text-[10px] text-slate-400 italic mb-10">(Ký, đóng dấu)</p>
              <p className="font-medium text-slate-700">Lê Thanh Huy</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Người Nhận Tiền</p>
              <p className="text-[10px] text-slate-400 italic mb-10">(Ký xác nhận)</p>
              <p className="font-medium text-slate-700">{item.fullName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
