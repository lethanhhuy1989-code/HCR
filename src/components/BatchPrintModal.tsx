import React from 'react';
import JSZip from 'jszip';
import { useHRM } from '../context/HRMContext';
import { LaborContract } from '../types/hrm';
import { formatVND } from '../utils/payrollCalculator';
import { numberToVietnameseWords } from '../data/defaultContractTemplates';
import {
  Printer,
  Download,
  X,
  FileText,
  Archive,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface BatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContractIds: string[];
}

export const BatchPrintModal: React.FC<BatchPrintModalProps> = ({
  isOpen,
  onClose,
  selectedContractIds,
}) => {
  const { contracts, employees, departments, showToast } = useHRM();

  if (!isOpen || selectedContractIds.length === 0) return null;

  const targetContracts = contracts.filter((c) => selectedContractIds.includes(c.id));

  // Build single contract HTML
  const generateContractHtml = (c: LaborContract) => {
    const emp = employees.find((e) => e.id === c.employeeId);
    const dept = departments.find((d) => d.id === emp?.departmentId);

    return `
      <div class="contract-page" style="page-break-after: always; break-after: page; font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #1e293b; padding: 25px 35px; min-height: 1000px; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="font-weight: bold; font-size: 11pt; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p style="font-weight: bold; font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
          <p style="margin: 2px 0 0 0; color: #64748b;">-----------------------------</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <h2 style="font-size: 17pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a;">HỢP ĐỒNG LAO ĐỘNG</h2>
          <p style="font-style: italic; margin-top: 4px; font-size: 11pt;">Số: <b>${c.code}</b></p>
        </div>

        <p style="text-align: justify; margin-bottom: 12px; font-size: 12pt;">
          Hôm nay, ngày ${c.signedDate.split('-')[2]} tháng ${c.signedDate.split('-')[1]} năm ${c.signedDate.split('-')[0]}, tại Trụ sở Công ty, chúng tôi gồm có:
        </p>

        <div style="margin-bottom: 12px; font-size: 12pt;">
          <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG</p>
          <p style="margin: 2px 0;">- Doanh nghiệp: <b>CÔNG TY CP ĐẦU TƯ XÂY DỰNG ENTERPRISE</b></p>
          <p style="margin: 2px 0;">- Đại diện: <b>${c.signatoryName || 'Lê Thanh Huy'}</b> - Chức vụ: <b>${c.signatoryTitle || 'Tổng Giám Đốc'}</b></p>
          <p style="margin: 2px 0;">- Trụ sở: Tòa nhà Enterprise Tower, Quận 1, TP. Hồ Chí Minh - MST: 0314892839</p>
        </div>

        <div style="margin-bottom: 12px; font-size: 12pt;">
          <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">BÊN B: NGƯỜI LAO ĐỘNG</p>
          <p style="margin: 2px 0;">- Ông / Bà: <b>${emp?.fullName || ''}</b> - Mã NV: <b>${emp?.code || ''}</b></p>
          <p style="margin: 2px 0;">- Số CCCD / CMND: <b>${emp?.identityCard || ''}</b> - Nơi cư trú: ${emp?.currentAddress || ''}</p>
          <p style="margin: 2px 0;">- Điện thoại: ${emp?.phone || ''} - Email: ${emp?.email || ''}</p>
        </div>

        <div style="margin-bottom: 12px; font-size: 12pt;">
          <p style="font-weight: bold; margin: 0 0 3px 0;">Điều 1: Thời hạn và công việc</p>
          <p style="margin: 2px 0;">- Loại hợp đồng: <b>${c.contractTypeName}</b></p>
          <p style="margin: 2px 0;">- Thời hạn: Từ ngày <b>${c.startDate}</b> đến ngày <b>${c.endDate || 'Vô thời hạn'}</b></p>
          <p style="margin: 2px 0;">- Chức danh: <b>${c.jobTitle}</b> (Đơn vị: ${dept?.name || ''})</p>
          <p style="margin: 2px 0;">- Địa điểm làm việc: ${c.workLocation || 'Tại Văn phòng Công ty & các công trình trực thuộc'}</p>
        </div>

        <div style="margin-bottom: 12px; font-size: 12pt;">
          <p style="font-weight: bold; margin: 0 0 3px 0;">Điều 2: Tiền lương và chế độ đãi ngộ</p>
          <p style="margin: 2px 0;">- Mức lương cơ bản: <b>${formatVND(c.baseSalary)}</b>/tháng (Bằng chữ: <i>${numberToVietnameseWords(c.baseSalary)}</i>)</p>
          <p style="margin: 2px 0;">- Mức lương tham gia BHXH: <b>${formatVND(c.insuranceSalary)}</b>/tháng</p>
          <p style="margin: 2px 0;">- Phụ cấp: ${c.allowancesDescription || 'Phụ cấp ăn trưa, công tác phí theo quy chế'}</p>
          <p style="margin: 2px 0;">- Thời giờ làm việc: ${c.workingHours || '48 giờ/tuần (Thứ Hai đến Thứ Bảy)'}</p>
        </div>

        <div style="margin-bottom: 12px; font-size: 12pt;">
          <p style="font-weight: bold; margin: 0 0 3px 0;">Điều 3: Điều khoản thi hành</p>
          <p style="margin: 2px 0; text-align: justify;">Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thi hành.</p>
        </div>

        <table style="width: 100%; margin-top: 35px; border-collapse: collapse; font-size: 12pt;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <p style="font-weight: bold; margin: 0; text-transform: uppercase;">NGƯỜI LAO ĐỘNG (BÊN B)</p>
              <p style="font-style: italic; font-size: 10pt; margin: 2px 0 0 0; color: #64748b;">(Ký và ghi rõ họ tên)</p>
              <div style="height: 60px;"></div>
              <p style="font-weight: bold; margin: 0;">${emp?.fullName || ''}</p>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <p style="font-weight: bold; margin: 0; text-transform: uppercase;">ĐẠI DIỆN DOANH NGHIỆP (BÊN A)</p>
              <p style="font-style: italic; font-size: 10pt; margin: 2px 0 0 0; color: #64748b;">(Ký tên, đóng dấu và ghi rõ họ tên)</p>
              <div style="height: 60px;"></div>
              <p style="font-weight: bold; margin: 0;">${c.signatoryName || 'Lê Thanh Huy'}</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  // Download all selected contracts as a single ZIP file containing separate .doc files
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();

      targetContracts.forEach((c) => {
        const emp = employees.find((e) => e.id === c.employeeId);
        const fileName = `HDLD_${c.code.replace(/[/\\?%*:|"<>]/g, '-')}_${emp?.fullName || 'NV'}.doc`;
        const htmlDoc = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><title>${c.code}</title></head>
          <body>${generateContractHtml(c)}</body>
          </html>
        `;
        zip.file(fileName, '\ufeff' + htmlDoc);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bo_Hop_Dong_Lao_Dong_${new Date().toISOString().split('T')[0]}_${targetContracts.length}_ban.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Đã xuất thành công gói ZIP chứa ${targetContracts.length} hợp đồng Word!`, 'success');
    } catch (err: any) {
      console.error('Lỗi nén ZIP:', err);
      showToast('Có lỗi xảy ra khi nén tệp ZIP: ' + (err?.message || ''), 'error');
    }
  };

  // Download all selected contracts in 1 single merged Word document
  const handleDownloadMergedWord = () => {
    const allHtml = targetContracts.map((c) => generateContractHtml(c)).join('\n');
    const mergedDocHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Tap_Hop_Dong_Lao_Dong</title>
      <style>
        @page { size: A4; margin: 20mm; }
        .contract-page { page-break-after: always; mso-break-type: section-break; }
      </style>
      </head>
      <body>${allHtml}</body>
      </html>
    `;
    const blob = new Blob(['\ufeff', mergedDocHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tap_Hop_Dong_Lao_Dong_Gop_${targetContracts.length}_nhan_su.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file Word gộp ${targetContracts.length} hợp đồng thành công!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">
                In & Xuất Hàng Loạt {targetContracts.length} Hợp Đồng Đã Chọn
              </h3>
              <p className="text-[11px] text-slate-400">
                Tự động ngắt trang A4 chuẩn văn bản, hỗ trợ in trực tiếp hoặc tải gói ZIP chứa từng file Word riêng
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadZip}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Tải gói file ZIP chứa các file Word riêng lẻ cho từng nhân sự"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Tải file ZIP (.zip)</span>
            </button>

            <button
              onClick={handleDownloadMergedWord}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Tải 1 file Word gộp toàn bộ hợp đồng"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải 1 file Word gộp</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="In ra giấy A4 toàn bộ hợp đồng"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Toàn Bộ ({targetContracts.length} bản A4)</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected List Summary Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-900">Danh sách các nhân sự được in ({targetContracts.length}):</span>
            <span className="text-slate-500">
              {targetContracts.map((c) => employees.find((e) => e.id === c.employeeId)?.fullName).filter(Boolean).slice(0, 5).join(', ')}
              {targetContracts.length > 5 ? ` và ${targetContracts.length - 5} người khác...` : ''}
            </span>
          </div>
        </div>

        {/* Document Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100">
          <div className="space-y-8 max-w-3xl mx-auto">
            {targetContracts.map((c, idx) => (
              <div key={c.id} className="relative">
                <div className="absolute -top-3 left-4 bg-slate-800 text-white font-mono text-[10px] px-2.5 py-0.5 rounded shadow-xs z-10">
                  Hợp đồng #{idx + 1}: {c.code}
                </div>
                <div
                  className="bg-white rounded-lg shadow-md border border-slate-200"
                  dangerouslySetInnerHTML={{ __html: generateContractHtml(c) }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
