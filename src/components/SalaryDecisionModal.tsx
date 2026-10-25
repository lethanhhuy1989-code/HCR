import React, { useState } from 'react';
import { useHRM } from '../context/HRMContext';
import { Employee } from '../types/hrm';
import { SalaryRaiseDecisionData } from '../types/contractTemplate';
import { numberToVietnameseWords } from '../data/defaultContractTemplates';
import { formatVND } from '../utils/payrollCalculator';
import {
  TrendingUp,
  FileCheck2,
  Printer,
  Download,
  X,
  Check,
  Building,
  Award,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface SalaryDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
}

export const SalaryDecisionModal: React.FC<SalaryDecisionModalProps> = ({
  isOpen,
  onClose,
  defaultEmployeeId,
}) => {
  const {
    employees,
    departments,
    contracts,
    updateEmployee,
    addContractAppendix,
    showToast,
  } = useHRM();

  const [activeStep, setActiveStep] = useState<'form' | 'preview'>('form');

  const initialEmp =
    employees.find((e) => e.id === defaultEmployeeId) || employees[0];

  const currentSal =
    initialEmp?.salaryType === 'negotiated'
      ? initialEmp.negotiatedSalary || 15000000
      : 12000000;

  const yr = new Date().getFullYear();
  const [formData, setFormData] = useState<SalaryRaiseDecisionData>({
    decisionNumber: `QĐ-NL/${yr}/${String(Math.floor(10 + Math.random() * 90))}`,
    employeeId: initialEmp?.id || '',
    currentSalary: currentSal,
    newSalary: Math.round(currentSal * 1.15),
    effectiveDate: new Date().toISOString().split('T')[0],
    signedDate: new Date().toISOString().split('T')[0],
    reason: 'Đạt thành tích xuất sắc trong công tác chuyên môn và hoàn thành tốt chỉ tiêu KPI được giao',
    signerName: 'Lê Thanh Huy',
    signerTitle: 'Tổng Giám Đốc',
    updateEmployeeProfile: true,
    createAddendum: true,
    notes: 'Quyết định tăng lương định kỳ theo quy chế khen thưởng doanh nghiệp',
  });

  if (!isOpen) return null;

  const selectedEmp =
    employees.find((e) => e.id === formData.employeeId) || initialEmp;
  const selectedDept = departments.find(
    (d) => d.id === selectedEmp?.departmentId
  );
  const selectedEmpContract = contracts.find(
    (c) => c.employeeId === selectedEmp?.id
  );

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const oldSal =
      emp.salaryType === 'negotiated'
        ? emp.negotiatedSalary || 15000000
        : 12000000;
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      currentSalary: oldSal,
      newSalary: Math.round(oldSal * 1.15),
    }));
  };

  const increaseAmount = Math.max(0, formData.newSalary - formData.currentSalary);

  // Submit and apply changes
  const handleApplyDecision = () => {
    if (!selectedEmp) return;

    // 1. Update Employee Profile if checked
    if (formData.updateEmployeeProfile) {
      updateEmployee({
        ...selectedEmp,
        salaryType: 'negotiated',
        negotiatedSalary: formData.newSalary,
      });
    }

    // 2. Create Contract Appendix if checked
    if (formData.createAddendum && selectedEmpContract) {
      addContractAppendix(selectedEmpContract.id, {
        contractId: selectedEmpContract.id,
        code: `PL-NL/${yr}/${selectedEmp.code}`,
        title: `Phụ lục điều chỉnh mức lương theo Quyết định ${formData.decisionNumber}`,
        type: 'salary_adjustment',
        signedDate: formData.signedDate,
        effectiveDate: formData.effectiveDate,
        description: `Nâng mức lương cơ bản từ ${formatVND(formData.currentSalary)} lên ${formatVND(formData.newSalary)} (${formData.reason})`,
        newBaseSalary: formData.newSalary,
        newInsuranceSalary: formData.newSalary,
      });
    }

    showToast(
      `Đã ban hành Quyết định ${formData.decisionNumber} và cập nhật lương mới cho nhân viên ${selectedEmp.fullName}!`,
      'success'
    );
    onClose();
  };

  // Download Word (.doc)
  const handleDownloadWord = () => {
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${formData.decisionNumber}</title></head>
      <body>
        <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; padding: 20px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 45%; text-align: center; vertical-align: top;">
                <p style="font-weight: bold; font-size: 11pt; margin: 0; text-transform: uppercase;">CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE</p>
                <p style="font-size: 11pt; margin: 3px 0 0 0;">Số: <b>${formData.decisionNumber}</b></p>
              </td>
              <td style="width: 55%; text-align: center; vertical-align: top;">
                <p style="font-weight: bold; font-size: 11pt; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p style="font-weight: bold; font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
                <p style="margin: 2px 0 0 0;">-----------------------</p>
                <p style="font-style: italic; font-size: 11pt; margin: 4px 0 0 0;">TP. Hồ Chí Minh, ngày ${formData.signedDate.split('-')[2]} tháng ${formData.signedDate.split('-')[1]} năm ${formData.signedDate.split('-')[0]}</p>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 25px 0;">
            <h2 style="font-size: 17pt; font-weight: bold; margin: 0; text-transform: uppercase;">QUYẾT ĐỊNH</h2>
            <p style="font-weight: bold; font-size: 13pt; margin-top: 4px;">Về việc nâng bậc lương và điều chỉnh thu nhập cho Người lao động</p>
          </div>

          <p style="text-align: center; font-weight: bold; text-transform: uppercase;">TỔNG GIÁM ĐỐC CÔNG TY</p>
          <p style="font-style: italic;">- Căn cứ Bộ luật Lao động Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;<br/>
          - Căn cứ Quy chế lương thưởng của Công ty và đề nghị của Trưởng phòng Nhân sự.</p>

          <p style="text-align: center; font-weight: bold; font-size: 14pt;">QUYẾT ĐỊNH:</p>

          <p><b>Điều 1:</b> Nâng mức lương cơ bản cho Ông/Bà <b>${selectedEmp?.fullName}</b> (Mã NV: <b>${selectedEmp?.code}</b>, Chức vụ: <b>${selectedEmp?.position}</b> - Phòng: <b>${selectedDept?.name}</b>):<br/>
          - Mức lương cũ: <b>${formatVND(formData.currentSalary)}</b><br/>
          - Mức lương mới sau nâng bậc: <b>${formatVND(formData.newSalary)}</b> (Tăng: <b>${formatVND(increaseAmount)}</b>)<br/>
          - Bằng chữ: <i>${numberToVietnameseWords(formData.newSalary)}</i><br/>
          - Lý do: ${formData.reason}</p>

          <p><b>Điều 2:</b> Quyết định có hiệu lực từ ngày <b>${formData.effectiveDate}</b>.</p>

          <p><b>Điều 3:</b> Các phòng ban liên quan và Ông/Bà <b>${selectedEmp?.fullName}</b> chịu trách nhiệm thi hành quyết định này.</p>

          <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
            <tr>
              <td style="width: 50%;">
                <p><b>Nơi nhận:</b><br/>- Như Điều 3;<br/>- Lưu VT, HSNS.</p>
              </td>
              <td style="width: 50%; text-align: center;">
                <p style="font-weight: bold; text-transform: uppercase;">TỔNG GIÁM ĐỐC</p>
                <div style="height: 60px;"></div>
                <p style="font-weight: bold;">${formData.signerName}</p>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quyet_Dinh_Nang_Luong_${selectedEmp?.fullName || 'NV'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file Word Quyết định nâng lương!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm">Ban Hành Quyết Định Nâng Bậc / Tăng Lương</h3>
              <p className="text-[11px] text-emerald-300">
                Lập văn bản quyết định chính thức, tự động cập nhật lương và sinh phụ lục hợp đồng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setActiveStep('form')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeStep === 'form' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Thiết lập thông số quyết định
            </button>
            <button
              onClick={() => setActiveStep('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeStep === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Xem trước & In quyết định A4
            </button>
          </div>

          {activeStep === 'preview' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadWord}
                className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Word (.doc)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In A4</span>
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeStep === 'form' ? (
            <div className="space-y-4">
              {/* Employee & Decision Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nhân viên được nâng lương <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:outline-emerald-600"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.code} - {emp.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số Quyết Định <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.decisionNumber}
                    onChange={(e) => setFormData({ ...formData, decisionNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-900 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Salary Comparison Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Mức lương cũ hiện tại</label>
                  <input
                    type="number"
                    step={100000}
                    value={formData.currentSalary}
                    onChange={(e) => setFormData({ ...formData, currentSalary: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {formatVND(formData.currentSalary)}
                  </span>
                </div>

                <div>
                  <label className="block text-emerald-800 font-semibold text-[11px] mb-1">
                    Mức lương mới sau nâng bậc
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={formData.newSalary}
                    onChange={(e) => setFormData({ ...formData, newSalary: Number(e.target.value) })}
                    className="w-full bg-white border border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-800"
                  />
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                    {formatVND(formData.newSalary)}
                  </span>
                </div>

                <div className="bg-white border border-emerald-200 rounded-lg p-2.5 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Mức tăng thực tế:</span>
                  <span className="text-base font-bold text-emerald-700">+{formatVND(increaseAmount)}</span>
                  <span className="text-[10px] text-slate-500">
                    ({formData.currentSalary > 0 ? ((increaseAmount / formData.currentSalary) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              {/* Number to words preview */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 italic text-[11px]">
                Số tiền bằng chữ: <b>{numberToVietnameseWords(formData.newSalary)}</b>
              </div>

              {/* Effective date & Sign Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày có hiệu lực thi hành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngày ký quyết định</label>
                  <input
                    type="date"
                    required
                    value={formData.signedDate}
                    onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lý do nâng bậc lương</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="VD: Đạt thành tích xuất sắc trong công tác, Hoàn thành tốt chỉ tiêu..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600"
                />
              </div>

              {/* Signer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Người đại diện ký</label>
                  <input
                    type="text"
                    value={formData.signerName}
                    onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chức vụ người ký</label>
                  <input
                    type="text"
                    value={formData.signerTitle}
                    onChange={(e) => setFormData({ ...formData, signerTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Automatic Actions Checkboxes */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Hành động tự động liên kết:</span>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.updateEmployeeProfile}
                    onChange={(e) => setFormData({ ...formData, updateEmployeeProfile: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>
                    Tự động cập nhật mức lương mới vào hồ sơ nhân sự (Áp dụng ngay cho kỳ tính lương tiếp theo)
                  </span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.createAddendum}
                    onChange={(e) => setFormData({ ...formData, createAddendum: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>
                    Tự động tạo Phụ lục hợp đồng lao động số <b>PL-NL/{yr}/{selectedEmp?.code}</b> lưu vào hồ sơ hợp đồng
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* PREVIEW TAB */
            <div className="bg-slate-50 p-6 sm:p-10 rounded-xl border border-slate-200 overflow-x-auto shadow-inner">
              <div className="bg-white p-8 sm:p-12 rounded shadow-md border border-slate-200 max-w-3xl mx-auto font-serif text-slate-800 text-sm leading-relaxed space-y-6">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%', textAlign: 'center', verticalAlign: 'top' }}>
                        <p className="font-bold text-xs uppercase text-slate-900 m-0">
                          CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE
                        </p>
                        <p className="text-xs m-0 mt-1 font-semibold">
                          Số: <b>{formData.decisionNumber}</b>
                        </p>
                      </td>
                      <td style={{ width: '55%', textAlign: 'center', verticalAlign: 'top' }}>
                        <p className="font-bold text-xs uppercase text-slate-900 m-0">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </p>
                        <p className="font-bold text-sm text-slate-900 m-0">Độc lập - Tự do - Hạnh phúc</p>
                        <p className="text-slate-400 text-xs m-0">-----------------------</p>
                        <p className="italic text-xs text-slate-600 m-0 mt-1">
                          TP. Hồ Chí Minh, ngày {formData.signedDate.split('-')[2]} tháng{' '}
                          {formData.signedDate.split('-')[1]} năm {formData.signedDate.split('-')[0]}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-center my-6">
                  <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900 m-0">QUYẾT ĐỊNH</h2>
                  <p className="font-bold text-sm text-slate-800 mt-1">
                    Về việc nâng bậc lương và điều chỉnh thu nhập cho Người lao động
                  </p>
                </div>

                <div className="text-center font-bold uppercase text-slate-900 text-sm">
                  TỔNG GIÁM ĐỐC CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE
                </div>

                <div className="italic text-xs text-justify space-y-1 text-slate-700 pl-3">
                  <p>- Căn cứ Bộ luật Lao động Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;</p>
                  <p>- Căn cứ Điều lệ tổ chức hoạt động của Công ty;</p>
                  <p>- Căn cứ Quy chế trả lương, thưởng và thang bảng lương của Công ty;</p>
                  <p>- Xét năng lực và hiệu quả công tác của Người lao động và đề nghị của Trưởng phòng Nhân sự.</p>
                </div>

                <div className="text-center font-bold text-base text-slate-900 my-4">QUYẾT ĐỊNH:</div>

                <div className="text-justify text-xs space-y-3">
                  <div>
                    <b>Điều 1:</b> Điều chỉnh nâng mức lương cơ bản cho cán bộ nhân viên có tên dưới đây:
                    <div className="pl-4 mt-2 space-y-1">
                      <p>
                        - Ông / Bà: <b>{selectedEmp?.fullName}</b> - Mã nhân viên: <b>{selectedEmp?.code}</b>
                      </p>
                      <p>
                        - Chức danh: <b>{selectedEmp?.position}</b> - Đơn vị: <b>{selectedDept?.name}</b>
                      </p>
                      <p>- Số CCCD / CMND: {selectedEmp?.identityCard}</p>
                      <p>
                        - Mức lương cũ trước điều chỉnh: <b>{formatVND(formData.currentSalary)}</b>
                      </p>
                      <p>
                        - Mức lương mới sau nâng bậc: <b className="text-emerald-700 text-sm">{formatVND(formData.newSalary)}</b> (Mức tăng: <b>+{formatVND(increaseAmount)}</b>)
                      </p>
                      <p>
                        - Bằng chữ: <i>{numberToVietnameseWords(formData.newSalary)}</i>
                      </p>
                      <p>- Lý do nâng lương: {formData.reason}</p>
                    </div>
                  </div>

                  <p>
                    <b>Điều 2:</b> Quyết định này có hiệu lực thi hành kể từ ngày <b>{formData.effectiveDate}</b>. Các
                    chế độ phụ cấp và quyền lợi khác thực hiện theo quy chế hiện hành của Công ty.
                  </p>

                  <p>
                    <b>Điều 3:</b> Các Ông/Bà Trưởng phòng Hành chính Nhân sự, Kế toán trưởng, Thủ trưởng các đơn vị
                    liên quan và Ông/Bà <b>{selectedEmp?.fullName}</b> chịu trách nhiệm thi hành quyết định này.
                  </p>
                </div>

                <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '10px' }}>
                        <p className="font-bold text-xs italic m-0">Nơi nhận:</p>
                        <p className="text-[11px] m-0">- Như Điều 3;</p>
                        <p className="text-[11px] m-0">- Ban Giám Đốc;</p>
                        <p className="text-[11px] m-0">- Lưu: VT, HSNS.</p>
                      </td>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                        <p className="font-bold text-xs uppercase m-0">{formData.signerTitle}</p>
                        <p className="italic text-[10px] text-slate-500 m-0 mt-0.5">(Ký tên và đóng dấu)</p>
                        <div style={{ height: '70px' }}></div>
                        <p className="font-bold text-xs m-0">{formData.signerName}</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (activeStep === 'preview') setActiveStep('form');
              else onClose();
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer text-xs"
          >
            {activeStep === 'preview' ? '← Quay lại chỉnh sửa' : 'Hủy bỏ'}
          </button>

          <div className="flex items-center space-x-2">
            {activeStep === 'form' ? (
              <button
                onClick={() => setActiveStep('preview')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs"
              >
                Xem trước văn bản →
              </button>
            ) : (
              <button
                onClick={handleApplyDecision}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs cursor-pointer text-xs flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ban Hành Quyết Định & Áp Dụng Lương</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
