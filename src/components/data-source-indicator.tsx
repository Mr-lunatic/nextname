'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Database, 
  Globe, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap
} from 'lucide-react';

interface DataSourceIndicatorProps {
  source?: string;
  metadata?: any;
  onRefresh?: () => void;
  className?: string;
}

export function DataSourceIndicator({ 
  source, 
  metadata, 
  onRefresh,
  className = '' 
}: DataSourceIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSourceInfo = () => {
    if (!source) return null;

    const sourceMap: Record<string, any> = {
      'd1_fresh': {
        icon: Database,
        label: 'D1数据库',
        color: 'bg-green-500',
        description: '来自同步数据库的新鲜数据'
      },
      'd1_stale_fallback': {
        icon: Database,
        label: 'D1数据库',
        color: 'bg-yellow-500',
        description: '来自同步数据库的备用数据'
      },
      'd1_emergency_fallback': {
        icon: Database,
        label: 'D1备用',
        color: 'bg-orange-500',
        description: '紧急备用数据'
      },
      'nazhumi_primary': {
        icon: Globe,
        label: '实时API',
        color: 'bg-blue-500',
        description: '来自nazhumi的实时数据'
      },
      'nazhumi_with_d1_backup': {
        icon: Globe,
        label: '实时API',
        color: 'bg-blue-500',
        description: '实时数据（有D1备份）'
      },
      'd1_forced': {
        icon: Database,
        label: 'D1强制',
        color: 'bg-purple-500',
        description: '强制使用D1数据'
      },
      'nazhumi_forced': {
        icon: Globe,
        label: 'API强制',
        color: 'bg-purple-500',
        description: '强制使用API数据'
      }
    };

    return sourceMap[source] || {
      icon: AlertTriangle,
      label: '未知',
      color: 'bg-gray-500',
      description: '未知数据源'
    };
  };

  const sourceInfo = getSourceInfo();
  if (!sourceInfo) return null;

  const Icon = sourceInfo.icon;
  const isCacheHit = metadata?.cacheHit;
  const responseTime = metadata?.responseTime || metadata?.queryTime;
  const dataAge = metadata?.dataAge || metadata?.cacheAge;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`${sourceInfo.color} text-white hover:opacity-80 cursor-help`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {sourceInfo.label}
              {isCacheHit && <Zap className="w-3 h-3 ml-1" />}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">{sourceInfo.description}</p>
              
              {responseTime && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-3 h-3" />
                  响应时间: {responseTime}ms
                </div>
              )}
              
              {dataAge !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-3 h-3" />
                  数据年龄: {
                    dataAge < 1 ? 
                      `${Math.round(dataAge * 60)}分钟` : 
                      `${Math.round(dataAge * 10) / 10}小时`
                  }
                </div>
              )}
              
              {isCacheHit && (
                <div className="flex items-center gap-1 text-sm text-yellow-400">
                  <Zap className="w-3 h-3" />
                  缓存命中
                </div>
              )}
              
              {metadata?.hasD1Backup && (
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  有D1备份可用
                </div>
              )}
              
              {metadata?.usedAsFallback && (
                <div className="flex items-center gap-1 text-sm text-orange-400">
                  <AlertTriangle className="w-3 h-3" />
                  使用备用数据
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {onRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              刷新数据
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Health status component for admin/monitoring
export function DataSourceHealthStatus() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/data-source-status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setHealthData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">检查数据源状态...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">状态检查失败: {error}</span>
      </div>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'unhealthy': return AlertTriangle;
      default: return Clock;
    }
  };

  const HealthIcon = getHealthIcon(healthData?.overallHealth);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <HealthIcon className={`w-4 h-4 ${getHealthColor(healthData?.overallHealth)}`} />
            <span className={`text-sm ${getHealthColor(healthData?.overallHealth)}`}>
              系统状态: {healthData?.overallHealth === 'healthy' ? '正常' : 
                       healthData?.overallHealth === 'degraded' ? '降级' : '异常'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-medium">数据源状态</p>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>D1数据库:</span>
                <span className={healthData?.services?.d1Database?.available ? 'text-green-400' : 'text-red-400'}>
                  {healthData?.services?.d1Database?.available ? '可用' : '不可用'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Nazhumi API:</span>
                <span className={healthData?.services?.nazhumiAPI?.available ? 'text-green-400' : 'text-red-400'}>
                  {healthData?.services?.nazhumiAPI?.available ? '可用' : '不可用'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>KV缓存:</span>
                <span className={healthData?.services?.kvCache?.available ? 'text-green-400' : 'text-red-400'}>
                  {healthData?.services?.kvCache?.available ? '可用' : '不可用'}
                </span>
              </div>
            </div>
            
            {healthData?.recommendations?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <p className="text-xs text-gray-400">建议:</p>
                <ul className="text-xs space-y-1">
                  {healthData.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-yellow-400">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
