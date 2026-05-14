import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory as clearHistoryUtil } from '../utils/history';
import { showToast } from '../utils/request';

function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  const loadHistory = () => {
    const data = getHistory();
    console.log('加载浏览历史:', data);
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const clearHistory = () => {
    clearHistoryUtil();
    setHistory([]);
    showToast('已清空浏览历史');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="page">
      <div className="header">
        <div className="header-back" onClick={() => navigate(-1)}>←</div>
        <div className="header-title">浏览历史</div>
        {history.length > 0 && (
          <div 
            style={{ cursor: 'pointer', fontSize: 14, color: '#f5222d' }}
            onClick={clearHistory}
          >
            清空
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <p>暂无浏览历史</p>
          <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>
            去世界看看有趣的内容吧
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => navigate('/world')}
          >
            去逛逛
          </button>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {history.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (item.type === 'moment') {
                  navigate(`/moment/${item.id}`);
                } else if (item.type === 'chat') {
                  navigate(`/chat/${item.id}`);
                }
              }}
            >
              <img
                src={item.cover || 'https://picsum.photos/80/80'}
                alt="cover"
                style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 8, 
                  objectFit: 'cover',
                  marginRight: 12
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {item.desc || ''}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  {formatTime(item.timestamp)}
                </div>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
