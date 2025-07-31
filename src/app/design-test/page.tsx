"use client";

export const runtime = 'edge';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeDebug } from '@/components/theme-debug';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { ToastProvider, useToastActions } from '@/components/ui/toast';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Search, Download, Heart, Mail, Lock, User } from 'lucide-react';

function DesignTestContent() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToastActions();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('操作完成', '加载测试已成功完成');
    }, 2000);
  };
  return (
    <div className="min-h-screen debug-theme-vars" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header with Theme Toggle */}
      <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-h1">设计系统测试</h1>
            {mounted && (
              <div className="text-small mt-2">
                当前主题: {theme} | 解析主题: {resolvedTheme}
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Theme Debug */}
          <ThemeDebug />

          {/* Typography Test */}
          <Card className="surface">
            <CardHeader>
              <CardTitle className="text-h2">字体系统测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h1 className="text-h1">H1 - 页面主标题 (32px, Bold)</h1>
              <h2 className="text-h2">H2 - 区块标题 (24px, SemiBold)</h2>
              <h3 className="text-h3">H3 - 卡片标题 (20px, SemiBold)</h3>
              <p className="text-body">正文段落 - 这是一段正文内容，展示了Inter和思源黑体的混合效果。This is body text showing Inter and Noto Sans SC combination. (16px, Regular)</p>
              <div className="text-label">标签文字 - Label text (14px, Medium)</div>
              <div className="text-small">辅助文字 - Small text for annotations (14px, Regular)</div>
            </CardContent>
          </Card>

          {/* Color System Test */}
          <Card className="surface">
            <CardHeader>
              <CardTitle className="text-h2">色彩系统测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Text Colors */}
              <div>
                <h4 className="text-h3 mb-3">文本颜色</h4>
                <div className="space-y-2">
                  <div className="text-primary">主要文本 - Primary Text (#292524)</div>
                  <div className="text-secondary">次要文本 - Secondary Text (#78716C)</div>
                  <div className="text-disabled">禁用文本 - Disabled Text (#D6D3D1)</div>
                  <div className="text-accent">强调文本 - Accent Text (#059669)</div>
                </div>
              </div>

              {/* Action Colors */}
              <div>
                <h4 className="text-h3 mb-3">行为色彩</h4>
                <div className="flex flex-wrap gap-4">
                  <Button className="button-primary">主要按钮</Button>
                  <Button variant="outline">次要按钮</Button>
                  <Button variant="ghost">幽灵按钮</Button>
                </div>
              </div>

              {/* Enhanced Buttons */}
              <div>
                <h4 className="text-h3 mb-3">增强按钮组件</h4>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <EnhancedButton variant="primary" icon={<Search className="h-4 w-4" />}>
                      搜索域名
                    </EnhancedButton>
                    <EnhancedButton variant="secondary" icon={<Download className="h-4 w-4" />} iconPosition="right">
                      下载报告
                    </EnhancedButton>
                    <EnhancedButton variant="ghost" icon={<Heart className="h-4 w-4" />}>
                      收藏
                    </EnhancedButton>
                    <EnhancedButton variant="danger" size="sm">
                      删除
                    </EnhancedButton>
                  </div>

                  <div className="flex gap-4">
                    <EnhancedButton
                      variant="primary"
                      loading={loading}
                      onClick={handleLoadingTest}
                    >
                      {loading ? '加载中...' : '测试加载'}
                    </EnhancedButton>
                    <EnhancedButton variant="primary" disabled>
                      禁用状态
                    </EnhancedButton>
                  </div>
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h4 className="text-h3 mb-3">语义色彩</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="status-success font-medium">成功状态</div>
                    <div className="text-small">操作成功完成</div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="status-warning font-medium">警告状态</div>
                    <div className="text-small">需要注意</div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="status-error font-medium">错误状态</div>
                    <div className="text-small">操作失败</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="status-info font-medium">信息状态</div>
                    <div className="text-small">一般信息</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Test */}
          <Card className="surface">
            <CardHeader>
              <CardTitle className="text-h2">组件测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Form Elements */}
              <div>
                <h4 className="text-h3 mb-3">表单元素</h4>
                <div className="space-y-6 max-w-md">
                  {/* 基础输入框 */}
                  <div className="space-y-4">
                    <h5 className="text-label font-ds-medium">基础输入框</h5>
                    <div>
                      <label className="text-label block mb-2">输入框标签</label>
                      <Input
                        className="input-field"
                        placeholder="请输入内容..."
                      />
                    </div>
                    <div>
                      <label className="text-label block mb-2">聚焦状态</label>
                      <Input
                        className="input-field"
                        placeholder="点击查看聚焦效果"
                      />
                    </div>
                  </div>

                  {/* 增强输入框 */}
                  <div className="space-y-4">
                    <h5 className="text-label font-ds-medium">增强输入框</h5>
                    <EnhancedInput
                      label="用户名"
                      placeholder="请输入用户名"
                      leftIcon={<User className="h-4 w-4" />}
                      hint="用户名长度应为3-20个字符"
                    />
                    <EnhancedInput
                      label="邮箱地址"
                      type="email"
                      placeholder="your@email.com"
                      leftIcon={<Mail className="h-4 w-4" />}
                      validation="success"
                      success="邮箱格式正确"
                    />
                    <EnhancedInput
                      label="密码"
                      type="password"
                      placeholder="请输入密码"
                      leftIcon={<Lock className="h-4 w-4" />}
                      showPasswordToggle
                      error="密码长度至少8位"
                    />
                    <EnhancedInput
                      label="搜索"
                      placeholder="搜索域名..."
                      leftIcon={<Search className="h-4 w-4" />}
                      rightIcon={<EnhancedButton size="sm" variant="primary">搜索</EnhancedButton>}
                    />
                  </div>
                </div>
              </div>

              {/* Toast 通知测试 */}
              <div>
                <h4 className="text-h3 mb-3">Toast 通知系统</h4>
                <div className="flex flex-wrap gap-4">
                  <EnhancedButton
                    variant="primary"
                    size="sm"
                    onClick={() => toast.success('操作成功', '您的域名搜索已完成')}
                  >
                    成功通知
                  </EnhancedButton>
                  <EnhancedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.error('操作失败', '网络连接超时，请重试')}
                  >
                    错误通知
                  </EnhancedButton>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.warning('注意', '该域名即将到期')}
                  >
                    警告通知
                  </EnhancedButton>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info('提示', '发现了3个相似的域名')}
                  >
                    信息通知
                  </EnhancedButton>
                </div>
              </div>

              {/* Cards */}
              <div>
                <h4 className="text-h3 mb-3">卡片组件</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="surface">
                    <CardContent className="p-4">
                      <h5 className="text-h3 mb-2">卡片标题</h5>
                      <p className="text-body">这是一个标准的卡片组件，展示了表面色彩和边框效果。</p>
                    </CardContent>
                  </Card>
                  <Card className="surface">
                    <CardContent className="p-4">
                      <h5 className="text-h3 mb-2">另一个卡片</h5>
                      <p className="text-body">卡片之间保持一致的视觉风格和间距。</p>
                    </CardContent>
                  </Card>
                  <Card className="surface">
                    <CardContent className="p-4">
                      <h5 className="text-h3 mb-2">第三个卡片</h5>
                      <p className="text-body">所有卡片都使用相同的设计系统规范。</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Guide */}
          <Card className="surface">
            <CardHeader>
              <CardTitle className="text-h2">使用指南</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-body space-y-4">
                <p>这个设计系统提供了一套完整的颜色和字体规范：</p>
                <ul className="list-disc list-inside space-y-2 text-secondary">
                  <li>使用 CSS 变量定义的颜色系统，支持深色模式</li>
                  <li>Inter + 思源黑体的字体组合，确保中英文显示效果</li>
                  <li>清晰的字体层级和语义化的颜色角色</li>
                  <li>一致的间距、圆角和阴影系统</li>
                </ul>
                <p className="text-small">
                  所有组件都应该遵循这套设计规范，以确保界面的一致性和专业性。
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

export default function DesignTestPage() {
  return (
    <ToastProvider>
      <DesignTestContent />
    </ToastProvider>
  );
}
