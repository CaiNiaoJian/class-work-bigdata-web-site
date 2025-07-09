import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CountryHistoricalData } from '../../services/countryDataService';
import './HistoricalChart.css';

interface HistoricalChartProps {
  data: CountryHistoricalData[];
  countryName: string;
}

interface ChartMetric {
  key: keyof CountryHistoricalData;
  label: string;
  color: string;
  unit: string;
  formatter: (value: number) => string;
}

// 图表数据点类型
interface ChartDataPoint {
  year: number;
  [key: string]: number | null;
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({ data, countryName }) => {
  // 可选的指标配置
  const metrics: ChartMetric[] = useMemo(() => [
    {
      key: 'totalSpending',
      label: '当年美元支出',
      color: '#0EA5E9',
      unit: '百万美元',
      formatter: (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}万亿`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}十亿`;
        return `$${value.toFixed(0)}百万`;
      }
    },
    {
      key: 'constantSpending',
      label: '2023年不变美元',
      color: '#10B981',
      unit: '百万美元（2023年价格）',
      formatter: (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}万亿`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}十亿`;
        return `$${value.toFixed(0)}百万`;
      }
    },
    {
      key: 'gdpShare',
      label: '占GDP比例',
      color: '#F59E0B',
      unit: '%',
      formatter: (value: number) => `${value.toFixed(2)}%`
    },
    {
      key: 'perCapita',
      label: '人均支出',
      color: '#EF4444',
      unit: '美元/人',
      formatter: (value: number) => `$${value.toLocaleString()}`
    },
    {
      key: 'govSpendingShare',
      label: '占政府支出比例',
      color: '#8B5CF6',
      unit: '%',
      formatter: (value: number) => `${value.toFixed(2)}%`
    }
  ], []);

  // 选中的指标
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(['totalSpending', 'gdpShare'])
  );

  // 处理后的图表数据
  const chartData = useMemo(() => {
    return data
      .filter(item => item.year >= 1990) // 只显示1990年以后的数据
      .map(item => {
        const chartPoint: ChartDataPoint = {
          year: item.year,
          ...Object.fromEntries(
            metrics.map(metric => [
              metric.key,
              item[metric.key]
            ])
          )
        };
        return chartPoint;
      })
      .filter(item => 
        // 至少有一个选中指标有数据
        Array.from(selectedMetrics).some(key => {
          const value = item[key as keyof ChartDataPoint];
          return value !== null && value !== undefined;
        })
      );
  }, [data, selectedMetrics, metrics]);

  // 切换指标选择
  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metricKey)) {
        if (newSet.size > 1) { // 至少保留一个指标
          newSet.delete(metricKey);
        }
      } else {
        newSet.add(metricKey);
      }
      return newSet;
    });
  };

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-year">{label}年</div>
          {payload.map((entry: any, index: number) => {
            const metric = metrics.find(m => m.key === entry.dataKey);
            if (!metric || entry.value === null) return null;
            
            return (
              <div key={index} className="tooltip-item">
                <div 
                  className="tooltip-color" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="tooltip-label">{metric.label}:</span>
                <span className="tooltip-value">
                  {metric.formatter(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="historical-chart">
      <div className="chart-header">
        <h3 className="chart-title">
          {countryName} 军事支出历史趋势
        </h3>
        <div className="chart-description">
          选择下方指标进行对比分析（支持多选）
        </div>
      </div>

      {/* 指标选择器 */}
      <div className="metric-selector">
        {metrics.map(metric => (
          <button
            key={metric.key}
            className={`metric-btn ${selectedMetrics.has(metric.key) ? 'active' : ''}`}
            onClick={() => toggleMetric(metric.key)}
            style={{
              '--metric-color': metric.color
            } as React.CSSProperties}
          >
            <div className="metric-color" style={{ backgroundColor: metric.color }}></div>
            <div className="metric-info">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-unit">{metric.unit}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 图表容器 */}
      <div className="chart-container">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--border-primary)"
                opacity={0.3}
              />
              <XAxis 
                dataKey="year"
                stroke="var(--text-secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}万亿`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}十亿`;
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '14px'
                }}
              />
              
              {/* 渲染选中的指标线条 */}
              {Array.from(selectedMetrics).map(metricKey => {
                const metric = metrics.find(m => m.key === metricKey);
                if (!metric) return null;

                return (
                  <Line
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    stroke={metric.color}
                    strokeWidth={3}
                    dot={{ fill: metric.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: metric.color, strokeWidth: 2 }}
                    connectNulls={false}
                    name={metric.label}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-chart-data">
            <div className="no-data-icon">📊</div>
            <div className="no-data-text">暂无可显示的历史数据</div>
            <div className="no-data-suggestion">
              该国家在选定时间范围内可能缺少相关数据
            </div>
          </div>
        )}
      </div>

      {/* 数据说明 */}
      <div className="chart-notes">
        <div className="note-item">
          <span className="note-icon">📅</span>
          <span>数据时间范围：{chartData.length > 0 ? `${chartData[0]?.year}-${chartData[chartData.length - 1]?.year}` : 'N/A'}</span>
        </div>
        <div className="note-item">
          <span className="note-icon">📊</span>
          <span>数据来源：SIPRI军事支出数据库</span>
        </div>
        <div className="note-item">
          <span className="note-icon">⚠️</span>
          <span>部分年份数据可能缺失，图表中以断点显示</span>
        </div>
      </div>
    </div>
  );
};

export default HistoricalChart; 