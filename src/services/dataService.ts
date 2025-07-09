interface CountryRanking {
  country_name: string;
  value: number;
}

interface LocalDataStructure {
  metadata: {
    sheet_name: string;
    total_countries: number;
    total_years: number;
    year_range: {
      start: string;
      end: string;
    };
    generated_at: string;
  };
  data: {
    by_country: Record<string, Record<string, number | string>>;
    by_year: Record<string, Record<string, number | string>>;
    records: Array<Record<string, any>>;
  };
}

class DataService {
  private readonly baseApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  private readonly localDataFiles = [
    'Current US$.json',
    'Constant (2023) US$.json', 
    'Share of GDP.json',
    'Per capita.json',
    'Share of Govt. spending.json',
    'Local currency calendar years.json',
    'Local currency financial years.json'
  ];

  private cache: Map<string, any> = new Map();

  /**
   * 尝试从API获取数据，失败时fallback到本地JSON数据
   */
  async getGlobalSummary(): Promise<{ success: boolean; data: any }> {
    try {
      // 首先尝试API
      console.log('🔄 尝试从API获取数据...');
      const response = await fetch(`${this.baseApiUrl}/data/summary`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      } as any);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const text = await response.text();
      
      // 检查返回的是否是JSON
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('API返回HTML页面，可能服务未启动');
      }
      
