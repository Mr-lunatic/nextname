'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCcw, Home, Bug, Mail } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 生成错误ID用于追踪
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'
    
    // 记录错误详情
    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      retryCount: this.retryCount
    }

    // 发送错误到监控服务
    this.reportError(errorDetails)

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 在控制台记录详细错误
    console.group(`🚨 Error Boundary Caught Error [${errorId}]`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()

    // 更新状态
    this.setState({
      error,
      errorInfo,
      errorId
    })
  }

  private async reportError(errorDetails: any) {
    try {
      // 发送到错误监控服务
      if (typeof window !== 'undefined' && navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          '/api/error-reporting',
          JSON.stringify(errorDetails)
        )
        
        if (!success) {
          // 如果 sendBeacon 失败，使用 fetch 作为备选
          fetch('/api/error-reporting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorDetails)
          }).catch(() => {
            // 静默处理错误报告失败
          })
        }
      }

      // 发送到第三方错误监控服务（如 Sentry）
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(this.state.error, {
          tags: {
            errorBoundary: true,
            errorId: errorDetails.errorId
          },
          extra: errorDetails
        })
      }

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      
      console.log(`🔄 Retrying... (${this.retryCount}/${this.maxRetries})`)
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      })
    } else {
      console.warn('⚠️ Maximum retry attempts reached')
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString()
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
        .then(() => {
          alert('错误详情已复制到剪贴板')
        })
        .catch(() => {
          // 备选方案
          const textArea = document.createElement('textarea')
          textArea.value = JSON.stringify(errorDetails, null, 2)
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          alert('错误详情已复制到剪贴板')
        })
    }
  }

  private getErrorType(): 'client' | 'server' | 'network' | 'unknown' {
    const error = this.state.error
    if (!error) return 'unknown'

    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('network') || message.includes('fetch')) {
      return 'network'
    }
    
    if (message.includes('hydration') || stack.includes('hydrate')) {
      return 'server'
    }

    return 'client'
  }

  private getErrorSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const error = this.state.error
    if (!error) return 'medium'

    const message = error.message.toLowerCase()
    
    // 关键错误
    if (message.includes('security') || message.includes('auth')) {
      return 'critical'
    }
    
    // 高级错误
    if (message.includes('network') || message.includes('server')) {
      return 'high'
    }
    
    // 中级错误
    if (message.includes('render') || message.includes('component')) {
      return 'medium'
    }
    
    return 'low'
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.getErrorType()
      const severity = this.getErrorSeverity()
      const canRetry = this.retryCount < this.maxRetries

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6 mr-2" />
                应用程序遇到错误
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 错误摘要 */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                  错误摘要
                </h3>
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {this.state.error?.message || '未知错误'}
                </p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    severity === 'critical' ? 'bg-red-200 text-red-800' :
                    severity === 'high' ? 'bg-orange-200 text-orange-800' :
                    severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {severity.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded">
                    {errorType.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded">
                    ID: {this.state.errorId}
                  </span>
                </div>
              </div>

              {/* 用户友好的解释 */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  很抱歉，应用程序遇到了意外错误。我们已经自动记录了此问题，将尽快修复。
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3 justify-center">
                {canRetry && (
                  <Button onClick={this.handleRetry} variant="default">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    重试 ({this.maxRetries - this.retryCount} 次剩余)
                  </Button>
                )}
                
                <Button onClick={this.handleReload} variant="outline">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  刷新页面
                </Button>
                
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </div>

              {/* 错误详情（可折叠） */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                  查看技术详情
                </summary>
                <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="space-y-3 text-xs">
                    <div>
                      <strong>错误消息:</strong>
                      <pre className="mt-1 text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {this.state.error?.message}
                      </pre>
                    </div>
                    
                    <div>
                      <strong>错误堆栈:</strong>
                      <pre className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" onClick={this.copyErrorDetails}>
                        <Bug className="w-3 h-3 mr-1" />
                        复制错误详情
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const subject = `错误报告 - ${this.state.errorId}`
                          const body = `错误ID: ${this.state.errorId}\n错误消息: ${this.state.error?.message}\n\n请描述您遇到此错误时的操作步骤...`
                          window.location.href = `mailto:support@nextname.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                        }}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        发送错误报告
                      </Button>
                    </div>
                  </div>
                </div>
              </details>

              {/* 开发环境额外信息 */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
                    开发者信息
                  </summary>
                  <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <pre className="text-xs text-blue-800 dark:text-blue-300 whitespace-pre-wrap overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// 便捷的包装组件
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}