import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, orderApi } from '../api';
import { useAuthStore, useOrderStore } from '../store';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { clearOrder } = useOrderStore();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authApi.getProfile();
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('加载用户信息失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (!confirm('确定要退出登录吗？')) return;
    logout();
    clearOrder();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { icon: '📋', label: '我的订单', action: () => navigate('/orders') },
    { icon: '💬', label: '我的消息', action: () => navigate('/messages') },
    { icon: '🎁', label: '优惠券', action: () => navigate('/announcement') },
    { icon: '💰', label: '我的钱包', action: () => alert('钱包功能开发中') },
    { icon: '📍', label: '常用地址', action: () => alert('常用地址功能开发中') },
    { icon: '🛡️', label: '安全中心', action: () => alert('安全中心功能开发中') },
    { icon: '⚙️', label: '设置', action: () => alert('设置功能开发中') },
    { icon: '❓', label: '帮助与反馈', action: () => alert('帮助与反馈功能开发中') },
    { icon: '📜', label: '关于我们', action: () => alert('滴滴快车 v1.0.0') },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: 'linear-gradient(180deg, #ff6a00 0%, #ff8a33 100%)', 
        padding: '16px', 
        paddingTop: '50px',
        minHeight: '220px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            onClick={() => navigate(-1)}
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>个人中心</div>
          <div style={{ width: '20px' }}></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '30px' }}>
          <div style={{ 
            width: '72px', 
            height: '72px', 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
          }}>
            👤
          </div>
          <div style={{ marginLeft: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{profile?.nickname || user?.nickname || '用户'}</div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
              {profile?.phone || user?.phone || ''}
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white',
        margin: '-40px 16px 16px',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6a00' }}>
              ¥{profile?.assets?.balance?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>余额</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6a00' }}>
              {profile?.assets?.coupon_count || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>优惠券</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6a00' }}>
              {profile?.assets?.points || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>积分</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', margin: '0 16px 16px', borderRadius: '12px' }}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={item.action}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '16px',
              borderBottom: index < menuItems.length - 1 ? '1px solid #f0f0f0' : 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '20px', marginRight: '12px' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ color: '#ccc' }}>›</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <button
          onClick={handleLogout}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: 'white', 
            color: '#f5222d', 
            border: '1px solid #f5222d', 
            borderRadius: '24px', 
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;