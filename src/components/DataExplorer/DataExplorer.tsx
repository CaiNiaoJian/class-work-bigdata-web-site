import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  FilterFn,
} from '@tanstack/react-table';
import { saveAs } from 'file-saver';
import './DataExplorer.css';

// 数据类型定义
interface MilitaryData {
  country: string;
  year: number;
  value: number | null;
  continent?: string;
  organization?: string[];
}

interface DataSet {
  id: string;
  name: string;
  description: string;
  filename: string;
}

// 数据集配置
const dataSets: DataSet[] = [
  {
    id: 'gdp-share',
    name: '占GDP份额',
    description: '军事支出占国内生产总值的百分比',
    filename: 'Share of GDP.json'
  },
  {
    id: 'current-usd',
    name: '当前美元支出',
    description: '当年美元计价的军事支出',
    filename: 'Current US$.json'
  },
  {
    id: 'constant-usd',
    name: '恒定美元支出 (2023)',
    description: '以2023年美元价格计算的军事支出',
    filename: 'Constant (2023) US$.json'
  },
  {
    id: 'per-capita',
    name: '人均支出',
    description: '人均军事支出',
    filename: 'Per capita.json'
  },
  {
    id: 'govt-share',
    name: '占政府支出份额',
    description: '军事支出占政府总支出的百分比',
    filename: 'Share of Govt. spending.json'
  }
];

// 国家到大洲的映射
const countryToContinent: { [key: string]: string } = {
  // 亚洲
  'China': '亚洲', 'India': '亚洲', 'Japan': '亚洲', 'South Korea': '亚洲',
  'Singapore': '亚洲', 'Thailand': '亚洲', 'Vietnam': '亚洲', 'Malaysia': '亚洲',
  'Indonesia': '亚洲', 'Philippines': '亚洲', 'Pakistan': '亚洲', 'Bangladesh': '亚洲',
  'Taiwan': '亚洲', 'Israel': '亚洲', 'Saudi Arabia': '亚洲', 'Iran': '亚洲',
  'Turkey': '亚洲', 'Iraq': '亚洲', 'Afghanistan': '亚洲', 'Kazakhstan': '亚洲',
  'Uzbekistan': '亚洲', 'Myanmar': '亚洲', 'Nepal': '亚洲', 'Sri Lanka': '亚洲',
  'Cambodia': '亚洲', 'Laos': '亚洲', 'Mongolia': '亚洲', 'North Korea': '亚洲',
  
  // 欧洲和北美洲
  'USA': '北美洲', 'Russia': '欧洲', 'Germany': '欧洲', 'France': '欧洲', 'United Kingdom': '欧洲',
  'Italy': '欧洲', 'Spain': '欧洲', 'Poland': '欧洲', 'Netherlands': '欧洲',
  'Norway': '欧洲', 'Sweden': '欧洲', 'Finland': '欧洲', 'Denmark': '欧洲',
  'Belgium': '欧洲', 'Switzerland': '欧洲', 'Austria': '欧洲', 'Greece': '欧洲',
  'Portugal': '欧洲', 'Czech Republic': '欧洲', 'Hungary': '欧洲', 'Romania': '欧洲',
  'Bulgaria': '欧洲', 'Croatia': '欧洲', 'Slovakia': '欧洲', 'Slovenia': '欧洲',
  'Estonia': '欧洲', 'Latvia': '欧洲', 'Lithuania': '欧洲', 'Ukraine': '欧洲',
  'Belarus': '欧洲', 'Moldova': '欧洲', 'Serbia': '欧洲', 'Bosnia and Herzegovina': '欧洲',
  'Montenegro': '欧洲', 'North Macedonia': '欧洲', 'Albania': '欧洲', 'Kosovo': '欧洲',
  'Ireland': '欧洲', 'Luxembourg': '欧洲', 'Malta': '欧洲', 'Cyprus': '欧洲',
  'Iceland': '欧洲', 'Canada': '北美洲', 'Mexico': '北美洲',
  
  // 其他大洲 - 简化映射
  'Brazil': '南美洲', 'Argentina': '南美洲', 'Chile': '南美洲', 'Colombia': '南美洲',
  'Egypt': '非洲', 'South Africa': '非洲', 'Morocco': '非洲', 'Algeria': '非洲',
  'Nigeria': '非洲', 'Australia': '大洋洲', 'New Zealand': '大洋洲'
};

