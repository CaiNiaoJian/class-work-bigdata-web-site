const { Pool } = require('pg');
require('dotenv').config();

// 数据库连接池配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sipri_military_data',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// 创建连接池
const pool = new Pool(poolConfig);

// 连接错误处理
pool.on('error', (err, client) => {
  console.error('数据库连接池出现错误:', err);
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return false;
  }
};

// 优雅关闭连接池
const closePool = async () => {
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (err) {
    console.error('关闭数据库连接池时出错:', err);
  }
};

module.exports = {
  pool,
  testConnection,
  closePool
}; 