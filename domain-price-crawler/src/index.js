#!/usr/bin/env node

require('dotenv').config();
const { testConnection } = require('./config/database');
const { testConnection: testAPI } = require('./services/nazhumi-api');
const { startScheduler, getSchedulerStatus } = require('./scheduler');
const { getCrawlStatus } = require('./services/crawler');
const { systemLogger, logger } = require('./utils/logger');

// 启动横幅
const printBanner = () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Domain Price Crawler                     ║
║                                                              ║
║  🌐 Nazhumi API Integration                                  ║
║  🗄️  MySQL Database                                          ║
║  ⏰ Scheduled Crawling                                       ║
║  📊 Bandwidth Optimized                                      ║
║                                                              ║
║  Version: 1.0.0                                             ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                      ║
╚══════════════════════════════════════════════════════════════╝
  `);
};

// 系统初始化检查
const initializeSystem = async () => {
  logger.info('🔧 Initializing system...');
  
  try {
    // 检查环境变量
    const requiredEnvVars = [
      'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // 测试数据库连接
    logger.info('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    systemLogger.dbConnect();
    
    // 测试API连接
    logger.info('🔍 Testing nazhumi API connection...');
    const apiConnected = await testAPI();
    if (!apiConnected) {
      logger.warn('⚠️ API connection test failed, but continuing startup...');
    }
    
    // 加载配置
    const config = {
      crawlInterval: process.env.CRAWL_INTERVAL_MS || 5000,
      maxConcurrent: process.env.MAX_CONCURRENT_REQUESTS || 1,
      dailyLimit: process.env.DAILY_CRAWL_LIMIT || 3600,
      logLevel: process.env.LOG_LEVEL || 'info'
    };
    systemLogger.configLoad(config);
    
    logger.info('✅ System initialization completed');
    return true;
    
  } catch (error) {
    logger.error('❌ System initialization failed:', error.message);
    return false;
  }
};

// 显示系统状态
const showSystemStatus = async () => {
  try {
    const schedulerStatus = getSchedulerStatus();
    const crawlStatus = await getCrawlStatus();
    
    console.log('\n📊 System Status:');
    console.log('─'.repeat(50));
    console.log(`🕐 Current Time: ${new Date().toLocaleString()}`);
    console.log(`⚡ Uptime: ${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`);
    console.log(`🔄 Scheduler Running: ${schedulerStatus.isRunning ? '✅' : '❌'}`);
    console.log(`⏰ In Crawl Window: ${schedulerStatus.isInCrawlWindow ? '✅' : '❌'}`);
    console.log(`📅 Next Crawl: ${new Date(schedulerStatus.nextCrawlTime).toLocaleString()}`);
    
    console.log('\n📈 Data Statistics:');
    console.log('─'.repeat(50));
    console.log(`📊 Total Records: ${crawlStatus.dataStats.total_records}`);
    console.log(`🏷️  Unique TLDs: ${crawlStatus.dataStats.unique_tlds}`);
    console.log(`🏢 Unique Registrars: ${crawlStatus.dataStats.unique_registrars}`);
    console.log(`🆕 Fresh Records (24h): ${crawlStatus.dataStats.fresh_records}`);
    console.log(`⏰ Average Age: ${parseFloat(crawlStatus.dataStats.avg_age_hours || 0).toFixed(1)}h`);
    
    if (crawlStatus.lastCrawlStats) {
      console.log('\n📋 Last Crawl:');
      console.log('─'.repeat(50));
      console.log(`✅ Completed: ${crawlStatus.lastCrawlStats.completed}`);
      console.log(`❌ Failed: ${crawlStatus.lastCrawlStats.failed}`);
      console.log(`📊 Success Rate: ${crawlStatus.lastCrawlStats.successRate}%`);
      console.log(`⏱️  Duration: ${Math.floor(crawlStatus.lastCrawlStats.duration / 1000 / 60)}m`);
    }
    
    console.log('\n');
    
  } catch (error) {
    logger.error('Failed to show system status:', error.message);
  }
};

// 主函数
const main = async () => {
  printBanner();
  
  // 系统初始化
  const initialized = await initializeSystem();
  if (!initialized) {
    process.exit(1);
  }
  
  // 显示系统状态
  await showSystemStatus();
  
  // 启动调度器
  startScheduler();
  
  // 定期显示状态（每小时）
  setInterval(showSystemStatus, 60 * 60 * 1000);
  
  logger.info('🚀 Domain Price Crawler is running...');
  logger.info('💡 Press Ctrl+C to stop');
};

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npm start [options]

Options:
  --help, -h     Show this help message
  --status, -s   Show system status and exit
  --test, -t     Run test crawl and exit
  --setup        Run database setup

Environment Variables:
  DB_HOST        Database host (required)
  DB_PORT        Database port (default: 5432)
  DB_NAME        Database name (required)
  DB_USER        Database user (required)
  DB_PASSWORD    Database password (required)
  
  CRAWL_INTERVAL_MS     Interval between requests (default: 5000)
  MAX_CONCURRENT_REQUESTS   Max concurrent requests (default: 1)
  DAILY_CRAWL_LIMIT     Daily crawl limit (default: 3600)
  LOG_LEVEL             Log level (default: info)

Examples:
  npm start              # Start the crawler
  npm run setup          # Setup database
  npm run test           # Run test crawl
  `);
  process.exit(0);
}

if (args.includes('--status') || args.includes('-s')) {
  initializeSystem().then(async (success) => {
    if (success) {
      await showSystemStatus();
    }
    process.exit(success ? 0 : 1);
  });
} else if (args.includes('--test') || args.includes('-t')) {
  initializeSystem().then(async (success) => {
    if (success) {
      const { testCrawl } = require('./services/crawler');
      try {
        await testCrawl();
        logger.info('✅ Test completed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Test failed:', error.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  });
} else {
  // 正常启动
  main().catch((error) => {
    logger.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

// 导出主要功能供其他模块使用
module.exports = {
  main,
  initializeSystem,
  showSystemStatus
};
