import { useState, useEffect } from 'react';
import api from '../utils/api';

const Community = () => {
  const [activeType, setActiveType] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  
  const [newPost, setNewPost] = useState({
    author_id: 5,
    type: 'repair_case',
    title: '',
    content: '',
    tags: '',
  });

  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const types = [
    { key: 'all', label: '全部', icon: '📚' },
    { key: 'repair_case', label: '维修案例', icon: '🔧' },
    { key: 'fault_code', label: '故障代码', icon: '⚠️' },
    { key: 'authenticity_guide', label: '真伪鉴别', icon: '🔍' },
    { key: 'general', label: '其他讨论', icon: '💬' },
  ];

  const typeLabels = {
    repair_case: '维修案例',
    fault_code: '故障代码',
    authenticity_guide: '真伪鉴别',
    general: '其他讨论',
  };

  useEffect(() => {
    loadPosts();
  }, [activeType]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      let url = '/community/posts';
      if (activeType !== 'all') {
        url += `?type=${activeType}`;
      }
      const data = await api.get(url);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPosts([]);
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('请填写标题和内容');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const tagsArray = newPost.tags.split(',').map(t => t.trim()).filter(t => t);
      await api.post('/community/posts', {
        ...newPost,
        tags: tagsArray.length > 0 ? tagsArray : [],
      });
      setSuccessMsg('发帖成功！');
      setShowPostForm(false);
      setNewPost({
        author_id: 5,
        type: 'repair_case',
        title: '',
        content: '',
        tags: '',
      });
      loadPosts();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('发帖失败，请重试');
    }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/community/posts/${postId}/like`);
      loadPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const viewPostDetail = async (post) => {
    setSelectedPost(post);
    setShowDetail(true);
  };

  const getTypeBadge = (type) => {
    const styles = {
      repair_case: { bg: '#dbeafe', color: '#1d4ed8', icon: '🔧' },
      fault_code: { bg: '#fee2e2', color: '#dc2626', icon: '⚠️' },
      authenticity_guide: { bg: '#fef3c7', color: '#d97706', icon: '🔍' },
      general: { bg: '#e5e7eb', color: '#4b5563', icon: '💬' },
    };
    const s = styles[type] || styles.general;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: s.bg, color: s.color, borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
        {s.icon} {typeLabels[type] || type}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#5a5c69' }}>
            👥 兄弟圈
          </h1>
          <p style={{ margin: 0, color: '#858796', fontSize: '14px' }}>
            维修案例沉淀 · 故障代码库 · 配件真伪鉴别指南
          </p>
        </div>
        <button
          onClick={() => setShowPostForm(true)}
          style={{
            padding: '12px 28px',
            backgroundColor: '#4e73df',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          ✏️ 发布新帖
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 20px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 20px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px' }}>
          ✅ {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {types.map((type) => (
          <button
            key={type.key}
            onClick={() => setActiveType(type.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeType === type.key ? '#4e73df' : 'white',
              color: activeType === type.key ? 'white' : '#5a5c69',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '10px',
              boxShadow: activeType === type.key ? '0 2px 8px rgba(78,115,223,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      {showPostForm && (
        <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#5a5c69' }}>✏️ 发布新帖子</h2>
            <button onClick={() => setShowPostForm(false)} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>帖子类型</label>
                <select
                  value={newPost.type}
                  onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="repair_case">🔧 维修案例</option>
                  <option value="fault_code">⚠️ 故障代码</option>
                  <option value="authenticity_guide">🔍 真伪鉴别</option>
                  <option value="general">💬 其他讨论</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>标签（逗号分隔）</label>
                <input
                  type="text"
                  placeholder="如：发动机, WP10, 异响"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>标题</label>
              <input
                type="text"
                placeholder="请输入帖子标题..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>内容</label>
              <textarea
                placeholder="请详细描述内容..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={8}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={handleCreatePost}
              disabled={loading}
              style={{
                padding: '12px 36px',
                backgroundColor: '#4e73df',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '发布中...' : '发布帖子'}
            </button>
            <button
              onClick={() => setShowPostForm(false)}
              style={{
                padding: '12px 36px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#858796' }}>⏳ 加载中...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {posts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: 0, color: '#858796', fontSize: '16px' }}>暂无帖子，快来发布第一篇吧！</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                onClick={() => viewPostDetail(post)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  {getTypeBadge(post.type)}
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('zh-CN') : '-'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937', lineHeight: '1.4' }}>
                  {post.title}
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.content}
                </p>
                {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {post.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} style={{ padding: '3px 10px', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '12px', fontSize: '12px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>👤 作者：{post.author_name || '匿名'}</span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                    <span>👁️ {post.view_count || 0}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                      style={{ cursor: 'pointer' }}
                    >
                      ❤️ {post.like_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showDetail && selectedPost && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>{selectedPost.title}</h2>
              <button onClick={() => { setShowDetail(false); setSelectedPost(null); }} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getTypeBadge(selectedPost.type)}
                <span style={{ fontSize: '13px', color: '#6b7280' }}>👤 {selectedPost.author_name || '匿名'}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleString('zh-CN') : '-'}
              </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: 0, color: '#374151', fontSize: '15px', lineHeight: '2', whiteSpace: 'pre-wrap' }}>
                {selectedPost.content}
              </p>
            </div>

            {selectedPost.tags && Array.isArray(selectedPost.tags) && selectedPost.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {selectedPost.tags.map((tag, i) => (
                  <span key={i} style={{ padding: '5px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '16px', fontSize: '13px', fontWeight: '500' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>👁️ 浏览 {selectedPost.view_count || 0}</span>
              <span
                onClick={() => handleLike(selectedPost.id)}
                style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer' }}
              >
                ❤️ 点赞 {selectedPost.like_count || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
