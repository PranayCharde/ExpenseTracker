import React from 'react';
import { twMerge } from 'tailwind-merge';

const Input = ({ label, error, icon: Icon, className, ...props }) => {
  return (
    <div className={twMerge('w-full space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          className={twMerge(
            'input-standard focus:ring-brand-primary focus:border-brand-primary placeholder:text-gray-400',
            Icon && 'pl-10',
            error && 'border-danger focus:ring-danger focus:border-danger',
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
