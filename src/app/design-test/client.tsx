"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeDebug } from '@/components/theme-debug';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { ToastProvider, useToastActions } from '@/components/ui/toast';

export default function DesignTestClient() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">设计测试页面</h1>
          <p>UI组件测试页面...</p>
          <ThemeToggle />
          <ThemeDebug />
        </div>
      </div>
    </ToastProvider>
  )
}
