import React, { useState, useEffect } from 'react';
import { postAPI, orgAPI } from '../api';

function Community({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [newPost, setNewPost] = useState({
    content: '',
    service_location: '',
    service_hours: '',
    activity_id: ''
  });
  const [orgGraph, setOrgGraph] = useState({ nodes: [], edges: [] });
  const [graphLoading, setGraphLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (activeTab === 'graph') {
      loadOrgRelations();
    }
  }, [activeTab]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await postAPI.getAll({ limit: 50 });
      setPosts(res.data.data || []);
    } catch (err) {
      console.error('加载公益圈失败', err);
      alert('加载动态失败：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadOrgRelations = async () => {
    try {
      setGraphLoading(true);
      const res = await orgAPI.getRelations();
      setOrgGraph(res.data.data || { nodes: [], edges: [] });
    } catch (err) {
      console.error('加载组织关系失败', err);
    } finally {
      setGraphLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user?.volunteer?.id) {
      alert('请先登录');
      return;
    }
    if (!newPost.content.trim()) {
      alert('请输入动态内容');
      return;
    }
    try {
      setSubmitting(true);
      await postAPI.create({
        volunteer_id: user.volunteer.id,
        content: newPost.content.trim(),
        service_location: newPost.service_location.trim() || null,
        service_hours: parseFloat(newPost.service_hours) || 0,
        activity_id: newPost.activity_id ? parseInt(newPost.activity_id) : null,
        images: []
      });
      setShowCreate(false);
      setNewPost({ content: '', service_location: '', service_hours: '', activity_id: '' });
      loadPosts();
    } catch (err) {
      alert('发布失败：' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getRelationLabel = (type) => {
    const labels = {
      member: '成员单位',
      affiliate: '下属机构',
      partner: '合作组织',
      branch: '分支机构'
    };
    return labels[type] || '关联组织';
  };

  const renderPostCard = (post) => (
    <div key={post.id} className="post-card">
      <div className="post-header">
        <div className="post-avatar">{post.volunteer_name?.[0] || '?'}</div>
        <div>
          <div className="post-author">{post.volunteer_name}</div>
          <div className="post-time">{new Date(post.created_at).toLocaleString()}</div>
        </div>
      </div>
      <div className="post-content">{post.content}</div>
      <div className="post-watermark">
        {post.service_location && <div>📍 服务地点: {post.service_location}</div>}
        {post.service_hours != null && post.service_hours > 0 && (
          <div>⏱️ 服务时长: {post.service_hours}小时</div>
        )}
        {post.activity_title && <div>📋 关联活动: {post.activity_title}</div>}
        {post.watermark_hash && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#bfbfbf' }}>
            🔒 水印哈希: {post.watermark_hash.slice(0, 16)}...
          </div>
        )}
      </div>
      {post.images?.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          {post.images.map((img, i) => (
            <div key={i} style={{
              width: '100px', height: '100px', borderRadius: '4px',
              background: '#f0f0f0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '12px', color: 'var(--text-secondary)'
            }}>
              📷 照片{i + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrgGraph = () => {
    if (graphLoading) {
      return <div style={{ textAlign: 'center', padding: '60px' }}>加载组织关系中...</div>;
    }

    const { nodes, edges } = orgGraph;

    if (nodes.length === 0) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕸️</div>
          <p>暂无组织关系数据</p>
        </div>
      );
    }

    const parentOrgs = [...new Set(edges.map(e => e.parent_org_id))];

    return (
      <div>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🕸️</div>
          <p style={{ fontWeight: 500 }}>组织关系图谱可视化</p>
          <p style={{ fontSize: '14px' }}>展示志愿组织间的层级与合作关系</p>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px',
          alignItems: 'center'
        }}>
          {parentOrgs.map(parentId => {
            const parentNode = nodes.find(n => n.id === parentId);
            const childEdges = edges.filter(e => e.parent_org_id === parentId);
            if (!parentNode) return null;

            return (
              <div key={parentId} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{ 
                    padding: '16px 32px', 
                    background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                    borderRadius: '12px', 
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                    minWidth: '200px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{parentNode.name}</div>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
                      信用分: {parentNode.credit_score} | 活动数: {parentNode.activity_count}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>核心组织</div>
                  </div>
                </div>

                {childEdges.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '20px', 
                    flexWrap: 'wrap',
                    alignItems: 'flex-start'
                  }}>
                    {childEdges.map((edge, idx) => {
                      const childNode = nodes.find(n => n.id === edge.child_org_id);
                      if (!childNode) return null;
                      return (
                        <div key={edge.id} style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{ color: '#1890ff', fontSize: '20px' }}>↓</div>
                          <div style={{ 
                            padding: '12px 24px', 
                            background: 'white', 
                            borderRadius: '8px', 
                            border: '1px solid #d9d9d9',
                            minWidth: '160px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}>
                            <div style={{ fontWeight: 600 }}>{childNode.name}</div>
                            <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                              {getRelationLabel(edge.relation_type)}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              信用分: {childNode.credit_score}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          background: '#f6ffed', 
          borderRadius: '8px',
          fontSize: '13px',
          color: '#389e0d'
        }}>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>📊 图谱统计</div>
          <div>共 {nodes.length} 个组织，{edges.length} 条关系</div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-title">
          <span>公益圈</span>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreate(true)}
            disabled={submitting}
          >
            + 发布动态
          </button>
        </div>

        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            全部动态
          </div>
          <div 
            className={`tab ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            组织关系图谱
          </div>
        </div>

        {activeTab === 'posts' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📢</div>
                <p>暂无动态，快来发布第一条吧！</p>
              </div>
            ) : (
              posts.map(renderPostCard)
            )}
          </>
        )}

        {activeTab === 'graph' && (
          <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px', minHeight: '200px' }}>
            {renderOrgGraph()}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => !submitting && setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>发布公益动态</span>
              <button 
                className="modal-close" 
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">动态内容 *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="分享你的志愿服务经历..."
                  required
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">服务地点</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newPost.service_location}
                    onChange={e => setNewPost({ ...newPost, service_location: e.target.value })}
                    placeholder="例如: 北京市朝阳区"
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">服务时长(小时)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newPost.service_hours}
                    onChange={e => setNewPost({ ...newPost, service_hours: e.target.value })}
                    step="0.5"
                    min="0"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">关联活动ID（可选）</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={newPost.activity_id}
                  onChange={e => setNewPost({ ...newPost, activity_id: e.target.value })}
                  min="1"
                  disabled={submitting}
                />
              </div>
              <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                📷 发布的动态将自动添加服务地点、时长水印，确保内容真实性
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowCreate(false)}
                  disabled={submitting}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '发布中...' : '发布'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Community;
