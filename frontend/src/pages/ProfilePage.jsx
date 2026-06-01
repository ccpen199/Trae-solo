import React from 'react';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, isLoggedIn, logout, setShowLoginModal } = useAuth();

  const menuItems = [
    { icon: '⚙️', label: '设置' },
    { icon: '🌙', label: '夜间模式' },
    { icon: '📱', label: '关于我们' },
    { icon: '💬', label: '意见反馈' },
    { icon: '❓', label: '帮助中心' }
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {isLoggedIn ? (user?.username?.charAt(0) || 'U') : '👤'}
        </div>
        <div className="profile-name">
          {isLoggedIn ? (user?.username || '用户') : '未登录'}
        </div>
        {isLoggedIn && user?.phone && (
          <div className="profile-phone">{user.phone}</div>
        )}
      </div>

      {!isLoggedIn && (
        <div className="vip-banner" style={{ cursor: 'pointer' }} onClick={() => setShowLoginModal(true)}>
          <div className="vip-title">立即登录</div>
          <div className="vip-desc">登录后使用完整功能，畅享网盘、学习等特权</div>
        </div>
      )}

      {isLoggedIn && (
        <div className="vip-banner" style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} onClick={logout}>
          <div className="vip-title">退出登录</div>
          <div className="vip-desc">安全退出当前账号</div>
        </div>
      )}

      <div className="menu-list" style={{ marginTop: 20 }}>
        {menuItems.map((item, index) => (
          <div key={index} className="menu-item">
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-text">{item.label}</span>
            <span className="menu-arrow">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfilePage;
