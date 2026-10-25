export interface SalaryGrade {
  id: string;
  code: string;
  name: string;
  standardBaseRate: number; // Mức lương cơ bản quy định
  coefficients: number[]; // Hệ số cho 8 bậc (Bậc 1 -> Bậc 8)
  competencySalaries: number[]; // Lương theo năng lực cho 8 bậc (VNĐ)
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerName?: string;
  location?: string;
}

export interface ConstructionProject {
  id: string;
  code: string; // Ký hiệu viết tắt (VD: BC, PL, PT, NH, LD, PM)
  name: string; // Tên công trình
  symbolFull: string; // Ký hiệu làm cả ngày (VD: BC)
  symbolHalf: string; // Ký hiệu nghỉ 1 buổi / nửa ngày (VD: BC/2)
  symbolLeave: string; // Ký hiệu nghỉ có phép (VD: BC/P)
  distanceKm: number; // Cự ly KM (Ctr-Cty)
  fuelAllowance: number; // Hỗ trợ xăng xe (VNĐ)
  fuelPricePerKm?: number; // Đơn giá xăng theo KM (VNĐ/km)
  mealAllowanceDaily?: number; // Mức tiền ăn theo ngày (VNĐ/ngày)
  remoteAllowanceTier: 'I' | 'II' | 'None'; // Phụ cấp công tác phí công trình xa
  managerName?: string;
  location?: string;
  status: 'active' | 'completed' | 'paused';
}

export interface JobPosition {
  id: string;
  code: string; // VD: CHT, KT, ACC, HC, VT, TK, TQ, LX
  title: string; // Tên vị trí việc làm: Chỉ huy trưởng, Kỹ thuật, Kế toán, Hành chính, Vật tư, Thủ kho, Thủ quỹ, Lái xe
  departmentId?: string; // Tùy chọn thuộc phòng ban nào (hoặc dùng chung)
  rank?: string; // Hạng chức danh liên quan phụ cấp công tác phí: 'A' | 'B' | 'C' | 'D'
  description?: string;
}

export interface RemoteAllowanceRate {
  id?: string;
  rank: string; // 'A' | 'B' | 'C' | 'D' | string
  rankDescription: string;
  applicablePositions?: string; // Tên các vị trí cấp chức danh áp dụng (VD: "Chỉ huy trưởng, Giám đốc...")
  tierI: number; // Trên 100km (Cấp I) - VNĐ/ngày
  tierII: number; // Từ 50km - 100km (Cấp II) - VNĐ/ngày
  notes?: string;
}

export type ContractType =
  | 'probation' // Thử việc
  | 'definite_1yr' // Xác định thời hạn 12 tháng
  | 'definite_3yr' // Xác định thời hạn 36 tháng
  | 'indefinite' // Không xác định thời hạn
  | 'seasonal' // Theo mùa vụ / Theo công trình
  | 'service'; // Hợp đồng dịch vụ / CTV

export interface ContractAppendix {
  id: string;
  code: string; // VD: PL-01/HĐLĐ-2026
  contractId: string;
  signedDate: string;
  effectiveDate: string;
  type: 'salary_adjustment' | 'position_change' | 'term_extension' | 'other';
  title: string;
  description: string;
  newBaseSalary?: number;
  newInsuranceSalary?: number;
  newJobTitle?: string;
  newEndDate?: string;
}

export interface LaborContract {
  id: string;
  code: string;
  employeeId: string;
  contractType: ContractType;
  contractTypeName: string;
  startDate: string;
  endDate?: string;
  signedDate: string;
  jobTitle: string;
  baseSalary: number;
  insuranceSalary: number;
  status: 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'draft';
  workingHours?: string; // Thời gian làm việc chuẩn (VD: 48h/tuần)
  workLocation?: string; // Địa điểm làm việc
  probationRate?: number; // % lương thử việc (85% hoặc 100%)
  probationSalary?: number; // Mức lương thử việc thực nhận (VNĐ hoặc tự nhập)
  allowancesDescription?: string; // Mô tả phụ cấp kèm theo
  paymentMethod?: string; // Hình thức thanh toán lương
  signatoryName?: string; // Đại diện người sử dụng lao động
  signatoryTitle?: string; // Chức vụ người đại diện ký
  notes?: string;
  terminationDate?: string;
  terminationReason?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  appendices?: ContractAppendix[];
}

