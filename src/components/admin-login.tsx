'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
  redirectUrl?: string;
}

export function AdminLogin({ onLoginSuccess, redirectUrl = '/admin/data-sources' }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting admin login...');
      
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Login successful');
        
        // 存储token到localStorage（作为备用）
        if (data.token) {
          localStorage.setItem('admin-token', data.token);
          localStorage.setItem('admin-login-time', new Date().toISOString());
        }
        
        // 调用成功回调
        onLoginSuccess(data.token || '');
        
        // 重定向到管理页面
        window.location.href = `${redirectUrl}?authenticated=true`;
        
      } else {
        console.log('❌ Login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">管理员登录</CardTitle>
          <CardDescription>
            请输入管理员密码以访问后台
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 开发环境提示 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-2">🚀 开发环境快捷方式:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• 通过 localhost 可直接访问管理页面</p>
                <p>• 环境变量密钥: {process.env.NEXT_PUBLIC_ADMIN_KEY ? `${process.env.NEXT_PUBLIC_ADMIN_KEY.substring(0, 8)}...` : '未配置'}</p>
                <p>• 运行 <code className="bg-blue-100 px-1 rounded">./setup-dev.sh</code> 快速设置</p>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/admin/env-config'}
                  className="text-xs"
                >
                  检查配置
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/admin/data-sources'}
                  className="text-xs"
                >
                  直接访问
                </Button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                访问密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  验证中...
                </div>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                安全提示：会话将在1小时后自动过期
              </p>
              <p>• 使用安全的网络环境访问</p>
              <p>• 不要在公共设备上保存密码</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/'}
            >
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}