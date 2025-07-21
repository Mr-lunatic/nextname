import { NextRequest, NextResponse } from 'next/server';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

// Declare D1 Database binding
declare const PRICING_DB: any;

export async function GET(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  
  // Access D1 binding
  const PRICING_DB_INSTANCE = context?.env?.PRICING_DB as any;
  
  if (!PRICING_DB_INSTANCE) {
    return NextResponse.json({
      error: 'D1 database not available',
      available: false
    }, { status: 503 });
  }

  try {
    console.log('🔍 Fetching sync status from D1...');
    
    // Get sync status
    const syncStatus = await PRICING_DB_INSTANCE.prepare(`
      SELECT 
        last_sync_time, 
        total_records, 
        sync_source, 
        status 
      FROM sync_status 
      WHERE id = 1
    `).first();
    
    // Get basic statistics
    const stats = await Promise.all([
      // Total active records
      PRICING_DB_INSTANCE.prepare(`
        SELECT COUNT(*) as count 
        FROM pricing_data 
        WHERE is_active = 1
      `).first(),
      
      // Unique TLDs
      PRICING_DB_INSTANCE.prepare(`
        SELECT COUNT(DISTINCT tld) as count 
        FROM pricing_data 
        WHERE is_active = 1
      `).first(),
      
      // Unique registrars
      PRICING_DB_INSTANCE.prepare(`
        SELECT COUNT(DISTINCT registrar) as count 
        FROM pricing_data 
        WHERE is_active = 1
      `).first(),
      
      // Latest crawl time
      PRICING_DB_INSTANCE.prepare(`
        SELECT MAX(crawled_at) as latest_crawl 
        FROM pricing_data 
        WHERE is_active = 1
      `).first()
    ]);
    
    const [totalRecords, uniqueTlds, uniqueRegistrars, latestCrawl] = stats;
    
    // Calculate data freshness
    const lastSyncTime = syncStatus?.last_sync_time ? new Date(syncStatus.last_sync_time) : null;
    const latestCrawlTime = latestCrawl?.latest_crawl ? new Date(latestCrawl.latest_crawl) : null;
    
    const syncAgeHours = lastSyncTime ? (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60) : null;
    const dataAgeHours = latestCrawlTime ? (Date.now() - latestCrawlTime.getTime()) / (1000 * 60 * 60) : null;
    
    const response: any = {
      timestamp: new Date().toISOString(),
      syncStatus: {
        lastSyncTime: syncStatus?.last_sync_time || null,
        syncAgeHours: syncAgeHours ? Math.round(syncAgeHours * 10) / 10 : null,
        status: syncStatus?.status || 'unknown',
        source: syncStatus?.sync_source || 'unknown'
      },
      dataStatistics: {
        totalRecords: totalRecords?.count || 0,
        uniqueTlds: uniqueTlds?.count || 0,
        uniqueRegistrars: uniqueRegistrars?.count || 0,
        latestCrawlTime: latestCrawl?.latest_crawl || null,
        dataAgeHours: dataAgeHours ? Math.round(dataAgeHours * 10) / 10 : null
      },
      health: {
        syncHealth: syncAgeHours && syncAgeHours <= 25 ? 'healthy' : 'stale',
        dataHealth: dataAgeHours && dataAgeHours <= 25 ? 'fresh' : 'stale',
        overallHealth: (syncAgeHours && syncAgeHours <= 25 && dataAgeHours && dataAgeHours <= 25) ? 'healthy' : 'degraded'
      }
    };
    
    // Add detailed information if requested
    if (detailed) {
      try {
        // Top TLDs by record count
        const topTlds = await PRICING_DB_INSTANCE.prepare(`
          SELECT tld, COUNT(*) as record_count 
          FROM pricing_data 
          WHERE is_active = 1 
          GROUP BY tld 
          ORDER BY record_count DESC 
          LIMIT 10
        `).all();
        
        // Top registrars by TLD coverage
        const topRegistrars = await PRICING_DB_INSTANCE.prepare(`
          SELECT registrar_name, COUNT(DISTINCT tld) as tld_count 
          FROM pricing_data 
          WHERE is_active = 1 AND registrar_name IS NOT NULL 
          GROUP BY registrar_name 
          ORDER BY tld_count DESC 
          LIMIT 10
        `).all();
        
        // Recent sync history (if available)
        const recentSyncs = await PRICING_DB_INSTANCE.prepare(`
          SELECT * 
          FROM sync_status 
          ORDER BY last_sync_time DESC 
          LIMIT 5
        `).all();
        
        response.detailed = {
          topTldsByRecords: topTlds.results || [],
          topRegistrarsByTldCoverage: topRegistrars.results || [],
          recentSyncHistory: recentSyncs.results || []
        };
        
      } catch (detailError: any) {
        console.warn('Failed to fetch detailed statistics:', detailError.message);
        response.detailed = {
          error: 'Failed to fetch detailed statistics',
          message: detailError.message
        };
      }
    }
    
    // Add recommendations
    response.recommendations = [];
    
    if (response.health.syncHealth === 'stale') {
      response.recommendations.push('Sync is overdue - check Ubuntu crawler sync process');
    }
    
    if (response.health.dataHealth === 'stale') {
      response.recommendations.push('Data is stale - check Ubuntu crawler execution');
    }
    
    if (response.dataStatistics.totalRecords === 0) {
      response.recommendations.push('No data available - initial sync may be required');
    }
    
    if (response.dataStatistics.uniqueTlds < 100) {
      response.recommendations.push('Low TLD coverage - check crawler configuration');
    }
    
    console.log(`✅ Sync status retrieved: ${response.dataStatistics.totalRecords} records, ${response.health.overallHealth} health`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Failed to fetch sync status:', error.message);
    
    return NextResponse.json({
      error: 'Failed to fetch sync status',
      message: error.message,
      timestamp: new Date().toISOString(),
      available: false
    }, { status: 500 });
  }
}

// POST endpoint to trigger manual sync (if needed)
export async function POST(request: NextRequest, context: any) {
  return NextResponse.json({
    error: 'Manual sync not implemented',
    message: 'Use the Ubuntu crawler sync process to update D1 data',
    syncCommand: 'cd domain-price-crawler && node src/sync/cloudflare-sync.js'
  }, { status: 501 });
}
