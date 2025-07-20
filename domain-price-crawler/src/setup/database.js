const { query, testConnection } = require('../config/database');

// 数据库表结构
const createTables = async () => {
  console.log('🔧 Creating database tables...');

  // 1. 价格数据表
  await query(`
    CREATE TABLE IF NOT EXISTS pricing_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tld VARCHAR(50) NOT NULL,
      registrar VARCHAR(50) NOT NULL,
      registrar_name VARCHAR(100),
      registrar_url VARCHAR(255),
      registration_price DECIMAL(10,2),
      renewal_price DECIMAL(10,2),
      transfer_price DECIMAL(10,2),
      currency VARCHAR(10),
      currency_name VARCHAR(50),
      currency_type VARCHAR(20),
      has_promo BOOLEAN DEFAULT FALSE,
      promo_code VARCHAR(50),
      updated_time TIMESTAMP NULL,
      crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      source VARCHAR(20) DEFAULT 'scheduled',
      is_active BOOLEAN DEFAULT TRUE,
      UNIQUE KEY unique_tld_registrar (tld, registrar),
      INDEX idx_tld (tld),
      INDEX idx_registrar (registrar),
      INDEX idx_crawled_at (crawled_at),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. 采集任务队列表
  await query(`
    CREATE TABLE IF NOT EXISTS crawl_queue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tld VARCHAR(50) NOT NULL,
      registrar VARCHAR(50) NOT NULL,
      priority INT DEFAULT 1,
      status VARCHAR(20) DEFAULT 'pending',
      scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      attempts INT DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      UNIQUE KEY unique_tld_registrar_queue (tld, registrar),
      INDEX idx_status (status),
      INDEX idx_priority (priority DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. 采集日志表
  await query(`
    CREATE TABLE IF NOT EXISTS crawl_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(50),
      tld VARCHAR(50),
      registrar VARCHAR(50),
      status VARCHAR(20),
      response_time_ms INT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (session_id),
      INDEX idx_tld_registrar (tld, registrar),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 4. 系统配置表
  await query(`
    CREATE TABLE IF NOT EXISTS system_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      config_key VARCHAR(50) UNIQUE NOT NULL,
      config_value TEXT,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_config_key (config_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 5. 实时查询记录表
  await query(`
    CREATE TABLE IF NOT EXISTS query_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tld VARCHAR(50) NOT NULL,
      query_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      results_count INT,
      source VARCHAR(20),
      ip_address VARCHAR(45), -- 支持IPv6
      INDEX idx_tld_time (tld, query_time),
      INDEX idx_query_time (query_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Database tables created successfully');
};

// 创建索引 - MySQL版本中索引已在CREATE TABLE中创建
const createIndexes = async () => {
  console.log('🔧 Database indexes already created with tables...');

  // MySQL中我们已经在CREATE TABLE语句中创建了所有需要的索引
  // 这里可以添加一些额外的复合索引如果需要的话

  try {
    // MySQL不支持 IF NOT EXISTS 在索引创建中，需要用不同的方法
    // 尝试创建索引，如果已存在会报错但不影响程序

    await query(`
      CREATE INDEX idx_pricing_tld_active
      ON pricing_data(tld, is_active)
    `);

  } catch (error) {
    // 索引可能已存在，忽略错误
    console.log('📝 Index idx_pricing_tld_active may already exist, continuing...');
  }

  try {
    await query(`
      CREATE INDEX idx_pricing_registrar_active
      ON pricing_data(registrar, is_active)
    `);

  } catch (error) {
    // 索引可能已存在，忽略错误
    console.log('📝 Index idx_pricing_registrar_active may already exist, continuing...');
  }

  console.log('✅ Database indexes verified successfully');
};

// 插入初始配置
const insertInitialConfig = async () => {
  console.log('🔧 Inserting initial configuration...');

  const configs = [
    ['last_crawl_time', null, 'Last successful crawl completion time'],
    ['crawl_session_id', null, 'Current crawl session ID'],
    ['total_combinations', '0', 'Total TLD-Registrar combinations'],
    ['successful_crawls', '0', 'Number of successful crawls today'],
    ['failed_crawls', '0', 'Number of failed crawls today'],
    ['daily_crawl_limit', '3600', 'Maximum crawls per day'],
    ['crawl_interval_ms', '5000', 'Interval between requests in milliseconds']
  ];

  for (const [key, value, description] of configs) {
    await query(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE config_key = config_key
    `, [key, value, description]);
  }

  console.log('✅ Initial configuration inserted successfully');
};

// 主安装函数
const setupDatabase = async () => {
  console.log('🚀 Setting up database...');

  try {
    // 测试连接
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // 创建表
    await createTables();

    // 创建索引
    await createIndexes();

    // 插入初始配置
    await insertInitialConfig();

    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Copy .env.example to .env and configure your settings');
    console.log('2. Run: npm run test');
    console.log('3. Run: npm start');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
};

// 如果直接运行此文件
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  createTables,
  createIndexes,
  insertInitialConfig
};
