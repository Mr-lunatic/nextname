'use client';

import { useState, useEffect } from 'react';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react';

export default function AdminDebugPage() {
  const searchParams = useSearchParams();
  const [showKeys, setShowKeys] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const urlKey = searchParams.get('key');
  const envKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
  const primaryKey = '6BJwlY6mhcUIwz6D';  // 当前使用的主要密钥

  const debugInfo = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    },
    keys: {
      urlKey: urlKey || '(未提供)',
      envKey: envKey || '(未设置)',
      primaryKey: primaryKey,
    },
    localStorage: {
      failedAttempts: typeof window !== 'undefined' ? localStorage.getItem('admin_failed_attempts') || '0' : '0',
      blockEnd: typeof window !== 'undefined' ? localStorage.getItem('admin_block_end') || '(未设置)' : '(未设置)',
    }
  };

  const testApiAccess = async () => {
    const testKey = urlKey || envKey || primaryKey;
    console.log('🧪 Testing API access with key:', testKey ? `${testKey.substring(0, 4)}...` : 'none');

    try {
      // Test the simple test endpoint first
      const testResponse = await fetch(`/api/test-admin?key=${testKey}`, {
        headers: {
          'x-admin-key': testKey
        }
      });

      console.log('Test API Response status:', testResponse.status);

      let testData = null;
      if (testResponse.ok) {
        testData = await testResponse.json();
        console.log('Test endpoint data:', testData);
      }

      // Test the main data source status endpoint (with bindings)
      const response = await fetch(`/api/data-source-status?key=${testKey}`, {
        headers: {
          'x-admin-key': testKey
        }
      });

      console.log('Main API Response status:', response.status);

      let responseData;
      try {
        responseData = response.ok ? await response.json() : await response.text();
      } catch (error) {
        responseData = `Error reading response: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      setTestResults({
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        data: responseData,
        keyUsed: testKey,
        testEndpoint: testData || 'Test endpoint failed'
      });
    } catch (error) {
      console.error('API Test error:', error);
      setTestResults({
        status: 'ERROR',
        ok: false,
        statusText: 'Network Error',
        data: error instanceof Error ? error.message : 'Unknown error',
        keyUsed: testKey
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('admin_failed_attempts');
    localStorage.removeItem('admin_block_end');
    window.location.reload();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">管理员调试页面</h1>
          <p className="text-gray-600 mt-2">用于诊断访问控制问题</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          返回首页
        </Button>
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            环境信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">环境</label>
              <p className="font-mono">{debugInfo.environment.nodeEnv}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">主机名</label>
              <p className="font-mono">{debugInfo.environment.hostname}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">源地址</label>
              <p className="font-mono text-xs">{debugInfo.environment.origin}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            访问密钥信息
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeys(!showKeys)}
            >
              {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <label className="text-sm font-medium text-gray-500">URL参数密钥</label>
                <p className="font-mono">
                  {showKeys ? debugInfo.keys.urlKey : '***'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {urlKey ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {urlKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(urlKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <label className="text-sm font-medium text-gray-500">环境变量密钥</label>
                <p className="font-mono">
                  {showKeys ? debugInfo.keys.envKey : '***'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {envKey ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {envKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(envKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <label className="text-sm font-medium text-gray-500">主要密钥</label>
                <p className="font-mono">
                  {showKeys ? debugInfo.keys.primaryKey : '***'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(debugInfo.keys.primaryKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LocalStorage Info */}
      <Card>
        <CardHeader>
          <CardTitle>本地存储状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">失败尝试次数</label>
              <p className="font-mono">{debugInfo.localStorage.failedAttempts}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">阻止结束时间</label>
              <p className="font-mono text-xs">{debugInfo.localStorage.blockEnd}</p>
            </div>
          </div>
          <Button variant="outline" onClick={clearLocalStorage}>
            清除本地存储
          </Button>
        </CardContent>
      </Card>

      {/* API Test */}
      <Card>
        <CardHeader>
          <CardTitle>API访问测试</CardTitle>
          <CardDescription>
            测试当前密钥是否能够访问受保护的API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testApiAccess}>
            测试API访问
          </Button>
          
          {testResults && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={testResults.ok ? "default" : "destructive"}>
                    {testResults.status}
                  </Badge>
                  <span className="text-sm">{testResults.statusText}</span>
                </div>
                {testResults.keyUsed && (
                  <div className="text-xs text-gray-600 mb-2">
                    使用的密钥: {testResults.keyUsed}
                  </div>
                )}
                <div className="text-sm font-medium mb-2">主要API响应:</div>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              </div>

              {testResults.testEndpoint && (
                <div className="p-4 bg-blue-50 rounded">
                  <div className="text-sm font-medium mb-2">测试端点响应:</div>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
                    {JSON.stringify(testResults.testEndpoint, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>快速链接</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = `/admin/data-sources?key=${primaryKey}`}
            >
              使用主要密钥访问管理面板
            </Button>
            {envKey && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = `/admin/data-sources?key=${envKey}`}
              >
                使用环境变量密钥访问管理面板
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
