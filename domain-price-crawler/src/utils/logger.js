const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // 文件输出 - 所有日志
    new winston.transports.File({
      filename: path.join(logDir, 'crawler.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // 文件输出 - 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      tailable: true
    }),
    
    // 文件输出 - 采集日志
    new winston.transports.File({
      filename: path.join(logDir, 'crawl.log'),
      level: 'info',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 7,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// 采集专用日志方法
const crawlLogger = {
  start: (sessionId, totalTasks) => {
    logger.info(`🚀 Crawl session started`, {
      sessionId,
      totalTasks,
      timestamp: new Date().toISOString()
    });
  },
  
  progress: (sessionId, completed, total, current) => {
    const percentage = ((completed / total) * 100).toFixed(1);
    logger.info(`📊 Crawl progress: ${percentage}%`, {
      sessionId,
      completed,
      total,
      percentage,
      current: current ? `${current.tld}/${current.registrar}` : null
    });
  },
  
  success: (sessionId, tld, registrar, responseTime) => {
    logger.info(`✅ Crawl success: ${tld}/${registrar}`, {
      sessionId,
      tld,
      registrar,
      responseTime,
      status: 'success'
    });
  },
  
  error: (sessionId, tld, registrar, error, responseTime) => {
    logger.warn(`❌ Crawl failed: ${tld}/${registrar}`, {
      sessionId,
      tld,
      registrar,
      error: error.message,
      responseTime,
      status: 'failed'
    });
  },
  
  complete: (sessionId, stats) => {
    logger.info(`🎉 Crawl session completed`, {
      sessionId,
      ...stats,
      timestamp: new Date().toISOString()
    });
  },
  
  skip: (sessionId, tld, registrar, reason) => {
    logger.info(`⏭️ Crawl skipped: ${tld}/${registrar}`, {
      sessionId,
      tld,
      registrar,
      reason,
      status: 'skipped'
    });
  }
};

// 同步专用日志方法
const syncLogger = {
  start: (totalRecords) => {
    logger.info(`📤 Sync started`, {
      totalRecords,
      timestamp: new Date().toISOString()
    });
  },
  
  progress: (completed, total) => {
    const percentage = ((completed / total) * 100).toFixed(1);
    logger.info(`📊 Sync progress: ${percentage}%`, {
      completed,
      total,
      percentage
    });
  },
  
  complete: (stats) => {
    logger.info(`✅ Sync completed`, {
      ...stats,
      timestamp: new Date().toISOString()
    });
  },
  
  error: (error) => {
    logger.error(`❌ Sync failed`, {
      error: error.message,
      stack: error.stack
    });
  }
};

// 系统日志方法
const systemLogger = {
  startup: () => {
    logger.info('🚀 Domain Price Crawler starting up...');
  },
  
  shutdown: () => {
    logger.info('🛑 Domain Price Crawler shutting down...');
  },
  
  dbConnect: () => {
    logger.info('✅ Database connected successfully');
  },
  
  dbError: (error) => {
    logger.error('❌ Database connection failed', { error: error.message });
  },
  
  configLoad: (config) => {
    logger.info('⚙️ Configuration loaded', config);
  },
  
  scheduleStart: (schedule) => {
    logger.info('⏰ Scheduler started', { schedule });
  }
};

module.exports = {
  logger,
  crawlLogger,
  syncLogger,
  systemLogger
};
