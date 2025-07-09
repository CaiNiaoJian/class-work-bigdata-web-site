import React, { useState, useEffect, useRef } from 'react';
import { countryDataService } from '../../services/countryDataService';
import './CountrySearch.css';

interface CountrySearchProps {
  onCountrySelect: (countryName: string) => void;
  placeholder?: string;
  className?: string;
}

const CountrySearch: React.FC<CountrySearchProps> = ({
  onCountrySelect,
  placeholder = "搜索国家...",
  className = ""
}) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载国家列表
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        const countryList = await countryDataService.getAvailableCountries();
        setCountries(countryList);
        setFilteredCountries(countryList.slice(0, 10)); // 初始显示前10个
      } catch (error) {
        console.error('加载国家列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCountries(countries.slice(0, 10));
      return;
    }

    const filtered = countries.filter(country =>
      country.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);

    setFilteredCountries(filtered);
    setSelectedIndex(-1);
  }, [searchTerm, countries]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
  };

  // 处理国家选择
  const handleCountrySelect = (countryName: string) => {
    setSearchTerm(countryName);
    setIsOpen(false);
    setSelectedIndex(-1);
    onCountrySelect(countryName);
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredCountries.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleCountrySelect(filteredCountries[selectedIndex]);
        } else if (filteredCountries.length > 0) {
          handleCountrySelect(filteredCountries[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取国旗URL
  const getFlagUrl = (countryName: string): string => {
    const countryMap: Record<string, string> = {
      'United States of America': 'us',
      'United Kingdom': 'gb',
      'South Korea': 'kr',
      'South Africa': 'za'
    };
    
    const code = countryMap[countryName] || 
      countryName.toLowerCase().replace(/\s+/g, '-').substring(0, 2);
    
    return `https://flagcdn.com/w20/${code}.png`;
  };

  return (
    <div className={`country-search ${className}`} ref={searchRef}>
      <div className="search-input-container">
        <div className="search-icon">🔍</div>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="off"
        />
        {loading && <div className="search-loading">⏳</div>}
        {searchTerm && (
          <button
            className="clear-btn"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && !loading && (
        <div className="search-dropdown">
          {filteredCountries.length > 0 ? (
            <ul className="country-list">
              {filteredCountries.map((country, index) => (
                <li
                  key={country}
                  className={`country-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleCountrySelect(country)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <img
                    src={getFlagUrl(country)}
                    alt={`${country} flag`}
                    className="country-flag"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="country-name">{country}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <div className="no-results-text">
                未找到匹配的国家
              </div>
              <div className="no-results-suggestion">
                请尝试输入其他关键词
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountrySearch; 