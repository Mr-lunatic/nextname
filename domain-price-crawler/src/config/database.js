const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'domain_pricing',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 10, // 最大连接数
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: false,
  connectTimeout: 60000,
  waitForConnections: true
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT NOW() as now');
    console.log('✅ Database connected successfully:', result[0].now);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// 执行查询的辅助函数
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const [result] = await pool.execute(text, params);
    const duration = Date.now() - start;

    // MySQL返回格式不同，需要适配
    const rowCount = Array.isArray(result) ? result.length : result.affectedRows || 0;
    console.log('📊 Query executed:', {
      text: text.substring(0, 50) + '...',
      duration: `${duration}ms`,
      rows: rowCount
    });

    // 统一返回格式，兼容原有代码
    return {
      rows: Array.isArray(result) ? result : [],
      rowCount: rowCount,
      insertId: result.insertId || null
    };
  } catch (error) {
    console.error('❌ Query error:', { text: text.substring(0, 50) + '...', error: error.message });
    throw error;
  }
};

// 事务处理
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 创建一个适配器，让callback使用统一的接口
    const adapter = {
      query: async (text, params = []) => {
        const [result] = await connection.execute(text, params);
        const rowCount = Array.isArray(result) ? result.length : result.affectedRows || 0;
        return {
          rows: Array.isArray(result) ? result : [],
          rowCount: rowCount,
          insertId: result.insertId || null
        };
      }
    };

    const result = await callback(adapter);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
