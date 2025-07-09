#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sipri_military_data',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 开始设置数据库...');
    
    // 读取SQL schema文件
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 执行schema
    console.log('📋 创建数据库表和索引...');
    await client.query(schema);
    console.log('✅ 数据库表创建完成');
    
    // 验证表是否创建成功
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 创建的表:');
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 检查数据类型是否已初始化
    const dataTypesCheck = await client.query('SELECT COUNT(*) as count FROM data_types');
    console.log(`📈 数据类型数量: ${dataTypesCheck.rows[0].count}`);
    
    console.log('🎉 数据库设置完成!');
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✨ 数据库初始化成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 