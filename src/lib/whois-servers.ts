// WHOIS服务器配置 - 用于完全不支持RDAP的TLD
export const WHOIS_SERVERS: { [key: string]: string } = {
  // 德国域名 - 已知不支持RDAP
  'de': 'whois.denic.de',
  
  // 其他确认不支持RDAP的流行TLD
  'io': 'whois.nic.io',
  'co': 'whois.nic.co',
  'me': 'whois.nic.me',
  'tv': 'whois.nic.tv',
  'cc': 'whois.nic.cc',
  'ly': 'whois.nic.ly',
  'sh': 'whois.nic.sh',
  'gg': 'whois.nic.gg',
  
  // 亚洲域名 - 需要验证RDAP支持
  'jp': 'whois.jprs.jp',
  'kr': 'whois.kr',
  'in': 'whois.registry.in',
  
  // 其他国家域名
  'ru': 'whois.tcinet.ru',
  'it': 'whois.nic.it',
  'be': 'whois.dns.be',
  'au': 'whois.auda.org.au',
  'mx': 'whois.mx',
  
  // 欧盟域名
  'eu': 'whois.eu',
  
  // 加密货币相关（特殊TLD）
  'crypto': 'whois.nic.crypto'
}

// WHOIS查询端口（标准端口43）
export const WHOIS_PORT = 43

// WHOIS查询超时设置（按地区/类型分类）
export const WHOIS_TIMEOUTS = {
  'cn': 10000,    // 中国域名，网络可能较慢
  'de': 5000,     // 德国域名，欧洲网络较快
  'jp': 8000,     // 日本域名，亚洲网络一般
  'kr': 8000,     // 韩国域名
  'ru': 10000,    // 俄罗斯域名，可能较慢
  'in': 8000,     // 印度域名
  'default': 6000 // 默认超时
}

// 检查TLD是否需要使用WHOIS而非RDAP
export function shouldUseWhois(tld: string): boolean {
  return tld in WHOIS_SERVERS
}

// 获取TLD的WHOIS服务器
export function getWhoisServer(tld: string): string | null {
  return WHOIS_SERVERS[tld] || null
}

// 获取TLD的WHOIS查询超时时间
export function getWhoisTimeout(tld: string): number {
  return WHOIS_TIMEOUTS[tld as keyof typeof WHOIS_TIMEOUTS] || WHOIS_TIMEOUTS.default
}