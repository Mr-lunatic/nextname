// 重新设计的TLD分类体系 - 基于商业价值和采集频率优化
const TLD_CATEGORIES = {
  // Tier S: 超高价值TLD - 每2小时采集一次
  SUPER_PREMIUM: {
    tlds: ['com', 'net', 'org', 'io', 'ai'],
    priority: 10,
    refresh_hours: 2,
    description: '最核心的商业域名'
  },
  
  // Tier A: 高价值新兴TLD - 每4小时采集一次  
  PREMIUM_NEW: {
    tlds: ['app', 'dev', 'co', 'me', 'tv', 'cc'],
    priority: 9,
    refresh_hours: 4,
    description: '高价值新兴域名'
  },
  
  // Tier B: 主流商业TLD - 每6小时采集一次
  COMMERCIAL: {
    tlds: ['biz', 'info', 'store', 'shop', 'online', 'website', 'site'],
    priority: 8,
    refresh_hours: 6,
    description: '主流商业域名'
  },
  
  // Tier C: 技术专业TLD - 每8小时采集一次
  TECH_PROFESSIONAL: {
    tlds: ['tech', 'digital', 'cloud', 'host', 'domains', 'email', 'blog', 'news'],
    priority: 7,
    refresh_hours: 8,
    description: '技术和专业服务域名'
  },
  
  // Tier D: 创意设计TLD - 每12小时采集一次
  CREATIVE: {
    tlds: ['design', 'art', 'studio', 'space', 'live', 'gallery', 'music'],
    priority: 6,
    refresh_hours: 12,
    description: '创意和设计相关域名'
  },
  
  // Tier E: 特殊用途TLD - 每24小时采集一次
  SPECIAL_PURPOSE: {
    tlds: ['xxx', 'travel', 'jobs', 'tel', 'mobi', 'name', 'pro'],
    priority: 5,
    refresh_hours: 24,
    description: '特殊用途域名'
  },
  
  // Tier F: 组织机构TLD - 每24小时采集一次
  ORGANIZATION: {
    tlds: ['cat', 'coop', 'museum', 'aero', 'asia'],
    priority: 4,
    refresh_hours: 24,
    description: '组织和机构域名'
  },
  
  // Tier G: 低频TLD - 每48小时采集一次
  LOW_FREQUENCY: {
    tlds: ['ws', 'xyz', 'top'],
    priority: 3,
    refresh_hours: 48,
    description: '低频采集域名'
  }
};

// 扁平化的优先级TLD列表（向后兼容）
const PRIORITY_TLDS = Object.values(TLD_CATEGORIES).flatMap(category => category.tlds);

// 测试验证的有效TLD列表（97.9%成功率）
const VERIFIED_TLDS = [
  'com', 'net', 'org', 'io', 'co', 'ai', 'app', 'dev', 'info', 'biz',
  'me', 'tv', 'cc', 'ws', 'name', 'pro', 'mobi', 'travel', 'jobs', 'tel',
  'asia', 'xxx', 'cat', 'coop', 'museum', 'aero', 'xyz', 'top', 'online',
  'site', 'tech', 'store', 'blog', 'news', 'cloud', 'space', 'website',
  'live', 'studio', 'design', 'art', 'shop', 'digital', 'email', 'host', 'domains'
];

// 无效TLD列表（测试失败）
const INVALID_TLDS = ['web', 'edu.cn'];

// 国家/地区TLD
const COUNTRY_TLDS = [
  // 中国
  'cn', 'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
  
  // 主要国家
  'uk', 'co.uk', 'org.uk', 'me.uk', 'de', 'fr', 'it', 'es', 'nl',
  'ca', 'au', 'jp', 'kr', 'in', 'br', 'mx', 'ru', 'pl', 'se',
  'no', 'dk', 'fi', 'be', 'ch', 'at', 'ie', 'pt', 'gr', 'cz',
  
  // 其他重要地区
  'hk', 'tw', 'sg', 'my', 'th', 'ph', 'id', 'vn', 'ae', 'sa'
];

// 注册商分类优化 - 基于可靠性和覆盖度
const REGISTRAR_CATEGORIES = {
  // Tier S: 顶级注册商 - 最高优先级
  TOP_TIER: {
    registrars: ['cloudflare', 'namecheap', 'porkbun', 'godaddy', 'gandi'],
    priority: 10,
    description: '行业领导者，数据最准确可靠'
  },
  
  // Tier A: 主流国际注册商
  INTERNATIONAL_MAJOR: {
    registrars: ['dreamhost', 'dynadot', 'hover', 'namesilo', 'enom', 'domaincom', 'namecom'],
    priority: 9,
    description: '主流国际注册商'
  },
  
  // Tier B: 重要国际注册商
  INTERNATIONAL_IMPORTANT: {
    registrars: ['rebel', 'ovh', 'internetbs', 'inwx', 'netim', 'opensrs'],
    priority: 8,
    description: '重要的国际注册商'
  },
  
  // Tier C: 中国主流注册商
  CHINA_MAJOR: {
    registrars: ['aliyun', 'tencent', 'huawei', 'baidu', 'volcengine'],
    priority: 7,
    description: '中国主流注册商'
  },
  
  // Tier D: 其他可靠注册商
  OTHER_RELIABLE: {
    registrars: ['cosmotown', 'spaceship', 'truehost', 'regery', 'sav', 'dotology'],
    priority: 6,
    description: '其他可靠注册商'
  }
};

