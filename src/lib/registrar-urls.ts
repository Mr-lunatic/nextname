/**
 * 注册商官方网站URL映射表
 * 将nazhumi的代理链接转换为注册商真实官网链接
 */

export const REGISTRAR_OFFICIAL_URLS: Record<string, string> = {
  // 国际主流注册商
  'spaceship': 'https://www.spaceship.com/',
  'cloudflare': 'https://www.cloudflare.com/products/registrar/',
  'namecheap': 'https://www.namecheap.com/',
  'namesilo': 'https://www.namesilo.com/',
  'porkbun': 'https://porkbun.com/',
  'dynadot': 'https://www.dynadot.com/',
  'gandi': 'https://www.gandi.net/',
  'ovh': 'https://www.ovhcloud.com/en/domains/',
  'dreamhost': 'https://www.dreamhost.com/domains/',
  'namecom': 'https://www.name.com/',
  'hover': 'https://www.hover.com/',
  'enom': 'https://www.enom.com/',
  'opensrs': 'https://opensrs.com/',
  'rebel': 'https://www.rebel.com/',
  'internetbs': 'https://www.internet.bs/',
  'netim': 'https://www.netim.com/',
  'inwx': 'https://www.inwx.com/',
  'hexonet': 'https://www.hexonet.net/',
  'encirca': 'https://www.encirca.com/',
  'directnic': 'https://www.directnic.com/',
  'regtons': 'https://www.regtons.com/',
  'zone': 'https://www.zone.eu/',
  'mrdomain': 'https://www.mrdomain.com/',
  'epik': 'https://www.epik.com/',
  'domaincom': 'https://www.domain.com/',
  'dotology': 'https://www.dotology.com/',
  'alldomains': 'https://www.alldomains.com/',
  'onlydomains': 'https://www.onlydomains.com/',
  'pananames': 'https://www.pananames.com/',
  'canspace': 'https://www.canspace.ca/',
  'marcaria': 'https://www.marcaria.com/',
  'globalhost': 'https://www.globalhost.com/',
  'innovahost': 'https://www.innovahost.com/',
  'truehost': 'https://truehost.com/',
  'afriregister': 'https://www.afriregister.co.za/',
  'ddd': 'https://www.ddd.com/',
  'regery': 'https://www.regery.com/',
  'sav': 'https://www.sav.com/',
  'cosmotown': 'https://www.cosmotown.com/',
  'wordpress': 'https://wordpress.com/domains/',
  'onecom': 'https://www.one.com/',
  '101domain': 'https://www.101domain.com/',
  'westxyz': 'https://west.xyz/',

  // 中国注册商
  'alibaba': 'https://wanwang.aliyun.com/',
  'aliyun': 'https://wanwang.aliyun.com/',
  'tencent': 'https://dnspod.cloud.tencent.com/',
  'huawei': 'https://www.huaweicloud.com/product/domain.html',
  'baidu': 'https://cloud.baidu.com/product/bcd.html',
  'volcengine': 'https://www.volcengine.com/products/domain',
  'west': 'https://www.west.cn/',
  '363hk': 'https://www.west263.hk/',
  'xinnet': 'https://www.xinnet.com/',
  'ename': 'https://www.ename.net/',
  'juming': 'https://www.juming.com/',
  'zzy': 'https://www.zzy.cn/',
  'quyu': 'https://www.quyu.net/',
  'gname': 'https://www.gname.com/',
  'domgate': 'https://www.domgate.com/',
  '22cn': 'https://www.22.cn/',
};

/**
 * 获取注册商的官方网站URL
 * @param registrarCode 注册商代码
 * @param fallbackUrl 备用URL（通常是nazhumi链接）
 * @returns 注册商官方网站URL
 */
export function getRegistrarOfficialUrl(registrarCode: string, fallbackUrl?: string): string {
  // 首先尝试从映射表获取官方URL
  const officialUrl = REGISTRAR_OFFICIAL_URLS[registrarCode.toLowerCase()];
  
  if (officialUrl) {
    return officialUrl;
  }
  
  // 如果没有映射，检查fallbackUrl是否是nazhumi链接
  if (fallbackUrl && fallbackUrl.includes('nazhumi.com')) {
    // 如果是nazhumi链接，尝试构造可能的官方网站
    const possibleUrl = `https://www.${registrarCode.toLowerCase()}.com/`;
    return possibleUrl;
  }
  
  // 返回原始URL或默认构造的URL
  return fallbackUrl || `https://www.${registrarCode.toLowerCase()}.com/`;
}

/**
 * 检查URL是否是nazhumi代理链接
 * @param url URL字符串
 * @returns 是否是nazhumi链接
 */
export function isNazhumiProxyUrl(url: string): boolean {
  return url.includes('nazhumi.com/registrar/');
}

/**
 * 批量转换注册商URL
 * @param pricingData 价格数据数组
 * @returns 转换后的价格数据
 */
export function convertRegistrarUrls(pricingData: any[]): any[] {
  return pricingData.map(item => ({
    ...item,
    registrarUrl: getRegistrarOfficialUrl(item.registrarCode || item.registrar, item.registrarUrl)
  }));
}
