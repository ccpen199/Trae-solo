import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { discussionsAPI, plansAPI } from '../api.js';

export default function Discussions({ user, onLogout }) {
  const [topics, setTopics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    plan_id: '',
    chapter_id: '',
    title: '',
    content: ''
  });

  const navigate = useNavigate();
  const isHost = user.role === 'admin' || user.role === 'host';

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const params = {};
      if (filter === 'essence') params.is_essence = 1;

      const [topicsRes, plansRes] = await Promise.all([
        discussionsAPI.getTopics(params),
        plansAPI.getAll()
      ]);
      setTopics(topicsRes.data.topics || []);
      setPlans(plansRes.data.plans || []);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await discussionsAPI.createTopic(formData);
      setShowModal(false);
      setFormData({ plan_id: '', chapter_id: '', title: '', content: '' });
      loadData();
    } catch (error) {
      alert('发布失败');
    }
  };

  const handlePin = async (topicId, isPinned) => {
    try {
      await discussionsAPI.togglePin(topicId, !isPinned);
      loadData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleEssence = async (topicId, isEssence) => {
    try {
      await discussionsAPI.toggleEssence(topicId, !isEssence);
      loadData();
    } catch (error) {
      alert('操作失败');
    }
  };

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1>讨论区</h1>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + 发起讨论
            </button>
          </div>

          <div className="tabs">
            <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>全部话题</div>
            <div className={`tab ${filter === 'essence' ? 'active' : ''}`} onClick={() => setFilter('essence')}>精华帖</div>
          </div>

          {loading ? (
            <div className="text-center mt-8">加载中...</div>
          ) : (
            <div>
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className={`card ${topic.is_pinned ? 'pinned' : ''} ${topic.is_essence ? 'essence' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/discussions/${topic.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {topic.is_pinned && <span className="badge badge-warning">置顶</span>}
                        {topic.is_essence && <span className="badge badge-success">精华</span>}
                        <h3 style={{ margin: 0 }}>{topic.title}</h3>
                      </div>
                      <p className="text-muted" style={{ marginBottom: '0.5rem' }}>
                        {topic.content.substring(0, 100)}...
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        <span>👤 {topic.author_name}</span>
                        <span>💬 {topic.comment_count} 评论</span>
                        <span>👍 {topic.vote_count} 点赞</span>
                        <span>👁 {topic.view_count} 浏览</span>
                        <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {isHost && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handlePin(topic.id, topic.is_pinned)}
                        >
                          {topic.is_pinned ? '取消置顶' : '置顶'}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEssence(topic.id, topic.is_essence)}
                        >
                          {topic.is_essence ? '取消精华' : '加精'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {topics.length === 0 && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                  <p className="text-muted">暂无讨论话题</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">发起讨论</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">选择共读计划</label>
                <select
                  className="form-input"
                  value={formData.plan_id}
                  onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                  required
                >
                  <option value="">请选择共读计划</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">话题标题</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">话题内容</label>
                <textarea
                  className="form-input form-textarea"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">发布话题</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
