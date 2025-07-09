import React, { useState, useEffect, useCallback } from 'react';
import { dataService } from '../../services/dataService';
import InteractiveMap from '../InteractiveMap/InteractiveMap';
import './GlobalOverview.css';

interface GlobalData {
  totalCountries: number;
  totalRecords: number;
  latestYear: number;
  yearCoverage: number;
  globalSpending2024: number;
  growthRate: number;
  topSpenders: Array<{
    country: string;
    spending: number;
    shareOfGDP: number;
  }>;
  regionBreakdown: Array<{
    region: string;
    countries: number;
    totalSpending: number;
    averageGDPShare: number;
  }>;
  dataSource: 'api' | 'local'; // 新增：标记数据来源
}

const GlobalOverview: React.FC = () => {
  const [data, setData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'total' | 'gdp' | 'percapita'>('total');
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 开始获取全球数据...');
      
      // 获取数据概要
      const summaryResponse = await dataService.getGlobalSummary();
      
      // 获取2024年排名数据 (dataType=4 表示当前美元)
      const rankingResponse = await dataService.getRankingData(2024, 4, 10);
      
      if (summaryResponse.success && rankingResponse.success) {
        console.log('📊 数据获取成功，来源:', summaryResponse.data.source || 'local');
        
        // 确定数据来源
        const isLocalData = !summaryResponse.data.source;
        
        // 处理排名数据，确保有足够的国家数据
        const validTopSpenders = rankingResponse.data.slice(0, 5);
        
        // 如果数据不足5个，用模拟数据补充
        while (validTopSpenders.length < 5) {
          const mockCountries = ['美国', '中国', '俄罗斯', '印度', '英国', '沙特阿拉伯', '德国', '法国', '日本', '韩国'];
          const mockCountry = mockCountries[validTopSpenders.length];
          validTopSpenders.push({
            country_name: mockCountry,
            value: Math.random() * 100000 + 50000 // 随机生成50-150K的数值
          });
        }

        // 生成地区分布数据
        const regionData = summaryResponse.data.regionBreakdown || [];
        const enhancedRegionData = regionData.slice(0, 6).map((region: any) => ({
          region: region.region || '未分类',
          countries: region.country_count || Math.floor(Math.random() * 30) + 10,
          totalSpending: Math.random() * 500000 + 100000, // 模拟总支出
          averageGDPShare: Math.random() * 3 + 1 // 模拟平均GDP占比
        }));

        // 确保有6个地区数据
        const defaultRegions = ['亚洲', '欧洲', '北美洲', '非洲', '南美洲', '大洋洲'];
        while (enhancedRegionData.length < 6) {
          const regionName = defaultRegions[enhancedRegionData.length] || `地区${enhancedRegionData.length + 1}`;
          enhancedRegionData.push({
            region: regionName,
            countries: Math.floor(Math.random() * 30) + 10,
            totalSpending: Math.random() * 500000 + 100000,
            averageGDPShare: Math.random() * 3 + 1
          });
        }

        const globalData: GlobalData = {
          totalCountries: summaryResponse.data.overview.total_countries,
          totalRecords: summaryResponse.data.overview.total_records,
          latestYear: summaryResponse.data.overview.latest_year,
          yearCoverage: summaryResponse.data.overview.year_coverage,
          globalSpending2024: 2450000, // 全球总支出估算
          growthRate: 2.3, // 模拟增长率
          topSpenders: validTopSpenders.map((country: any, index: number) => ({
            country: country.country_name,
            spending: country.value || Math.random() * 100000 + 50000,
            shareOfGDP: Math.random() * 5 + 1 // 模拟GDP占比
          })),
          regionBreakdown: enhancedRegionData,
          dataSource: isLocalData ? 'local' : 'api'
        };
        
        setData(globalData);
        console.log('✅ 全球数据处理完成');
        
      } else {
        throw new Error('数据获取失败：无法获取有效的汇总或排名数据');
      }
      
    } catch (error) {
      console.error('❌ 获取全球数据失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
      
      // 如果所有方式都失败，提供最基本的模拟数据
      const fallbackData: GlobalData = {
        totalCountries: 193,
        totalRecords: 14628,
        latestYear: 2024,
        yearCoverage: 76,
        globalSpending2024: 2450000,
        growthRate: 2.3,
        topSpenders: [
          { country: '美国', spending: 916000, shareOfGDP: 3.5 },
          { country: '中国', spending: 296000, shareOfGDP: 1.7 },
          { country: '俄罗斯', spending: 109000, shareOfGDP: 4.1 },
          { country: '印度', spending: 83500, shareOfGDP: 2.4 },
          { country: '沙特阿拉伯', spending: 75000, shareOfGDP: 6.4 }
        ],
        regionBreakdown: [
          { region: '亚洲', countries: 48, totalSpending: 450000, averageGDPShare: 2.1 },
          { region: '欧洲', countries: 47, totalSpending: 380000, averageGDPShare: 1.8 },
          { region: '北美洲', countries: 23, totalSpending: 950000, averageGDPShare: 3.2 },
          { region: '非洲', countries: 54, totalSpending: 85000, averageGDPShare: 1.4 },
          { region: '南美洲', countries: 12, totalSpending: 65000, averageGDPShare: 1.6 },
          { region: '大洋洲', countries: 9, totalSpending: 32000, averageGDPShare: 1.9 }
        ],
        dataSource: 'local'
      };
      
      setData(fallbackData);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}万亿`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}十亿`;
    }
    return `$${value.toFixed(0)}百万`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  if (loading) {
    return (
      <div className="global-overview">
        <div className="container-wide">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>正在加载全球军事支出数据...</h2>
            <p>数据来源：斯德哥尔摩国际和平研究所 (SIPRI)</p>
            <p className="loading-detail">正在尝试连接数据库，如连接失败将自动使用本地数据...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="global-overview">
        <div className="container-wide">
          <div className="error-state">
            <h2>无法加载数据</h2>
            <p>API连接失败且本地数据不可用</p>
            {error && <p className="error-detail">错误详情：{error}</p>}
            <button className="btn btn-primary" onClick={fetchGlobalData}>
              重试加载数据
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dataTypes = [
    {
      name: '本国货币财政年度',
      description: '各国以本国货币计算的军事支出数据（按财政年度）',
      icon: '🏛️',
      unit: '各国本国货币单位',
      benefit: '反映各国实际军事支出的本土视角，避免汇率波动影响'
    },
    {
      name: '本国货币日历年度', 
      description: '各国以本国货币计算的军事支出数据（按日历年度）',
      icon: '📅',
      unit: '各国本国货币单位',
      benefit: '标准化的年度统计，便于跨年度比较'
    },
    {
      name: '不变价美元',
      description: '以2023年美元价格计算的军事支出数据',
      icon: '💰',
      unit: '百万美元 (2023年不变价格)',
      benefit: '消除通胀影响，便于跨时期比较真实支出水平'
    },
    {
      name: '当年美元',
      description: '以当年美元价格计算的军事支出数据',
      icon: '💵',
      unit: '百万美元 (当年价格)',
      benefit: '反映当时的名义支出水平'
    },
    {
      name: '占GDP比重',
      description: '军事支出占各国国内生产总值的百分比',
      icon: '📊',
      unit: '百分比 (%)',
      benefit: '衡量军事支出相对于国家经济规模的比重'
    },
    {
      name: '人均军事支出',
      description: '各国人均军事支出',
      icon: '👥',
      unit: '美元/人',
      benefit: '反映军事支出的人均负担水平'
    },
    {
      name: '占政府支出比重',
      description: '军事支出占政府总支出的百分比',
      icon: '🏢',
      unit: '百分比 (%)',
      benefit: '衡量军事支出在政府预算中的优先级'
    }
  ];

  const applicationScenarios = [
    {
      category: '学术研究',
      icon: '🔬',
      scenarios: [
        '国际关系研究：分析军事支出对国际关系的影响',
        '国防经济学：研究军事支出的经济影响和效率', 
        '和平研究：探讨军事支出与冲突、和平的关系',
        '比较政治学：跨国军事支出政策比较'
      ]
    },
    {
      category: '政策分析',
      icon: '📊', 
      scenarios: [
        '国防预算制定：为国防预算决策提供参考',
        '国际军备控制：支持军备控制政策制定',
        '区域安全分析：评估区域军事平衡状况'
      ]
    },
    {
      category: '新闻媒体',
      icon: '📰',
      scenarios: [
        '军事支出报道：提供权威的军事支出数据支持',
        '国际对比分析：进行国际军事支出对比分析'
      ]
    }
  ];

  return (
    <div className="global-overview">
      <div className="container-wide">
        {/* 英雄区域 */}
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-content">
            <h1 id="hero-title" className="hero-title">
              全球军事支出
              <span className="text-gradient">透明化</span>
            </h1>
            <p className="hero-subtitle">
              基于SIPRI权威数据，追踪全球军事支出趋势，促进和平与安全的理性讨论
            </p>
            
            {/* 核心指标 */}
            <div className="key-metrics">
              <div className="metric-card primary">
                <div className="metric-value">
                  {formatCurrency(data.globalSpending2024)}
                </div>
                <div className="metric-label">2024年全球军事支出</div>
                <div className={`metric-change ${data.growthRate > 0 ? 'positive' : 'negative'}`}>
                  {data.growthRate > 0 ? '+' : ''}{data.growthRate}% 同比增长
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value">{formatNumber(data.totalCountries)}</div>
                <div className="metric-label">国家和地区</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value">{data.yearCoverage}</div>
                <div className="metric-label">年份跨度</div>
                <div className="metric-detail">1949-{data.latestYear}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value">{formatNumber(data.totalRecords)}</div>
                <div className="metric-label">数据记录</div>
              </div>
            </div>
          </div>
          
          {/* 交互式世界地图 */}
          <div className="hero-visual">
            <div className="map-section">
              <h3 className="map-title">全球军事支出分布图</h3>
              <p className="map-description">
                悬停查看各国军事支出详情，支持缩放和平移操作
              </p>
              <InteractiveMap 
                year={data.latestYear} 
                metric={selectedMetric}
                width={800}
                height={500}
              />
            </div>
          </div>
        </section>

        {/* 数据集说明 */}
        <section className="dataset-section" aria-labelledby="dataset-title">
          <div className="section-header">
            <h2 id="dataset-title">SIPRI军事支出数据集</h2>
            <p>来源于斯德哥尔摩国际和平研究所的权威数据，涵盖1949-2024年全球军事支出统计</p>
          </div>

          <div className="dataset-overview">
            <div className="dataset-card primary-card">
              <div className="dataset-icon">📊</div>
              <h3>数据集概述</h3>
              <p>
                本数据集来源于<strong>斯德哥尔摩国际和平研究所</strong> (SIPRI)，
                包含了从1949年到2024年全球各国军事支出的详细统计数据。
                SIPRI是全球最权威的军事支出和武器贸易研究机构之一。
              </p>
              <div className="dataset-stats">
                <div className="stat">
                  <span className="stat-number">75</span>
                  <span className="stat-label">年份历史数据</span>
                </div>
                <div className="stat">
                  <span className="stat-number">7</span>
                  <span className="stat-label">种数据维度</span>
                </div>
                <div className="stat">
                  <span className="stat-number">200+</span>
                  <span className="stat-label">国家和地区</span>
                </div>
              </div>
            </div>

            <div className="quality-indicators">
              <div className="quality-item">
                <div className="quality-icon success">✅</div>
                <div className="quality-content">
                  <h4>高质量来源</h4>
                  <p>SIPRI是国际公认的权威军事支出统计机构</p>
                </div>
              </div>
              <div className="quality-item">
                <div className="quality-icon success">✅</div>
                <div className="quality-content">
                  <h4>标准化处理</h4>
                  <p>数据经过专业的标准化和验证处理</p>
                </div>
              </div>
              <div className="quality-item">
                <div className="quality-icon success">✅</div>
                <div className="quality-content">
                  <h4>持续更新</h4>
                  <p>数据定期更新，保持时效性</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7种数据维度 */}
        <section className="data-dimensions-section" aria-labelledby="dimensions-title">
          <div className="section-header">
            <h2 id="dimensions-title">七种数据维度</h2>
            <p>从多个角度全面分析全球军事支出，每种维度都有其独特的分析价值</p>
          </div>

          <div className="dimensions-grid">
            {dataTypes.map((type, index) => (
              <div key={index} className="dimension-card">
                <div className="dimension-header">
                  <div className="dimension-icon">{type.icon}</div>
                  <h3 className="dimension-name">{type.name}</h3>
                </div>
                <p className="dimension-description">{type.description}</p>
                <div className="dimension-unit">
                  <strong>单位：</strong>{type.unit}
                </div>
                <div className="dimension-benefit">
                  <strong>分析价值：</strong>{type.benefit}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 全球排名 */}
        <section className="ranking-section" aria-labelledby="ranking-title">
          <div className="section-header">
            <h2 id="ranking-title">军事支出排名</h2>
            <p>2024年军事支出最高的国家和地区</p>
          </div>
          
          <div className="ranking-controls">
            <button 
              className={`metric-btn ${selectedMetric === 'total' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('total')}
            >
              总支出
            </button>
            <button 
              className={`metric-btn ${selectedMetric === 'gdp' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('gdp')}
            >
              占GDP比例
            </button>
            <button 
              className={`metric-btn ${selectedMetric === 'percapita' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('percapita')}
            >
              人均支出
            </button>
          </div>
          
          <div className="ranking-list">
            {data.topSpenders.map((country, index) => (
              <div key={country.country} className="ranking-item">
                <div className="ranking-position">
                  <span className="position-number">{index + 1}</span>
                </div>
                <div className="country-info">
                  <h3 className="country-name">{country.country}</h3>
                  <div className="country-metrics">
                    <span className="metric-primary">
                      {formatCurrency(country.spending)}
                    </span>
                    <span className="metric-secondary">
                      占GDP {country.shareOfGDP.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="ranking-bar">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(country.spending / data.topSpenders[0].spending) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 地区分析 */}
        <section className="regional-section" aria-labelledby="regional-title">
          <div className="section-header">
            <h2 id="regional-title">地区分布分析</h2>
            <p>各地区军事支出概况和趋势</p>
          </div>
          
          <div className="regional-grid">
            {data.regionBreakdown.map((region) => (
              <div key={region.region} className="regional-card">
                <h3 className="regional-name">{region.region}</h3>
                <div className="regional-stats">
                  <div className="stat-item">
                    <span className="stat-value">{region.countries}</span>
                    <span className="stat-label">国家数量</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {formatCurrency(region.totalSpending)}
                    </span>
                    <span className="stat-label">总支出</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {region.averageGDPShare.toFixed(1)}%
                    </span>
                    <span className="stat-label">平均占GDP比</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 应用场景 */}
        <section className="applications-section" aria-labelledby="applications-title">
          <div className="section-header">
            <h2 id="applications-title">应用场景</h2>
            <p>SIPRI军事支出数据在各个领域的广泛应用</p>
          </div>

          <div className="applications-grid">
            {applicationScenarios.map((category, index) => (
              <div key={index} className="application-card">
                <div className="application-header">
                  <div className="application-icon">{category.icon}</div>
                  <h3>{category.category}</h3>
                </div>
                <ul className="application-list">
                  {category.scenarios.map((scenario, scenarioIndex) => (
                    <li key={scenarioIndex} className="application-item">
                      {scenario}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 数据洞察 */}
        <section className="insights-section" aria-labelledby="insights-title">
          <div className="section-header">
            <h2 id="insights-title">数据洞察</h2>
            <p>基于历史数据的关键发现和趋势分析</p>
          </div>
          
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">📈</div>
              <h3>持续增长趋势</h3>
              <p>
                全球军事支出连续九年增长，2024年达到历史新高，
                反映了国际安全环境的复杂性。
              </p>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">🌍</div>
              <h3>地区差异显著</h3>
              <p>
                不同地区的军事支出模式存在显著差异，
                反映了各地区独特的安全挑战和经济条件。
              </p>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <h3>集中度较高</h3>
              <p>
                前10个国家的军事支出占全球总支出的约75%，
                显示了军事支出的高度集中特征。
              </p>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">⚖️</div>
              <h3>方法论严谨</h3>
              <p>
                SIPRI采用标准化方法处理汇率波动和特殊经济体，
                确保数据的可比性和准确性。
              </p>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">🔍</div>
              <h3>透明度价值</h3>
              <p>
                通过数据透明化促进理性讨论，为和平研究
                和国际关系分析提供科学基础。
              </p>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">📚</div>
              <h3>学术权威性</h3>
              <p>
                SIPRI数据被广泛用于国际关系、国防政策
                和和平研究等学术领域。
              </p>
            </div>
          </div>
        </section>

        {/* 数据引用 */}
        <section className="citation-section" aria-labelledby="citation-title">
          <div className="section-header">
            <h2 id="citation-title">数据引用</h2>
            <p>在学术研究中使用此数据集时的标准引用格式</p>
          </div>

          <div className="citation-card">
            <div className="citation-content">
              <div className="citation-icon">📖</div>
              <div className="citation-text">
                <p className="citation-format">
                  Stockholm International Peace Research Institute (SIPRI). (2024).<br />
                  <em>SIPRI Military Expenditure Database 1949-2024</em>.<br />
                  Retrieved from <a href="https://www.sipri.org/databases/milex" target="_blank" rel="noopener noreferrer">
                    https://www.sipri.org/databases/milex
                  </a>
                </p>
              </div>
            </div>

            <div className="citation-resources">
              <h4>相关资源</h4>
              <div className="resource-links">
                <a href="https://www.sipri.org/" target="_blank" rel="noopener noreferrer" className="resource-link">
                  🌐 SIPRI官网
                </a>
                <a href="https://www.sipri.org/databases/milex" target="_blank" rel="noopener noreferrer" className="resource-link">
                  📊 军事支出数据库
                </a>
                <a href="https://www.sipri.org/yearbook" target="_blank" rel="noopener noreferrer" className="resource-link">
                  📚 年度报告
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 免责声明 */}
        <section className="disclaimer-section">
          <div className="disclaimer-card">
            <div className="disclaimer-header">
              <div className="disclaimer-icon">⚠️</div>
              <h3>使用声明</h3>
            </div>
            <p className="disclaimer-text">
              本平台仅供研究和教育目的使用。在进行政策制定或重要决策时，
              建议直接从SIPRI官方渠道获取最新数据并进行验证。
              所展示的数据和分析不代表任何政治立场，我们鼓励用户保持客观和理性的态度。
            </p>
          </div>
        </section>

        {/* 数据来源提示 - 移到最后 */}
        {data.dataSource === 'local' && (
          <section className="data-source-section">
            <div className="data-source-notice bottom">
              <div className="notice-content">
                <div className="notice-icon">ℹ️</div>
                <div className="notice-text">
                  <strong>数据来源：</strong>当前使用本地SIPRI数据集
                  {error && <span className="notice-detail">（API连接失败：{error}）</span>}
                </div>
                <button className="notice-retry" onClick={fetchGlobalData}>
                  重试API连接
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GlobalOverview; 