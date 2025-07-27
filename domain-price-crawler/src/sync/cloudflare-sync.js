require('dotenv').config();
const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

// 初始化D1数据库表结构
const initializeD1Tables = async () => {
  try {
    logger.info('🔧 Initializing D1 database tables...');
    
    // 主数据表 - 常规采集数据
    await executeD1Query(`
      CREATE TABLE IF NOT EXISTS pricing_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tld TEXT NOT NULL,
        registrar TEXT NOT NULL,
        registrar_name TEXT,
        registrar_url TEXT,
        registration_price REAL,
        renewal_price REAL,
        transfer_price REAL,
        currency TEXT,
        currency_name TEXT,
        currency_type TEXT,
        has_promo INTEGER DEFAULT 0,
        promo_code TEXT,
        updated_time TEXT,
        crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT DEFAULT 'scheduled',
        data_type TEXT DEFAULT 'regular',
        UNIQUE(tld, registrar)
      )
    `);
    
    // 兜底数据表 - 手动全量采集数据
    await executeD1Query(`
      CREATE TABLE IF NOT EXISTS pricing_data_fallback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tld TEXT NOT NULL,
        registrar TEXT NOT NULL,
        registrar_name TEXT,
        registrar_url TEXT,
        registration_price REAL,
        renewal_price REAL,
        transfer_price REAL,
        currency TEXT,
        currency_name TEXT,
        currency_type TEXT,
        has_promo INTEGER DEFAULT 0,
        promo_code TEXT,
        updated_time TEXT,
        crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT DEFAULT 'manual_full',
        data_type TEXT DEFAULT 'fallback',
        manual_session_id TEXT,
        UNIQUE(tld, registrar)
      )
    `);
    
    // 同步状态表
    await executeD1Query(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY,
        table_name TEXT NOT NULL,
        last_sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_records INTEGER DEFAULT 0,
        sync_source TEXT,
        status TEXT DEFAULT 'success',
        error_message TEXT,
        sync_duration_ms INTEGER,
        records_added INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        UNIQUE(table_name, sync_source)
      )
    `);
    
    // 数据质量统计表
    await executeD1Query(`
      CREATE TABLE IF NOT EXISTS data_quality_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        stat_date DATE DEFAULT (DATE('now')),
        total_tlds INTEGER DEFAULT 0,
        total_registrars INTEGER DEFAULT 0,
        total_records INTEGER DEFAULT 0,
        avg_registrars_per_tld REAL DEFAULT 0,
        data_freshness_hours REAL DEFAULT 0,
        coverage_percentage REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(table_name, stat_date)
      )
    `);
    
    logger.info('✅ D1 tables initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize D1 tables:', error.message);
    throw error;
  }
};

// 获取MySQL中的常规采集数据
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

// 获取手动采集的兜底数据
const getManualCrawlData = () => {
  try {
    const resultFile = path.join(__dirname, '..', '..', 'data', 'manual_crawl_results.json');
    
    if (!fs.existsSync(resultFile)) {
      logger.warn('Manual crawl results file not found');
      return [];
    }
    
    const results = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    const fallbackData = [];
    
    // 转换手动采集结果为数据库格式
    for (const result of results) {
      if (result.status === 'completed' && result.data) {
        for (const priceData of result.data) {
          fallbackData.push({
            tld: priceData.tld,
            registrar: priceData.registrar,
            registrar_name: priceData.registrarName || priceData.registrar,
            registrar_url: priceData.registrarUrl || '',
            registration_price: priceData.registrationPrice,
            renewal_price: priceData.renewalPrice,
            transfer_price: priceData.transferPrice,
            currency: priceData.currency?.toLowerCase() || 'usd',
            currency_name: priceData.currencyName || '',
            currency_type: priceData.currencyType || '',
            has_promo: priceData.hasPromo ? 1 : 0,
            promo_code: null,
            updated_time: priceData.updatedTime || new Date().toISOString(),
            source: 'manual_full',
            manual_session_id: result.sessionId
          });
        }
      }
    }
    
    logger.info(`📊 Found ${fallbackData.length} fallback records from manual crawl`);
    return fallbackData;
  } catch (error) {
    logger.error('Failed to load manual crawl data:', error.message);
    return [];
  }
};

// 清空D1表数据
const clearD1Table = async (tableName) => {
  try {
    logger.info(`🧹 Clearing old data from ${tableName}...`);
    await executeD1Query(`DELETE FROM ${tableName}`);
    logger.info(`✅ ${tableName} data cleared`);
  } catch (error) {
    logger.error(`Failed to clear ${tableName} data:`, error.message);
    throw error;
  }
};

// 将中文货币名称转换为英文
const convertCurrencyName = (currencyName, currency) => {
  const currencyMap = {
    '美元': 'USD',
    '欧元': 'EUR', 
    '人民币': 'CNY',
    '英镑': 'GBP',
    '日元': 'JPY',
    '加元': 'CAD',
    '澳元': 'AUD'
  };
  
  // 如果是中文，转换为英文
  if (currencyMap[currencyName]) {
    return currencyMap[currencyName];
  }
  
  // 如果已经是英文或未知，返回currency代码
  return currency ? currency.toUpperCase() : currencyName || '';
};

// 批量插入数据到D1
const insertBatchToD1 = async (tableName, batch) => {
  const fieldsCount = 14; // 根据表结构调整
  const values = batch.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).join(', ');
  
  let sql;
  if (tableName === 'pricing_data_fallback') {
    sql = `
      INSERT INTO ${tableName} (
        tld, registrar, registrar_name, registrar_url,
        registration_price, renewal_price, transfer_price,
        currency, currency_name, currency_type,
        has_promo, promo_code, updated_time, source
      ) VALUES ${values}
    `;
  } else {
    sql = `
      INSERT INTO ${tableName} (
        tld, registrar, registrar_name, registrar_url,
        registration_price, renewal_price, transfer_price,
        currency, currency_name, currency_type,
        has_promo, promo_code, updated_time, source
      ) VALUES ${values}
    `;
  }
  
  const params = batch.flatMap(item => [
    item.tld || '',
    item.registrar || '',
    item.registrar_name || '',
    item.registrar_url || '',
    item.registration_price || '',
    item.renewal_price || '',
    item.transfer_price || '',
    item.currency || '',
    convertCurrencyName(item.currency_name, item.currency), // 转换中文货币名称
    item.currency_type || '',
    item.has_promo ? 1 : 0,
    item.promo_code || '',
    item.updated_time || '',
    item.source || 'scheduled'
  ]);
  
  try {
    await executeD1Query(sql, params);
  } catch (error) {
    logger.error(`Failed to insert batch to ${tableName}:`, error.message);
    throw error;
  }
};

// 计算数据质量统计
const calculateDataQualityStats = async (tableName) => {
  try {
    const result = await executeD1Query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT tld) as total_tlds,
        COUNT(DISTINCT registrar) as total_registrars,
        AVG(
          (SELECT COUNT(*) FROM ${tableName} sub 
           WHERE sub.tld = main.tld)
        ) as avg_registrars_per_tld
      FROM ${tableName} main
    `);
    
    const stats = result.result && result.result.length > 0 ? result.result[0] : {
      total_records: 0,
      total_tlds: 0,
      total_registrars: 0,
      avg_registrars_per_tld: 0
    };
    
    // 保存统计信息
    await executeD1Query(`
      INSERT OR REPLACE INTO data_quality_stats (
        table_name, total_tlds, total_registrars, total_records, avg_registrars_per_tld
      ) VALUES (?, ?, ?, ?, ?)
    `, [tableName, stats.total_tlds, stats.total_registrars, stats.total_records, stats.avg_registrars_per_tld]);
    
    return stats;
  } catch (error) {
    logger.error('Failed to calculate data quality stats:', error.message);
    return null;
  }
};

