#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function testConnection() {
  console.log('🔍 测试数据库连接...');
  console.log(`📍 连接信息:`);
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log(`   SSL: ${process.env.DB_SSL}`);
  
  const client = await pool.connect();
  
  try {
    // 测试基本连接
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ 数据库连接成功!');
    console.log(`⏰ 服务器时间: ${result.rows[0].current_time}`);
    console.log(`📋 PostgreSQL版本: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // 检查现有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`📊 现有表数量: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('📋 现有表列表:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // 检查数据库大小
    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size('${process.env.DB_NAME}')) as db_size
    `);
    console.log(`💾 数据库大小: ${sizeResult.rows[0].db_size}`);
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  testConnection()
    .then((success) => {
      if (success) {
        console.log('\n🎉 数据库连接测试完成! 可以继续下一步操作。');
        process.exit(0);
      } else {
        console.log('\n💥 数据库连接测试失败! 请检查连接配置。');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testConnection }; 