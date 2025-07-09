import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup
} from 'react-simple-maps';
import { dataService } from '../../services/dataService';
import './InteractiveMap.css';

// 简化的色阶函数，避免复杂的D3类型问题
interface ColorScale {
  (value: number): string;
  domain: (domain: [number, number]) => ColorScale;
  getDomain: () => [number, number];
}

const scaleSequential = (interpolator: (t: number) => string): ColorScale => {
  let _domain: [number, number] = [0, 1];
  
  const scale = (value: number): string => {
    const normalizedValue = Math.max(0, Math.min(1, (value - _domain[0]) / (_domain[1] - _domain[0])));
    return interpolator(normalizedValue);
  };
  
  scale.domain = (domain: [number, number]) => {
    _domain = domain;
    return scale;
  };
  
  scale.getDomain = () => _domain;
  
  return scale;
};

const interpolateRdYlBu = (t: number): string => {
  // 简化的颜色插值函数
  const colors = [
    '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
    '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
  ];
  const index = Math.floor(t * (colors.length - 1));
  return colors[index] || colors[0];
};

// 世界地图TopoJSON数据源
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryData {
  iso3: string;
  name: string;
  value: number;
  gdpShare: number;
  perCapita: number;
  dataType: string;
}

interface MapTooltip {
  country: string;
  value: number;
  gdpShare: number;
  perCapita: number;
  x: number;
  y: number;
  visible: boolean;
}

