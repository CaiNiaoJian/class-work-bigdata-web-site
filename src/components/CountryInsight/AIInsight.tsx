import React, { useState, useEffect, useRef } from 'react';
import { aiService, AIStreamResponse } from '../../services/aiService';
import './AIInsight.css';

interface AIInsightProps {
  countryName: string;
}

const AIInsight: React.FC<AIInsightProps> = ({ countryName }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 格式化显示的内容（将markdown转换为HTML）
  const formatContent = (text: string): string => {
    return text
      .replace(/## (.*)/g, '<h3 class="ai-section-title">$1</h3>')
      .replace(/- (.*)/g, '<li class="ai-list-item">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p class="ai-paragraph">')
      .replace(/^(.*)$/gm, '<p class="ai-paragraph">$1</p>')
      .replace(/<p class="ai-paragraph"><h3/g, '<h3')
      .replace(/<\/h3><\/p>/g, '</h3>')
      .replace(/<p class="ai-paragraph"><li/g, '<ul class="ai-list"><li')
      .replace(/<\/li><\/p>/g, '</li></ul>');
  };

  // 生成国家分析
  const generateAnalysis = React.useCallback(async () => {
    if (!countryName.trim()) return;

    // 取消之前的请求
    const currentController = abortControllerRef.current;
    if (currentController) {
      currentController.abort();
    }

    setIsLoading(true);
    setIsStreaming(false);
    setContent('');
    setError(null);

    try {
      await aiService.generateCountryAnalysis(countryName, (response: AIStreamResponse) => {
        if (response.error) {
          setError(response.error);
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        if (response.isComplete) {
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        if (response.content) {
          setIsLoading(false);
          setIsStreaming(true);
          setContent(prev => prev + response.content);
          
          // 自动滚动到底部
          if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
          }
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成分析失败');
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [countryName]);

  // 重试生成
  const handleRetry = () => {
    generateAnalysis();
  };

  // 切换展开/收起状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // 当国家名称变化时自动生成分析
  useEffect(() => {
    // 在effect内部创建abort controller
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;
    
    if (countryName) {
      generateAnalysis();
    } else {
      setContent('');
      setError(null);
    }

    // 清理函数 - 使用effect内部的controller引用
    return () => {
      if (currentController) {
        currentController.abort();
      }
    };
  }, [countryName, generateAnalysis]);

  if (!countryName) {
    return null;
  }

  return (
    <div className="ai-insight">
      <div className="ai-insight-header">
        <div className="ai-header-content">
          <div className="ai-brand">
            <span className="ai-icon">🌙</span>
            <h2 className="ai-title">Kimi 知道</h2>
            <span className="ai-subtitle">AI深度分析</span>
          </div>
          <div className="ai-country-badge">
            <span className="country-flag">🌍</span>
            <span className="country-name">{countryName}</span>
          </div>
        </div>
        
        {(content || error) && (
          <button 
            className="ai-toggle-btn"
            onClick={toggleExpanded}
            aria-label={isExpanded ? '收起分析' : '展开分析'}
          >
            <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            <span>{isExpanded ? '收起分析' : '展开分析'}</span>
          </button>
        )}
      </div>

      <div className={`ai-content-container ${isExpanded ? 'expanded' : ''}`}>
        {/* 加载状态 */}
        {isLoading && !isStreaming && (
          <div className="ai-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <span>Kimi正在深度分析</span>
              <span className="country-highlight">{countryName}</span>
              <span>，请稍候...</span>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {/* 流式输出状态 */}
        {isStreaming && (
          <div className="ai-streaming-indicator">
            <span className="streaming-icon">✨</span>
            <span>Kimi正在实时生成分析内容...</span>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="ai-error">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <div className="error-title">分析生成失败</div>
              <div className="error-message">{error}</div>
              <button className="retry-btn" onClick={handleRetry}>
                重新生成分析
              </button>
            </div>
          </div>
        )}

        {/* 分析内容 */}
        {content && (
          <div className="ai-content" ref={contentRef}>
            <div className="ai-content-header">
              <h3>
                <span className="analysis-icon">📊</span>
                {countryName} - 综合分析报告
              </h3>
              <div className="analysis-meta">
                <span className="powered-by">由 Moonshot AI Kimi 提供支持</span>
                {isStreaming && <span className="streaming-badge">实时生成中...</span>}
              </div>
            </div>
            
            <div 
              className="ai-analysis-content"
              dangerouslySetInnerHTML={{ __html: formatContent(content) }}
            />
            
            {isStreaming && (
              <div className="streaming-cursor">
                <span className="cursor-blink">|</span>
              </div>
            )}
          </div>
        )}

        {/* 底部提示 */}
        {(content || error) && (
          <div className="ai-footer">
            <div className="ai-disclaimer">
              <span className="disclaimer-icon">ℹ️</span>
              <span>以上分析由 Kimi AI 生成，仅供参考。如需获取准确的军事支出数据，请参考SIPRI官方数据库。</span>
            </div>
            
            {content && !isStreaming && (
              <div className="ai-actions">
                <button className="action-btn regenerate" onClick={handleRetry}>
                  <span>🔄</span>
                  重新生成
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsight; 