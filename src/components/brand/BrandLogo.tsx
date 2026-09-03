import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-9 h-9 text-base'
  };

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      <div
        className={`${iconSizes[size]} rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-extrabold shadow-2xs shrink-0 overflow-hidden`}
      >
        {!imgError ? (
          <img
            src="/brand/semovix-logo.png"
            alt="Semovix Logo"
            className="w-full h-full object-contain p-0.5"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-mono tracking-tighter">S</span>
        )}
      </div>

      {showText && (
        <div className="flex flex-col truncate">
          <span className="font-extrabold text-sm text-[#0F172A] tracking-tight leading-none">
            Semovix
          </span>
          <span className="text-[10px] text-[#64748B] tracking-tight font-medium mt-0.5 truncate">
            企业 AI 原生语义智能平台
          </span>
        </div>
      )}
    </div>
  );
};