export interface InsuranceProfile {
  id: string;
  employeeId: string;
  insuranceBookNumber: string; // Số sổ BHXH
  hospitalRegistration: string; // Nơi đăng ký KCB ban đầu
  insuranceSalary: number; // Mức đóng BHXH
  status: 'active' | 'paused' | 'not_eligible';
  startDate: string;
}

// Cấu hình phụ cấp công trình theo từng nhân sự & từng công trình
export interface EmployeeProjectAllowance {
  projectId: string;
  assigned: boolean; // Nhân sự có làm việc tại công trình này
  hasCompanyVehicle: boolean; // 3. Cấp xe đi công trình (nếu cấp xe sẽ KHÔNG tính tiền phụ cấp xăng)
  hasFuelAllowance: boolean; // 1. Phụ cấp tiền xăng = cự ly x giá xăng
  hasMealAllowance: boolean; // 2. Phụ cấp tiền ăn theo ngày cho từng công trình
  customDistanceKm?: number; // Cự ly tùy biến (nếu khác mặc định của công trình)
  customMealPerDay?: number; // Mức tiền ăn theo ngày tùy biến
  customFuelPrice?: number; // Đơn giá xăng tùy biến
}

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  avatar?: string;
  departmentId: string;
  position: string;
  gradeId: string; // Ngạch lương tham chiếu
  tierIndex: number; // Bậc lương hiện tại (1 -> 8)
  
  // Tùy chọn Bậc lương vị trí: Lương thoả thuận & Phụ cấp trách nhiệm
  salaryType?: 'scale' | 'negotiated'; // 'scale': Theo thang bảng lương 8 bậc; 'negotiated': Lương thoả thuận
  negotiatedSalary?: number; // Mức lương thỏa thuận (VNĐ/tháng)
  negotiatedType?: 'monthly' | 'daily'; // 'monthly': Lương trọn tháng; 'daily': Lương tính theo ngày công
  negotiatedDailyRate?: number; // Mức lương theo ngày (nếu nhập trực tiếp VNĐ/ngày hoặc quy đổi)
  responsibilityAllowance?: number; // Phụ cấp trách nhiệm (VNĐ/tháng)
  positionRank?: string; // Hạng vị trí chức danh liên kết phụ cấp công tác phí xa ('A' | 'B' | 'C' | 'D')

  // Tùy chọn Phụ cấp từng công trình cho nhân sự
  projectAllowances?: Record<string, EmployeeProjectAllowance>;

  email: string;
  phone: string;
  identityCard: string;
  joinDate: string;
  bankAccount: string;
  bankName: string;
  socialInsuranceCode?: string; // Mã số BHXH
  hometown?: string; // Nguyên quán / Quê quán
  currentAddress?: string; // Chỗ ở hiện nay
  dependentsCount: number; // Số người phụ thuộc giảm trừ gia cảnh
  status: 'active' | 'probation' | 'leave' | 'terminated';
  birthDate?: string;
  phoneEmergency?: string;
}

export interface TimesheetRecord {
  id: string;
  employeeId: string;
  month: string; // Format "YYYY-MM"
  standardWorkingDays: number;
  actualWorkingDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  otHoursNormal: number;
  otHoursWeekend: number;
  lateArrivalMinutes: number;
  dailySymbols?: Record<number, string>; // Ký hiệu chấm công từng ngày (1 - 31)
  
  // Tăng ca cho từng nhân sự (chấm theo giờ từng ngày, cuối chia 8 tiếng để tính ngày công)
  hasOvertime?: boolean; // Tích chọn tăng ca cho nhân sự này
  dailyOtHours?: Record<number, number>; // Số giờ tăng ca từng ngày (1 - 31)
  totalOtHours?: number; // Tổng số giờ tăng ca trong tháng
  otConvertedDays?: number; // Quy đổi ra số ngày công = totalOtHours / 8 tiếng

  // Phụ cấp xăng & Phương tiện 31 ngày (Xe máy: Tính xăng = Cự ly x Đơn giá; Ô tô: Không tính xăng)
  hasFuelAllowance?: boolean; // Bật / Tắt phụ cấp xăng cho nhân sự trong kỳ chấm công
  dailyVehicle?: Record<number, 'motorcycle' | 'car'>; // Chi tiết từng ngày (1 - 31): 'motorcycle' (xe máy) | 'car' (ô tô)
  totalFuelDistanceKm?: number; // Tổng cự ly km được tính phụ cấp xăng trong tháng
  totalFuelDays?: number; // Tổng số ngày đi xe máy tính phụ cấp xăng
  totalFuelAllowanceAmount?: number; // Tổng tiền phụ cấp xăng trong tháng = sum(cự ly ngày đi xe máy x giá xăng)
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  month: string; // "YYYY-MM"
  kpiScore: number; // 0 - 100+ (%)
  rating: 'A+' | 'A' | 'B' | 'C' | 'D';
  bonusMultiplier: number; // Hệ số thưởng KPI (A+: 1.3, A: 1.1, B: 1.0, C: 0.7, D: 0.0)
  targetBonusAmount: number; // Mức thưởng cơ sở (VNĐ)
  actualBonusAmount: number; // Tiền thưởng thực nhận = targetBonusAmount * bonusMultiplier
  criteria: {
    taskCompletion: number; // Tiến độ & Khối lượng công việc (0 - 100)
    qualitySafety: number; // Chất lượng thi công & An toàn lao động (0 - 100)
    disciplineAttendance: number; // Kỷ luật & Chuyên cần (0 - 100)
    initiativeCollaboration: number; // Tinh thần trách nhiệm & Phối hợp (0 - 100)
  };
  evaluatorName: string;
  comments?: string;
  updatedAt: string;
}

export interface SalaryAdvanceRecord {
  id: string;
  code: string;
  employeeId: string;
  month: string; // "YYYY-MM"
  requestDate: string;
  amount: number; // Số tiền đề nghị tạm ứng
  approvedAmount?: number; // Số tiền thực tế duyệt chi (hỗ trợ duyệt chi một phần)
  reason: string;
  status: 'approved' | 'pending' | 'rejected' | 'processed'; // 'processed': Đã xử lý / Đã chi tiền
  approvedDate?: string;
  approvedBy?: string;
  processedDate?: string;
  processedBy?: string;
  attachmentUrl?: string; // Data URL Base64 hình ảnh chứng từ
  attachmentName?: string; // Tên file đính kèm (.jpg, .png, .pdf, .xlsx)
  attachmentType?: 'image' | 'pdf' | 'excel' | 'other';
  notes?: string;
}

export interface HRSettings {
  standardMonthlyDays: number; // 26 công
  dailyHours: number; // 8 giờ
  // Tỷ lệ trích nộp người lao động (NLĐ)
  employeeBhxhRate: number; // 8%
  employeeBhytRate: number; // 1.5%
  employeeBhtnRate: number; // 1%
  // Tỷ lệ trích nộp người sử dụng lao động (NSDLĐ)
  employerBhxhRate: number; // 17.5%
  employerBhytRate: number; // 3%
  employerBhtnRate: number; // 1%
  employerBhtnldRate: number; // 0.5% (Bảo hiểm tai nạn LĐ - BNN)
  // Thuế TNCN & Giảm trừ
  personalDeduction: number; // 11,000,000 đ
  dependentDeduction: number; // 4,400,000 đ / người
  // Phụ cấp & làm thêm giờ
  mealAllowanceStandard: number; // 730,000 đ
  transportAllowanceStandard: number; // 500,000 đ
  otNormalMultiplier: number; // 1.5
  otWeekendMultiplier: number; // 2.0
  regionalMinSalary: number; // 4,960,000 đ
  maxInsuranceSalaryCap: number; // 46,800,000 đ (20 lần lương cơ sở)
  // Định mức giá xăng & tiền ăn công trình
  gasolinePricePerKm: number; // Giá xăng theo KM (mặc định vd 1,800 đ/km)
  projectDailyMealStandard: number; // Mức tiền ăn/ngày công trình tiêu chuẩn (vd 50,000 đ/ngày)

