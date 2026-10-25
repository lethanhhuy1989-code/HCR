import React, { useRef, useState, useEffect } from 'react';
import { useHRM } from '../context/HRMContext';
import {
  TableProperties,
  DollarSign,
  Award,
  CreditCard,
  ShieldCheck,
  SlidersHorizontal,
  Car,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SubTabItem {
  id: 'salary-scale' | 'payroll' | 'tier-position' | 'advances' | 'insurance' | 'settings' | 'allowances' | 'kpi-review';
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const CompensationSubNav: React.FC = () => {
  const { activeSubTab, setActiveSubTab, settings, toggleKpiBonus, toggleAllowances } = useHRM();

  const isKpiOn = settings.enableKpiBonus ?? false;
  const isAllowancesOn = settings.enableAllowances ?? false;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  const subTabs: SubTabItem[] = [
    { id: 'payroll', label: 'Tiền lương', icon: DollarSign, badge: 'Mặc định' },
    {
      id: 'kpi-review',
      label: 'Đánh giá KPI & Thưởng',
      icon: Award,
      badge: isKpiOn ? 'BẬT' : 'TẮT',
      badgeColor: isKpiOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600',
    },
    {
      id: 'allowances',
      label: 'Mục Phụ cấp',
      icon: Car,
      badge: isAllowancesOn ? 'BẬT' : 'TẮT',
      badgeColor: isAllowancesOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600',
    },
    { id: 'salary-scale', label: 'Thang Bảng Lương', icon: TableProperties },
    { id: 'tier-position', label: 'Bậc lương vị trí', icon: Award },
    { id: 'advances', label: 'Tạm ứng lương', icon: CreditCard },
    { id: 'insurance', label: 'Bảo hiểm (BHXH)', icon: ShieldCheck },
    { id: 'settings', label: 'Cấu hình Thuế & Tỷ lệ', icon: SlidersHorizontal },
  ];

  // Check scroll boundary to show/hide chevron indicators
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-scroll active tab into view when activeSubTab changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeBtn = scrollContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    setTimeout(updateScrollButtons, 300);
  }, [activeSubTab]);

  // Click scroll left / right buttons
  const scrollHorizontally = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollOffset = 220;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollOffset : scrollOffset,
        behavior: 'smooth',
      });
    }
  };

  // Mouse wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      if (e.deltaY !== 0) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
        updateScrollButtons();
      }
    }
  };

  // Drag-to-scroll mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollStart(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollStart - walk;
    updateScrollButtons();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs relative select-none">
      {/* 1. Main Sub Tabs Bar (Full Width on Mobile & Flex on Desktop) */}
      <div className="px-2 sm:px-3 py-1.5 flex items-center justify-between gap-2">
        {/* Scrollable Sub Tabs Wrapper with Lateral Controls */}
        <div className="relative flex-1 min-w-0 flex items-center">
          {/* Left Scroll Button & Fade Indicator */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-2.5 bg-linear-to-r from-white via-white/95 to-transparent">
              <button
                onClick={() => scrollHorizontally('left')}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs border border-slate-300 transition-colors cursor-pointer"
                title="Cuộn sang trái"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Scrollable Tabs Container - Works seamlessly with touch on mobile */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollButtons}
            onWheel={handleWheel}
            className={`flex items-center space-x-1.5 overflow-x-auto touch-scroll-x no-scrollbar scroll-smooth py-0.5 w-full ${
              canScrollLeft ? 'pl-6 sm:pl-7' : ''
            } ${canScrollRight ? 'pr-6 sm:pr-7' : ''}`}
          >
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  data-active={isActive}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-90" />
                  <span>{tab.label}</span>
                  {tab.badge && !isActive && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        tab.badgeColor || 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Scroll Button & Fade Indicator */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-2.5 bg-linear-to-l from-white via-white/95 to-transparent">
              <button
                onClick={() => scrollHorizontally('right')}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs border border-slate-300 transition-colors cursor-pointer"
                title="Cuộn sang phải"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop Quick ON/OFF policy switches (hidden on mobile, shown on md+) */}
        <div className="hidden md:flex items-center space-x-2 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Áp dụng:
          </span>

          {/* Toggle KPI */}
          <button
            onClick={() => toggleKpiBonus()}
            title="Bật/Tắt phân hệ Đánh giá & Thưởng KPI"
            className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isKpiOn
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isKpiOn ? (
              <ToggleRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400" />
            )}
            <span>KPI:</span>
            <span className={`font-semibold ${isKpiOn ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isKpiOn ? 'BẬT' : 'TẮT'}
            </span>
          </button>

          {/* Toggle Allowances */}
          <button
            onClick={() => toggleAllowances()}
            title="Bật/Tắt phân hệ Phụ cấp xăng xe, tiền ăn, công tác phí, trách nhiệm"
            className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isAllowancesOn
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isAllowancesOn ? (
              <ToggleRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400" />
            )}
            <span>Phụ cấp:</span>
            <span className={`font-semibold ${isAllowancesOn ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isAllowancesOn ? 'BẬT' : 'TẮT'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Mobile Quick Policy Switches Sub-Bar (Visible on mobile < md) */}
      <div className="md:hidden flex items-center justify-between px-3 py-1 bg-slate-50 border-t border-slate-200">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Áp dụng chính sách:
        </span>

        <div className="flex items-center space-x-2">
          {/* Mobile Toggle KPI */}
          <button
            onClick={() => toggleKpiBonus()}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isKpiOn
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            {isKpiOn ? (
              <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>KPI: <b>{isKpiOn ? 'BẬT' : 'TẮT'}</b></span>
          </button>

          {/* Mobile Toggle Allowances */}
          <button
            onClick={() => toggleAllowances()}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isAllowancesOn
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            {isAllowancesOn ? (
              <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Phụ cấp: <b>{isAllowancesOn ? 'BẬT' : 'TẮT'}</b></span>
          </button>
        </div>
      </div>
    </div>
  );
};

