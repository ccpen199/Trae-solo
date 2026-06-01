import { useState, useEffect } from 'react';
import api from '../utils/api';

function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal'
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuardian = user.role === 'guardian';
  const canHandle = user.role === 'admin' || user.role === 'teacher';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/feedbacks');
      setFeedbacks(res.data);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (feedback) => {
    try {
      const res = await api.get(`/feedbacks/${feedback.id}`);
      setSelectedFeedback(res.data);
      setShowModal(true);
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedbacks', formData);
      setShowCreate(false);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal'
      });
      loadData();
      alert('提交成功');
    } catch (error) {
      alert('提交失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await api.post(`/feedbacks/${selectedFeedback.id}/reply`, { content: replyContent });
      setReplyContent('');
      const res = await api.get(`/feedbacks/${selectedFeedback.id}`);
      setSelectedFeedback(res.data);
      loadData();
    } catch (error) {
      alert('回复失败');
    }
  };

  const handleEscalate = async () => {
    if (!confirm('确定要将此反馈升级给学校管理员吗？')) return;
    try {
      await api.post(`/feedbacks/${selectedFeedback.id}/escalate`, { reason: '用户申请升级' });
      const res = await api.get(`/feedbacks/${selectedFeedback.id}`);
      setSelectedFeedback(res.data);
      loadData();
      alert('已升级给学校管理员');
    } catch (error) {
      alert('升级失败');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.put(`/feedbacks/${selectedFeedback.id}/status`, { status });
      const res = await api.get(`/feedbacks/${selectedFeedback.id}`);
      setSelectedFeedback(res.data);
      loadData();
      alert('状态已更新');
    } catch (error) {
      alert('更新失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { class: 'badge-warning', text: '待处理' },
      processing: { class: 'badge-info', text: '处理中' },
      closed: { class: 'badge-success', text: '已关闭' }
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const getCategoryText = (category) => {
    const categories = {
      general: '一般咨询',
      study: '学习相关',
      life: '生活相关',
      safety: '安全问题',
      fee: '收费问题',
      complaint: '投诉建议',
      other: '其他'
    };
    return categories[category] || category;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { class: 'badge-secondary', text: '低' },
      normal: { class: 'badge-info', text: '普通' },
      high: { class: 'badge-warning', text: '高' },
      urgent: { class: 'badge-danger', text: '紧急' }
    };
    return badges[priority] || { class: 'badge-secondary', text: priority };
  };

  const getRoleText = (role) => {
    const roles = {
      admin: '管理员',
      teacher: '老师',
      guardian: '家长'
    };
    return roles[role] || role;
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex flex-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>反馈交流</h1>
        {isGuardian && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 提交反馈
          </button>
        )}
      </div>

      {feedbacks.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无反馈记录</p>
        </div>
      ) : (
        feedbacks.map((fb) => {
          const statusBadge = getStatusBadge(fb.status);
          const priorityBadge = getPriorityBadge(fb.priority);
          return (
            <div key={fb.id} className="feedback-item" onClick={() => handleView(fb)}>
              <div className="flex flex-between items-center">
                <div>
                  <strong style={{ fontSize: '16px' }}>{fb.title}</strong>
                  <div style={{ marginTop: '5px' }}>
                    <span className="badge badge-info" style={{ marginRight: '8px' }}>
                      {getCategoryText(fb.category)}
                    </span>
                    <span className={`badge ${priorityBadge.class}`} style={{ marginRight: '8px' }}>
                      {priorityBadge.text}
                    </span>
                    <span className={`badge ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                    {fb.escalated && <span className="badge badge-danger" style={{ marginLeft: '8px' }}>已升级</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: '#999', fontSize: '13px' }}>
                  <div>{fb.author_name}</div>
                  <div>{new Date(fb.created_at).toLocaleString()}</div>
                </div>
              </div>
              <p style={{ marginTop: '8px', color: '#666' }}>{fb.content.substring(0, 100)}...</p>
              <div style={{ marginTop: '8px', color: '#999', fontSize: '12px' }}>
                回复: {fb.reply_count} 条
              </div>
            </div>
          );
        })
      )}

      {showModal && selectedFeedback && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedFeedback.title}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span className="badge badge-info" style={{ marginRight: '8px' }}>
                {getCategoryText(selectedFeedback.category)}
              </span>
              <span className={`badge ${getPriorityBadge(selectedFeedback.priority).class}`} style={{ marginRight: '8px' }}>
                {getPriorityBadge(selectedFeedback.priority).text}
              </span>
              <span className={`badge ${getStatusBadge(selectedFeedback.status).class}`}>
                {getStatusBadge(selectedFeedback.status).text}
              </span>
              {selectedFeedback.escalated && <span className="badge badge-danger" style={{ marginLeft: '8px' }}>已升级</span>}
            </div>
            <div style={{ marginBottom: '15px', color: '#999', fontSize: '13px' }}>
              <span>提交人: {selectedFeedback.author_name} ({selectedFeedback.author_phone})</span>
              <span style={{ marginLeft: '20px' }}>提交时间: {new Date(selectedFeedback.created_at).toLocaleString()}</span>
            </div>
            <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
              {selectedFeedback.content}
            </div>

            {selectedFeedback.replies?.length > 0 && (
              <div className="reply-list">
                <h4 style={{ marginBottom: '15px' }}>回复记录</h4>
                {selectedFeedback.replies.map((reply) => (
                  <div key={reply.id} className="reply-item">
                    <div className="reply-meta">
                      <strong>{reply.author_name}</strong>
                      <span className="badge badge-secondary" style={{ marginLeft: '8px' }}>{getRoleText(reply.author_role)}</span>
                      <span style={{ marginLeft: '8px' }}>{new Date(reply.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{reply.content}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <div className="form-group">
                <label>回复内容</label>
                <textarea
                  rows="3"
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="输入回复内容..."
                />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={handleReply}>发送回复</button>
                
                {(isGuardian || (canHandle && !selectedFeedback.escalated)) && selectedFeedback.status !== 'closed' && (
                  <button className="btn btn-danger" onClick={handleEscalate}>升级反馈</button>
                )}
                
                {canHandle && selectedFeedback.status !== 'closed' && (
                  <button className="btn btn-success" onClick={() => handleUpdateStatus('closed')}>
                    关闭反馈
                  </button>
                )}
                
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>关闭</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>提交反馈</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>分类 *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="general">一般咨询</option>
                  <option value="study">学习相关</option>
                  <option value="life">生活相关</option>
                  <option value="safety">安全问题</option>
                  <option value="fee">收费问题</option>
                  <option value="complaint">投诉建议</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="form-group">
                <label>优先级</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">低</option>
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <div className="form-group">
                <label>内容 *</label>
                <textarea
                  rows="5"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>
              <p style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>
                提示：涉及安全或收费的问题将自动标记为高优先级，并可升级给学校管理员处理。
              </p>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">提交</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feedbacks;
