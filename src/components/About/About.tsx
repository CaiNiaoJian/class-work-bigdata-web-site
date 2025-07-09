import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-content">
        <header className="about-header">
          <h1>关于平台</h1>
          <p className="about-subtitle">
            通过数据透明化，促进对全球安全与和平的理解
          </p>
          <p className="about-subtitle">
            致谢：感谢 杨文嘉 老师为我提供这样一次机会！
          </p>
        </header>

        {/* 我们的使命 */}
        <section className="about-section mission-section">
          <h2>
            <span className="section-icon">🌍</span>
            平台简介
          </h2>
          <div className="mission-content">
            <p>
              <strong>SIPRI军事支出数据平台</strong>致力于通过数据透明化，促进对全球安全与和平的理解。
              我相信，只有当军事支出数据变得透明、可理解时，公众才能更好地参与到关于
              国防预算、军备竞赛和国际安全的讨论中来。
            </p>
            <p>
              在一个充满不确定性的世界里，准确、及时的军事支出数据不仅是政策制定者的重要参考，
              也是研究人员、记者、学生和关心国际事务的公民了解全球安全格局的重要工具。
            </p>
            <p>
              希望通过直观的数据可视化和深入的分析，帮助用户：
            </p>
            <ul className="mission-goals">
              <li>理解全球军事支出的趋势和模式</li>
              <li>比较不同国家的国防投入水平</li>
              <li>探索军事支出与经济发展的关系</li>
              <li>促进基于事实的政策讨论</li>
              <li>增进对国际安全议题的理解</li>
            </ul>
          </div>
        </section>

        {/* 数据来源 */}
        <section className="about-section data-source-section">
          <h2>
            <span className="section-icon">📊</span>
            数据来源
          </h2>
          <div className="data-source-content">
            <div className="sipri-info">
              <div className="sipri-logo">
                <span className="sipri-emblem">🕊️</span>
                <div className="sipri-text">
                  <h3>斯德哥尔摩国际和平研究所</h3>
                  <p>Stockholm International Peace Research Institute</p>
                </div>
              </div>
              
              <p>
                本平台的所有军事支出数据均来源于<strong>SIPRI军事支出数据库</strong>，
                这是全球最权威、最全面的军事支出数据来源之一。
              </p>
              
              <div className="sipri-features">
                <div className="feature-item">
                  <h4>🌐 全球覆盖</h4>
                  <p>涵盖全球180多个国家和地区</p>
                </div>
                <div className="feature-item">
                  <h4>📈 历史数据</h4>
                  <p>提供1988年至今的完整时间序列</p>
                </div>
                <div className="feature-item">
                  <h4>🔍 专业标准</h4>
                  <p>采用国际统一的军事支出定义和计算方法</p>
                </div>
                <div className="feature-item">
                  <h4>🔄 定期更新</h4>
                  <p>每年4月发布最新数据和分析报告</p>
                </div>
              </div>

              <div className="data-attribution">
                <p className="attribution-text">
                  <strong>数据使用声明：</strong>
                  根据SIPRI的"合理使用"政策，我们在此明确标注数据来源，并鼓励用户访问SIPRI官方网站获取更多详细信息。
                </p>
                <a 
                  href="https://www.sipri.org/databases/milex" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="sipri-link"
                >
                  <span>访问SIPRI军事支出数据库</span>
                  <span className="external-icon">↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 名词解释 */}
        <section className="about-section terminology-section">
          <h2>
            <span className="section-icon">📚</span>
            重要名词解释
          </h2>
          <div className="terminology-content">
            <div className="definition-grid">
              <div className="definition-item">
                <h3>当前美元 (Current USD)</h3>
                <p>
                  以数据当年的美元价值计算的军事支出，未经通胀调整。
                  这种计算方式便于比较同一年份不同国家的支出水平，
                  但不适合进行跨年度的趋势分析。
                </p>
              </div>

              <div className="definition-item">
                <h3>不变价美元 (Constant USD)</h3>
                <p>
                  以某一基准年（通常是最新年份）的美元购买力计算的军事支出，
                  已消除通胀影响。这种计算方式适合分析真实的支出变化趋势，
                  反映军事支出的实际增长或下降。
                </p>
              </div>

              <div className="definition-item">
                <h3>占GDP份额 (% of GDP)</h3>
                <p>
                  军事支出占国内生产总值的百分比，反映一个国家将多大比例的
                  经济产出用于军事目的。这是比较不同经济规模国家军事负担的
                  重要指标。
                </p>
              </div>

              <div className="definition-item">
                <h3>人均军费 (Per Capita)</h3>
                <p>
                  军事支出除以总人口得出的数值，反映平均每个公民承担的
                  军事支出金额。这个指标有助于理解军事支出对普通民众的
                  经济影响。
                </p>
              </div>

              <div className="definition-item">
                <h3>本国货币计算</h3>
                <p>
                  以各国本国货币单位计算的军事支出，通常按财政年度统计。
                  这种计算方式能更准确反映各国政府的实际军事预算决策，
                  不受汇率波动影响。
                </p>
              </div>

              <div className="definition-item">
                <h3>财政年度vs日历年度</h3>
                <p>
                  不同国家采用不同的预算年度：有些国家使用日历年度（1-12月），
                  有些使用财政年度（如美国的10月-次年9月）。SIPRI数据库
                  会注明每个国家使用的具体年度制度。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 联系方式 */}
        <section className="about-section contact-section">
          <h2>
            <span className="section-icon">📧</span>
            联系我
          </h2>
          <div className="contact-content">
            <p>
              我重视您的反馈和建议。如果您在使用过程中遇到问题，
              发现数据错误，或有改进建议，请通过以下方式联系我：
            </p>

            <div className="contact-methods">
              <div className="contact-item">
                <div className="contact-icon">💌</div>
                <div className="contact-info">
                  <h3>反馈建议</h3>
                  <p>发送邮件至：<a href="mailto:gaojian1573@foxmail.com">gaojian1573@foxmail.com</a></p>
                  <p>将在24小时内回复您的问题</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">🐛</div>
                <div className="contact-info">
                  <h3>技术支持</h3>
                  <p>发送邮件至：<a href="mailto:gaojian1573@foxmail.com">gaojian1573@foxmail.com</a></p>
                  <p>报告技术问题、数据访问问题等</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">🤝</div>
                <div className="contact-info">
                  <h3>合作洽谈</h3>
                  <p>发送邮件至：<a href="mailto:gaojian1573@foxmail.com">gaojian1573@foxmail.com</a></p>
                  <p>学术合作、数据合作、媒体合作等</p>
                </div>
              </div>
            </div>

            <div className="contact-note">
              <p>
                <strong>注意：</strong>本平台仅提供数据展示和分析服务，
                如需获取原始数据或进行深度研究，请直接联系
                <a href="https://www.sipri.org/contact" target="_blank" rel="noopener noreferrer">
                  SIPRI官方机构
                </a>。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About; 