"use client";

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  validation?: 'error' | 'success' | 'none';
  showPasswordToggle?: boolean;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className,
    label,
    error,
    success,
    hint,
    leftIcon,
    rightIcon,
    validation = 'none',
    showPasswordToggle = false,
    type = 'text',
    id,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const actualType = showPasswordToggle && showPassword ? 'text' : type;
    
    // 确定验证状态
    const validationState = error ? 'error' : success ? 'success' : validation;
    
    const inputClasses = [
      // 基础样式
      'w-full px-3 py-2',
      'bg-ds-surface-secondary',
      'border border-ds-border-default',
      'rounded-md',
      'font-ds text-ds-body leading-ds-body',
      'text-ds-text-primary',
      'placeholder:text-ds-text-disabled',
      'transition-all duration-200',
      
      // 聚焦状态
      'focus:outline-none',
      'focus:border-ds-accent',
      'focus:ring-2 focus:ring-ds-accent/20',
      
      // 禁用状态
      'disabled:bg-ds-surface-primary',
      'disabled:text-ds-text-disabled',
      'disabled:cursor-not-allowed',
      
      // 图标间距
      leftIcon && 'pl-10',
      (rightIcon || showPasswordToggle || validationState !== 'none') && 'pr-10',
    ];
    
    const validationClasses = {
      error: 'border-ds-error focus:border-ds-error focus:ring-ds-error/20',
      success: 'border-ds-success focus:border-ds-success focus:ring-ds-success/20',
      none: '',
    };
    
    const labelClasses = [
      'block text-ds-label font-ds-medium leading-ds-label',
      'mb-1 transition-colors duration-200',
      focused && validationState === 'none' && 'text-ds-accent',
      validationState === 'error' && 'text-ds-error',
      validationState === 'success' && 'text-ds-success',
      !focused && validationState === 'none' && 'text-ds-text-secondary',
    ];

    return (
      <div className="space-y-1">
        {/* 标签 */}
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(labelClasses)}
          >
            {label}
          </label>
        )}
        
        {/* 输入框容器 */}
        <div className="relative">
          {/* 左侧图标 */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-text-secondary">
              {leftIcon}
            </div>
          )}
          
          {/* 输入框 */}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            className={cn(
              inputClasses,
              validationClasses[validationState],
              className
            )}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          
          {/* 右侧图标区域 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* 验证状态图标 */}
            {validationState === 'success' && (
              <Check className="h-4 w-4 text-ds-success" />
            )}
            {validationState === 'error' && (
              <AlertCircle className="h-4 w-4 text-ds-error" />
            )}
            
            {/* 密码切换按钮 */}
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-ds-text-secondary hover:text-ds-text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* 自定义右侧图标 */}
            {rightIcon && !showPasswordToggle && (
              <div className="text-ds-text-secondary">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        
        {/* 提示信息 */}
        {(error || success || hint) && (
          <div className="space-y-1">
            {error && (
              <p className="text-ds-small text-ds-error leading-ds-small">
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-ds-small text-ds-success leading-ds-small">
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-ds-small text-ds-text-secondary leading-ds-small">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export { EnhancedInput };