  // Chế độ Bật / Tắt theo chính sách công ty (Hiện công ty chưa áp dụng, có thể bật áp dụng trong tương lai)
  enableKpiBonus: boolean; // Chế độ Bật / Tắt Đánh giá & Thưởng KPI (Mặc định: false)
  enableAllowances: boolean; // Chế độ Bật / Tắt các khoản Phụ cấp (Xăng xe, ăn trưa, công trình xa, trách nhiệm) (Mặc định: false)
}

export interface ProjectAllowanceBreakdown {
  projectId: string;
  projectCode: string;
  projectName: string;
  daysWorked: number;
  distanceKm: number;
  hasCompanyVehicle: boolean;
  fuelAllowance: number;
  mealAllowance: number;
  remoteTier: 'I' | 'II' | 'None'; // Cấp II (50km-100km), Cấp I (>100km), None (<50km)
  remoteAllowance: number; // Phụ cấp công tác phí xa
  totalAllowance: number;
}

export interface PayrollItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  position: string;
  gradeName: string;
  tierIndex: number;
  coefficient: number;
  baseSalaryRate: number;
  competencySalary: number;
  
  // Tùy chọn lương thoả thuận & phụ cấp trách nhiệm
  salaryType: 'scale' | 'negotiated';
  negotiatedType?: 'monthly' | 'daily';
  negotiatedSalary?: number;
  negotiatedDailyRate?: number;
  dailyRate?: number; // Đơn giá lương 1 ngày công
  responsibilityAllowance: number; // Phụ cấp trách nhiệm (VNĐ)
  positionRank?: string;

  // Phụ cấp công trình
  allowanceFuelProject: number; // 1. Phụ cấp tiền xăng = cự ly x giá xăng
  allowanceMealProject: number; // 2. Phụ cấp tiền ăn theo ngày từng công trình
  allowanceRemoteProject: number; // 4. Phụ cấp công tác phí công trình xa (50-100km Cấp II, >100km Cấp I)
  hasCompanyVehicle: boolean; // 3. Cấp xe đi công trình (nếu cấp xe sẽ = 0 phụ cấp xăng)
  projectAllowanceDetails?: ProjectAllowanceBreakdown[];

  // Chấm công & Tăng ca quy đổi (chia 8 tiếng)
  standardDays: number;
  actualDays: number;
  paidLeaveDays: number;
  hasOvertime?: boolean;
  totalOtHours?: number;
  otConvertedDays?: number; // Quy đổi ra số ngày = totalOtHours / 8 tiếng
  otHoursNormal: number;
  otHoursWeekend: number;
  
  // Thu nhập (Gross) & Thưởng KPI
  actualBaseSalary: number; // Lương cơ bản theo ngày công thực tế (hoặc lương thoả thuận)
  actualCompetencySalary: number; // Lương năng lực theo ngày công
  otPay: number; // Tiền lương làm thêm giờ
  allowanceMeal: number; // Phụ cấp ăn trưa văn phòng
  allowanceTransport: number; // Phụ cấp đi lại
  performanceBonus: number; // Thưởng hiệu quả (liên kết trực tiếp từ Đánh giá KPI)
  kpiScore?: number; // Điểm đánh giá KPI (%)
  kpiRating?: 'A+' | 'A' | 'B' | 'C' | 'D'; // Xếp loại KPI
  kpiBonusMultiplier?: number; // Hệ số thưởng KPI
  kpiTargetBonus?: number; // Mức thưởng mục tiêu cơ sở
  grossIncome: number; // Tổng thu nhập trước thuế
  
  // Bảo hiểm
  insuranceSalary: number;
  employeeBhxh: number;
  employeeBhyt: number;
  employeeBhtn: number;
  totalEmployeeInsurance: number;
  
  // Bảo hiểm do cty chi trả
  employerBhxh: number;
  employerBhyt: number;
  employerBhtn: number;
  employerBhtnld: number;
  totalEmployerCost: number;
  
  // Thuế TNCN
  taxableIncome: number; // Thu nhập chịu thuế
  totalDeductions: number; // Tổng giảm trừ (Bản thân + Người phụ thuộc + BHXH)
  assessableIncome: number; // Thu nhập tính thuế (sau giảm trừ)
  personalIncomeTax: number; // Thuế TNCN phải nộp
  
  // Tạm ứng & Khấu trừ khác
  salaryAdvanceDeduction: number;
  otherDeductions: number;
  
  // Thực lĩnh
  netIncome: number; // Lương thực nhận
  paymentStatus: 'pending' | 'approved' | 'paid';
}

