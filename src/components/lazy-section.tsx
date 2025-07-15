"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface LazySectionProps {
  children: React.ReactNode
  threshold?: number
  delay?: number
  className?: string
}

export function LazySection({ 
  children, 
  threshold = 0.1, 
  delay = 0,
  className = ""
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          // 添加延迟以避免同时加载太多内容
          setTimeout(() => {
            setIsVisible(true)
            setHasLoaded(true)
          }, delay)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, delay, hasLoaded])

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      ) : (
        <div style={{ minHeight: '200px' }}> {/* 占位符防止布局跳动 */}
          <div className="animate-pulse bg-muted/20 rounded-lg h-48"></div>
        </div>
      )}
    </div>
  )
}

// 简化版的懒加载，仅用于占位
export function LazyPlaceholder({ 
  children, 
  className = "",
  minHeight = "200px"
}: { 
  children: React.ReactNode
  className?: string
  minHeight?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {isVisible ? children : (
        <div className="animate-pulse bg-muted/20 rounded-lg" style={{ height: minHeight }}></div>
      )}
    </div>
  )
}