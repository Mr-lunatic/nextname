import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  useWebP?: boolean
}

export const NextNameLogo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 140, 
  height = 36,
  useWebP = false 
}) => {
  // If WebP version exists and is requested, use Image component
  if (useWebP) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Image
          src="/logo/nextname-logo.webp"
          alt="NextName"
          width={width}
          height={height}
          priority
          className="object-contain"
        />
      </div>
    )
  }

  // Default SVG version
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon part - stylized N with arrow */}
      <g>
        {/* Background circle gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        
        {/* Circle background */}
        <circle cx="18" cy="18" r="16" fill="url(#logoGradient)" opacity="0.1" />
        
        {/* Letter N with modern design */}
        <path
          d="M10 26V10L18 22V10M18 22L26 10V26"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Arrow indicating "next" */}
        <path
          d="M22 18L26 18M26 18L24 16M26 18L24 20"
          stroke="url(#arrowGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      
      {/* Text part */}
      <g>
        {/* NextName text */}
        <text
          x="40"
          y="24"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="600"
          fill="currentColor"
        >
          Next
          <tspan fill="url(#logoGradient)">Name</tspan>
        </text>
      </g>
    </svg>
  )
}

export const NextNameIcon: React.FC<{ 
  size?: number; 
  className?: string;
  useWebP?: boolean 
}> = ({ 
  size = 32, 
  className = '',
  useWebP = false 
}) => {
  if (useWebP) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <Image
          src="/logo/nextname-icon.webp"
          alt="NextName Icon"
          width={size}
          height={size}
          priority
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="iconArrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      
      {/* Circle background */}
      <circle cx="18" cy="18" r="16" fill="url(#iconGradient)" opacity="0.1" />
      
      {/* Letter N */}
      <path
        d="M10 26V10L18 22V10M18 22L26 10V26"
        stroke="url(#iconGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Arrow */}
      <path
        d="M22 18L26 18M26 18L24 16M26 18L24 20"
        stroke="url(#iconArrowGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}