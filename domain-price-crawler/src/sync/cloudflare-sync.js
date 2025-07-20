const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');
const axios = require('axios');

// Cloudflare API配置
const CLOUDFLARE_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
  baseUrl: 'https://api.cloudflare.com/client/v4'
};

// 验证Cloudflare配置
const validateConfig = () => {
  const required = ['accountId', 'apiToken', 'databaseId'];
  const missing = required.filter(key => !CLOUDFLARE_CONFIG[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Cloudflare config: ${missing.join(', ')}`);
  }
};

// 执行D1数据库查询
const executeD1Query = async (sql, params = []) => {
  const url = `${CLOUDFLARE_CONFIG.baseUrl}/accounts/${CLOUDFLARE_CONFIG.accountId}/d1/database/${CLOUDFLARE_CONFIG.databaseId}/query`;
  
  try {
    const response = await axios.post(url, {
      sql,
      params
    }, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('D1 query failed:', error.response?.data || error.message);
    throw error;
  }
};

// 创建数据库连接
const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });
};

// 获取MySQL中的所有活跃价格数据
const getMySQLPricingData = async () => {
  let connection;
  try {
    connection = await createConnection();
    const [rows] = await connection.execute(`
      SELECT
        tld, registrar, registrar_name, registrar_url,
        registration_price, renewal_price, transfer_price,
        currency, currency_name, currency_type,
        has_promo, promo_code, updated_time, crawled_at, source
      FROM pricing_data
      WHERE is_active = true
      ORDER BY tld, registrar
    `);

    return rows;
  } catch (error) {
    logger.error('Failed to fetch MySQL data:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 清空D1数据库中的旧数据
const clearD1Data = async () => {
  try {
    logger.info('🧹 Clearing old D1 data...');
    await executeD1Query('DELETE FROM pricing_data');
    logger.info('✅ D1 data cleared');
  } catch (error) {
    logger.error('Failed to clear D1 data:', error.message);
    throw error;
  }
};

// 批量插入数据到D1
const insertBatchToD1 = async (batch) => {
  const values = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const sql = `
    INSERT INTO pricing_data (
      tld, registrar, registrar_name, registrar_url,
      registration_price, renewal_price, transfer_price,
      currency, currency_name, currency_type,
      has_promo, promo_code, updated_time, crawled_at, source
    ) VALUES ${values}
  `;
  
  const params = batch.flatMap(item => [
    item.tld,
    item.registrar,
    item.registrar_name,
    item.registrar_url,
    item.registration_price,
    item.renewal_price,
    item.transfer_price,
    item.currency,
    item.currency_name,
    item.currency_type,
    item.has_promo ? 1 : 0,
    item.promo_code,
    item.updated_time,
    item.crawled_at,
    item.source
  ]);
  
  try {
    await executeD1Query(sql, params);
  } catch (error) {
    logger.error('Failed to insert batch to D1:', error.message);
    throw error;
  }
};

// 同步数据到Cloudflare D1
const syncToCloudflareD1 = async () => {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Starting sync to Cloudflare D1...');
    
    // 验证配置
    validateConfig();
    
    // 获取MySQL数据
    logger.info('📊 Fetching data from MySQL...');
    const mysqlData = await getMySQLPricingData();
    logger.info(`📊 Found ${mysqlData.length} records in MySQL`);
    
    if (mysqlData.length === 0) {
      logger.warn('⚠️ No data to sync');
      return;
    }
    
    // 清空D1旧数据
    await clearD1Data();
    
    // 分批插入数据（D1有查询大小限制）
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < mysqlData.length; i += BATCH_SIZE) {
      batches.push(mysqlData.slice(i, i + BATCH_SIZE));
    }
    
    logger.info(`📦 Syncing ${batches.length} batches to D1...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`📦 Syncing batch ${i + 1}/${batches.length} (${batch.length} records)`);
      
      await insertBatchToD1(batch);
      
      // 短暂延迟避免API频率限制
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 更新同步状态
    await executeD1Query(`
      INSERT OR REPLACE INTO sync_status (id, last_sync_time, total_records, sync_source, status)
      VALUES (1, datetime('now'), ?, 'ubuntu', 'success')
    `, [mysqlData.length]);
    
    const duration = (Date.now() - startTime) / 1000;
    logger.info(`✅ Sync completed: ${mysqlData.length} records in ${duration.toFixed(1)}s`);
    
    return {
      success: true,
      recordsSync: mysqlData.length,
      duration: duration,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.error(`❌ Sync failed after ${duration.toFixed(1)}s:`, error.message);
    
    // 记录失败状态
    try {
      await executeD1Query(`
        INSERT OR REPLACE INTO sync_status (id, last_sync_time, total_records, sync_source, status)
        VALUES (1, datetime('now'), 0, 'ubuntu', 'failed')
      `);
    } catch (statusError) {
      logger.error('Failed to update sync status:', statusError.message);
    }
    
    throw error;
  }
};

// 测试Cloudflare D1连接
const testD1Connection = async () => {
  try {
    logger.info('🔍 Testing Cloudflare D1 connection...');
    validateConfig();
    
    const result = await executeD1Query('SELECT 1 as test');
    logger.info('✅ D1 connection successful');
    return true;
  } catch (error) {
    logger.error('❌ D1 connection failed:', error.message);
    return false;
  }
};

module.exports = {
  syncToCloudflareD1,
  testD1Connection,
  executeD1Query
};
