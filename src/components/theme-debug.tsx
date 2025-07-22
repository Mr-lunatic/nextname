"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ThemeDebug() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading theme...</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>主题调试信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div><strong>当前主题:</strong> {theme}</div>
          <div><strong>解析主题:</strong> {resolvedTheme}</div>
          <div><strong>系统主题:</strong> {systemTheme}</div>
          <div><strong>HTML类:</strong> {document.documentElement.className}</div>
        </div>
        
        <div className="space-y-2">
          <div><strong>CSS变量测试:</strong></div>
          <div style={{ 
            backgroundColor: 'var(--color-background)', 
            color: 'var(--color-text-primary)',
            padding: '8px',
            border: '1px solid var(--color-border)',
            borderRadius: '4px'
          }}>
            背景色和文字色测试
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
          >
            浅色
          </Button>
          <Button 
            size="sm" 
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            深色
          </Button>
          <Button 
            size="sm" 
            variant={theme === 'system' ? 'default' : 'outline'}
            onClick={() => setTheme('system')}
          >
            系统
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
