-- SIPRI军事支出数据库结构设计

-- 国家/地区表
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL UNIQUE,
    country_code VARCHAR(10),
    region VARCHAR(50),
    sub_region VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 数据类型表 (用于标识不同的支出计算方式)
CREATE TABLE IF NOT EXISTS data_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(50),
    currency VARCHAR(10),
    base_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 军事支出数据表
CREATE TABLE IF NOT EXISTS military_expenditure (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id),
    data_type_id INTEGER REFERENCES data_types(id),
    year INTEGER NOT NULL,
    value DECIMAL(15,4),
    is_estimated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 确保同一国家、同一年份、同一数据类型只有一条记录
    UNIQUE(country_id, data_type_id, year)
);

-- 数据更新日志表
CREATE TABLE IF NOT EXISTS data_update_logs (
    id SERIAL PRIMARY KEY,
    update_type VARCHAR(50) NOT NULL, -- 'full_sync', 'partial_sync', 'manual'
    records_processed INTEGER,
    records_inserted INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    error_message TEXT,
    file_source VARCHAR(255)
);

-- 初始化数据类型
INSERT INTO data_types (type_name, description, unit, currency, base_year) VALUES
('Local currency financial years', '本国货币财政年度', 'Local Currency', 'Various', NULL),
('Local currency calendar years', '本国货币日历年度', 'Local Currency', 'Various', NULL),
('Constant (2023) US$', '2023年不变美元', 'Million USD', 'USD', 2023),
('Current US$', '当年美元', 'Million USD', 'USD', NULL),
('Share of GDP', 'GDP占比', 'Percentage', '%', NULL),
('Per capita', '人均军事支出', 'USD per person', 'USD', NULL),
('Share of Govt. spending', '政府支出占比', 'Percentage', '%', NULL)
ON CONFLICT (type_name) DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_military_expenditure_country_year ON military_expenditure(country_id, year);
CREATE INDEX IF NOT EXISTS idx_military_expenditure_data_type ON military_expenditure(data_type_id);
CREATE INDEX IF NOT EXISTS idx_military_expenditure_year ON military_expenditure(year);
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(country_name);

-- 创建视图以简化常用查询
CREATE OR REPLACE VIEW v_military_expenditure_full AS
SELECT 
    me.id,
    c.country_name,
    c.country_code,
    c.region,
    dt.type_name AS data_type,
    dt.unit,
    dt.currency,
    me.year,
    me.value,
    me.is_estimated,
    me.notes,
    me.updated_at
FROM military_expenditure me
JOIN countries c ON me.country_id = c.id
JOIN data_types dt ON me.data_type_id = dt.id;

-- 创建函数用于更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_countries_updated_at 
    BEFORE UPDATE ON countries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_military_expenditure_updated_at 
    BEFORE UPDATE ON military_expenditure 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE countries IS '国家和地区信息表';
COMMENT ON TABLE data_types IS '军事支出数据类型定义表';
COMMENT ON TABLE military_expenditure IS '军事支出核心数据表';
COMMENT ON TABLE data_update_logs IS '数据更新操作日志表';
COMMENT ON VIEW v_military_expenditure_full IS '军事支出数据完整视图，包含国家和数据类型信息'; 