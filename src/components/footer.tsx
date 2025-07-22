"use client";

import { useTranslations } from '@/hooks/useTranslations'
import { NextNameLogo } from '@/components/logo'

export function Footer() {
  const { t } = useTranslations()

  return (
    <footer className="py-12 mt-16" style={{ backgroundColor: 'var(--color-surface-secondary)', borderTop: '1px solid var(--color-border-default)' }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 品牌信息 */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <NextNameLogo className="text-foreground" />
              <p className="text-small mt-2" style={{ color: 'var(--color-text-secondary)' }}>Find Your Perfect Domain</p>
            </div>
            <p className="text-small leading-relaxed max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
              {t('footer.brandDescription')}
            </p>
          </div>
          
          {/* 产品功能 */}
          <div>
            <h4 className="text-h3 mb-4" style={{ color: 'var(--color-text-primary)' }}>产品功能</h4>
            <ul className="space-y-2 text-small" style={{ color: 'var(--color-text-secondary)' }}>
              <li>域名可用性查询</li>
              <li>价格对比分析</li>
              <li>WHOIS信息查询</li>
              <li>智能域名推荐</li>
            </ul>
          </div>
          
          {/* 帮助支持 */}
          <div>
            <h4 className="font-semibold mb-4">帮助支持</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/privacy" className="hover:text-primary transition-colors">隐私政策</a></li>
              <li><a href="/terms" className="hover:text-primary transition-colors">服务条款</a></li>
              <li><a href="/about" className="hover:text-primary transition-colors">关于我们</a></li>
              <li><a href="mailto:support@nextname.app" className="hover:text-primary transition-colors">联系我们</a></li>
            </ul>
          </div>
        </div>
        
        {/* 底部版权 */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2025 Next Name. 快&ldquo;全&rdquo;准的域名查询工具 - 为您提供最佳的域名搜索体验
            </p>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-primary transition-colors">隐私政策</a>
              <a href="/terms" className="hover:text-primary transition-colors">服务条款</a>
              <a href="mailto:support@nextname.app" className="hover:text-primary transition-colors">support@nextname.app</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
