# 🛡️ SIPRI军事支出数据分析平台

一个基于 React + TypeScript + Node.js + PostgreSQL 的全栈数据可视化平台，专门用于分析和展示斯德哥尔摩国际和平研究所(SIPRI)的全球军事支出数据(1949-2024)。

## 🎯 项目特色

- **权威数据源**: 使用SIPRI官方发布的全球军事支出数据
- **多维度分析**: 7种不同计算方式的军事支出数据
- **时间跨度**: 涵盖1949-2024年，75年历史数据
- **全球覆盖**: 包含世界主要国家和地区的完整数据
- **现代化技术栈**: React 18 + TypeScript + Node.js + PostgreSQL
- **响应式设计**: 支持桌面和移动设备访问

## 🏗️ 技术架构

```
前端 (React + TypeScript)
├── 数据仪表板组件
├── 数据可视化界面
└── 响应式UI设计

后端 API (Node.js + Express)
├── RESTful API服务
├── 数据查询接口
└── 数据导入服务

数据库 (PostgreSQL)
├── 结构化数据存储
├── 索引优化查询
└── 数据完整性约束

数据处理
├── CSV/JSON格式支持
├── 自动化数据导入
└── 数据质量验证
```

## 📦 安装和配置

### 1. 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL >= 12.0
- Git

### 2. 克隆项目

```bash
git clone <repository-url>
cd sipri-military-data-platform
```

### 3. 安装依赖

```bash
npm install
```

### 4. 数据库配置

1. 创建PostgreSQL数据库:
```sql
CREATE DATABASE sipri_military_data;
```

2. 创建环境变量文件 `.env`:
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sipri_military_data
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=false

# 应用配置
NODE_ENV=development
PORT=3001

# React 应用配置
REACT_APP_API_URL=http://localhost:3001/api
```

3. 初始化数据库结构:
```bash
npm run setup:db
```

### 5. 数据导入

```bash
# 导入SIPRI数据到数据库
npm run import:data
```

## 🚀 启动应用

### 开发模式 (推荐)

```bash
# 同时启动前端和后端开发服务器
npm run dev
```

访问地址:
- 前端应用: http://localhost:3000
- 后端API: http://localhost:3001
- API文档: http://localhost:3001/api

### 分别启动

```bash
# 启动后端API服务器
npm run server

# 启动前端开发服务器 (新终端)
npm start
```

## 📊 数据说明

### 数据来源
- **来源**: 斯德哥尔摩国际和平研究所 (SIPRI)
- **时间范围**: 1949年 - 2024年
- **更新频率**: 年度更新
- **数据权威性**: 国际公认的军事支出统计标准

### 数据类型

1. **本国货币财政年度** - 避免汇率波动影响
2. **本国货币日历年度** - 标准化年度统计
3. **2023年不变美元** - 消除通胀影响
4. **当年美元** - 反映名义支出水平
5. **占GDP比重** - 相对经济规模衡量
6. **人均军事支出** - 人均负担水平
7. **占政府支出比重** - 政府预算优先级

## 🔧 可用脚本

### 开发相关
- `npm start` - 启动前端开发服务器
- `npm run server` - 启动后端API服务器
- `npm run dev` - 同时启动前后端开发服务器

### 数据库相关
- `npm run setup:db` - 初始化数据库结构
- `npm run import:data` - 导入SIPRI数据

### 构建和测试
- `npm run build` - 构建生产版本
- `npm test` - 运行测试

## 🌐 API端点

### 基础信息
- `GET /health` - 健康检查
- `GET /api` - API文档
- `GET /api/data/summary` - 数据统计概要

### 数据查询
- `GET /api/data/countries` - 获取国家列表
- `GET /api/data/types` - 获取数据类型
- `GET /api/data/country/:id/timeseries` - 国家时间序列数据
- `GET /api/data/year/:year/comparison` - 年度横截面数据
- `POST /api/data/query` - 自定义数据查询

### 数据管理
- `POST /api/data/import` - 导入数据
- `GET /api/data/import/logs` - 导入日志

## 🎨 功能特色

### 数据仪表板
- 📊 **数据概览**: 总体统计和趋势分析
- 🌍 **国家列表**: 完整的国家和地区数据
- 📈 **数据类型**: 详细的数据类型说明

### 数据可视化
- 📈 时间序列图表
- 📊 国家对比分析
- 🌍 地区分布统计
- 📅 年度数据覆盖

### 用户体验
- 🎨 现代化UI设计
- 📱 响应式布局
- ⚡ 快速数据加载
- 🔄 自动错误恢复

## 📁 项目结构

```
sipri-military-data-platform/
├── public/                    # 静态资源和数据文件
│   ├── data/                  # SIPRI数据文件
│   │   ├── *.csv             # CSV格式数据
│   │   ├── *.json            # JSON格式数据
│   │   └── README.md         # 数据说明文档
│   └── index.html            # HTML模板
├── src/                       # 源代码
│   ├── components/           # React组件
│   │   ├── DataDashboard.tsx # 数据仪表板
│   │   └── DataDashboard.css # 样式文件
│   ├── config/               # 配置文件
│   │   └── database.js       # 数据库配置
│   ├── services/             # 服务层
│   │   └── dataImportService.js # 数据导入服务
│   ├── api/                  # API路由
│   │   └── routes/           # 路由定义
│   ├── database/             # 数据库相关
│   │   └── schema.sql        # 数据库结构
│   ├── App.tsx               # 主应用组件
│   ├── server.js             # API服务器
│   └── index.tsx             # 应用入口
├── scripts/                  # 脚本文件
│   └── setup-database.js     # 数据库初始化
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 🛠️ 常见问题

### Q: 数据库连接失败怎么办？
A: 请检查：
1. PostgreSQL服务是否正在运行
2. 数据库用户名和密码是否正确
3. 数据库名称是否存在
4. 环境变量配置是否正确

### Q: 数据导入失败怎么办？
A: 请确认：
1. CSV数据文件是否存在于 `public/data/` 目录
2. 数据库连接是否正常
3. 数据文件格式是否正确

### Q: 前端无法获取数据怎么办？
A: 请确保：
1. 后端API服务器已启动
2. 环境变量 `REACT_APP_API_URL` 配置正确
3. 数据库中有数据

## 🤝 贡献指南

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系信息

- 项目维护者: [Your Name]
- 电子邮件: [your.email@example.com]
- 项目主页: [Repository URL]

## 🙏 致谢

- 感谢 [SIPRI](https://www.sipri.org/) 提供权威的军事支出数据
- 感谢开源社区提供的优秀工具和库
- 感谢所有贡献者的努力

---

**免责声明**: 本项目仅供学术研究和教育用途。数据版权归SIPRI所有，请遵循其使用条款。
