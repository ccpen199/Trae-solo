import { useNavigate } from 'react-router-dom';
import TabBar from '../components/TabBar';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: '📦', label: '我的订单', path: '/orders' },
    { icon: '🎁', label: '积分中心', path: null },
    { icon: '👑', label: '会员俱乐部', path: null },
    { icon: '❤️', label: '我的收藏', path: null },
    { icon: '📍', label: '收货地址', path: null },
    { icon: '💬', label: '在线客服', path: null },
    { icon: '⚙️', label: '设置', path: null }
  ];

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: '70px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
        padding: '40px 20px 30px',
        color: '#fff'
      }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px'
            }}>
              👤
            </div>
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '5px' }}>{user.username || user.phone || '用户'}</h2>
              <p style={{ fontSize: '14px', opacity: 0.8 }}>
                {user.is_vip ? 'VIP会员' : '普通会员'} · {user.points || 0}积分
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => navigate('/login')}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px'
            }}>
              👤
            </div>
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '5px' }}>点击登录</h2>
              <p style={{ fontSize: '14px', opacity: 0.8 }}>登录享受更多权益</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ margin: '-20px 15px 0', background: '#fff', borderRadius: '8px', padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[
            { label: '待付款', icon: '💳' },
            { label: '待发货', icon: '🚚' },
            { label: '待收货', icon: '📦' },
            { label: '待评价', icon: '⭐' }
          ].map(item => (
            <div key={item.label} style={{ cursor: 'pointer' }} onClick={() => user && navigate('/orders')}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <p style={{ fontSize: '12px', marginTop: '5px', color: '#333' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', marginTop: '10px' }}>
        {menuItems.map(item => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              borderBottom: '1px solid #f5f5f5',
              cursor: item.path ? 'pointer' : 'default'
            }}
            onClick={() => item.path && navigate(item.path)}
          >
            <span style={{ fontSize: '20px', marginRight: '10px' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ color: '#999' }}>→</span>
          </div>
        ))}
      </div>

      {user && (
        <div style={{ padding: '20px 15px' }}>
          <button
            style={{
              width: '100%',
              padding: '12px',
              background: '#fff',
              color: '#ff6b35',
              border: '1px solid #ff6b35',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            onClick={logout}
          >
            退出登录
          </button>
        </div>
      )}

      <TabBar />
    </div>
  );
}

export default ProfilePage;
