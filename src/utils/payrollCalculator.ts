import {
  Employee,
  SalaryGrade,
  Department,
  TimesheetRecord,
  SalaryAdvanceRecord,
  HRSettings,
  PayrollItem,
  InsuranceProfile,
  ConstructionProject,
  ProjectAllowanceBreakdown,
  RemoteAllowanceRate,
  PerformanceReview,
} from '../types/hrm';

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberVN(amount: number, decimals: number = 0): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Tính thuế thu nhập cá nhân theo biểu thuế lũy tiến từng phần Luật Thuế TNCN Việt Nam
 */
export function calculateVietnamesePIT(assessableIncome: number): number {
  if (assessableIncome <= 0) return 0;

  // Thu nhập tính thuế (triệu đồng)
  const income = assessableIncome;

  if (income <= 5000000) {
    return Math.round(income * 0.05);
  } else if (income <= 10000000) {
    return Math.round(income * 0.1 - 250000);
  } else if (income <= 18000000) {
    return Math.round(income * 0.15 - 750000);
  } else if (income <= 32000000) {
    return Math.round(income * 0.2 - 1650000);
  } else if (income <= 52000000) {
    return Math.round(income * 0.25 - 3250000);
  } else if (income <= 80000000) {
    return Math.round(income * 0.3 - 5850000);
  } else {
    return Math.round(income * 0.35 - 9850000);
  }
}

export function getEmployeeRankRate(
  employee: Employee,
  remoteAllowanceRates: RemoteAllowanceRate[] = []
): { tierI: number; tierII: number; rank: string } {
  if (employee.positionRank && remoteAllowanceRates.length > 0) {
    const found = remoteAllowanceRates.find(
      r => r.rank.toUpperCase() === employee.positionRank?.toUpperCase()
    );
    if (found) return { tierI: found.tierI, tierII: found.tierII, rank: found.rank };
  }

  const posLower = (employee.position || '').toLowerCase();
  for (const r of remoteAllowanceRates) {
    if (r.applicablePositions) {
      const titles = r.applicablePositions.toLowerCase().split(',').map((s: string) => s.trim());
      if (titles.some((t: string) => posLower.includes(t) || t.includes(posLower))) {
        return { tierI: r.tierI, tierII: r.tierII, rank: r.rank };
      }
    }
  }

  if (posLower.includes('chỉ huy') || posLower.includes('giám đốc') || posLower.includes('lãnh đạo')) {
    const rA = remoteAllowanceRates.find(r => r.rank === 'A');
    if (rA) return { tierI: rA.tierI, tierII: rA.tierII, rank: 'A' };
  } else if (posLower.includes('kỹ thuật') || posLower.includes('kỹ sư') || posLower.includes('trưởng')) {
    const rB = remoteAllowanceRates.find(r => r.rank === 'B');
    if (rB) return { tierI: rB.tierI, tierII: rB.tierII, rank: 'B' };
  } else if (posLower.includes('kế toán') || posLower.includes('hành chính') || posLower.includes('vật tư')) {
    const rC = remoteAllowanceRates.find(r => r.rank === 'C');
    if (rC) return { tierI: rC.tierI, tierII: rC.tierII, rank: 'C' };
  } else if (posLower.includes('thủ kho') || posLower.includes('thủ quỹ') || posLower.includes('lái xe') || posLower.includes('công nhân')) {
    const rD = remoteAllowanceRates.find(r => r.rank === 'D');
    if (rD) return { tierI: rD.tierI, tierII: rD.tierII, rank: 'D' };
  }

  const fallback = remoteAllowanceRates[0];
  return fallback
    ? { tierI: fallback.tierI, tierII: fallback.tierII, rank: fallback.rank }
    : { tierI: 40000, tierII: 30000, rank: 'B' };
}

/**
 * Tính toán toàn bộ bảng lương tháng cho từng nhân viên
 */
