import React from 'react';
import { Flame } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizes = {
    sm: { icon: 14, text: 'text-xs', flameOffset: '-top-[5%]' },
    md: { icon: 20, text: 'text-xl', flameOffset: '-top-[8%]' },
    lg: { icon: 28, text: 'text-2xl', flameOffset: '-top-[12%]' },
    xl: { icon: 40, text: 'text-4xl', flameOffset: '-top-[15%]' },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center ${className}`}>
      {showText && (
        <div className={`font-black tracking-tighter flex items-baseline ${currentSize.text}`}>
          <span className="text-white">Ins</span>
          <span className="relative inline-flex flex-col items-center">
            <Flame 
              size={currentSize.icon * 0.45} 
              className={`text-red-600 animate-pulse absolute ${currentSize.flameOffset} left-1/2 -translate-x-1/2`} 
              fill="currentColor"
            />
            <span className="text-emerald-500">ı</span>
          </span>
          <span className="text-white">ght</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
