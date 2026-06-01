import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { communityAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [postStats, setPostStats] = useState({ question: 0, discussion: 0, referral: 0 });
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    is_anonymous: false,
    type: 'question',
  });

  useEffect(() => {
    loadCommunity();
    loadPosts();
  }, [id, activeTab]);

  const loadCommunity = async () => {
    try {
      const res = await communityAPI.getCommunity(id);
      setCommunity(res.data.community);
    } catch (err) {
      console.error('Failed to load community:', err);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab) params.type = activeTab;
      const res = await communityAPI.getPosts(id, params);
      setPosts(res.data.posts || []);

      // Load stats for each type
      const [qRes, dRes, rRes] = await Promise.all([
        communityAPI.getPosts(id, { type: 'question', limit: 1 }),
        communityAPI.getPosts(id, { type: 'discussion', limit: 1 }),
        communityAPI.getPosts(id, { type: 'referral', limit: 1 }),
      ]);
      setPostStats({
        question: qRes.data.total || qRes.data.posts?.length || 0,
        discussion: dRes.data.total || dRes.data.posts?.length || 0,
        referral: rRes.data.total || rRes.data.posts?.length || 0,
      });
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/communities/${id}` } });
      return;
    }
    try {
      await communityAPI.joinCommunity(id);
      loadCommunity();
    } catch (err) {
      alert(err.response?.data?.error || '加入失败');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim()) {
      alert('请输入标题');
      return;
    }

    try {
      await communityAPI.createPost(id, newPost);
      setShowCreateModal(false);
      setNewPost({ title: '', content: '', is_anonymous: false, type: 'question' });
      loadPosts();
    } catch (err) {
      alert(err.response?.data?.error || '发布失败，请先加入社群');
    }
  };

  const typeLabels = {
    question: '❓ 问答墙',
    discussion: '💬 讨论区',
    referral: '🤝 内推通道',
  };

  const typeColors = {
    industry: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    company: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    alumni: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  };

  const typeIcons = {
    industry: '🏢',
    company: '🏠',
    alumni: '🎓',
  };

  if (!community && !loading) {
    return <div className="empty-state">社群不存在</div>;
  }

  return (
    <div>
      {community && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              background: typeColors[community.type] || typeColors.industry,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              color: 'white',
              flexShrink: 0,
            }}>
              {typeIcons[community.type] || '🏘️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{community.name}</h1>
                <span className="tag tag-sm">
                  {community.type === 'industry' ? '行业圈' : community.type === 'company' ? '公司圈' : '校友圈'}
                </span>
                {community.is_member && (
                  <span className="tag tag-sm tag-success">✓ 已加入</span>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                {community.description}
              </p>
              <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)' }}>
                <span>👥 {community.member_count?.toLocaleString() || 0} 成员</span>
                {community.city && <span>📍 {community.city}</span>}
                <span>📝 {postStats.question + postStats.discussion + postStats.referral} 条帖子</span>
              </div>
            </div>
            <div>
              {community.is_member ? (
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  + 发布帖子
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleJoin}>
                  👋 加入社群
                </button>
              )}
            </div>
          </div>

          {community.is_member && (
            <>
              <div className="divider" style={{ margin: '20px 0' }} />
              <div className="grid-3" style={{ gap: 12 }}>
                <div
                  className="card card-hover"
                  style={{ padding: 16, cursor: 'pointer', background: activeTab === 'question' ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}
                  onClick={() => setActiveTab(activeTab === 'question' ? '' : 'question')}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>❓</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>匿名问答墙</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {postStats.question} 个问题，匿名提问更自由
                  </div>
                </div>
                <div
                  className="card card-hover"
                  style={{ padding: 16, cursor: 'pointer', background: activeTab === 'discussion' ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
                  onClick={() => setActiveTab(activeTab === 'discussion' ? '' : 'discussion')}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>讨论区</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {postStats.discussion} 条讨论，交流职业话题
                  </div>
                </div>
                <div
                  className="card card-hover"
                  style={{ padding: 16, cursor: 'pointer', background: activeTab === 'referral' ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}
                  onClick={() => setActiveTab(activeTab === 'referral' ? '' : 'referral')}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🤝</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>内推通道</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {postStats.referral} 条内推，直达内部机会
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="page-header" style={{ marginTop: 24 }}>
        <div>
          <Link to="/communities" className="text-sm text-secondary" style={{ marginBottom: 8, display: 'block' }}>
            ← 返回社群列表
          </Link>
          <h1 className="page-title" style={{ fontSize: 20 }}>📝 社群动态</h1>
        </div>
        {community?.is_member && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + 发布帖子
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-color)',
      }}>
        <button
          onClick={() => setActiveTab('')}
          style={{
            padding: '12px 20px',
            fontWeight: activeTab === '' ? 600 : 400,
            color: activeTab === '' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === '' ? '2px solid var(--primary-color)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          全部
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '12px 20px',
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === key ? '2px solid var(--primary-color)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>暂无帖子，来发布第一个吧！</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map(post => (
            <Link key={post.id} to={`/communities/posts/${post.id}`} className="card card-hover" style={{ padding: 20, display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className={`badge ${post.type === 'referral' ? 'badge-success' : post.type === 'question' ? 'badge-warning' : 'badge-info'}`}>
                      {typeLabels[post.type]}
                    </span>
                    {post.is_anonymous && <span className="badge">匿名</span>}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{post.title}</h3>
                  <p style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {post.content}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="avatar avatar-sm">
                    {post.is_anonymous ? '匿' : post.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{post.is_anonymous ? '匿名用户' : post.display_name}</span>
                </div>
                <span>👁️ {post.view_count}</span>
                <span>💬 {post.reply_count}</span>
                <span>{post.created_at?.replace('T', ' ').substring(0, 16)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCreateModal(false)}>
          <div className="card" style={{ width: 600, padding: 32, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>发布帖子</h2>

            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label className="form-label">帖子类型</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <label key={key} style={{
                      flex: 1,
                      padding: 12,
                      border: '2px solid',
                      borderColor: newPost.type === key ? 'var(--primary-color)' : 'var(--border-color)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: newPost.type === key ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    }}>
                      <input
                        type="radio"
                        name="type"
                        value={key}
                        checked={newPost.type === key}
                        onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                        style={{ marginRight: 6 }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">标题 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="请输入标题"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="form-textarea"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="分享你的想法..."
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newPost.is_anonymous}
                    onChange={(e) => setNewPost({ ...newPost, is_anonymous: e.target.checked })}
                  />
                  <span className="text-sm">匿名发布</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">发布</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityDetail;
