import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { activitiesAPI, plansAPI } from '../api.js';

export default function Activities({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [formData, setFormData] = useState({
    plan_id: '',
    title: '',
    type: 'sharing',
    description: '',
    scheduled_at: '',
    guest_info: '',
    meeting_link: '',
    replay_link: '',
    materials: '',
    has_assignment: false,
    assignment_title: '',
    assignment_due_date: '',
    assignment_description: '',
    location: ''
  });

  const isHost = user.role === 'admin' || user.role === 'host';

  useEffect(() => {
    loadData();
  }, [filter, selectedPlan]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planId = params.get('plan');
    const action = params.get('action');
    const type = params.get('type');
    
    if (planId) {
      setSelectedPlan(planId);
      setFormData(f => ({ ...f, plan_id: planId }));
    }
    if (type && ['sharing', 'livestream', 'assignment', 'replay'].includes(type)) {
      setFilter(type);
      setFormData(f => ({ ...f, type }));
    }
    if (action === 'create' && isHost) {
      setTimeout(() => setShowModal(true), 100);
    }
  }, [location.search, isHost]);

  const loadData = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.type = filter;
      if (selectedPlan) params.plan_id = selectedPlan;

      const [activitiesRes, plansRes] = await Promise.all([
        activitiesAPI.getAll(params),
        plansAPI.getAll()
      ]);
      setActivities(activitiesRes.data.activities || []);
      setPlans(plansRes.data.plans || []);
      
      if (selectedPlan && plansRes.data.plans?.length > 0) {
        const plan = plansRes.data.plans.find(p => p.id.toString() === selectedPlan);
        if (plan) {
          setFormData(f => ({ ...f, plan_id: plan.id.toString() }));
        }
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = () => {
    return plans.find(p => p.id.toString() === selectedPlan);
  };

  const getTypeLabel = (type) => {
    const types = {
      sharing: '线上分享',
      livestream: '嘉宾直播',
      assignment: '作业收集',
      replay: '回放资料'
    };
    return types[type] || type;
  };

  const getTypeBadgeClass = (type) => {
    const classes = {
      sharing: 'badge-primary',
      livestream: 'badge-danger',
      assignment: 'badge-success',
      replay: 'badge-gray'
    };
    return classes[type] || 'badge-gray';
  };

  const getTypeIcon = (type) => {
    const icons = {
      sharing: '🎤',
      livestream: '🔴',
      assignment: '📝',
      replay: '🎥'
    };
    return icons[type] || '📌';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await activitiesAPI.create(formData);
      setShowModal(false);
      resetForm();
      loadData();
      alert('活动创建成功！');
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      plan_id: selectedPlan || '',
      title: '',
      type: 'sharing',
      description: '',
      scheduled_at: '',
      guest_info: '',
      meeting_link: '',
      replay_link: '',
      materials: '',
      has_assignment: false,
      assignment_title: '',
      assignment_due_date: '',
      assignment_description: '',
      location: ''
    });
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    const params = new URLSearchParams(location.search);
    if (newFilter !== 'all') {
      params.set('type', newFilter);
    } else {
      params.delete('type');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handlePlanChange = (planId) => {
    setSelectedPlan(planId);
    setFormData(f => ({ ...f, plan_id: planId }));
    const params = new URLSearchParams(location.search);
    if (planId) {
      params.set('plan', planId);
    } else {
      params.delete('plan');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const currentPlan = getCurrentPlan();

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0 }}>活动中心</h1>
              {currentPlan && (
                <p className="text-muted" style={{ marginTop: '0.25rem' }}>
                  当前查看：<strong>{currentPlan.title}</strong>
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {currentPlan && (
                <button className="btn btn-secondary" onClick={() => navigate(`/plans/${currentPlan.id}`)}>
                  ← 返回计划详情
                </button>
              )}
              {isHost && (
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  + 创建活动
                </button>
              )}
            </div>
          </div>

          {plans.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>选择共读计划:</label>
                <select
                  className="form-input"
                  style={{ maxWidth: '400px', flex: 1, minWidth: 200 }}
                  value={selectedPlan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  <option value="">全部计划</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : '已暂停'})</option>
                  ))}
                </select>
                {currentPlan && (
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span className="badge badge-gray">👥 {currentPlan.member_count} 人</span>
                    <span className="badge badge-gray">📖 {currentPlan.chapter_count || 0} 章</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="tabs">
            <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => handleFilterChange('all')}>全部活动</div>
            <div className={`tab ${filter === 'sharing' ? 'active' : ''}`} onClick={() => handleFilterChange('sharing')}>🎤 线上分享</div>
            <div className={`tab ${filter === 'livestream' ? 'active' : ''}`} onClick={() => handleFilterChange('livestream')}>🔴 嘉宾直播</div>
            <div className={`tab ${filter === 'assignment' ? 'active' : ''}`} onClick={() => handleFilterChange('assignment')}>📝 作业收集</div>
            <div className={`tab ${filter === 'replay' ? 'active' : ''}`} onClick={() => handleFilterChange('replay')}>🎥 回放资料</div>
          </div>

          {loading ? (
            <div className="text-center mt-8">加载中...</div>
          ) : (
            <div className="grid">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/activities/${activity.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${getTypeBadgeClass(activity.type)}`}>
                        {getTypeIcon(activity.type)} {getTypeLabel(activity.type)}
                      </span>
                      {activity.has_assignment && <span className="badge badge-warning">📝 有作业</span>}
                      {activity.is_completed && <span className="badge badge-gray">已结束</span>}
                    </div>
                    <span className="badge badge-gray">{activity.attendee_count || 0} 人报名</span>
                  </div>
                  <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>{activity.title}</h3>
                  {activity.plan_title && (
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      📚 {activity.plan_title}
                    </p>
                  )}
                  <p className="text-muted" style={{ marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {activity.description}
                  </p>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    <p>📅 {new Date(activity.scheduled_at).toLocaleString()}</p>
                    {activity.location && <p>📍 {activity.location}</p>}
                    {activity.host_name && <p>👤 主持人: {activity.host_name}</p>}
                    {activity.guest_info && <p>🎤 {activity.guest_info}</p>}
                  </div>
                  {activity.has_assignment && activity.assignment_due_date && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fffbeb', borderRadius: 8, fontSize: '0.875rem' }}>
                      <span className="badge badge-warning" style={{ marginRight: '0.5rem' }}>⏰</span>
                      作业截止: {new Date(activity.assignment_due_date).toLocaleDateString()}
                    </div>
                  )}
                  {activity.replay_link && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: 8, fontSize: '0.875rem' }}>
                      <span className="badge badge-success" style={{ marginRight: '0.5rem' }}>🎥</span>
                      回放已上传
                    </div>
                  )}
                </div>
              ))}
              {activities.length === 0 && (
                <div className="card text-center" style={{ padding: '3rem', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎯</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    {filter === 'all' ? '暂无活动' : `暂无${getTypeLabel(filter)}`}
                  </h3>
                  <p className="text-muted" style={{ marginBottom: '1rem' }}>
                    {currentPlan ? `${currentPlan.title} 下暂无活动安排` : '请选择共读计划或创建第一个活动'}
                  </p>
                  {isHost && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                      + 创建活动
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">🎯 创建活动</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">关联共读计划 *</label>
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
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">活动类型 *</label>
                  <select
                    className="form-input"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="sharing">🎤 线上分享</option>
                    <option value="livestream">🔴 嘉宾直播</option>
                    <option value="assignment">📝 作业收集</option>
                    <option value="replay">🎥 回放资料</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">活动时间 *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">活动标题 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：《原则》第一章线上答疑分享会"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">活动地点</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="如：线上（腾讯会议）或 线下具体地址"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">活动描述</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="详细描述活动内容、流程安排、参与方式等..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              {(formData.type === 'livestream' || formData.type === 'sharing') && (
                <div className="form-group">
                  <label className="form-label">嘉宾信息</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="如：张教授 - 清华大学经济管理学院"
                    value={formData.guest_info}
                    onChange={(e) => setFormData({ ...formData, guest_info: e.target.value })}
                  />
                </div>
              )}
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">会议链接</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://meeting.tencent.com/xxx"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">回放链接</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="活动结束后上传回放链接"
                    value={formData.replay_link}
                    onChange={(e) => setFormData({ ...formData, replay_link: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">资料链接</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="PPT、思维导图、参考资料等，多个链接用逗号分隔"
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                />
              </div>

              <div className="manage-section" style={{ margin: '1rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.has_assignment}
                    onChange={(e) => setFormData({ ...formData, has_assignment: e.target.checked })}
                  />
                  <strong>📝 关联作业收集</strong>
                </label>
                {formData.has_assignment && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--gray-300)' }}>
                    <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 2 }}>
                        <label className="form-label">作业标题 *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="如：第一章读后感作业"
                          value={formData.assignment_title}
                          onChange={(e) => setFormData({ ...formData, assignment_title: e.target.value })}
                          required={formData.has_assignment}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">截止日期 *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={formData.assignment_due_date}
                          onChange={(e) => setFormData({ ...formData, assignment_due_date: e.target.value })}
                          required={formData.has_assignment}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">作业要求</label>
                      <textarea
                        className="form-input"
                        placeholder="详细描述作业要求、提交格式、评分标准等..."
                        value={formData.assignment_description}
                        onChange={(e) => setFormData({ ...formData, assignment_description: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => { setShowModal(false); resetForm(); }}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary w-full">
                  创建活动
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
