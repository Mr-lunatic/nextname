import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

// Declare bindings
declare const PRICING_CACHE: any;
declare const PRICING_DB: any;

// Test D1 database connectivity and data freshness
async function testD1Database(PRICING_DB: any) {
  if (!PRICING_DB) {
    return {
      available: false,
      error: 'D1 database not configured',
      responseTime: 0
    };
  }

  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    const connectTest = await PRICING_DB.prepare('SELECT 1 as test').first();
    
    // Get sync status
    const syncStatus = await PRICING_DB.prepare(`
      SELECT last_sync_time, total_records, sync_source, status 
      FROM sync_status 
      WHERE id = 1
    `).first();
    
    // Get sample data count
    const dataCount = await PRICING_DB.prepare(`
      SELECT COUNT(*) as count 
      FROM pricing_data 
      WHERE is_active = 1
    `).first();
    
    // Get latest crawl time
    const latestCrawl = await PRICING_DB.prepare(`
      SELECT MAX(crawled_at) as latest_crawl 
      FROM pricing_data 
      WHERE is_active = 1
    `).first();
    
    const responseTime = Date.now() - startTime;
    const latestCrawlDate = latestCrawl?.latest_crawl ? new Date(latestCrawl.latest_crawl) : null;
    const hoursOld = latestCrawlDate ? (Date.now() - latestCrawlDate.getTime()) / (1000 * 60 * 60) : null;
    
    return {
      available: true,
      responseTime,
      syncStatus: syncStatus || null,
      totalRecords: dataCount?.count || 0,
      latestCrawl: latestCrawl?.latest_crawl || null,
      dataAgeHours: hoursOld,
      isFresh: hoursOld ? hoursOld <= 24 : false,
      health: hoursOld && hoursOld <= 24 ? 'healthy' : 'stale'
    };
    
  } catch (error: any) {
    return {
      available: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Test Nazhumi API connectivity
async function testNazhumiAPI() {
  const startTime = Date.now();
  const testDomain = 'com'; // Use a common TLD for testing
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`https://www.nazhumi.com/api/v1?domain=${testDomain}&order=new`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        available: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      };
    }
    
    const data = await response.json();
    const hasValidData = data.code === 100 && data.data && Array.isArray(data.data.price) && data.data.price.length > 0;
    
    return {
      available: true,
      responseTime,
      hasValidData,
      sampleRecordCount: hasValidData ? data.data.price.length : 0,
      health: hasValidData ? 'healthy' : 'degraded'
    };
    
  } catch (error: any) {
    return {
      available: false,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Test KV cache connectivity
async function testKVCache(PRICING_CACHE: any) {
  if (!PRICING_CACHE) {
    return {
      available: false,
      error: 'KV cache not configured'
    };
  }

  const startTime = Date.now();
  const testKey = 'health-check-' + Date.now();
  
  try {
    // Test write
    await PRICING_CACHE.put(testKey, 'test-value', { expirationTtl: 60 });
    
    // Test read
    const value = await PRICING_CACHE.get(testKey);
    
    // Cleanup
    await PRICING_CACHE.delete(testKey);
    
    const responseTime = Date.now() - startTime;
    
    return {
      available: true,
      responseTime,
      canWrite: true,
      canRead: value === 'test-value',
      health: value === 'test-value' ? 'healthy' : 'degraded'
    };
    
  } catch (error: any) {
    return {
      available: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
  const startTime = Date.now();
  
  // Access bindings
  const PRICING_CACHE_KV = context?.env?.PRICING_CACHE as any;
  const PRICING_DB_INSTANCE = context?.env?.PRICING_DB as any;
  
  try {
    console.log('🔍 Running data source health checks...');
    
    // Run all tests in parallel
    const [d1Status, nazhumiStatus, kvStatus] = await Promise.all([
      testD1Database(PRICING_DB_INSTANCE),
      testNazhumiAPI(),
      testKVCache(PRICING_CACHE_KV)
    ]);
    
    const totalTime = Date.now() - startTime;
    
    // Determine overall system health
    const healthyServices = [
      d1Status.available && d1Status.health === 'healthy',
      nazhumiStatus.available && nazhumiStatus.health === 'healthy',
      kvStatus.available && kvStatus.health === 'healthy'
    ].filter(Boolean).length;
    
    const overallHealth = healthyServices >= 2 ? 'healthy' : 
                         healthyServices >= 1 ? 'degraded' : 'unhealthy';
    
    const response = {
      timestamp: new Date().toISOString(),
      overallHealth,
      totalCheckTime: totalTime,
      services: {
        d1Database: d1Status,
        nazhumiAPI: nazhumiStatus,
        kvCache: kvStatus
      },
      recommendations: []
    };
    
    // Add recommendations based on status
    if (!d1Status.available) {
      response.recommendations.push('D1 database is unavailable - check Cloudflare D1 configuration');
    } else if (d1Status.health === 'stale') {
      response.recommendations.push('D1 data is stale - check Ubuntu crawler sync process');
    }
    
    if (!nazhumiStatus.available) {
      response.recommendations.push('Nazhumi API is unavailable - system will rely on D1 data');
    }
    
    if (!kvStatus.available) {
      response.recommendations.push('KV cache is unavailable - performance may be degraded');
    }
    
    console.log(`✅ Health check completed in ${totalTime}ms - Overall: ${overallHealth}`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Health check failed:', error.message);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallHealth: 'error',
      totalCheckTime: Date.now() - startTime,
      error: error.message,
      services: {
        d1Database: { available: false, error: 'Health check failed' },
        nazhumiAPI: { available: false, error: 'Health check failed' },
        kvCache: { available: false, error: 'Health check failed' }
      }
    }, { status: 500 });
  }
});