export type MainTabType =
  | 'home'
  | 'departments'
  | 'employees'
  | 'contracts'
  | 'projects'
  | 'attendance'
  | 'compensation'
  | 'kpi'
  | 'settings';

export type ExcelTableId =
  | 'payroll'
  | 'attendance'
  | 'employees'
  | 'kpi'
  | 'insurance'
  | 'projects'
  | string;

export interface ExcelColumnConfig {
  id: string; // Tên trường dữ liệu (key)
  defaultLabel: string; // Tên nhãn mặc định
  customLabel?: string; // Tên nhãn tùy biến do người dùng sửa
  enabled: boolean; // Bật / Tắt lấy cột này
  order: number; // Thứ tự xuất
  type?: 'text' | 'number' | 'currency' | 'date';
  width?: number;
  isCustom?: boolean; // Cột tùy biến người dùng tự thêm
  category?: 'standard' | 'project' | 'employee' | 'attendance' | 'custom_note';
  projectId?: string; // ID công trình nếu là cột theo dõi công trình cụ thể
  projectFieldType?: 'days_worked' | 'fuel_allowance' | 'meal_allowance' | 'remote_allowance' | 'total_allowance' | 'vehicle_type' | 'all_projects_summary';
  defaultValue?: string | number;
}

export interface ExcelTableExportConfig {
  tableId: string;
  tableName: string;
  fileNameTemplate: string; // VD: "Bang_Luong_{month}_{date}_{company}"
  sheetName: string; // VD: "BangLuong"
  tableTitle: string; // VD: "BẢNG THANH TOÁN TIỀN LƯƠNG & THU NHẬP DOANH NGHIỆP"
  subtitles?: string[];
  tableStyle: 'standard' | 'accounting' | 'raw'; // 'standard': chuẩn DN, 'accounting': kế toán chi tiết, 'raw': dữ liệu thô import ERP
  includeSubtitles: boolean;
  includeSummaryRow: boolean;
  includeSignatures: boolean;
  autoColumnWidth: boolean;
  useCustomNumberFormat: boolean;
  columns: ExcelColumnConfig[];
  isCustom?: boolean; // True nếu bảng do người dùng tự tạo
  baseSource?: 'payroll' | 'attendance' | 'employees' | 'kpi' | 'insurance' | 'projects' | string; // Nguồn dữ liệu cơ sở
  description?: string;
  createdAt?: string;
}

export interface ExcelExportGlobalSettings {
  companyName: string;
  companyShortName: string;
  dateFormat: string;
  tables: Record<string, ExcelTableExportConfig>;
}

export type AppRole = 'super_admin' | 'director' | 'payroll_accountant' | 'site_manager' | 'employee';

export interface RolePermissions {
  director: 'view' | 'edit';
  payroll_accountant: 'view' | 'edit';
  site_manager: 'view' | 'edit';
  employee: 'view';
}


