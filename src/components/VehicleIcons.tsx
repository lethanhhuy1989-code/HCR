import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Logo Xe máy (Motorcycle)
 * Đại diện cho chế độ đi xe máy cá nhân: SẼ TÍNH PHỤ CẤP XĂNG
 */
export const MotorcycleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Rear wheel */}
    <circle cx="5" cy="17.5" r="3.5" />
    {/* Front wheel */}
    <circle cx="19" cy="17.5" r="3.5" />
    {/* Handlebars */}
    <path d="M14 5h3l1 2" />
    {/* Chassis & Fork */}
    <path d="M19 17.5l-3-10.5h-3.5l-3 5h6.5" />
    {/* Rear frame & seat */}
    <path d="M5 17.5l4-7.5h4" />
    {/* Engine/Transmission */}
    <path d="M9.5 14h4l1 3.5h-5.5z" />
  </svg>
);

/**
 * Logo Ô tô (Car / Company vehicle)
 * Đại diện cho chế độ đi xe ô tô / cấp xe công ty: KHÔNG TÍNH PHỤ CẤP XĂNG
 */
export const CarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.9C2 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);