// 扁平化的优先级注册商列表（向后兼容）
const PRIORITY_REGISTRARS = Object.values(REGISTRAR_CATEGORIES).flatMap(category => category.registrars);

// 所有活跃注册商（从nazhumi文档中提取）
const ALL_REGISTRARS = [
  // 中国注册商
  'aliyun', '22cn', 'baidu', 'huawei', 'volcengine', 'juming',
  'quyu', 'tencent', 'west', '363hk', 'xinnet', 'ename', 'zzy',
  
  // 国际注册商
  '101domain', 'afriregister', 'alibaba', 'alldomains', 'canspace',
  'cloudflare', 'cosmotown', 'ddd', 'directnic', 'domaincom',
  'domgate', 'dotology', 'dreamhost', 'dynadot', 'encirca',
  'enom', 'epik', 'gandi', 'globalhost', 'gname', 'godaddy',
  'hexonet', 'hover', 'innovahost', 'internetbs', 'inwx',
  'marcaria', 'mrdomain', 'namecom', 'namecheap', 'namesilo',
  'netim', 'onecom', 'onlydomains', 'opensrs', 'ovh',
  'pananames', 'porkbun', 'rebel', 'regery', 'regtons',
  'sav', 'spaceship', 'tfhost', 'truehost', 'westxyz',
  'wordpress', 'zone'
];

// API配置
const API_CONFIG = {
  BASE_URL: 'https://www.nazhumi.com/api/v1',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  USER_AGENT: 'DomainPriceComparison/1.0 (Friendly Bot)',
  HEADERS: {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
  }
};

// 优化的采集配置 - 提升效率同时保护目标站点
const CRAWL_CONFIG = {
  // 带宽优化 - 根据TLD重要性动态调整
  REQUEST_INTERVALS: {
    SUPER_PREMIUM: 3000,    // 3秒 - 最重要的TLD
    PREMIUM_NEW: 4000,      // 4秒 - 高价值TLD  
    COMMERCIAL: 5000,       // 5秒 - 商业TLD
    TECH_PROFESSIONAL: 6000, // 6秒 - 技术TLD
    CREATIVE: 8000,         // 8秒 - 创意TLD
    SPECIAL_PURPOSE: 10000, // 10秒 - 特殊用途
    ORGANIZATION: 12000,    // 12秒 - 组织机构
    LOW_FREQUENCY: 15000    // 15秒 - 低频TLD
  },
  
  // 并发控制 - 基于TLD优先级的智能并发
  CONCURRENT_LIMITS: {
    SUPER_PREMIUM: 2,       // 允许2个并发请求
    PREMIUM_NEW: 2,         // 允许2个并发请求
    COMMERCIAL: 1,          // 1个并发请求
    DEFAULT: 1              // 默认1个并发请求
  },
  
  // 批量处理优化
  BATCH_PROCESSING: {
    ENABLED: true,
    TLD_BATCH_SIZE: 8,      // 每批处理8个TLD（替代原来的单个处理）
    REGISTRAR_BATCH_SIZE: 15, // 每个TLD获取前15个注册商
    BATCH_INTERVAL: 2000,   // 批次间隔2秒
    MAX_BATCHES_PER_SESSION: 20 // 每次会话最多20批
  },
  
  // 时间配置 - 扩展采集窗口
  DAILY_LIMIT: 5000,      // 提升每日请求限制
  CRAWL_WINDOW: {
    START_HOUR: 1,        // 凌晨1点开始（提前1小时）
    END_HOUR: 7,          // 早上7点结束（延长1小时）
    DURATION: 6           // 6小时窗口
  },
  
  // 智能采集频率
  SMART_REFRESH: {
    ENABLED: true,
    HIGH_PRIORITY_HOURS: 2,   // 高优先级TLD每2小时刷新
    MEDIUM_PRIORITY_HOURS: 6, // 中优先级TLD每6小时刷新
    LOW_PRIORITY_HOURS: 24,   // 低优先级TLD每24小时刷新
  },
  
  // 数据新鲜度
  DATA_FRESH_HOURS: 12,      // 降低到12小时内的数据认为是新鲜的
  PRIORITY_REFRESH_HOURS: 4, // 优先TLD 4小时刷新一次
  
  // 错误处理
  MAX_FAILURES_PER_SESSION: 200, // 提升失败容忍度
  FAILURE_RATE_THRESHOLD: 0.25,  // 25%失败率时暂停（降低阈值）
  
  // 性能优化
  PERFORMANCE: {
    ENABLE_CACHING: true,
    CACHE_TTL: 3600,      // 缓存1小时
    ENABLE_COMPRESSION: true,
    CONNECTION_POOLING: true,
    MAX_CONNECTIONS: 10
  }
};

// 数据同步配置
const SYNC_CONFIG = {
  CLOUDFLARE_API_BASE: 'https://api.cloudflare.com/client/v4',
  BATCH_SIZE: 100, // 每批同步数量
  COMPRESSION_ENABLED: true,
  SYNC_SCHEDULE: '0 7 * * *' // 每天早上7点同步
};

module.exports = {
  TLD_CATEGORIES,
  REGISTRAR_CATEGORIES,
  PRIORITY_TLDS,
  COUNTRY_TLDS,
  PRIORITY_REGISTRARS,
  ALL_REGISTRARS,
  API_CONFIG,
  CRAWL_CONFIG,
  SYNC_CONFIG
};
