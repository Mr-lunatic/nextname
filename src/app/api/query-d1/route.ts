export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'cn';
  const action = searchParams.get('action') || 'count'; // count, sample, all
  
  try {
    // Access D1 binding
    const PRICING_DB = (process.env as any)['domain-pricing-db'] || (process.env as any).PRICING_DB;
    
    if (!PRICING_DB) {
      return Response.json({
        error: 'D1 database not available',
        message: 'PRICING_DB binding not found'
      }, { status: 500 });
    }

    console.log(`🔍 Querying D1 database for domain: ${domain}, action: ${action}`);

    let result;
    
    if (action === 'count') {
      // 查询总记录数
      const countQuery = `
        SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count,
          COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_count
        FROM pricing_data 
        WHERE tld = ?
      `;
      
      result = await PRICING_DB.prepare(countQuery).bind(domain).first();
      
    } else if (action === 'sample') {
      // 查询前10条记录作为样本
      const sampleQuery = `
        SELECT 
          tld, registrar, registrar_name, registrar_url,
          registration_price, renewal_price, transfer_price,
          currency, currency_name, currency_type,
          has_promo, promo_code, is_active, updated_time, crawled_at
        FROM pricing_data
        WHERE tld = ?
        ORDER BY updated_time DESC
        LIMIT 10
      `;
      
      const sampleResult = await PRICING_DB.prepare(sampleQuery).bind(domain).all();
      result = sampleResult.results;
      
    } else if (action === 'all') {
      // 查询所有记录（谨慎使用）
      const allQuery = `
        SELECT 
          tld, registrar, registrar_name, registrar_url,
          registration_price, renewal_price, transfer_price,
          currency, currency_name, currency_type,
          has_promo, promo_code, is_active, updated_time, crawled_at
        FROM pricing_data
        WHERE tld = ? AND is_active = 1
        ORDER BY registration_price ASC
      `;
      
      const allResult = await PRICING_DB.prepare(allQuery).bind(domain).all();
      result = allResult.results;
      
    } else if (action === 'stats') {
      // 查询统计信息
      const statsQuery = `
        SELECT 
          tld,
          COUNT(*) as total_records,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_records,
          COUNT(DISTINCT registrar) as unique_registrars,
          MIN(registration_price) as min_price,
          MAX(registration_price) as max_price,
          AVG(registration_price) as avg_price,
          MIN(updated_time) as oldest_update,
          MAX(updated_time) as latest_update,
          MIN(crawled_at) as oldest_crawl,
          MAX(crawled_at) as latest_crawl
        FROM pricing_data 
        WHERE tld = ? AND is_active = 1
        GROUP BY tld
      `;
      
      result = await PRICING_DB.prepare(statsQuery).bind(domain).first();
      
    } else if (action === 'registrars') {
      // 查询所有注册商
      const registrarsQuery = `
        SELECT 
          registrar,
          registrar_name,
          COUNT(*) as record_count,
          MIN(registration_price) as min_reg_price,
          MAX(registration_price) as max_reg_price,
          AVG(registration_price) as avg_reg_price,
          MAX(updated_time) as last_updated
        FROM pricing_data 
        WHERE tld = ? AND is_active = 1
        GROUP BY registrar, registrar_name
        ORDER BY record_count DESC
      `;
      
      const registrarsResult = await PRICING_DB.prepare(registrarsQuery).bind(domain).all();
      result = registrarsResult.results;
    }

    return Response.json({
      success: true,
      domain,
      action,
      timestamp: new Date().toISOString(),
      data: result,
      message: `Successfully queried D1 database for ${domain} with action: ${action}`
    });

  } catch (error: any) {
    console.error(`❌ D1 query error:`, error);
    
    return Response.json({
      success: false,
      error: error.message,
      domain,
      action,
      message: 'Failed to query D1 database'
    }, { status: 500 });
  }
}

// 支持的查询参数说明
export async function POST() {
  return Response.json({
    message: 'D1 Database Query API',
    usage: {
      endpoint: '/api/query-d1',
      parameters: {
        domain: 'Domain to query (e.g., cn, com, net)',
        action: 'Query type: count, sample, all, stats, registrars'
      },
      examples: [
        '/api/query-d1?domain=cn&action=count - Get record counts',
        '/api/query-d1?domain=cn&action=sample - Get 10 sample records',
        '/api/query-d1?domain=cn&action=all - Get all active records',
        '/api/query-d1?domain=cn&action=stats - Get statistical summary',
        '/api/query-d1?domain=cn&action=registrars - Get registrar breakdown'
      ]
    }
  });
}
