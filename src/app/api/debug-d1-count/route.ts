import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
  try {
    // Access D1 binding
    const PRICING_DB = (process.env as any)['domain-pricing-db'] || (process.env as any).PRICING_DB;
    
    if (!PRICING_DB) {
      return NextResponse.json({
        success: false,
        error: 'D1 database not available'
      }, { status: 500 });
    }

    const domain = request.nextUrl.searchParams.get('domain') || 'com';
    
    console.log(`🔍 Debugging D1 count for ${domain}`);

    // 1. 总记录数查询
    const totalCountQuery = `SELECT COUNT(*) as total FROM pricing_data WHERE tld = ? AND is_active = 1`;
    const totalResult = await PRICING_DB.prepare(totalCountQuery).bind(domain).first();
    
    // 2. 获取所有记录（用于调试）
    const allRecordsQuery = `
      SELECT 
        tld, registrar, registrar_name, 
        registration_price, renewal_price, transfer_price,
        currency, crawled_at
      FROM pricing_data 
      WHERE tld = ? AND is_active = 1 
      ORDER BY registration_price ASC
    `;
    const allRecordsResult = await PRICING_DB.prepare(allRecordsQuery).bind(domain).all();
    
    // 3. 按注册商分组统计
    const registrarCountQuery = `
      SELECT registrar, COUNT(*) as count 
      FROM pricing_data 
      WHERE tld = ? AND is_active = 1 
      GROUP BY registrar 
      ORDER BY count DESC
    `;
    const registrarCountResult = await PRICING_DB.prepare(registrarCountQuery).bind(domain).all();
    
    // 4. 数据新鲜度分析
    const freshnessQuery = `
      SELECT 
        MIN(crawled_at) as oldest,
        MAX(crawled_at) as newest,
        COUNT(*) as total
      FROM pricing_data 
      WHERE tld = ? AND is_active = 1
    `;
    const freshnessResult = await PRICING_DB.prepare(freshnessQuery).bind(domain).first();
    
    // 5. 价格范围分析
    const priceRangeQuery = `
      SELECT 
        MIN(registration_price) as min_price,
        MAX(registration_price) as max_price,
        AVG(registration_price) as avg_price,
        COUNT(CASE WHEN registration_price IS NOT NULL THEN 1 END) as price_count
      FROM pricing_data 
      WHERE tld = ? AND is_active = 1
    `;
    const priceRangeResult = await PRICING_DB.prepare(priceRangeQuery).bind(domain).first();

    return NextResponse.json({
      success: true,
      domain,
      timestamp: new Date().toISOString(),
      analysis: {
        totalRecords: totalResult?.total || 0,
        actualRecords: allRecordsResult?.results?.length || 0,
        registrarBreakdown: registrarCountResult?.results || [],
        dataFreshness: freshnessResult || {},
        priceRange: priceRangeResult || {},
        sampleRecords: (allRecordsResult?.results || []).slice(0, 10), // 前10条记录
        allRegistrars: (allRecordsResult?.results || []).map(r => r.registrar).filter((v, i, a) => a.indexOf(v) === i)
      },
      debug: {
        d1Available: !!PRICING_DB,
        queryExecuted: true,
        resultStructure: {
          totalResult: totalResult ? Object.keys(totalResult) : [],
          allRecordsResult: allRecordsResult ? Object.keys(allRecordsResult) : [],
          firstRecord: allRecordsResult?.results?.[0] ? Object.keys(allRecordsResult.results[0]) : []
        }
      }
    });
    
  } catch (error) {
    console.error('Debug D1 count error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});
