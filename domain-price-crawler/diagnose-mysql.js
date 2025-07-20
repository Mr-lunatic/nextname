#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('🔍 MySQL Connection Diagnostics');
console.log('═'.repeat(50));

// 显示配置信息
console.log('📋 Configuration:');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   Port: ${process.env.DB_PORT || 3306}`);
console.log(`   Database: ${process.env.DB_NAME || 'domain_pricing'}`);
console.log(`   User: ${process.env.DB_USER || 'not set'}`);
console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);
console.log('');

// 测试1：基本连接测试
const testBasicConnection = async () => {
  console.log('🔧 Test 1: Basic Connection');
  console.log('─'.repeat(30));
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectTimeout: 10000
    });
    
    console.log('✅ Basic connection: SUCCESS');
    await connection.end();
    return true;
  } catch (error) {
    console.log('❌ Basic connection: FAILED');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    return false;
  }
};

// 测试2：数据库连接测试
const testDatabaseConnection = async () => {
  console.log('\n🔧 Test 2: Database Connection');
  console.log('─'.repeat(30));
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });
    
    const [result] = await connection.query('SELECT 1 as test');
    console.log('✅ Database connection: SUCCESS');
    console.log(`   Test query result: ${result[0].test}`);
    await connection.end();
    return true;
  } catch (error) {
    console.log('❌ Database connection: FAILED');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    return false;
  }
};

// 测试3：权限测试
const testPermissions = async () => {
  console.log('\n🔧 Test 3: Permissions');
  console.log('─'.repeat(30));
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });
    
    // 测试创建表权限
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_field VARCHAR(50)
      )
    `);
    
    // 测试插入权限
    await connection.query(`
      INSERT INTO test_permissions (test_field) VALUES ('test')
    `);
    
    // 测试查询权限
    const [result] = await connection.query(`
      SELECT * FROM test_permissions LIMIT 1
    `);
    
    // 清理测试表
    await connection.query(`DROP TABLE test_permissions`);
    
    console.log('✅ Permissions: SUCCESS');
    console.log('   - CREATE: ✅');
    console.log('   - INSERT: ✅');
    console.log('   - SELECT: ✅');
    console.log('   - DROP: ✅');
    
    await connection.end();
    return true;
  } catch (error) {
    console.log('❌ Permissions: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// 系统检查
const checkSystem = async () => {
  console.log('\n🔧 System Checks');
  console.log('─'.repeat(30));
  
  // 检查MySQL服务
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('systemctl is-active mysql', (error, stdout, stderr) => {
      if (stdout.trim() === 'active') {
        console.log('✅ MySQL service: RUNNING');
      } else {
        console.log('❌ MySQL service: NOT RUNNING');
        console.log('   Try: sudo systemctl start mysql');
      }
      
      // 检查端口
      exec('netstat -tlnp | grep :3306', (error, stdout, stderr) => {
        if (stdout.includes(':3306')) {
          console.log('✅ MySQL port 3306: LISTENING');
        } else {
          console.log('❌ MySQL port 3306: NOT LISTENING');
        }
        resolve();
      });
    });
  });
};

// 主函数
const main = async () => {
  try {
    // 系统检查
    await checkSystem();
    
    // 连接测试
    const basicOk = await testBasicConnection();
    
    if (basicOk) {
      const dbOk = await testDatabaseConnection();
      
      if (dbOk) {
        await testPermissions();
      }
    }
    
    console.log('\n📋 Diagnosis Complete');
    console.log('═'.repeat(50));
    
    if (!basicOk) {
      console.log('\n💡 Suggestions:');
      console.log('1. Check if MySQL service is running: sudo systemctl status mysql');
      console.log('2. Check if database user exists in宝塔面板');
      console.log('3. Verify password in .env file');
      console.log('4. Check if MySQL is listening on port 3306');
    }
    
  } catch (error) {
    console.error('💥 Diagnosis failed:', error.message);
  }
};

main();