interface InteractiveMapProps {
  year?: number;
  metric?: 'total' | 'gdp' | 'percapita';
  width?: number;
  height?: number;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  year = 2024,
  metric = 'gdp',
  width = 800,
  height = 500
}) => {
  const [mapData, setMapData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<MapTooltip>({
    country: '',
    value: 0,
    gdpShare: 0,
    perCapita: 0,
    x: 0,
    y: 0,
    visible: false
  });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  // 国家名称映射 (ISO3 -> 显示名称)
  const countryNameMap = useMemo(() => ({
    'USA': 'United States of America',
    'CHN': 'China',
    'RUS': 'Russia',
    'IND': 'India',
    'GBR': 'United Kingdom',
    'SAU': 'Saudi Arabia',
    'DEU': 'Germany',
    'FRA': 'France',
    'JPN': 'Japan',
    'KOR': 'South Korea',
    'UKR': 'Ukraine',
    'AUS': 'Australia',
    'ISR': 'Israel',
    'CAN': 'Canada',
    'ITA': 'Italy',
    'TUR': 'Turkey',
    'POL': 'Poland',
    'NLD': 'Netherlands',
    'BRA': 'Brazil',
    'ESP': 'Spain'
  }), []);

  // 颜色比例尺
  const colorScale = useMemo(() => {
    if (mapData.length === 0) {
      const scale = scaleSequential(interpolateRdYlBu);
      scale.domain([0, 1]);
      return scale;
    }
    
    const values = mapData.map(d => {
      switch(metric) {
        case 'gdp': return d.gdpShare;
        case 'percapita': return d.perCapita;
        default: return d.value;
      }
    }).filter(v => v > 0);
    
    const maxValue = values.length > 0 ? Math.max(...values) : 1;
    
    const scale = scaleSequential(interpolateRdYlBu);
    scale.domain([0, maxValue]);
    return scale;
  }, [mapData, metric]);

  // 获取地图数据
  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 获取不同类型的数据
      const [gdpData, totalData, perCapitaData] = await Promise.all([
        dataService.getRankingData(year, 5, 50), // Share of GDP
        dataService.getRankingData(year, 4, 50), // Current US$
        dataService.getRankingData(year, 6, 50)  // Per capita
      ]);

      // 合并数据
      const combinedData: CountryData[] = [];
      
      if (gdpData.success) {
        gdpData.data.forEach(country => {
          const totalCountry = totalData.success ? 
            totalData.data.find(c => c.country_name === country.country_name) : null;
          const perCapitaCountry = perCapitaData.success ?
            perCapitaData.data.find(c => c.country_name === country.country_name) : null;

          combinedData.push({
            iso3: getISO3Code(country.country_name),
            name: country.country_name,
            value: totalCountry?.value || 0,
            gdpShare: country.value,
            perCapita: perCapitaCountry?.value || 0,
            dataType: 'military_expenditure'
          });
        });
      }

      setMapData(combinedData);
      console.log('🗺️ 地图数据加载完成:', combinedData.length, '个国家');
      
    } catch (error) {
      console.error('❌ 地图数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  // 简单的ISO3代码映射 (实际项目中应使用完整的映射表)
  const getISO3Code = (countryName: string): string => {
    const nameToISO3: Record<string, string> = {
      'United States of America': 'USA',
      'China': 'CHN', 
      'Russia': 'RUS',
      'India': 'IND',
      'United Kingdom': 'GBR',
      'Saudi Arabia': 'SAU',
      'Germany': 'DEU',
      'France': 'FRA',
      'Japan': 'JPN',
      'South Korea': 'KOR',
      'Ukraine': 'UKR',
      'Australia': 'AUS',
      'Israel': 'ISR',
      'Canada': 'CAN',
      'Italy': 'ITA',
      'Turkey': 'TUR',
      'Poland': 'POL',
      'Netherlands': 'NLD',
      'Brazil': 'BRA',
      'Spain': 'ESP'
    };
    
    return nameToISO3[countryName] || countryName.toUpperCase().substring(0, 3);
  };

  // 获取国家数据
  const getCountryData = (geoProperties: any): CountryData | null => {
    const countryName = geoProperties.NAME || geoProperties.NAME_EN;
    return mapData.find(d => 
      d.name === countryName || 
      d.iso3 === geoProperties.ISO_A3 ||
      countryNameMap[geoProperties.ISO_A3 as keyof typeof countryNameMap] === d.name
    ) || null;
  };

  // 获取国家颜色
  const getCountryColor = (countryData: CountryData | null): string => {
    if (!countryData) return '#374151'; // 灰色 - 无数据
    
    let value: number;
    switch(metric) {
      case 'gdp': 
        value = countryData.gdpShare;
        break;
      case 'percapita':
        value = countryData.perCapita;
        break;
      default:
        value = countryData.value;
    }
    
    if (value === 0) return '#374151';
    return colorScale(value);
  };

  // 鼠标悬停处理
  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    const countryData = getCountryData(geo.properties);
    if (countryData) {
      setTooltip({
        country: countryData.name,
        value: countryData.value,
        gdpShare: countryData.gdpShare,
        perCapita: countryData.perCapita,
        x: event.clientX,
        y: event.clientY,
        visible: true
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // 格式化数值
  const formatValue = (value: number, type: 'currency' | 'percentage' | 'number'): string => {
    switch(type) {
      case 'currency':
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}万亿`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}十亿`;
        return `$${value.toFixed(0)}百万`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  if (loading) {
    return (
      <div className="interactive-map loading">
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <h3>正在加载世界地图数据...</h3>
          <p>准备展示 {year} 年全球军事支出分布</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interactive-map">
      <div className="map-container" onMouseMove={handleMouseMove}>
        <ComposableMap
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 140
          }}
          width={width}
          height={height}
          style={{
            width: "100%",
            height: "auto"
          }}
        >
          <defs>
            <linearGradient id="sphere-gradient">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          <ZoomableGroup
            zoom={zoom}
            center={center}
                       onMoveEnd={(position: { coordinates: [number, number]; zoom: number }) => {
             setCenter(position.coordinates);
             setZoom(position.zoom);
           }}
          >
            {/* 地球背景 */}
            <Sphere id="sphere" fill="url(#sphere-gradient)" stroke="#374151" strokeWidth={0.5} />
            
            {/* 经纬网格 */}
            <Graticule stroke="#374151" strokeWidth={0.3} strokeOpacity={0.5} />
            
            {/* 国家地理数据 */}
                         <Geographies geography={geoUrl}>
               {({ geographies }: { geographies: any[] }) =>
                 geographies.map((geo: any) => {
                  const countryData = getCountryData(geo.properties);
                  const fillColor = getCountryColor(countryData);
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#1e293b"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          fill: fillColor,
                          stroke: "#1e293b",
                          strokeWidth: 0.5,
                          outline: "none"
                        },
                        hover: {
                          fill: countryData ? "#0EA5E9" : "#4B5563",
                          stroke: "#38BDF8",
                          strokeWidth: 1,
                          outline: "none"
                        },
                        pressed: {
                          fill: "#0284C7",
                          stroke: "#0EA5E9",
                          strokeWidth: 1,
                          outline: "none"
                        }
                      }}
                                             onMouseEnter={(event: React.MouseEvent) => handleMouseEnter(geo, event)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* 工具提示 */}
        {tooltip.visible && (
          <div 
            className="map-tooltip"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 10,
              transform: tooltip.x > width / 2 ? 'translateX(-100%)' : 'none'
            }}
          >
            <div className="tooltip-header">
              <h4>{tooltip.country}</h4>
            </div>
            <div className="tooltip-content">
              <div className="tooltip-item">
                <span className="tooltip-label">军事支出:</span>
                <span className="tooltip-value">
                  {formatValue(tooltip.value, 'currency')}
                </span>
              </div>
              <div className="tooltip-item">
                <span className="tooltip-label">占GDP比例:</span>
                <span className="tooltip-value">
                  {formatValue(tooltip.gdpShare, 'percentage')}
                </span>
              </div>
              <div className="tooltip-item">
                <span className="tooltip-label">人均支出:</span>
                <span className="tooltip-value">
                  {formatValue(tooltip.perCapita, 'number')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 地图控制面板 */}
      <div className="map-controls">
        <div className="zoom-controls">
          <button 
            className="zoom-btn"
            onClick={() => setZoom(Math.min(zoom * 1.5, 8))}
          >
            🔍+
          </button>
          <button 
            className="zoom-btn"
            onClick={() => setZoom(Math.max(zoom / 1.5, 1))}
          >
            🔍-
          </button>
          <button 
            className="zoom-btn"
            onClick={() => {
              setZoom(1);
              setCenter([0, 0]);
            }}
          >
            🌍
          </button>
        </div>
        
        {/* 图例 */}
        <div className="map-legend">
          <h4>
            {metric === 'gdp' ? '占GDP比例' : 
             metric === 'percapita' ? '人均支出' : '总支出'}
          </h4>
          <div className="legend-gradient">
            <div 
              className="gradient-bar"
              style={{
                background: `linear-gradient(to right, ${colorScale(0)}, ${colorScale(0.5)}, ${colorScale(1)})`
              }}
            ></div>
            <div className="legend-labels">
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>
          <div className="legend-item no-data">
            <div className="legend-color" style={{ backgroundColor: '#374151' }}></div>
            <span>无数据</span>
          </div>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-number">{mapData.length}</span>
          <span className="stat-label">有数据国家</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{year}</span>
          <span className="stat-label">数据年份</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap; 