"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  children?: React.ReactNode
}

export function LoadingSkeleton({ className, children }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton rounded-lg",
        className
      )}
    >
      {children}
    </div>
  )
}

interface SearchResultsSkeletonProps {
  count?: number
}

export function SearchResultsSkeleton({ count = 5 }: SearchResultsSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card-enhanced p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <LoadingSkeleton className="h-6 w-48" />
              <LoadingSkeleton className="h-4 w-32" />
            </div>
            <div className="flex space-x-2">
              <LoadingSkeleton className="h-8 w-20 rounded-full" />
              <LoadingSkeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-16" />
              <LoadingSkeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-16" />
              <LoadingSkeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-16" />
              <LoadingSkeleton className="h-6 w-20" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface PriceComparisonSkeletonProps {
  count?: number
}

export function PriceComparisonSkeleton({ count = 8 }: PriceComparisonSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="card-enhanced p-4 space-y-3"
        >
          <div className="flex items-center space-x-3">
            <LoadingSkeleton className="h-8 w-8 rounded-lg" />
            <LoadingSkeleton className="h-5 w-24" />
          </div>
          
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-16" />
            <LoadingSkeleton className="h-6 w-20" />
          </div>
          
          <LoadingSkeleton className="h-9 w-full rounded-xl" />
        </motion.div>
      ))}
    </div>
  )
}

interface WhoisSkeletonProps {}

export function WhoisSkeleton({}: WhoisSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-enhanced p-6 space-y-6"
    >
      <div className="flex items-center space-x-3">
        <LoadingSkeleton className="h-8 w-8 rounded-lg" />
        <LoadingSkeleton className="h-6 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
      
      <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-4">
        <div className="space-y-3">
          <LoadingSkeleton className="h-4 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-4 w-full max-w-md" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface FeatureCardSkeletonProps {}

export function FeatureCardSkeleton({}: FeatureCardSkeletonProps) {
  return (
    <div className="card-enhanced p-6 space-y-4">
      <div className="flex flex-col items-center text-center space-y-4">
        <LoadingSkeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 w-full">
          <LoadingSkeleton className="h-6 w-32 mx-auto" />
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  )
}

// Pulse animation for loading states
export function PulseLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }
  
  return (
    <div className={cn("animate-pulse rounded-full bg-primary/20", sizeClasses[size])}>
      <div className={cn("rounded-full bg-primary animate-ping", sizeClasses[size])} />
    </div>
  )
}

// Spinner loader for active states
export function SpinnerLoader({ size = "md", className }: { size?: "sm" | "md" | "lg", className?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3"
  }
  
  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  )
}