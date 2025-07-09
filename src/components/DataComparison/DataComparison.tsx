import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
// import { dataService } from '../../services/dataService';
import './DataComparison.css';

interface CountryData {
  country: string;
  latestValue: number;
  latestYear: number;
  timeSeriesData: Array<{
    year: number;
    value: number;
  }>;
  gdpShare?: number;
  perCapita?: number;
  ranking?: number;
}

interface ChartDataPoint {
  year: number;
  [countryName: string]: number;
}

const POPULAR_COUNTRIES = [
  '美国', '中国', '俄罗斯', '印度', '沙特阿拉伯', 
  '英国', '德国', '法国', '日本', '韩国',
  '意大利', '澳大利亚', '加拿大', '以色列', '土耳其'
];

const DATA_TYPES = [
  { id: 4, name: '当前美元', description: '以当前美元计算的军事支出', unit: 'millions USD', color: '#8b5cf6' },
  { id: 3, name: '恒定美元 (2023)', description: '以2023年恒定美元计算', unit: 'millions 2023 USD', color: '#06b6d4' },
  { id: 5, name: 'GDP占比', description: '军事支出占GDP百分比', unit: '% of GDP', color: '#10b981' },
  { id: 6, name: '人均支出', description: '人均军事支出', unit: 'USD per capita', color: '#f59e0b' },
  { id: 7, name: '政府支出占比', description: '军事支出占政府总支出百分比', unit: '% of gov spending', color: '#ef4444' }
];

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const DataComparison: React.FC = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['美国', '中国']);
  const [selectedDataType, setSelectedDataType] = useState<number>(4);
  const [countryData, setCountryData] = useState<Record<string, CountryData>>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const dropdownButtonRef = React.useRef<HTMLButtonElement>(null);

  // 模拟数据生成函数
  const generateMockTimeSeriesData = useCallback((countryName: string, dataType: number): Array<{year: number, value: number}> => {
    const data = [];
    const baseValues: Record<string, number> = {
      '美国': dataType === 4 ? 800000 : dataType === 5 ? 3.5 : dataType === 6 ? 2500 : 300000,
      '中国': dataType === 4 ? 250000 : dataType === 5 ? 1.7 : dataType === 6 ? 180 : 150000,
      '俄罗斯': dataType === 4 ? 65000 : dataType === 5 ? 4.3 : dataType === 6 ? 450 : 40000,
      '印度': dataType === 4 ? 76000 : dataType === 5 ? 2.4 : dataType === 6 ? 55 : 45000,
      '沙特阿拉伯': dataType === 4 ? 57000 : dataType === 5 ? 8.4 : dataType === 6 ? 1700 : 35000,
    };

    const baseValue = baseValues[countryName] || Math.random() * 50000 + 10000;
    
    for (let year = 1995; year <= 2024; year++) {
      const yearFactor = (year - 1995) / 29;
      const randomFactor = 0.9 + Math.random() * 0.2;
      const trendFactor = dataType === 4 ? (1 + yearFactor * 0.8) : (1 + yearFactor * 0.3);
      
      const value = baseValue * trendFactor * randomFactor;
      data.push({ year, value: Math.round(value * 100) / 100 });
    }
    
    return data;
  }, []);

  // 获取国家数据
  const fetchCountryData = useCallback(async (countries: string[], dataType: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const newCountryData: Record<string, CountryData> = {};
      
      for (const country of countries) {
        const timeSeriesData = generateMockTimeSeriesData(country, dataType);
        const latestData = timeSeriesData[timeSeriesData.length - 1];
        
        newCountryData[country] = {
          country,
          latestValue: latestData.value,
          latestYear: latestData.year,
          timeSeriesData,
          gdpShare: dataType === 5 ? latestData.value : Math.random() * 4 + 1,
          perCapita: dataType === 6 ? latestData.value : Math.random() * 1000 + 200,
          ranking: Math.floor(Math.random() * 20) + 1
        };
      }
      
      setCountryData(newCountryData);
      
      const chartDataMap: Record<number, ChartDataPoint> = {};
      
      Object.values(newCountryData).forEach(countryInfo => {
        countryInfo.timeSeriesData.forEach(dataPoint => {
          if (!chartDataMap[dataPoint.year]) {
            chartDataMap[dataPoint.year] = { year: dataPoint.year };
          }
          chartDataMap[dataPoint.year][countryInfo.country] = dataPoint.value;
        });
      });
      
      const sortedChartData = Object.values(chartDataMap).sort((a, b) => a.year - b.year);
      setChartData(sortedChartData);
      
    } catch (error) {
      setError('数据加载失败，请重试');
      console.error('数据获取错误:', error);
    } finally {
      setLoading(false);
    }
  }, [generateMockTimeSeriesData]);

  const handleCountrySelect = (country: string) => {
    if (selectedCountries.includes(country)) {
      if (selectedCountries.length > 2) {
        setSelectedCountries(prev => prev.filter(c => c !== country));
      }
    } else {
      if (selectedCountries.length < 5) {
        setSelectedCountries(prev => [...prev, country]);
      }
    }
    setShowDropdown(false);
  };

  const handleToggleDropdown = () => {
    if (!showDropdown && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 250)
      });
    }
    setShowDropdown(!showDropdown);
  };

  const formatValue = (value: number, dataTypeId: number): string => {
    if (dataTypeId === 5 || dataTypeId === 7) {
      return `${value.toFixed(1)}%`;
    } else if (dataTypeId === 6) {
      return `$${value.toLocaleString('en-US')}`;
    } else {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}万亿`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}十亿`;
      }
      return `$${value.toFixed(0)}百万`;
    }
  };

  const filteredCountries = POPULAR_COUNTRIES.filter(country =>
    country.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedCountries.includes(country)
  );

  useEffect(() => {
    fetchCountryData(selectedCountries, selectedDataType);
  }, [selectedCountries, selectedDataType, fetchCountryData]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownButtonRef.current && !dropdownButtonRef.current.contains(event.target as Node)) {
        const dropdownElement = document.querySelector('.dropdown-content');
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      }
    };

    const handleScroll = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showDropdown]);

  const currentDataType = DATA_TYPES.find(dt => dt.id === selectedDataType);

  return (
    <div className="data-comparison">
      <div className="container-wide">
        <div className="page-header">
          <h1 className="page-title">数据比较分析</h1>
          <p className="page-subtitle">
            对比多个国家的军事支出数据，深入分析不同国家的国防投入趋势和特点
          </p>
        </div>

        <div className="control-panel">
          <div className="control-section">
            <h3>选择国家 ({selectedCountries.length}/5)</h3>
            <div className="country-selector">
              <div className="selected-countries">
                {selectedCountries.map((country) => (
                  <div key={country} className="selected-country-tag">
                    <span>{country}</span>
                    {selectedCountries.length > 2 && (
                      <button
                        className="remove-country"
                        onClick={() => handleCountrySelect(country)}
                        title="移除国家"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {selectedCountries.length < 5 && (
                  <div className="add-country-dropdown">
                    <button
                      ref={dropdownButtonRef}
                      className="add-country-btn"
                      onClick={handleToggleDropdown}
                    >
                      + 添加国家
                    </button>
                    {showDropdown && (
                      <div 
                        className="dropdown-content"
                        style={{
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width
                        }}
                      >
                        <input
                          type="text"
                          placeholder="搜索国家..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="country-search"
                        />
                        <div className="country-list">
                          {filteredCountries.slice(0, 10).map((country) => (
                            <button
                              key={country}
                              className="country-option"
                              onClick={() => handleCountrySelect(country)}
                            >
                              {country}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="control-section">
            <h3>数据类型</h3>
            <div className="data-type-selector">
              {DATA_TYPES.map((dataType) => (
                <button
                  key={dataType.id}
                  className={`data-type-btn ${selectedDataType === dataType.id ? 'active' : ''}`}
                  onClick={() => setSelectedDataType(dataType.id)}
                  style={{ '--accent-color': dataType.color } as React.CSSProperties}
                >
                  <span className="data-type-name">{dataType.name}</span>
                  <span className="data-type-desc">{dataType.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>正在加载数据...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => fetchCountryData(selectedCountries, selectedDataType)}
            >
              重新加载
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="country-cards-section">
              <h2 className="section-title">国家数据概览</h2>
              <div className="country-cards-grid">
                {selectedCountries.map((country, index) => {
                  const data = countryData[country];
                  if (!data) return null;

                  return (
                    <div
                      key={country}
                      className="country-card"
                      style={{ '--card-color': CHART_COLORS[index % CHART_COLORS.length] } as React.CSSProperties}
                    >
                      <div className="card-header">
                        <h3 className="country-name">{country}</h3>
                        <div className="country-ranking">#{data.ranking}</div>
                      </div>
                      <div className="card-body">
                        <div className="main-metric">
                          <span className="metric-label">{currentDataType?.name}</span>
                          <span className="metric-value">
                            {formatValue(data.latestValue, selectedDataType)}
                          </span>
                          <span className="metric-year">({data.latestYear})</span>
                        </div>
                        <div className="secondary-metrics">
                          <div className="metric-item">
                            <span className="metric-label">GDP占比</span>
                            <span className="metric-value">{data.gdpShare?.toFixed(1)}%</span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">人均支出</span>
                            <span className="metric-value">${data.perCapita?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="chart-section">
              <h2 className="section-title">
                历史趋势对比 ({currentDataType?.name})
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="year"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                      tickFormatter={(value) => formatValue(value, selectedDataType)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(71, 85, 105, 0.3)',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                      formatter={(value: number) => [formatValue(value, selectedDataType), '']}
                      labelFormatter={(year) => `${year}年`}
                    />
                    <Legend
                      wrapperStyle={{ color: '#e2e8f0' }}
                    />
                    {selectedCountries.map((country, index) => (
                      <Line
                        key={country}
                        type="monotone"
                        dataKey={country}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-section">
              <h2 className="section-title">
                {2024}年数据对比
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={selectedCountries.map((country, index) => ({
                      country,
                      value: countryData[country]?.latestValue || 0,
                      fill: CHART_COLORS[index % CHART_COLORS.length]
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="country"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                      tickFormatter={(value) => formatValue(value, selectedDataType)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(71, 85, 105, 0.3)',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                      formatter={(value: number) => [formatValue(value, selectedDataType), currentDataType?.name]}
                    />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataComparison; 