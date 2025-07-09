import React from 'react';
import { RegionalRanking as RegionalRankingType } from '../../services/countryDataService';
import './RegionalRanking.css';

interface RegionalRankingProps {
  ranking: RegionalRankingType;
  currentCountry: string;
}

const RegionalRanking: React.FC<RegionalRankingProps> = ({ ranking, currentCountry }) => {
  // 格式化货币
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}万亿`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}十亿`;
    return `$${value.toFixed(0)}百万`;
  };

  // 获取排名图标
  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  // 获取排名颜色
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return 'var(--text-secondary)';
    }
  };

  // 获取进度条百分比
  const getProgressPercentage = (value: number, maxValue: number): number => {
    return Math.round((value / maxValue) * 100);
  };

  const maxValue = ranking.countries.length > 0 ? ranking.countries[0].value : 0;
  const currentCountryData = ranking.countries.find(c => c.name === currentCountry);

  return (
    <div className="regional-ranking">
      <div className="ranking-header">
        <h3 className="ranking-title">
          {ranking.region}地区军费排名
        </h3>
        <div className="ranking-subtitle">
          基于2024年军事支出数据 · 共{ranking.countries.length}个国家
        </div>
        
        {currentCountryData && (
          <div className="current-country-highlight">
            <div className="highlight-icon">⭐</div>
            <div className="highlight-text">
              <strong>{currentCountry}</strong> 在{ranking.region}地区排名第
              <span className="highlight-rank">{currentCountryData.rank}</span>位
            </div>
          </div>
        )}
      </div>

      <div className="ranking-list">
        {ranking.countries.slice(0, 10).map((country, index) => {
          const isCurrentCountry = country.name === currentCountry;
          const progressPercentage = getProgressPercentage(country.value, maxValue);
          
          return (
            <div 
              key={country.name}
              className={`ranking-item ${isCurrentCountry ? 'current' : ''}`}
            >
              <div className="rank-position">
                <span 
                  className="rank-icon"
                  style={{ color: getRankColor(country.rank) }}
                >
                  {getRankIcon(country.rank)}
                </span>
              </div>
              
              <div className="country-info">
                <div className="country-name">
                  {country.name}
                  {isCurrentCountry && (
                    <span className="current-badge">当前</span>
                  )}
                </div>
                <div className="spending-amount">
                  {formatCurrency(country.value)}
                </div>
              </div>
              
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${progressPercentage}%`,
                      backgroundColor: isCurrentCountry 
                        ? 'var(--accent-primary)' 
                        : 'var(--border-secondary)'
                    }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {progressPercentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ranking.countries.length > 10 && (
        <div className="ranking-more">
          <div className="more-icon">📊</div>
          <div className="more-text">
            还有 {ranking.countries.length - 10} 个国家未显示
          </div>
        </div>
      )}

      {/* 地区统计 */}
      <div className="region-stats">
        <div className="stats-title">地区统计</div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-label">最高支出</div>
              <div className="stat-value">
                {formatCurrency(maxValue)}
              </div>
              <div className="stat-country">
                {ranking.countries[0]?.name}
              </div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">地区总支出</div>
              <div className="stat-value">
                {formatCurrency(
                  ranking.countries.reduce((sum, country) => sum + country.value, 0)
                )}
              </div>
              <div className="stat-country">
                {ranking.countries.length}个国家合计
              </div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-label">平均支出</div>
              <div className="stat-value">
                {formatCurrency(
                  ranking.countries.reduce((sum, country) => sum + country.value, 0) / 
                  ranking.countries.length
                )}
              </div>
              <div className="stat-country">
                人均地区水平
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="ranking-notes">
        <div className="note-item">
          <span className="note-icon">📅</span>
          <span>排名基于2024年最新军事支出数据</span>
        </div>
        <div className="note-item">
          <span className="note-icon">💰</span>
          <span>金额以当年美元计算，未经通胀调整</span>
        </div>
        <div className="note-item">
          <span className="note-icon">🌍</span>
          <span>地区划分按照SIPRI标准分类</span>
        </div>
      </div>
    </div>
  );
};

export default RegionalRanking; 