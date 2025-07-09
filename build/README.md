# SIPRI军事支出数据分析项目

## 项目简介

本项目专注于分析**斯德哥尔摩国际和平研究所 (SIPRI)** 发布的全球军事支出数据 (1949-2024)。通过系统化的数据处理和分析方法，为军事支出研究、国防政策分析和国际关系研究提供数据支持。

## 🎯 项目目标

- **数据标准化**: 将复杂的多工作表Excel文件转换为结构化的CSV格式
- **格式优化**: 提供宽格式和长格式两种数据结构，适应不同分析需求
- **自动化处理**: 建立可重复的数据处理流程
- **研究支持**: 为学术研究和政策分析提供清洁、可用的数据

## 📁 项目结构

```
army/
├── data/                           # 数据目录
│   ├── SIPRI-Milex-data-1949-2024.xlsx   # 原始数据文件
│   ├── README.md                   # 数据集详细说明
│   └── [处理后的CSV文件]            # 运行脚本后生成
├── process_sipri_data.py          # 核心数据处理脚本
├── run_sipri_processing.py        # 执行脚本
├── requirements.txt               # Python依赖包
└── README.md                      # 本文件
```

## 🔧 核心功能

### 1. **多工作表识别和加载**
- 自动识别Excel文件中的所有工作表
- 智能跳过说明文字，准确定位数据起始行
- 支持批量处理多个工作表

### 2. **数据清理和标准化**
- 清理列名和数据格式
- 处理缺失值和异常数据
- 统一数据类型和编码格式

### 3. **格式转换**
- **宽格式转长格式**: 适合时间序列分析
- **CSV输出**: 便于后续分析和可视化
- **UTF-8编码**: 支持国际字符

### 4. **多格式输出**
- **CSV格式**: 便于Excel和数据分析工具使用
- **JSON格式**: 支持Web应用和API集成
- **结构化JSON**: 提供多种数据组织方式（按国家、按年份、原始记录）

### 5. **处理报告**
- 详细的处理日志
- 数据质量检查
- 文件生成统计

## 🚀 快速开始

### 环境要求
- Python 3.7+
- pandas >= 1.5.0
- openpyxl >= 3.0.0

### 安装依赖
```bash
cd army
pip install -r requirements.txt
```

### 运行处理脚本
```bash
python run_sipri_processing.py
```

### 预期输出
处理完成后，将在`data/`目录下生成以下文件：

**CSV格式文件：**
- `Local currency financial years.csv`
- `Local currency calendar years.csv`
- `Constant (2023) US$.csv`
- `Current US$.csv`
- `Share of GDP.csv`
- `Per capita.csv`
- `Share of Govt. spending.csv`
- `Share of GDP_long_format.csv` (长格式示例)

**JSON格式文件：**
- `Local currency financial years.json`
- `Local currency calendar years.json`
- `Constant (2023) US$.json`
- `Current US$.json`
- `Share of GDP.json`
- `Per capita.json`
- `Share of Govt. spending.json`
- `Share of GDP_long_format.json` (长格式示例)

## 📊 数据处理流程

### **阶段一**: 文件检查和工作表识别
```python
# 加载Excel文件，列出所有工作表
excel_file = pd.ExcelFile('data/SIPRI-Milex-data-1949-2024.xlsx')
print(excel_file.sheet_names)
```

### **阶段二**: 单表预览和数据验证
```python
# 读取特定工作表，跳过说明文字
df = pd.read_excel(excel_file, sheet_name='Share of GDP', skiprows=header_row)
```

### **阶段三**: 批量处理和文件生成
```python
# 循环处理所有目标工作表
for sheet_name in target_sheets:
    df = process_sheet(sheet_name)
    df.to_csv(f'{sheet_name}.csv', index=False)
```

### **阶段四**: 格式转换和优化
```python
# 宽格式转长格式
df_long = pd.melt(df, id_vars=['Country'], value_vars=year_columns)
```

## 📄 JSON格式说明

### JSON文件结构
每个JSON文件包含以下结构：

```json
{
  "metadata": {
    "sheet_name": "Share of GDP",
    "total_countries": 173,
    "total_years": 75,
    "year_range": {
      "start": "1949",
      "end": "2024"
    },
    "generated_at": "2024-12-XX"
  },
  "data": {
    "by_country": {
      "China": {
        "1949": 2.1,
        "1950": 2.3,
        "...": "..."
      }
    },
    "by_year": {
      "2023": {
        "China": 1.7,
        "United States": 3.5,
        "...": "..."
      }
    },
    "records": [
      {"Country": "China", "1949": 2.1, "1950": 2.3, ...}
    ]
  }
}
```

### JSON使用示例

**Python中使用JSON数据：**
```python
import json

# 读取JSON数据
with open('data/Share of GDP.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 获取中国的时间序列数据
china_data = data['data']['by_country']['China']

# 获取2023年各国数据
year_2023 = data['data']['by_year']['2023']
```

**JavaScript中使用JSON数据：**
```javascript
// 适合Web应用和可视化
fetch('data/Share of GDP.json')
  .then(response => response.json())
  .then(data => {
    // 获取元数据
    console.log(data.metadata);
    
    // 按国家获取数据
    const chinaData = data.data.by_country['China'];
    
    // 按年份获取数据
    const year2023 = data.data.by_year['2023'];
  });
```

## 📈 应用示例

### 时间序列分析
```python
import pandas as pd
import matplotlib.pyplot as plt

# 读取长格式数据
df = pd.read_csv('data/Share of GDP_long_format.csv')

# 分析特定国家的军事支出趋势
china_data = df[df['Country'] == 'China']
plt.plot(china_data['Year'], china_data['Share of GDP'])
plt.title('中国军事支出占GDP比重变化趋势')
```

### 横截面比较分析
```python
# 读取特定年份的数据进行国际比较
df_2023 = df[df['Year'] == 2023].sort_values('Share of GDP', ascending=False)
print(df_2023.head(10))  # 显示前10个军事支出占比最高的国家
```

## 🔍 数据质量控制

### 验证检查
- **完整性检查**: 验证所有目标工作表是否成功处理
- **格式检查**: 确保数据类型和列名的一致性
- **逻辑检查**: 验证数值范围的合理性

### 错误处理
- **缺失数据**: 记录并报告缺失数据的位置
- **格式异常**: 自动修复常见的格式问题
- **处理失败**: 提供详细的错误信息和建议

## 📋 待办事项

- [ ] 添加数据可视化功能
- [ ] 集成统计分析模块
- [ ] 开发交互式数据探索工具
- [ ] 添加数据更新自动化功能
- [ ] 创建分析报告模板

## 🤝 贡献指南

欢迎对本项目进行改进和扩展：
1. **数据验证**: 帮助验证数据处理的准确性
2. **功能扩展**: 添加新的分析功能或可视化
3. **文档完善**: 改进文档和使用说明
4. **错误报告**: 反馈发现的问题和建议

## 📞 联系信息

如有问题或建议，请通过以下方式联系：
- 📧 项目相关问题
- 🐛 错误报告和功能请求
- 💡 改进建议和合作

## 📄 许可证

本项目仅供学术研究和教育用途。数据版权归SIPRI所有，请遵循其使用条款。

---

**最后更新**: 2024年12月
**版本**: v1.0.0