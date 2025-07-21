'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataSourceHealthStatus } from '@/components/data-source-indicator';
import { 
  RefreshCw, 
  Database, 
  Globe, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export const runtime = 'edge';

export default function DataSourcesAdminPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [syncData, setSyncData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [healthResponse, syncResponse] = await Promise.all([
        fetch('/api/data-source-status'),
        fetch('/api/sync-status?detailed=true')
      ]);

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setHealthData(health);
      }

      if (syncResponse.ok) {
        const sync = await syncResponse.json();
        setSyncData(sync);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN');
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}分钟`;
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10}小时`;
    } else {
      return `${Math.round(hours / 24 * 10) / 10}天`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">加载数据源状态...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">数据源管理</h1>
          <p className="text-gray-600 mt-2">监控和管理域名价格数据源</p>
        </div>
        <div className="flex items-center gap-4">
          <DataSourceHealthStatus />
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="health">健康状态</TabsTrigger>
          <TabsTrigger value="sync">同步状态</TabsTrigger>
          <TabsTrigger value="performance">性能监控</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* D1 Database Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">D1 数据库</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">状态</span>
                    <Badge className={healthData?.services?.d1Database?.available ? 'bg-green-500' : 'bg-red-500'}>
                      {healthData?.services?.d1Database?.available ? '可用' : '不可用'}
                    </Badge>
                  </div>
                  {healthData?.services?.d1Database?.totalRecords && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">记录数</span>
                      <span className="text-sm font-medium">
                        {healthData.services.d1Database.totalRecords.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {healthData?.services?.d1Database?.responseTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">响应时间</span>
                      <span className="text-sm font-medium">
                        {healthData.services.d1Database.responseTime}ms
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Nazhumi API Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nazhumi API</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">状态</span>
                    <Badge className={healthData?.services?.nazhumiAPI?.available ? 'bg-green-500' : 'bg-red-500'}>
                      {healthData?.services?.nazhumiAPI?.available ? '可用' : '不可用'}
                    </Badge>
                  </div>
                  {healthData?.services?.nazhumiAPI?.responseTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">响应时间</span>
                      <span className="text-sm font-medium">
                        {healthData.services.nazhumiAPI.responseTime}ms
                      </span>
                    </div>
                  )}
                  {healthData?.services?.nazhumiAPI?.sampleRecordCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">样本数据</span>
                      <span className="text-sm font-medium">
                        {healthData.services.nazhumiAPI.sampleRecordCount} 条
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KV Cache Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KV 缓存</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">状态</span>
                    <Badge className={healthData?.services?.kvCache?.available ? 'bg-green-500' : 'bg-red-500'}>
                      {healthData?.services?.kvCache?.available ? '可用' : '不可用'}
                    </Badge>
                  </div>
                  {healthData?.services?.kvCache?.responseTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">响应时间</span>
                      <span className="text-sm font-medium">
                        {healthData.services.kvCache.responseTime}ms
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">读写测试</span>
                    <span className="text-sm font-medium">
                      {healthData?.services?.kvCache?.canRead && healthData?.services?.kvCache?.canWrite ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {healthData?.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  系统建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {healthData.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统健康状态</CardTitle>
              <CardDescription>
                最后检查时间: {healthData?.timestamp ? formatTime(healthData.timestamp) : 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(healthData?.overallHealth)}`} />
                    <span className="font-medium">整体状态</span>
                  </div>
                  <Badge variant="outline">
                    {healthData?.overallHealth === 'healthy' ? '健康' : 
                     healthData?.overallHealth === 'degraded' ? '降级' : '异常'}
                  </Badge>
                </div>

                {Object.entries(healthData?.services || {}).map(([key, service]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${service.available ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">
                        {key === 'd1Database' ? 'D1 数据库' : 
                         key === 'nazhumiAPI' ? 'Nazhumi API' : 
                         key === 'kvCache' ? 'KV 缓存' : key}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={service.available ? 'border-green-500' : 'border-red-500'}>
                        {service.available ? '可用' : '不可用'}
                      </Badge>
                      {service.responseTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          {service.responseTime}ms
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          {syncData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总记录数</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {syncData.dataStatistics.totalRecords.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">TLD 数量</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {syncData.dataStatistics.uniqueTlds}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">注册商数量</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {syncData.dataStatistics.uniqueRegistrars}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">数据年龄</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {syncData.dataStatistics.dataAgeHours ? 
                        formatDuration(syncData.dataStatistics.dataAgeHours) : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>同步详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">最后同步时间</label>
                        <p className="text-lg">
                          {syncData.syncStatus.lastSyncTime ? 
                            formatTime(syncData.syncStatus.lastSyncTime) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">同步状态</label>
                        <p className="text-lg">
                          <Badge className={syncData.syncStatus.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                            {syncData.syncStatus.status === 'success' ? '成功' : '失败'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">数据源</label>
                        <p className="text-lg">{syncData.syncStatus.source}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">健康状态</label>
                        <p className="text-lg">
                          <Badge className={getStatusColor(syncData.health.overallHealth)}>
                            {syncData.health.overallHealth === 'healthy' ? '健康' : '需要关注'}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>性能指标</CardTitle>
              <CardDescription>数据源响应时间和可用性统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthData?.services && Object.entries(healthData.services).map(([key, service]: [string, any]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">
                        {key === 'd1Database' ? 'D1 数据库' : 
                         key === 'nazhumiAPI' ? 'Nazhumi API' : 
                         key === 'kvCache' ? 'KV 缓存' : key}
                      </h4>
                      <Badge variant="outline">
                        {service.available ? '在线' : '离线'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">响应时间</span>
                        <p className="font-medium">{service.responseTime || 'N/A'}ms</p>
                      </div>
                      <div>
                        <span className="text-gray-600">健康状态</span>
                        <p className="font-medium">{service.health || 'unknown'}</p>
                      </div>
                      {service.totalRecords && (
                        <div>
                          <span className="text-gray-600">记录数</span>
                          <p className="font-medium">{service.totalRecords.toLocaleString()}</p>
                        </div>
                      )}
                      {service.sampleRecordCount && (
                        <div>
                          <span className="text-gray-600">样本数据</span>
                          <p className="font-medium">{service.sampleRecordCount}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