// 同步常规数据到D1
const syncRegularDataToD1 = async () => {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Starting regular data sync to Cloudflare D1...');
    
    // 验证配置
    validateConfig();
    
    // 初始化表结构
    await initializeD1Tables();
    
    // 获取MySQL数据
    logger.info('📊 Fetching data from MySQL...');
    const mysqlData = await getMySQLPricingData();
    logger.info(`📊 Found ${mysqlData.length} records in MySQL`);
    
    if (mysqlData.length === 0) {
      logger.warn('⚠️ No regular data to sync');
      return { success: true, recordsSync: 0, duration: 0 };
    }
    
    // 清空D1旧数据
    await clearD1Table('pricing_data');
    
    // 分批插入数据 - 使用单条记录避免任何批量问题
    const BATCH_SIZE = 1;
    const batches = [];
    for (let i = 0; i < mysqlData.length; i += BATCH_SIZE) {
      batches.push(mysqlData.slice(i, i + BATCH_SIZE));
    }
    
    logger.info(`📦 Syncing ${batches.length} batches to D1...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`📦 Syncing batch ${i + 1}/${batches.length} (${batch.length} records)`);
      
      await insertBatchToD1('pricing_data', batch);
      
      // 增加延迟避免API频率限制，特别是单条记录模式
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 减少延迟到100ms
      }
    }
    
    // 计算数据质量统计
    const stats = await calculateDataQualityStats('pricing_data');
    
    // 更新同步状态
    const duration = Date.now() - startTime;
    await executeD1Query(`
      INSERT OR REPLACE INTO sync_status (
        id, table_name, last_sync_time, total_records, sync_source, 
        status, sync_duration_ms, records_added
      ) VALUES (1, 'pricing_data', datetime('now'), ?, 'mysql', 'success', ?, ?)
    `, [mysqlData.length, duration, mysqlData.length]);
    
    logger.info(`✅ Regular data sync completed: ${mysqlData.length} records in ${(duration/1000).toFixed(1)}s`);
    
    return {
      success: true,
      recordsSync: mysqlData.length,
      duration: duration,
      dataQuality: stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Regular data sync failed after ${(duration/1000).toFixed(1)}s:`, error.message);
    
    // 记录失败状态
    try {
      await executeD1Query(`
        INSERT OR REPLACE INTO sync_status (
          id, table_name, last_sync_time, total_records, sync_source, 
          status, error_message, sync_duration_ms
        ) VALUES (1, 'pricing_data', datetime('now'), 0, 'mysql', 'failed', ?, ?)
      `, [error.message, duration]);
    } catch (statusError) {
      logger.error('Failed to update sync status:', statusError.message);
    }
    
    throw error;
  }
};

