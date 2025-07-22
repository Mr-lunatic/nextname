import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
  try {
    // Access D1 binding
    const PRICING_DB = (process.env as any)['domain-pricing-db'] || (process.env as any).PRICING_DB;
    
    const domain = request.nextUrl.searchParams.get('domain') || 'com';
    const order = request.nextUrl.searchParams.get('order') || 'new';
    
    console.log(`🔍 Debugging data source selection for ${domain}`);

    // 配置常量（从原代码复制）
    const DATA_SOURCE_CONFIG = {
      D1_PRIORITY: true,
      D1_FRESHNESS_THRESHOLD_HOURS: 24,
      ENABLE_SMART_FALLBACK: true,
      D1_TIMEOUT_MS: 5000
    };

    let debugInfo: any = {
      domain,
      order,
      config: DATA_SOURCE_CONFIG,
      d1Available: !!PRICING_DB,
      steps: []
    };

    // 步骤1: 检查D1是否可用
    debugInfo.steps.push({
      step: 1,
      name: 'Check D1 availability',
      d1Available: !!PRICING_DB,
      d1Priority: DATA_SOURCE_CONFIG.D1_PRIORITY,
      shouldTryD1: DATA_SOURCE_CONFIG.D1_PRIORITY && !!PRICING_DB
    });

    if (DATA_SOURCE_CONFIG.D1_PRIORITY && PRICING_DB) {
      // 步骤2: 尝试D1查询
      const d1StartTime = Date.now();
      let d1Result: any = null;
      let d1Error: any = null;

      try {
        console.log(`📊 Testing D1 query for ${domain}`);
        
        const query = `
          SELECT
            tld, registrar, registrar_name, registrar_url,
            registration_price, renewal_price, transfer_price,
            currency, currency_name, currency_type,
            has_promo, promo_code, updated_time, crawled_at
          FROM pricing_data
          WHERE tld = ? AND is_active = 1
          ORDER BY
            CASE
              WHEN ? = 'new' THEN registration_price
              WHEN ? = 'renew' THEN renewal_price
              WHEN ? = 'transfer' THEN transfer_price
              ELSE registration_price
            END ASC
        `;

        const result = await PRICING_DB.prepare(query)
          .bind(domain, order, order, order)
          .all();

        const queryTime = Date.now() - d1StartTime;
        
        if (result.results && result.results.length > 0) {
          // 检查数据新鲜度
          const latestRecord = result.results[0];
          const crawledAt = new Date(latestRecord.crawled_at);
          const hoursOld = (Date.now() - crawledAt.getTime()) / (1000 * 60 * 60);
          const isFresh = hoursOld <= DATA_SOURCE_CONFIG.D1_FRESHNESS_THRESHOLD_HOURS;

          d1Result = {
            success: true,
            recordCount: result.results.length,
            queryTime,
            dataAge: hoursOld,
            isFresh,
            lastCrawled: latestRecord.crawled_at,
            sampleRecord: result.results[0]
          };
        } else {
          d1Result = {
            success: false,
            recordCount: 0,
            queryTime,
            error: 'NO_DATA_FOUND'
          };
        }
      } catch (error: any) {
        const queryTime = Date.now() - d1StartTime;
        d1Error = {
          success: false,
          queryTime,
          error: error.message,
          isTimeout: error.message === 'D1_QUERY_TIMEOUT'
        };
      }

      debugInfo.steps.push({
        step: 2,
        name: 'D1 Query Test',
        result: d1Result,
        error: d1Error
      });

      // 步骤3: 数据源选择决策
      let decision: any = {
        selectedSource: 'unknown',
        reason: 'unknown'
      };

      if (d1Result && d1Result.success && d1Result.recordCount > 0) {
        if (d1Result.isFresh) {
          decision = {
            selectedSource: 'd1_fresh',
            reason: `D1 data is fresh (${d1Result.dataAge.toFixed(1)}h old, threshold: ${DATA_SOURCE_CONFIG.D1_FRESHNESS_THRESHOLD_HOURS}h)`,
            shouldUseD1: true
          };
        } else if (DATA_SOURCE_CONFIG.ENABLE_SMART_FALLBACK) {
          decision = {
            selectedSource: 'api_with_d1_fallback',
            reason: `D1 data is stale (${d1Result.dataAge.toFixed(1)}h old), trying API first with D1 fallback`,
            shouldUseD1: false,
            hasD1Fallback: true
          };
        } else {
          decision = {
            selectedSource: 'd1_only',
            reason: 'Smart fallback disabled, using D1 data regardless of age',
            shouldUseD1: true
          };
        }
      } else {
        decision = {
          selectedSource: 'api_primary',
          reason: d1Error ? `D1 query failed: ${d1Error.error}` : 'No D1 data found',
          shouldUseD1: false
        };
      }

      debugInfo.steps.push({
        step: 3,
        name: 'Data Source Decision',
        decision
      });

    } else {
      debugInfo.steps.push({
        step: 2,
        name: 'Skip D1',
        reason: !DATA_SOURCE_CONFIG.D1_PRIORITY ? 'D1 priority disabled' : 'D1 not available'
      });
    }

    // 步骤4: 模拟实际API调用的选择逻辑
    debugInfo.steps.push({
      step: 4,
      name: 'Actual API Behavior Analysis',
      note: 'Based on the actual API response you provided',
      actualResult: {
        source: 'nazhumi_primary',
        count: 5,
        expectedSource: debugInfo.steps.find((s: any) => s.step === 3)?.decision?.selectedSource || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      debugInfo,
      recommendations: [
        ...(debugInfo.d1Available ? [] : ['D1 database binding not available']),
        ...(debugInfo.steps.find((s: any) => s.step === 2)?.error ? ['D1 query failed - check database connection'] : []),
        ...(debugInfo.steps.find((s: any) => s.step === 3)?.decision?.shouldUseD1 ? ['D1 should be used but API was used instead - check smart selection logic'] : []),
        'Compare expected vs actual data source selection'
      ]
    });
    
  } catch (error) {
    console.error('Debug data source selection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});
