import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, title, subtitle, headerAction, footer }) => {
  const hasHeaderOrFooter = Boolean(title || subtitle || headerAction || footer);

  if (!hasHeaderOrFooter) {
    return (
      <div className={twMerge('card-premium bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-6 overflow-hidden transition-all', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={twMerge('card-premium bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-all', className)}>
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800/80">
        <div>
          {title && <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="p-4 sm:p-6">
        {children}
      </div>
      {footer && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-slate-800/40 border-t border-gray-50 dark:border-slate-800/80">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
