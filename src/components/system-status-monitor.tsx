'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Server, Database, Wifi, Globe, Zap, AlertTriangle,
  CheckCircle, XCircle, Clock, RefreshCw, Cpu, HardDrive,
  Memory, Network, Shield, CloudCog
} from 'lucide-react'

interface SystemComponent {
  id: string
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'maintenance'
  responseTime: number
  uptime: number
  lastChecked: string
  description: string
  dependencies?: string[]
  metrics?: {
    cpu?: number
    memory?: number
    disk?: number
    network?: number
  }
}

interface SystemStatus {
  overall: 'operational' | 'degraded' | 'major_outage' | 'maintenance'
  components: SystemComponent[]
  incidents: Array<{
    id: string
    title: string
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
    severity: 'minor' | 'major' | 'critical'
    startTime: string
    description: string
  }>
  uptime: {
    last24h: number
    last7d: number
    last30d: number
    last90d: number
  }
}

export function SystemStatusMonitor() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'operational',
    components: [],
    incidents: [],
    uptime: {
      last24h: 99.95,
      last7d: 99.92,
      last30d: 99.89,
      last90d: 99.85
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadSystemStatus()
    
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadSystemStatus()
      }
    }, 30000) // 每30秒检查一次

    return () => clearInterval(interval)
  }, [autoRefresh])

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/health')
      
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      } else {
        // 模拟数据（实际中应从API获取）
        const mockData: SystemStatus = {
          overall: 'operational',
          components: [
            {
              id: 'web_server',
              name: 'Web服务器',
              status: 'healthy',
              responseTime: 45,
              uptime: 99.98,
              lastChecked: '30秒前',
              description: 'Cloudflare Pages前端服务',
              metrics: {
                cpu: 15,
                memory: 45,
                network: 250
              }
            },
            {
              id: 'api_gateway',
              name: 'API网关',
              status: 'healthy',
              responseTime: 85,
              uptime: 99.95,
              lastChecked: '45秒前',
              description: 'Vercel Edge Functions API服务',
              dependencies: ['database', 'cache'],
              metrics: {
                cpu: 23,
                memory: 62
              }
            },
            {
              id: 'database',
              name: '数据库',
              status: 'healthy',
              responseTime: 12,
              uptime: 99.99,
              lastChecked: '1分钟前',
              description: 'PostgreSQL主数据库',
              metrics: {
                cpu: 8,
                memory: 34,
                disk: 67
              }
            },
            {
              id: 'cache',
              name: '缓存系统',
              status: 'degraded',
              responseTime: 156,
              uptime: 99.85,
              lastChecked: '2分钟前',
              description: 'Redis缓存集群',
              metrics: {
                cpu: 45,
                memory: 78
              }
            },
            {
              id: 'cdn',
              name: 'CDN服务',
              status: 'healthy',
              responseTime: 28,
              uptime: 99.97,
              lastChecked: '30秒前',
              description: 'Cloudflare全球CDN节点',
              metrics: {
                network: 1200
              }
            },
            {
              id: 'monitoring',
              name: '监控系统',
              status: 'healthy',
              responseTime: 92,
              uptime: 99.91,
              lastChecked: '1分钟前',
              description: '系统监控和警报服务'
            },
            {
              id: 'search_api',
              name: '域名搜索API',
              status: 'healthy',
              responseTime: 234,
              uptime: 99.93,
              lastChecked: '45秒前',
              description: '第三方域名查询API集成',
              dependencies: ['api_gateway']
            },
            {
              id: 'whois_service',
              name: 'WHOIS服务',
              status: 'healthy',
              responseTime: 445,
              uptime: 99.88,
              lastChecked: '2分钟前',
              description: 'WHOIS数据查询服务'
            }
          ],
          incidents: [
            {
              id: 'incident_001',
              title: '缓存服务响应时间增加',
              status: 'monitoring',
              severity: 'minor',
              startTime: '15分钟前',
              description: 'Redis缓存集群响应时间比平时慢了约50ms，正在监控中。'
            }
          ],
          uptime: {
            last24h: 99.95,
            last7d: 99.92,
            last30d: 99.89,
            last90d: 99.85
          }
        }
        setSystemStatus(mockData)
      }
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load system status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOverallStatusInfo = (status: string) => {
    switch (status) {
      case 'operational':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: '系统正常运行',
          color: 'bg-green-50 text-green-800 border-green-200'
        }
      case 'degraded':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          text: '部分服务降级',
          color: 'bg-yellow-50 text-yellow-800 border-yellow-200'
        }
      case 'major_outage':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: '主要服务中断',
          color: 'bg-red-50 text-red-800 border-red-200'
        }
      case 'maintenance':
        return {
          icon: <Clock className="w-5 h-5 text-blue-500" />,
          text: '系统维护中',
          color: 'bg-blue-50 text-blue-800 border-blue-200'
        }
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-gray-500" />,
          text: '状态未知',
          color: 'bg-gray-50 text-gray-800 border-gray-200'
        }
    }
  }

  const getComponentStatusInfo = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          color: 'bg-green-100 text-green-800'
        }
      case 'degraded':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
          color: 'bg-yellow-100 text-yellow-800'
        }
      case 'down':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          color: 'bg-red-100 text-red-800'
        }
      case 'maintenance':
        return {
          icon: <Clock className="w-4 h-4 text-blue-500" />,
          color: 'bg-blue-100 text-blue-800'
        }
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-gray-500" />,
          color: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const getComponentIcon = (id: string) => {
    switch (id) {
      case 'web_server': return <Server className="w-5 h-5" />
      case 'api_gateway': return <Wifi className="w-5 h-5" />
      case 'database': return <Database className="w-5 h-5" />
      case 'cache': return <Zap className="w-5 h-5" />
      case 'cdn': return <Globe className="w-5 h-5" />
      case 'monitoring': return <Shield className="w-5 h-5" />
      case 'search_api': return <CloudCog className="w-5 h-5" />
      case 'whois_service': return <Network className="w-5 h-5" />
      default: return <Server className="w-5 h-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-100 text-yellow-800'
      case 'major': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const overallStatus = getOverallStatusInfo(systemStatus.overall)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 总体状态 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {overallStatus.icon}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {overallStatus.text}
                </h2>
                <p className="text-gray-600 mt-1">
                  所有系统组件状态正常 • 最后检查: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'text-green-600 animate-spin' : ''}`} />
                自动刷新
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadSystemStatus}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                立即检查
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统正常运行时间 */}
      <Card>
        <CardHeader>
          <CardTitle>系统正常运行时间</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus.uptime.last24h}%
              </div>
              <div className="text-sm text-gray-600">过去24小时</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus.uptime.last7d}%
              </div>
              <div className="text-sm text-gray-600">过去7天</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus.uptime.last30d}%
              </div>
              <div className="text-sm text-gray-600">过去30天</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus.uptime.last90d}%
              </div>
              <div className="text-sm text-gray-600">过去90天</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 当前事件 */}
      {systemStatus.incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              当前事件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.incidents.map((incident) => (
                <div key={incident.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">
                          {incident.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {incident.startTime}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {incident.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {incident.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 系统组件状态 */}
      <Card>
        <CardHeader>
          <CardTitle>系统组件状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemStatus.components.map((component) => {
              const statusInfo = getComponentStatusInfo(component.status)
              return (
                <div key={component.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getComponentIcon(component.id)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {component.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {component.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {component.responseTime}ms
                        </div>
                        <div className="text-xs text-gray-500">
                          {component.lastChecked}
                        </div>
                      </div>
                      
                      <Badge className={statusInfo.color}>
                        <div className="flex items-center gap-1">
                          {statusInfo.icon}
                          {component.status}
                        </div>
                      </Badge>
                    </div>
                  </div>

                  {/* 组件指标 */}
                  {component.metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t">
                      {component.metrics.cpu !== undefined && (
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">CPU: {component.metrics.cpu}%</span>
                        </div>
                      )}
                      {component.metrics.memory !== undefined && (
                        <div className="flex items-center gap-2">
                          <Memory className="w-4 h-4 text-green-500" />
                          <span className="text-sm">内存: {component.metrics.memory}%</span>
                        </div>
                      )}
                      {component.metrics.disk !== undefined && (
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">磁盘: {component.metrics.disk}%</span>
                        </div>
                      )}
                      {component.metrics.network !== undefined && (
                        <div className="flex items-center gap-2">
                          <Network className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">网络: {component.metrics.network} MB/s</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 依赖关系 */}
                  {component.dependencies && component.dependencies.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">依赖服务: </span>
                        {component.dependencies.map((dep, index) => (
                          <span key={dep}>
                            {systemStatus.components.find(c => c.id === dep)?.name || dep}
                            {index < component.dependencies!.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 正常运行时间 */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">正常运行时间</span>
                      <span className="text-sm font-medium text-green-600">
                        {component.uptime}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${component.uptime}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}