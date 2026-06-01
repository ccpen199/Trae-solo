import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

const menuItems = [
  { icon: '🔔', label: '每日提醒', requireAuth: false, action: 'reminder' },
  { icon: '💎', label: '会员计划', requireAuth: false, action: 'vip' },
  { icon: '❤️', label: 'Apple 健康', requireAuth: true, action: 'health' },
  { icon: '🧪', label: '潮汐实验室', requireAuth: false, action: 'lab' },
  { icon: '❓', label: '常见问题', requireAuth: false, action: 'faq' },
  { icon: '🔐', label: '账号与安全', requireAuth: true, action: 'security' }
];

function ProfilePage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuthStore();

  const handleMenuClick = (item) => {
    if (item.requireAuth && !isLoggedIn) {
      alert('请先登录后再使用此功能');
      navigate('/login');
      return;
    }
    
    switch (item.action) {
      case 'reminder':
        alert('每日提醒功能即将上线，敬请期待！');
        break;
      case 'vip':
        alert('会员计划功能即将上线，敬请期待！');
        break;
      case 'health':
        alert('Apple 健康功能即将上线，敬请期待！');
        break;
      case 'lab':
        alert('潮汐实验室功能即将上线，敬请期待！');
        break;
      case 'faq':
        alert('常见问题功能即将上线，敬请期待！');
        break;
      case 'security':
        alert('账号与安全功能即将上线，敬请期待！');
        break;
      default:
        break;
    }
  };

  return (
    <div className="page-container fade-in">
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 32 }}>我的</h1>

      <div 
        className="card" 
        style={{ 
          marginBottom: 24, 
          padding: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div 
              style={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}
            >
              👤
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                {user?.nickname || user?.username}
              </h3>
              <p style={{ fontSize: 14, opacity: 0.8 }}>{user?.email}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>欢迎来到潮汐</h3>
              <p style={{ fontSize: 14, opacity: 0.8 }}>登录解锁更多功能</p>
            </div>
            <Link 
              to="/login"
              style={{ 
                padding: '10px 20px', 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 20, 
                color: 'white',
                fontSize: 14,
                textDecoration: 'none'
              }}
            >
              登录
            </Link>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {menuItems.map((item, index) => (
          <div 
            key={item.label}
            onClick={() => handleMenuClick(item)}
            style={{ 
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: index < menuItems.length - 1 ? '1px solid var(--border-color)' : 'none',
              opacity: item.requireAuth && !isLoggedIn ? 0.5 : 1,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 16 }}>{item.label}</span>
            {item.requireAuth && !isLoggedIn && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>需登录</span>
            )}
            <span style={{ color: 'var(--text-secondary)' }}>›</span>
          </div>
        ))}
      </div>

      {isLoggedIn && (
        <button
          onClick={logout}
          style={{
            width: '100%',
            marginTop: 24,
            padding: 16,
            background: 'var(--bg-secondary)',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            color: '#EF4444',
            cursor: 'pointer'
          }}
        >
          退出登录
        </button>
      )}

      <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-secondary)', fontSize: 12 }}>
        潮汐 v1.0.0
      </div>
    </div>
  );
}

export default ProfilePage;
