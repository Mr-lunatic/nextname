const { v4: uuidv4 } = require('uuid');
const { fetchWithRetry } = require('./nazhumi-api');
const {
  savePricingData,
  updateTaskStatus,
  logCrawlAttempt,
  getDataStats,
  getMissingCombinations,
  setConfig,
  getConfig
} = require('./database');
const { crawlLogger, logger } = require('../utils/logger');
const { CRAWL_CONFIG, PRIORITY_TLDS, PRIORITY_REGISTRARS } = require('../config/constants');

// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 生成会话ID
const generateSessionId = () => uuidv4();

// 记录采集结果（临时函数，直到数据库服务中添加）
const logCrawlResult = async (sessionId, tld, registrar, status, responseTime, savedCount = 0, error = null) => {
  try {
    // 使用现有的logCrawlAttempt函数
    await logCrawlAttempt(sessionId, tld, registrar, status, responseTime, error);
    logger.debug(`📝 Logged crawl result: ${tld}/${registrar} - ${status}`);
  } catch (err) {
    logger.warn(`⚠️ Failed to log crawl result: ${err.message}`);
  }
};

// 更新系统配置（临时函数，直到数据库服务中添加）
const updateSystemConfig = async (key, value) => {
  try {
    await setConfig(key, value);
  } catch (err) {
    logger.warn(`⚠️ Failed to update system config ${key}: ${err.message}`);
  }
};

