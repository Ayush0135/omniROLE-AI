'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const dimensions = {
    sm: { box: 'w-7 h-7', img: 28, text: 'text-sm' },
    md: { box: 'w-9 h-9', img: 36, text: 'text-lg' },
    lg: { box: 'w-12 h-12', img: 48, text: 'text-2xl' },
  }[size];

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`${dimensions.box} rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/25 shrink-0 flex items-center justify-center`}>
        <Image
          src="/logo.svg"
          alt="OmniRole AI Logo"
          width={dimensions.img}
          height={dimensions.img}
          className="rounded-lg object-contain"
        />
      </div>

      {showText && (
        <span className={`font-extrabold ${dimensions.text} tracking-tight font-sora`} style={{ color: '#fef3c7' }}>
          OmniRole <span style={{ color: '#f59e0b' }}>AI</span>
        </span>
      )}
    </div>
  );
};
