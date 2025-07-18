import { getAllSupportedTLDs } from './tld-data'

export interface TLDDetails {
  tld: string
  type: 'generic' | 'country' | 'sponsored' | 'infrastructure'
  registry: string
  launchedDate?: string
  registrationPolicy: string
  restrictions?: string
  dnssecSupport: boolean
  idnSupport: boolean
  status: 'active' | 'withdrawn' | 'retired'
  popularityScore: number
  averagePrice?: number
  description: string
  usageExamples: string[]
  targetAudience: string[]
  pros: string[]
  cons: string[]
}

export interface TLDPricing {
  registrar: string
  registrationPrice: number
  renewalPrice: number
  transferPrice: number
  currency: string
  features: string[]
  rating: number
}

export class TLDManager {
  private static instance: TLDManager
  private tldData: Map<string, TLDDetails> = new Map()
  private initialized = false

  static getInstance(): TLDManager {
    if (!TLDManager.instance) {
      TLDManager.instance = new TLDManager()
    }
    return TLDManager.instance
  }

  async initialize() {
    if (this.initialized) return

    const supportedTLDs = await getAllSupportedTLDs()
    
    // 增强TLD数据
    for (const tld of supportedTLDs) {
      const enhancedData = this.enhanceTLDData(tld.tld)
      this.tldData.set(tld.tld, enhancedData)
    }

    this.initialized = true
  }

  private enhanceTLDData(tld: string): TLDDetails {
    const tldInfo = this.getTLDInfo(tld)
    
    return {
      tld,
      type: tldInfo.type,
      registry: tldInfo.registry,
      launchedDate: tldInfo.launchedDate,
      registrationPolicy: tldInfo.registrationPolicy,
      restrictions: tldInfo.restrictions,
      dnssecSupport: tldInfo.dnssecSupport,
      idnSupport: tldInfo.idnSupport,
      status: 'active',
      popularityScore: tldInfo.popularityScore,
      averagePrice: tldInfo.averagePrice,
      description: tldInfo.description,
      usageExamples: tldInfo.usageExamples,
      targetAudience: tldInfo.targetAudience,
      pros: tldInfo.pros,
      cons: tldInfo.cons
    }
  }

