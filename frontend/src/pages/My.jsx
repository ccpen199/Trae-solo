import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const menuItems = [
  { icon: '🗑️', label: '回收站', path: '/trash' },
  { icon: '👑', label: '会员中心', path: '/vip' },
  { icon: '⚙️', label: '设置', action: 'settings' },
  { icon: '❓', label: '帮助与反馈', action: 'help' },
  { icon: '📄', label: '关于我们', action: 'about' }
];

export default function My() {
  const navigate = useNavigate();
  const { user, logout, showToast } = useApp();

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIdx = 0;
    while (size >= 1024 && unitIdx < units.length - 1) {
      size /= 1024;
      unitIdx++;
    }
    return `${size.toFixed(1)} ${units[unitIdx]}`;
  };

  const usedSpace = user?.used_space || 0;
  const maxSpace = user?.vip_type > 0 ? 10 * 1024 * 1024 * 1024 : 500 * 1024 * 1024;
  const usagePercent = Math.min((usedSpace / maxSpace) * 100, 100);

  const handleMenuClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      showToast('功能开发中...', 'info');
    }
  };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {user.avatar || '👤'}
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                  {user.nickname || '云笔记用户'}
                </h2>
                {user.vip_type > 0 ? (
                  <span style={{ fontSize: '12px', background: '#faad14', padding: '2px 8px', borderRadius: '10px' }}>
                    👑 VIP会员
                  </span>
                ) : (
                  <button
                    onClick={() => navigate('/vip')}
                    style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer' }}
                  >
                    开通会员 →
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>云存储空间</span>
                <span>{formatSize(usedSpace)} / {formatSize(maxSpace)}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${usagePercent}%`,
                  height: '100%',
                  background: usagePercent > 80 ? '#ff4d4f' : '#52c41a',
                  borderRadius: '3px',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
            <p style={{ marginBottom: '16px' }}>登录后同步您的笔记到云端</p>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '10px 32px', background: 'white', color: '#667eea', borderRadius: '20px', fontWeight: '500', border: 'none', cursor: 'pointer' }}
            >
              立即登录
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => handleMenuClick(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: idx < menuItems.length - 1 ? '1px solid #f0f0f0' : 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '20px', marginRight: '12px' }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: '15px' }}>{item.label}</span>
            <span style={{ color: '#ccc' }}>›</span>
          </div>
        ))}

        {user && (
          <button
            onClick={() => { logout(); showToast('已退出登录', 'success'); }}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '12px',
              background: '#fff1f0',
              color: '#ff4d4f',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        )}
      </div>
    </div>
  );
}
