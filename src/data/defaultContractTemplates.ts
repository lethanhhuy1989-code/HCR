import { DocumentTemplate, TemplateMergeField } from '../types/contractTemplate';

export const templateMergeFields: TemplateMergeField[] = [
  // Thông tin nhân sự
  { key: '{{HO_TEN}}', label: 'Họ và tên nhân viên', category: 'employee', example: 'Trần Văn Mạnh' },
  { key: '{{MA_NV}}', label: 'Mã số nhân viên', category: 'employee', example: 'NV-001' },
  { key: '{{SO_CCCD}}', label: 'Số CCCD / CMND', category: 'employee', example: '079090001234' },
  { key: '{{NGAY_CAP_CCCD}}', label: 'Ngày cấp CCCD', category: 'employee', example: '15/04/2021' },
  { key: '{{NOI_CAP_CCCD}}', label: 'Nơi cấp CCCD', category: 'employee', example: 'Cục Cảnh sát QLHC về TTXH' },
  { key: '{{NGAY_SINH}}', label: 'Ngày sinh', category: 'employee', example: '12/08/1990' },
  { key: '{{GIOI_TINH}}', label: 'Giới tính', category: 'employee', example: 'Nam' },
  { key: '{{QUOC_TICH}}', label: 'Quốc tịch', category: 'employee', example: 'Việt Nam' },
  { key: '{{QUE_QUAN}}', label: 'Quê quán / Nguyên quán', category: 'employee', example: 'Bến Tre' },
  { key: '{{CHO_O_HIEN_NAY}}', label: 'Chỗ ở hiện nay', category: 'employee', example: '120 Nguyễn Huệ, Quận 1, TP.HCM' },
  { key: '{{SO_DIEN_THOAI}}', label: 'Số điện thoại', category: 'employee', example: '0908 123 456' },
  { key: '{{EMAIL}}', label: 'Địa chỉ Email', category: 'employee', example: 'manh.tran@enterprise.vn' },
  { key: '{{SO_SO_BHXH}}', label: 'Mã số BHXH', category: 'employee', example: '7920194832' },
  { key: '{{SO_TAI_KHOAN}}', label: 'Số tài khoản ngân hàng', category: 'employee', example: '1903456789012' },
  { key: '{{NGAN_HANG}}', label: 'Tên ngân hàng chi nhánh', category: 'employee', example: 'Techcombank - CN Sài Gòn' },

  // Thông tin chức vụ & phòng ban
  { key: '{{CHUC_DANH}}', label: 'Chức vụ / Vị trí việc làm', category: 'employee', example: 'Kỹ sư Chỉ huy trưởng' },
  { key: '{{PHONG_BAN}}', label: 'Phòng ban / Đơn vị', category: 'employee', example: 'Phòng Kỹ thuật Thi công' },
  { key: '{{DIA_DIEM_LAM_VIEC}}', label: 'Địa điểm làm việc', category: 'contract', example: 'Trụ sở Công ty & các công trình dự án' },
  { key: '{{THOI_GIO_LAM_VIEC}}', label: 'Thời giờ làm việc', category: 'contract', example: '48 giờ/tuần (Thứ Hai đến Thứ Bảy)' },

  // Thông tin hợp đồng
  { key: '{{SO_HOP_DONG}}', label: 'Số / Mã hợp đồng', category: 'contract', example: 'HĐLĐ-2026/01-IT' },
  { key: '{{LOAI_HOP_DONG}}', label: 'Loại hợp đồng lao động', category: 'contract', example: 'Hợp đồng xác định thời hạn (12 tháng)' },
  { key: '{{NGAY_KY}}', label: 'Ngày ký kết (dd/mm/yyyy)', category: 'contract', example: '01/01/2026' },
  { key: '{{NGAY_BAT_DAU}}', label: 'Ngày bắt đầu hiệu lực', category: 'contract', example: '01/01/2026' },
  { key: '{{NGAY_KET_THUC}}', label: 'Ngày kết thúc hợp đồng', category: 'contract', example: '01/01/2027' },
  { key: '{{TY_LE_THU_VIEC}}', label: 'Tỷ lệ % lương thử việc', category: 'contract', example: '85%' },

  // Tiền lương & Chế độ
  { key: '{{LUONG_CO_BAN}}', label: 'Mức lương cơ bản (đã format)', category: 'salary', example: '15,000,000 VNĐ' },
  { key: '{{LUONG_CHU}}', label: 'Mức lương bằng chữ', category: 'salary', example: 'Mười lăm triệu đồng chẵn' },
  { key: '{{LUONG_BHXH}}', label: 'Mức lương đóng BHXH', category: 'salary', example: '15,000,000 VNĐ' },
  { key: '{{LUONG_CU}}', label: 'Mức lương cũ trước tăng', category: 'salary', example: '12,000,000 VNĐ' },
  { key: '{{LUONG_MOI}}', label: 'Mức lương mới sau tăng', category: 'salary', example: '16,000,000 VNĐ' },
  { key: '{{MUC_TANG}}', label: 'Số tiền lương được tăng', category: 'salary', example: '4,000,000 VNĐ' },
  { key: '{{PHU_CAP}}', label: 'Phụ cấp & Đãi ngộ', category: 'salary', example: 'Ăn trưa 50.000đ/ngày, Phụ cấp xăng xe theo dự án' },
  { key: '{{HINH_THUC_TRA_LUONG}}', label: 'Hình thức thanh toán lương', category: 'salary', example: 'Chuyển khoản vào ngày 05 - 10 hàng tháng' },

  // Quyết định & Bàn giao
  { key: '{{SO_QUYET_DINH}}', label: 'Số quyết định', category: 'decision', example: 'QĐ-NL/2026/08' },
  { key: '{{NGAY_HIEU_LUC_QD}}', label: 'Ngày hiệu lực quyết định', category: 'decision', example: '01/11/2026' },
  { key: '{{LY_DO_NANG_LUONG}}', label: 'Lý do nâng lương', category: 'decision', example: 'Hoàn thành xuất sắc nhiệm vụ và có nhiều sáng kiến' },
  { key: '{{NGAY_CHAM_DUT}}', label: 'Ngày chấm dứt hợp đồng', category: 'decision', example: '31/10/2026' },
  { key: '{{LY_DO_CHAM_DUT}}', label: 'Lý do chấm dứt / thanh lý', category: 'decision', example: 'Hai bên thỏa thuận chấm dứt HĐLĐ' },
  { key: '{{TIEN_TRO_CAP}}', label: 'Tiền trợ cấp thôi việc', category: 'decision', example: '15,000,000 VNĐ' },
  { key: '{{TAI_SAN_BAN_GIAO}}', label: 'Danh mục tài sản bàn giao', category: 'decision', example: 'Laptop Dell Latitude, Thẻ ra vào, Dụng cụ thi công' },

  // Thông tin doanh nghiệp & Ký kết
  { key: '{{TEN_CONG_TY}}', label: 'Tên đầy đủ công ty', category: 'company', example: 'CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG ENTERPRISE' },
  { key: '{{DIA_CHI_CONG_TY}}', label: 'Địa chỉ trụ sở công ty', category: 'company', example: 'Tòa nhà Enterprise Tower, Quận 1, TP. Hồ Chí Minh' },
  { key: '{{MST_CONG_TY}}', label: 'Mã số thuế công ty', category: 'company', example: '0314892839' },
  { key: '{{SDT_CONG_TY}}', label: 'Số điện thoại công ty', category: 'company', example: '(028) 3822 6868' },
  { key: '{{NGUOI_DAI_DIEN}}', label: 'Người đại diện pháp luật', category: 'company', example: 'Lê Thanh Huy' },
  { key: '{{CHUC_VU_DAI_DIEN}}', label: 'Chức danh người đại diện', category: 'company', example: 'Tổng Giám Đốc' },
  { key: '{{NGAY_HIEN_TAI}}', label: 'Ngày hiện tại (dd)', category: 'company', example: '23' },
  { key: '{{THANG_HIEN_TAI}}', label: 'Tháng hiện tại (mm)', category: 'company', example: '10' },
  { key: '{{NAM_HIEN_TAI}}', label: 'Năm hiện tại (yyyy)', category: 'company', example: '2026' },
];

