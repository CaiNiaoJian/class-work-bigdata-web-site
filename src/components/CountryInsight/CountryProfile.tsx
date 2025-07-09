import React from 'react';
import { CountryProfile as CountryProfileType } from '../../services/countryDataService';
import './CountryProfile.css';

interface CountryProfileProps {
  profile: CountryProfileType;
}

const CountryProfile: React.FC<CountryProfileProps> = ({ profile }) => {
  // 格式化货币
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}万亿`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}十亿`;
    return `$${value.toFixed(0)}百万`;
  };

  // 格式化百分比
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // 格式化人均支出
  const formatPerCapita = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  // 获取支出等级
  const getSpendingLevel = (gdpShare: number): { level: string; color: string; icon: string } => {
    if (gdpShare >= 4) return { level: '极高', color: '#EF4444', icon: '🔴' };
    if (gdpShare >= 2.5) return { level: '高', color: '#F59E0B', icon: '🟡' };
    if (gdpShare >= 1.5) return { level: '中等', color: '#10B981', icon: '🟢' };
    return { level: '较低', color: '#3B82F6', icon: '🔵' };
  };

  const spendingLevel = getSpendingLevel(profile.latestData.gdpShare);

  return (
    <div className="country-profile">
      {/* 国家基本信息 */}
      <div className="profile-header">
        <div className="country-flag-container">
          <img
            src={profile.flag}
            alt={`${profile.name} flag`}
            className="country-flag"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect width="160" height="120" fill="%23374151"/><text x="80" y="60" text-anchor="middle" fill="%23D1D5DB" font-size="12">🏳️</text></svg>';
            }}
          />
        </div>
        
        <div className="country-info">
          <h1 className="country-name">{profile.name}</h1>
          <div className="country-meta">
            <span className="country-region">📍 {profile.region}</span>
            <span className="country-code">🏷️ {profile.iso3}</span>
            <span className="data-year">📅 {profile.latestData.year}年数据</span>
          </div>
        </div>

        <div className="spending-level-badge">
          <div className="level-icon">{spendingLevel.icon}</div>
          <div className="level-info">
            <div className="level-label">军费水平</div>
            <div 
              className="level-value"
              style={{ color: spendingLevel.color }}
            >
              {spendingLevel.level}
            </div>
          </div>
        </div>
      </div>

      {/* 核心数据卡片 */}
      <div className="data-cards">
        <div className="data-card primary">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">军事支出总额</div>
            <div className="card-value">
              {formatCurrency(profile.latestData.totalSpending)}
            </div>
            <div className="card-unit">当年美元</div>
          </div>
        </div>

        <div className="data-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-label">占GDP比例</div>
            <div className="card-value">
              {formatPercentage(profile.latestData.gdpShare)}
            </div>
            <div className="card-unit">国内生产总值比重</div>
          </div>
        </div>

        <div className="data-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <div className="card-label">人均军费</div>
            <div className="card-value">
              {formatPerCapita(profile.latestData.perCapita)}
            </div>
            <div className="card-unit">美元/人</div>
          </div>
        </div>

        <div className="data-card">
          <div className="card-icon">🏛️</div>
          <div className="card-content">
            <div className="card-label">占政府支出</div>
            <div className="card-value">
              {profile.latestData.govSpendingShare > 0 
                ? formatPercentage(profile.latestData.govSpendingShare)
                : 'N/A'
              }
            </div>
            <div className="card-unit">政府支出比重</div>
          </div>
        </div>
      </div>

      {/* 数据解读 */}
      <div className="data-insights">
        <h3 className="insights-title">数据解读</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <div className="insight-label">军费规模</div>
              <div className="insight-text">
                {profile.latestData.totalSpending >= 100000 
                  ? `${profile.name}是全球军费支出大国，军费规模庞大`
                  : profile.latestData.totalSpending >= 10000
                  ? `${profile.name}军费支出处于中等规模`
                  : `${profile.name}军费支出相对较少`
                }
              </div>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">⚖️</div>
            <div className="insight-content">
              <div className="insight-label">经济负担</div>
              <div className="insight-text">
                {profile.latestData.gdpShare >= 3
                  ? '军费占GDP比例较高，安全支出负担较重'
                  : profile.latestData.gdpShare >= 2
                  ? '军费占GDP比例中等，安全支出适中'
                  : '军费占GDP比例较低，经济负担相对较轻'
                }
              </div>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">🌍</div>
            <div className="insight-content">
              <div className="insight-label">地区地位</div>
              <div className="insight-text">
                在{profile.region}地区具有重要的安全影响力，
                军费支出体现了其安全关切和战略地位
              </div>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <div className="insight-label">投入水平</div>
              <div className="insight-text">
                人均军费支出反映了该国民众承担的安全成本，
                以及国家安全投入的深度和广度
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据来源声明 */}
      <div className="data-source">
        <div className="source-icon">ℹ️</div>
        <div className="source-text">
          <strong>数据来源：</strong>
          斯德哥尔摩国际和平研究所(SIPRI) · {profile.latestData.year}年数据
          <br />
          <span className="source-note">
            数据经过专业处理和验证，符合国际标准
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountryProfile; 