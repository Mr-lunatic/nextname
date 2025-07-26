'use client'

import { useEffect, useState } from 'react'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface VitalsData {
  CLS: number | null
  FID: number | null
  FCP: number | null
  LCP: number | null
  TTFB: number | null
}

interface PerformanceMetrics extends VitalsData {
  // 额外的性能指标
  firstByte: number | null
  domContentLoaded: number | null
  loadComplete: number | null
  resourceCount: number
  // 自定义指标
  timeToInteractive: number | null
  cumulativeShift: number | null
  navigationTime: number | null
}

export function PerformanceMonitor() {
  const [vitals, setVitals] = useState<VitalsData>({
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null
  })

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    ...vitals,
    firstByte: null,
    domContentLoaded: null,
    loadComplete: null,
    resourceCount: 0,
    timeToInteractive: null,
    cumulativeShift: null,
    navigationTime: null
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 严格限制：只在开发环境或明确开启时显示
    const showMetrics = process.env.NODE_ENV === 'development' && (
      new URLSearchParams(window.location.search).has('debug') ||
      window.localStorage.getItem('show-perf-metrics') === 'true'
    )
    
    setIsVisible(showMetrics)

    if (!showMetrics) return

    // 收集Web Vitals
    getCLS((metric) => {
      setVitals(prev => ({ ...prev, CLS: metric.value }))
      sendToAnalytics('CLS', metric.value, getRating('CLS', metric.value))
    })

    getFID((metric) => {
      setVitals(prev => ({ ...prev, FID: metric.value }))
      sendToAnalytics('FID', metric.value, getRating('FID', metric.value))
    })

    getFCP((metric) => {
      setVitals(prev => ({ ...prev, FCP: metric.value }))
      sendToAnalytics('FCP', metric.value, getRating('FCP', metric.value))
    })

    getLCP((metric) => {
      setVitals(prev => ({ ...prev, LCP: metric.value }))
      sendToAnalytics('LCP', metric.value, getRating('LCP', metric.value))
    })

    getTTFB((metric) => {
      setVitals(prev => ({ ...prev, TTFB: metric.value }))
      sendToAnalytics('TTFB', metric.value, getRating('TTFB', metric.value))
    })

    // 收集其他性能指标
    collectAdditionalMetrics()

    // 监听路由变化
    const handleRouteChange = () => {
      setTimeout(() => {
        collectNavigationMetrics()
      }, 100)
    }

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时发送所有指标
        sendBatchMetrics()
      }
    }

    window.addEventListener('beforeunload', sendBatchMetrics)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', sendBatchMetrics)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const collectAdditionalMetrics = () => {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      const metrics = {
        firstByte: navigation.responseStart - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        navigationTime: navigation.loadEventEnd - navigation.fetchStart,
      }

      setMetrics(prev => ({ ...prev, ...metrics }))
    }

    // 资源计数
    const resources = performance.getEntriesByType('resource')
    setMetrics(prev => ({ ...prev, resourceCount: resources.length }))

    // 自定义TTI估算
    estimateTimeToInteractive()
  }

  const collectNavigationMetrics = () => {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const navTime = navigation.loadEventEnd - navigation.fetchStart
      setMetrics(prev => ({ ...prev, navigationTime: navTime }))
    }
  }

  const estimateTimeToInteractive = () => {
    // 简化的TTI估算
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const tti = timing.domInteractive - timing.navigationStart
      setMetrics(prev => ({ ...prev, timeToInteractive: tti }))
    }
  }

  const sendToAnalytics = (metricName: string, value: number, rating: string) => {
    // 发送到Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: metricName,
        value: Math.round(value),
        custom_parameter_1: rating,
        non_interaction: true,
      })
    }

    // 发送到自定义分析端点
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        metric: metricName,
        value: value,
        rating: rating,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      })

      navigator.sendBeacon('/api/analytics/vitals', data)
    }

    // 在控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metricName}:`, {
        value: Math.round(value),
        rating,
        threshold: getThreshold(metricName)
      })
    }
  }

  const sendBatchMetrics = () => {
    const allMetrics = { ...vitals, ...metrics }
    
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        type: 'batch_metrics',
        metrics: allMetrics,
        url: window.location.href,
        timestamp: Date.now(),
      })

      navigator.sendBeacon('/api/analytics/batch', data)
    }
  }

  const getThreshold = (metric: string) => {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    }
    return thresholds[metric] || null
  }

  const getRating = (metric: string, value: number) => {
    const threshold = getThreshold(metric)
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (rating: string) => {
    switch (rating) {
      case 'good': return '#10B981' // green
      case 'needs-improvement': return '#F59E0B' // yellow
      case 'poor': return '#EF4444' // red
      default: return '#6B7280' // gray
    }
  }

  const formatValue = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A'
    return `${Math.round(value)}${unit}`
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">⚡ Performance</h3>
        <button
          onClick={() => {
            window.localStorage.setItem('show-perf-metrics', 'false')
            setIsVisible(false)
          }}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        {/* Core Web Vitals */}
        <div className="border-b border-gray-600 pb-1 mb-2">
          <span className="text-gray-300">Core Web Vitals</span>
        </div>
        
        {Object.entries(vitals).map(([key, value]) => {
          const rating = value ? getRating(key, value) : 'unknown'
          const color = getStatusColor(rating)
          const unit = key === 'CLS' ? '' : 'ms'
          
          return (
            <div key={key} className="flex justify-between items-center">
              <span className="text-gray-300">{key}:</span>
              <span style={{ color }} className="font-bold">
                {formatValue(value, unit)}
              </span>
            </div>
          )
        })}

        {/* Additional Metrics */}
        <div className="border-b border-gray-600 pb-1 mb-2 mt-3">
          <span className="text-gray-300">Other Metrics</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-300">DOM:</span>
          <span className="text-blue-400">{formatValue(metrics.domContentLoaded)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-300">Load:</span>
          <span className="text-blue-400">{formatValue(metrics.loadComplete)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-300">Resources:</span>
          <span className="text-blue-400">{metrics.resourceCount}</span>
        </div>

        {/* Performance Grade */}
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Grade:</span>
            <span className={`font-bold ${getPerformanceGrade()}`}>
              {calculateGrade()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  function getPerformanceGrade() {
    const grade = calculateGrade()
    if (['A', 'A+'].includes(grade)) return 'text-green-400'
    if (['B', 'B+'].includes(grade)) return 'text-yellow-400'
    if (['C', 'C+'].includes(grade)) return 'text-orange-400'
    return 'text-red-400'
  }

  function calculateGrade() {
    const scores = []
    
    // 基于Core Web Vitals计算分数
    Object.entries(vitals).forEach(([key, value]) => {
      if (value !== null) {
        const rating = getRating(key, value)
        let score = 0
        if (rating === 'good') score = 100
        else if (rating === 'needs-improvement') score = 70
        else score = 40
        scores.push(score)
      }
    })

    if (scores.length === 0) return 'N/A'

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

    if (avgScore >= 95) return 'A+'
    if (avgScore >= 90) return 'A'
    if (avgScore >= 85) return 'B+'
    if (avgScore >= 80) return 'B'
    if (avgScore >= 75) return 'C+'
    if (avgScore >= 70) return 'C'
    if (avgScore >= 65) return 'D+'
    if (avgScore >= 60) return 'D'
    return 'F'
  }
}

// 性能监控钩子
export function usePerformanceMonitoring() {
  useEffect(() => {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('⚠️ Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            })
          }
        })
      })

      try {
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Longtask API not supported
      }

      return () => observer.disconnect()
    }
  }, [])
}