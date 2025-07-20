const axios = require('axios');
const { API_CONFIG } = require('../config/constants');
const { logger } = require('../utils/logger');

// 创建axios实例，优化带宽使用
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'User-Agent': API_CONFIG.USER_AGENT,
    ...API_CONFIG.HEADERS
  },
  // 启用压缩以节省带宽
  decompress: true,
  // 保持连接以减少握手开销
  httpAgent: new (require('http').Agent)({ keepAlive: true }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true })
});

// 请求拦截器 - 添加请求日志
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    logger.error('API request setup failed:', error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 添加响应时间和错误处理
apiClient.interceptors.response.use(
  (response) => {
    const responseTime = Date.now() - response.config.metadata.startTime;
    response.responseTime = responseTime;
    return response;
  },
  (error) => {
    if (error.config && error.config.metadata) {
      error.responseTime = Date.now() - error.config.metadata.startTime;
    }
    return Promise.reject(error);
  }
);

// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 获取特定TLD的价格信息（所有注册商）
const getPricing = async (tld, order = 'new') => {
  const startTime = Date.now();

  try {
    logger.debug(`🔍 Fetching pricing for: ${tld} (order: ${order})`);

    const response = await apiClient.get('', {
      params: {
        domain: tld.startsWith('.') ? tld.substring(1) : tld,
        order: order
      }
    });

    const responseTime = Date.now() - startTime;

    // 验证响应格式
    if (!response.data || response.data.code !== 100) {
      throw new Error(`Invalid API response: ${JSON.stringify(response.data)}`);
    }

    const data = response.data.data;
    if (!data || !data.price || !Array.isArray(data.price)) {
      throw new Error('No price data in API response');
    }

    // 标准化数据格式
    const normalizedData = data.price.map(item => ({
      tld: data.domain || tld,
      registrar: item.registrar,
      registrarName: item.registrarname || '',
      registrarUrl: item.registrarweb || '',
      registrationPrice: parseFloat(item.new) || null,
      renewalPrice: parseFloat(item.renew) || null,
      transferPrice: parseFloat(item.transfer) || null,
      currency: item.currency || 'USD',
      currencyName: item.currencyname || '',
      currencyType: item.currencytype || '',
      hasPromo: item.promocode || false,
      updatedTime: item.updatedtime || new Date().toISOString(),
      responseTime
    }));

    // 验证至少有一个有效价格
    const validPrices = normalizedData.filter(item =>
      item.registrationPrice || item.renewalPrice || item.transferPrice
    );

    if (validPrices.length === 0) {
      throw new Error('No valid price data found');
    }

    logger.debug(`✅ Pricing fetched successfully: ${tld} (${validPrices.length} registrars, ${responseTime}ms)`);
    return validPrices;

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // 处理不同类型的错误
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timeout after ${API_CONFIG.TIMEOUT}ms`);
    } else if (error.response) {
      // HTTP错误响应
      const status = error.response.status;
      if (status === 429) {
        throw new Error('Rate limit exceeded');
      } else if (status === 404) {
        throw new Error('API endpoint not found');
      } else if (status >= 500) {
        throw new Error(`Server error: ${status}`);
      } else {
        throw new Error(`HTTP error: ${status}`);
      }
    } else if (error.request) {
      // 网络错误
      throw new Error('Network error - no response received');
    } else {
      // 其他错误
      throw error;
    }
  }
};

// 获取特定注册商和TLD的价格信息（向后兼容）
const fetchRegistrarPrice = async (registrar, tld) => {
  try {
    const allPrices = await getPricing(tld);
    const registrarPrice = allPrices.find(price => price.registrar === registrar);

    if (!registrarPrice) {
      throw new Error(`No price data found for registrar: ${registrar}`);
    }

    return registrarPrice;
  } catch (error) {
    throw error;
  }
};

// 带重试机制的价格获取
const fetchWithRetry = async (registrar, tld, maxRetries = API_CONFIG.MAX_RETRIES) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchRegistrarPrice(registrar, tld);
      
      // 成功时，如果不是第一次尝试，记录重试成功
      if (attempt > 1) {
        logger.info(`✅ Retry successful: ${registrar}/${tld} (attempt ${attempt})`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      logger.warn(`❌ Attempt ${attempt}/${maxRetries} failed: ${registrar}/${tld} - ${error.message}`);
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        const delay = API_CONFIG.RETRY_DELAY * attempt; // 递增延迟
        logger.debug(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
        
        // 如果是频率限制错误，等待更长时间
        if (error.message.includes('Rate limit')) {
          await sleep(30000); // 额外等待30秒
        }
      }
    }
  }
  
  // 所有重试都失败了
  throw lastError;
};

// 批量获取价格（带带宽控制）
const fetchBatchPrices = async (tasks, options = {}) => {
  const {
    interval = 5000,
    onProgress = null,
    onError = null,
    maxConcurrent = 1
  } = options;
  
  const results = [];
  const errors = [];
  
  logger.info(`📦 Starting batch fetch: ${tasks.length} tasks`);
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    
    try {
      // 带宽友好的间隔
      if (i > 0) {
        await sleep(interval);
      }
      
      const result = await fetchWithRetry(task.registrar, task.tld);
      results.push({ ...task, ...result, status: 'success' });
      
      // 进度回调
      if (onProgress) {
        onProgress(i + 1, tasks.length, task);
      }
      
    } catch (error) {
      const errorResult = { ...task, error: error.message, status: 'failed' };
      errors.push(errorResult);
      
      // 错误回调
      if (onError) {
        onError(error, task);
      }
      
      logger.warn(`❌ Batch item failed: ${task.registrar}/${task.tld} - ${error.message}`);
    }
  }
  
  logger.info(`📦 Batch fetch completed: ${results.length} success, ${errors.length} failed`);
  
  return {
    results,
    errors,
    total: tasks.length,
    successCount: results.length,
    errorCount: errors.length,
    successRate: (results.length / tasks.length * 100).toFixed(1)
  };
};

// 测试API连接
const testConnection = async () => {
  try {
    logger.info('🔍 Testing nazhumi API connection...');

    const results = await getPricing('com');

    logger.info('✅ API connection test successful', {
      tld: 'com',
      registrars: results.length,
      samplePrice: results[0]?.registrationPrice,
      responseTime: results[0]?.responseTime
    });

    return true;

  } catch (error) {
    logger.error('❌ API connection test failed:', error.message);
    return false;
  }
};

module.exports = {
  getPricing,
  fetchRegistrarPrice,
  fetchWithRetry,
  fetchBatchPrices,
  testConnection
};
