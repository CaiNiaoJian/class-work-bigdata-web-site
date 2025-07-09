# 🚀 快速开始指南

## 1. 环境准备 (5分钟)

### 必需软件
```bash
# 检查Node.js版本 (需要 >= 16.0.0)
node --version

# 检查npm版本 (需要 >= 8.0.0)
npm --version

# 检查PostgreSQL是否运行
pg_isready
```

### 创建数据库
```sql
-- 登录PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE sipri_military_data;

-- 创建用户 (可选)
CREATE USER sipri_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sipri_military_data TO sipri_user;
```

## 2. 项目配置 (3分钟)

### 安装依赖
```bash
npm install
```

### 环境变量配置
创建 `.env` 文件：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sipri_military_data
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=false

NODE_ENV=development
PORT=3001
REACT_APP_API_URL=http://localhost:3001/api
```

## 3. 数据库初始化 (2分钟)

```bash
# 创建数据库表结构
npm run setup:db

# 导入SIPRI数据
npm run import:data
```

## 4. 启动应用 (1分钟)

```bash
# 一键启动前后端
npm run dev
```

## 5. 访问应用 ✅

- 📱 前端应用: http://localhost:3000
- 🔧 后端API: http://localhost:3001
- 📖 API文档: http://localhost:3001/api
- ❤️ 健康检查: http://localhost:3001/health

## 🎉 成功！

您现在可以：
- 浏览全球军事支出数据概览
- 查看各国详细数据
- 了解不同数据类型说明
- 通过API获取数据

## 🆘 遇到问题？

### 常见解决方案

**数据库连接失败**:
```bash
# 检查PostgreSQL服务
sudo service postgresql status
sudo service postgresql start
```

**端口冲突**:
```bash
# 修改.env文件中的PORT
PORT=3002
```

**数据导入失败**:
```bash
# 确认数据文件存在
ls public/data/*.csv

# 重新导入
npm run import:data
```

## 📞 获取帮助

如果遇到问题，请查看：
1. 📖 [完整README文档](README.md)
2. 🔧 [API文档](http://localhost:3001/api)
3. 📊 [数据说明](public/data/README.md) 