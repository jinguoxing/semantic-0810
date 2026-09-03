import React from 'react';
import { Loader2 } from 'lucide-react';

interface RuntimeStatusBlockProps {
  message: string;
}

export const RuntimeStatusBlock: React.FC<RuntimeStatusBlockProps> = ({ message }) => {
  return (
    <div className="flex items-center space-x-2 text-xs text-[#2563EB] py-1 select-none animate-pulse">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      <span>{message}</span>
    </div>
  );
};
