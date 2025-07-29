export interface TLDDetails {
  tld: string
  type: 'generic' | 'country' | 'sponsored' | 'second-level'
  category: string
  description: string
  status: 'active' | 'withdrawn' | 'retired'
  restrictions?: string
  usageExamples: string[]
  targetAudience: string[]
  priority: number
}

// TLD分类映射
const TLD_CATEGORIES = {
  '通用顶级域名 (gTLD)': {
    type: 'generic' as const,
    englishName: 'Generic Top-Level Domains',
    description: 'Generic top-level domains available for general registration',
    priority: 1
  },
  '国家代码顶级域名 (ccTLD)': {
    type: 'country' as const,
    englishName: 'Country Code Top-Level Domains',
    description: 'Country-specific top-level domains',
    priority: 2
  },
  '赞助/限制性顶级域名 (sTLD/rTLD)': {
    type: 'sponsored' as const,
    englishName: 'Sponsored Top-Level Domains',
    description: 'Sponsored top-level domains with specific requirements',
    priority: 3
  },
  '国家代码下的二级/三级域名': {
    type: 'second-level' as const,
    englishName: 'Second-Level Domains',
    description: 'Second and third level domains under country codes',
    priority: 4
  }
}

export class TLDManager {
  private static instance: TLDManager
  private tldData: Map<string, TLDDetails> = new Map()
  private categorizedTLDs: Map<string, TLDDetails[]> = new Map()
  private initialized = false

  static getInstance(): TLDManager {
    if (!TLDManager.instance) {
      TLDManager.instance = new TLDManager()
    }
    return TLDManager.instance
  }

  async initialize() {
    if (this.initialized) return

    // 从JSON文件加载TLD数据
    await this.loadTLDsFromJSON()
    this.initialized = true
  }

  private async loadTLDsFromJSON() {
    try {
      // 动态导入JSON文件
      const tldListData = await import('../../tld_list.json')
      const data = tldListData.default || tldListData
      
      Object.entries(data).forEach(([categoryName, tlds]) => {
        const categoryInfo = TLD_CATEGORIES[categoryName as keyof typeof TLD_CATEGORIES]
        if (!categoryInfo) return

        const categoryTLDs: TLDDetails[] = []

        tlds.forEach((tld: string) => {
          const tldDetails: TLDDetails = {
            tld: tld.startsWith('.') ? tld : `.${tld}`,
            type: categoryInfo.type,
            category: categoryInfo.englishName,
            description: this.generateTLDDescription(tld, categoryInfo.type),
            status: 'active',
            restrictions: this.getTLDRestrictions(tld, categoryInfo.type),
            usageExamples: this.generateUsageExamples(tld, categoryInfo.type),
            targetAudience: this.getTargetAudience(tld, categoryInfo.type),
            priority: categoryInfo.priority
          }

          this.tldData.set(tldDetails.tld, tldDetails)
          categoryTLDs.push(tldDetails)
        })

        this.categorizedTLDs.set(categoryInfo.englishName, categoryTLDs)
      })
    } catch (error) {
      console.error('Failed to load TLD data:', error)
      // 如果加载失败，使用一些基本的TLD数据
      this.loadFallbackTLDs()
    }
  }

  private loadFallbackTLDs() {
    const fallbackTLDs = [
      { tld: '.com', type: 'generic' as const, category: 'Generic Top-Level Domains', priority: 1 },
      { tld: '.net', type: 'generic' as const, category: 'Generic Top-Level Domains', priority: 1 },
      { tld: '.org', type: 'generic' as const, category: 'Generic Top-Level Domains', priority: 1 },
      { tld: '.us', type: 'country' as const, category: 'Country Code Top-Level Domains', priority: 2 },
      { tld: '.uk', type: 'country' as const, category: 'Country Code Top-Level Domains', priority: 2 },
    ]

    fallbackTLDs.forEach(({ tld, type, category, priority }) => {
      const tldDetails: TLDDetails = {
        tld,
        type,
        category,
        description: this.generateTLDDescription(tld, type),
        status: 'active',
        restrictions: this.getTLDRestrictions(tld, type),
        usageExamples: this.generateUsageExamples(tld, type),
        targetAudience: this.getTargetAudience(tld, type),
        priority
      }

      this.tldData.set(tld, tldDetails)
    })
  }

