"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface FramerSpotlightProps {
  className?: string
  children: React.ReactNode
  spotlightColor?: string
  size?: number
}

export function FramerSpotlight({ 
  className = "", 
  children, 
  spotlightColor = "rgba(20, 128, 255, 0.15)", 
  size = 300 
}: FramerSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePosition({ x, y })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        animate={{
          background: isHovering
            ? `radial-gradient(${size}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 70%)`
            : 'transparent'
        }}
        transition={{
          background: {
            duration: 0.2,
            ease: "easeOut"
          }
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// 轻量级光晕效果 - 仅用于关键区域
export function LightSpotlight({ 
  className = "", 
  children, 
  size = 200 
}: Omit<FramerSpotlightProps, 'spotlightColor'>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePosition({ x, y })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* 简化的光晕效果 */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        animate={{
          background: isHovering
            ? `radial-gradient(${size}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(33, 150, 243, 0.08), transparent 60%)`
            : 'transparent'
        }}
        transition={{
          background: {
            duration: 0.3,
            ease: "easeOut"
          }
        }}
      />
      
      {/* 内容 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// 专门为Next Name优化的光晕效果 - 优化版
export function BestNameSpotlight({ 
  className = "", 
  children, 
  size = 400 // Reduced from 500
}: Omit<FramerSpotlightProps, 'spotlightColor'>) {
  return (
    <FramerSpotlight
      className={className}
      spotlightColor="rgba(33, 150, 243, 0.15)" // Reduced opacity
      size={size}
    >
      {children}
    </FramerSpotlight>
  )
}

// 卡片专用光晕效果 - 轻量版
export function CardSpotlight({ 
  className = "", 
  children, 
  size = 200 // Reduced from 300
}: Omit<FramerSpotlightProps, 'spotlightColor'>) {
  return (
    <LightSpotlight
      className={className}
      size={size}
    >
      {children}
    </LightSpotlight>
  )
}

// Hero区域专用大范围光晕 - 优化版
export function HeroSpotlight({ 
  className = "", 
  children, 
  size = 600 // Reduced from 800
}: Omit<FramerSpotlightProps, 'spotlightColor'>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 使用节流来减少更新频率
    let animationId: number
    const handleMouseMove = (e: MouseEvent) => {
      if (animationId) cancelAnimationFrame(animationId)
      animationId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setMousePosition({ x, y })
      })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* 简化为单层光晕 */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        animate={{
          background: isHovering
            ? `radial-gradient(${size}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(33, 150, 243, 0.15), transparent 70%)`
            : 'transparent'
        }}
        transition={{
          background: {
            duration: 0.2,
            ease: "easeOut"
          }
        }}
      />
      
      {/* 内容 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}