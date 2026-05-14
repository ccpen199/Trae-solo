import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFromFavorites } from '../utils/favorites';
import { showToast } from '../utils/request';

function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemove = (e, id, type) => {
    e.stopPropagation();
    removeFromFavorites(id, type);
    setFavorites(getFavorites());
    showToast('已取消收藏');
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
        <div className="header-title">我的收藏</div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>💝</div>
          <p>暂无收藏</p>
          <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>
            看到喜欢的内容就收藏起来吧
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
          {favorites.map((item, index) => (
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
              <div
                onClick={(e) => handleRemove(e, item.id, item.type)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  color: '#f5222d',
                  cursor: 'pointer'
                }}
              >
                取消
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