// 同步兜底数据到D1
const syncFallbackDataToD1 = async () => {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Starting fallback data sync to Cloudflare D1...');
    
    // 验证配置
    validateConfig();
    
    // 初始化表结构
    await initializeD1Tables();
    
    // 获取手动采集数据
    logger.info('📊 Loading manual crawl fallback data...');
    const fallbackData = getManualCrawlData();
    
    if (fallbackData.length === 0) {
      logger.warn('⚠️ No fallback data to sync');
      return { success: true, recordsSync: 0, duration: 0 };
    }
    
    // 清空D1兜底表旧数据
    await clearD1Table('pricing_data_fallback');
    
    // 分批插入数据
    const BATCH_SIZE = 1;
    const batches = [];
    for (let i = 0; i < fallbackData.length; i += BATCH_SIZE) {
      batches.push(fallbackData.slice(i, i + BATCH_SIZE));
    }
    
    logger.info(`📦 Syncing ${batches.length} fallback batches to D1...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`📦 Syncing fallback batch ${i + 1}/${batches.length} (${batch.length} records)`);
      
      await insertBatchToD1('pricing_data_fallback', batch);
      
      // 短暂延迟避免API频率限制
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 计算数据质量统计
    const stats = await calculateDataQualityStats('pricing_data_fallback');
    
    // 更新同步状态
    const duration = Date.now() - startTime;
    await executeD1Query(`
      INSERT OR REPLACE INTO sync_status (
        id, table_name, last_sync_time, total_records, sync_source, 
        status, sync_duration_ms, records_added
      ) VALUES (2, 'pricing_data_fallback', datetime('now'), ?, 'manual_crawl', 'success', ?, ?)
    `, [fallbackData.length, duration, fallbackData.length]);
    
    logger.info(`✅ Fallback data sync completed: ${fallbackData.length} records in ${(duration/1000).toFixed(1)}s`);
    
    return {
      success: true,
      recordsSync: fallbackData.length,
      duration: duration,
      dataQuality: stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Fallback data sync failed after ${(duration/1000).toFixed(1)}s:`, error.message);
    
    // 记录失败状态
    try {
      await executeD1Query(`
        INSERT OR REPLACE INTO sync_status (
          id, table_name, last_sync_time, total_records, sync_source, 
          status, error_message, sync_duration_ms
        ) VALUES (2, 'pricing_data_fallback', datetime('now'), 0, 'manual_crawl', 'failed', ?, ?)
      `, [error.message, duration]);
    } catch (statusError) {
      logger.error('Failed to update sync status:', statusError.message);
    }
    
    throw error;
  }
};

// 统一的同步函数（向后兼容）
const syncToCloudflareD1 = async () => {
  return await syncRegularDataToD1();
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

// 获取同步状态
const getSyncStatus = async () => {
  try {
    const result = await executeD1Query(`
      SELECT 
        table_name, last_sync_time, total_records, sync_source, 
        status, error_message, sync_duration_ms, records_added
      FROM sync_status 
      ORDER BY last_sync_time DESC
    `);
    
    return result.result || [];
  } catch (error) {
    logger.error('Failed to get sync status:', error.message);
    return [];
  }
};

module.exports = {
  syncToCloudflareD1,
  syncRegularDataToD1,
  syncFallbackDataToD1,
  testD1Connection,
  executeD1Query,
  getSyncStatus,
  initializeD1Tables
};
