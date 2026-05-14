import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request, { showToast } from '../utils/request';
import useAuthStore from '../store/authStore';
import { addToHistory } from '../utils/history';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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

  const fetchChats = async () => {
    if (!isOnline) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      setError(false);
      const res = await request.get('/chats');
      if (res?.success) {
        setChats(res.data || []);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [isOnline]);

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  if (error) {
    return (
      <div className="page">
        <div className="header">
          <div className="header-title">消息</div>
        </div>
        <div className="error">
          {!isOnline ? (
            <>
              <h3>📶 网络未连接</h3>
              <p style={{ marginTop: 8, color: '#666' }}>请检查网络连接后重试</p>
            </>
          ) : (
            <>
              <h3>加载失败</h3>
              <p style={{ marginTop: 8, color: '#666' }}>获取聊天列表失败</p>
            </>
          )}
          <button onClick={fetchChats}>点击重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <div className="header-title">消息</div>
        <div style={{ cursor: 'pointer', fontSize: 20 }} onClick={() => navigate('/contacts')}>
          ➕
        </div>
      </div>

      <div style={{ 
        padding: '8px 16px', 
        background: isOnline ? '#e6f7ff' : '#fff1f0',
        color: isOnline ? '#1890ff' : '#f5222d',
        fontSize: 13,
        textAlign: 'center'
      }}>
        {isOnline ? '✅ 网络已连接' : '❌ 网络未连接'}
      </div>

      <div style={{ padding: 12 }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 12, 
            background: '#fff0f3',
            borderRadius: 12,
            marginBottom: 8,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/profile')}
        >
          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
            alt="avatar" 
            className="avatar-sm"
            style={{ marginRight: 12 }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>我的随拍</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>记录美好生活</div>
          </div>
        </div>

        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 12, 
            background: '#fffbe6',
            borderRadius: 12,
            marginBottom: 8,
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: 24, marginRight: 12 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 500 }}>多闪小助手</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>欢迎来到多闪！</div>
          </div>
        </div>
      </div>

      <div className="divider" style={{ margin: '0 16px' }} />

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : chats.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <p>暂无消息</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>去添加好友开始聊天吧</p>
        </div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)'
            }}
            onClick={() => {
              addToHistory({
                id: chat.id,
                type: 'chat',
                title: chat.display_name || '聊天',
                desc: chat.last_message || '',
                cover: chat.display_avatar
              });
              navigate(`/chat/${chat.id}`);
            }}
          >
            <img
              src={chat.display_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`}
              alt="avatar"
              className="avatar"
              style={{ marginRight: 12 }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 500 }}>{chat.display_name || '聊天'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {formatTime(chat.last_message_time)}
                </div>
              </div>
              <div 
                style={{ 
                  fontSize: 13, 
                  color: 'var(--text-secondary)',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {chat.last_message || '暂无消息'}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Home;