export function calculateEmployeePayroll(
  employee: Employee,
  grades: SalaryGrade[],
  departments: Department[],
  timesheets: TimesheetRecord[],
  advances: SalaryAdvanceRecord[],
  insurances: InsuranceProfile[],
  settings: HRSettings,
  month: string = '2026-10',
  projects: ConstructionProject[] = [],
  remoteAllowanceRates: RemoteAllowanceRate[] = [],
  reviews: PerformanceReview[] = []
): PayrollItem {
  const dept = departments.find(d => d.id === employee.departmentId);
  const grade = grades.find(g => g.id === employee.gradeId) || grades[0];
  const tierIdx = Math.min(Math.max(employee.tierIndex, 1), 8);
  const coeff = grade.coefficients[tierIdx - 1] || 1.0;

  const timesheet = timesheets.find(
    t => t.employeeId === employee.id && t.month === month
  ) || {
    id: `ts-auto-${employee.id}`,
    employeeId: employee.id,
    month,
    standardWorkingDays: settings.standardMonthlyDays,
    actualWorkingDays: settings.standardMonthlyDays,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    otHoursNormal: 0,
    otHoursWeekend: 0,
    lateArrivalMinutes: 0,
  };

  // 1. Kiểm tra hình thức lương: Lương thoả thuận (Trọn tháng vs Theo ngày) hoặc Thang bảng lương 8 bậc
  const isNegotiated = employee.salaryType === 'negotiated';
  const negotiatedType = employee.negotiatedType || 'monthly'; // 'monthly': trọn tháng, 'daily': theo ngày công

  const standardDays = timesheet.standardWorkingDays || settings.standardMonthlyDays || 26;
  const totalPaidDays = timesheet.actualWorkingDays + timesheet.paidLeaveDays;

  let baseSalaryRate = 0;
  let competencySalary = 0;
  let actualBaseSalary = 0;
  let actualCompetencySalary = 0;
  let dailyRate = 0;
  let hourlyRate = 0;

  if (isNegotiated) {
    if (negotiatedType === 'daily') {
      // Chế độ 1: Lương thỏa thuận tính trên ngày công thực tế
      dailyRate = (employee.negotiatedDailyRate && employee.negotiatedDailyRate > 0)
        ? employee.negotiatedDailyRate
        : Math.round((employee.negotiatedSalary || 15000000) / standardDays);
      baseSalaryRate = employee.negotiatedSalary || (dailyRate * standardDays);
      competencySalary = 0;
      actualBaseSalary = Math.round(dailyRate * totalPaidDays);
      actualCompetencySalary = 0;
      hourlyRate = dailyRate / (settings.dailyHours || 8);
    } else {
      // Chế độ 2: Lương thỏa thuận trọn tháng (Hưởng đủ nguyên tháng thỏa thuận, trừ ngày nghỉ không lương nếu có)
      baseSalaryRate = employee.negotiatedSalary || 15000000;
      dailyRate = Math.round(baseSalaryRate / standardDays);
      competencySalary = 0;
      const unpaidDeduction = (timesheet.unpaidLeaveDays && timesheet.unpaidLeaveDays > 0)
        ? Math.round(dailyRate * timesheet.unpaidLeaveDays)
        : 0;
      actualBaseSalary = Math.max(0, baseSalaryRate - unpaidDeduction);
      actualCompetencySalary = 0;
      hourlyRate = standardDays > 0 ? baseSalaryRate / (standardDays * (settings.dailyHours || 8)) : 0;
    }
  } else {
    // Chế độ 3: Theo thang bảng lương 8 bậc chuẩn
    baseSalaryRate = grade.standardBaseRate * coeff;
    competencySalary = grade.competencySalaries[tierIdx - 1] || 0;
    dailyRate = standardDays > 0 ? Math.round(baseSalaryRate / standardDays) : 0;
    const dayRatio = standardDays > 0 ? Math.min(standardDays, totalPaidDays) / standardDays : 1;
    actualBaseSalary = Math.round(baseSalaryRate * dayRatio);
    actualCompetencySalary = Math.round(competencySalary * dayRatio);
    hourlyRate = standardDays > 0 ? baseSalaryRate / (standardDays * (settings.dailyHours || 8)) : 0;
  }

  const gradeName = isNegotiated
    ? (negotiatedType === 'daily' ? 'Lương thỏa thuận (Theo ngày)' : 'Lương thỏa thuận (Trọn tháng)')
    : grade.name;

  // Phụ cấp trách nhiệm theo vị trí / thỏa thuận
  const rawResponsibilityAllowance = employee.responsibilityAllowance || 0;
  const isAllowancesEnabled = settings.enableAllowances ?? false;
  const isKpiEnabled = settings.enableKpiBonus ?? false;
  const responsibilityAllowance = isAllowancesEnabled ? rawResponsibilityAllowance : 0;

  const insProfile = insurances.find(i => i.employeeId === employee.id);
  const hasInsurance = insProfile && insProfile.status === 'active' && insProfile.insuranceSalary > 0;
  const insBase = hasInsurance ? insProfile.insuranceSalary : 0;

  // 2. Chấm tăng ca theo giờ từng ngày, cuối chia 8 tiếng tính ra ngày công
  // Khi nhân sự được tích chọn tăng ca (hasOvertime):
  let totalOtHours = 0;
  if (timesheet.hasOvertime) {
    if (timesheet.dailyOtHours && Object.keys(timesheet.dailyOtHours).length > 0) {
      totalOtHours = Object.values(timesheet.dailyOtHours).reduce((sum, h) => sum + (Number(h) || 0), 0);
    } else {
      totalOtHours = timesheet.totalOtHours || timesheet.otHoursNormal || 0;
    }
  } else {
    totalOtHours = timesheet.otHoursNormal || 0;
  }

  // Quy đổi ra số ngày công = Tổng số giờ tăng ca / 8 tiếng
  const otConvertedDays = totalOtHours > 0 ? Math.round((totalOtHours / 8) * 100) / 100 : 0;
  const effectiveNormalOt = timesheet.hasOvertime ? totalOtHours : timesheet.otHoursNormal;
  const otNormalPay = Math.round(effectiveNormalOt * hourlyRate * settings.otNormalMultiplier);
  const otWeekendPay = Math.round(timesheet.otHoursWeekend * hourlyRate * settings.otWeekendMultiplier);
  const otPay = otNormalPay + otWeekendPay;

  // Phần làm thêm giờ được miễn thuế TNCN (phần trả cao hơn so với giờ bình thường)
  const otNormalExempt = Math.round(effectiveNormalOt * hourlyRate * (settings.otNormalMultiplier - 1.0));
  const otWeekendExempt = Math.round(timesheet.otHoursWeekend * hourlyRate * (settings.otWeekendMultiplier - 1.0));
  const otTaxExempt = otNormalExempt + otWeekendExempt;

  // 3. Phụ cấp công trình (Xăng, Tiền ăn, Cấp xe, Công tác phí xa Cấp I & Cấp II)
  // ĐƯỢC ĐIỀU KHIỂN BỞI CHẾ ĐỘ BẬT / TẮT PHỤ CẤP:
  let allowanceFuelProject = 0;
  let allowanceMealProject = 0;
  let allowanceRemoteProject = 0;
  let hasCompanyVehicle = false;
  const projectAllowanceDetails: ProjectAllowanceBreakdown[] = [];

  const rankRate = getEmployeeRankRate(employee, remoteAllowanceRates);

  if (isAllowancesEnabled) {
    projects.forEach((proj) => {
      const empProjCfg = employee.projectAllowances?.[proj.id];

      // Xác định số ngày làm việc tại công trình này trong tháng
      let daysWorked = 0;
      if (timesheet.dailySymbols && Object.keys(timesheet.dailySymbols).length > 0) {
        Object.values(timesheet.dailySymbols).forEach((sym) => {
          if (!sym) return;
          const s = sym.trim().toUpperCase();
          if (s === proj.symbolFull.toUpperCase() || s === proj.code.toUpperCase()) {
            daysWorked += 1;
          } else if (s === proj.symbolHalf.toUpperCase() || s === `${proj.code}/2`.toUpperCase()) {
            daysWorked += 0.5;
          }
        });
      } else if (empProjCfg?.assigned) {
        daysWorked = Math.max(1, Math.min(timesheet.actualWorkingDays, 22));
      }

      const isAssigned = empProjCfg?.assigned ?? (daysWorked > 0);
      if (!isAssigned && daysWorked === 0) return;

      const isVehicleProvided = empProjCfg?.hasCompanyVehicle ?? false;
      if (isVehicleProvided) {
        hasCompanyVehicle = true;
      }

      const hasFuel = empProjCfg ? empProjCfg.hasFuelAllowance : true;
      const hasMeal = empProjCfg ? empProjCfg.hasMealAllowance : true;

      const distance = empProjCfg?.customDistanceKm ?? proj.distanceKm ?? 0;
      const fuelPricePerKm = empProjCfg?.customFuelPrice ?? proj.fuelPricePerKm ?? settings.gasolinePricePerKm ?? 1800;
      const mealPricePerDay = empProjCfg?.customMealPerDay ?? proj.mealAllowanceDaily ?? settings.projectDailyMealStandard ?? 50000;

      // 1. Phụ cấp xăng (Kiểm tra chế độ bật/tắt & xe máy tính xăng vs ô tô không tính xăng):
      let fuelPay = 0;
      const isFuelAllowanceToggledOn = timesheet.hasFuelAllowance !== false;

      if (!isFuelAllowanceToggledOn || isVehicleProvided) {
        fuelPay = 0;
      } else if (hasFuel && distance > 0 && daysWorked > 0) {
        if (timesheet.dailyVehicle && Object.keys(timesheet.dailyVehicle).length > 0) {
          // Tính riêng theo từng ngày có đi xe máy (motorcycle)
          let motoDaysWorked = 0;
          if (timesheet.dailySymbols) {
            Object.entries(timesheet.dailySymbols).forEach(([dayStr, sym]) => {
              const dayNum = Number(dayStr);
              if (!sym) return;
              const s = sym.trim().toUpperCase();
              const isMatch = s === proj.symbolFull.toUpperCase() ||
                              s === proj.code.toUpperCase() ||
                              s.startsWith(proj.code.toUpperCase());
              if (isMatch) {
                const veh = timesheet.dailyVehicle?.[dayNum] ?? 'motorcycle';
                if (veh === 'motorcycle') {
                  motoDaysWorked += (s.endsWith('/2') || s.endsWith('/P')) ? 0.5 : 1;
                }
              }
            });
          }
          fuelPay = Math.round(distance * fuelPricePerKm * motoDaysWorked);
        } else {
          fuelPay = Math.round(distance * fuelPricePerKm * daysWorked);
        }
      }

      // 2. Phụ cấp tiền ăn:
      let mealPay = 0;
      if (hasMeal && daysWorked > 0) {
        mealPay = Math.round(mealPricePerDay * daysWorked);
      }

      // 3. Phụ cấp công tác phí công trình xa:
      let remoteTier: 'I' | 'II' | 'None' = 'None';
      if (distance > 100) {
        remoteTier = 'I';
      } else if (distance >= 50) {
        remoteTier = 'II';
      }

      let remotePay = 0;
      if (daysWorked > 0) {
        if (remoteTier === 'I') {
          remotePay = Math.round(rankRate.tierI * daysWorked);
        } else if (remoteTier === 'II') {
          remotePay = Math.round(rankRate.tierII * daysWorked);
        }
      }

      projectAllowanceDetails.push({
        projectId: proj.id,
        projectCode: proj.code,
        projectName: proj.name,
        daysWorked,
        distanceKm: distance,
        hasCompanyVehicle: isVehicleProvided,
        fuelAllowance: fuelPay,
        mealAllowance: mealPay,
        remoteTier,
        remoteAllowance: remotePay,
        totalAllowance: fuelPay + mealPay + remotePay,
      });

      allowanceFuelProject += fuelPay;
      allowanceMealProject += mealPay;
      allowanceRemoteProject += remotePay;
    });
  }

  // 4. Phụ cấp văn phòng (Ăn trưa, đi lại)
  const allowanceMeal = isAllowancesEnabled
    ? (totalPaidDays >= 15 ? settings.mealAllowanceStandard : Math.round((settings.mealAllowanceStandard / settings.standardMonthlyDays) * totalPaidDays))
    : 0;
  const allowanceTransport = isAllowancesEnabled ? settings.transportAllowanceStandard : 0;
  
  // 5. Thưởng hiệu quả & KPI: ĐIỀU KHIỂN BỞI CHẾ ĐỘ BẬT / TẮT KPI
  const kpiReview = reviews.find(r => r.employeeId === employee.id && r.month === month);
  let performanceBonus = 0;
  if (isKpiEnabled) {
    performanceBonus = kpiReview
      ? kpiReview.actualBonusAmount
      : ((employee.position.toLowerCase().includes('trưởng') || employee.position.toLowerCase().includes('giám')) ? 2000000 : 500000);
  }

  // 5. Tổng thu nhập (Gross)
  const grossIncome = actualBaseSalary +
    actualCompetencySalary +
    otPay +
    allowanceMeal +
    allowanceTransport +
    performanceBonus +
    allowanceFuelProject +
    allowanceMealProject +
    allowanceRemoteProject +
    responsibilityAllowance;

  // 6. Bảo hiểm người lao động đóng
  const bhxhCap = Math.min(insBase, settings.maxInsuranceSalaryCap);
  const bhtnCap = Math.min(insBase, settings.regionalMinSalary * 20);

  const employeeBhxh = hasInsurance ? Math.round(bhxhCap * settings.employeeBhxhRate) : 0;
  const employeeBhyt = hasInsurance ? Math.round(bhxhCap * settings.employeeBhytRate) : 0;
  const employeeBhtn = hasInsurance ? Math.round(bhtnCap * settings.employeeBhtnRate) : 0;
  const totalEmployeeInsurance = employeeBhxh + employeeBhyt + employeeBhtn;

  // 7. Bảo hiểm do cty chi trả (Doanh nghiệp)
  const employerBhxh = hasInsurance ? Math.round(bhxhCap * settings.employerBhxhRate) : 0;
  const employerBhyt = hasInsurance ? Math.round(bhxhCap * settings.employerBhytRate) : 0;
  const employerBhtn = hasInsurance ? Math.round(bhtnCap * settings.employerBhtnRate) : 0;
  const employerBhtnld = hasInsurance ? Math.round(bhxhCap * settings.employerBhtnldRate) : 0;
  const totalEmployerCost = employerBhxh + employerBhyt + employerBhtn + employerBhtnld;

  // 8. Thuế Thu Nhập Cá Nhân (TNCN)
  // Miễn thuế: tiền ăn trưa (tối đa 730k) + phần phụ trội OT
  const mealTaxExempt = Math.min(allowanceMeal + allowanceMealProject, 730000);
  const taxableIncome = Math.max(0, grossIncome - mealTaxExempt - otTaxExempt);

  const totalDeductions = settings.personalDeduction + (employee.dependentsCount * settings.dependentDeduction) + totalEmployeeInsurance;
  const assessableIncome = Math.max(0, taxableIncome - totalDeductions);
  const personalIncomeTax = calculateVietnamesePIT(assessableIncome);

  // 9. Tạm ứng lương (Bao gồm các khoản đã duyệt hoặc đã xử lý/chi tiền, tính theo số tiền duyệt chi thực tế)
  const employeeAdvances = advances.filter(
    a => a.employeeId === employee.id && a.month === month && (a.status === 'approved' || a.status === 'processed')
  );
  const salaryAdvanceDeduction = employeeAdvances.reduce(
    (sum, a) => sum + (a.approvedAmount !== undefined ? a.approvedAmount : a.amount),
    0
  );

  // Phạt đi trễ
  const otherDeductions = timesheet.lateArrivalMinutes > 30 ? 100000 : 0;

  // 10. Thực lĩnh (Net Income)
  const netIncome = Math.max(0, grossIncome - totalEmployeeInsurance - personalIncomeTax - salaryAdvanceDeduction - otherDeductions);

  return {
    id: `pay-${month}-${employee.id}`,
    employeeId: employee.id,
    employeeCode: employee.code,
    fullName: employee.fullName,
    departmentName: dept?.name || 'Chưa phân bổ',
    position: employee.position,
    gradeName,
    tierIndex: isNegotiated ? 0 : tierIdx,
    coefficient: isNegotiated ? 1.0 : coeff,
    baseSalaryRate,
    competencySalary,
    salaryType: isNegotiated ? 'negotiated' : 'scale',
    negotiatedType: isNegotiated ? negotiatedType : undefined,
    negotiatedSalary: employee.negotiatedSalary,
    negotiatedDailyRate: employee.negotiatedDailyRate || (isNegotiated && negotiatedType === 'daily' ? dailyRate : undefined),
    dailyRate,
    responsibilityAllowance,
    positionRank: employee.positionRank,
    allowanceFuelProject,
    allowanceMealProject,
    allowanceRemoteProject,
    hasCompanyVehicle,
    projectAllowanceDetails,
    standardDays: timesheet.standardWorkingDays,
    actualDays: timesheet.actualWorkingDays,
    paidLeaveDays: timesheet.paidLeaveDays,
    hasOvertime: timesheet.hasOvertime ?? false,
    totalOtHours,
    otConvertedDays,
    otHoursNormal: timesheet.otHoursNormal,
    otHoursWeekend: timesheet.otHoursWeekend,
    actualBaseSalary,
    actualCompetencySalary,
    otPay,
    allowanceMeal,
    allowanceTransport,
    performanceBonus,
    kpiScore: isKpiEnabled ? kpiReview?.kpiScore : undefined,
    kpiRating: isKpiEnabled ? kpiReview?.rating : undefined,
    kpiBonusMultiplier: isKpiEnabled ? kpiReview?.bonusMultiplier : undefined,
    kpiTargetBonus: isKpiEnabled ? kpiReview?.targetBonusAmount : undefined,
    grossIncome,
    insuranceSalary: insBase,
    employeeBhxh,
    employeeBhyt,
    employeeBhtn,
    totalEmployeeInsurance,
    employerBhxh,
    employerBhyt,
    employerBhtn,
    employerBhtnld,
    totalEmployerCost,
    taxableIncome,
    totalDeductions,
    assessableIncome,
    personalIncomeTax,
    salaryAdvanceDeduction,
    otherDeductions,
    netIncome,
    paymentStatus: 'approved',
  };
}
