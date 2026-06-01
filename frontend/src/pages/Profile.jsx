import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { userAPI, authAPI } from '../api';

const Profile = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await userAPI.getUser(user.id);
      setProfile(res.data);
      const postsRes = await userAPI.getUserPosts(user.id);
      setPosts(postsRes.data);
    } catch (error) {
      console.error('加载用户信息失败', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="header">
        <h1>我的</h1>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/profile/edit')}>⚙️</span>
      </div>

      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              {profile?.nickname?.charAt(0) || user?.nickname?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: '600' }}>{profile?.nickname || user?.nickname}</h3>
              <p style={{ color: '#999', fontSize: '14px', marginTop: '4px' }}>
                {profile?.bio || '这个人很懒，什么都没写'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f5f5f5' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{profile?.following_count || 0}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>关注</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{profile?.follower_count || 0}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>粉丝</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{profile?.post_count || 0}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>动态</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h4 style={{ marginBottom: '12px', fontWeight: '600' }}>我的动态</h4>
          {posts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="icon" style={{ fontSize: '36px' }}>📝</div>
              <p>还没有发布动态</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="card">
                <p style={{ lineHeight: '1.6' }}>{post.content}</p>
                <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '12px', color: '#999' }}>
                  <span>❤️ {post.likes_count || 0}</span>
                  <span>💬 {post.comments_count || 0}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          className="btn btn-outline" 
          style={{ width: '100%', marginTop: '24px', borderColor: '#ff4757', color: '#ff4757' }}
          onClick={handleLogout}
        >
          退出登录
        </button>
      </div>
    </div>
  );
};

export default Profile;
