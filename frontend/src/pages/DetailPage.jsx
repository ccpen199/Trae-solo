import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function DetailPage({ type, title }) {
  const navigate = useNavigate();
  const { name } = useParams();
  const pageTitle = title || name || '详情';

  const getIcon = () => {
    if (type === 'shortcut') return '⚡';
    if (type === 'ai') return '🤖';
    if (type === 'featured') return '✨';
    return '📄';
  };

  const getDescription = () => {
    if (type === 'shortcut') {
      return `正在为您加载${pageTitle}服务...`;
    }
    if (type === 'ai') {
      return `正在为您启动${pageTitle}智能服务...`;
    }
    if (type === 'featured') {
      return `正在为您加载${pageTitle}精选内容...`;
    }
    return '页面加载中...';
  };

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h1 className="detail-title">{pageTitle}</h1>
      </div>
      
      <div className="detail-content">
        <div className="detail-icon">{getIcon()}</div>
        <h2 className="detail-page-title">{pageTitle}</h2>
        <p className="detail-desc">{getDescription()}</p>
        
        <div className="detail-features">
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <span>功能开发中</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>即将上线</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💡</span>
            <span>敬请期待</span>
          </div>
        </div>

        <button 
          className="detail-back-btn"
          onClick={() => navigate('/')}
        >
          返回首页
        </button>
      </div>
    </div>
  );
}

export default DetailPage;
