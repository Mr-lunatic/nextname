import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  useWebP?: boolean
  variant?: 'full' | 'compact' | 'icon'
  theme?: 'light' | 'dark' | 'auto'
  size?: 'small' | 'medium' | 'large' | 'xlarge'
}

// 基于您提供的SVG文件的Logo组件
export const BrandLogo: React.FC<LogoProps> = ({
  className = '',
  width,
  height,
  useWebP = false,
  variant = 'full',
  theme = 'auto',
  size = 'medium'
}) => {
  // 根据size确定尺寸
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { width: 140, height: 36, file: '140X36.svg' }
      case 'medium':
        return { width: 180, height: 46, file: '180X46.svg' }
      case 'large':
        return { width: 220, height: 56, file: '220x56.svg' }
      case 'xlarge':
        return { width: 280, height: 72, file: '280X72.svg' }
      default:
        return { width: 180, height: 46, file: '180X46.svg' }
    }
  }

  const sizeConfig = getSizeConfig()
  const finalWidth = width || sizeConfig.width
  const finalHeight = height || sizeConfig.height

  // Fallback SVG logo if image fails to load
  const FallbackLogo = () => (
    <svg
      width={finalWidth}
      height={finalHeight}
      viewBox="0 0 180 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="23" cy="23" r="20" fill="url(#logoGradient)" opacity="0.1" />
      <path
        d="M15 33V13L23 27V13M23 27L31 13V33"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="50"
        y="30"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="currentColor"
      >
        NextName
      </text>
    </svg>
  )

  // 如果是icon变体，只显示图形部分
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <svg
          width={finalHeight}
          height={finalHeight}
          viewBox="0 0 46 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <circle cx="23" cy="23" r="20" fill="url(#iconGradient)" opacity="0.1" />
          <path
            d="M15 33V13L23 27V13M23 27L31 13V33"
            stroke="url(#iconGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    )
  }

  // 完整版本 - 使用图片
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Image
        src={`/logo/${sizeConfig.file}`}
        alt="NextName"
        width={finalWidth}
        height={finalHeight}
        className="object-contain"
        priority
      />
    </div>
  )
}

// 响应式Logo组件 - 自动适配不同屏幕尺寸
export const ResponsiveBrandLogo: React.FC<{
  className?: string;
  useWebP?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}> = ({ className = '', useWebP = false, theme = 'auto' }) => {
  return (
    <div className={className}>
      {/* 桌面端大logo */}
      <div className="hidden lg:block">
        <BrandLogo 
          size="large"
          variant="full" 
          theme={theme}
          useWebP={useWebP} 
        />
      </div>
      {/* 平板端中logo */}
      <div className="hidden md:block lg:hidden">
        <BrandLogo 
          size="medium"
          variant="full" 
          theme={theme}
          useWebP={useWebP} 
        />
      </div>
      {/* 移动端小logo - 仅显示图标 */}
      <div className="block md:hidden">
        <BrandLogo 
          size="small"
          variant="icon" 
          theme={theme}
          useWebP={useWebP} 
        />
      </div>
    </div>
  )
}

// 保持原有的NextNameLogo作为向后兼容
export const NextNameLogo: React.FC<LogoProps> = ({ 
  className = '', 
  width,
  height,
  useWebP = false,
  variant = 'full',
  theme = 'auto',
  size = 'medium'
}) => {
  return <BrandLogo 
    className={className}
    width={width}
    height={height}
    useWebP={useWebP}
    variant={variant}
    theme={theme}
    size={size}
  />
}

// 保持原有的响应式组件作为向后兼容
export const ResponsiveNextNameLogo: React.FC<{
  className?: string;
  useWebP?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}> = ({ className = '', useWebP = false, theme = 'auto' }) => {
  return <ResponsiveBrandLogo 
    className={className}
    useWebP={useWebP}
    theme={theme}
  />
}

// NextNameIcon组件 - 仅图标版本
export const NextNameIcon: React.FC<{ 
  size?: number; 
  className?: string;
  useWebP?: boolean 
}> = ({ 
  size = 32, 
  className = '',
  useWebP = false 
}) => {
  return (
    <BrandLogo
      width={size}
      height={size}
      variant="icon"
      className={className}
      useWebP={useWebP}
    />
  )
}
