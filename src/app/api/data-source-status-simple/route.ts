import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Running simplified data source health checks...');
    
    // Test external API (Nazhumi) - this should work without bindings
    let nazhumiStatus = {
      available: false,
      responseTime: 0,
      error: 'Not tested'
    };
    
    try {
      const nazhumiStart = Date.now();
      const nazhumiResponse = await fetch('https://nazhumi.com/api/domain/test.com', {
        method: 'GET',
        headers: {
          'User-Agent': 'NextName-HealthCheck/1.0'
        }
      });
      
      nazhumiStatus = {
        available: nazhumiResponse.ok,
        responseTime: Date.now() - nazhumiStart,
        status: nazhumiResponse.status,
        error: nazhumiResponse.ok ? undefined : `HTTP ${nazhumiResponse.status}`
      };
    } catch (error) {
      nazhumiStatus = {
        available: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Mock D1 and KV status since bindings are not available
    const d1Status = {
      available: false,
      responseTime: 0,
      recordCount: 0,
      lastSync: null,
      health: 'unavailable',
      error: 'D1 binding not configured in Cloudflare Pages'
    };
    
    const kvStatus = {
      available: false,
      responseTime: 0,
      cacheHits: 0,
      error: 'KV binding not configured in Cloudflare Pages'
    };
    
    const totalCheckTime = Date.now() - startTime;
    
    // Determine overall health
    let overallHealth = 'unhealthy';
    if (nazhumiStatus.available) {
      overallHealth = 'degraded'; // At least external API works
    }
    
    const response = {
      timestamp: new Date().toISOString(),
      overallHealth,
      totalCheckTime,
      services: {
        d1Database: d1Status,
        nazhumiAPI: nazhumiStatus,
        kvCache: kvStatus
      },
      recommendations: [] as string[]
    };
    
    // Add recommendations
    response.recommendations.push('D1 database binding needs to be configured in Cloudflare Pages');
    response.recommendations.push('KV cache binding needs to be configured in Cloudflare Pages');
    
    if (!nazhumiStatus.available) {
      response.recommendations.push('External API (Nazhumi) is unavailable - check network connectivity');
    }
    
    response.recommendations.push('Configure D1 and KV bindings in Cloudflare Pages dashboard');
    response.recommendations.push('Verify wrangler.toml configuration matches Cloudflare Pages settings');
    
    console.log('✅ Simplified health check completed');
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ Simplified health check failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallHealth: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      totalCheckTime: Date.now() - startTime,
      available: false
    }, { status: 500 });
  }
});
