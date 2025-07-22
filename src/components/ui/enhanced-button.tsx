"use client";

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = [
      // 基础样式
      'inline-flex items-center justify-center',
      'font-medium rounded-md',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'relative overflow-hidden',
      
      // 微交互
      'transform-gpu',
      'active:scale-[0.98]',
    ];

    const variantClasses = {
      primary: [
        'bg-ds-accent text-white',
        'hover:bg-ds-accent-hover hover:-translate-y-0.5',
        'hover:shadow-lg',
        'focus:ring-ds-accent',
        'active:bg-ds-accent-active active:translate-y-0',
      ],
      secondary: [
        'bg-transparent text-ds-text-primary',
        'border border-ds-border-interactive',
        'hover:border-ds-accent hover:text-ds-accent',
        'hover:-translate-y-0.5 hover:shadow-md',
        'focus:ring-ds-accent',
        'active:translate-y-0',
      ],
      ghost: [
        'bg-transparent text-ds-text-secondary',
        'hover:bg-ds-surface-secondary hover:text-ds-text-primary',
        'focus:ring-ds-accent',
      ],
      danger: [
        'bg-ds-error text-white',
        'hover:bg-red-600 hover:-translate-y-0.5',
        'hover:shadow-lg',
        'focus:ring-ds-error',
        'active:bg-red-700 active:translate-y-0',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          loading && 'pointer-events-none',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* 加载状态 */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        
        {/* 内容 */}
        <div className={cn(
          'flex items-center gap-inherit',
          loading && 'opacity-0'
        )}>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          
          {children && (
            <span className="flex-1">{children}</span>
          )}
          
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton };
