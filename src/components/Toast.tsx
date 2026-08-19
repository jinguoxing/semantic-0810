import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  bottomOffsetClassName?: string;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss, bottomOffsetClassName }) => {
  return (
    <div className={`fixed right-5 z-[110] w-full max-w-sm space-y-2 ${bottomOffsetClassName ?? 'bottom-5'}`}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          border: 'border-[#059669]/30',
          bg: 'bg-[#ECFDF5]',
          text: 'text-[#059669]',
          icon: <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />,
        };
      case 'error':
        return {
          border: 'border-[#BE123C]/30',
          bg: 'bg-[#FFF1F2]',
          text: 'text-[#BE123C]',
          icon: <AlertCircle className="w-4 h-4 text-[#BE123C] shrink-0" />,
        };
      case 'info':
      default:
        return {
          border: 'border-[#4F46E5]/30',
          bg: 'bg-[#EEF2FF]',
          text: 'text-[#4F46E5]',
          icon: <Info className="w-4 h-4 text-[#4F46E5] shrink-0" />,
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={`p-3 rounded-lg border shadow-lg flex items-start justify-between gap-2 text-xs transition-all animate-in slide-in-from-bottom-2 ${style.bg} ${style.border}`}
    >
      <div className="flex items-start space-x-2">
        {style.icon}
        <div>
          <div className={`font-bold ${style.text}`}>{toast.title}</div>
          <div className="text-[#334155] text-[11px] mt-0.5">{toast.message}</div>
        </div>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[#94A3B8] hover:text-[#1E293B] p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
