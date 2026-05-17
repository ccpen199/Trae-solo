import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { userApi, authApi } from '../api';
import useStore from '../store';
import Loading from '../components/Loading';

const Profile = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user, setUser, logout } = useStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profileRes, visitsRes] = await Promise.all([
        userApi.getProfile(),
        userApi.getRecentVisits()
      ]);
      setProfile(profileRes.data);
      setRecentVisits(visitsRes.data?.visits || []);
    } catch (error) {
      showError(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      showSuccess('已退出登录');
      navigate('/login');
    } catch (error) {
      logout();
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 style={styles.title}>个人中心</h1>
        <div style={{ width: '32px' }} />
      </div>

      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          {profile?.user?.nickname?.charAt(0) || user?.nickname?.charAt(0) || '👤'}
        </div>
        <h2 style={styles.nickname}>{profile?.user?.nickname || user?.nickname || '用户'}</h2>
        <p style={styles.bio}>{profile?.user?.bio || '这个人很懒，什么都没写~'}</p>
      </div>

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{profile?.friend_count || 0}</span>
          <span style={styles.statLabel}>好友</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{profile?.like_count || 0}</span>
          <span style={styles.statLabel}>被比心</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{profile?.subscriptions?.length || 0}</span>
          <span style={styles.statLabel}>订阅</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>兴趣标签</h3>
        <div style={styles.tags}>
          {(profile?.tags || []).length === 0 ? (
            <span style={styles.emptyText}>暂无标签</span>
          ) : (
            profile?.tags?.map((tag, index) => (
              <span key={index} style={styles.tag}>{tag}</span>
            ))
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>最近访问</h3>
        {recentVisits.length === 0 ? (
          <p style={styles.emptyText}>暂无访问记录</p>
        ) : (
          <div style={styles.visitList}>
            {recentVisits.slice(0, 5).map((visit, index) => (
              <div key={index} style={styles.visitItem}>
                <div style={styles.visitAvatar}>
                  {visit.nickname?.charAt(0) || '👤'}
                  {visit.is_online && <span style={styles.onlineDot} />}
                </div>
                <span style={styles.visitName}>{visit.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button style={styles.logoutBtn} onClick={handleLogout}>
        退出登录
      </button>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px'
  },
  backBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer'
  },
  title: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '600'
  },
  profileCard: {
    background: 'white',
    margin: '0 20px 20px',
    borderRadius: '20px',
    padding: '30px 20px',
    textAlign: 'center'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 auto 16px'
  },
  nickname: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  bio: {
    fontSize: '14px',
    color: '#999'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    background: 'white',
    margin: '0 20px 20px',
    borderRadius: '16px',
    padding: '20px'
  },
  statItem: {
    textAlign: 'center'
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#667eea',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#999'
  },
  section: {
    background: 'white',
    margin: '0 20px 20px',
    borderRadius: '16px',
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#667eea'
  },
  emptyText: {
    fontSize: '14px',
    color: '#999',
    textAlign: 'center',
    padding: '10px'
  },
  visitList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px'
  },
  visitItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '60px'
  },
  visitAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    position: 'relative',
    marginBottom: '4px'
  },
  onlineDot: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '10px',
    height: '10px',
    background: '#4caf50',
    borderRadius: '50%',
    border: '2px solid white'
  },
  visitName: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center'
  },
  logoutBtn: {
    margin: '20px',
    padding: '16px',
    background: 'rgba(255,255,255,0.95)',
    color: '#ff4444',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default Profile;
