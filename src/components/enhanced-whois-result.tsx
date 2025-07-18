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
  MapPin,
  ArrowRightLeft
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
  transferDate?: string
  registrar?: string
  registrarIanaId?: string
  registrarAbuseContactEmail?: string
  registrarAbuseContactPhone?: string
  domainStatus?: string[]
  nameServers?: string[]
  dnssec?: string
  dnssecDetails?: {
    delegationSigned?: boolean
    dsData?: Array<{
      keyTag?: number
      algorithm?: number
      digest?: string
      digestType?: number
    }>
  }
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

  const getDomainAge = (creationDate?: string) => {
    if (!creationDate) return null
    try {
      const created = new Date(creationDate)
      const now = new Date()
      const diffTime = now.getTime() - created.getTime()
      const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25))
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffYears > 0) {
        return `${diffYears}年`
      } else {
        return `${diffDays}天`
      }
    } catch {
      return null
    }
  }

  const getStatusDisplayName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'clientDeleteProhibited': '禁止删除',
      'clientTransferProhibited': '禁止转移',
      'clientUpdateProhibited': '禁止更新',
      'serverDeleteProhibited': '服务器禁止删除',
      'serverTransferProhibited': '服务器禁止转移',
      'serverUpdateProhibited': '服务器禁止更新',
      'clientHold': '客户端暂停',
      'serverHold': '服务器暂停',
      'pendingDelete': '待删除',
      'pendingTransfer': '待转移',
      'ok': '正常'
    }

    const statusCode = status.split(' ')[0]
    return statusMap[statusCode] || statusCode
  }

  const daysUntilExpiry = getDaysUntilExpiry(whoisInfo.registryExpiryDate)
  const domainAge = getDomainAge(whoisInfo.creationDate)

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
            {domainAge && (
              <InfoRow icon={Clock} label="域名年龄" value={domainAge} />
            )}
            <InfoRow icon={Clock} label="更新日期" value={formatDate(whoisInfo.updatedDate)} />
            {whoisInfo.transferDate && (
              <InfoRow icon={ArrowRightLeft} label="转移日期" value={formatDate(whoisInfo.transferDate)} />
            )}
            <InfoRow icon={AlertCircle} label="到期日期" value={formatDate(whoisInfo.registryExpiryDate)} />
            <InfoRow icon={Info} label="注册局域名ID" value={whoisInfo.registryDomainId} copyable />
            
            {whoisInfo.domainStatus && whoisInfo.domainStatus.length > 0 && (
              <div className="py-2 border-b border-border/50">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">域名状态</div>
                </div>
                <div className="flex flex-wrap gap-1 ml-7">
                  {whoisInfo.domainStatus.map((status, index) => {
                    const statusCode = status.split(' ')[0]
                    const displayName = getStatusDisplayName(status)
                    const isProtective = statusCode.includes('Prohibited') || statusCode.includes('Hold')

                    return (
                      <Badge
                        key={index}
                        variant={isProtective ? "default" : "outline"}
                        className={`text-xs ${isProtective ? 'bg-green-100 text-green-800 border-green-300' : ''}`}
                        title={status}
                      >
                        {displayName}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 注册商与技术信息 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Building className="w-5 h-5" />
              <span>注册商与技术信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {/* 注册商信息部分 */}
            <div className="space-y-0">
              <InfoRow icon={Building} label="注册商" value={whoisInfo.registrar} copyable />
              <InfoRow icon={Info} label="注册商IANA ID" value={whoisInfo.registrarIanaId} />
              <InfoRow icon={Globe} label="注册商网站" value={whoisInfo.registrarUrl} copyable />
              <InfoRow icon={Server} label="WHOIS服务器" value={whoisInfo.registrarWhoisServer} copyable />
              <InfoRow icon={Mail} label="投诉邮箱" value={whoisInfo.registrarAbuseContactEmail} copyable />
              <InfoRow icon={Phone} label="投诉电话" value={whoisInfo.registrarAbuseContactPhone} copyable />
            </div>

            {/* 分隔线 */}
            <div className="border-t border-border/50 my-4"></div>

            {/* 技术信息部分 */}
            <div className="space-y-0">
              <InfoRow icon={Shield} label="DNSSEC" value={whoisInfo.dnssec === 'signedDelegation' ? '已启用' : '未启用'} />

              {whoisInfo.nameServers && whoisInfo.nameServers.length > 0 && (
                <div className="py-2">
                  <div className="flex items-center space-x-3 mb-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm font-medium">名称服务器 ({whoisInfo.nameServers.length})</div>
                  </div>
                  <div className="ml-7 space-y-1">
                    {whoisInfo.nameServers.map((ns, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-mono truncate pr-2">{ns.toLowerCase()}</span>
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
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 联系信息 */}
        {(whoisInfo.registrant || whoisInfo.admin || whoisInfo.tech) && (
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
                  <InfoRow icon={Phone} label="注册人电话" value={whoisInfo.registrant.phone} copyable />
                  <InfoRow icon={MapPin} label="国家/地区" value={whoisInfo.registrant.country} />
                </>
              )}
              {whoisInfo.admin && (
                <>
                  <InfoRow icon={User} label="管理联系人" value={whoisInfo.admin.name} />
                  <InfoRow icon={Building} label="管理机构" value={whoisInfo.admin.organization} />
                  <InfoRow icon={Mail} label="管理邮箱" value={whoisInfo.admin.email} copyable />
                  <InfoRow icon={Phone} label="管理电话" value={whoisInfo.admin.phone} copyable />
                </>
              )}
              {whoisInfo.tech && (
                <>
                  <InfoRow icon={User} label="技术联系人" value={whoisInfo.tech.name} />
                  <InfoRow icon={Building} label="技术机构" value={whoisInfo.tech.organization} />
                  <InfoRow icon={Mail} label="技术邮箱" value={whoisInfo.tech.email} copyable />
                  <InfoRow icon={Phone} label="技术电话" value={whoisInfo.tech.phone} copyable />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Information */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              WHOIS数据库最后更新时间: {formatDate(whoisInfo.lastUpdateOfWhoisDatabase)}
            </p>

            {/* RDAP 标准信息 */}
            <div className="border-t border-border/50 pt-3 space-y-2">
              <p className="text-xs font-medium text-foreground/80">
                此响应符合 RDAP gTLD 注册局和注册商操作规范 1.0 版本
              </p>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center">
                  <span className="font-medium mr-1">状态码说明：</span>
                  <a
                    href="https://icann.org/epp"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://icann.org/epp
                  </a>
                </div>

                <div className="flex flex-wrap items-center">
                  <span className="font-medium mr-1">数据准确性投诉：</span>
                  <a
                    href="https://icann.org/wicf"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ICANN 投诉表单
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}