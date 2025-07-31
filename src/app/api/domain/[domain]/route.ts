import { NextRequest, NextResponse } from 'next/server'
import { domainCache, CacheKeys } from '@/lib/cache'
import { queryWhois, WhoisError } from '@/lib/whois-service'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

// 缓存配置
const CACHE_DURATION = 15 * 60 * 1000 // 15分钟缓存

/**
 * 获取域名信息的API端点
 * 使用统一的WHOIS查询服务
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const startTime = Date.now()
  const domain = params.domain.toLowerCase().trim()

  // 基本域名验证
  if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return NextResponse.json(
      { 
        error: 'Invalid domain format',
        domain,
        timestamp: new Date().toISOString()
      }, 
      { status: 400 }
    )
  }

  console.log(`🔍 Domain query request: ${domain}`)

  try {
    // 检查缓存
    const cacheKey = CacheKeys.domain(domain)
    const cachedResult = domainCache.get(cacheKey)
    
    if (cachedResult) {
      console.log(`✅ Cache hit for ${domain}`)
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        cache_hit: true,
        timestamp: new Date().toISOString()
      })
    }

    // 使用统一的WHOIS查询服务
    console.log(`📡 Querying WHOIS for ${domain}`)
    const whoisResult = await queryWhois(domain)
    
    // 构建响应数据
    const responseData = {
      domain: whoisResult.domain,
      is_available: whoisResult.is_available,
      registrar: whoisResult.registrar,
      registrar_whois_server: whoisResult.registrar_whois_server,
      registrar_url: whoisResult.registrar_url,
      created_date: whoisResult.created_date,
      updated_date: whoisResult.updated_date,
      expiry_date: whoisResult.expiry_date,
      status: whoisResult.status || [],
      name_servers: whoisResult.name_servers || [],
      dnssec: whoisResult.dnssec || 'unknown',
      registrar_abuse_contact_email: whoisResult.registrar_abuse_contact_email,
      registrar_abuse_contact_phone: whoisResult.registrar_abuse_contact_phone,
      registry_domain_id: whoisResult.registry_domain_id,
      last_update_of_whois_database: whoisResult.last_update_of_whois_database,
      whois_raw: whoisResult.whois_raw,
      query_method: whoisResult.query_method,
      query_time_ms: whoisResult.query_time_ms,
      cached: false,
      cache_hit: false,
      timestamp: new Date().toISOString(),
      total_request_time: Date.now() - startTime
    }

    // 缓存结果
    domainCache.set(cacheKey, responseData, CACHE_DURATION)
    console.log(`✅ WHOIS query successful for ${domain} via ${whoisResult.query_method} (${whoisResult.query_time_ms}ms)`)

    return NextResponse.json(responseData)

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ Domain query failed for ${domain}:`, error)

    // 处理WHOIS错误
    if (error instanceof WhoisError) {
      const errorResponse = {
        error: error.message,
        error_code: error.code,
        domain: error.domain,
        details: error.details,
        query_time_ms: totalTime,
        timestamp: new Date().toISOString(),
        cached: false,
        cache_hit: false
      }

      // 根据错误类型返回不同的HTTP状态码
      let statusCode = 500
      switch (error.code) {
        case 'INVALID_DOMAIN':
          statusCode = 400
          break
        case 'TIMEOUT':
        case 'NETWORK_ERROR':
        case 'SERVICE_UNAVAILABLE':
          statusCode = 503
          break
        case 'NO_DATA':
          statusCode = 404
          break
        case 'PARSE_ERROR':
          statusCode = 502
          break
        default:
          statusCode = 500
      }

      return NextResponse.json(errorResponse, { status: statusCode })
    }

    // 处理其他未知错误
    return NextResponse.json(
      {
        error: 'Internal server error occurred while querying domain information',
        domain,
        query_time_ms: totalTime,
        timestamp: new Date().toISOString(),
        cached: false,
        cache_hit: false
      },
      { status: 500 }
    )
  }
}

/**
 * 处理POST请求（可选：用于批量查询或特殊参数）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const body = await request.json()
    const { force_refresh = false } = body

    const domain = params.domain.toLowerCase().trim()

    // 如果强制刷新，清除缓存
    if (force_refresh) {
      const cacheKey = CacheKeys.domain(domain)
      domainCache.delete(cacheKey)
      console.log(`🗑️ Cache cleared for ${domain}`)
    }

    // 重定向到GET请求
    return GET(request, { params })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Invalid request body',
        timestamp: new Date().toISOString()
      }, 
      { status: 400 }
    )
  }
}
