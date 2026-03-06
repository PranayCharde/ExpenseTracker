import React from 'react';
import { twMerge } from 'tailwind-merge';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  icon: Icon,
  iconPosition = 'left',
  ...props 
}) => {
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-blue-600',
    secondary: 'bg-white text-text-primary border border-border hover:bg-gray-50',
    outline: 'bg-transparent border border-brand-primary text-brand-primary hover:bg-blue-50',
    ghost: 'bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary',
    danger: 'bg-danger text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClasses = twMerge(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
    variants[variant],
    sizes[size],
    className
  );

  return (
    <button className={combinedClasses} {...props}>
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : 20} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : 20} />}
    </button>
  );
};

export default Button;
