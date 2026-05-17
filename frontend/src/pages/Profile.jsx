import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

function Profile() {
  const { user, logout, isVip } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('已退出登录');
  };

  const menuItems = [
    { icon: '📅', label: '学习打卡', action: () => showToast('功能开发中') },
    { icon: '🛒', label: '海词贝商城', action: () => showToast('功能开发中') },
    { icon: '⚙️', label: '词典偏好', action: () => showToast('功能开发中') },
    { icon: '🔊', label: '英美发音', action: () => showToast('功能开发中') },
    { icon: '🚀', label: '语速设置', action: () => showToast('功能开发中') },
    { icon: '🌙', label: '夜间模式', action: () => showToast('功能开发中') },
  ];

  if (!user) {
    return (
      <div className="empty-container">
        <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
        <p>登录后体验更多功能</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
          立即登录
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28
            }}
          >
            {user.avatar || '👤'}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>{user.username}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isVip() ? (
                <span style={{ fontSize: 12, color: '#faad14', fontWeight: 600 }}>👑 VIP会员</span>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => showToast('VIP购买开发中')}
                >
                  开通VIP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="card"
            style={{ cursor: 'pointer', margin: 0, borderRadius: 0 }}
            onClick={item.action}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <span style={{ color: 'var(--text-light)' }}>→</span>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-outline"
        style={{ width: '100%', marginTop: 24, color: 'var(--error-color)', borderColor: 'var(--error-color)' }}
        onClick={handleLogout}
      >
        退出登录
      </button>
    </div>
  );
}

export default Profile;
