import React from 'react';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, variant = 'info', className }) => {
  const variants = {
    success: 'bg-green-50 text-green-700 border-green-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
    special: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  return (
    <span className={twMerge(
      'px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
