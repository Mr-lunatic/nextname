import { NextRequest } from 'next/server'
import { getAllSupportedTLDs } from '@/lib/tld-data'
import { queryWhois } from '@/lib/whois-service'

// 从搜索API导入注册商和价格函数
async function getTopRegistrars(tld: string) {
  try {
    // 调用智能数据源的pricing API
    const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseURL}/api/pricing?domain=${encodeURIComponent(tld)}&order=new&pageSize=3`);

    if (!response.ok) {
      console.warn(`Failed to fetch pricing for ${tld}, falling back to static data`);
      return []
    }

    const data = await response.json();

    if (data.pricing && Array.isArray(data.pricing)) {
      // 转换为搜索结果需要的格式
      return data.pricing.map((item: any) => ({
        registrar: item.registrar,
        registrarCode: item.registrarCode,
        registrationPrice: item.registrationPrice,
        renewalPrice: item.renewalPrice,
        transferPrice: item.transferPrice,
        currency: item.currency || 'USD',
        features: item.features || [],
        rating: item.rating || 4.0
      }));
    }

    return [];
  } catch (error) {
    console.error(`Error fetching pricing for ${tld}:`, error);
    return []
  }
}

function getEstimatedPrice(tld: string): number {
  // Return realistic pricing based on TLD
  const prices: { [key: string]: number } = {
    '.com': 12,
    '.net': 14,
    '.org': 13,
    '.io': 65,
    '.ai': 90,
    '.dev': 18,
    '.app': 20,
    '.me': 20,
    '.cc': 25,
    '.tv': 35,
    '.tech': 15,
    '.online': 8,
    '.site': 10,
    '.website': 12
  }
  return prices[tld] || 25
}

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

/**
 * 流式域名批量查询API
 * 使用Server-Sent Events实时推送查询结果
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type') || 'auto'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  if (!q) {
    return new Response('Query parameter is required', { status: 400 })
  }

  if (q.length > 64) {
    return new Response('Query is too long', { status: 400 })
  }

  const sanitizedQuery = q.replace(/[^a-zA-Z0-9.-]/g, '')
  
  // 只处理前缀查询
  if (type !== 'prefix' && (type !== 'auto' || sanitizedQuery.includes('.'))) {
    return new Response('This endpoint only supports prefix queries', { status: 400 })
  }

  // 设置SSE响应头
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  const encoder = new TextEncoder()
  
  // 创建可读流
  const stream = new ReadableStream({
    async start(controller) {
      const prefix = sanitizedQuery.replace(/^\./, '')
      
      try {
        // 获取所有支持的TLD
        const allTlds = await getAllSupportedTLDs()
        
        // 计算分页
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const totalTLDs = allTlds.length
        const totalPages = Math.ceil(totalTLDs / limit)
        
        // 获取当前页的TLD
        const currentPageTLDs = allTlds.slice(startIndex, endIndex)
        
        // 发送初始化信息
        const initData = {
          type: 'init',
          data: {
            query: sanitizedQuery,
            prefix,
            pagination: {
              current_page: page,
              per_page: limit,
              total_items: totalTLDs,
              total_pages: totalPages,
              has_next_page: page < totalPages,
              has_prev_page: page > 1
            }
          }
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initData)}\n\n`))
        
        // 逐个查询域名
        for (let i = 0; i < currentPageTLDs.length; i++) {
          const tld = currentPageTLDs[i]
          const domain = `${prefix}${tld.tld}`
          const startTime = Date.now()
          
          try {
            // 发送查询开始事件
            const startEvent = {
              type: 'query_start',
              data: {
                index: i,
                domain,
                tld: tld.tld,
                total: currentPageTLDs.length
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`))
            
            // 执行WHOIS查询
            const whoisResult = await queryWhois(domain)
            const queryTime = Date.now() - startTime
            
            // 获取注册商价格数据
            const topRegistrars = await getTopRegistrars(tld.tld)
            
            // 发送查询结果
            const resultEvent = {
              type: 'query_result',
              data: {
                index: i,
                domain,
                tld: tld.tld,
                is_available: whoisResult.is_available,
                registrar: whoisResult.registrar,
                expiry_date: whoisResult.expiry_date,
                query_method: whoisResult.query_method,
                query_time_ms: queryTime,
                market_share: tld.marketShare || 0,
                category: tld.category || 'generic',
                popularity: tld.popularity || 50,
                top_registrars: topRegistrars, // 添加注册商数据
                estimated_price: whoisResult.is_available ? getEstimatedPrice(tld.tld) : null
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(resultEvent)}\n\n`))
            
          } catch (error) {
            // 获取注册商数据即使在错误情况下也要提供
            const topRegistrars = await getTopRegistrars(tld.tld)
            
            // 发送查询错误
            const errorEvent = {
              type: 'query_error',
              data: {
                index: i,
                domain,
                tld: tld.tld,
                error: error instanceof Error ? error.message : 'Unknown error',
                query_time_ms: Date.now() - startTime,
                market_share: tld.marketShare || 0,
                category: tld.category || 'generic',
                popularity: tld.popularity || 50,
                top_registrars: topRegistrars, // 即使错误也提供注册商数据
                estimated_price: getEstimatedPrice(tld.tld)
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
          }
          
          // 发送进度更新
          const progressEvent = {
            type: 'progress',
            data: {
              completed: i + 1,
              total: currentPageTLDs.length,
              percentage: Math.round(((i + 1) / currentPageTLDs.length) * 100)
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressEvent)}\n\n`))
        }
        
        // 发送完成事件
        const completeEvent = {
          type: 'complete',
          data: {
            total_processed: currentPageTLDs.length,
            timestamp: new Date().toISOString()
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
        
        controller.close()
        
      } catch (error) {
        // 发送全局错误
        const globalErrorEvent = {
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(globalErrorEvent)}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, { headers })
}