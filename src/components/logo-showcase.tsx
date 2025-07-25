import React from 'react'
import { BrandLogo, ResponsiveBrandLogo, NextNameLogo } from './logo'

/**
 * Logo展示组件 - 用于测试和展示不同的Logo变体
 */
export const LogoShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Logo展示
      </h2>
      
      {/* 不同尺寸的完整Logo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          不同尺寸的完整Logo
        </h3>
        <div className="flex flex-wrap items-end gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <BrandLogo size="small" />
            <p className="mt-2 text-sm text-gray-600">小尺寸 (140x36)</p>
          </div>
          <div className="text-center">
            <BrandLogo size="medium" />
            <p className="mt-2 text-sm text-gray-600">中尺寸 (180x46)</p>
          </div>
          <div className="text-center">
            <BrandLogo size="large" />
            <p className="mt-2 text-sm text-gray-600">大尺寸 (220x56)</p>
          </div>
          <div className="text-center">
            <BrandLogo size="xlarge" />
            <p className="mt-2 text-sm text-gray-600">超大尺寸 (280x72)</p>
          </div>
        </div>
      </div>

      {/* 图标变体 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          图标变体（仅图形部分）
        </h3>
        <div className="flex flex-wrap items-end gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <BrandLogo size="small" variant="icon" />
            <p className="mt-2 text-sm text-gray-600">小图标</p>
          </div>
          <div className="text-center">
            <BrandLogo size="medium" variant="icon" />
            <p className="mt-2 text-sm text-gray-600">中图标</p>
          </div>
          <div className="text-center">
            <BrandLogo size="large" variant="icon" />
            <p className="mt-2 text-sm text-gray-600">大图标</p>
          </div>
        </div>
      </div>

      {/* 响应式Logo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          响应式Logo（自动适配屏幕尺寸）
        </h3>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <ResponsiveBrandLogo />
          <p className="mt-2 text-sm text-gray-600">
            桌面端显示大Logo，平板端显示中Logo，移动端显示图标
          </p>
        </div>
      </div>

      {/* 深色背景测试 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          深色背景测试
        </h3>
        <div className="flex flex-wrap items-end gap-6 p-4 bg-gray-900 rounded-lg">
          <div className="text-center">
            <BrandLogo size="medium" theme="dark" />
            <p className="mt-2 text-sm text-gray-300">深色主题</p>
          </div>
          <div className="text-center">
            <BrandLogo size="medium" variant="icon" theme="dark" />
            <p className="mt-2 text-sm text-gray-300">深色图标</p>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          使用说明
        </h3>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>基础使用：</strong></p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {`<BrandLogo size="medium" />`}
            </code>
            
            <p><strong>响应式Logo：</strong></p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {`<ResponsiveBrandLogo />`}
            </code>
            
            <p><strong>仅图标：</strong></p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {`<BrandLogo variant="icon" size="medium" />`}
            </code>
            
            <p><strong>自定义尺寸：</strong></p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {`<BrandLogo width={200} height={50} />`}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogoShowcase
