import React from 'react'

// 注册商Logo组件
interface RegistrarLogoProps {
  registrar: string
  size?: number
  className?: string
}

// 注册商Logo映射
const registrarLogos: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Cloudflare': CloudflareLogo,
  'GoDaddy': GoDaddyLogo,
  'Namecheap': NamecheapLogo,
  'Google Domains': GoogleDomainsLogo,
  'Porkbun': PorkbunLogo,
  'Name.com': NameComLogo,
  'Dynadot': DynadotLogo,
  'Hover': HoverLogo,
  'Domain.com': DomainComLogo,
  'Gandi': GandiLogo,
  'Tucows': TucowsLogo,
  'Enom': EnomLogo,
  'Network Solutions': NetworkSolutionsLogo,
  '1&1 IONOS': IonosLogo,
  'Bluehost': BluehostLogo,
  'HostGator': HostGatorLogo,
  'Squarespace': SquarespaceLogo,
  'Wix': WixLogo,
  'Shopify': ShopifyLogo,
  'Alibaba Cloud': AlibabaCloudLogo,
  'Tencent Cloud': TencentCloudLogo,
  'Baidu Cloud': BaiduCloudLogo,
  'HiChina': HiChinaLogo,
  'West.cn': WestCnLogo,
  'DNSPod': DNSPodLogo,
  'Xinnet': XinnetLogo,
  'ENAME': EnameLogo,
  '22.cn': TwentyTwoLogo,
  'Bizcn': BizcnLogo,
}

// Cloudflare Logo
function CloudflareLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#F38020"/>
      <path d="M22.5 14.5c-.3-2.8-2.6-5-5.5-5-2.4 0-4.4 1.5-5.2 3.6-.4-.1-.8-.1-1.3-.1-2.8 0-5 2.2-5 5s2.2 5 5 5h11c2.2 0 4-1.8 4-4 0-2-.1-3.5-2.5-4.5z" fill="white"/>
    </svg>
  )
}

// GoDaddy Logo
function GoDaddyLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#1BDBDB"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Go</text>
    </svg>
  )
}

// Namecheap Logo
function NamecheapLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#DE3910"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">NC</text>
    </svg>
  )
}

// Google Domains Logo
function GoogleDomainsLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#4285F4"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">G</text>
    </svg>
  )
}

// Porkbun Logo
function PorkbunLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#FF6B9D"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">P</text>
    </svg>
  )
}

// Name.com Logo
function NameComLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#0066CC"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">N.C</text>
    </svg>
  )
}

// Dynadot Logo
function DynadotLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#FF4500"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">D</text>
    </svg>
  )
}

// Hover Logo
function HoverLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#64B5F6"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">H</text>
    </svg>
  )
}

// Domain.com Logo
function DomainComLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#2E7D32"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">DC</text>
    </svg>
  )
}

// Gandi Logo
function GandiLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#96C93F"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">G</text>
    </svg>
  )
}

// Tucows Logo
function TucowsLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#8B4513"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">T</text>
    </svg>
  )
}

// Enom Logo
function EnomLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#0066CC"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">E</text>
    </svg>
  )
}

// Network Solutions Logo
function NetworkSolutionsLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#003366"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">NS</text>
    </svg>
  )
}

// 1&1 IONOS Logo
function IonosLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#003D82"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">I</text>
    </svg>
  )
}

// Bluehost Logo
function BluehostLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#3F51B5"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">B</text>
    </svg>
  )
}

// HostGator Logo
function HostGatorLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#FF6600"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">HG</text>
    </svg>
  )
}

// Squarespace Logo
function SquarespaceLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#000000"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">SQ</text>
    </svg>
  )
}

// Wix Logo
function WixLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#0C6EBD"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">W</text>
    </svg>
  )
}

// Shopify Logo
function ShopifyLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#96BF48"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">S</text>
    </svg>
  )
}

// Alibaba Cloud Logo
function AlibabaCloudLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#FF6A00"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">阿里</text>
    </svg>
  )
}

// Tencent Cloud Logo
function TencentCloudLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#006EFF"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">腾讯</text>
    </svg>
  )
}

// Baidu Cloud Logo
function BaiduCloudLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#2932E1"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">百度</text>
    </svg>
  )
}

// HiChina Logo
function HiChinaLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#E53E3E"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">万网</text>
    </svg>
  )
}

// West.cn Logo
function WestCnLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#1A365D"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">西部</text>
    </svg>
  )
}

// DNSPod Logo
function DNSPodLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#00A971"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">DNS</text>
    </svg>
  )
}

// Xinnet Logo
function XinnetLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#FF4500"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">新网</text>
    </svg>
  )
}

// ENAME Logo
function EnameLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#2B6CB0"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">E</text>
    </svg>
  )
}

// 22.cn Logo
function TwentyTwoLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#9F7AEA"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">22</text>
    </svg>
  )
}

// Bizcn Logo
function BizcnLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill="#38A169"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">商务</text>
    </svg>
  )
}

// 通用Logo生成器（用于没有特定Logo的注册商）
function GenericLogo({ registrar, size = 32, className = '' }: { registrar: string; size?: number; className?: string }) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  const colorIndex = registrar.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const color = colors[colorIndex]
  
  const initials = registrar
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
  
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="6" fill={color}/>
      <text 
        x="16" 
        y="20" 
        textAnchor="middle" 
        fill="white" 
        fontSize={initials.length === 1 ? "14" : "10"} 
        fontWeight="bold"
      >
        {initials}
      </text>
    </svg>
  )
}

// 主要导出组件
export function RegistrarLogo({ registrar, size = 32, className = '' }: RegistrarLogoProps) {
  const LogoComponent = registrarLogos[registrar]
  
  if (LogoComponent) {
    return <LogoComponent size={size} className={className} />
  }
  
  return <GenericLogo registrar={registrar} size={size} className={className} />
}

// 导出所有支持的注册商列表
export const supportedRegistrars = Object.keys(registrarLogos)