  private getTLDInfo(tld: string): Partial<TLDDetails> {
    const tldDatabase: Record<string, Partial<TLDDetails>> = {
      '.com': {
        type: 'generic',
        registry: 'Verisign',
        launchedDate: '1985-01-01',
        registrationPolicy: '通用顶级域名，无特殊限制，全球通用',
        dnssecSupport: true,
        idnSupport: true,
        popularityScore: 100,
        averagePrice: 12,
        description: '.com是最受欢迎和最广泛使用的顶级域名，适合各种类型的网站',
        usageExamples: ['企业官网', '电商平台', '品牌展示', '个人博客'],
        targetAudience: ['企业', '个人', '电商', '品牌'],
        pros: ['全球认知度最高', '搜索引擎友好', '用户信任度高', '易于记忆'],
        cons: ['价格相对较高', '好域名稀缺', '竞争激烈']
      },
      '.net': {
        type: 'generic',
        registry: 'Verisign',
        launchedDate: '1985-01-01',
        registrationPolicy: '通用顶级域名，原为网络服务提供商设计',
        dnssecSupport: true,
        idnSupport: true,
        popularityScore: 85,
        averagePrice: 11,
        description: '.net域名适合网络服务、技术公司和在线平台',
        usageExamples: ['网络服务', '技术博客', '在线工具', 'SaaS平台'],
        targetAudience: ['技术公司', '网络服务商', '开发者', 'IT企业'],
        pros: ['技术属性强', '价格适中', '认知度较高'],
        cons: ['不如.com普及', '部分用户可能混淆']
      },
      '.org': {
        type: 'generic',
        registry: 'Public Interest Registry',
        launchedDate: '1985-01-01',
        registrationPolicy: '通用顶级域名，原为非营利组织设计',
        dnssecSupport: true,
        idnSupport: true,
        popularityScore: 80,
        averagePrice: 10,
        description: '.org域名适合非营利组织、开源项目和社区网站',
        usageExamples: ['非营利组织', '开源项目', '社区网站', '慈善机构'],
        targetAudience: ['非营利组织', '开源社区', '教育机构', '慈善机构'],
        pros: ['公益属性强', '信任度高', '价格合理'],
        cons: ['商业用途受限', '知名度不如.com']
      },
      '.io': {
        type: 'country',
        registry: 'Internet Computer Bureau',
        launchedDate: '1997-09-16',
        registrationPolicy: '英属印度洋领地国家域名，广泛用于科技行业',
        dnssecSupport: true,
        idnSupport: false,
        popularityScore: 75,
        averagePrice: 35,
        description: '.io域名在科技和初创公司中非常受欢迎',
        usageExamples: ['科技初创', '开发者工具', 'SaaS平台', 'API服务'],
        targetAudience: ['科技公司', '初创企业', '开发者', 'SaaS服务'],
        pros: ['科技属性强', '简短易记', '创新形象'],
        cons: ['价格较高', '国家域名风险', '续费成本高']
      },
      '.ai': {
        type: 'country',
        registry: 'Government of Anguilla',
        launchedDate: '1995-01-03',
        registrationPolicy: '安圭拉国家域名，广泛用于人工智能行业',
        dnssecSupport: true,
        idnSupport: false,
        popularityScore: 70,
        averagePrice: 80,
        description: '.ai域名是人工智能和机器学习公司的首选',
        usageExamples: ['人工智能', '机器学习', '智能产品', 'AI工具'],
        targetAudience: ['AI公司', '科技企业', '研究机构', '智能产品'],
        pros: ['AI属性明确', '行业认知度高', '品牌价值强'],
        cons: ['价格昂贵', '续费成本极高', '国家域名风险']
      }
    }

    return tldDatabase[tld] || {
      type: 'generic',
      registry: 'Unknown',
      registrationPolicy: '通用顶级域名',
      dnssecSupport: false,
      idnSupport: false,
      popularityScore: 50,
      averagePrice: 15,
      description: `${tld}域名的详细信息`,
      usageExamples: ['通用网站', '个人项目'],
      targetAudience: ['个人用户', '小型企业'],
      pros: ['价格合理'],
      cons: ['知名度较低']
    }
  }

  async getTLDDetails(tld: string): Promise<TLDDetails | null> {
    await this.initialize()
    return this.tldData.get(tld) || null
  }

  async getAllTLDs(): Promise<TLDDetails[]> {
    await this.initialize()
    return Array.from(this.tldData.values())
  }

  async getPopularTLDs(limit: number = 10): Promise<TLDDetails[]> {
    await this.initialize()
    return Array.from(this.tldData.values())
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit)
  }

  async getTLDsByType(type: TLDDetails['type']): Promise<TLDDetails[]> {
    await this.initialize()
    return Array.from(this.tldData.values())
      .filter(tld => tld.type === type)
  }

  async getRelatedTLDs(tld: string, limit: number = 5): Promise<TLDDetails[]> {
    await this.initialize()
    const currentTLD = this.tldData.get(tld)
    if (!currentTLD) return []

    return Array.from(this.tldData.values())
      .filter(t => t.tld !== tld && t.type === currentTLD.type)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit)
  }

  generateTLDPageData(tld: string, details: TLDDetails) {
    return {
      title: `${tld}域名 - 注册价格${details.averagePrice}元起 | 政策详解与使用指南`,
      description: `了解${tld}域名的注册政策、价格趋势、使用限制和最佳实践。${details.description}`,
      keywords: `${tld}域名,${tld}注册,${tld}价格,${tld}后缀`,
      canonical: `/tld${tld}`,
      lastUpdated: new Date().toISOString(),
      tld: details
    }
  }
}

export const tldManager = TLDManager.getInstance()
