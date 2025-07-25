'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Shield,
  Database,
  Globe,
  Bug,
  Copy,
  ExternalLink
} from 'lucide-react';
import { checkEnvConfig, getEnvSetupGuide, type EnvCheckResult } from '@/lib/env-config';

// Access control component (reused from data-sources page)
function AccessControl({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      const key = searchParams.get('key');
      const expectedKeys = [
        process.env.NEXT_PUBLIC_ADMIN_KEY,
      ].filter(Boolean);

      // Check URL parameter
      if (key && expectedKeys.includes(key)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if running on localhost (development)
      if (typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1')) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      setIsAuthorized(false);
      setIsChecking(false);
    };

    checkAccess();
  }, [searchParams]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">验证访问权限...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-red-600">访问受限</CardTitle>
            <CardDescription>此页面需要管理员权限才能访问</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default function EnvConfigPage() {
  const [envResult, setEnvResult] = useState<EnvCheckResult | null>(null);
  const [setupGuide, setSetupGuide] = useState<string>('');

  useEffect(() => {
    // 检查环境变量配置
    const result = checkEnvConfig();
    setEnvResult(result);
    setSetupGuide(getEnvSetupGuide());
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // 可以添加toast提示
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <Shield className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Globe className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth': return 'bg-blue-100 text-blue-800';
      case 'database': return 'bg-green-100 text-green-800';
      case 'api': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!envResult) {
    return (
      <AccessControl>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Settings className="w-8 h-8 animate-spin" />
            <span className="ml-2">检查环境变量配置...</span>
          </div>
        </div>
      </AccessControl>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <AccessControl>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">环境变量配置</h1>
              <p className="text-gray-600 mt-2">检查和管理应用环境变量配置</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={envResult.isValid ? "default" : "destructive"}
                className="px-3 py-1"
              >
                {envResult.isValid ? '配置正常' : '需要修复'}
              </Badge>
            </div>
          </div>

          {/* 概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总计</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{envResult.summary.total}</div>
                <p className="text-xs text-muted-foreground">环境变量</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已配置</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{envResult.summary.configured}</div>
                <p className="text-xs text-muted-foreground">
                  {((envResult.summary.configured / envResult.summary.total) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">缺失</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{envResult.summary.missing}</div>
                <p className="text-xs text-muted-foreground">需要配置</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">警告</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{envResult.warnings.length}</div>
                <p className="text-xs text-muted-foreground">需要注意</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="status" className="space-y-6">
            <TabsList>
              <TabsTrigger value="status">配置状态</TabsTrigger>
              <TabsTrigger value="guide">设置指南</TabsTrigger>
              <TabsTrigger value="debug">调试信息</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-6">
              {/* 错误和警告 */}
              {(envResult.errors.length > 0 || envResult.warnings.length > 0) && (
                <div className="space-y-4">
                  {envResult.errors.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-5 h-5" />
                          配置错误 ({envResult.errors.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {envResult.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {envResult.warnings.length > 0 && (
                    <Card className="border-yellow-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600">
                          <AlertTriangle className="w-5 h-5" />
                          配置警告 ({envResult.warnings.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {envResult.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* 已配置的变量 */}
              {envResult.configured.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      已配置的环境变量 ({envResult.configured.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {envResult.configured.map((name, index) => {
                        const value = process.env[name];
                        const isSecret = name.includes('KEY') || name.includes('TOKEN') || name.includes('SECRET');
                        const displayValue = isSecret ? `${value?.substring(0, 4)}...` : value;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <div className="flex items-center gap-2">
                              <Badge className="text-xs bg-green-100 text-green-800">
                                {name}
                              </Badge>
                            </div>
                            <div className="text-sm font-mono text-green-700">
                              {displayValue}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="guide" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5" />
                    环境变量设置指南
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                      {setupGuide}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(setupGuide)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      复制指南
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="debug" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5" />
                    调试信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>运行环境:</strong> {process.env.NODE_ENV}
                      </div>
                      <div>
                        <strong>当前时间:</strong> {new Date().toLocaleString('zh-CN')}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">完整检查结果:</h4>
                      <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                        {JSON.stringify(envResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AccessControl>
    </div>
  );
}