import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Layout/Navigation';
import GlobalOverview from './components/GlobalOverview/GlobalOverview';
import CountryInsight from './components/CountryInsight/CountryInsight';
import DataComparison from './components/DataComparison/DataComparison';
import DataExplorer from './components/DataExplorer/DataExplorer';
import About from './components/About/About';
import './App.css';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('global-overview');

  return (
    <Router>
      <div className="App">
        <Navigation 
          currentTab={currentTab} 
          onTabChange={setCurrentTab}
        />
        <main className="main-content">
          <Routes>
            {/* 主页重定向到全球概览 */}
            <Route path="/" element={<Navigate to="/global-overview" replace />} />
            
            {/* 全球概览页面 */}
            <Route 
              path="/global-overview" 
              element={<GlobalOverview />} 
            />
            
            {/* 国家洞察页面 */}
            <Route 
              path="/country-insight" 
              element={<CountryInsight />} 
            />
            
            {/* 带国家参数的国家洞察页面 */}
            <Route 
              path="/country/:countryName" 
              element={<CountryInsight />} 
            />
            
            {/* 数据比较页面 */}
            <Route 
              path="/data-comparison" 
              element={<DataComparison />} 
            />
            
            {/* 数据探索页面 */}
            <Route 
              path="/data-exploration" 
              element={<DataExplorer />} 
            />
            
            {/* 关于页面 */}
            <Route 
              path="/about" 
              element={<About />} 
            />
            
            {/* 404页面 */}
            <Route 
              path="*" 
              element={
                <div className="placeholder-section">
                  <h2>页面未找到</h2>
                  <p>请检查URL是否正确</p>
                </div>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
