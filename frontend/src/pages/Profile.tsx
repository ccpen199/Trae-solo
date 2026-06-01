import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const menuItems = [
    { icon: '💰', title: '我的钱包', path: '/wallet' },
    { icon: '📊', title: '数据护照', path: '/passport' },
    { icon: '⭐', title: '星球基地', path: '/base' },
    { icon: '⚙️', title: '设置', path: '/settings' }
  ];

  const handleMenuClick = (path: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="header">
        <h1>👤 我的</h1>
        <p>个人中心</p>
      </div>

      <div className="card">
        {isAuthenticated && user ? (
          <div className="profile-header">
            <div className="avatar">{user.nickname?.charAt(0) || '?'}</div>
            <div className="profile-info">
              <h2>{user.nickname}</h2>
              <p>邀请码: {user.inviteCode || '--'}</p>
            </div>
          </div>
        ) : (
          <div className="profile-header" onClick={() => navigate('/login')}>
            <div className="avatar">?</div>
            <div className="profile-info">
              <h2>未登录</h2>
              <p>点击登录</p>
            </div>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="stats-row" style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <div className="stat">
              <div className="stat-value">{user.force || 0}</div>
              <div className="stat-label">原力值</div>
            </div>
            <div className="stat">
              <div className="stat-value">{user.blackDiamond?.toFixed(2) || '0.00'}</div>
              <div className="stat-label">黑钻</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className="menu-item"
            onClick={() => handleMenuClick(item.path)}
          >
            <div className="menu-left">
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-title">{item.title}</span>
            </div>
            <span>›</span>
          </div>
        ))}
      </div>

      {isAuthenticated && (
        <div className="card">
          <button 
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
