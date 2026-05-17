import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../api';
import { useStore } from '../store';
import { useToast } from '../App';

export default function Posts() {
  const navigate = useNavigate();
  const { user } = useStore();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', images: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadPosts = async (reset = false) => {
    const isRefresh = reset && posts.length > 0;
    if (isRefresh) setRefreshing(true);
    
    try {
      const currentPage = reset ? 1 : page;
      const res = await postAPI.getPosts({ page: currentPage, limit: 15 });
      if (res.data.success) {
        if (reset || posts.length === 0) {
          setPosts(res.data.data);
          if (currentPage === 1) setPage(2);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = res.data.data.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
          setPage(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreate = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/posts', needLogin: true } });
      return;
    }
    if (!newPost.content.trim()) {
      showToast('请输入内容', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await postAPI.createPost(newPost);
      if (res.data.success) {
        showToast('发布成功', 'success');
        setShowCreate(false);
        setNewPost({ content: '', images: '' });
        loadPosts(true);
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast('发布失败', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPosts(true);
  };

  const handleLike = (postId) => {
    if (!user) {
      navigate('/login', { state: { from: '/posts', needLogin: true } });
      return;
    }
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
    ));
    showToast('点赞成功', 'success');
  };

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [commentContent, setCommentContent] = useState('');

  const handleComment = (postId) => {
    if (!user) {
      navigate('/login', { state: { from: '/posts', needLogin: true } });
      return;
    }
    setCurrentPostId(postId);
    setCommentContent('');
    setShowCommentModal(true);
  };

  const submitComment = () => {
    if (!commentContent.trim()) {
      showToast('请输入评论内容', 'error');
      return;
    }
    setPosts(prev => prev.map(p => 
      p.id === currentPostId ? { ...p, comments: (p.comments || 0) + 1 } : p
    ));
    setShowCommentModal(false);
    setCommentContent('');
    showToast('评论成功', 'success');
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>动态</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 14 }}
        >
          发布动态
        </button>
      </div>

      <button
        onClick={handleRefresh}
        style={{
          width: '100%',
          padding: 12,
          marginBottom: 16,
          background: 'var(--gray-50)',
          border: 'none',
          borderRadius: 8,
          color: 'var(--gray-600)',
          cursor: 'pointer'
        }}
      >
        {refreshing ? '刷新中...' : '↓ 下拉刷新'}
      </button>

      {loading && posts.length === 0 ? (
        <div className="loading"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>
          暂无动态
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map((post) => (
            <div key={post.id} className="card">
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <img
                    src={post.avatar}
                    alt={post.nickname}
                    className="avatar"
                    style={{ width: 40, height: 40 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{post.nickname}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <p style={{ marginBottom: 12, lineHeight: 1.6 }}>{post.content}</p>
                {post.images && (
                  <img
                    src={post.images}
                    alt="动态图片"
                    style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                  />
                )}
                <div style={{ display: 'flex', gap: 24, color: 'var(--gray-500)', fontSize: 14 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(post.id);
                    }}
                    style={{
                      background: 'var(--gray-100)',
                      border: 'none',
                      borderRadius: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 14,
                      padding: '6px 12px',
                      color: 'var(--gray-600)',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--gray-200)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--gray-100)';
                    }}
                  >
                    ❤️ {post.likes || 0}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComment(post.id);
                    }}
                    style={{
                      background: 'var(--gray-100)',
                      border: 'none',
                      borderRadius: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 14,
                      padding: '6px 12px',
                      color: 'var(--gray-600)',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--gray-200)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--gray-100)';
                    }}
                  >
                    💬 {post.comments || 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => loadPosts(false)}
        style={{
          width: '100%',
          padding: 12,
          marginTop: 16,
          background: 'var(--gray-50)',
          border: 'none',
          borderRadius: 8,
          color: 'var(--gray-600)',
          cursor: 'pointer'
        }}
      >
        加载更多
      </button>

      {showCreate && (
        <>
          <div
            onClick={() => setShowCreate(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 300
            }}
          />
          <div className="card" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 400,
            padding: 20,
            zIndex: 301
          }}>
            <h3 style={{ marginBottom: 16 }}>发布动态</h3>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="分享你的想法..."
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                border: '1px solid var(--gray-200)',
                borderRadius: 8,
                resize: 'vertical',
                marginBottom: 12,
                fontFamily: 'inherit'
              }}
            />
            <input
              value={newPost.images}
              onChange={(e) => setNewPost({ ...newPost, images: e.target.value })}
              placeholder="图片链接（可选）"
              className="input"
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowCreate(false)}
                className="btn"
                style={{ flex: 1, background: 'var(--gray-100)' }}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitLoading}
              >
                {submitLoading ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </>
      )}

      {showCommentModal && (
        <>
          <div
            onClick={() => setShowCommentModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 300
            }}
          />
          <div className="card" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 400,
            padding: 20,
            zIndex: 301
          }}>
            <h3 style={{ marginBottom: 16 }}>发表评论</h3>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="说点什么..."
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                border: '1px solid var(--gray-200)',
                borderRadius: 8,
                resize: 'none',
                marginBottom: 16,
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowCommentModal(false)}
                className="btn"
                style={{ flex: 1, background: 'var(--gray-100)' }}
              >
                取消
              </button>
              <button
                onClick={submitComment}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                发表
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
