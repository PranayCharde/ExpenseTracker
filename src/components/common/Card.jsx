import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, title, subtitle, headerAction, footer }) => {
  return (
    <div className={twMerge('card-premium bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden', className)}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
