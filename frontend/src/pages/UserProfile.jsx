import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../api';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getUser(id);
      setUser(res.data);
      const postsRes = await userAPI.getUserPosts(id);
      setPosts(postsRes.data);
    } catch (error) {
      console.error('加载用户信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await userAPI.followUser(id);
      loadUser();
    } catch (error) {
      console.error('关注失败', error);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="header">
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <h1>用户资料</h1>
        <span></span>
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
              {user?.nickname?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: '600' }}>{user?.nickname}</h3>
              <p style={{ color: '#999', fontSize: '14px', marginTop: '4px' }}>
                {user?.bio || '这个人很懒，什么都没写'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f5f5f5' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{user?.following_count || 0}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>关注</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{user?.follower_count || 0}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>粉丝</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{user?.post_count || 0}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>动态</div>
            </div>
          </div>

          <button 
            className={user?.is_following ? 'btn btn-outline' : 'btn btn-primary'}
            style={{ width: '100%', marginTop: '20px' }}
            onClick={handleFollow}
          >
            {user?.is_following ? '取消关注' : '关注'}
          </button>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h4 style={{ marginBottom: '12px', fontWeight: '600' }}>TA的动态</h4>
          {posts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="icon" style={{ fontSize: '36px' }}>📝</div>
              <p>暂无动态</p>
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
      </div>
    </div>
  );
};

export default UserProfile;