/**
 * Chuyển đổi số tiền thành chữ Tiếng Việt chuẩn tài chính
 */
export function numberToVietnameseWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Không đồng';
  
  const textUnits = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroupOfThree(n: number, full: boolean): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const ten = Math.floor(remainder / 10);
    const unit = remainder % 10;
    let res = '';

    if (hundred > 0 || full) {
      res += `${digits[hundred]} trăm `;
    }

    if (ten > 1) {
      res += `${digits[ten]} mươi `;
      if (unit === 1) res += 'mốt ';
      else if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += `${digits[unit]} `;
    } else if (ten === 1) {
      res += 'mười ';
      if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += `${digits[unit]} `;
    } else if (ten === 0 && unit > 0) {
      if (hundred > 0 || full) res += 'lẻ ';
      res += `${digits[unit]} `;
    }

    return res.trim();
  }

  let s = Math.round(num).toString();
  const groups: number[] = [];
  while (s.length > 0) {
    const chunk = s.slice(-3);
    groups.push(parseInt(chunk, 10));
    s = s.slice(0, -3);
  }

  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const isFull = i < groups.length - 1;
      const gStr = readGroupOfThree(g, isFull);
      words += `${gStr} ${textUnits[i]} `;
    }
  }

  words = words.trim();
  if (!words) return 'Không đồng';
  
  // Viết hoa chữ cái đầu và thêm 'đồng chẵn'
  const finalWords = words.charAt(0).toUpperCase() + words.slice(1) + ' đồng chẵn';
  return finalWords.replace(/\s+/g, ' ');
}

