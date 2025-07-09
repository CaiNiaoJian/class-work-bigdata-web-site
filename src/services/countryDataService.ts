// import { dataService } from './dataService'; // 暂未使用

interface CountryProfile {
  name: string;
  iso3: string;
  region: string;
  flag: string;
  latestData: {
    year: number;
    totalSpending: number;
    gdpShare: number;
    perCapita: number;
    govSpendingShare: number;
  };
}

interface CountryHistoricalData {
  year: number;
  totalSpending: number | null;
  constantSpending: number | null;
  gdpShare: number | null;
  perCapita: number | null;
  govSpendingShare: number | null;
  localCurrencyFY: number | null;
  localCurrencyCY: number | null;
}

interface RegionalRanking {
  region: string;
  countries: Array<{
    name: string;
    value: number;
    rank: number;
  }>;
}

class CountryDataService {
  private cache: Map<string, any> = new Map();
  private readonly dataFiles = [
    'Current US$.json',
    'Constant (2023) US$.json',
    'Share of GDP.json',
    'Per capita.json',
    'Share of Govt. spending.json',
    'Local currency calendar years.json',
    'Local currency financial years.json'
  ];

  // 国家名称映射和地区分组
  private readonly countryRegionMap: Record<string, string> = {
    'United States of America': '北美洲',
    'China': '亚洲',
    'Russia': '欧洲',
    'India': '亚洲',
    'United Kingdom': '欧洲',
    'Saudi Arabia': '亚洲',
    'Germany': '欧洲',
    'France': '欧洲',
    'Japan': '亚洲',
    'South Korea': '亚洲',
    'Ukraine': '欧洲',
    'Australia': '大洋洲',
    'Israel': '亚洲',
    'Canada': '北美洲',
    'Italy': '欧洲',
    'Turkey': '欧洲',
    'Poland': '欧洲',
    'Netherlands': '欧洲',
    'Brazil': '南美洲',
    'Spain': '欧洲',
    'Norway': '欧洲',
    'Algeria': '非洲',
    'Thailand': '亚洲',
    'Iran': '亚洲',
    'Egypt': '非洲',
    'South Africa': '非洲',
    'Mexico': '北美洲',
    'Indonesia': '亚洲',
    'Iraq': '亚洲',
    'Pakistan': '亚洲'
  };

  /**
   * 获取所有可用国家列表
   */
  async getAvailableCountries(): Promise<string[]> {
    try {
      const cacheKey = 'available_countries';
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // 从主要数据文件获取国家列表
      const response = await fetch('/data/Current US$.json');
      const data = await response.json();
      
      const countries = Object.keys(data.data.by_country)
        .filter(country => !this.isRegionName(country))
        .sort();

      this.cache.set(cacheKey, countries);
      return countries;
    } catch (error) {
      console.error('获取国家列表失败:', error);
      return [];
    }
  }

  /**
   * 获取国家基本信息
   */
  async getCountryProfile(countryName: string): Promise<CountryProfile | null> {
    try {
      console.log(`📊 获取${countryName}的基本信息...`);

      // 获取最新年份的数据
      const [currentData, gdpData, perCapitaData, govData] = await Promise.all([
        this.getCountryDataFromFile('Current US$.json', countryName),
        this.getCountryDataFromFile('Share of GDP.json', countryName),
        this.getCountryDataFromFile('Per capita.json', countryName),
        this.getCountryDataFromFile('Share of Govt. spending.json', countryName)
      ]);

      if (!currentData || Object.keys(currentData).length === 0) {
        return null;
      }

      // 获取最新年份数据
      const years = Object.keys(currentData).filter(year => 
        !isNaN(parseInt(year)) && currentData[year] !== '...'
      ).sort((a, b) => parseInt(b) - parseInt(a));

      const latestYear = years[0];
      if (!latestYear) return null;

      const profile: CountryProfile = {
        name: countryName,
        iso3: this.getISO3Code(countryName),
        region: this.countryRegionMap[countryName] || '其他',
        flag: this.getFlagUrl(countryName),
        latestData: {
          year: parseInt(latestYear),
          totalSpending: currentData[latestYear] || 0,
          gdpShare: gdpData?.[latestYear] || 0,
          perCapita: perCapitaData?.[latestYear] || 0,
          govSpendingShare: govData?.[latestYear] || 0
        }
      };

      return profile;
    } catch (error) {
      console.error(`获取${countryName}基本信息失败:`, error);
      return null;
    }
  }

