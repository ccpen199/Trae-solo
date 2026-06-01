import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../api';
import { useAuthStore } from '../store';

const Home = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await postAPI.getPosts();
      setPosts(res.data.list);
    } catch (error) {
      console.error('加载动态失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      await postAPI.likePost(postId);
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !isLiked,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('点赞失败', error);
    }
  };

  const openCommentModal = (postId) => {
    setCurrentPostId(postId);
    setCommentText('');
    setShowCommentModal(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await postAPI.commentPost(currentPostId, { content: commentText });
      setPosts(posts.map(post => {
        if (post.id === currentPostId) {
          return {
            ...post,
            comments_count: (post.comments_count || 0) + 1
          };
        }
        return post;
      }));
      setShowCommentModal(false);
      setCommentText('');
    } catch (error) {
      console.error('评论失败', error);
    }
  };

  return (
    <div>
      <div className="header">
        <h1>箱伴</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ cursor: 'pointer', fontSize: '20px' }} onClick={() => navigate('/create-post')}>✏️</span>
        </div>
      </div>

      <div className="container">
        <div className="tabs">
          <div className={`tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>动态</div>
          <div className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>点单</div>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            {activeTab === 'posts' && (
              <>
                {posts.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">📝</div>
                    <p>还没有动态，快去发布第一条吧</p>
                    <button className="btn btn-primary" onClick={() => navigate('/create-post')}>发布动态</button>
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
                      {post.images && post.images.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
                          {post.images.map((img, idx) => (
                            <div key={idx} style={{ aspectRatio: '1', background: '#f5f5f5', borderRadius: '8px' }}></div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f5f5f5' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: post.is_liked ? '#ff4757' : '#999' }} onClick={() => handleLike(post.id, post.is_liked)}>
                          ❤️ {post.likes_count || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#999' }} onClick={() => openCommentModal(post.id)}>
                          💬 {post.comments_count || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'orders' && (
              <div className="empty-state">
                <div className="icon">🎮</div>
                <p>点单功能开发中...</p>
              </div>
            )}
          </>
        )}
      </div>

      {showCommentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowCommentModal(false)}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>发表评论</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的评论..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                minHeight: '100px',
                fontSize: '14px',
                marginBottom: '16px',
                resize: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                style={{ 
                  padding: '10px 20px', 
                  background: '#f5f5f5', 
                  border: 'none', 
                  borderRadius: '20px', 
                  cursor: 'pointer' 
                }}
                onClick={() => setShowCommentModal(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: '10px 20px' }}
                onClick={handleSubmitComment}
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
