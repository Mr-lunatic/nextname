'use client'

import { useEffect, useState } from 'react'

// Critical CSS内容（在生产环境中这会是内联的CSS）
const criticalCSS = `
/* Critical CSS 会在这里内联 */
/* 实际部署时，这些样式会直接嵌入到HTML中 */
`

export function CriticalCSS() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 检查非关键CSS是否已加载
    const checkCSSLoaded = () => {
      const stylesheets = document.styleSheets
      let nonCriticalLoaded = false

      for (let i = 0; i < stylesheets.length; i++) {
        const stylesheet = stylesheets[i]
        if (stylesheet.href && stylesheet.href.includes('globals.css')) {
          nonCriticalLoaded = true
          break
        }
      }

      if (nonCriticalLoaded) {
        setIsLoaded(true)
        // 显示非关键内容
        document.body.classList.add('css-loaded')
        
        // 移除关键CSS（避免重复）
        const criticalStyle = document.getElementById('critical-css')
        if (criticalStyle) {
          criticalStyle.remove()
        }
      } else {
        // 继续检查
        requestAnimationFrame(checkCSSLoaded)
      }
    }

    // 开始检查
    requestAnimationFrame(checkCSSLoaded)

    // 备用超时机制（2秒后强制显示）
    const timeout = setTimeout(() => {
      setIsLoaded(true)
      document.body.classList.add('css-loaded')
    }, 2000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      {/* 这在服务端渲染时会被替换为实际的内联样式 */}
      <style 
        id="critical-css"
        dangerouslySetInnerHTML={{
          __html: `
            /* 关键CSS内联在这里 */
            body:not(.css-loaded) .non-critical { display: none; }
            .css-loaded .non-critical { display: block; animation: fadeIn 0.3s ease; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `
        }}
      />
      
      {/* 预加载非关键CSS */}
      <link
        rel="preload"
        href="/_next/static/css/globals.css"
        as="style"
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* 异步加载非关键CSS */}
      <link
        rel="stylesheet"
        href="/_next/static/css/globals.css"
        media={isLoaded ? "all" : "print"}
        onLoad={() => {
          if (!isLoaded) {
            setIsLoaded(true)
            const link = document.querySelector('link[href*="globals.css"]') as HTMLLinkElement
            if (link) link.media = 'all'
          }
        }}
      />
    </>
  )
}

// 用于在构建时提取关键CSS的工具函数
export function extractCriticalCSS(html: string, css: string): string {
  // 这个函数在构建时会被调用来提取关键CSS
  // 简化实现，实际中可以使用更复杂的CSS分析工具
  
  const criticalSelectors = [
    // 首屏可见的选择器
    'body', 'html', '*', '*::before', '*::after',
    '.navigation', '.hero-section', '.search-container',
    '.loading-container', '.skeleton',
    // 字体相关
    '@font-face', ':root', '.dark',
    // 响应式断点
    '@media (max-width: 768px)',
  ]

  const criticalCSS = css
    .split('}')
    .filter(rule => {
      return criticalSelectors.some(selector => 
        rule.includes(selector) || rule.includes('@')
      )
    })
    .join('}')

  return criticalCSS
}

// 构建时工具：生成内联CSS的HTML
export function generateInlineCSSHTML(criticalCSS: string): string {
  return `<style id="critical-css">${criticalCSS}</style>`
}