// 临时的savePricingData函数，使用正确的MySQL语法
const savePricingDataMySQL = async (pricingData) => {
  const mysql = require('mysql2/promise');

  // 创建数据库连接
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'crawler', true)
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
    pricingData.tld,
    pricingData.registrar,
    pricingData.registrarName || pricingData.registrar,
    pricingData.registrarUrl || '',
    pricingData.registrationPrice,
    pricingData.renewalPrice,
    pricingData.transferPrice,
    pricingData.currency?.toLowerCase() || 'usd',
    pricingData.currencyName || '',
    pricingData.currencyType || '',
    pricingData.hasPromo ? 1 : 0,
    pricingData.updatedTime || new Date().toISOString()
  ];

  try {
    const [result] = await connection.execute(query, values);
    logger.debug(`✅ Saved pricing data: ${pricingData.registrar}/${pricingData.tld}`);
    return result;
  } catch (error) {
    logger.error(`❌ Failed to save pricing data: ${pricingData.registrar}/${pricingData.tld}`, error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

// 生成采集计划
const generateCrawlPlan = async () => {
  try {
    logger.info('📋 Generating crawl plan...');
    
    // 获取当前数据统计
    const stats = await getDataStats();
    logger.info('📊 Current data stats:', stats);
    
    // 根据数据覆盖情况决定采集策略
    let tlds, registrars, maxTasks;
    
    if (stats.total_records < 500) {
      // 初始阶段：核心TLD + 主要注册商
      tlds = PRIORITY_TLDS.slice(0, 8); // 前8个核心TLD
      registrars = PRIORITY_REGISTRARS.slice(0, 10); // 前10个注册商
      maxTasks = 80;
      logger.info('🚀 Bootstrap mode: Core TLDs + Priority registrars');
    } else if (stats.total_records < 2000) {
      // 扩展阶段：更多TLD
      tlds = PRIORITY_TLDS.slice(0, 20); // 前20个TLD
      registrars = PRIORITY_REGISTRARS.slice(0, 15); // 前15个注册商
      maxTasks = 300;
      logger.info('📈 Expansion mode: Extended TLDs');
    } else {
      // 正常运营：完整覆盖
      tlds = PRIORITY_TLDS; // 所有优先TLD
      registrars = PRIORITY_REGISTRARS; // 所有优先注册商
      maxTasks = CRAWL_CONFIG.DAILY_LIMIT;
      logger.info('🎯 Normal mode: Full coverage');
    }
    
    // 获取缺失的组合
    const missingCombinations = await getMissingCombinations(tlds, registrars, 24);
    logger.info(`🕳️ Found ${missingCombinations.length} missing combinations`);
    
    // 限制任务数量
    const tasks = missingCombinations.slice(0, maxTasks);
    
    logger.info(`📋 Generated crawl plan: ${tasks.length} tasks`);
    return tasks;
    
  } catch (error) {
    logger.error('Failed to generate crawl plan:', error.message);
    throw error;
  }
};

// 执行TLD采集任务（获取该TLD的所有注册商价格）
const executeTldCrawlTask = async (sessionId, tld) => {
  const startTime = Date.now();

  try {
    logger.info(`🔍 Crawling TLD: ${tld}`);

    // 获取该TLD的所有注册商价格
    const { getPricing } = require('./nazhumi-api');
    const allPrices = await getPricing(tld);
    const responseTime = Date.now() - startTime;

    logger.info(`✅ Got ${allPrices.length} registrars for ${tld}`);

    // 保存所有价格数据
    let savedCount = 0;
    for (const price of allPrices) {
      try {
        await savePricingDataMySQL(price);
        savedCount++;
      } catch (error) {
        logger.warn(`⚠️ Failed to save ${price.registrar}/${tld}: ${error.message}`);
      }
    }

    // 记录日志
    await logCrawlResult(sessionId, tld, 'all_registrars', 'completed', responseTime, savedCount);

    logger.info(`✅ TLD crawl completed: ${tld} (${savedCount}/${allPrices.length} saved, ${responseTime}ms)`);

    return {
      tld,
      status: 'completed',
      registrarsFound: allPrices.length,
      registrarsSaved: savedCount,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // 记录失败日志
    await logCrawlResult(sessionId, tld, 'all_registrars', 'failed', responseTime, 0, error.message);

    logger.error(`❌ TLD crawl failed: ${tld} - ${error.message} (${responseTime}ms)`);

    return {
      tld,
      status: 'failed',
      error: error.message,
      responseTime
    };
  }
};

// 执行单个采集任务（向后兼容）
const executeCrawlTask = async (sessionId, task) => {
  const { tld, registrar } = task;
  const startTime = Date.now();

  try {
    // 获取价格数据
    const pricingData = await fetchWithRetry(registrar, tld);
    const responseTime = Date.now() - startTime;

    // 保存到数据库
    await savePricingData(pricingData);

    // 更新任务状态
    await updateTaskStatus(tld, registrar, 'completed');

    // 记录日志
    await logCrawlAttempt(sessionId, tld, registrar, 'success', responseTime);
    crawlLogger.success(sessionId, tld, registrar, responseTime);
    
    return {
      status: 'success',
      tld,
      registrar,
      responseTime,
      data: pricingData
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // 更新任务状态
    await updateTaskStatus(tld, registrar, 'failed', error.message);
    
    // 记录日志
    await logCrawlAttempt(sessionId, tld, registrar, 'failed', responseTime, error.message);
    crawlLogger.error(sessionId, tld, registrar, error, responseTime);
    
    return {
      status: 'failed',
      tld,
      registrar,
      responseTime,
      error: error.message
    };
  }
};

// 主采集函数
const executeCrawl = async (options = {}) => {
  const sessionId = uuidv4();
  const {
    maxTasks = null,
    interval = CRAWL_CONFIG.REQUEST_INTERVAL,
    onProgress = null
  } = options;
  
  try {
    // 记录采集开始
    await setConfig('crawl_session_id', sessionId);
    await setConfig('last_crawl_start', new Date().toISOString());
    
    // 生成采集计划
    const tasks = await generateCrawlPlan();
    
    if (tasks.length === 0) {
      logger.info('🎉 No crawling needed - all data is fresh!');
      return {
        sessionId,
        totalTasks: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      };
    }
    
    // 限制任务数量
    const finalTasks = maxTasks ? tasks.slice(0, maxTasks) : tasks;
    
    crawlLogger.start(sessionId, finalTasks.length);
    
    const results = {
      sessionId,
      totalTasks: finalTasks.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      startTime: Date.now(),
      errors: []
    };
    
    // 执行采集任务
    for (let i = 0; i < finalTasks.length; i++) {
      const task = finalTasks[i];
      
      try {
        // 带宽友好的间隔
        if (i > 0) {
          await sleep(interval);
        }
        
        // 执行任务
        const result = await executeCrawlTask(sessionId, task);
        
        if (result.status === 'success') {
          results.completed++;
        } else {
          results.failed++;
          results.errors.push({
            tld: task.tld,
            registrar: task.registrar,
            error: result.error
          });
        }
        
        // 进度回调
        if (onProgress) {
          onProgress(i + 1, finalTasks.length, task, result);
        }
        
        // 定期进度报告
        if ((i + 1) % 50 === 0) {
          crawlLogger.progress(sessionId, i + 1, finalTasks.length, task);
        }
        
        // 检查失败率
        const failureRate = results.failed / (results.completed + results.failed);
        if (failureRate > CRAWL_CONFIG.FAILURE_RATE_THRESHOLD && (results.completed + results.failed) > 20) {
          logger.warn(`⚠️ High failure rate detected: ${(failureRate * 100).toFixed(1)}%. Stopping crawl.`);
          break;
        }
        
      } catch (error) {
        logger.error(`❌ Unexpected error processing task ${task.tld}/${task.registrar}:`, error.message);
        results.failed++;
      }
    }
    
    // 计算总耗时
    results.duration = Date.now() - results.startTime;
    results.successRate = ((results.completed / results.totalTasks) * 100).toFixed(1);
    
    // 记录采集完成
    await setConfig('last_crawl_end', new Date().toISOString());
    await setConfig('last_crawl_stats', JSON.stringify({
      completed: results.completed,
      failed: results.failed,
      successRate: results.successRate,
      duration: results.duration
    }));
    
    crawlLogger.complete(sessionId, results);
    
    return results;
    
  } catch (error) {
    logger.error('❌ Crawl execution failed:', error.message);
    throw error;
  }
};

// 检查是否在采集时间窗口内
const isInCrawlWindow = () => {
  const now = new Date();
  const hour = now.getHours();
  
  return hour >= CRAWL_CONFIG.CRAWL_WINDOW.START_HOUR && 
         hour < CRAWL_CONFIG.CRAWL_WINDOW.END_HOUR;
};

// 获取采集状态
const getCrawlStatus = async () => {
  try {
    const stats = await getDataStats();
    const lastCrawlStart = await getConfig('last_crawl_start');
    const lastCrawlEnd = await getConfig('last_crawl_end');
    const lastCrawlStats = await getConfig('last_crawl_stats');
    const currentSessionId = await getConfig('crawl_session_id');
    
    return {
      dataStats: stats,
      lastCrawlStart,
      lastCrawlEnd,
      lastCrawlStats: lastCrawlStats ? JSON.parse(lastCrawlStats) : null,
      currentSessionId,
      isInCrawlWindow: isInCrawlWindow(),
      nextCrawlWindow: getNextCrawlWindow()
    };
  } catch (error) {
    logger.error('Failed to get crawl status:', error.message);
    throw error;
  }
};

// 获取下次采集窗口时间
const getNextCrawlWindow = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(CRAWL_CONFIG.CRAWL_WINDOW.START_HOUR, 0, 0, 0);
  
  return tomorrow.toISOString();
};

// 新的TLD采集函数
const crawlByTlds = async () => {
  const sessionId = generateSessionId();
  const startTime = Date.now();

  try {
    logger.info('🚀 Starting TLD-based crawl session:', sessionId);

    // 获取要采集的TLD列表
    const { PRIORITY_TLDS } = require('../config/constants');
    const tlds = PRIORITY_TLDS.slice(0, 5); // 限制数量，避免过度使用API

    logger.info(`📋 Crawling ${tlds.length} TLDs: ${tlds.join(', ')}`);

    const results = [];
    let totalRegistrars = 0;
    let totalSaved = 0;

    // 逐个采集TLD
    for (let i = 0; i < tlds.length; i++) {
      const tld = tlds[i];

      try {
        // 添加延迟，避免API频率限制
        if (i > 0) {
          logger.info(`⏳ Waiting 5 seconds before next TLD...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        const result = await executeTldCrawlTask(sessionId, tld);
        results.push(result);

        if (result.status === 'completed') {
          totalRegistrars += result.registrarsFound;
          totalSaved += result.registrarsSaved;
        }

        logger.info(`📊 Progress: ${i + 1}/${tlds.length} TLDs completed`);

      } catch (error) {
        logger.error(`❌ Failed to crawl TLD ${tld}:`, error.message);
        results.push({
          tld,
          status: 'failed',
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'completed').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    // 更新系统配置
    await updateSystemConfig('last_crawl_time', new Date().toISOString());
    await updateSystemConfig('last_crawl_results', JSON.stringify({
      sessionId,
      totalTlds: tlds.length,
      completed: successCount,
      failed: failureCount,
      totalRegistrars,
      totalSaved,
      duration: Math.round(duration / 1000),
      timestamp: new Date().toISOString()
    }));

    logger.info(`🎉 TLD crawl session completed: ${successCount}/${tlds.length} TLDs, ${totalSaved} records saved (${Math.round(duration / 1000)}s)`);

    return {
      sessionId,
      status: 'completed',
      tlds: tlds.length,
      completed: successCount,
      failed: failureCount,
      totalRegistrars,
      totalSaved,
      duration: Math.round(duration / 1000)
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ TLD crawl session failed:', error.message);

    return {
      sessionId,
      status: 'failed',
      error: error.message,
      duration: Math.round(duration / 1000)
    };
  }
};

// 测试采集功能
const testCrawl = async () => {
  logger.info('🧪 Testing crawl functionality...');

  try {
    // 使用新的TLD采集方法测试
    const result = await executeTldCrawlTask('test-session', 'com');

    logger.info('✅ Crawl test completed:', result);
    return result;

  } catch (error) {
    logger.error('❌ Crawl test failed:', error.message);
    throw error;
  }
};

module.exports = {
  executeCrawl,
  generateCrawlPlan,
  executeCrawlTask,
  executeTldCrawlTask,
  crawlByTlds,
  isInCrawlWindow,
  getCrawlStatus,
  testCrawl
};
