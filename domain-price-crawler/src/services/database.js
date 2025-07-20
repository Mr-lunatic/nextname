const { query, transaction } = require('../config/database');
const { logger } = require('../utils/logger');

// 保存价格数据
const savePricingData = async (pricingData) => {
  try {
    const {
      tld,
      registrar,
      registrarName,
      registrarUrl,
      registrationPrice,
      renewalPrice,
      transferPrice,
      currency,
      currencyName,
      currencyType,
      hasPromo,
      updatedTime,
      source = 'scheduled'
    } = pricingData;

    const result = await query(`
      INSERT INTO pricing_data (
        tld, registrar, registrar_name, registrar_url,
        registration_price, renewal_price, transfer_price,
        currency, currency_name, currency_type, has_promo,
        updated_time, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (tld, registrar) 
      DO UPDATE SET
        registrar_name = EXCLUDED.registrar_name,
        registrar_url = EXCLUDED.registrar_url,
        registration_price = EXCLUDED.registration_price,
        renewal_price = EXCLUDED.renewal_price,
        transfer_price = EXCLUDED.transfer_price,
        currency = EXCLUDED.currency,
        currency_name = EXCLUDED.currency_name,
        currency_type = EXCLUDED.currency_type,
        has_promo = EXCLUDED.has_promo,
        updated_time = EXCLUDED.updated_time,
        crawled_at = CURRENT_TIMESTAMP,
        source = EXCLUDED.source,
        is_active = true
      RETURNING id
    `, [
      tld, registrar, registrarName, registrarUrl,
      registrationPrice, renewalPrice, transferPrice,
      currency, currencyName, currencyType, hasPromo,
      updatedTime, source
    ]);

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to save pricing data:', error.message);
    throw error;
  }
};

// 批量保存价格数据
const saveBatchPricingData = async (pricingDataArray) => {
  return await transaction(async (client) => {
    const results = [];
    
    for (const pricingData of pricingDataArray) {
      const {
        tld, registrar, registrarName, registrarUrl,
        registrationPrice, renewalPrice, transferPrice,
        currency, currencyName, currencyType, hasPromo,
        updatedTime, source = 'scheduled'
      } = pricingData;

      const result = await client.query(`
        INSERT INTO pricing_data (
          tld, registrar, registrar_name, registrar_url,
          registration_price, renewal_price, transfer_price,
          currency, currency_name, currency_type, has_promo,
          updated_time, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (tld, registrar) 
        DO UPDATE SET
          registrar_name = EXCLUDED.registrar_name,
          registrar_url = EXCLUDED.registrar_url,
          registration_price = EXCLUDED.registration_price,
          renewal_price = EXCLUDED.renewal_price,
          transfer_price = EXCLUDED.transfer_price,
          currency = EXCLUDED.currency,
          currency_name = EXCLUDED.currency_name,
          currency_type = EXCLUDED.currency_type,
          has_promo = EXCLUDED.has_promo,
          updated_time = EXCLUDED.updated_time,
          crawled_at = CURRENT_TIMESTAMP,
          source = EXCLUDED.source,
          is_active = true
        RETURNING id
      `, [
        tld, registrar, registrarName, registrarUrl,
        registrationPrice, renewalPrice, transferPrice,
        currency, currencyName, currencyType, hasPromo,
        updatedTime, source
      ]);

      results.push(result.rows[0]);
    }
    
    return results;
  });
};

// 获取需要采集的任务
const getCrawlTasks = async (limit = 1000) => {
  try {
    const result = await query(`
      SELECT tld, registrar, priority
      FROM crawl_queue
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT ?
    `, [limit]);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get crawl tasks:', error.message);
    throw error;
  }
};

// 生成采集任务队列
const generateCrawlQueue = async (tlds, registrars, priority = 1) => {
  try {
    const tasks = [];

    for (const tld of tlds) {
      for (const registrar of registrars) {
        tasks.push([tld, registrar, priority]);
      }
    }

    // MySQL批量插入 - 分批处理避免SQL语句过长
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const values = batch.map(() => '(?, ?, ?)').join(', ');
      const flatValues = batch.flat();

      await query(`
        INSERT INTO crawl_queue (tld, registrar, priority)
        VALUES ${values}
        ON DUPLICATE KEY UPDATE
          priority = GREATEST(crawl_queue.priority, VALUES(priority)),
          status = 'pending'
      `, flatValues);

      totalInserted += batch.length;
    }

    logger.info(`✅ Generated ${totalInserted} crawl tasks`);
    return totalInserted;
  } catch (error) {
    logger.error('Failed to generate crawl queue:', error.message);
    throw error;
  }
};

