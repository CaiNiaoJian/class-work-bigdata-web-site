const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection, closePool } = require('./config/database');
const dataRoutes = require('./api/routes/dataRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 为public目录中的数据文件提供访问
app.use('/public', express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/data', dataRoutes);

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API文档端点
app.get('/api', (req, res) => {
  res.json({
    name: 'SIPRI军事支出数据API',
    version: '1.0.0',
    description: '提供SIPRI军事支出数据的RESTful API服务',
    endpoints: {
      'GET /health': '健康检查',
      'GET /api/data/countries': '获取所有国家列表',
      'GET /api/data/types': '获取数据类型列表',
      'GET /api/data/country/:id/timeseries': '获取国家时间序列数据',
      'GET /api/data/year/:year/comparison': '获取年度横截面数据',
      'POST /api/data/query': '自定义数据查询',
      'GET /api/data/summary': '获取数据统计概要',
      'POST /api/data/import': '导入数据（管理员）',
      'GET /api/data/import/logs': '获取导入日志'
    },
    documentation: 'https://github.com/your-repo/api-docs'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路径 ${req.originalUrl} 不存在`,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'GET /api/data/*'
    ]
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    console.log('🔍 检查数据库连接...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  数据库连接失败，但服务器将继续启动');
    }

    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`
🚀 SIPRI军事支出数据API服务器启动成功!
📍 服务器地址: http://localhost:${PORT}
🔗 API文档: http://localhost:${PORT}/api
❤️  健康检查: http://localhost:${PORT}/health
🌍 环境: ${process.env.NODE_ENV || 'development'}
${dbConnected ? '✅ 数据库: 已连接' : '❌ 数据库: 未连接'}
      `);
    });

    // 优雅关闭处理
    const gracefulShutdown = async () => {
      console.log('\n🛑 收到关闭信号，正在优雅关闭服务器...');
      
      server.close(async () => {
        console.log('📴 HTTP服务器已关闭');
        
        try {
          await closePool();
          console.log('📴 数据库连接池已关闭');
          process.exit(0);
        } catch (error) {
          console.error('❌ 关闭数据库连接时出错:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
if (require.main === module) {
  startServer();
}

module.exports = app; 