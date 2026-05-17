import { useEffect, useState } from 'react';
import { Edit3, Settings, Video, LogOut } from 'lucide-react';
import useUserStore from '../store/userStore';
import useToastStore from '../store/toastStore';
import LoginModal from '../components/LoginModal';
import Loading from '../components/Loading';

export default function ProfilePage() {
  const { user, isLoggedIn, fetchProfile, logout } = useUserStore();
  const { show } = useToastStore();
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    show('已退出登录');
  };

  if (loading) return <Loading />;

  if (!isLoggedIn) {
    return (
      <div className="page-container" style={{ background: '#000', padding: '60px 16px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Video size={40} color="#666" />
          </div>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>登录后查看个人中心</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>发布作品、关注创作者、获得更多互动</p>
        </div>
        <button 
          onClick={() => setShowLogin(true)}
          style={{ 
            padding: '12px 48px',
            background: '#fe2c55',
            borderRadius: '24px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#fff'
          }}
        >
          立即登录
        </button>
        <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ background: '#000', padding: '0 16px 80px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        padding: '16px 0'
      }}>
        <button style={{ marginRight: '16px', color: '#fff' }}>
          <Settings size={24} />
        </button>
        <button onClick={handleLogout} style={{ color: '#999' }}>
          <LogOut size={24} />
        </button>
      </div>

      <div className="profile-header">
        <img 
          className="profile-avatar" 
          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
          alt="" 
        />
        <h2 className="profile-name">{user?.nickname || '用户'}</h2>
        <p className="profile-bio">{user?.bio || '这个人很懒，什么都没写~'}</p>
        
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-value">{user?.following_count || 0}</div>
            <div className="stat-label">关注</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{user?.followers_count || 0}</div>
            <div className="stat-label">粉丝</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{user?.works_count || 0}</div>
            <div className="stat-label">作品</div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="edit-btn">
            <Edit3 size={16} style={{ marginRight: '8px' }} />
            编辑资料
          </button>
        </div>
      </div>

      <div style={{ paddingTop: '24px', borderTop: '1px solid #222' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '600' }}>我的作品</h3>
        <div className="video-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="video-grid-item">
              <img src={`https://picsum.photos/300/500?random=${i + 100}`} alt="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