// 更新任务状态
const updateTaskStatus = async (tld, registrar, status, errorMessage = null) => {
  try {
    await query(`
      UPDATE crawl_queue
      SET status = ?,
          completed_at = CURRENT_TIMESTAMP,
          last_error = ?,
          attempts = attempts + 1
      WHERE tld = ? AND registrar = ?
    `, [status, errorMessage, tld, registrar]);
  } catch (error) {
    logger.error('Failed to update task status:', error.message);
    throw error;
  }
};

// 记录采集日志
const logCrawlAttempt = async (sessionId, tld, registrar, status, responseTime, errorMessage = null) => {
  try {
    await query(`
      INSERT INTO crawl_logs (session_id, tld, registrar, status, response_time_ms, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sessionId, tld, registrar, status, responseTime, errorMessage]);
  } catch (error) {
    logger.error('Failed to log crawl attempt:', error.message);
    // 不抛出错误，避免影响主流程
  }
};

// 获取数据统计
const getDataStats = async () => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT tld) as unique_tlds,
        COUNT(DISTINCT registrar) as unique_registrars,
        SUM(CASE WHEN TIMESTAMPDIFF(HOUR, crawled_at, NOW()) <= 24 THEN 1 ELSE 0 END) as fresh_records,
        SUM(CASE WHEN TIMESTAMPDIFF(HOUR, crawled_at, NOW()) > 24 THEN 1 ELSE 0 END) as stale_records,
        AVG(TIMESTAMPDIFF(HOUR, crawled_at, NOW())) as avg_age_hours,
        MAX(crawled_at) as last_crawl_time
      FROM pricing_data
      WHERE is_active = true
    `);

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get data stats:', error.message);
    throw error;
  }
};

// 获取缺失的数据组合
const getMissingCombinations = async (tlds, registrars, maxAge = 24) => {
  try {
    // MySQL不支持UNNEST，需要用不同的方法
    const missingCombinations = [];

    for (const tld of tlds) {
      for (const registrar of registrars) {
        const result = await query(`
          SELECT id FROM pricing_data
          WHERE tld = ? AND registrar = ?
            AND is_active = true
            AND TIMESTAMPDIFF(HOUR, crawled_at, NOW()) <= ?
        `, [tld, registrar, maxAge]);

        if (result.rows.length === 0) {
          missingCombinations.push({ tld, registrar });
        }
      }
    }

    return missingCombinations;
  } catch (error) {
    logger.error('Failed to get missing combinations:', error.message);
    throw error;
  }
};

// 获取过期数据
const getStaleData = async (maxAge = 24) => {
  try {
    const result = await query(`
      SELECT tld, registrar, TIMESTAMPDIFF(HOUR, crawled_at, NOW()) as data_age_hours
      FROM pricing_data
      WHERE is_active = true AND TIMESTAMPDIFF(HOUR, crawled_at, NOW()) > ?
      ORDER BY TIMESTAMPDIFF(HOUR, crawled_at, NOW()) DESC
    `, [maxAge]);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get stale data:', error.message);
    throw error;
  }
};

// 清理旧数据
const cleanupOldData = async (daysToKeep = 30) => {
  try {
    const result = await query(`
      UPDATE pricing_data
      SET is_active = false
      WHERE crawled_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      AND is_active = true
    `, [daysToKeep]);

    logger.info(`🧹 Cleaned up ${result.rowCount} old records`);
    return result.rowCount;
  } catch (error) {
    logger.error('Failed to cleanup old data:', error.message);
    throw error;
  }
};

// 获取系统配置
const getConfig = async (key) => {
  try {
    const result = await query(`
      SELECT config_value FROM system_config WHERE config_key = ?
    `, [key]);

    return result.rows[0]?.config_value || null;
  } catch (error) {
    logger.error('Failed to get config:', error.message);
    throw error;
  }
};

// 设置系统配置
const setConfig = async (key, value, description = null) => {
  try {
    await query(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        config_value = VALUES(config_value),
        updated_at = CURRENT_TIMESTAMP
    `, [key, value, description]);
  } catch (error) {
    logger.error('Failed to set config:', error.message);
    throw error;
  }
};

module.exports = {
  savePricingData,
  saveBatchPricingData,
  getCrawlTasks,
  generateCrawlQueue,
  updateTaskStatus,
  logCrawlAttempt,
  getDataStats,
  getMissingCombinations,
  getStaleData,
  cleanupOldData,
  getConfig,
  setConfig
};
