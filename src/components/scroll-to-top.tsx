'use client'

import React, { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ScrollToTopProps {
  threshold?: number
  className?: string
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  threshold = 400,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [threshold])

  const scrollToTop = () => {
    setIsScrolling(true)
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    
    // 重置滚动状态
    setTimeout(() => {
      setIsScrolling(false)
    }, 1000)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          disabled={isScrolling}
          className={`
            fixed bottom-6 right-6 z-50
            w-12 h-12 rounded-full
            bg-gradient-to-br from-primary/90 to-purple-500/90
            backdrop-blur-sm
            border border-white/20
            shadow-lg shadow-primary/25
            flex items-center justify-center
            text-white
            transition-all duration-300
            hover:shadow-xl hover:shadow-primary/40
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            group
            ${className}
          `}
          style={{
            background: isScrolling 
              ? 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)'
              : undefined
          }}
          aria-label="回到顶部"
          title="回到顶部"
        >
          <motion.div
            animate={isScrolling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <ChevronUp 
              className={`
                w-6 h-6 
                transition-transform duration-200
                group-hover:-translate-y-0.5
                ${isScrolling ? 'animate-pulse' : ''}
              `} 
            />
          </motion.div>
          
          {/* 背景光效 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// 简化版本 - 无动画
export const SimpleScrollToTop: React.FC<ScrollToTopProps> = ({ 
  threshold = 400,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > threshold)
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 rounded-full
        bg-primary/90 backdrop-blur-sm
        border border-white/20
        shadow-lg
        flex items-center justify-center
        text-white
        transition-all duration-300
        hover:bg-primary hover:scale-110
        active:scale-95
        ${className}
      `}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  )
}

// 带进度指示器的版本
export const ProgressScrollToTop: React.FC<ScrollToTopProps> = ({ 
  threshold = 400,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      
      setScrollProgress(progress)
      setIsVisible(scrollTop > threshold)
    }

    window.addEventListener('scroll', updateScrollProgress)
    return () => window.removeEventListener('scroll', updateScrollProgress)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-gradient-to-br from-primary/90 to-purple-500/90
        backdrop-blur-sm
        border-2 border-white/20
        shadow-lg shadow-primary/25
        flex items-center justify-center
        text-white
        transition-all duration-300
        hover:shadow-xl hover:shadow-primary/40
        group
        ${className}
      `}
      aria-label="回到顶部"
      title={`回到顶部 (${Math.round(scrollProgress)}%)`}
    >
      {/* 进度环 */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r="26"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
        />
        <circle
          cx="28"
          cy="28"
          r="26"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 26}`}
          strokeDashoffset={`${2 * Math.PI * 26 * (1 - scrollProgress / 100)}`}
          className="transition-all duration-300"
        />
      </svg>
      
      <ChevronUp 
        className="w-6 h-6 transition-transform duration-200 group-hover:-translate-y-0.5" 
      />
    </motion.button>
  )
}

export default ScrollToTop