  /**
   * 获取国家历史数据
   */
  async getCountryHistoricalData(countryName: string): Promise<CountryHistoricalData[]> {
    try {
      console.log(`📈 获取${countryName}的历史数据...`);

      const [
        currentData,
        constantData,
        gdpData,
        perCapitaData,
        govData,
        localFYData,
        localCYData
      ] = await Promise.all([
        this.getCountryDataFromFile('Current US$.json', countryName),
        this.getCountryDataFromFile('Constant (2023) US$.json', countryName),
        this.getCountryDataFromFile('Share of GDP.json', countryName),
        this.getCountryDataFromFile('Per capita.json', countryName),
        this.getCountryDataFromFile('Share of Govt. spending.json', countryName),
        this.getCountryDataFromFile('Local currency financial years.json', countryName),
        this.getCountryDataFromFile('Local currency calendar years.json', countryName)
      ]);

      if (!currentData) return [];

      // 获取所有年份
      const allYears = new Set<string>();
      [currentData, constantData, gdpData, perCapitaData, govData, localFYData, localCYData]
        .forEach(data => {
          if (data) {
            Object.keys(data)
              .filter(year => !isNaN(parseInt(year)))
              .forEach(year => allYears.add(year));
          }
        });

      const historicalData: CountryHistoricalData[] = Array.from(allYears)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(year => ({
          year: parseInt(year),
          totalSpending: this.parseValue(currentData?.[year]),
          constantSpending: this.parseValue(constantData?.[year]),
          gdpShare: this.parseValue(gdpData?.[year]),
          perCapita: this.parseValue(perCapitaData?.[year]),
          govSpendingShare: this.parseValue(govData?.[year]),
          localCurrencyFY: this.parseValue(localFYData?.[year]),
          localCurrencyCY: this.parseValue(localCYData?.[year])
        }));

      return historicalData;
    } catch (error) {
      console.error(`获取${countryName}历史数据失败:`, error);
      return [];
    }
  }

  /**
   * 获取地区内排名
   */
  async getRegionalRanking(countryName: string, year: number = 2024): Promise<RegionalRanking | null> {
    try {
      console.log(`🏆 获取${countryName}在地区内的排名...`);

      const region = this.countryRegionMap[countryName];
      if (!region) return null;

      // 获取同地区的国家数据
      const response = await fetch('/data/Current US$.json');
      const data = await response.json();

      const yearData = data.data.by_year[year.toString()];
      if (!yearData) return null;

      // 筛选同地区国家
      const regionalCountries = Object.entries(yearData)
        .filter(([country, value]) => 
          this.countryRegionMap[country] === region &&
          typeof value === 'number' &&
          value > 0
        )
        .map(([country, value]) => ({
          name: country,
          value: value as number,
          rank: 0
        }))
        .sort((a, b) => b.value - a.value)
        .map((country, index) => ({
          ...country,
          rank: index + 1
        }));

      return {
        region,
        countries: regionalCountries
      };
    } catch (error) {
      console.error(`获取${countryName}地区排名失败:`, error);
      return null;
    }
  }

  /**
   * 从指定文件获取国家数据
   */
  private async getCountryDataFromFile(fileName: string, countryName: string): Promise<Record<string, any> | null> {
    try {
      const cacheKey = `${fileName}_${countryName}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await fetch(`/data/${fileName}`);
      const data = await response.json();

      const countryData = data.data.by_country[countryName];
      this.cache.set(cacheKey, countryData);

      return countryData || null;
    } catch (error) {
      console.error(`获取${fileName}中${countryName}数据失败:`, error);
      return null;
    }
  }

  /**
   * 解析数值（处理"..."等特殊值）
   */
  private parseValue(value: any): number | null {
    if (value === '...' || value === null || value === undefined) {
      return null;
    }
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(numValue) ? null : numValue;
  }

  /**
   * 获取ISO3代码
   */
  private getISO3Code(countryName: string): string {
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
      'South Korea': 'KOR'
    };
    return nameToISO3[countryName] || countryName.toUpperCase().substring(0, 3);
  }

  /**
   * 获取国旗URL
   */
  private getFlagUrl(countryName: string): string {
    const iso3 = this.getISO3Code(countryName);
    return `https://flagcdn.com/w160/${iso3.toLowerCase()}.png`;
  }

  /**
   * 判断是否为地区名称
   */
  private isRegionName(name: string): boolean {
    const regionKeywords = [
      'Africa', 'Asia', 'Europe', 'America', 'Oceania',
      'North Africa', 'Sub-Saharan Africa', 'Central Asia',
      'East Asia', 'South Asia', 'South East Asia', 'West Asia',
      'Central Europe', 'Eastern Europe', 'Northern Europe',
      'Southern Europe', 'Western Europe', 'Caribbean',
      'Central America', 'North America', 'South America'
    ];
    return regionKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 国家数据缓存已清除');
  }
}

export const countryDataService = new CountryDataService();
export type { CountryProfile, CountryHistoricalData, RegionalRanking }; 