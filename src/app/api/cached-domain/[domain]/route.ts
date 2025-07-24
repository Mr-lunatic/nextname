import { NextRequest, NextResponse } from 'next/server'
import { renderToString } from 'react-dom/server'
import { PageCache, PageCacheKeys, CacheTTL, initPageCache } from '@/lib/page-cache'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

// Domain page cache handler
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain.toLowerCase().trim()
  
  // Validate domain format
  if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return NextResponse.json(
      { error: 'Invalid domain format' }, 
      { status: 400 }
    )
  }

  try {
    // Initialize page cache with KV namespace
    const env = process.env as any
    const kvNamespace = env.PRICING_CACHE || env.PRICINGCACHE
    const pageCache = initPageCache(kvNamespace)

    // Check if caching is enabled
    const cacheEnabled = env.ENABLE_PAGE_CACHE !== 'false'
    const cacheKey = PageCacheKeys.domain(domain)

    console.log(`🔍 Processing domain page request: ${domain}`)

    // Try to get cached page first
    if (cacheEnabled && pageCache) {
      const cachedHtml = await pageCache.getPage(cacheKey)
      if (cachedHtml) {
        console.log(`✅ Cache HIT for domain: ${domain}`)
        return new Response(cachedHtml, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
            'X-Cache': 'HIT-KV',
            'X-Cache-Key': cacheKey
          }
        })
      }
      console.log(`❌ Cache MISS for domain: ${domain}`)
    }

    // Fetch domain data
    const domainData = await fetchDomainData(domain)
    
    if (!domainData) {
      return NextResponse.json(
        { error: 'Domain data not found' }, 
        { status: 404 }
      )
    }

    // Generate HTML page
    const html = await generateDomainPageHTML(domain, domainData)
    
    // Cache the generated HTML (async, don't block response)
    if (cacheEnabled && pageCache && html) {
      const metadata = {
        title: `${domain} - 域名查询结果`,
        description: `查看 ${domain} 的注册信息、价格对比和WHOIS详情`,
        keywords: `${domain},域名查询,WHOIS,域名价格`,
        lastModified: new Date().toISOString()
      }
      
      // Cache asynchronously
      pageCache.setPage(cacheKey, html, metadata, CacheTTL.DOMAIN_PAGE)
        .then(success => {
          if (success) {
            console.log(`✅ Cached domain page: ${domain}`)
          } else {
            console.log(`❌ Failed to cache domain page: ${domain}`)
          }
        })
        .catch(error => {
          console.error('Error caching domain page:', error)
        })
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
        'X-Generated': new Date().toISOString()
      }
    })

  } catch (error) {
    console.error(`❌ Error processing domain page ${domain}:`, error)
    
    return NextResponse.json({
      error: 'Failed to generate domain page',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Fetch domain data from existing API
async function fetchDomainData(domain: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/domain/${encodeURIComponent(domain)}`)
    
    if (!response.ok) {
      console.error(`Failed to fetch domain data: ${response.status}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching domain data:', error)
    return null
  }
}

// Generate complete HTML page for domain using search page UI
async function generateDomainPageHTML(domain: string, domainData: any): Promise<string> {
  // Create the complete HTML structure matching search page UI
  const isAvailable = domainData.is_available
  
  // Generate main content sections
  let domainInfoHTML = generateDomainInfoHTML(domain, isAvailable)
  let priceTableHTML = ''
  let whoisHTML = ''
  let otherExtensionsHTML = ''

  if (isAvailable) {
    priceTableHTML = generatePriceTableHTML(domain)
    otherExtensionsHTML = generateOtherExtensionsHTML(domain)
  } else {
    whoisHTML = generateWhoisHTML(domainData)
  }

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${domain} - 域名查询结果 | NextName</title>
    <meta name="description" content="查看 ${domain} 的注册信息、价格对比和WHOIS详情。找到最优价格，立即注册域名。">
    <meta name="keywords" content="${domain},域名查询,WHOIS,域名价格,域名注册">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${domain} - 域名查询结果">
    <meta property="og:description" content="查看 ${domain} 的注册信息、价格对比和WHOIS详情">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://nextname.app/domain/${domain}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${domain} - 域名查询结果">
    <meta name="twitter:description" content="查看 ${domain} 的注册信息、价格对比和WHOIS详情">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${domain} - 域名查询结果",
      "description": "查看 ${domain} 的注册信息、价格对比和WHOIS详情",
      "url": "https://nextname.app/domain/${domain}",
      "mainEntity": {
        "@type": "Product",
        "name": "${domain}",
        "category": "Domain Name",
        "offers": {
          "@type": "AggregateOffer",
          "availability": "${isAvailable ? 'InStock' : 'OutOfStock'}"
        }
      }
    }
    </script>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        :root {
            --color-surface-primary: #ffffff;
            --color-border-default: #e5e7eb;
            --color-foreground: #111827;
            --color-muted-foreground: #6b7280;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --color-surface-primary: #111827;
                --color-border-default: #374151;
                --color-foreground: #f9fafb;
                --color-muted-foreground: #9ca3af;
            }
        }
    </style>
</head>
<body class="min-h-screen" style="background-color: var(--color-surface-primary);">
    <!-- Header matching search page -->
    <header class="container-magazine py-4 relative z-10" style="border-bottom: 1px solid var(--color-border-default);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center backdrop-blur-sm">
                <div class="flex items-center space-x-3">
                    <a href="/" class="text-2xl font-bold" style="color: var(--color-foreground);">NextName</a>
                </div>
                <nav class="hidden md:flex space-x-6">
                    <a href="/search" style="color: var(--color-muted-foreground);" class="hover:opacity-80">域名搜索</a>
                    <a href="/tlds" style="color: var(--color-muted-foreground);" class="hover:opacity-80">所有后缀</a>
                    <a href="/about" style="color: var(--color-muted-foreground);" class="hover:opacity-80">关于我们</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Main Content matching search page layout -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Search Bar Placeholder -->
        <div class="mb-8">
            <div class="max-w-2xl mx-auto">
                <div class="relative">
                    <input type="text" 
                           value="${domain}" 
                           readonly
                           class="w-full px-4 py-3 pl-12 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" 
                           style="border-color: var(--color-border-default); background-color: var(--color-surface-primary); color: var(--color-muted-foreground);">
                    <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Domain Results Section -->
        <div class="space-y-8">
            ${domainInfoHTML}
            ${priceTableHTML}
            ${whoisHTML}
            ${otherExtensionsHTML}
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 class="text-lg font-semibold mb-4">NextName</h3>
                    <p class="text-gray-300">专业的域名搜索和价格比较平台</p>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">服务</h3>
                    <ul class="space-y-2 text-gray-300">
                        <li><a href="/search" class="hover:text-white">域名搜索</a></li>
                        <li><a href="/tlds" class="hover:text-white">所有后缀</a></li>
                        <li><a href="/pricing" class="hover:text-white">价格对比</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">支持</h3>
                    <ul class="space-y-2 text-gray-300">
                        <li><a href="/about" class="hover:text-white">关于我们</a></li>
                        <li><a href="/privacy" class="hover:text-white">隐私政策</a></li>
                        <li><a href="/terms" class="hover:text-white">服务条款</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
                <p>&copy; 2024 NextName. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('域名已复制到剪贴板！');
            });
        }
    </script>
