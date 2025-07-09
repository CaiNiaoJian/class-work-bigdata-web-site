import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      id: 'global-overview',
      path: '/global-overview',
      label: '全球概览',
      icon: '🌍',
      description: '宏观展示全球军事开支格局和趋势'
    },
    {
      id: 'country-insight',
      path: '/country-insight',
      label: '国家洞察',
      icon: '🏛️',
      description: '深度分析单个国家的军事支出数据'
    },
    {
      id: 'data-comparison',
      path: '/data-comparison',
      label: '数据比较',
      icon: '📊',
      description: '直观对比多个国家的军事支出'
    },
    {
      id: 'data-exploration',
      path: '/data-exploration',
      label: '数据探索',
      icon: '🔍',
      description: '交互式数据表格和原始数据访问'
    },
    {
      id: 'about',
      path: '/about',
      label: '关于',
      icon: 'ℹ️',
      description: '了解平台使命和数据来源'
    }
  ];

  // 根据当前路径确定活动标签
  const getActiveTab = () => {
    const currentPath = location.pathname;
    
    // 特殊处理国家洞察页面的动态路由
    if (currentPath.startsWith('/country/')) {
      return 'country-insight';
    }
    
    // 查找匹配的导航项
    const activeItem = navigationItems.find(item => item.path === currentPath);
    return activeItem?.id || 'global-overview';
  };

  const activeTab = getActiveTab();

  // 处理导航点击
  const handleNavigation = (item: typeof navigationItems[0]) => {
    navigate(item.path);
    onTabChange(item.id);
  };

  return (
    <nav className="navigation" role="navigation" aria-label="主导航">
      <div className="nav-container">
        {/* 品牌标识 */}
        <div className="nav-brand" onClick={() => navigate('/global-overview')}>
          <div className="brand-icon">🛡️</div>
          <div className="brand-text">
            <h1 className="brand-title">SIPRI数据平台</h1>
            <p className="brand-subtitle">全球军事支出透明化</p>
          </div>
        </div>

        {/* 桌面导航菜单 */}
        <div className="nav-menu desktop-menu">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item)}
              title={item.description}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 移动端菜单按钮 */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="切换移动菜单"
        >
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* 移动端导航菜单 */}
      <div 
        id="mobile-menu"
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
      >
        <div className="mobile-menu-content">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                handleNavigation(item);
                setIsMobileMenuOpen(false);
              }}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <div className="mobile-nav-icon">{item.icon}</div>
              <div className="mobile-nav-text">
                <span className="mobile-nav-label">{item.label}</span>
                <span className="mobile-nav-description">{item.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 移动端背景遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navigation; 