      const data = JSON.parse(text);
      console.log('✅ API数据获取成功');
      return data;
      
    } catch (error) {
      console.warn('⚠️ API数据获取失败，切换到本地数据:', error);
      return await this.getLocalSummary();
    }
  }

  /**
   * 从本地JSON文件生成汇总数据
   */
  private async getLocalSummary(): Promise<{ success: boolean; data: any }> {
    try {
      console.log('📂 从本地JSON文件加载数据...');
      
      // 加载主要数据文件获取基础信息
      const currentUSData = await this.loadLocalDataFile('Current US$.json');
      
      if (!currentUSData) {
        throw new Error('无法加载本地数据文件');
      }

      // 模拟地区分布数据
      const regionBreakdown = this.generateRegionBreakdown(currentUSData);
      
      const summary = {
        overview: {
          total_countries: currentUSData.metadata.total_countries,
          total_records: currentUSData.metadata.total_countries * currentUSData.metadata.total_years,
          latest_year: parseInt(currentUSData.metadata.year_range.end),
          year_coverage: currentUSData.metadata.total_years,
        },
        dataTypes: this.localDataFiles.map(file => file.replace('.json', '')),
        regionBreakdown: regionBreakdown
      };

      console.log('✅ 本地数据汇总生成成功');
      return {
        success: true,
        data: summary
      };
      
    } catch (error) {
      console.error('❌ 本地数据加载失败:', error);
      return {
        success: false,
        data: null
      };
    }
  }

  /**
   * 获取排名数据
   */
  async getRankingData(year: number, dataType: number, limit: number = 10): Promise<{ success: boolean; data: CountryRanking[] }> {
    try {
      // 首先尝试API
      console.log(`🔄 尝试从API获取${year}年排名数据...`);
      const response = await fetch(`${this.baseApiUrl}/data/year/${year}/comparison?dataType=${dataType}&limit=${limit}`, {
        timeout: 5000,
      } as any);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const text = await response.text();
      
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('API返回HTML页面，可能服务未启动');
      }
      
      const data = JSON.parse(text);
      console.log('✅ API排名数据获取成功');
      return data;
      
    } catch (error) {
      console.warn('⚠️ API排名数据获取失败，切换到本地数据:', error);
      return await this.getLocalRankingData(year, dataType, limit);
    }
  }

  /**
   * 从本地数据生成排名
   */
  private async getLocalRankingData(year: number, dataType: number, limit: number): Promise<{ success: boolean; data: CountryRanking[] }> {
    try {
      console.log(`📂 从本地数据生成${year}年排名...`);
      
      // 根据dataType选择对应的文件
      const dataTypeMap: Record<number, string> = {
        1: 'Local currency calendar years.json',
        2: 'Local currency financial years.json', 
        3: 'Constant (2023) US$.json',
        4: 'Current US$.json',
        5: 'Share of GDP.json',
        6: 'Per capita.json',
        7: 'Share of Govt. spending.json'
      };

      const fileName = dataTypeMap[dataType] || 'Current US$.json';
      const data = await this.loadLocalDataFile(fileName);
      
      if (!data || !data.data.by_year[year.toString()]) {
        console.warn(`⚠️ ${year}年数据不存在，使用2024年数据`);
        const availableYears = Object.keys(data?.data.by_year || {}).filter(y => !isNaN(parseInt(y))).sort((a, b) => parseInt(b) - parseInt(a));
        const latestYear = availableYears[0] || '2024';
        const yearData = data?.data.by_year[latestYear] || {};
        
        return {
          success: true,
          data: this.processYearDataToRanking(yearData, limit)
        };
      }

      const yearData = data.data.by_year[year.toString()];
      
      console.log('✅ 本地排名数据生成成功');
      return {
        success: true,
        data: this.processYearDataToRanking(yearData, limit)
      };
      
    } catch (error) {
      console.error('❌ 本地排名数据生成失败:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  /**
   * 加载本地JSON数据文件
   */
  private async loadLocalDataFile(fileName: string): Promise<LocalDataStructure | null> {
    try {
      const cacheKey = `local_${fileName}`;
      
      if (this.cache.has(cacheKey)) {
        console.log(`📋 使用缓存的${fileName}数据`);
        return this.cache.get(cacheKey);
      }

      console.log(`📥 正在加载${fileName}...`);
      const response = await fetch(`/data/${fileName}`);
      
      if (!response.ok) {
        throw new Error(`无法加载${fileName}: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 缓存数据
      this.cache.set(cacheKey, data);
      console.log(`✅ ${fileName}加载完成`);
      
      return data;
    } catch (error) {
      console.error(`❌ 加载${fileName}失败:`, error);
      return null;
    }
  }

  /**
   * 将年度数据转换为排名格式
   */
  private processYearDataToRanking(yearData: Record<string, number | string>, limit: number): CountryRanking[] {
    const validEntries = Object.entries(yearData)
      .filter(([country, value]) => {
        return typeof value === 'number' && 
               !isNaN(value) && 
               value > 0 &&
               !this.isRegionName(country); // 过滤掉地区名称
      })
      .map(([country, value]) => ({
        country_name: country,
        value: value as number
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    return validEntries;
  }

  /**
   * 判断是否为地区名称（非国家）
   */
  private isRegionName(name: string): boolean {
    // 排除特定国家名称，即使它们包含地区关键词
    const countryExceptions = [
      'United States of America',
      'Central African Republic',
      'South Africa',
      'South Korea',
      'North Korea'
    ];
    
    // 如果是已知的国家名称，不视为地区
    if (countryExceptions.some(country => name === country)) {
      return false;
    }
    
    const regionKeywords = [
      'Africa', 'Asia', 'Europe', 'Oceania',
      'North Africa', 'Sub-Saharan Africa', 'Central Asia',
      'East Asia', 'South Asia', 'South East Asia', 'West Asia',
      'Central Europe', 'Eastern Europe', 'Northern Europe', 
      'Southern Europe', 'Western Europe', 'Caribbean',
      'Central America', 'North America', 'South America'
    ];
    
    return regionKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * 生成地区分布数据
   */
  private generateRegionBreakdown(data: LocalDataStructure): Array<{ region: string; country_count: number }> {
    const countries = Object.keys(data.data.by_country).filter(name => !this.isRegionName(name));
    
    // 模拟地区分组（实际应用中可以使用更精确的地区映射）
    const regions = [
      { region: '亚洲', country_count: Math.floor(countries.length * 0.30) },
      { region: '欧洲', country_count: Math.floor(countries.length * 0.25) },
      { region: '非洲', country_count: Math.floor(countries.length * 0.20) },
      { region: '美洲', country_count: Math.floor(countries.length * 0.15) },
      { region: '大洋洲', country_count: Math.floor(countries.length * 0.05) },
      { region: '其他', country_count: countries.length - Math.floor(countries.length * 0.95) }
    ];

    return regions;
  }

  /**
   * 获取所有可用的数据类型
   */
  getAvailableDataTypes(): string[] {
    return this.localDataFiles.map(file => file.replace('.json', ''));
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 数据缓存已清除');
  }
}

// 导出单例实例
export const dataService = new DataService();
export default dataService; 