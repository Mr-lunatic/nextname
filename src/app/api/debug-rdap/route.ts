import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Enhanced RDAP diagnostic tool - 用于调试RDAP查询问题
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
    summary: {} as any,
    recommendations: [] as string[]
  }

  // Enhanced fallback servers for testing
  const enhancedFallbackServers = [
    `https://rdap.nic.${tld}/`,
    `https://rdap.${tld}/`,
    `https://rdap.registry.${tld}/`,
    `https://whois.nic.${tld}/rdap/`,
    `https://rdap-${tld}.nic/`,
    `https://tld-rdap.${tld}/`,
    `https://rdap.${tld}.registry/`,
    `https://${tld}.rdap.nic/`,
    `https://registry.${tld}/rdap/`,
    'https://rdap.centralnic.com/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.afilias.info/rdap/afilias/',
    'https://rdap.uniregistry.net/',
    'https://rdap.gmo-registry.com/rdap/',
    'https://rdap.donuts.domains/',
    'https://rdap.verisign.com/',
    'https://rdap.publicinterestregistry.org/',
    'https://rdap.iana.org/',
    `https://rdap.dns.${tld}/`,
    `https://whois.${tld}/rdap/`,
    `https://registry.${tld}/rdap/`
  ]

  // Test 1: IANA Bootstrap
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
        message: foundServers.length > 0 ? `Found ${foundServers.length} official RDAP servers` : 'No official RDAP servers found for this TLD',
        responseTime: 'N/A'
      })

      if (foundServers.length === 0) {
        diagnostics.recommendations.push(`No official RDAP servers found for .${tld} - will rely on fallback servers`)
      }
    } else {
      diagnostics.tests.push({
        test: 'IANA Bootstrap',
        status: 'failed',
        error: `HTTP ${bootstrapResponse.status}: ${bootstrapResponse.statusText}`,
        responseTime: 'N/A'
      })
      diagnostics.recommendations.push('IANA Bootstrap failed - using enhanced fallback server patterns')
    }
  } catch (error) {
    diagnostics.tests.push({
      test: 'IANA Bootstrap',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: 'N/A'
    })
    diagnostics.recommendations.push('IANA Bootstrap error - check network connectivity')
  }

  // Test 2: Enhanced RDAP servers with response time measurement
  const testPromises = enhancedFallbackServers.map(async (server) => {
    const startTime = Date.now()
    try {
      console.log(`🔍 Testing RDAP server: ${server}`)
      const rdapUrl = `${server}domain/${domain}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(rdapUrl, {
        headers: {
          'Accept': 'application/rdap+json',
          'User-Agent': 'Domain-Search-Platform/1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      const testResult: any = {
        test: `RDAP Server: ${server}`,
        url: rdapUrl,
        status: response.ok ? 'success' : 'failed',
        httpStatus: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`
      }
      
      if (response.ok) {
        try {
          const data = await response.json()
          testResult.hasValidData = !!data.objectClassName
          testResult.objectClassName = data.objectClassName
          testResult.hasEvents = !!(data.events && data.events.length > 0)
          testResult.hasEntities = !!(data.entities && data.entities.length > 0)
          testResult.hasStatus = !!(data.status && data.status.length > 0)
          testResult.eventsCount = data.events?.length || 0
          testResult.entitiesCount = data.entities?.length || 0
          testResult.statusCount = data.status?.length || 0
          
          // Extract registrar info for testing
          if (data.entities) {
            const registrarEntity = data.entities.find((entity: any) => 
              entity.roles && entity.roles.includes('registrar')
            )
            if (registrarEntity && registrarEntity.vcardArray) {
              const fnField = registrarEntity.vcardArray[1]?.find((item: any) => item[0] === 'fn')
              if (fnField && fnField[3]) {
                testResult.registrarName = fnField[3]
              }
            }
          }
          
          // Quality score based on data completeness
          let qualityScore = 0
          if (data.objectClassName === 'domain') qualityScore += 25
          if (data.events && data.events.length > 0) qualityScore += 25
          if (data.entities && data.entities.length > 0) qualityScore += 25
          if (data.status && data.status.length > 0) qualityScore += 25
          testResult.qualityScore = `${qualityScore}%`
          
        } catch (jsonError) {
          testResult.jsonError = 'Failed to parse JSON response'
          testResult.qualityScore = '0%'
        }
      } else if (response.status === 404) {
        testResult.message = 'Domain not found (likely available)'
        testResult.qualityScore = '100%' // 404 is a valid response for available domains
      } else if (response.status === 429) {
        testResult.message = 'Rate limited - server is responding but throttling requests'
        testResult.qualityScore = 'N/A'
      } else if (response.status >= 500) {
        testResult.message = 'Server error - temporary issue'
        testResult.qualityScore = '0%'
      } else {
        try {
          const errorText = await response.text()
          testResult.errorBody = errorText.substring(0, 200) // Limit error text
          testResult.qualityScore = '0%'
        } catch (e) {
          testResult.errorBody = 'Could not read error response'
          testResult.qualityScore = '0%'
        }
      }
      
      return testResult
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        test: `RDAP Server: ${server}`,
        url: `${server}domain/${domain}`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms (timeout/error)`,
        qualityScore: '0%'
      }
    }
  })

  // Wait for all tests to complete
  const testResults = await Promise.allSettled(testPromises)
  
  // Process test results
  testResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      diagnostics.tests.push(result.value)
    } else {
      diagnostics.tests.push({
        test: 'RDAP Server Test',
        status: 'error',
        error: result.reason?.message || 'Test failed',
        responseTime: 'N/A',
        qualityScore: '0%'
      })
    }
  })

  // Analysis and recommendations
  const successfulTests = diagnostics.tests.filter(t => t.status === 'success')
  const failedTests = diagnostics.tests.filter(t => t.status === 'failed')
  const errorTests = diagnostics.tests.filter(t => t.status === 'error')
  const rdapTests = diagnostics.tests.filter(t => t.test.startsWith('RDAP Server:'))
  const workingServers = rdapTests.filter(t => t.status === 'success')
  const fastServers = workingServers.filter(t => parseInt(t.responseTime) < 2000) // Under 2 seconds

  diagnostics.summary = {
    totalTests: diagnostics.tests.length,
    successful: successfulTests.length,
    failed: failedTests.length,
    errors: errorTests.length,
    rdapServersTotal: rdapTests.length,
    rdapServersWorking: workingServers.length,
    rdapServersFast: fastServers.length,
    averageResponseTime: workingServers.length > 0 
      ? Math.round(workingServers.reduce((sum, test) => sum + parseInt(test.responseTime), 0) / workingServers.length)
      : 'N/A',
    bestServer: workingServers.length > 0
      ? workingServers.sort((a, b) => {
          const scoreA = parseInt(a.qualityScore) || 0
          const scoreB = parseInt(b.qualityScore) || 0
          if (scoreA === scoreB) {
            return parseInt(a.responseTime) - parseInt(b.responseTime)
          }
          return scoreB - scoreA
        })[0]
      : null
  }

  // Generate specific recommendations
  if (workingServers.length === 0) {
    diagnostics.recommendations.push(`❌ No working RDAP servers found for .${tld} - domain queries will rely on HTTP fallback`)
    diagnostics.recommendations.push('Consider adding this TLD to the fallback server mapping')
  } else if (workingServers.length < 3) {
    diagnostics.recommendations.push(`⚠️ Only ${workingServers.length} working RDAP server(s) found - limited redundancy`)
    diagnostics.recommendations.push('Consider testing additional server patterns for better reliability')
  } else {
    diagnostics.recommendations.push(`✅ Found ${workingServers.length} working RDAP servers - good redundancy`)
  }

  if (fastServers.length > 0) {
    diagnostics.recommendations.push(`🚀 ${fastServers.length} fast servers (< 2s response time) available`)
  } else if (workingServers.length > 0) {
    diagnostics.recommendations.push(`⏰ All working servers are slow (> 2s) - consider increasing timeout for .${tld}`)
  }

  if (diagnostics.summary.bestServer) {
    const best = diagnostics.summary.bestServer
    diagnostics.recommendations.push(`🏆 Best server: ${best.test.replace('RDAP Server: ', '')} (${best.qualityScore} quality, ${best.responseTime})`)
  }

  // Specific TLD recommendations
  const govTlds = ['gov', 'mil', 'edu']
  const countryTlds = ['cn', 'ru', 'in', 'br', 'za', 'eg', 'ng', 'bd', 'pk']
  
  if (govTlds.includes(tld)) {
    diagnostics.recommendations.push(`ℹ️ .${tld} is a government TLD - typically slower, consider 15s timeout`)
  } else if (countryTlds.includes(tld)) {
    diagnostics.recommendations.push(`🌍 .${tld} is a country TLD - may be geographically distant, consider 12s timeout`)
  }

  // Final assessment
  if (successfulTests.length > 0) {
    diagnostics.summary.recommendation = 'RDAP queries should work for this domain'
    diagnostics.summary.confidence = workingServers.length >= 3 ? 'High' : workingServers.length >= 1 ? 'Medium' : 'Low'
  } else {
    diagnostics.summary.recommendation = 'RDAP queries will likely fail - domain info will use HTTP fallback verification'
    diagnostics.summary.confidence = 'Low'
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}