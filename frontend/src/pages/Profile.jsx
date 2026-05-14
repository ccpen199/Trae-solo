import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request, { showToast } from '../utils/request';
import useAuthStore from '../store/authStore';
import { getFavorites } from '../utils/favorites';
import { getHistory } from '../utils/history';

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

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

  useEffect(() => {
    const refreshCounts = () => {
      setFavoritesCount(getFavorites().length);
      setHistoryCount(getHistory().length);
    };
    
    refreshCounts();
    window.addEventListener('focus', refreshCounts);
    return () => window.removeEventListener('focus', refreshCounts);
  }, []);

  const fetchProfile = async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      const res = await request.get('/users/profile');
      if (res?.success) {
        setProfile(res.data);
      }
    } catch (e) {
      console.error('获取用户信息失败');
    }
  };

  const fetchMoments = async () => {
    if (!isOnline) return;

    try {
      const res = await request.get('/moments/my');
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
    fetchProfile();
    fetchMoments();
  }, [isOnline]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast('已退出登录');
  };

  const handleMenuItemClick = (itemName) => {
    if (itemName === '浏览历史') {
      navigate('/history');
    } else if (itemName === '我的收藏') {
      navigate('/favorites');
    } else if (itemName === '隐私设置') {
      navigate('/privacy');
    } else {
      showToast(`${itemName}功能开发中`);
    }
  };

  return (
    <div className="page">
      <div className="header">
        <div className="header-title">我</div>
        <div style={{ cursor: 'pointer', fontSize: 20 }} onClick={() => handleMenuItemClick('设置')}>⚙️</div>
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

      <div style={{ padding: 24, textAlign: 'center', background: 'linear-gradient(135deg, #fe2c55 0%, #ff6b8a 100%)' }}>
        <img
          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`}
          alt="avatar"
          style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #fff' }}
        />
        <h2 style={{ color: '#fff', marginTop: 12, fontSize: 20 }}>
          {profile?.nickname || user?.nickname || '多闪用户'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
          {profile?.bio || '记录美好生活'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 20 }}>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{profile?.friends_count || 0}</div>
            <div style={{ fontSize: 12 }}>好友</div>
          </div>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{profile?.moments_count || 0}</div>
            <div style={{ fontSize: 12 }}>随拍</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onClick={() => handleMenuItemClick('我的随拍')}
        >
          <span style={{ fontSize: 20, marginRight: 12 }}>📷</span>
          <div style={{ flex: 1, fontWeight: 500 }}>我的随拍</div>
          <span style={{ color: 'var(--text-secondary)' }}>{moments.length} 条 →</span>
        </div>
        
        <div 
          style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onClick={() => handleMenuItemClick('我的收藏')}
        >
          <span style={{ fontSize: 20, marginRight: 12 }}>💝</span>
          <div style={{ flex: 1, fontWeight: 500 }}>我的收藏</div>
          <span style={{ color: 'var(--text-secondary)' }}>{favoritesCount > 0 ? `${favoritesCount} 条 →` : '→'}</span>
        </div>
        
        <div 
          style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onClick={() => handleMenuItemClick('浏览历史')}
        >
          <span style={{ fontSize: 20, marginRight: 12 }}>📋</span>
          <div style={{ flex: 1, fontWeight: 500 }}>浏览历史</div>
          <span style={{ color: 'var(--text-secondary)' }}>{historyCount > 0 ? `${historyCount} 条 →` : '→'}</span>
        </div>
        
        <div 
          style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onClick={() => handleMenuItemClick('隐私设置')}
        >
          <span style={{ fontSize: 20, marginRight: 12 }}>🛡️</span>
          <div style={{ flex: 1, fontWeight: 500 }}>隐私设置</div>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
        </div>

        <div 
          style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onClick={() => handleMenuItemClick('帮助与反馈')}
        >
          <span style={{ fontSize: 20, marginRight: 12 }}>❓</span>
          <div style={{ flex: 1, fontWeight: 500 }}>帮助与反馈</div>
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <button
          className="btn btn-block"
          onClick={handleLogout}
          style={{ background: '#fff1f0', color: '#f5222d', border: '1px solid #ffccc7' }}
        >
          退出登录
        </button>
      </div>

      <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
        多闪 v1.0.0
      </div>
    </div>
  );
}

export default Profile;