/**
 * Replace all merge tags in content
 */
export function renderTemplateContent(templateContent: string, data: Record<string, string | number>): string {
  let result = templateContent;
  Object.entries(data).forEach(([key, val]) => {
    const formattedVal = val === undefined || val === null ? '' : String(val);
    const regex = new RegExp(key.replace(/([{}])/g, '\\$1'), 'g');
    result = result.replace(regex, formattedVal);
  });
  return result;
}

export const initialDocumentTemplates: DocumentTemplate[] = [
  // 1. MẪU HỢP ĐỒNG LAO ĐỘNG CHUẨN
  {
    id: 'tmpl-hdld-standard',
    code: 'MAU_HDLD_CHINH_THUC',
    name: 'Hợp Đồng Lao Động Chuẩn (Bộ LĐ-TB&XH)',
    category: 'contract',
    description: 'Mẫu hợp đồng lao động chuẩn hóa theo Bộ luật Lao động 2019 của Việt Nam, áp dụng cho nhân sự chính thức.',
    isDefault: true,
    updatedAt: '2026-10-23',
    content: `<div class="contract-document" style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-weight: bold; font-size: 12pt; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight: bold; font-size: 13pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
    <p style="margin: 4px 0 0 0; color: #64748b;">-----------------------------</p>
  </div>

  <div style="text-align: center; margin: 25px 0 20px 0;">
    <h2 style="font-size: 18pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a;">HỢP ĐỒNG LAO ĐỘNG</h2>
    <p style="font-style: italic; margin-top: 4px; font-size: 11pt;">Số: <b>{{SO_HOP_DONG}}</b></p>
  </div>

  <p style="text-align: justify; margin-bottom: 12px;">Hôm nay, ngày {{NGAY_HIEN_TAI}} tháng {{THANG_HIEN_TAI}} năm {{NAM_HIEN_TAI}}, tại Trụ sở Công ty, chúng tôi gồm có:</p>

  <div style="margin-bottom: 14px;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG</p>
    <div style="padding-left: 10px;">
      <p style="margin: 3px 0;">- Tên doanh nghiệp: <b>{{TEN_CONG_TY}}</b></p>
      <p style="margin: 3px 0;">- Đại diện pháp luật: <b>{{NGUOI_DAI_DIEN}}</b> - Chức danh: <b>{{CHUC_VU_DAI_DIEN}}</b></p>
      <p style="margin: 3px 0;">- Địa chỉ trụ sở: {{DIA_CHI_CONG_TY}}</p>
      <p style="margin: 3px 0;">- Mã số thuế: {{MST_CONG_TY}} - Số điện thoại: {{SDT_CONG_TY}}</p>
    </div>
  </div>

  <div style="margin-bottom: 16px;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">BÊN B: NGƯỜI LAO ĐỘNG</p>
    <div style="padding-left: 10px;">
      <p style="margin: 3px 0;">- Ông / Bà: <b>{{HO_TEN}}</b> - Mã nhân viên: <b>{{MA_NV}}</b></p>
      <p style="margin: 3px 0;">- Sinh ngày: {{NGAY_SINH}} - Giới tính: {{GIOI_TINH}} - Quốc tịch: {{QUOC_TICH}}</p>
      <p style="margin: 3px 0;">- Số CCCD / CMND: <b>{{SO_CCCD}}</b> - Ngày cấp: {{NGAY_CAP_CCCD}} - Nơi cấp: {{NOI_CAP_CCCD}}</p>
      <p style="margin: 3px 0;">- Quê quán: {{QUE_QUAN}}</p>
      <p style="margin: 3px 0;">- Nơi cư trú / Thường trú hiện nay: {{CHO_O_HIEN_NAY}}</p>
      <p style="margin: 3px 0;">- Số điện thoại: {{SO_DIEN_THOAI}} - Email: {{EMAIL}}</p>
      <p style="margin: 3px 0;">- Tài khoản ngân hàng: {{SO_TAI_KHOAN}} tại {{NGAN_HANG}}</p>
    </div>
  </div>

  <p style="margin-bottom: 12px;">Hai bên cùng nhau thỏa thuận ký kết hợp đồng lao động với các điều khoản sau đây:</p>

  <div style="margin-bottom: 14px;">
    <p style="font-weight: bold; margin: 0 0 4px 0;">Điều 1: Thời hạn và công việc hợp đồng</p>
    <div style="padding-left: 10px;">
      <p style="margin: 3px 0;">1. Loại hợp đồng: <b>{{LOAI_HOP_DONG}}</b>.</p>
      <p style="margin: 3px 0;">2. Thời hạn hợp đồng: Từ ngày <b>{{NGAY_BAT_DAU}}</b> đến ngày <b>{{NGAY_KET_THUC}}</b>.</p>
      <p style="margin: 3px 0;">3. Địa điểm làm việc: {{DIA_DIEM_LAM_VIEC}}.</p>
      <p style="margin: 3px 0;">4. Chức danh công việc / Vị trí: <b>{{CHUC_DANH}}</b> (Phòng ban: <b>{{PHONG_BAN}}</b>).</p>
      <p style="margin: 3px 0;">5. Nhiệm vụ: Thực hiện các công việc theo bản mô tả công việc và phân công của ban lãnh đạo.</p>
    </div>
  </div>

  <div style="margin-bottom: 14px;">
    <p style="font-weight: bold; margin: 0 0 4px 0;">Điều 2: Chế độ làm việc và bảo hộ</p>
    <div style="padding-left: 10px;">
      <p style="margin: 3px 0;">1. Thời giờ làm việc: {{THOI_GIO_LAM_VIEC}}.</p>
      <p style="margin: 3px 0;">2. Được trang bị đầy đủ phương tiện bảo hộ lao động và máy móc làm việc phục vụ chuyên môn.</p>
      <p style="margin: 3px 0;">3. Được nghỉ ngơi các ngày lễ, tết, phép năm nguyên lương theo quy định hiện hành của Bộ luật Lao động.</p>
    </div>
  </div>

  <div style="margin-bottom: 14px;">
    <p style="font-weight: bold; margin: 0 0 4px 0;">Điều 3: Nghĩa vụ và quyền lợi của người lao động</p>
    <div style="padding-left: 10px;">
      <p style="margin: 3px 0;">1. Mức lương cơ bản: <b>{{LUONG_CO_BAN}}</b> (Bằng chữ: <i>{{LUONG_CHU}}</i>).</p>
      <p style="margin: 3px 0;">2. Mức lương đóng BHXH, BHYT, BHTN: <b>{{LUONG_BHXH}}</b>.</p>
      <p style="margin: 3px 0;">3. Phụ cấp và phúc lợi: {{PHU_CAP}}.</p>
      <p style="margin: 3px 0;">4. Hình thức chi trả: {{HINH_THUC_TRA_LUONG}}.</p>
      <p style="margin: 3px 0;">5. Chế độ nâng bậc: Theo quy chế đánh giá năng lực và thang bảng lương của Công ty.</p>
    </div>
  </div>

  <div style="margin-bottom: 14px;">
    <p style="font-weight: bold; margin: 0 0 4px 0;">Điều 4: Điều khoản thi hành</p>
    <div style="padding-left: 10px;">
      <p style="margin: 3px 0; text-align: justify;">Hợp đồng này có hiệu lực từ ngày ký. Mọi sửa đổi, bổ sung phải được thực hiện bằng phụ lục hợp đồng văn bản. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.</p>
    </div>
  </div>

  <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">NGƯỜI LAO ĐỘNG (BÊN B)</p>
        <p style="font-style: italic; font-size: 10.5pt; margin: 2px 0 0 0; color: #64748b;">(Ký và ghi rõ họ tên)</p>
        <div style="height: 75px;"></div>
        <p style="font-weight: bold; margin: 0;">{{HO_TEN}}</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">ĐẠI DIỆN CÔNG TY (BÊN A)</p>
        <p style="font-style: italic; font-size: 10.5pt; margin: 2px 0 0 0; color: #64748b;">(Ký tên, đóng dấu và ghi rõ họ tên)</p>
        <div style="height: 75px;"></div>
        <p style="font-weight: bold; margin: 0;">{{NGUOI_DAI_DIEN}}</p>
      </td>
    </tr>
  </table>
</div>`,
  },

  // 2. MẪU QUYẾT ĐỊNH NÂNG LƯƠNG / TĂNG LƯƠNG
  {
    id: 'tmpl-qd-raise',
    code: 'MAU_QUYET_DINH_NANG_LUONG',
    name: 'Quyết Định Nâng Bậc Lương / Tăng Lương',
    category: 'salary_raise',
    description: 'Quyết định chính thức của Ban Giám Đốc về việc điều chỉnh nâng bậc lương và mức đãi ngộ cho cán bộ nhân viên.',
    isDefault: true,
    updatedAt: '2026-10-23',
    content: `<div class="decision-document" style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #1e293b;">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; font-size: 10.5pt; margin: 0; text-transform: uppercase;">{{TEN_CONG_TY}}</p>
        <p style="font-size: 11pt; margin: 3px 0 0 0;">Số: <b>{{SO_QUYET_DINH}}</b></p>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; font-size: 11pt; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="font-weight: bold; font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
        <p style="margin: 2px 0 0 0; color: #64748b;">-----------------------</p>
        <p style="font-style: italic; font-size: 11pt; margin: 4px 0 0 0;">TP. Hồ Chí Minh, ngày {{NGAY_HIEN_TAI}} tháng {{THANG_HIEN_TAI}} năm {{NAM_HIEN_TAI}}</p>
      </td>
    </tr>
  </table>

  <div style="text-align: center; margin: 25px 0;">
    <h2 style="font-size: 17pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a;">QUYẾT ĐỊNH</h2>
    <p style="font-weight: bold; font-size: 13pt; margin-top: 4px;">Về việc nâng bậc lương và điều chỉnh thu nhập cho Người lao động</p>
  </div>

  <div style="text-align: center; margin-bottom: 16px;">
    <p style="font-weight: bold; font-size: 13pt; margin: 0; text-transform: uppercase;">TỔNG GIÁM ĐỐC {{TEN_CONG_TY}}</p>
  </div>

  <div style="font-style: italic; text-align: justify; margin-bottom: 16px; padding-left: 10px;">
    <p style="margin: 3px 0;">- Căn cứ Bộ luật Lao động Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;</p>
    <p style="margin: 3px 0;">- Căn cứ Điều lệ tổ chức và hoạt động của {{TEN_CONG_TY}};</p>
    <p style="margin: 3px 0;">- Căn cứ Quy chế trả lương, thưởng và thang bảng lương của Công ty;</p>
    <p style="margin: 3px 0;">- Xét kết quả đánh giá năng lực, hiệu quả công tác của Người lao động và đề nghị của Trưởng phòng Nhân sự.</p>
  </div>

  <div style="text-align: center; margin: 15px 0;">
    <p style="font-weight: bold; font-size: 14pt; margin: 0;">QUYẾT ĐỊNH:</p>
  </div>

  <div style="text-align: justify; padding-left: 5px;">
    <p style="margin: 8px 0;"><b>Điều 1:</b> Điều chỉnh nâng mức lương cơ bản cho cán bộ nhân viên có tên dưới đây:</p>
    <div style="padding-left: 15px; margin-bottom: 10px;">
      <p style="margin: 3px 0;">- Ông / Bà: <b>{{HO_TEN}}</b> - Mã nhân viên: <b>{{MA_NV}}</b></p>
      <p style="margin: 3px 0;">- Chức vụ: <b>{{CHUC_DANH}}</b> - Đơn vị: <b>{{PHONG_BAN}}</b></p>
      <p style="margin: 3px 0;">- Số CCCD: {{SO_CCCD}}</p>
      <p style="margin: 3px 0;">- Mức lương cũ trước điều chỉnh: <b>{{LUONG_CU}}</b></p>
      <p style="margin: 3px 0;">- Mức lương mới sau điều chỉnh: <b style="color: #047857; font-size: 14pt;">{{LUONG_MOI}}</b> (Tăng: <b>{{MUC_TANG}}</b>)</p>
      <p style="margin: 3px 0;">- Bằng chữ: <i>{{LUONG_CHU}}</i></p>
      <p style="margin: 3px 0;">- Lý do nâng lương: {{LY_DO_NANG_LUONG}}</p>
    </div>

    <p style="margin: 8px 0;"><b>Điều 2:</b> Quyết định này có hiệu lực thi hành kể từ ngày <b>{{NGAY_HIEU_LUC_QD}}</b>. Các mức phụ cấp, quyền lợi khác thực hiện theo quy chế công ty.</p>

    <p style="margin: 8px 0;"><b>Điều 3:</b> Các Ông/Bà Trưởng phòng Hành chính Nhân sự, Kế toán trưởng, Trưởng phòng {{PHONG_BAN}} và Ông/Bà <b>{{HO_TEN}}</b> chịu trách nhiệm thi hành quyết định này.</p>
  </div>

  <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding-left: 10px;">
        <p style="font-weight: bold; font-size: 10.5pt; margin: 0;"><i>Nơi nhận:</i></p>
        <p style="font-size: 10pt; margin: 2px 0;">- Như Điều 3;</p>
        <p style="font-size: 10pt; margin: 2px 0;">- Ban Giám Đốc;</p>
        <p style="font-size: 10pt; margin: 2px 0;">- Lưu: VT, HSNS.</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">TỔNG GIÁM ĐỐC</p>
        <p style="font-style: italic; font-size: 10pt; margin: 2px 0 0 0; color: #64748b;">(Ký tên và đóng dấu)</p>
        <div style="height: 75px;"></div>
        <p style="font-weight: bold; margin: 0;">{{NGUOI_DAI_DIEN}}</p>
      </td>
    </tr>
  </table>
</div>`,
  },

  // 3. MẪU QUYẾT ĐỊNH CHẤM DỨT HỢP ĐỒNG LAO ĐỘNG
  {
    id: 'tmpl-qd-terminate',
    code: 'MAU_QUYET_DINH_CHAM_DUT_HDLD',
    name: 'Quyết Định Chấm Dứt Hợp Đồng Lao Động',
    category: 'termination',
    description: 'Quyết định hành chính chính thức chấm dứt hợp đồng lao động theo thỏa thuận hoặc khi hết hạn hợp đồng.',
    isDefault: true,
    updatedAt: '2026-10-23',
    content: `<div class="decision-document" style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #1e293b;">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; font-size: 10.5pt; margin: 0; text-transform: uppercase;">{{TEN_CONG_TY}}</p>
        <p style="font-size: 11pt; margin: 3px 0 0 0;">Số: <b>{{SO_QUYET_DINH}}</b></p>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; font-size: 11pt; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="font-weight: bold; font-size: 12pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
        <p style="margin: 2px 0 0 0; color: #64748b;">-----------------------</p>
        <p style="font-style: italic; font-size: 11pt; margin: 4px 0 0 0;">TP. Hồ Chí Minh, ngày {{NGAY_HIEN_TAI}} tháng {{THANG_HIEN_TAI}} năm {{NAM_HIEN_TAI}}</p>
      </td>
    </tr>
  </table>

  <div style="text-align: center; margin: 25px 0;">
    <h2 style="font-size: 17pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a;">QUYẾT ĐỊNH</h2>
    <p style="font-weight: bold; font-size: 13pt; margin-top: 4px;">Về việc chấm dứt Hợp đồng lao động</p>
  </div>

  <div style="text-align: center; margin-bottom: 16px;">
    <p style="font-weight: bold; font-size: 13pt; margin: 0; text-transform: uppercase;">TỔNG GIÁM ĐỐC {{TEN_CONG_TY}}</p>
  </div>

  <div style="font-style: italic; text-align: justify; margin-bottom: 16px; padding-left: 10px;">
    <p style="margin: 3px 0;">- Căn cứ Bộ luật Lao động Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;</p>
    <p style="margin: 3px 0;">- Căn cứ Hợp đồng lao động số <b>{{SO_HOP_DONG}}</b> đã ký kết giữa hai bên;</p>
    <p style="margin: 3px 0;">- Căn cứ Biên bản thỏa thuận chấm dứt hợp đồng lao động hoặc đơn xin thôi việc của Người lao động;</p>
    <p style="margin: 3px 0;">- Xét đề nghị của Trưởng phòng Nhân sự.</p>
  </div>

  <div style="text-align: center; margin: 15px 0;">
    <p style="font-weight: bold; font-size: 14pt; margin: 0;">QUYẾT ĐỊNH:</p>
  </div>

  <div style="text-align: justify; padding-left: 5px;">
    <p style="margin: 8px 0;"><b>Điều 1:</b> Nay chấm dứt Hợp đồng lao động số <b>{{SO_HOP_DONG}}</b> đối với:</p>
    <div style="padding-left: 15px; margin-bottom: 10px;">
      <p style="margin: 3px 0;">- Ông / Bà: <b>{{HO_TEN}}</b> - Mã nhân viên: <b>{{MA_NV}}</b></p>
      <p style="margin: 3px 0;">- Chức danh: <b>{{CHUC_DANH}}</b> - Phòng ban: <b>{{PHONG_BAN}}</b></p>
      <p style="margin: 3px 0;">- Số CCCD: {{SO_CCCD}}</p>
      <p style="margin: 3px 0;">- Ngày chính thức chấm dứt: <b>{{NGAY_CHAM_DUT}}</b></p>
      <p style="margin: 3px 0;">- Lý do chấm dứt: {{LY_DO_CHAM_DUT}}</p>
    </div>

    <p style="margin: 8px 0;"><b>Điều 2:</b> Trách nhiệm của các bên:</p>
    <div style="padding-left: 15px; margin-bottom: 10px;">
      <p style="margin: 3px 0;">1. Ông/Bà <b>{{HO_TEN}}</b> có trách nhiệm hoàn tất thủ tục bàn giao toàn bộ tài sản, công cụ, hồ sơ tài liệu theo quy định trước ngày {{NGAY_CHAM_DUT}}.</p>
      <p style="margin: 3px 0;">2. Phòng Kế toán và Phòng Nhân sự chịu trách nhiệm quyết toán tiền lương, ngày phép năm tồn và chốt, trả sổ Bảo hiểm xã hội đúng thời hạn quy định.</p>
      <p style="margin: 3px 0;">3. Tiền trợ cấp thôi việc (nếu có): <b>{{TIEN_TRO_CAP}}</b>.</p>
    </div>

    <p style="margin: 8px 0;"><b>Điều 3:</b> Các Ông/Bà Trưởng phòng Hành chính Nhân sự, Kế toán trưởng, các đơn vị liên quan và Ông/Bà <b>{{HO_TEN}}</b> chịu trách nhiệm thi hành quyết định này.</p>
  </div>

  <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding-left: 10px;">
        <p style="font-weight: bold; font-size: 10.5pt; margin: 0;"><i>Nơi nhận:</i></p>
        <p style="font-size: 10pt; margin: 2px 0;">- Như Điều 3;</p>
        <p style="font-size: 10pt; margin: 2px 0;">- Ban Giám Đốc;</p>
        <p style="font-size: 10pt; margin: 2px 0;">- Lưu: VT, HSNS.</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">TỔNG GIÁM ĐỐC</p>
        <p style="font-style: italic; font-size: 10pt; margin: 2px 0 0 0; color: #64748b;">(Ký tên và đóng dấu)</p>
        <div style="height: 75px;"></div>
        <p style="font-weight: bold; margin: 0;">{{NGUOI_DAI_DIEN}}</p>
      </td>
    </tr>
  </table>
</div>`,
  },

  // 4. MẪU BIÊN BẢN THANH LÝ HỢP ĐỒNG & BÀN GIAO
  {
    id: 'tmpl-bb-liquidation',
    code: 'MAU_BIEN_BAN_THANH_LY',
    name: 'Biên Bản Thanh Lý Hợp Đồng & Bàn Giao Tài Sản',
    category: 'liquidation',
    description: 'Biên bản nghiệm thu bàn giao tài sản, tài liệu, quyết toán công nợ và hoàn tất thủ tục thanh lý hợp đồng.',
    isDefault: true,
    updatedAt: '2026-10-23',
    content: `<div class="liquidation-document" style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-weight: bold; font-size: 12pt; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight: bold; font-size: 13pt; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
    <p style="margin: 4px 0 0 0; color: #64748b;">-----------------------------</p>
  </div>

  <div style="text-align: center; margin: 25px 0 20px 0;">
    <h2 style="font-size: 17pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a;">BIÊN BẢN THANH LÝ HỢP ĐỒNG LAO ĐỘNG</h2>
    <p style="font-style: italic; margin-top: 4px; font-size: 11pt;">Căn cứ Hợp đồng lao động số: <b>{{SO_HOP_DONG}}</b></p>
  </div>

  <p style="text-align: justify; margin-bottom: 12px;">Hôm nay, ngày {{NGAY_HIEN_TAI}} tháng {{THANG_HIEN_TAI}} năm {{NAM_HIEN_TAI}}, tại Văn phòng Công ty, chúng tôi gồm có:</p>

  <p><b>1. BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):</b></p>
  <div style="padding-left: 15px; margin-bottom: 10px;">
    <p style="margin: 3px 0;">- Công ty: <b>{{TEN_CONG_TY}}</b></p>
    <p style="margin: 3px 0;">- Đại diện: <b>{{NGUOI_DAI_DIEN}}</b> - Chức vụ: <b>{{CHUC_VU_DAI_DIEN}}</b></p>
  </div>

  <p><b>2. BÊN B (NGƯỜI LAO ĐỘNG):</b></p>
  <div style="padding-left: 15px; margin-bottom: 14px;">
    <p style="margin: 3px 0;">- Ông / Bà: <b>{{HO_TEN}}</b> - Mã NV: <b>{{MA_NV}}</b></p>
    <p style="margin: 3px 0;">- Chức vụ: {{CHUC_DANH}} - Phòng ban: {{PHONG_BAN}}</p>
    <p style="margin: 3px 0;">- Số CCCD: {{SO_CCCD}}</p>
  </div>

  <p>Hai bên cùng nhau tiến hành lập biên bản thanh lý hợp đồng lao động số {{SO_HOP_DONG}} với các nội dung sau:</p>

  <div style="margin-bottom: 14px; padding-left: 5px;">
    <p><b>Điều 1: Bàn giao công việc và tài sản</b></p>
    <p style="padding-left: 10px; margin: 3px 0;">- Bên B đã hoàn thành bàn giao toàn bộ công việc chuyên môn, hồ sơ tài liệu và dữ liệu số cho người tiếp nhận phụ trách.</p>
    <p style="padding-left: 10px; margin: 3px 0;">- Tài sản, công cụ bàn giao: {{TAI_SAN_BAN_GIAO}} (Đã kiểm tra hoạt động tốt, không hư hỏng, thất thoát).</p>
  </div>

  <div style="margin-bottom: 14px; padding-left: 5px;">
    <p><b>Điều 2: Quyết toán tiền lương và các chế độ</b></p>
    <p style="padding-left: 10px; margin: 3px 0;">- Tiền lương làm việc thực tế đến ngày chấm dứt: Đã thanh toán đầy đủ.</p>
    <p style="padding-left: 10px; margin: 3px 0;">- Trợ cấp thôi việc (nếu có): {{TIEN_TRO_CAP}}.</p>
    <p style="padding-left: 10px; margin: 3px 0;">- Chốt sổ và trả sổ BHXH: Bên A có trách nhiệm hoàn tất thủ tục và bàn giao sổ BHXH cho Bên B.</p>
  </div>

  <div style="margin-bottom: 14px; padding-left: 5px;">
    <p><b>Điều 3: Cam kết của các bên</b></p>
    <p style="padding-left: 10px; margin: 3px 0; text-align: justify;">Kể từ thời điểm ký biên bản này, Hợp đồng lao động số {{SO_HOP_DONG}} chính thức hết hiệu lực. Hai bên cam kết không còn khiếu nại hay tranh chấp quyền lợi nào khác liên quan đến hợp đồng đã chấm dứt.</p>
  </div>

  <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">NGƯỜI LAO ĐỘNG (BÊN B)</p>
        <p style="font-style: italic; font-size: 10.5pt; margin: 2px 0 0 0; color: #64748b;">(Ký và ghi rõ họ tên)</p>
        <div style="height: 75px;"></div>
        <p style="font-weight: bold; margin: 0;">{{HO_TEN}}</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">ĐẠI DIỆN CÔNG TY (BÊN A)</p>
        <p style="font-style: italic; font-size: 10.5pt; margin: 2px 0 0 0; color: #64748b;">(Ký tên, đóng dấu và ghi rõ họ tên)</p>
        <div style="height: 75px;"></div>
        <p style="font-weight: bold; margin: 0;">{{NGUOI_DAI_DIEN}}</p>
      </td>
    </tr>
  </table>
</div>`,
  },
];
