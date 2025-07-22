"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // 自动移除
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[toast.type];

  const typeClasses = {
    success: 'bg-ds-success/10 border-ds-success/20 text-ds-success',
    error: 'bg-ds-error/10 border-ds-error/20 text-ds-error',
    warning: 'bg-ds-warning/10 border-ds-warning/20 text-ds-warning',
    info: 'bg-ds-info/10 border-ds-info/20 text-ds-info',
  };

  return (
    <div
      className={cn(
        // 基础样式
        'relative p-4 rounded-lg border backdrop-blur-sm',
        'bg-ds-surface-secondary/95 border-ds-border-default',
        'shadow-lg',
        
        // 动画
        'slide-in-right',
        'transform-gpu',
        
        // 类型样式
        typeClasses[toast.type]
      )}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-6">
        {/* 图标 */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>

        {/* 内容 */}
        <div className="flex-1 space-y-1">
          <div className="font-ds-medium text-ds-h3 leading-ds-h3 text-ds-text-primary">
            {toast.title}
          </div>
          
          {toast.description && (
            <div className="text-ds-small leading-ds-small text-ds-text-secondary">
              {toast.description}
            </div>
          )}
          
          {toast.action && (
            <div className="pt-2">
              <button
                onClick={toast.action.onClick}
                className="text-ds-small font-ds-medium text-ds-accent hover:text-ds-accent-hover transition-colors"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 便捷的hook函数
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
  };
}
