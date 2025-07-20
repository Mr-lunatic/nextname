const cron = require('node-cron');
const { executeCrawl, isInCrawlWindow } = require('./services/crawler');
const { cleanupOldData } = require('./services/database');
const { syncToCloudflareD1 } = require('./sync/cloudflare-sync');
const { systemLogger, logger } = require('./utils/logger');
const { CRAWL_CONFIG } = require('./config/constants');

// 调度器状态
let isRunning = false;
let currentCrawlPromise = null;

// 主采集任务
const dailyCrawlTask = async () => {
  if (isRunning) {
    logger.warn('⚠️ Crawl already running, skipping this execution');
    return;
  }
  
  if (!isInCrawlWindow()) {
    logger.info('⏰ Outside crawl window, skipping execution');
    return;
  }
  
  isRunning = true;
  
  try {
    logger.info('🚀 Starting scheduled crawl...');
    
    const results = await executeCrawl({
      interval: CRAWL_CONFIG.REQUEST_INTERVAL,
      onProgress: (completed, total, current, result) => {
        // 每100个任务报告一次进度
        if (completed % 100 === 0) {
          logger.info(`📊 Crawl progress: ${completed}/${total} (${(completed/total*100).toFixed(1)}%)`);
        }
      }
    });
    
    logger.info('✅ Scheduled crawl completed:', {
      completed: results.completed,
      failed: results.failed,
      successRate: results.successRate,
      duration: `${(results.duration / 1000 / 60).toFixed(1)}min`
    });
    
  } catch (error) {
    logger.error('❌ Scheduled crawl failed:', error.message);
  } finally {
    isRunning = false;
  }
};

// 数据清理任务
const cleanupTask = async () => {
  try {
    logger.info('🧹 Starting data cleanup...');

    const deletedCount = await cleanupOldData(30); // 保留30天数据

    logger.info(`✅ Data cleanup completed: ${deletedCount} records cleaned`);
  } catch (error) {
    logger.error('❌ Data cleanup failed:', error.message);
  }
};

// Cloudflare D1同步任务
const syncTask = async () => {
  try {
    logger.info('📤 Starting Cloudflare D1 sync...');

    const result = await syncToCloudflareD1();

    logger.info(`✅ D1 sync completed: ${result.recordsSync} records synced`);
  } catch (error) {
    logger.error('❌ D1 sync failed:', error.message);
  }
};

// 健康检查任务
const healthCheckTask = async () => {
  try {
    const { testConnection } = require('./services/nazhumi-api');
    const { testConnection: testDB } = require('./config/database');
    
    // 测试API连接
    const apiHealthy = await testConnection();
    
    // 测试数据库连接
    const dbHealthy = await testDB();
    
    logger.info('💓 Health check:', {
      api: apiHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Health check failed:', error.message);
  }
};

// 启动调度器
const startScheduler = () => {
  systemLogger.startup();
  
  // 每日凌晨2点开始采集
  cron.schedule('0 2 * * *', dailyCrawlTask, {
    scheduled: true,
    timezone: "Asia/Shanghai"
  });
  
  // 每日凌晨1点清理数据
  cron.schedule('0 1 * * *', cleanupTask, {
    scheduled: true,
    timezone: "Asia/Shanghai"
  });

  // 每日早上7点同步到Cloudflare D1
  cron.schedule('0 7 * * *', syncTask, {
    scheduled: true,
    timezone: "Asia/Shanghai"
  });

  // 每小时健康检查
  cron.schedule('0 * * * *', healthCheckTask, {
    scheduled: true,
    timezone: "Asia/Shanghai"
  });
  
  systemLogger.scheduleStart({
    crawl: '0 2 * * * (Asia/Shanghai)',
    cleanup: '0 1 * * * (Asia/Shanghai)',
    sync: '0 7 * * * (Asia/Shanghai)',
    healthCheck: '0 * * * * (Asia/Shanghai)'
  });
  
  logger.info('⏰ Scheduler started successfully');
  
  // 立即执行一次健康检查
  setTimeout(healthCheckTask, 5000);
};

// 停止调度器
const stopScheduler = () => {
  systemLogger.shutdown();
  
  // 停止所有定时任务
  cron.getTasks().forEach(task => task.stop());
  
  // 如果有正在运行的采集任务，等待完成
  if (currentCrawlPromise) {
    logger.info('⏳ Waiting for current crawl to complete...');
    return currentCrawlPromise;
  }
  
  logger.info('🛑 Scheduler stopped');
};

// 手动触发采集
const triggerManualCrawl = async (options = {}) => {
  if (isRunning) {
    throw new Error('Crawl already running');
  }
  
  logger.info('🔧 Manual crawl triggered');
  
  isRunning = true;
  currentCrawlPromise = executeCrawl(options);
  
  try {
    const results = await currentCrawlPromise;
    return results;
  } finally {
    isRunning = false;
    currentCrawlPromise = null;
  }
};

// 获取调度器状态
const getSchedulerStatus = () => {
  const tasks = cron.getTasks();
  
  return {
    isRunning,
    activeTasks: tasks.size,
    currentTime: new Date().toISOString(),
    isInCrawlWindow: isInCrawlWindow(),
    nextCrawlTime: getNextCrawlTime(),
    uptime: process.uptime()
  };
};

// 获取下次采集时间
const getNextCrawlTime = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  
  // 如果当前时间在采集窗口前，则今天就会执行
  if (now.getHours() < CRAWL_CONFIG.CRAWL_WINDOW.START_HOUR) {
    tomorrow.setHours(CRAWL_CONFIG.CRAWL_WINDOW.START_HOUR, 0, 0, 0);
  } else {
    // 否则明天执行
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(CRAWL_CONFIG.CRAWL_WINDOW.START_HOUR, 0, 0, 0);
  }
  
  return tomorrow.toISOString();
};

// 优雅关闭处理
const gracefulShutdown = async (signal) => {
  logger.info(`📡 Received ${signal}, starting graceful shutdown...`);
  
  try {
    await stopScheduler();
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

// 注册信号处理器
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = {
  startScheduler,
  stopScheduler,
  triggerManualCrawl,
  getSchedulerStatus,
  dailyCrawlTask,
  cleanupTask,
  healthCheckTask
};