// 国家所属组织映射
const countryToOrganizations: { [key: string]: string[] } = {
  // NATO成员国
  'USA': ['NATO'], 'Canada': ['NATO'], 'United Kingdom': ['NATO'], 'France': ['NATO'],
  'Germany': ['NATO'], 'Italy': ['NATO'], 'Spain': ['NATO'], 'Poland': ['NATO'],
  'Netherlands': ['NATO'], 'Belgium': ['NATO'], 'Norway': ['NATO'], 'Denmark': ['NATO'],
  'Portugal': ['NATO'], 'Czech Republic': ['NATO'], 'Hungary': ['NATO'], 'Greece': ['NATO'],
  'Turkey': ['NATO'], 'Iceland': ['NATO'], 'Luxembourg': ['NATO'], 'Estonia': ['NATO'],
  'Latvia': ['NATO'], 'Lithuania': ['NATO'], 'Slovakia': ['NATO'], 'Slovenia': ['NATO'],
  'Bulgaria': ['NATO'], 'Romania': ['NATO'], 'Croatia': ['NATO'], 'Albania': ['NATO'],
  'Montenegro': ['NATO'], 'North Macedonia': ['NATO'], 'Finland': ['NATO'],
  
  // 上海合作组织 (SCO)
  'China': ['SCO'], 'Russia': ['SCO', 'CSTO'], 'Kazakhstan': ['SCO', 'CSTO'], 
  'Kyrgyzstan': ['SCO', 'CSTO'], 'Tajikistan': ['SCO', 'CSTO'], 'Uzbekistan': ['SCO'],
  'India': ['SCO'], 'Pakistan': ['SCO'], 'Iran': ['SCO'],
  
  // 集体安全条约组织 (CSTO)
  'Belarus': ['CSTO'], 'Armenia': ['CSTO']
};

// 全局筛选函数
const globalFilter: FilterFn<MilitaryData> = (row, columnId, value, addMeta) => {
  const searchValue = String(value).toLowerCase();
  const country = String(row.getValue('country')).toLowerCase();
  const year = String(row.getValue('year'));
  const dataValue = String(row.getValue('value') || '');
  
  return country.includes(searchValue) || 
         year.includes(searchValue) || 
         dataValue.includes(searchValue);
};

