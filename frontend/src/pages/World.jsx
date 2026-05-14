import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request, { showToast } from '../utils/request';
import { addToHistory } from '../utils/history';

function World() {
  const navigate = useNavigate();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMoments = async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      const res = await request.get('/moments/world');
      if (res?.success) {
        setMoments(res.data || []);
      }
    } catch (e) {
      console.error('获取随拍失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoments();
  }, [isOnline]);

  const likeMoment = async (momentId) => {
    try {
      const res = await request.post(`/moments/${momentId}/like`);
      if (res?.success) {
        setMoments(prev => prev.map(m => 
          m.id === momentId 
            ? { ...m, likes_count: res.data.likes_count, is_liked: res.data.is_liked }
            : m
        ));
      }
    } catch (e) {
      showToast('操作失败');
    }
  };

  return (
    <div className="page">
      <div className="header">
        <div className="header-title">世界</div>
        <div 
          style={{ cursor: 'pointer', fontSize: 20 }} 
          onClick={() => navigate('/capture')}
        >
          📹
        </div>
      </div>

      {!isOnline && (
        <div style={{ 
          padding: '8px 16px', 
          background: '#fff1f0',
          color: '#f5222d',
          fontSize: 13,
          textAlign: 'center'
        }}>
          ❌ 网络未连接
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : !isOnline ? (
        <div className="empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <p>网络未连接</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>请检查网络后重试</p>
          <button onClick={fetchMoments} style={{ marginTop: 16 }}>点击重试</button>
        </div>
      ) : moments.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <p>暂无随拍</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>去拍摄第一条随拍吧</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4 }}>
          {moments.map((moment) => (
            <div
              key={moment.id}
              style={{
                position: 'relative',
                aspectRatio: '3/4',
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => {
                addToHistory({
                  id: moment.id,
                  type: 'moment',
                  title: moment.description || '随拍作品',
                  desc: moment.nickname || '多闪用户',
                  cover: moment.media_url
                });
                navigate(`/moment/${moment.id}`);
              }}
            >
              <img
                src={moment.thumbnail_url || moment.media_url || 'https://picsum.photos/300/400'}
                alt="moment"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 8px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <img
                    src={moment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${moment.user_id}`}
                    alt="user"
                    style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 6 }}
                  />
                  <span style={{ color: '#fff', fontSize: 12 }}>{moment.nickname}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12 }}>
                  <span onClick={(e) => { e.stopPropagation(); likeMoment(moment.id); }}>
                    {moment.is_liked ? '❤️' : '🤍'} {moment.likes_count || 0}
                  </span>
                  <span>💬 {moment.comments_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default World;
