// TLD优先级配置 - 基于实际测试结果优化
const PRIORITY_TLDS = [
  // Tier 1: 最核心的TLD (10个) - 每4小时采集
  'com', 'net', 'org', 'io', 'co', 'ai', 'app', 'dev', 'info', 'biz',

  // Tier 2: 重要的新TLD (15个) - 每8小时采集
  'me', 'tv', 'cc', 'xyz', 'top', 'online', 'site', 'tech', 'store',
  'blog', 'news', 'cloud', 'space', 'website', 'live',

  // Tier 3: 其他有效TLD (20个) - 每天采集
  'ws', 'name', 'pro', 'mobi', 'travel', 'jobs', 'tel', 'asia',
  'xxx', 'cat', 'coop', 'museum', 'aero', 'studio', 'design',
  'art', 'shop', 'digital', 'email', 'host', 'domains'
];

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

// 注册商优先级配置
const PRIORITY_REGISTRARS = [
  // Tier 1: 最主流的国际注册商 (10个)
  'cloudflare', 'namecheap', 'porkbun', 'godaddy', 'dreamhost',
  'dynadot', 'gandi', 'hover', 'namesilo', 'enom',
  
  // Tier 2: 重要的国际注册商 (10个)
  'domaincom', 'namecom', 'rebel', 'ovh', 'internetbs',
  'inwx', 'netim', 'opensrs', 'encirca', 'directnic',
  
  // Tier 3: 中国主流注册商 (5个)
  'aliyun', 'tencent', 'huawei', 'baidu', 'volcengine',
  
  // Tier 4: 其他重要注册商 (15个)
  'cosmotown', 'spaceship', 'truehost', 'regery', 'sav',
  'dotology', 'hexonet', 'marcaria', 'pananames', 'regtons',
  'tfhost', 'globalhost', 'innovahost', 'mrdomain', 'westxyz'
];

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

// 采集配置
const CRAWL_CONFIG = {
  // 带宽优化
  REQUEST_INTERVAL: 5000, // 5秒间隔
  MAX_CONCURRENT: 1, // 串行处理
  BATCH_SIZE: 50, // 每批处理数量
  
  // 时间配置
  DAILY_LIMIT: 3600, // 每日最大请求数
  CRAWL_WINDOW: {
    START_HOUR: 2, // 凌晨2点开始
    END_HOUR: 6,   // 凌晨6点结束
    DURATION: 4    // 4小时窗口
  },
  
  // 数据新鲜度
  DATA_FRESH_HOURS: 24, // 24小时内的数据认为是新鲜的
  PRIORITY_REFRESH_HOURS: 12, // 优先TLD 12小时刷新一次
  
  // 错误处理
  MAX_FAILURES_PER_SESSION: 100,
  FAILURE_RATE_THRESHOLD: 0.3 // 30%失败率时暂停
};

// 数据同步配置
const SYNC_CONFIG = {
  CLOUDFLARE_API_BASE: 'https://api.cloudflare.com/client/v4',
  BATCH_SIZE: 100, // 每批同步数量
  COMPRESSION_ENABLED: true,
  SYNC_SCHEDULE: '0 7 * * *' // 每天早上7点同步
};

module.exports = {
  PRIORITY_TLDS,
  COUNTRY_TLDS,
  PRIORITY_REGISTRARS,
  ALL_REGISTRARS,
  API_CONFIG,
  CRAWL_CONFIG,
  SYNC_CONFIG
};
