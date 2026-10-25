import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  MessageSquare,
  Rocket,
  Building2,
  RotateCcw,
  Sliders,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { GoogleDriveBackupModal } from './GoogleDriveBackupModal';

import { MainTabType } from '../types/hrm';

export const Header: React.FC = () => {
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const {
    activeMainTab,
    setActiveMainTab,
    resetToDefaultData,
    showToast,
    isAppAdmin,
    activeRole,
    rolePermissions,
    adminAppEmail,
    setIsMobileMenuOpen,
  } = useHRM();

  // Desktop navigation scroll refs & states
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mobile navigation scroll refs & states
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const [mobileCanScrollLeft, setMobileCanScrollLeft] = useState(false);
  const [mobileCanScrollRight, setMobileCanScrollRight] = useState(false);

  const navTabs: { id: MainTabType; label: string }[] = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'departments', label: 'Phòng ban' },
    { id: 'employees', label: 'Nhân Sự' },
    { id: 'contracts', label: 'Hợp đồng' },
    { id: 'projects', label: 'Công trình' },
    { id: 'attendance', label: 'Chấm công' },
    { id: 'compensation', label: 'Lương thưởng' },
    { id: 'settings', label: 'Cài đặt' },
  ];

  // Check scroll boundary for desktop
  const updateDesktopScroll = () => {
    if (desktopNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = desktopNavRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  // Check scroll boundary for mobile
  const updateMobileScroll = () => {
    if (mobileNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileNavRef.current;
      setMobileCanScrollLeft(scrollLeft > 4);
      setMobileCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    updateDesktopScroll();
    updateMobileScroll();
    const handleResize = () => {
      updateDesktopScroll();
      updateMobileScroll();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll active tab into view on tab change
  useEffect(() => {
    // Desktop auto-scroll
    if (desktopNavRef.current) {
      const activeEl = desktopNavRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    // Mobile auto-scroll
    if (mobileNavRef.current) {
      const activeEl = mobileNavRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    setTimeout(() => {
      updateDesktopScroll();
      updateMobileScroll();
    }, 300);
  }, [activeMainTab]);

  const scrollDesktop = (direction: 'left' | 'right') => {
    if (desktopNavRef.current) {
      const offset = 200;
      desktopNavRef.current.scrollBy({
        left: direction === 'left' ? -offset : offset,
        behavior: 'smooth',
      });
    }
  };

  const scrollMobile = (direction: 'left' | 'right') => {
    if (mobileNavRef.current) {
      const offset = 160;
      mobileNavRef.current.scrollBy({
        left: direction === 'left' ? -offset : offset,
        behavior: 'smooth',
      });
    }
  };

  const handleDesktopWheel = (e: React.WheelEvent) => {
    if (desktopNavRef.current && e.deltaY !== 0) {
      desktopNavRef.current.scrollLeft += e.deltaY;
      updateDesktopScroll();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-20">
      {/* 1. Primary Top Bar (Desktop & Mobile) */}
      <div className="h-14 px-3 sm:px-4 flex items-center justify-between gap-2">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Mobile Menu Button (< md) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Mở menu danh mục phân hệ"
            aria-label="Mở menu danh mục"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          {/* HRM Icon Badge */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-base tracking-tight hidden sm:inline">
              HRM
            </span>
          </div>
        </div>

        {/* 2. Desktop Navigation Links (Visible only on md+) */}
        <div className="hidden md:flex relative flex-1 min-w-0 mx-3 items-center select-none">
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-2 bg-linear-to-r from-white via-white/95 to-transparent">
              <button
                onClick={() => scrollDesktop('left')}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs border border-slate-300 transition-colors cursor-pointer"
                title="Cuộn sang trái"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Desktop Nav Track */}
          <nav
            ref={desktopNavRef}
            onScroll={updateDesktopScroll}
            onWheel={handleDesktopWheel}
            className={`flex items-center space-x-1.5 overflow-x-auto touch-scroll-x no-scrollbar scroll-smooth py-1 ${
              canScrollLeft ? 'pl-6' : ''
            } ${canScrollRight ? 'pr-6' : ''}`}
          >
            {navTabs.map((tab) => {
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-active={isActive}
                  onClick={() => setActiveMainTab(tab.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Arrow Button */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-2 bg-linear-to-l from-white via-white/95 to-transparent">
              <button
                onClick={() => scrollDesktop('right')}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs border border-slate-300 transition-colors cursor-pointer"
                title="Cuộn sang phải"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 3. Right side utilities */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          {/* Reset mock data button for testing (Desktop only) */}
          <button
            onClick={resetToDefaultData}
            className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded border border-slate-200 transition-colors cursor-pointer"
            title="Khôi phục lại dữ liệu mẫu chuẩn ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Dữ liệu mẫu</span>
          </button>

          {/* Settings button */}
          <button
            onClick={() => setActiveMainTab('settings')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              activeMainTab === 'settings'
                ? 'text-blue-700 bg-blue-50 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Cài đặt hệ thống & Tùy biến xuất Excel"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => showToast('Bạn có 940 thông báo hệ thống: 12 cảnh báo hợp đồng, 8 chấm công cần duyệt')}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Thông báo"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full leading-tight shadow-xs">
                940
              </span>
            </button>
          </div>

          {/* Message bubble (Hidden on very small mobile) */}
          <button
            onClick={() => showToast('Tin nhắn nội bộ: Phòng Nhân sự đã mở kỳ lương tháng 10/2026')}
            className="hidden sm:inline-flex p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tin nhắn nội bộ"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Rocket launcher (Hidden on very small mobile) */}
          <button
            onClick={() => showToast('5 quy trình tự động hóa C&B đang chạy nền')}
            className="hidden sm:inline-flex p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Khởi chạy nhanh quy trình"
          >
            <Rocket className="w-4 h-4" />
          </button>

          {/* Google Drive Cloud Backup & Save Project Button */}
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center space-x-1 sm:space-x-1.5 text-xs text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-700 px-2 py-1.5 rounded-lg border border-blue-200 transition-all font-semibold cursor-pointer shadow-2xs"
            title="Lưu dự án & Sao lưu Google Drive"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Drive</span>
            <span className="sm:hidden text-[11px]">Drive</span>
          </button>

          {/* User Avatar & Info */}
          <div className="flex items-center space-x-1.5 pl-1.5 sm:pl-2 border-l border-slate-200">
            {isAppAdmin ? (
              <div
                className="flex items-center space-x-1 px-2 py-0.5 sm:py-1 bg-amber-50 border border-amber-300 rounded-full text-amber-900 text-[11px] font-semibold shadow-2xs cursor-pointer"
                title={`Quản trị viên App tối cao: ${adminAppEmail}`}
                onClick={() => showToast(`Bạn đang đăng nhập quyền: Quản trị viên App (${adminAppEmail})`)}
              >
                <span className="text-amber-600">👑</span>
                <span className="hidden xl:inline font-mono text-[11px] font-bold">Admin App ({adminAppEmail})</span>
                <span className="xl:hidden font-bold">Admin</span>
              </div>
            ) : (
              <div
                className="flex items-center space-x-1 px-2 py-0.5 sm:py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-700 text-[11px] cursor-pointer hover:bg-slate-200 transition-colors"
                title={`Vai trò: ${activeRole === 'director' ? 'Giám Đốc' : 'Kế toán'}`}
                onClick={() => {
                  const currentCanEdit = rolePermissions[activeRole as keyof typeof rolePermissions] === 'edit';
                  showToast(
                    `Vai trò: ${activeRole === 'director' ? 'Giám Đốc' : 'Kế toán'} - ${currentCanEdit ? 'Được sửa' : 'Chỉ xem'}`,
                    currentCanEdit ? 'info' : 'error'
                  );
                }}
              >
                <span className="font-semibold text-[11px]">
                  {activeRole === 'director' ? 'Giám Đốc' : activeRole === 'payroll_accountant' ? 'Kế toán' : 'NV'}
                </span>
              </div>
            )}

            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all shrink-0"
              title={`Tài khoản: ${adminAppEmail}`}
              onClick={() => showToast(`Tài khoản Admin App: ${adminAppEmail}`)}
            >
              H
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mobile Dedicated Full-Width Tab Navigation Bar (Visible only on screens < md) */}
      <div className="md:hidden border-t border-slate-200 bg-slate-50/95 px-1 py-1.5 relative flex items-center select-none shadow-inner">
        {/* Mobile Left Arrow Button */}
        {mobileCanScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-1.5 pl-0.5 bg-linear-to-r from-slate-100 via-slate-100/90 to-transparent">
            <button
              onClick={() => scrollMobile('left')}
              className="p-1 rounded-full bg-white text-slate-700 shadow-xs border border-slate-300 cursor-pointer"
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mobile Horizontally Scrollable Tabs (100% Full Width of Phone Screen) */}
        <nav
          ref={mobileNavRef}
          onScroll={updateMobileScroll}
          className={`w-full flex items-center space-x-1.5 overflow-x-auto touch-scroll-x no-scrollbar scroll-smooth py-0.5 px-1.5 ${
            mobileCanScrollLeft ? 'pl-6' : ''
          } ${mobileCanScrollRight ? 'pr-6' : ''}`}
        >
          {navTabs.map((tab) => {
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                data-active={isActive}
                onClick={() => setActiveMainTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Right Arrow Button */}
        {mobileCanScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-1.5 pr-0.5 bg-linear-to-l from-slate-100 via-slate-100/90 to-transparent">
            <button
              onClick={() => scrollMobile('right')}
              className="p-1 rounded-full bg-white text-slate-700 shadow-xs border border-slate-300 cursor-pointer"
              aria-label="Cuộn sang phải"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Google Drive Backup & Save Modal */}
      <GoogleDriveBackupModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
      />
    </header>
  );
};
