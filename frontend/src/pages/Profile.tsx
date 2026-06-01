import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Toast } from 'antd-mobile';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';

interface Stats {
  today: { income: number; expense: number };
  total: { income: number; expense: number };
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    today: { income: 0, expense: 0 },
    total: { income: 0, expense: 0 }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response: any = await api.get('/user/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleLogout = () => {
    Dialog.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      onConfirm: () => {
        logout();
        Toast.show({ content: '已退出登录', icon: 'success' });
        navigate('/login');
      }
    });
  };

  const menuItems = [
    { icon: '🛒', text: '购物返利', onClick: () => Toast.show({ content: '功能开发中', icon: 'info' }) },
    { icon: '🎓', text: '调教叨叨', onClick: () => Toast.show({ content: '功能开发中', icon: 'info' }) },
    { icon: '💳', text: '我的钱包', onClick: () => Toast.show({ content: '功能开发中', icon: 'info' }) },
    { icon: '🔔', text: '记账提醒', onClick: () => Toast.show({ content: '功能开发中', icon: 'info' }) },
    { icon: '⭐', text: '会员中心', onClick: () => Toast.show({ content: '功能开发中', icon: 'info' }) },
    { icon: '⚙️', text: '设置', onClick: () => Toast.show({ content: '功能开发中', icon: 'info' }) },
    { icon: '📤', text: '分享', onClick: () => Toast.show({ content: '功能开发中', icon: 'info' }) },
  ];

  return (
    <div className="page-container" style={{ background: '#f5f7fa' }}>
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-name">{user?.nickname || user?.username || '用户'}</div>
        {user?.is_vip ? (
          <div className="profile-vip">VIP 会员</div>
        ) : (
          <div style={{ 
            padding: '4px 12px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: 12, 
            fontSize: 12,
            cursor: 'pointer'
          }} onClick={() => Toast.show({ content: 'VIP功能开发中', icon: 'info' })}>
            开通 VIP →
          </div>
        )}
        {user && (
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 12 }}>
            体力值：{user.daily_stamina || 100}/100 ⚡
          </div>
        )}
      </div>

      <div className="stats-card">
        <div className="stat-item">
          <div className="stat-value">¥{stats.today.expense}</div>
          <div className="stat-label">今日支出</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">¥{stats.today.income}</div>
          <div className="stat-label">今日收入</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">¥{(stats.total.income - stats.total.expense).toFixed(2)}</div>
          <div className="stat-label">结余</div>
        </div>
      </div>

      <div className="profile-menu">
        <div className="menu-group">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-item" onClick={item.onClick}>
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.text}</span>
              <span className="menu-arrow">›</span>
            </div>
          ))}
        </div>

        <div className="menu-group">
          <div 
            className="menu-item" 
            onClick={handleLogout}
            style={{ color: '#ff4d4f' }}
          >
            <span className="menu-icon">🚪</span>
            <span className="menu-text">退出登录</span>
          </div>
        </div>
      </div>

      <div className="tab-bar">
        <div className="tab-item" onClick={() => navigate('/')}>
          <span className="tab-icon">💬</span>
          <span>聊天</span>
        </div>
        <div className="tab-item" onClick={() => navigate('/contacts')}>
          <span className="tab-icon">👥</span>
          <span>联系人</span>
        </div>
        <div className="add-btn" onClick={() => navigate('/')}>
          +
        </div>
        <div className="tab-item active" onClick={() => navigate('/profile')}>
          <span className="tab-icon">👤</span>
          <span>我的</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;