  private generateTLDDescription(tld: string, type: string): string {
    const cleanTld = tld.replace('.', '')
    
    switch (type) {
      case 'generic':
        return `The .${cleanTld} domain is a generic top-level domain suitable for various purposes.`
      case 'country':
        return `The .${cleanTld} domain is a country code top-level domain.`
      case 'sponsored':
        return `The .${cleanTld} domain is a sponsored top-level domain with specific registration requirements.`
      case 'second-level':
        return `The ${tld} domain is a second or third level domain under a country code.`
      default:
        return `The ${tld} domain extension.`
    }
  }

  private getTLDRestrictions(tld: string, type: string): string | undefined {
    if (type === 'sponsored') {
      return 'May have specific registration requirements or restrictions'
    }
    if (type === 'country') {
      return 'May require local presence or specific documentation'
    }
    if (type === 'second-level') {
      return 'Subject to the policies of the parent domain'
    }
    return undefined
  }

  private generateUsageExamples(tld: string, type: string): string[] {
    const cleanTld = tld.replace('.', '')
    const baseDomain = `example.${cleanTld}`
    
    switch (type) {
      case 'generic':
        return [`${baseDomain}`, `mysite.${cleanTld}`, `business.${cleanTld}`]
      case 'country':
        return [`${baseDomain}`, `company.${cleanTld}`, `local.${cleanTld}`]
      case 'sponsored':
        return [`${baseDomain}`, `organization.${cleanTld}`]
      case 'second-level':
        return [`example${tld}`, `mysite${tld}`]
      default:
        return [`${baseDomain}`]
    }
  }

  private getTargetAudience(tld: string, type: string): string[] {
    switch (type) {
      case 'generic':
        return ['Businesses', 'Individuals', 'Organizations', 'General Public']
      case 'country':
        return ['Local Businesses', 'Residents', 'Government', 'Local Organizations']
      case 'sponsored':
        return ['Specific Communities', 'Professional Organizations', 'Industry Groups']
      case 'second-level':
        return ['Regional Users', 'Local Services', 'Specific Purposes']
      default:
        return ['General Public']
    }
  }

  // 获取所有TLD
  async getAllTLDs(): Promise<TLDDetails[]> {
    await this.initialize()
    return Array.from(this.tldData.values())
  }

  // 按分类获取TLD
  async getTLDsByCategory(category?: string): Promise<TLDDetails[]> {
    await this.initialize()
    
    if (!category || category === 'all') {
      return this.getAllTLDs()
    }
    
    return this.categorizedTLDs.get(category) || []
  }

  // 获取所有分类
  getCategories(): string[] {
    return Array.from(this.categorizedTLDs.keys())
  }

  // 获取特定TLD详情
  async getTLDDetails(tld: string): Promise<TLDDetails | null> {
    await this.initialize()
    const normalizedTld = tld.startsWith('.') ? tld : `.${tld}`
    return this.tldData.get(normalizedTld) || null
  }

  // 搜索TLD
  async searchTLDs(query: string): Promise<TLDDetails[]> {
    await this.initialize()
    const allTLDs = await this.getAllTLDs()
    const lowerQuery = query.toLowerCase()
    
    return allTLDs.filter(tld => 
      tld.tld.toLowerCase().includes(lowerQuery) ||
      tld.description.toLowerCase().includes(lowerQuery) ||
      tld.category.toLowerCase().includes(lowerQuery)
    )
  }

  // 获取相关TLD（同类型的其他TLD）
  async getRelatedTLDs(tld: string, limit: number = 6): Promise<TLDDetails[]> {
    await this.initialize()
    const targetTLD = await this.getTLDDetails(tld)
    if (!targetTLD) return []

    const sameCategoryTLDs = await this.getTLDsByCategory(targetTLD.category)
    return sameCategoryTLDs
      .filter(t => t.tld !== targetTLD.tld)
      .slice(0, limit)
  }
}

// 导出单例实例
export const tldManager = TLDManager.getInstance()