const DataExplorer: React.FC = () => {
  const [selectedDataSet, setSelectedDataSet] = useState<string>('gdp-share');
  const [data, setData] = useState<MilitaryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [yearRange, setYearRange] = useState<[number, number]>([1949, 2024]);
  const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // 列定义
  const columns = useMemo<ColumnDef<MilitaryData, any>[]>(() => [
    {
      id: 'country',
      accessorKey: 'country',
      header: '国家',
      cell: (info) => (
        <div className="country-cell">
          <span className="country-name">{info.getValue() as string}</span>
          <span className="country-meta">
            {countryToContinent[info.getValue() as string] && (
              <span className="continent">{countryToContinent[info.getValue() as string]}</span>
            )}
            {countryToOrganizations[info.getValue() as string]?.map(org => (
              <span key={org} className={`organization org-${org.toLowerCase()}`}>
                {org}
              </span>
            ))}
          </span>
        </div>
      ),
      filterFn: 'includesString',
    },
    {
      id: 'year',
      accessorKey: 'year',
      header: '年份',
      cell: (info) => <span className="year-cell">{info.getValue() as number}</span>,
    },
    {
      id: 'value',
      accessorKey: 'value',
      header: () => {
        const dataset = dataSets.find(d => d.id === selectedDataSet);
        return dataset?.name || '数值';
      },
      cell: (info) => {
        const value = info.getValue() as number | null;
        if (value === null || value === undefined) {
          return <span className="null-value">—</span>;
        }
        
        // 根据数据类型格式化数值
        let formattedValue: string;
        if (selectedDataSet === 'gdp-share' || selectedDataSet === 'govt-share') {
          formattedValue = `${value.toFixed(2)}%`;
        } else if (selectedDataSet === 'current-usd' || selectedDataSet === 'constant-usd') {
          formattedValue = `$${(value / 1000000).toFixed(1)}B`;
        } else if (selectedDataSet === 'per-capita') {
          formattedValue = `$${value.toFixed(0)}`;
        } else {
          formattedValue = value.toFixed(2);
        }
        
        return <span className="value-cell">{formattedValue}</span>;
      },
      sortingFn: 'basic',
    },
  ], [selectedDataSet]);

  // 加载数据
  const loadData = async (datasetId: string) => {
    setLoading(true);
    try {
      const dataset = dataSets.find(d => d.id === datasetId);
      if (!dataset) return;

      const response = await fetch(`/data/${dataset.filename}`);
      const jsonData = await response.json();
      
      // 转换数据格式 - 处理嵌套的JSON结构
      const formattedData: MilitaryData[] = [];
      
      // 检查数据结构并提取正确的国家数据
      const countryData = jsonData.data?.by_country || jsonData;
      
      Object.entries(countryData).forEach(([country, yearData]: [string, any]) => {
        // 跳过非国家数据（如 metadata, data 等）
        if (typeof yearData !== 'object' || yearData === null || Array.isArray(yearData)) {
          return;
        }
        
        Object.entries(yearData).forEach(([year, value]: [string, any]) => {
          // 跳过非年份数据和notes
          if (year === 'Notes' || isNaN(parseInt(year))) {
            return;
          }
          
          // 处理数值
          let numericValue: number | null = null;
          if (value !== '..' && value !== null && value !== undefined) {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
              numericValue = parsed;
            }
          }
          
          formattedData.push({
            country,
            year: parseInt(year),
            value: numericValue,
            continent: countryToContinent[country],
            organization: countryToOrganizations[country] || []
          });
        });
      });

      console.log(`加载了 ${formattedData.length} 条数据记录`);
      setData(formattedData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选后的数据
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 年份范围筛选
      if (item.year < yearRange[0] || item.year > yearRange[1]) {
        return false;
      }
      
      // 大洲筛选
      if (selectedContinents.length > 0 && !selectedContinents.includes(item.continent || '')) {
        return false;
      }
      
      // 组织筛选
      if (selectedOrganizations.length > 0) {
        const hasOrganization = selectedOrganizations.some(org => 
          item.organization?.includes(org)
        );
        if (!hasOrganization) return false;
      }
      
      return true;
    });
  }, [data, yearRange, selectedContinents, selectedOrganizations]);

  // 表格实例
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter: globalFilterValue,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilterValue,
    globalFilterFn: globalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  // 获取唯一的大洲列表
  const uniqueContinents = useMemo(() => 
    Array.from(new Set(data.map(item => item.continent).filter(Boolean))) as string[]
  , [data]);
  
  const organizations = ['NATO', 'SCO', 'CSTO'];

  // 下载CSV功能
  const downloadCSV = () => {
    const csvContent = [
      ['国家', '年份', dataSets.find(d => d.id === selectedDataSet)?.name || '数值'],
      ...filteredData.map(item => [
        item.country,
        item.year.toString(),
        item.value?.toString() || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `SIPRI_${selectedDataSet}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 下载原始Excel文件
  const downloadOriginalData = () => {
    const link = document.createElement('a');
    link.href = '/data/SIPRI-Milex-data-1949-2024.xlsx';
    link.download = 'SIPRI-Milex-data-1949-2024.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    loadData(selectedDataSet);
  }, [selectedDataSet]);

  return (
    <div className="data-explorer">
      <div className="data-explorer-header">
        <div className="header-content">
          <h1>数据探索</h1>
          <p>深入探索SIPRI军事支出数据，支持多条件筛选和数据下载</p>
        </div>
      </div>

      <div className="data-explorer-content">
        {/* 数据集选择 */}
        <div className="control-section">
          <h3>选择数据集</h3>
          <div className="dataset-selector">
            {dataSets.map(dataset => (
              <button
                key={dataset.id}
                className={`dataset-option ${selectedDataSet === dataset.id ? 'active' : ''}`}
                onClick={() => setSelectedDataSet(dataset.id)}
              >
                <span className="dataset-name">{dataset.name}</span>
                <span className="dataset-description">{dataset.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 筛选控件 */}
        <div className="filters-section">
          <h3>数据筛选</h3>
          
          <div className="filters-grid">
            {/* 全局搜索 */}
            <div className="filter-group">
              <label>全局搜索</label>
              <input
                type="text"
                placeholder="搜索国家、年份或数值..."
                value={globalFilterValue}
                onChange={e => setGlobalFilterValue(e.target.value)}
                className="search-input"
              />
            </div>

            {/* 年份范围 */}
            <div className="filter-group">
              <label>年份范围</label>
              <div className="year-range">
                <input
                  type="number"
                  min="1949"
                  max="2024"
                  value={yearRange[0]}
                  onChange={e => setYearRange([parseInt(e.target.value), yearRange[1]])}
                />
                <span>至</span>
                <input
                  type="number"
                  min="1949"
                  max="2024"
                  value={yearRange[1]}
                  onChange={e => setYearRange([yearRange[0], parseInt(e.target.value)])}
                />
              </div>
            </div>

            {/* 大洲筛选 */}
            <div className="filter-group">
              <label>大洲</label>
              <div className="multi-select">
                {uniqueContinents.sort().map(continent => (
                  <label key={continent} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedContinents.includes(continent)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedContinents([...selectedContinents, continent]);
                        } else {
                          setSelectedContinents(selectedContinents.filter(c => c !== continent));
                        }
                      }}
                    />
                    {continent}
                  </label>
                ))}
              </div>
            </div>

            {/* 组织筛选 */}
            <div className="filter-group">
              <label>组织</label>
              <div className="multi-select">
                {organizations.map(org => (
                  <label key={org} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedOrganizations.includes(org)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedOrganizations([...selectedOrganizations, org]);
                        } else {
                          setSelectedOrganizations(selectedOrganizations.filter(o => o !== org));
                        }
                      }}
                    />
                    <span className={`org-tag org-${org.toLowerCase()}`}>{org}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="quick-actions">
            <button 
              onClick={() => {
                setSelectedContinents([]);
                setSelectedOrganizations([]);
                setGlobalFilterValue('');
                setYearRange([1949, 2024]);
              }}
              className="clear-filters-btn"
            >
              清除所有筛选
            </button>
            
            <div className="download-actions">
              <button onClick={downloadCSV} className="download-btn primary">
                下载当前数据 (CSV)
              </button>
              <button onClick={downloadOriginalData} className="download-btn secondary">
                下载原始数据 (Excel)
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="table-section">
          <div className="table-header">
            <div className="table-info">
              <span>显示 {table.getFilteredRowModel().rows.length} 条记录</span>
              {filteredData.length !== data.length && (
                <span className="filtered-info">
                  (从 {data.length} 条中筛选)
                </span>
              )}
            </div>
            
            <div className="pagination-info">
              第 {table.getState().pagination.pageIndex + 1} 页，
              共 {table.getPageCount()} 页
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>加载数据中...</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className={header.column.getCanSort() ? 'sortable' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="header-content">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="sort-indicator">
                                {header.column.getIsSorted() === 'asc' ? ' ↑' : 
                                 header.column.getIsSorted() === 'desc' ? ' ↓' : ' ↕'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页控件 */}
          <div className="pagination-controls">
            <div className="pagination-buttons">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="pagination-btn"
              >
                首页
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="pagination-btn"
              >
                上一页
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="pagination-btn"
              >
                下一页
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="pagination-btn"
              >
                末页
              </button>
            </div>
            
            <div className="page-size-selector">
              每页显示
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
              >
                {[25, 50, 100, 200].map(pageSize => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              条
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
