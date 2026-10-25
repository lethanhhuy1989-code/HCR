import React from 'react';
import { HRMProvider, useHRM } from './context/HRMContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CompensationSubNav } from './components/CompensationSubNav';
import { SalaryScaleMatrix } from './components/SalaryScaleMatrix';
import { PayrollSheet } from './components/PayrollSheet';
import { EmployeeManagement } from './components/EmployeeManagement';
import { ContractManagement } from './components/ContractManagement';
import { InsuranceManagement } from './components/InsuranceManagement';
import { AttendanceSheet } from './components/AttendanceSheet';
import { SalaryAdvance } from './components/SalaryAdvance';
import { HRConfigTab } from './components/HRConfigTab';
import { TierPositionView } from './components/TierPositionView';
import { DepartmentsView } from './components/DepartmentsView';
import { HomeOverview } from './components/HomeOverview';
import { ProjectsView } from './components/ProjectsView';
import { AllowancesManagement } from './components/AllowancesManagement';
import { PerformanceReviewModule } from './components/PerformanceReviewModule';
import { SettingsView } from './components/SettingsView';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeMainTab, activeSubTab, toast } = useHRM();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* 1. Left Vertical Navigation Rail (Matches Screenshot) */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header />

        {/* Sub Navigation Bar (when inside Compensation / Lương thưởng) */}
        {activeMainTab === 'compensation' && <CompensationSubNav />}

        {/* Dynamic View Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50/70">
          {activeMainTab === 'home' && <HomeOverview />}
          {activeMainTab === 'departments' && <DepartmentsView />}
          {activeMainTab === 'employees' && <EmployeeManagement />}
          {activeMainTab === 'contracts' && <ContractManagement />}
          {activeMainTab === 'projects' && <ProjectsView />}
          {activeMainTab === 'attendance' && <AttendanceSheet />}
          {activeMainTab === 'kpi' && <PerformanceReviewModule />}
          {activeMainTab === 'settings' && <SettingsView />}
          {activeMainTab === 'compensation' && (
            <>
              {activeSubTab === 'payroll' && <PayrollSheet />}
              {activeSubTab === 'kpi-review' && <PerformanceReviewModule />}
              {activeSubTab === 'allowances' && <AllowancesManagement />}
              {activeSubTab === 'salary-scale' && <SalaryScaleMatrix />}
              {activeSubTab === 'tier-position' && <TierPositionView />}
              {activeSubTab === 'advances' && <SalaryAdvance />}
              {activeSubTab === 'insurance' && <InsuranceManagement />}
              {activeSubTab === 'settings' && <HRConfigTab />}
            </>
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 bg-white border-slate-200 text-slate-900">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <HRMProvider>
      <AppContent />
    </HRMProvider>
  );
}
