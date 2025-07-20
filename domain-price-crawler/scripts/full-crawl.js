require('dotenv').config();
const { getPricing } = require('../src/services/nazhumi-api');
const { syncToCloudflareD1 } = require('../src/sync/cloudflare-sync');
const { logger } = require('../src/utils/logger');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

// 基于测试结果的推荐TLD列表（前50个最重要的）
const RECOMMENDED_TLDS = [
  // Tier 1: 最核心的TLD (10个)
  'com', 'net', 'org', 'io', 'co', 'ai', 'app', 'dev', 'info', 'biz',
  
  // Tier 2: 重要的新TLD (15个)
  'me', 'tv', 'cc', 'xyz', 'top', 'online', 'site', 'tech', 'store', 
  'blog', 'news', 'cloud', 'space', 'website', 'live',
  
  // Tier 3: 主要国家TLD (15个)
  'cn', 'com.cn', 'uk', 'co.uk', 'de', 'fr', 'it', 'es', 'nl', 
  'ca', 'au', 'jp', 'kr', 'in', 'hk',
  
  // Tier 4: 其他重要TLD (10个)
  'studio', 'design', 'art', 'shop', 'digital', 'email', 'host', 
  'domains', 'tw', 'sg'
];

async function savePriceData(price) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });
  
  const query = `
    INSERT INTO pricing_data (
      tld, registrar, registrar_name, registrar_url,
      registration_price, renewal_price, transfer_price,
      currency, currency_name, currency_type,
      has_promo, updated_time, crawled_at, source, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'full_crawl', true)
    ON DUPLICATE KEY UPDATE
      registrar_name = VALUES(registrar_name),
      registrar_url = VALUES(registrar_url),
      registration_price = VALUES(registration_price),
      renewal_price = VALUES(renewal_price),
      transfer_price = VALUES(transfer_price),
      currency = VALUES(currency),
      currency_name = VALUES(currency_name),
      currency_type = VALUES(currency_type),
      has_promo = VALUES(has_promo),
      updated_time = VALUES(updated_time),
      crawled_at = NOW()
  `;
  
  const values = [
    price.tld,
    price.registrar,
    price.registrarName || price.registrar,
    price.registrarUrl || '',
    price.registrationPrice,
    price.renewalPrice,
    price.transferPrice,
    price.currency?.toLowerCase() || 'usd',
    price.currencyName || '',
    price.currencyType || '',
    price.hasPromo ? 1 : 0,
    price.updatedTime || new Date().toISOString()
  ];
  
  try {
    await connection.execute(query, values);
    return true;
  } finally {
    await connection.end();
  }
}

async function fullCrawl() {
  const sessionId = uuidv4();
  const startTime = Date.now();
  
  console.log(`🚀 Starting COMPLETE crawl of ${RECOMMENDED_TLDS.length} TLDs...`);
  console.log(`📋 Will get ALL registrars for each TLD (not limited)`);
  console.log(`📋 Session ID: ${sessionId}\n`);
  
  const results = [];
  let totalRegistrars = 0;
  let totalSaved = 0;
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < RECOMMENDED_TLDS.length; i++) {
    const tld = RECOMMENDED_TLDS[i];
    
    try {
      // 显示进度
      console.log(`📊 Progress: ${i + 1}/${RECOMMENDED_TLDS.length} - Getting ALL registrars for ${tld}...`);
      
      // 添加延迟避免API限制
      if (i > 0) {
        const delay = i < 10 ? 3000 : i < 25 ? 4000 : 5000;
        console.log(`⏳ Waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // 获取该TLD的所有注册商价格
      const allPrices = await getPricing(tld);
      console.log(`🔍 Found ${allPrices.length} registrars for ${tld}`);
      
      // 保存所有价格数据
      let savedCount = 0;
      for (const price of allPrices) {
        try {
          await savePriceData(price);
          savedCount++;
        } catch (error) {
          console.log(`⚠️ Failed to save ${price.registrar}/${tld}: ${error.message}`);
        }
      }
      
      totalRegistrars += allPrices.length;
      totalSaved += savedCount;
      successCount++;
      
      console.log(`✅ ${tld}: ${savedCount}/${allPrices.length} registrars saved`);
      
      // 显示注册商列表
      const registrarList = allPrices.slice(0, 5).map(p => `${p.registrar}($${p.registrationPrice})`).join(', ');
      console.log(`📋 Sample: ${registrarList}${allPrices.length > 5 ? '...' : ''}`);
      
      results.push({
        tld,
        status: 'completed',
        registrarsFound: allPrices.length,
        registrarsSaved: savedCount
      });
      
      // 每10个TLD显示一次中间统计
      if ((i + 1) % 10 === 0) {
        console.log(`\n📈 Intermediate stats: ${successCount} TLDs, ${totalSaved} records saved\n`);
      }
      
    } catch (error) {
      failureCount++;
      console.log(`❌ ${tld}: Error - ${error.message}`);
      results.push({
        tld,
        status: 'failed',
        error: error.message
      });
    }
    
    console.log(''); // 空行分隔
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 COMPLETE CRAWL FINISHED');
  console.log('='.repeat(60));
  console.log(`Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
  console.log(`TLDs processed: ${RECOMMENDED_TLDS.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`Success rate: ${(successCount / RECOMMENDED_TLDS.length * 100).toFixed(1)}%`);
  console.log(`Total registrars found: ${totalRegistrars}`);
  console.log(`Total records saved: ${totalSaved}`);
  console.log(`Average registrars per TLD: ${(totalRegistrars / successCount).toFixed(1)}`);
  
  return {
    sessionId,
    status: 'completed',
    tlds: RECOMMENDED_TLDS.length,
    completed: successCount,
    failed: failureCount,
    totalRegistrars,
    totalSaved,
    duration
  };
}

async function main() {
  try {
    // 执行完整采集
    const crawlResult = await fullCrawl();
    
    if (crawlResult.totalSaved > 0) {
      console.log('\n⏳ Syncing to Cloudflare D1...');
      const syncResult = await syncToCloudflareD1();
      console.log(`✅ D1 sync completed: ${syncResult.recordsSync} records synced`);
    }
    
    console.log('\n🎉 Complete crawl and sync finished successfully!');
    console.log(`📊 Final database contains ${crawlResult.totalSaved} price records!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Complete crawl failed:', error.message);
    process.exit(1);
  }
}

main();
