import { useNavigate } from 'react-router-dom';
import { User, Settings, Heart, MessageCircle, HelpCircle, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('已退出登录');
    } catch (err) {
      showError('退出失败');
    }
  };

  const menuItems = [
    { icon: Heart, label: '我的收藏', onClick: () => navigate('/favorites') },
    { icon: MessageCircle, label: '我的评论', onClick: () => isAuthenticated ? null : navigate('/login') },
    { icon: Settings, label: '设置', onClick: () => {} },
    { icon: HelpCircle, label: '帮助与反馈', onClick: () => {} }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7' }}>
      <div style={{
        padding: 24,
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>我的</h1>
        
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <span style={{ fontSize: 28, fontWeight: 600, color: 'white' }}>
                {(user?.nickname || user?.username || 'U')[0]}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                {user?.nickname || user?.username}
              </p>
              <p style={{ fontSize: 14, color: '#999' }}>@{user?.username}</p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => navigate('/login')}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <User size={32} color="#999" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                点击登录
              </p>
              <p style={{ fontSize: 14, color: '#999' }}>登录后体验完整功能</p>
            </div>
            <ChevronRight size={24} color="#999" />
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: 16,
          overflow: 'hidden'
        }}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 16,
                borderBottom: index < menuItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                cursor: 'pointer'
              }}
            >
              <item.icon size={20} color="#666" style={{ marginRight: 12 }} />
              <span style={{ flex: 1, fontSize: 15, color: '#333' }}>{item.label}</span>
              <ChevronRight size={18} color="#999" />
            </div>
          ))}
        </div>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              marginTop: 20,
              padding: 16,
              backgroundColor: 'white',
              border: 'none',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} color="#FF3B30" />
            <span style={{ fontSize: 15, color: '#FF3B30', fontWeight: 500 }}>退出登录</span>
          </button>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        padding: 20,
        marginTop: 20
      }}>
        <p style={{ fontSize: 12, color: '#999' }}>翻译君 v1.0.0</p>
      </div>
    </div>
  );
};

export default ProfilePage;