</body>
</html>`

  return html
}

// Generate domain info section matching search page UI
function generateDomainInfoHTML(domain: string, isAvailable: boolean): string {
  return `
    <div class="border-l-4 ${isAvailable ? 'border-l-green-500' : 'border-l-red-500'} bg-white rounded-lg shadow-sm">
        <div class="p-6">
            <div class="flex items-center justify-between">
                <h3 class="font-semibold tracking-tight text-2xl font-mono" style="color: var(--color-foreground);">${domain}</h3>
                <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${
                      isAvailable 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }">
                        ${isAvailable ? '✓ 可注册' : '⚠ 已注册'}
                    </span>
                </div>
            </div>
        </div>
    </div>
  `
}

// Generate price comparison table HTML matching search page UI
function generatePriceTableHTML(domain: string): string {
  // Mock registrar prices matching search page data
  const mockRegistrarPrices = [
    {
      registrar: 'Cloudflare',
      registrationPrice: 8.57,
      renewalPrice: 8.57,
      transferPrice: 8.57,
      currency: 'USD',
      rating: 4.8,
      features: ['批发价格', '免费SSL', 'DNSSEC'],
      affiliateLink: 'https://cloudflare.com'
    },
    {
      registrar: 'Porkbun',
      registrationPrice: 9.13,
      renewalPrice: 11.98,
      transferPrice: 9.13,
      currency: 'USD',
      rating: 4.6,
      features: ['免费WHOIS隐私', '免费SSL', 'API访问'],
      affiliateLink: 'https://porkbun.com'
    },
    {
      registrar: 'Namecheap',
      registrationPrice: 10.69,
      renewalPrice: 13.99,
      transferPrice: 10.69,
      currency: 'USD',
      rating: 4.5,
      features: ['免费WHOIS隐私', 'DNS管理', '邮箱转发'],
      affiliateLink: 'https://namecheap.com'
    },
    {
      registrar: 'Google Domains',
      registrationPrice: 12.00,
      renewalPrice: 12.00,
      transferPrice: 12.00,
      currency: 'USD',
      rating: 4.3,
      features: ['Google集成', '免费隐私保护', '简洁界面'],
      affiliateLink: 'https://domains.google'
    },
    {
      registrar: 'GoDaddy',
      registrationPrice: 12.99,
      renewalPrice: 17.99,
      transferPrice: 12.99,
      currency: 'USD',
      specialOffer: '首年特价',
      rating: 4.2,
      features: ['免费WHOIS隐私', '24/7客服', '域名转发'],
      affiliateLink: 'https://godaddy.com'
    }
  ].sort((a, b) => a.registrationPrice - b.registrationPrice)

  return `
    <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div class="p-6 border-b">
            <h2 class="text-xl font-semibold flex items-center" style="color: var(--color-foreground);">
                <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                注册商价格对比
            </h2>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="border-b">
                    <tr>
                        <th class="text-left py-3 px-4" style="color: var(--color-foreground);">注册商</th>
                        <th class="text-center py-3 px-4" style="color: var(--color-foreground);">首年注册</th>
                        <th class="text-center py-3 px-4" style="color: var(--color-foreground);">续费价格</th>
                        <th class="text-center py-3 px-4" style="color: var(--color-foreground);">转入价格</th>
                        <th class="text-center py-3 px-4" style="color: var(--color-foreground);">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${mockRegistrarPrices.map((price, index) => `
                    <tr class="border-b hover:bg-gray-50 ${index === 0 ? 'bg-green-50' : ''}">
                        <td class="py-4 px-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                    <span class="text-xs font-bold">${price.registrar.slice(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                    <div class="font-semibold" style="color: var(--color-foreground);">${price.registrar}</div>
                                    ${price.specialOffer ? `<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">${price.specialOffer}</span>` : ''}
                                </div>
                            </div>
                        </td>
                        <td class="text-center py-4 px-4">
                            <div class="font-bold text-lg" style="color: var(--color-foreground);">
                                $${price.registrationPrice}
                                ${index === 0 ? '<span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">最低价</span>' : ''}
                            </div>
                        </td>
                        <td class="text-center py-4 px-4">
                            <span style="color: var(--color-muted-foreground);">$${price.renewalPrice}</span>
                        </td>
                        <td class="text-center py-4 px-4">
                            <span style="color: var(--color-muted-foreground);">$${price.transferPrice}</span>
                        </td>
                        <td class="text-center py-4 px-4">
                            <a href="${price.affiliateLink}" target="_blank" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded ${index === 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                                注册
                            </a>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
  `
}

// Generate WHOIS information HTML matching search page UI  
function generateWhoisHTML(domainData: any): string {
  return `
    <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center" style="color: var(--color-foreground);">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            WHOIS 信息
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium" style="color: var(--color-muted-foreground);">注册商</label>
                    <p class="mt-1 text-sm" style="color: var(--color-foreground);">${domainData.registrar || 'N/A'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium" style="color: var(--color-muted-foreground);">注册日期</label>
                    <p class="mt-1 text-sm" style="color: var(--color-foreground);">${domainData.created_date ? new Date(domainData.created_date).toLocaleDateString('zh-CN') : 'N/A'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium" style="color: var(--color-muted-foreground);">到期日期</label>
                    <p class="mt-1 text-sm" style="color: var(--color-foreground);">${domainData.expiry_date ? new Date(domainData.expiry_date).toLocaleDateString('zh-CN') : 'N/A'}</p>
                </div>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium" style="color: var(--color-muted-foreground);">域名状态</label>
                    <div class="mt-1">
                        ${domainData.status && domainData.status.length > 0 ? 
                          domainData.status.map((status: string) => 
                            `<span class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1">${status}</span>`
                          ).join('') : 
                          '<p class="text-sm" style="color: var(--color-foreground);">N/A</p>'
                        }
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium" style="color: var(--color-muted-foreground);">域名服务器</label>
                    <div class="mt-1">
                        ${domainData.name_servers && domainData.name_servers.length > 0 ? 
                          domainData.name_servers.map((ns: string) => 
                            `<p class="text-sm" style="color: var(--color-foreground);">${ns}</p>`
                          ).join('') : 
                          '<p class="text-sm" style="color: var(--color-foreground);">N/A</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
}

// Generate other extensions section matching search page UI
function generateOtherExtensionsHTML(domain: string): string {
  const [name] = domain.split('.')
  const otherExtensions = [
    { tld: '.net', available: true, price: 12.99 },
    { tld: '.org', available: true, price: 13.99 },
    { tld: '.io', available: false, price: 39.99 },
    { tld: '.co', available: true, price: 29.99 },
    { tld: '.app', available: true, price: 19.99 }
  ]

  return `
    <div class="bg-white rounded-lg shadow-sm border">
        <div class="p-6 border-b">
            <h2 class="text-xl font-semibold flex items-center" style="color: var(--color-foreground);">
                <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                其它后缀可用性
            </h2>
        </div>
        <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                ${otherExtensions.map(ext => `
                <div class="p-4 border rounded-lg hover:shadow-md transition-all duration-200 ${ext.available ? 'hover:border-green-300' : 'hover:border-red-300'}">
                    <div class="flex items-center justify-between">
                        <span class="font-mono font-semibold" style="color: var(--color-foreground);">${name}${ext.tld}</span>
                        <span class="text-xs px-2 py-1 rounded ${ext.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${ext.available ? '✓ 可注册' : '✗ 已注册'}
                        </span>
                    </div>
                    <div class="mt-2 text-sm" style="color: var(--color-muted-foreground);">
                        ${ext.available ? `价格: $${ext.price}` : '查看详情'}
                    </div>
                    ${ext.available ? `
                    <a href="https://cloudflare.com" target="_blank" class="mt-2 inline-block w-full text-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                        立即注册
                    </a>
                    ` : `
                    <a href="/domain/${encodeURIComponent(name + ext.tld)}" class="mt-2 inline-block w-full text-center px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                        查看WHOIS
                    </a>
                    `}
                </div>
                `).join('')}
            </div>
        </div>
    </div>
  `
}