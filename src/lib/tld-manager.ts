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

// TLD分类映射 - 根据tld_list.json的实际分类
const TLD_CATEGORIES = {
  'gTLD': {
    type: 'generic' as const,
    englishName: 'Generic Top-Level Domains (gTLD)',
    description: 'Generic top-level domains available for general registration',
    priority: 1
  },
  'ccTLD': {
    type: 'country' as const,
    englishName: 'Country Code Top-Level Domains (ccTLD)',
    description: 'Country-specific top-level domains',
    priority: 2
  },
  'sTLD/rTLD': {
    type: 'sponsored' as const,
    englishName: 'Sponsored/Restricted Top-Level Domains (sTLD/rTLD)',
    description: 'Sponsored top-level domains with specific requirements',
    priority: 3
  },
  '国家代码下二级/三级域名': {
    type: 'second-level' as const,
    englishName: 'Second/Third Level Domains',
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
        return `Generic top-level domain suitable for businesses, organizations, and individuals worldwide.`
      case 'country':
        return `Country code top-level domain for specific geographic regions.`
      case 'sponsored':
        return `Sponsored top-level domain with specific registration requirements and restrictions.`
      case 'second-level':
        return `Second or third level domain under a country code with regional focus.`
      default:
        return `Domain extension for specific purposes.`
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

  // 获取所有TLD，优先展示gTLD
  async getAllTLDs(): Promise<TLDDetails[]> {
    await this.initialize()
    const allTLDs = Array.from(this.tldData.values())

    // 按优先级排序，gTLD优先
    return allTLDs.sort((a, b) => {
      // 首先按优先级排序（数字越小优先级越高）
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // 同优先级内按字母顺序排序
      return a.tld.localeCompare(b.tld)
    })
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
