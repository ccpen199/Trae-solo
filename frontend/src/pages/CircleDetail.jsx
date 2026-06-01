import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { circleAPI } from '../api';

const CircleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [id]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await circleAPI.getCirclePosts(id);
      setPosts(res.data);
    } catch (error) {
      console.error('加载圈子动态失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <h1>圈子详情</h1>
        <span></span>
      </div>

      <div className="container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💬</div>
            <p>圈子还没有动态，来发布第一条吧</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="card">
              <div className="user-info">
                <div className="avatar">{post.nickname?.charAt(0)}</div>
                <div>
                  <div className="name">{post.nickname}</div>
                  <div className="time">{new Date(post.created_at).toLocaleString()}</div>
                </div>
              </div>
              <p style={{ marginTop: '12px', lineHeight: '1.6' }}>{post.content}</p>
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f5f5f5' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#999' }}>
                  ❤️ {post.likes_count || 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#999' }}>
                  💬 {post.comments_count || 0}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CircleDetail;
