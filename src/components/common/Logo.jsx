import React from 'react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

const Logo = ({ 
  size = 'md', 
  showText = true, 
  to = '/dashboard', 
  className = '',
  textColor = 'text-gray-900',
  subtextColor = 'text-gray-400'
}) => {
  const sizeClasses = {
    xs: {
      box: 'w-7 h-7 rounded-lg',
      img: 'w-7 h-7',
      title: 'text-sm',
      sub: 'text-[9px]'
    },
    sm: {
      box: 'w-8 h-8 rounded-xl',
      img: 'w-8 h-8',
      title: 'text-base',
      sub: 'text-[9px]'
    },
    md: {
      box: 'w-10 h-10 rounded-xl',
      img: 'w-10 h-10',
      title: 'text-xl',
      sub: 'text-[10px]'
    },
    lg: {
      box: 'w-14 h-14 rounded-2xl',
      img: 'w-14 h-14',
      title: 'text-2xl sm:text-3xl',
      sub: 'text-xs'
    },
    xl: {
      box: 'w-16 h-16 rounded-2xl',
      img: 'w-16 h-16',
      title: 'text-3xl sm:text-4xl',
      sub: 'text-xs'
    }
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  const content = (
    <div className={twMerge('inline-flex items-center gap-3 select-none group', className)}>
      {/* Logo Emblem Icon */}
      <div className={twMerge(
        'relative shrink-0 overflow-hidden shadow-md shadow-blue-200/50 group-hover:scale-105 transition-transform duration-200 ring-2 ring-blue-50',
        selectedSize.box
      )}>
        <img 
          src="/logo.svg" 
          alt="SpendWise Logo" 
          className={twMerge('object-contain w-full h-full', selectedSize.img)} 
          onError={(e) => {
            // Fallback to logo.png if SVG fails
            e.target.onerror = null;
            e.target.src = '/logo.png';
          }}
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={twMerge('font-black tracking-tight', textColor, selectedSize.title)}>
            SpendWise
          </span>
          <span className={twMerge('font-bold tracking-widest uppercase mt-0.5', subtextColor, selectedSize.sub)}>
            Smart Finance
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;

