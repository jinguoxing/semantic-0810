import React from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface SystemNoticeBlockProps {
  level: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
}

export const SystemNoticeBlock: React.FC<SystemNoticeBlockProps> = ({
  level,
  title,
  message
}) => {
  const styles = {
    info: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#BFDBFE]',
      text: 'text-[#1E3A8A]',
      icon: <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
    },
    success: {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#DCFCE7]',
      text: 'text-[#166534]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
    },
    warning: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-[#FDE68A]',
      text: 'text-[#92400E]',
      icon: <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
    },
    error: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FECACA]',
      text: 'text-[#991B1B]',
      icon: <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
    }
  };

  const current = styles[level] || styles.info;

  return (
    <div
      className={`p-3 rounded-xl border ${current.bg} ${current.border} ${current.text} text-xs flex items-start space-x-2.5 select-none`}
    >
      {current.icon}
      <div className="space-y-0.5">
        {title && <span className="font-bold block">{title}</span>}
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
