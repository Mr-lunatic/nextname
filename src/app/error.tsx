'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { NextNameLogo } from '@/components/logo'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <NextNameLogo className="text-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Error Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              出现了一些问题
            </h1>
            <p className="text-muted-foreground">
              抱歉，页面遇到了意外错误。请尝试刷新页面或返回首页。
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-muted rounded-lg text-left">
                <summary className="cursor-pointer font-medium text-sm">
                  错误详情 (开发模式)
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                  {error.message}
                  {error.stack && (
                    <>
                      {'\n\n'}
                      {error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href="/">
                <Home className="w-4 h-4" />
                返回首页
              </Link>
            </Button>
          </div>

          {/* Error ID */}
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              错误ID: {error.digest}
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 NextName. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
