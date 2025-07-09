import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CountrySearch from './CountrySearch';
import CountryProfile from './CountryProfile';
import HistoricalChart from './HistoricalChart';
import RegionalRanking from './RegionalRanking';
import AIInsight from './AIInsight';
import { 
  countryDataService, 
  CountryProfile as CountryProfileType,
  CountryHistoricalData,
  RegionalRanking as RegionalRankingType 
} from '../../services/countryDataService';
import './CountryInsight.css';

const CountryInsight: React.FC = () => {
  const { countryName } = useParams<{ countryName: string }>();
  const navigate = useNavigate();
  
  // 状态管理
  const [selectedCountry, setSelectedCountry] = useState<string>(countryName || '');
  const [countryProfile, setCountryProfile] = useState<CountryProfileType | null>(null);
  const [historicalData, setHistoricalData] = useState<CountryHistoricalData[]>([]);
  const [regionalRanking, setRegionalRanking] = useState<RegionalRankingType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载国家数据
  const loadCountryData = async (country: string) => {
    if (!country.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // 并行加载所有数据
      const [profile, historical, ranking] = await Promise.all([
        countryDataService.getCountryProfile(country),
        countryDataService.getCountryHistoricalData(country),
        countryDataService.getRegionalRanking(country)
      ]);

      if (!profile) {
        throw new Error(`未找到国家"${country}"的数据，请检查国家名称是否正确`);
      }

      setCountryProfile(profile);
      setHistoricalData(historical);
      setRegionalRanking(ranking);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载国家数据失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理国家选择
  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    const encodedCountry = encodeURIComponent(country);
    navigate(`/country/${encodedCountry}`, { replace: true });
  };

  // 处理URL参数变化
  useEffect(() => {
    if (countryName && countryName !== selectedCountry) {
      const decodedCountry = decodeURIComponent(countryName);
      setSelectedCountry(decodedCountry);
    }
  }, [countryName, selectedCountry]);

  // 加载选中国家的数据
  useEffect(() => {
    if (selectedCountry) {
      loadCountryData(selectedCountry);
    }
  }, [selectedCountry]);

  // 快速选择热门国家
  const popularCountries = [
            'United States of America', 'China', 'Russia', 'India', 'United Kingdom',
    'Saudi Arabia', 'Germany', 'France', 'Japan', 'South Korea'
  ];

  return (
    <div className="country-insight">
      {/* 页面头部 */}
      <div className="insight-header">
        <div className="header-content">
          <h1 className="page-title">国家洞察</h1>
          <p className="page-description">
            深度分析单个国家的军事支出数据，探索历史趋势、地区地位和数据故事
          </p>
        </div>
      </div>

      {/* 国家搜索区域 */}
      <div className="search-section">
        <div className="search-container">
          <CountrySearch 
            onCountrySelect={handleCountrySelect}
            placeholder="输入国家名称进行搜索..."
            className="main-search"
          />
          
          {/* 热门国家快速选择 */}
          <div className="popular-countries">
            <div className="popular-title">热门国家</div>
            <div className="popular-buttons">
              {popularCountries.map((country) => (
                <button
                  key={country}
                  className={`popular-btn ${selectedCountry === country ? 'active' : ''}`}
                  onClick={() => handleCountrySelect(country)}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="insight-content">
        {/* 加载状态 */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              正在加载 {selectedCountry} 的数据...
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <div className="error-title">数据加载失败</div>
            <div className="error-message">{error}</div>
            <button 
              className="retry-btn"
              onClick={() => selectedCountry && loadCountryData(selectedCountry)}
            >
              重试加载
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!selectedCountry && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">选择一个国家开始分析</div>
            <div className="empty-description">
              在上方搜索框中输入国家名称，或点击热门国家按钮
            </div>
          </div>
        )}

        {/* 数据展示 */}
        {countryProfile && !loading && !error && (
          <div className="data-sections">
            <CountryProfile profile={countryProfile} />
            
            {historicalData.length > 0 && (
              <HistoricalChart 
                data={historicalData} 
                countryName={countryProfile.name}
              />
            )}
            
            {regionalRanking && (
              <RegionalRanking 
                ranking={regionalRanking}
                currentCountry={countryProfile.name}
              />
            )}
            
            {/* 千帆知道 AI 深度分析 */}
            <AIInsight countryName={countryProfile.name} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryInsight; 