import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface XinoAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const XinoAvatar: React.FC<XinoAvatarProps> = ({
  className = '',
  size = 'md'
}) => {
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={`${iconSizes[size]} rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white font-bold shadow-2xs shrink-0 overflow-hidden ${className}`}
    >
      {!imgError ? (
        <img
          src="/brand/xino-avatar.png"
          alt="Xino Avatar"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
    </div>
  );
};
