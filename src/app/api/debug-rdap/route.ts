import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// RDAP诊断工具 - 用于调试RDAP查询问题
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 })
  }

  const tld = domain.split('.').pop()?.toLowerCase()
  if (!tld) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  const diagnostics = {
    domain,
    tld,
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {} as any
  }

  // 测试IANA Bootstrap
  try {
    console.log(`🔍 Testing IANA Bootstrap for ${domain}`)
    const bootstrapResponse = await fetch('https://data.iana.org/rdap/dns.json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      }
    })
    
    if (bootstrapResponse.ok) {
      const bootstrapData = await bootstrapResponse.json()
      let foundServers: string[] = []
      
      if (bootstrapData.services) {
        for (const service of bootstrapData.services) {
          const [serviceTlds, rdapServers] = service
          if (Array.isArray(serviceTlds) && serviceTlds.includes(tld)) {
            foundServers = rdapServers || []
            break
          }
        }
      }
      
      diagnostics.tests.push({
        test: 'IANA Bootstrap',
        status: 'success',
        servers: foundServers,
        message: foundServers.length > 0 ? `Found ${foundServers.length} RDAP servers` : 'No RDAP servers found for this TLD'
      })
    } else {
      diagnostics.tests.push({
        test: 'IANA Bootstrap',
        status: 'failed',
        error: `HTTP ${bootstrapResponse.status}: ${bootstrapResponse.statusText}`
      })
    }
  } catch (error) {
    diagnostics.tests.push({
      test: 'IANA Bootstrap',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // 测试常见RDAP服务器
  const commonServers = [
    `https://rdap.nic.${tld}/`,
    `https://rdap.${tld}/`,
    'https://rdap.verisign.com/',
    'https://rdap.iana.org/'
  ]

  for (const server of commonServers) {
    try {
      console.log(`🔍 Testing RDAP server: ${server}`)
      const rdapUrl = `${server}domain/${domain}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(rdapUrl, {
        headers: {
          'Accept': 'application/rdap+json',
          'User-Agent': 'Domain-Search-Platform/1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const testResult: any = {
        test: `RDAP Server: ${server}`,
        url: rdapUrl,
        status: response.ok ? 'success' : 'failed',
        httpStatus: response.status,
        statusText: response.statusText
      }
      
      if (response.ok) {
        try {
          const data = await response.json()
          testResult.hasValidData = !!data.objectClassName
          testResult.objectClassName = data.objectClassName
          testResult.hasEvents = !!(data.events && data.events.length > 0)
          testResult.hasEntities = !!(data.entities && data.entities.length > 0)
          testResult.hasStatus = !!(data.status && data.status.length > 0)
        } catch (jsonError) {
          testResult.jsonError = 'Failed to parse JSON response'
        }
      } else if (response.status === 404) {
        testResult.message = 'Domain not found (likely available)'
      } else {
        try {
          const errorText = await response.text()
          testResult.errorBody = errorText.substring(0, 200) // Limit error text
        } catch (e) {
          testResult.errorBody = 'Could not read error response'
        }
      }
      
      diagnostics.tests.push(testResult)
      
    } catch (error) {
      diagnostics.tests.push({
        test: `RDAP Server: ${server}`,
        url: `${server}domain/${domain}`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // 总结
  const successfulTests = diagnostics.tests.filter(t => t.status === 'success')
  const failedTests = diagnostics.tests.filter(t => t.status === 'failed')
  const errorTests = diagnostics.tests.filter(t => t.status === 'error')

  diagnostics.summary = {
    totalTests: diagnostics.tests.length,
    successful: successfulTests.length,
    failed: failedTests.length,
    errors: errorTests.length,
    recommendation: successfulTests.length > 0 
      ? 'RDAP queries should work for this domain'
      : 'RDAP queries may fail - check network connectivity and server availability'
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}
