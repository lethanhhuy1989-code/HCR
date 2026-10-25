export type DocumentCategory =
  | 'contract' // Hợp đồng lao động chính thức
  | 'probation' // Hợp đồng thử việc
  | 'salary_raise' // Quyết định nâng lương / điều chỉnh lương
  | 'termination' // Quyết định chấm dứt hợp đồng
  | 'liquidation' // Biên bản thanh lý & bàn giao
  | 'addendum' // Phụ lục hợp đồng
  | 'custom'; // Mẫu văn bản tùy chỉnh khác

export interface TemplateMergeField {
  key: string; // VD: "{{HO_TEN}}"
  label: string; // VD: "Họ và tên nhân viên"
  category: 'employee' | 'contract' | 'salary' | 'company' | 'decision';
  example: string; // VD: "Nguyễn Văn A"
}

export interface DocumentTemplate {
  id: string;
  code: string; // VD: "MAU_HDLD_CHINH_THUC"
  name: string; // VD: "Mẫu Hợp Đồng Lao Động Chuẩn (Bộ LĐ-TB&XH)"
  category: DocumentCategory;
  description: string;
  content: string; // Nội dung văn bản có chứa các thẻ merge tags {{...}}
  isDefault?: boolean;
  updatedAt: string;
}

export interface SalaryRaiseDecisionData {
  decisionNumber: string; // VD: "QĐ-NL/2026/01"
  employeeId: string;
  currentSalary: number;
  newSalary: number;
  effectiveDate: string;
  signedDate: string;
  reason: string;
  signerName: string;
  signerTitle: string;
  updateEmployeeProfile: boolean;
  createAddendum: boolean;
  notes?: string;
}

export interface TerminationDecisionData {
  decisionNumber: string; // VD: "QĐ-CD/2026/01"
  contractId: string;
  employeeId: string;
  terminationDate: string;
  signedDate: string;
  reason: string;
  severancePay: number; // Tiền trợ cấp thôi việc / bồi thường (nếu có)
  handoverItems: string; // Danh mục tài sản, hồ sơ, máy tính bàn giao
  signerName: string;
  signerTitle: string;
  updateContractStatus: boolean;
  notes?: string;
}
