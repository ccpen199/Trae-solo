import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../App';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();

  const menuItems = [
    { label: '我的创作', icon: '✍️' },
    { label: '我的收藏', icon: '⭐' },
    { label: '关注列表', icon: '👤' },
    { label: '浏览历史', icon: '📖' },
    { label: '设置', icon: '⚙️' },
    { label: '帮助与反馈', icon: '❓' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <header className="header">
        <div className="logo">我的</div>
      </header>

      <main style={{ paddingBottom: '80px' }}>
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.nickname?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.nickname || user?.username || '游客用户'}</div>
            <div className="profile-stats">
              <span>关注 12</span>
              <span>粉丝 8</span>
              <span>获赞 156</span>
            </div>
          </div>
        </div>

        <div className="profile-menu">
          {menuItems.map((item, idx) => (
            <div key={idx} className="menu-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>{item.icon}</span>
                {item.label}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>›</span>
            </div>
          ))}
        </div>

        {isLoggedIn && (
          <div style={{ padding: '20px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'white',
                color: 'var(--danger-color)',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              退出登录
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
