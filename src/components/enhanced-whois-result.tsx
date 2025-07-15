"use client"

import { useState } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Globe, 
  Shield, 
  Clock, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Server,
  Mail,
  Phone,
  Building,
  Info,
  User,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WhoisInfo {
  domainName: string
  registryDomainId?: string
  registrarWhoisServer?: string
  registrarUrl?: string
  updatedDate?: string
  creationDate?: string
  registryExpiryDate?: string
  registrar?: string
  registrarIanaId?: string
  registrarAbuseContactEmail?: string
  registrarAbuseContactPhone?: string
  domainStatus?: string[]
  nameServers?: string[]
  dnssec?: string
  registrant?: {
    name?: string
    organization?: string
    email?: string
    phone?: string
    country?: string
    state?: string
    city?: string
  }
  admin?: {
    name?: string
    organization?: string
    email?: string
    phone?: string
  }
  tech?: {
    name?: string
    organization?: string
    email?: string
    phone?: string
  }
  lastUpdateOfWhoisDatabase?: string
}

interface EnhancedWhoisResultProps {
  domain: string
  whoisInfo: WhoisInfo
  isAvailable?: boolean
}

export function EnhancedWhoisResult({ domain, whoisInfo, isAvailable = false }: EnhancedWhoisResultProps) {
  const t = useTranslations()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      // Handle different date formats from RDAP
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString
      }
      
      // Format to UTC to avoid timezone issues
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      }) + ' (UTC)'
    } catch {
      return dateString
    }
  }

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null
    try {
      const expiry = new Date(expiryDate)
      const now = new Date()
      const diffTime = expiry.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return null
    }
  }

  const daysUntilExpiry = getDaysUntilExpiry(whoisInfo.registryExpiryDate)

  const InfoRow = ({ icon: Icon, label, value, copyable = false }: { 
    icon: any; 
    label: string; 
    value?: string; 
    copyable?: boolean 
  }) => {
    if (!value || value === 'N/A') return null
    
    return (
      <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-b-0 gap-2">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{label}</div>
            <div className="text-sm text-muted-foreground font-mono break-all">{value}</div>
          </div>
        </div>
        {copyable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(value, label)}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            {copiedField === label ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    )
  }

  if (isAvailable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-mono">{domain}</CardTitle>
              <Badge variant="default" className="text-lg px-4 py-2 bg-green-500">
                <CheckCircle className="w-4 h-4 mr-2" />
                可注册
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg text-green-600">🎉 恭喜！此域名可以注册。</p>
              <Button size="lg" className="w-full">
                查看注册商价格对比
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Domain Header */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-mono">{domain}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="text-lg px-4 py-2">
                <XCircle className="w-4 h-4 mr-2" />
                已注册
              </Badge>
              {daysUntilExpiry && (
                <Badge variant={daysUntilExpiry < 30 ? "destructive" : daysUntilExpiry < 90 ? "secondary" : "outline"}>
                  <Clock className="w-3 h-3 mr-1" />
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry}天后到期` : '已过期'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Comprehensive WHOIS Information */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* 域名基本信息 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Globe className="w-5 h-5" />
              <span>域名信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Globe} label="域名" value={whoisInfo.domainName} copyable />
            <InfoRow icon={Calendar} label="注册日期" value={formatDate(whoisInfo.creationDate)} />
            <InfoRow icon={Clock} label="更新日期" value={formatDate(whoisInfo.updatedDate)} />
            <InfoRow icon={AlertCircle} label="到期日期" value={formatDate(whoisInfo.registryExpiryDate)} />
            <InfoRow icon={Info} label="注册局域名ID" value={whoisInfo.registryDomainId} copyable />
            
            {whoisInfo.domainStatus && whoisInfo.domainStatus.length > 0 && (
              <div className="py-2 border-b border-border/50">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">域名状态</div>
                </div>
                <div className="flex flex-wrap gap-1 ml-7">
                  {whoisInfo.domainStatus.slice(0, 2).map((status, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {status.split(' ')[0]}
                    </Badge>
                  ))}
                  {whoisInfo.domainStatus.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{whoisInfo.domainStatus.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 注册商信息 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Building className="w-5 h-5" />
              <span>注册商信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Building} label="注册商" value={whoisInfo.registrar} copyable />
            <InfoRow icon={Info} label="注册商IANA ID" value={whoisInfo.registrarIanaId} />
            <InfoRow icon={Globe} label="注册商网站" value={whoisInfo.registrarUrl} copyable />
            <InfoRow icon={Server} label="WHOIS服务器" value={whoisInfo.registrarWhoisServer} copyable />
            <InfoRow icon={Mail} label="投诉邮箱" value={whoisInfo.registrarAbuseContactEmail} copyable />
            <InfoRow icon={Phone} label="投诉电话" value={whoisInfo.registrarAbuseContactPhone} copyable />
          </CardContent>
        </Card>

        {/* 技术信息 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Server className="w-5 h-5" />
              <span>技术信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Shield} label="DNSSEC" value={whoisInfo.dnssec === 'signedDelegation' ? '已启用' : '未启用'} />
            
            {whoisInfo.nameServers && whoisInfo.nameServers.length > 0 && (
              <div className="py-2">
                <div className="flex items-center space-x-3 mb-2">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">名称服务器</div>
                </div>
                <div className="ml-7 space-y-1">
                  {whoisInfo.nameServers.slice(0, 3).map((ns, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-mono truncate pr-2">{ns}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(ns, `ns-${index}`)}
                        className="flex-shrink-0 h-6 w-6 p-0"
                      >
                        {copiedField === `ns-${index}` ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                  {whoisInfo.nameServers.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{whoisInfo.nameServers.length - 3} 个更多服务器
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 联系信息 */}
        {(whoisInfo.registrant || whoisInfo.admin) && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="w-5 h-5" />
                <span>联系信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {whoisInfo.registrant && (
                <>
                  <InfoRow icon={User} label="注册人" value={whoisInfo.registrant.name} />
                  <InfoRow icon={Building} label="注册机构" value={whoisInfo.registrant.organization} />
                  <InfoRow icon={Mail} label="注册人邮箱" value={whoisInfo.registrant.email} copyable />
                  <InfoRow icon={MapPin} label="国家/地区" value={whoisInfo.registrant.country} />
                </>
              )}
              {whoisInfo.admin && (
                <>
                  <InfoRow icon={User} label="管理联系人" value={whoisInfo.admin.name} />
                  <InfoRow icon={Mail} label="管理邮箱" value={whoisInfo.admin.email} copyable />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Information */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              WHOIS数据库最后更新时间: {formatDate(whoisInfo.lastUpdateOfWhoisDatabase)}
            </p>
            <p className="text-xs">
              有关域名状态代码的更多信息，请访问{' '}
              <a href="https://icann.org/epp" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://icann.org/epp
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}