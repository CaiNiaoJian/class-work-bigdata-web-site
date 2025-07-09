import React, { useState, useEffect } from 'react';
import './DataDashboard.css';

interface Country {
  id: number;
  country_name: string;
  country_code?: string;
  region?: string;
  data_points: number;
}

interface DataType {
  id: number;
  type_name: string;
  description: string;
  unit: string;
  currency?: string;
  data_points: number;
}

interface DataSummary {
  overview: {
    total_countries: number;
    total_data_types: number;
    total_records: number;
    earliest_year: number;
    latest_year: number;
    year_coverage: number;
  };
  regionBreakdown: Array<{
    region: string;
    country_count: number;
    data_points: number;
  }>;
  recentYearsCoverage: Array<{
    year: number;
    countries_with_data: number;
    total_records: number;
  }>;
}

const DataDashboard: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'countries' | 'types'>('overview');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行获取所有数据
      const [countriesRes, dataTypesRes, summaryRes] = await Promise.all([
        fetch(`${apiUrl}/data/countries`),
        fetch(`${apiUrl}/data/types`),
        fetch(`${apiUrl}/data/summary`)
      ]);

      if (!countriesRes.ok || !dataTypesRes.ok || !summaryRes.ok) {
        throw new Error('获取数据失败');
      }

      const [countriesData, dataTypesData, summaryData] = await Promise.all([
        countriesRes.json(),
        dataTypesRes.json(),
        summaryRes.json()
      ]);

      if (countriesData.success) setCountries(countriesData.data);
      if (dataTypesData.success) setDataTypes(dataTypesData.data);
      if (summaryData.success) setSummary(summaryData.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据时发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>正在加载SIPRI军事支出数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">
          <h3>❌ 数据获取失败</h3>
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">
            🔄 重试
          </button>
          <div className="error-help">
            <p>请确保：</p>
            <ul>
              <li>API服务器已启动 (运行 <code>npm run server</code>)</li>
              <li>数据库已配置并运行</li>
              <li>环境变量已正确设置</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🛡️ SIPRI军事支出数据平台</h1>
        <p>斯德哥尔摩国际和平研究所 (1949-2024) 全球军事支出数据分析</p>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 数据概览
        </button>
        <button 
          className={`nav-btn ${activeTab === 'countries' ? 'active' : ''}`}
          onClick={() => setActiveTab('countries')}
        >
          🌍 国家列表
        </button>
        <button 
          className={`nav-btn ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          📈 数据类型
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && summary && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>📊 总体统计</h3>
                <div className="stat-items">
                  <div className="stat-item">
                    <span className="stat-label">国家/地区数量:</span>
                    <span className="stat-value">{formatNumber(summary.overview.total_countries)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">数据记录总数:</span>
                    <span className="stat-value">{formatNumber(summary.overview.total_records)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">数据时间跨度:</span>
                    <span className="stat-value">
                      {summary.overview.earliest_year} - {summary.overview.latest_year}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">年份覆盖:</span>
                    <span className="stat-value">{summary.overview.year_coverage} 年</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3>🌍 地区分布</h3>
                <div className="region-list">
                  {summary.regionBreakdown.slice(0, 6).map((region, index) => (
                    <div key={index} className="region-item">
                      <span className="region-name">{region.region || '未分类'}</span>
                      <span className="region-count">
                        {region.country_count} 国家, {formatNumber(region.data_points)} 数据点
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stat-card">
                <h3>📅 近年数据覆盖</h3>
                <div className="years-list">
                  {summary.recentYearsCoverage.slice(0, 5).map((year, index) => (
                    <div key={index} className="year-item">
                      <span className="year-label">{year.year}年:</span>
                      <span className="year-stats">
                        {year.countries_with_data} 国家, {formatNumber(year.total_records)} 记录
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'countries' && (
          <div className="countries-section">
            <div className="section-header">
              <h2>🌍 国家和地区列表</h2>
              <p>共 {countries.length} 个国家和地区，包含军事支出数据</p>
            </div>
            
            <div className="countries-grid">
              {countries.map((country) => (
                <div key={country.id} className="country-card">
                  <div className="country-header">
                    <h4>{country.country_name}</h4>
                    {country.country_code && (
                      <span className="country-code">{country.country_code}</span>
                    )}
                  </div>
                  <div className="country-info">
                    {country.region && (
                      <p className="country-region">🌍 {country.region}</p>
                    )}
                    <p className="country-data">
                      📊 {formatNumber(country.data_points)} 个数据点
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="types-section">
            <div className="section-header">
              <h2>📈 数据类型说明</h2>
              <p>SIPRI提供的 {dataTypes.length} 种不同计算方式的军事支出数据</p>
            </div>

            <div className="types-list">
              {dataTypes.map((type) => (
                <div key={type.id} className="type-card">
                  <div className="type-header">
                    <h4>{type.type_name}</h4>
                    <span className="type-data-count">
                      {formatNumber(type.data_points)} 数据点
                    </span>
                  </div>
                  <div className="type-details">
                    <p className="type-description">{type.description}</p>
                    <div className="type-meta">
                      <span className="type-unit">📏 单位: {type.unit}</span>
                      {type.currency && (
                        <span className="type-currency">💱 货币: {type.currency}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="dashboard-footer">
        <p>数据来源: 斯德哥尔摩国际和平研究所 (SIPRI)</p>
        <p>最后更新: {new Date().toLocaleDateString('zh-CN')}</p>
      </footer>
    </div>
  );
};

export default DataDashboard; 