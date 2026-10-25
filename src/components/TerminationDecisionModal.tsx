import React, { useState } from 'react';
import { useHRM } from '../context/HRMContext';
import { LaborContract } from '../types/hrm';
import { TerminationDecisionData } from '../types/contractTemplate';
import { formatVND } from '../utils/payrollCalculator';
import { numberToVietnameseWords } from '../data/defaultContractTemplates';
import {
  Ban,
  FileCheck2,
  Printer,
  Download,
  X,
  Check,
  FileText,
  PackageCheck,
  ShieldAlert,
} from 'lucide-react';

interface TerminationDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContractId?: string;
}

export const TerminationDecisionModal: React.FC<TerminationDecisionModalProps> = ({
  isOpen,
  onClose,
  defaultContractId,
}) => {
  const {
    contracts,
    employees,
    departments,
    terminateContract,
    showToast,
  } = useHRM();

  const [activeTab, setActiveTab] = useState<'form' | 'decision_preview' | 'liquidation_preview'>('form');

  const selectedContract =
    contracts.find((c) => c.id === defaultContractId) || contracts[0];
  const targetEmp = employees.find((e) => e.id === selectedContract?.employeeId);
  const targetDept = departments.find((d) => d.id === targetEmp?.departmentId);

  const yr = new Date().getFullYear();
  const [formData, setFormData] = useState<TerminationDecisionData>({
    decisionNumber: `QĐ-CD/${yr}/${String(Math.floor(10 + Math.random() * 90))}`,
    contractId: selectedContract?.id || '',
    employeeId: selectedContract?.employeeId || '',
    terminationDate: new Date().toISOString().split('T')[0],
    signedDate: new Date().toISOString().split('T')[0],
    reason: 'Hai bên tự nguyện thỏa thuận chấm dứt hợp đồng lao động',
    severancePay: selectedContract ? selectedContract.baseSalary : 15000000,
    handoverItems: 'Laptop Dell Latitude, Thẻ ra vào văn phòng, Dụng cụ thi công công trình, Tài liệu chuyên môn',
    signerName: 'Lê Thanh Huy',
    signerTitle: 'Tổng Giám Đốc',
    updateContractStatus: true,
    notes: 'Đã hoàn tất bàn giao và thanh toán đầy đủ các chế độ',
  });

  if (!isOpen) return null;

  const currentContract =
    contracts.find((c) => c.id === formData.contractId) || selectedContract;
  const currentEmp =
    employees.find((e) => e.id === currentContract?.employeeId) || targetEmp;
  const currentDept = departments.find((d) => d.id === currentEmp?.departmentId);

  const handleContractChange = (contractId: string) => {
    const c = contracts.find((item) => item.id === contractId);
    if (!c) return;
    setFormData((prev) => ({
      ...prev,
      contractId,
      employeeId: c.employeeId,
      severancePay: c.baseSalary || 15000000,
    }));
  };

  // Submit and terminate
  const handleApplyTermination = () => {
    if (!currentContract) return;

    if (formData.updateContractStatus) {
      terminateContract(
        currentContract.id,
        formData.terminationDate,
        `${formData.reason} (QĐ số ${formData.decisionNumber}). Tài sản bàn giao: ${formData.handoverItems}. Trợ cấp: ${formatVND(formData.severancePay)}`
      );
    }

    showToast(
      `Đã ban hành Quyết định chấm dứt HĐ ${currentContract.code} và lập Biên bản thanh lý thành công!`,
      'success'
    );
    onClose();
  };

  // Download Word Document
  const handleDownloadWord = (docType: 'decision' | 'liquidation') => {
    const title = docType === 'decision' ? 'Quyet_Dinh_Cham_Dut_HDLD' : 'Bien_Ban_Thanh_Ly_HDLD';
    const isDec = docType === 'decision';

    const content = isDec
      ? `
      <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 45%; text-align: center;">
              <p style="font-weight: bold; font-size: 11pt; margin: 0;">CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE</p>
              <p style="font-size: 11pt; margin: 2px 0;">Số: <b>${formData.decisionNumber}</b></p>
            </td>
            <td style="width: 55%; text-align: center;">
              <p style="font-weight: bold; font-size: 11pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p style="font-weight: bold; font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
              <p style="font-style: italic; font-size: 11pt;">TP.HCM, ngày ${formData.signedDate}</p>
            </td>
          </tr>
        </table>
        <h2 style="text-align: center; margin: 25px 0 5px 0;">QUYẾT ĐỊNH</h2>
        <p style="text-align: center; font-weight: bold;">Về việc chấm dứt Hợp đồng lao động</p>
        <p><b>Điều 1:</b> Chấm dứt Hợp đồng lao động số <b>${currentContract?.code}</b> đối với Ông/Bà <b>${currentEmp?.fullName}</b> (Chức vụ: <b>${currentContract?.jobTitle}</b> - Phòng: <b>${currentDept?.name}</b>).<br/>
        - Ngày chấm dứt: <b>${formData.terminationDate}</b><br/>
        - Lý do: ${formData.reason}</p>
        <p><b>Điều 2:</b> Quyền lợi và nghĩa vụ:<br/>
        - Bàn giao tài sản: ${formData.handoverItems}<br/>
        - Tiền trợ cấp thôi việc: <b>${formatVND(formData.severancePay)}</b> (Bằng chữ: <i>${numberToVietnameseWords(formData.severancePay)}</i>)<br/>
        - Chốt và trả sổ BHXH đầy đủ.</p>
        <p><b>Điều 3:</b> Các bên liên quan chịu trách nhiệm thi hành quyết định này.</p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%;"><b>Nơi nhận:</b><br/>- Như Điều 3;<br/>- Lưu HSNS.</td>
            <td style="width: 50%; text-align: center;"><b>TỔNG GIÁM ĐỐC</b><br/><br/><br/><br/><b>${formData.signerName}</b></td>
          </tr>
        </table>
      </div>`
      : `
      <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 5px;">BIÊN BẢN THANH LÝ HỢP ĐỒNG LAO ĐỘNG</h2>
        <p style="text-align: center; font-style: italic;">Căn cứ HĐLĐ số: <b>${currentContract?.code}</b></p>
        <p>Hôm nay, ngày ${formData.signedDate}, chúng tôi gồm:</p>
        <p><b>BÊN A:</b> CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE (Đại diện: <b>${formData.signerName}</b>)</p>
        <p><b>BÊN B:</b> Ông/Bà <b>${currentEmp?.fullName}</b> (CCCD: ${currentEmp?.identityCard})</p>
        <p><b>Nội dung thanh lý:</b><br/>
        1. Bàn giao công việc và tài sản: ${formData.handoverItems} (Đã bàn giao đầy đủ).<br/>
        2. Quyết toán tài chính: Tiền trợ cấp thôi việc ${formatVND(formData.severancePay)} và lương thực tế đã thanh toán xong.<br/>
        3. Kể từ ngày ký biên bản này, HĐLĐ số ${currentContract?.code} chính thức thanh lý, hai bên không còn khiếu nại gì.</p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;"><b>NGƯỜI LAO ĐỘNG</b><br/><br/><br/><br/><b>${currentEmp?.fullName}</b></td>
            <td style="width: 50%; text-align: center;"><b>ĐẠI DIỆN CÔNG TY</b><br/><br/><br/><br/><b>${formData.signerName}</b></td>
          </tr>
        </table>
      </div>`;

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title></head>
      <body>${content}</body>
      </html>
    `;
    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}_${currentEmp?.fullName || 'NV'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã tải xuống file Word: ${title}!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Ban className="w-5 h-5 text-rose-300" />
            <div>
              <h3 className="font-bold text-sm">
                Quyết Định Chấm Dứt & Biên Bản Thanh Lý Hợp Đồng Lao Động
              </h3>
              <p className="text-[11px] text-rose-300">
                Thủ tục pháp lý chấm dứt hợp đồng, quyết toán công nợ và biên bản bàn giao tài sản
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1 rounded hover:bg-rose-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-5 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 text-xs overflow-x-auto touch-scroll-x no-scrollbar w-full sm:w-auto py-0.5">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'form' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Thông số chấm dứt
            </button>
            <button
              onClick={() => setActiveTab('decision_preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'decision_preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Quyết định Chấm dứt A4
            </button>
            <button
              onClick={() => setActiveTab('liquidation_preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'liquidation_preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Biên bản Thanh lý & Bàn giao A4
            </button>
          </div>

          {activeTab !== 'form' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDownloadWord(activeTab === 'decision_preview' ? 'decision' : 'liquidation')}
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
          {activeTab === 'form' ? (
            <div className="space-y-4">
              {/* Select contract */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Chọn hợp đồng lao động chấm dứt <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.contractId}
                    onChange={(e) => handleContractChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:outline-rose-600"
                  >
                    {contracts.map((c) => {
                      const emp = employees.find((e) => e.id === c.employeeId);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.code} - {emp?.fullName} ({c.jobTitle})
                        </option>
                      );
                    })}
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-rose-900 focus:bg-white focus:outline-rose-600"
                  />
                </div>
              </div>

              {/* Termination Date & Sign Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày chính thức chấm dứt hiệu lực <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.terminationDate}
                    onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngày ký quyết định</label>
                  <input
                    type="date"
                    required
                    value={formData.signedDate}
                    onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-rose-600"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lý do chấm dứt hợp đồng</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-rose-600"
                >
                  <option value="Hai bên tự nguyện thỏa thuận chấm dứt hợp đồng lao động">
                    Hai bên tự nguyện thỏa thuận chấm dứt hợp đồng lao động
                  </option>
                  <option value="Hết hạn hợp đồng lao động và hai bên không tiếp tục gia hạn">
                    Hết hạn hợp đồng lao động và hai bên không tiếp tục gia hạn
                  </option>
                  <option value="Người lao động có đơn xin thôi việc theo nguyện vọng cá nhân">
                    Người lao động có đơn xin thôi việc theo nguyện vọng cá nhân
                  </option>
                  <option value="Kết thúc giai đoạn thử việc không đạt yêu cầu chuyên môn">
                    Kết thúc giai đoạn thử việc không đạt yêu cầu chuyên môn
                  </option>
                  <option value="Doanh nghiệp thay đổi cơ cấu tổ chức thi công công trình">
                    Doanh nghiệp thay đổi cơ cấu tổ chức thi công công trình
                  </option>
                </select>
              </div>

              {/* Severance pay */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2">
                <label className="block text-slate-800 font-semibold text-xs">
                  Tiền trợ cấp thôi việc / bồi thường (nếu có - VNĐ):
                </label>
                <input
                  type="number"
                  step={500000}
                  value={formData.severancePay}
                  onChange={(e) => setFormData({ ...formData, severancePay: Number(e.target.value) })}
                  className="w-full bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-900"
                />
                <div className="text-[11px] text-slate-600 italic">
                  Bằng chữ: <b>{numberToVietnameseWords(formData.severancePay)}</b>
                </div>
              </div>

              {/* Handover items */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Danh mục tài sản, thiết bị, hồ sơ bàn giao
                </label>
                <textarea
                  rows={2}
                  value={formData.handoverItems}
                  onChange={(e) => setFormData({ ...formData, handoverItems: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-rose-600"
                />
              </div>

              {/* Signer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Đại diện Công ty ký</label>
                  <input
                    type="text"
                    value={formData.signerName}
                    onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chức vụ người ký</label>
                  <input
                    type="text"
                    value={formData.signerTitle}
                    onChange={(e) => setFormData({ ...formData, signerTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-rose-600"
                  />
                </div>
              </div>

              {/* Checkbox update */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <label className="flex items-center space-x-2 text-slate-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.updateContractStatus}
                    onChange={(e) => setFormData({ ...formData, updateContractStatus: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <span>
                    Tự động cập nhật trạng thái hợp đồng thành <b>"Đã thanh lý"</b> trong hệ thống
                  </span>
                </label>
              </div>
            </div>
          ) : activeTab === 'decision_preview' ? (
            /* PREVIEW DECISION */
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
                    Về việc chấm dứt Hợp đồng lao động
                  </p>
                </div>

                <div className="text-center font-bold uppercase text-slate-900 text-sm">
                  TỔNG GIÁM ĐỐC CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE
                </div>

                <div className="italic text-xs text-justify space-y-1 text-slate-700 pl-3">
                  <p>- Căn cứ Bộ luật Lao động Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;</p>
                  <p>- Căn cứ Hợp đồng lao động số <b>{currentContract?.code}</b> đã ký kết giữa hai bên;</p>
                  <p>- Căn cứ lý do chấm dứt và đề nghị của Trưởng phòng Nhân sự.</p>
                </div>

                <div className="text-center font-bold text-base text-slate-900 my-4">QUYẾT ĐỊNH:</div>

                <div className="text-justify text-xs space-y-3">
                  <div>
                    <b>Điều 1:</b> Chấm dứt Hợp đồng lao động số <b>{currentContract?.code}</b> đối với cán bộ nhân sự:
                    <div className="pl-4 mt-2 space-y-1">
                      <p>
                        - Ông / Bà: <b>{currentEmp?.fullName}</b> - Mã nhân viên: <b>{currentEmp?.code}</b>
                      </p>
                      <p>
                        - Chức danh: <b>{currentContract?.jobTitle}</b> - Đơn vị: <b>{currentDept?.name}</b>
                      </p>
                      <p>- Số CCCD: {currentEmp?.identityCard}</p>
                      <p>
                        - Ngày chính thức chấm dứt: <b>{formData.terminationDate}</b>
                      </p>
                      <p>- Lý do: {formData.reason}</p>
                    </div>
                  </div>

                  <div>
                    <b>Điều 2:</b> Chế độ thanh toán và trách nhiệm:
                    <div className="pl-4 mt-1 space-y-1">
                      <p>- Bàn giao tài sản, tài liệu: {formData.handoverItems}</p>
                      <p>
                        - Tiền trợ cấp thôi việc: <b>{formatVND(formData.severancePay)}</b> (Bằng chữ: <i>{numberToVietnameseWords(formData.severancePay)}</i>)
                      </p>
                      <p>- Chốt và trả sổ Bảo hiểm xã hội đầy đủ theo đúng luật định.</p>
                    </div>
                  </div>

                  <p>
                    <b>Điều 3:</b> Các phòng ban liên quan và Ông/Bà <b>{currentEmp?.fullName}</b> chịu trách nhiệm thi hành quyết định này.
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
          ) : (
            /* PREVIEW LIQUIDATION PROTOCOL */
            <div className="bg-slate-50 p-6 sm:p-10 rounded-xl border border-slate-200 overflow-x-auto shadow-inner">
              <div className="bg-white p-8 sm:p-12 rounded shadow-md border border-slate-200 max-w-3xl mx-auto font-serif text-slate-800 text-sm leading-relaxed space-y-5">
                <div className="text-center space-y-1">
                  <div className="font-bold text-xs uppercase text-slate-900">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="font-bold text-sm text-slate-900">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-slate-400 text-xs">---------------------------</div>
                </div>

                <div className="text-center my-4">
                  <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 m-0">
                    BIÊN BẢN THANH LÝ HỢP ĐỒNG LAO ĐỘNG
                  </h2>
                  <p className="text-xs italic text-slate-600 mt-1">
                    Căn cứ Hợp đồng lao động số: <b>{currentContract?.code}</b>
                  </p>
                </div>

                <p className="text-xs">
                  Hôm nay, ngày {formData.signedDate.split('-')[2]} tháng {formData.signedDate.split('-')[1]} năm{' '}
                  {formData.signedDate.split('-')[0]}, tại Văn phòng Công ty, chúng tôi gồm:
                </p>

                <div className="text-xs space-y-2">
                  <p>
                    <b>BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):</b> CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE<br/>
                    Đại diện: <b>{formData.signerName}</b> - Chức vụ: <b>{formData.signerTitle}</b>
                  </p>
                  <p>
                    <b>BÊN B (NGƯỜI LAO ĐỘNG):</b> Ông/Bà <b>{currentEmp?.fullName}</b> (Mã NV: {currentEmp?.code})<br/>
                    Số CCCD: {currentEmp?.identityCard} - Chức vụ: {currentContract?.jobTitle}
                  </p>
                </div>

                <div className="text-xs space-y-3 pt-2">
                  <p>
                    <b>Điều 1: Bàn giao công việc & tài sản:</b><br/>
                    Bên B đã hoàn thành bàn giao toàn bộ các tài sản và tài liệu gồm: <i>{formData.handoverItems}</i>. Bên A đã kiểm tra và tiếp nhận đầy đủ.
                  </p>
                  <p>
                    <b>Điều 2: Quyết toán chế độ:</b><br/>
                    Tiền trợ cấp thôi việc: <b>{formatVND(formData.severancePay)}</b> (Bằng chữ: <i>{numberToVietnameseWords(formData.severancePay)}</i>). Bên A đã thanh toán toàn bộ lương và hoàn tất thủ tục chốt sổ BHXH.
                  </p>
                  <p>
                    <b>Điều 3: Cam kết thanh lý:</b><br/>
                    Hợp đồng lao động số {currentContract?.code} chính thức thanh lý và chấm dứt hiệu lực. Hai bên không còn khiếu nại hay tranh chấp quyền lợi nào khác.
                  </p>
                </div>

                <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', textAlign: 'center' }}>
                        <p className="font-bold text-xs uppercase m-0">NGƯỜI LAO ĐỘNG (BÊN B)</p>
                        <p className="italic text-[10px] text-slate-500 m-0 mt-0.5">(Ký và ghi rõ họ tên)</p>
                        <div style={{ height: '70px' }}></div>
                        <p className="font-bold text-xs m-0">{currentEmp?.fullName}</p>
                      </td>
                      <td style={{ width: '50%', textAlign: 'center' }}>
                        <p className="font-bold text-xs uppercase m-0">ĐẠI DIỆN CÔNG TY (BÊN A)</p>
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
              if (activeTab !== 'form') setActiveTab('form');
              else onClose();
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer text-xs"
          >
            {activeTab !== 'form' ? '← Quay lại chỉnh sửa' : 'Hủy bỏ'}
          </button>

          <div className="flex items-center space-x-2">
            {activeTab === 'form' ? (
              <button
                onClick={() => setActiveTab('decision_preview')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs"
              >
                Xem trước quyết định →
              </button>
            ) : (
              <button
                onClick={handleApplyTermination}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-xs cursor-pointer text-xs flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ban Hành Quyết Định & Thanh Lý HĐLĐ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
