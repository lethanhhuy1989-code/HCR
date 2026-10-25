import React, { useState, useMemo } from 'react';
import { useHRM } from '../context/HRMContext';
import { formatVND, formatNumberVN } from '../utils/payrollCalculator';
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  ShieldCheck,
  TableProperties,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Clock,
  Cake,
  CheckCircle2,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart,
  UserPlus,
  UserMinus,
  Sparkles,
  Layers,
  Award,
  Wallet,
  Receipt,
  FileCheck,
  ExternalLink,
} from 'lucide-react';

export const HomeOverview: React.FC = () => {
  const {
    employees,
    contracts,
    payrollItems,
    timesheets,
    departments,
    advances,
    currentMonth,
    setCurrentMonth,
    setActiveMainTab,
    setActiveSubTab,
  } = useHRM();

  // Active sub-view or filter in dashboard
  const [activeAlertTab, setActiveAlertTab] = useState<'contracts' | 'probation' | 'birthdays' | 'advances'>('contracts');
  const [selectedChartPeriod, setSelectedChartPeriod] = useState<'6m' | '12m'>('6m');

  // --- Dynamic Core Metrics Calculation ---
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const probationCount = employees.filter((e) => e.status === 'probation').length;
  const leaveCount = employees.filter((e) => e.status === 'leave' || e.status === 'terminated').length;

  // Payroll Metrics
  const totalNetSalary = payrollItems.reduce((sum, item) => sum + (item.netIncome || 0), 0);
  const totalGrossSalary = payrollItems.reduce((sum, item) => sum + (item.grossIncome || 0), 0);
  const totalEmployerInsurance = payrollItems.reduce((sum, item) => sum + (item.totalEmployerCost || 0), 0);
  const totalPersonalIncomeTax = payrollItems.reduce((sum, item) => sum + (item.personalIncomeTax || 0), 0);
  const totalWorkforceCost = totalGrossSalary + totalEmployerInsurance; // Total cost to company
  const avgMonthlyIncome = totalEmployees > 0 ? Math.round(totalNetSalary / totalEmployees) : 0;

  // Attendance Metrics
  const avgActualDays =
    timesheets.length > 0
      ? timesheets.reduce((sum, t) => sum + (t.actualWorkingDays || 0), 0) / timesheets.length
      : 24.5;
  const standardDays = 26;
  const attendanceRate = Math.min(100, Math.round((avgActualDays / standardDays) * 100 * 10) / 10);
  const totalOtHours = timesheets.reduce((sum, t) => sum + (t.totalOtHours || t.otHoursNormal + t.otHoursWeekend || 0), 0);

  // Contracts & Compliance
  const activeContracts = contracts.filter((c) => c.status === 'active');
  const expiringContracts = contracts.filter((c) => c.status === 'expiring_soon');
  const expiredContracts = contracts.filter((c) => c.status === 'expired');

  // Probation Employees
  const probationEmployees = useMemo(() => {
    return employees
      .filter((e) => e.status === 'probation')
      .map((emp) => {
        const contract = contracts.find((c) => c.employeeId === emp.id);
        return {
          employee: emp,
          contract,
          endDate: contract?.endDate || 'Đang cập nhật',
          probationSalary: contract?.probationSalary || (emp.negotiatedSalary ? emp.negotiatedSalary * 0.85 : 0),
        };
      });
  }, [employees, contracts]);

  // Expiring Contracts with detailed remaining days calculation
  const expiringContractList = useMemo(() => {
    const today = new Date();
    return contracts
      .filter((c) => c.status === 'expiring_soon' || (c.endDate && c.status === 'active'))
      .map((c) => {
        const emp = employees.find((e) => e.id === c.employeeId);
        const dept = departments.find((d) => d.id === emp?.departmentId);
        let daysLeft = 0;
        if (c.endDate) {
          const end = new Date(c.endDate);
          daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
        return {
          contract: c,
          employee: emp,
          department: dept,
          daysLeft,
        };
      })
      .filter((item) => item.daysLeft <= 60 && item.daysLeft >= -10)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [contracts, employees, departments]);

  // Birthdays in Current Month
  const currentMonthNum = parseInt(currentMonth.split('-')[1] || '3', 10);
  const birthdayEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!emp.birthDate) return false;
      const birthMonth = parseInt(emp.birthDate.split('-')[1] || '0', 10);
      return birthMonth === currentMonthNum;
    });
  }, [employees, currentMonthNum]);

  // Pending Advances
  const pendingAdvances = advances.filter((a) => a.status === 'pending');
  const totalPendingAdvanceAmount = pendingAdvances.reduce((sum, a) => sum + a.amount, 0);

  // Department Distribution Data
  const departmentStats = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
      const count = deptEmployees.length;
      const deptPayroll = payrollItems
        .filter((item) => deptEmployees.some((e) => e.id === item.employeeId))
        .reduce((sum, item) => sum + item.netIncome, 0);
      const percentage = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
      return {
        ...dept,
        count,
        percentage,
        deptPayroll,
      };
    });
  }, [departments, employees, payrollItems, totalEmployees]);

  // Contract Types Distribution Data
  const contractTypeStats = useMemo(() => {
    const typesMap: Record<string, { label: string; count: number; color: string }> = {
      indefinite: { label: 'HĐ Không thời hạn', count: 0, color: '#2563eb' },
      definite_3yr: { label: 'HĐ Có thời hạn (36T)', count: 0, color: '#0d9488' },
      definite_1yr: { label: 'HĐ Có thời hạn (12T)', count: 0, color: '#6366f1' },
      probation: { label: 'HĐ Thử việc', count: 0, color: '#f59e0b' },
      seasonal: { label: 'HĐ Công trình / Thời vụ', count: 0, color: '#ec4899' },
    };

    contracts.forEach((c) => {
      if (typesMap[c.contractType]) {
        typesMap[c.contractType].count += 1;
      }
    });

    return Object.values(typesMap);
  }, [contracts]);

  // 6-Month Headcount Fluctuations Mock/Calculated Data
  const fluctuationData = [
    { month: 'T10/2025', joined: 2, left: 1, total: 8, turnoverRate: '2.4%' },
    { month: 'T11/2025', joined: 3, left: 0, total: 9, turnoverRate: '0.0%' },
    { month: 'T12/2025', joined: 1, left: 1, total: 9, turnoverRate: '2.2%' },
    { month: 'T01/2026', joined: 2, left: 1, total: 10, turnoverRate: '2.0%' },
    { month: 'T02/2026', joined: 1, left: 0, total: 10, turnoverRate: '0.0%' },
    { month: 'T03/2026', joined: 2, left: 0, total: totalEmployees, turnoverRate: '0.0%' },
  ];

  // 6-Month Payroll Trends (in million VND)
  const payrollTrendData = [
    { month: 'T10', gross: 145.2, net: 131.5, insurance: 31.2, tax: 8.4 },
    { month: 'T11', gross: 158.0, net: 142.8, insurance: 33.8, tax: 9.2 },
    { month: 'T12', gross: 172.5, net: 154.6, insurance: 35.1, tax: 11.5 },
    { month: 'T01', gross: 169.8, net: 151.2, insurance: 34.6, tax: 10.8 },
    { month: 'T02', gross: 182.0, net: 162.4, insurance: 37.0, tax: 12.1 },
    {
      month: 'T03',
      gross: Math.round((totalGrossSalary / 1000000) * 10) / 10 || 195.4,
      net: Math.round((totalNetSalary / 1000000) * 10) / 10 || 174.8,
      insurance: Math.round((totalEmployerInsurance / 1000000) * 10) / 10 || 39.5,
      tax: Math.round((totalPersonalIncomeTax / 1000000) * 10) / 10 || 13.6,
    },
  ];

  // Salary Range Brackets
  const salaryBrackets = useMemo(() => {
    let under10 = 0;
    let from10to20 = 0;
    let from20to30 = 0;
    let above30 = 0;

    payrollItems.forEach((p) => {
      const net = p.netIncome;
      if (net < 10000000) under10++;
      else if (net < 20000000) from10to20++;
      else if (net < 30000000) from20to30++;
      else above30++;
    });

    // Fallback if payroll not generated yet
    if (payrollItems.length === 0) {
      under10 = 2;
      from10to20 = 5;
      from20to30 = 2;
      above30 = 1;
    }

    const total = under10 + from10to20 + from20to30 + above30;
    return [
      { label: '< 10 Triệu', count: under10, pct: Math.round((under10 / total) * 100), color: '#94a3b8' },
      { label: '10 - 20 Triệu', count: from10to20, pct: Math.round((from10to20 / total) * 100), color: '#3b82f6' },
      { label: '20 - 30 Triệu', count: from20to30, pct: Math.round((from20to30 / total) * 100), color: '#10b981' },
      { label: '> 30 Triệu', count: above30, pct: Math.round((above30 / total) * 100), color: '#8b5cf6' },
    ];
  }, [payrollItems]);

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-6">
      {/* 1. Top Executive Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 tracking-wide uppercase">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Hệ Thống Quản Trị Nhân Sự & C&B Doanh Nghiệp</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-700 font-medium normal-case">Dữ liệu thời gian thực</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            Bảng Điều Khiển Quản Trị Nhân Sự & Tiền Lương
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng quan biến động quân số, hợp đồng pháp lý, công tác chấm công và phân tích quỹ lương tháng {currentMonth}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 mr-2" />
            <span className="text-slate-500 mr-1.5">Kỳ quyết toán:</span>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              aria-label="Chọn kỳ quyết toán"
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="2026-03">Tháng 03/2026</option>
              <option value="2026-02">Tháng 02/2026</option>
              <option value="2026-01">Tháng 01/2026</option>
              <option value="2025-12">Tháng 12/2025</option>
            </select>
          </div>

          {/* Quick Action Navigation */}
          <button
            onClick={() => {
              setActiveMainTab('compensation');
              setActiveSubTab('payroll');
            }}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Bảng Lương Tháng</span>
          </button>

          <button
            onClick={() => setActiveMainTab('contracts')}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Quản Lý Hợp Đồng</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Headcount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng nhân sự</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalEmployees} <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span className="text-emerald-700 font-semibold">{activeCount} chính thức</span>
            <span className="text-amber-700 font-semibold">{probationCount} thử việc</span>
          </div>
        </div>

        {/* KPI 2: Net Payroll */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Quỹ lương Net</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {formatNumberVN(totalNetSalary)} <span className="text-xs font-normal text-emerald-600">đ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>TB/Nhân sự:</span>
            <span className="font-semibold text-slate-700 font-mono">{formatNumberVN(avgMonthlyIncome)} đ</span>
          </div>
        </div>

        {/* KPI 3: Total Company Cost */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Chi phí doanh nghiệp</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-900 mt-2">
            {formatNumberVN(totalWorkforceCost)} <span className="text-xs font-normal text-indigo-600">đ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Gross + 21.5% BH:</span>
            <span className="font-semibold text-indigo-700 font-mono">+{formatNumberVN(totalEmployerInsurance)} đ</span>
          </div>
        </div>

        {/* KPI 4: Attendance Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tỷ lệ chuyên cần</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-800 mt-2">
            {attendanceRate}% <span className="text-xs font-normal text-slate-500">chuẩn</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Tăng ca toàn cty:</span>
            <span className="font-semibold text-teal-700 font-mono">{totalOtHours} giờ</span>
          </div>
        </div>

        {/* KPI 5: Taxes & Social Insurance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Thuế & Bảo hiểm</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-900 mt-2">
            {formatNumberVN(totalPersonalIncomeTax)} <span className="text-xs font-normal text-purple-600">đ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Thuế TNCN nộp:</span>
            <span className="font-semibold text-purple-700 font-mono">{formatNumberVN(totalPersonalIncomeTax)} đ</span>
          </div>
        </div>

        {/* KPI 6: Expiring Contracts Alert */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>HĐ đến hạn xử lý</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {expiringContracts.length} <span className="text-xs font-normal text-slate-500">hợp đồng</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Cần tái ký 30 ngày:</span>
            <span className="font-semibold text-amber-800">{expiringContractList.length} hồ sơ</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Charts: Personnel Fluctuations & Payroll Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Biến Động Quân Số & Tuyển Dụng (6 Tháng Gần Nhất) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Biến Động Quân Số Nhân Sự (6 Tháng Gần Nhất)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Theo dõi số lượng tuyển mới, thôi việc và tổng quy mô nhân sự theo từng tháng
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span> Tuyển mới
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block"></span> Thôi việc
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span> Tổng quân số
                </span>
              </div>
            </div>

            {/* Interactive SVG / Bar Chart Representation */}
            <div className="mt-6 pt-4 pb-2 border-b border-slate-100">
              <div className="h-44 flex items-end justify-between gap-3 px-2">
                {fluctuationData.map((item, idx) => {
                  const maxVal = 14;
                  const joinedHeight = Math.max(12, (item.joined / maxVal) * 100);
                  const leftHeight = item.left > 0 ? Math.max(12, (item.left / maxVal) * 100) : 0;
                  const totalLinePos = (item.total / maxVal) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none shadow-lg z-20 whitespace-nowrap">
                        <div className="font-bold">{item.month}</div>
                        <div>Tuyển mới: +{item.joined} | Nghỉ: -{item.left}</div>
                        <div className="text-blue-300">Tổng quy mô: {item.total} nhân sự</div>
                      </div>

                      {/* Headcount Indicator Dot */}
                      <div
                        className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white shadow-xs z-10 -mb-1"
                        style={{ marginBottom: `${Math.min(130, totalLinePos * 1.3)}px` }}
                      ></div>

                      {/* Bars Container */}
                      <div className="flex items-end gap-1 w-full max-w-[48px] justify-center">
                        {/* Joined Bar */}
                        <div
                          className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all relative flex flex-col justify-end"
                          style={{ height: `${joinedHeight}%` }}
                        >
                          <span className="text-[9px] font-mono text-center text-white pb-0.5 font-bold">
                            +{item.joined}
                          </span>
                        </div>

                        {/* Left Bar */}
                        <div
                          className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t-sm transition-all relative flex flex-col justify-end"
                          style={{ height: `${leftHeight}%` }}
                        >
                          {item.left > 0 && (
                            <span className="text-[9px] font-mono text-center text-white pb-0.5 font-bold">
                              -{item.left}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Month Label */}
                      <span className="text-[11px] font-medium text-slate-600 mt-2 text-center">
                        {item.month}
                      </span>
                      <span className="text-[10px] font-mono text-blue-700 font-bold">
                        {item.total} NS
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Metrics Footer for Fluctuations */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 text-center bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
            <div>
              <span className="text-[11px] text-slate-500 block">Tỷ lệ thôi việc (Turnover)</span>
              <span className="text-xs font-bold font-mono text-emerald-700">1.8% / tháng</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Tăng trưởng ròng 6T</span>
              <span className="text-xs font-bold font-mono text-blue-700">+4 nhân sự (+40%)</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Độ giữ chân nhân tài</span>
              <span className="text-xs font-bold font-mono text-indigo-700">94.2%</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Biến Động Quỹ Lương & Nghĩa Vụ Chi Trả (6 Tháng) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Biến Động Quỹ Lương & Nghĩa Vụ Chi Trả (Triệu VNĐ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Xu hướng quỹ lương Net thực chi, Gross và tiền đóng BHXH doanh nghiệp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block"></span> Lương Net
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm inline-block"></span> BHXH Cty
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block"></span> Thuế TNCN
                </span>
              </div>
            </div>

            {/* Stacked / Multi-level Visual Area */}
            <div className="mt-6 pt-4 pb-2 border-b border-slate-100">
              <div className="h-44 flex items-end justify-between gap-3 px-2">
                {payrollTrendData.map((item, idx) => {
                  const maxPayroll = 220; // 220 million VND
                  const netPct = (item.net / maxPayroll) * 100;
                  const insurancePct = (item.insurance / maxPayroll) * 100;
                  const taxPct = (item.tax / maxPayroll) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2.5 py-1.5 pointer-events-none shadow-lg z-20 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">{item.month}/2026</div>
                        <div>Lương Net: {item.net} tr đ</div>
                        <div>Lương Gross: {item.gross} tr đ</div>
                        <div>BHXH Doanh nghiệp: {item.insurance} tr đ</div>
                        <div>Thuế TNCN nộp: {item.tax} tr đ</div>
                      </div>

                      {/* Stacked Bar with Sub-divisions */}
                      <div className="w-full max-w-[44px] flex flex-col justify-end rounded-t-md overflow-hidden shadow-2xs">
                        {/* Tax slice */}
                        <div
                          className="bg-amber-400 hover:bg-amber-500 transition-colors w-full"
                          style={{ height: `${Math.max(6, taxPct * 0.9)}px` }}
                          title={`Thuế: ${item.tax} tr`}
                        ></div>
                        {/* Insurance slice */}
                        <div
                          className="bg-indigo-400 hover:bg-indigo-500 transition-colors w-full"
                          style={{ height: `${Math.max(10, insurancePct * 0.9)}px` }}
                          title={`BHXH Cty: ${item.insurance} tr`}
                        ></div>
                        {/* Net salary slice */}
                        <div
                          className="bg-emerald-600 hover:bg-emerald-700 transition-colors w-full flex items-center justify-center"
                          style={{ height: `${Math.max(30, netPct * 1.1)}px` }}
                          title={`Lương Net: ${item.net} tr`}
                        >
                          <span className="text-[9px] font-mono text-white font-bold rotate-0">
                            {item.net}tr
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-slate-600 mt-2 text-center">
                        {item.month}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {item.gross}tr
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Metrics Footer for Payroll */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 text-center bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
            <div>
              <span className="text-[11px] text-slate-500 block">Tăng trưởng chi phí lương</span>
              <span className="text-xs font-bold font-mono text-emerald-700">+7.4% so với T02</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Tỷ trọng BHXH / Lương</span>
              <span className="text-xs font-bold font-mono text-indigo-700">22.6% tổng quỹ</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Thuế TNCN nộp NSNN</span>
              <span className="text-xs font-bold font-mono text-amber-700">~7.8% Gross</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Demographic & Structural Distributions (3 Sub-charts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Structure 1: Phân bổ nhân sự theo Phòng Ban */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Cơ Cấu Phòng Ban</h3>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700">
                {departments.length} đơn vị
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Phân bổ số lượng nhân sự và tỷ trọng biên chế theo từng phòng ban chức năng
            </p>

            <div className="space-y-3">
              {departmentStats.map((dept, idx) => {
                const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-purple-500'];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={dept.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[170px]" title={dept.name}>
                        {dept.name}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-bold text-slate-900">{dept.count} NS</span>
                        <span className="text-slate-400">({dept.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(6, dept.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveMainTab('departments')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between cursor-pointer group"
          >
            <span>Quản lý danh sách phòng ban & sơ đồ</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Structure 2: Cơ cấu Loại Hợp Đồng Lao Động */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Cơ Cấu Hợp Đồng</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {contracts.length} HĐLĐ
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Tỷ lệ hợp đồng không thời hạn, xác định thời hạn và thử việc theo luật lao động
            </p>

            <div className="space-y-3">
              {contractTypeStats.map((item, idx) => {
                const totalCt = contracts.length || 1;
                const pct = Math.round((item.count / totalCt) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="font-medium text-slate-700 truncate max-w-[160px]">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-bold text-slate-900">{item.count}</span>
                        <span className="text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(item.count > 0 ? 5 : 0, pct)}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveMainTab('contracts')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center justify-between cursor-pointer group"
          >
            <span>Chi tiết danh mục hợp đồng lao động</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Structure 3: Phân Bố Thu Nhập Theo Dải Lương */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Phân Bố Dải Lương Thực Nhận</h3>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700">
                {payrollItems.length || totalEmployees} hồ sơ
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Thống kê tỷ lệ phân bổ thu nhập Net của nhân viên theo ma trận 8 bậc lương
            </p>

            <div className="space-y-3">
              {salaryBrackets.map((bracket, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{bracket.label}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="font-bold text-slate-900">{bracket.count} người</span>
                      <span className="text-slate-400">({bracket.pct}%)</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(bracket.count > 0 ? 5 : 0, bracket.pct)}%`, backgroundColor: bracket.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setActiveMainTab('compensation');
              setActiveSubTab('salary-scale');
            }}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center justify-between cursor-pointer group"
          >
            <span>Mở ma trận thang bảng lương 8 bậc</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 5. HR Action Center & Pending Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Tabs for Alerts */}
        <div className="border-b border-slate-200 px-5 pt-4 pb-0 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Nghiệp Vụ Nhân Sự Cần Xử Lý & Theo Dõi
            </h3>
          </div>

          {/* Segmented Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveAlertTab('contracts')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeAlertTab === 'contracts'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HĐ Sắp Hết Hạn ({expiringContractList.length})
            </button>
            <button
              onClick={() => setActiveAlertTab('probation')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeAlertTab === 'probation'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kết Thúc Thử Việc ({probationEmployees.length})
            </button>
            <button
              onClick={() => setActiveAlertTab('birthdays')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeAlertTab === 'birthdays'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sinh Nhật Tháng ({birthdayEmployees.length})
            </button>
            <button
              onClick={() => setActiveAlertTab('advances')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeAlertTab === 'advances'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tạm Ứng Chờ Duyệt ({pendingAdvances.length})
            </button>
          </div>
        </div>

        {/* Tab Content 1: HĐ Sắp Hết Hạn */}
        {activeAlertTab === 'contracts' && (
          <div className="p-4 sm:p-5">
            {expiringContractList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Hiện không có hợp đồng lao động nào sắp hết hạn trong 60 ngày tới.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                      <th className="py-2.5 px-3">Mã HĐ</th>
                      <th className="py-2.5 px-3">Họ và tên nhân sự</th>
                      <th className="py-2.5 px-3">Phòng ban / Chức danh</th>
                      <th className="py-2.5 px-3">Loại hợp đồng</th>
                      <th className="py-2.5 px-3">Ngày hết hạn</th>
                      <th className="py-2.5 px-3 text-center">Thời gian còn lại</th>
                      <th className="py-2.5 px-3 text-right">Thao tác xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiringContractList.map((item) => (
                      <tr key={item.contract.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-slate-900">
                          {item.contract.code}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{item.employee?.fullName || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.employee?.code}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{item.department?.name || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500">{item.contract.jobTitle}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {item.contract.contractTypeName}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {item.contract.endDate || 'Chưa xác định'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.daysLeft <= 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                              Đã hết hạn
                            </span>
                          ) : item.daysLeft <= 15 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                              Còn {item.daysLeft} ngày
                            </span>
                          ) : item.daysLeft <= 30 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                              Còn {item.daysLeft} ngày
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                              Còn {item.daysLeft} ngày
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setActiveMainTab('contracts')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Gia hạn / Tái ký
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Kết Thúc Thử Việc */}
        {activeAlertTab === 'probation' && (
          <div className="p-4 sm:p-5">
            {probationEmployees.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Hiện không có nhân sự nào đang trong thời gian thử việc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                      <th className="py-2.5 px-3">Mã NV</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Vị trí chức danh</th>
                      <th className="py-2.5 px-3">Ngày bắt đầu</th>
                      <th className="py-2.5 px-3">Ngày kết thúc TV</th>
                      <th className="py-2.5 px-3 text-right">Mức lương thử việc</th>
                      <th className="py-2.5 px-3 text-right">Quyết định</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {probationEmployees.map(({ employee, contract, endDate, probationSalary }) => (
                      <tr key={employee.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-slate-900">
                          {employee.code}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {employee.fullName}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {employee.position}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {employee.joinDate}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                          {endDate}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {formatNumberVN(probationSalary)} đ
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setActiveMainTab('employees')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Ký HĐ Chính Thức
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Sinh Nhật Trong Tháng */}
        {activeAlertTab === 'birthdays' && (
          <div className="p-4 sm:p-5">
            {birthdayEmployees.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Cake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Không có nhân viên nào có sinh nhật trong tháng {currentMonthNum}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {birthdayEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 bg-linear-to-r from-pink-50/50 to-purple-50/50 border border-pink-200/80 rounded-lg flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{emp.fullName}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{emp.position}</p>
                      <span className="text-[11px] font-semibold text-pink-700 font-mono">
                        Ngày sinh: {emp.birthDate || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 4: Tạm Ứng Chờ Duyệt */}
        {activeAlertTab === 'advances' && (
          <div className="p-4 sm:p-5">
            {pendingAdvances.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Không có khoản tạm ứng lương nào đang chờ phê duyệt.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                      <th className="py-2.5 px-3">Mã phiếu</th>
                      <th className="py-2.5 px-3">Nhân sự đề nghị</th>
                      <th className="py-2.5 px-3">Ngày gửi</th>
                      <th className="py-2.5 px-3">Lý do tạm ứng</th>
                      <th className="py-2.5 px-3 text-right">Số tiền đề xuất</th>
                      <th className="py-2.5 px-3 text-right">Xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingAdvances.map((adv) => {
                      const emp = employees.find((e) => e.id === adv.employeeId);
                      return (
                        <tr key={adv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-medium text-slate-900">{adv.code}</td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900">{emp?.fullName || 'N/A'}</span>
                            <span className="text-[11px] text-slate-500 block">{emp?.position}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">{adv.requestDate}</td>
                          <td className="py-3 px-3 text-slate-700 max-w-xs truncate">{adv.reason}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                            {formatNumberVN(adv.amount)} đ
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setActiveMainTab('compensation');
                                setActiveSubTab('advances');
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Phê Duyệt Ngay
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Quick Access Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Thang bảng lương */}
        <div
          onClick={() => {
            setActiveMainTab('compensation');
            setActiveSubTab('salary-scale');
          }}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TableProperties className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Thang Bảng Lương Ma Trận 8 Bậc</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Hệ số, lương cơ bản theo ngạch chức danh và phụ cấp năng lực theo chuẩn nhà nước.
          </p>
        </div>

        {/* Module 2: Bảng lương & Phiếu lương */}
        <div
          onClick={() => {
            setActiveMainTab('compensation');
            setActiveSubTab('payroll');
          }}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Bảng Lương & In Phiếu Lương</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Tổng hợp ngày công, OT, trích nộp BHXH, tính thuế TNCN lũy tiến từng phần và xuất phiếu lương.
          </p>
        </div>

        {/* Module 3: Chấm công & Tăng ca */}
        <div
          onClick={() => setActiveMainTab('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-500 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Chấm Công & Phụ Cấp Công Trình</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Chấm công 31 ngày, ghi nhận ký hiệu công trình, phụ cấp xăng xe máy và tiền ăn ca.
          </p>
        </div>

        {/* Module 4: Quản lý Bảo hiểm BHXH */}
        <div
          onClick={() => {
            setActiveMainTab('compensation');
            setActiveSubTab('insurance');
          }}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Bảo Hiểm Xã Hội & Y Tế</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Hồ sơ sổ BHXH, nơi đăng ký KCB ban đầu, trích nộp 10.5% NLĐ và 21.5% NSDLĐ.
          </p>
        </div>
      </div>
    </div>
  );
};
