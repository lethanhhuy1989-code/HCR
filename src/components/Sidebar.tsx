import React from 'react';
import {
  Home,
  Megaphone,
  BarChart3,
  Briefcase,
  ShoppingCart,
  Share2,
  Package,
  PhoneCall,
  FileText,
  Users2,
  ChevronDown,
  Globe,
  Settings,
  X,
  Building2,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isMainHRM?: boolean;
}

const menuItems: SidebarItem[] = [
  { id: 'home', label: 'Trang chủ', icon: Home },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'kpi', label: 'KPI', icon: BarChart3 },
  { id: 'tasks', label: 'Công việc', icon: Briefcase },
  { id: 'sales', label: 'Bán hàng', icon: ShoppingCart },
  { id: 'crm', label: 'Social CRM', icon: Share2 },
  { id: 'inventory', label: 'Kho', icon: Package },
  { id: 'support', label: 'CSKH', icon: PhoneCall },
  { id: 'reports', label: 'Báo cáo', icon: FileText },
  { id: 'hrm', label: 'HRM', icon: Users2, isMainHRM: true },
];

export const Sidebar: React.FC = () => {
  const { activeMainTab, setActiveMainTab, showToast, isMobileMenuOpen, setIsMobileMenuOpen } = useHRM();

  const handleItemClick = (item: SidebarItem) => {
    if (item.isMainHRM) {
      setActiveMainTab('compensation');
    } else if (item.id === 'kpi') {
      setActiveMainTab('kpi');
    } else {
      showToast(`Đang chuyển đến phân hệ ${item.label}. Hệ thống đang tập trung tối ưu phân hệ HRM Enterprise.`);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* 1. Desktop Fixed Vertical Navigation Rail (Hidden on Mobile) */}
      <aside className="hidden md:flex w-[72px] shrink-0 bg-[#16233B] text-slate-300 flex-col items-center py-2 select-none border-r border-[#0f172a] shadow-md z-30 min-h-screen">
        {/* Top Main navigation icons */}
        <div className="w-full flex-1 flex flex-col items-center space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = (item.isMainHRM && activeMainTab !== 'kpi') || (item.id === 'kpi' && activeMainTab === 'kpi');

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                title={item.label}
                className={`w-full py-2.5 px-1 flex flex-col items-center justify-center relative transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-[#1E40AF] text-white font-medium shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {/* Active indicator arrow on the right edge */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-slate-100" />
                )}
                <Icon className="w-5 h-5 mb-1 group-hover:scale-105 transition-transform" />
                <span className="text-[10px] leading-tight text-center tracking-tight truncate w-full px-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom utility icons */}
        <div className="w-full pt-2 border-t border-slate-700/50 flex flex-col items-center space-y-3 pb-3">
          <button
            onClick={() => showToast('Mở rộng thanh chức năng nhanh')}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Thu gọn / Mở rộng"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast('Hệ thống đang hoạt động tại múi giờ Việt Nam (GMT+7)')}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Mạng lưới chi nhánh"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveMainTab('settings')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeMainTab === 'settings'
                ? 'bg-[#1E40AF] text-white shadow-inner ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Cài đặt hệ thống & Tùy chỉnh Xuất Excel"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Menu (Visible when isMobileMenuOpen = true on screens < md) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-over Content */}
          <div className="relative w-64 max-w-[80vw] bg-[#16233B] text-slate-200 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1E40AF] text-white flex items-center justify-center font-bold shadow-xs">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">HRM Enterprise</h3>
                  <p className="text-[11px] text-slate-400">Danh mục phân hệ</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = (item.isMainHRM && activeMainTab !== 'kpi') || (item.id === 'kpi' && activeMainTab === 'kpi');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full px-3 py-2.5 rounded-lg flex items-center space-x-3 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#1E40AF] text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-700/80 bg-slate-900/40">
              <button
                onClick={() => {
                  setActiveMainTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg flex items-center space-x-2 text-xs font-semibold transition-colors cursor-pointer ${
                  activeMainTab === 'settings'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Cài Đặt Hệ Thống</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
