// API Performance Monitoring Tool
// This would be used to test and monitor API endpoint performance

export interface APIPerformanceResult {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  cacheHit: boolean
  error?: string
  timestamp: number
}

export class APIPerformanceMonitor {
  private results: APIPerformanceResult[] = []
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  async testEndpoint(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<APIPerformanceResult> {
    const startTime = Date.now()
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      console.log(`🔍 Testing ${method} ${url}`)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime
      const data = await response.json()
      
      const result: APIPerformanceResult = {
        endpoint,
        method,
        responseTime,
        statusCode: response.status,
        cacheHit: data.cached || false,
        timestamp: startTime
      }

      this.results.push(result)
      
      console.log(`${response.ok ? '✅' : '❌'} ${method} ${endpoint}: ${responseTime}ms (${response.status})${data.cached ? ' [CACHED]' : ''}`)
      
      return result

    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      const result: APIPerformanceResult = {
        endpoint,
        method,
        responseTime,
        statusCode: 0,
        cacheHit: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: startTime
      }

      this.results.push(result)
      console.error(`❌ ${method} ${endpoint}: ${error}`)
      
      return result
    }
  }

  async runPerformanceTests(): Promise<void> {
    console.log('🚀 Starting API Performance Tests...\n')
    
    // Test TLD endpoint (should be fast with caching)
    await this.testEndpoint('/api/tlds')
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Test again to check cache
    await this.testEndpoint('/api/tlds')
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Test domain endpoints with various scenarios
    const testDomains = [
      'google.com',    // Popular, likely cached
      'example.com',   // Common test domain
      'nonexistent-domain-12345.com', // Should be fast (available)
      'test.io',       // Different TLD
      'api.dev'        // Tech domain
    ]
    
    for (const domain of testDomains) {
      await this.testEndpoint(`/api/domain/${domain}`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Test search endpoints
    const searchQueries = [
      { q: 'test', type: 'prefix' },
      { q: 'example.com', type: 'domain' },
      { q: '.com', type: 'suffix' }
    ]
    
    for (const query of searchQueries) {
      await this.testEndpoint(`/api/search?q=${encodeURIComponent(query.q)}&type=${query.type}`)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    this.generateReport()
  }

  private generateReport(): void {
    console.log('\n📊 API Performance Report')
    console.log('='.repeat(50))
    
    const groupedResults = this.groupResultsByEndpoint()
    
    for (const [endpoint, results] of Object.entries(groupedResults)) {
      const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      const minTime = Math.min(...results.map(r => r.responseTime))
      const maxTime = Math.max(...results.map(r => r.responseTime))
      const successRate = (results.filter(r => r.statusCode === 200).length / results.length) * 100
      const cacheHitRate = (results.filter(r => r.cacheHit).length / results.length) * 100
      
      console.log(`\n🔗 ${endpoint}`)
      console.log(`   Tests: ${results.length}`)
      console.log(`   Avg Response Time: ${Math.round(avgTime)}ms`)
      console.log(`   Min/Max: ${minTime}ms / ${maxTime}ms`)
      console.log(`   Success Rate: ${Math.round(successRate)}%`)
      console.log(`   Cache Hit Rate: ${Math.round(cacheHitRate)}%`)
      
      // Performance evaluation
      if (avgTime < 500) {
        console.log(`   Performance: ✅ Excellent`)
      } else if (avgTime < 1000) {
        console.log(`   Performance: 🟡 Good`)
      } else if (avgTime < 2000) {
        console.log(`   Performance: 🟠 Fair`)
      } else {
        console.log(`   Performance: 🔴 Needs Improvement`)
      }
    }
    
    this.generateSummary()
  }

  private groupResultsByEndpoint(): { [key: string]: APIPerformanceResult[] } {
    return this.results.reduce((acc, result) => {
      const key = result.endpoint.split('?')[0] // Remove query params for grouping
      if (!acc[key]) acc[key] = []
      acc[key].push(result)
      return acc
    }, {} as { [key: string]: APIPerformanceResult[] })
  }

  private generateSummary(): void {
    const totalTests = this.results.length
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests
    const successfulTests = this.results.filter(r => r.statusCode === 200).length
    const cachedResponses = this.results.filter(r => r.cacheHit).length
    
    console.log('\n📈 Overall Summary')
    console.log('-'.repeat(30))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Success Rate: ${Math.round((successfulTests / totalTests) * 100)}%`)
    console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`)
    console.log(`Cache Hit Rate: ${Math.round((cachedResponses / totalTests) * 100)}%`)
    
    // Performance recommendations
    console.log('\n💡 Recommendations:')
    if (avgResponseTime > 2000) {
      console.log('   - Consider implementing more aggressive caching')
      console.log('   - Optimize slow database queries')
      console.log('   - Add CDN for static responses')
    } else if (avgResponseTime > 1000) {
      console.log('   - Monitor for potential bottlenecks')
      console.log('   - Consider pre-warming cache for popular queries')
    } else {
      console.log('   - Performance is within acceptable range')
      console.log('   - Continue monitoring for any degradation')
    }
    
    if (cachedResponses / totalTests < 0.3) {
      console.log('   - Cache hit rate could be improved')
      console.log('   - Consider longer TTL for stable data')
    }
  }

  getResults(): APIPerformanceResult[] {
    return [...this.results]
  }

  clearResults(): void {
    this.results = []
  }
}

// Usage example:
export async function runAPIPerformanceCheck(baseUrl?: string): Promise<APIPerformanceResult[]> {
  const monitor = new APIPerformanceMonitor(baseUrl)
  await monitor.runPerformanceTests()
  return monitor.getResults()
}

export default APIPerformanceMonitor