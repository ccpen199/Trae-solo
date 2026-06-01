import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { plansAPI, reportsAPI, membersAPI } from '../api.js';

export default function Home({ user, onLogout }) {
  const [plans, setPlans] = useState([]);
  const [overview, setOverview] = useState(null);
  const [myProgress, setMyProgress] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    book_title: '',
    book_author: '',
    description: '',
    start_date: '',
    end_date: '',
    reading_goals: ''
  });
  const navigate = useNavigate();

  const isAdmin = user.role === 'admin';
  const isHost = user.role === 'admin' || user.role === 'host';
  const isGuest = user.role === 'guest';
  const isMember = user.role === 'member';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, overviewRes, progressRes, notesRes] = await Promise.all([
        plansAPI.getAll(),
        isHost ? reportsAPI.getOverview().catch(() => null) : null,
        membersAPI.getProgress().catch(() => ({ data: { progress: [] } })),
        membersAPI.getNotes().catch(() => ({ data: { notes: [] } }))
      ]);
      setPlans(plansRes.data.plans || []);
      if (overviewRes) setOverview(overviewRes.data);
      setMyProgress(progressRes.data?.progress || []);
      setMyNotes(notesRes.data?.notes || []);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleWelcome = () => {
    const welcomes = {
      admin: { icon: '👑', title: '系统管理员工作台', subtitle: '管理平台运营，监督所有共读计划进展' },
      host: { icon: '🎯', title: '主理人工作台', subtitle: '管理你的共读计划，带领成员深度阅读' },
      member: { icon: '📚', title: '我的共读空间', subtitle: '记录阅读进度，参与讨论，共同成长' },
      guest: { icon: '⭐', title: '嘉宾工作台', subtitle: '分享专业观点，解答成员疑问' }
    };
    return welcomes[user.role] || welcomes.member;
  };

  const getTodoList = () => {
    const todos = [];
    const activePlans = plans.filter(p => p.status === 'active');
    
    if (isAdmin || isHost) {
      const absentCount = overview?.absent_members?.length || 0;
      if (absentCount > 0) {
        todos.push({
          icon: '⚠️',
          text: `有 ${absentCount} 位成员阅读进度落后，需要关注`,
          action: () => navigate('/admin?tab=absence'),
          priority: 'high'
        });
      }
      if (activePlans.length === 0) {
        todos.push({
          icon: '➕',
          text: '创建你的第一个共读计划',
          action: () => setShowModal(true),
          priority: 'high'
        });
      }
      activePlans.forEach(plan => {
        todos.push({
          icon: '📋',
          text: `「${plan.title}」- 查看本周成员参与数据`,
          action: () => navigate(`/admin?plan=${plan.id}`),
          priority: 'normal'
        });
        todos.push({
          icon: '🎪',
          text: `「${plan.title}」- 组织一次线上分享活动`,
          action: () => navigate(`/activities?plan=${plan.id}&action=create`),
          priority: 'normal'
        });
      });
    }

    if (isMember || isGuest) {
      const completedIds = myProgress.filter(p => p.status === 'completed').map(p => p.chapter_id);
      activePlans.forEach(plan => {
        const myPlanProgress = myProgress.filter(p => p.plan_id === plan.id);
        const completed = myPlanProgress.filter(p => p.status === 'completed').length;
        const total = plan.chapter_count || 0;
        
        if (total > 0 && completed < total) {
          todos.push({
            icon: '📖',
            text: `「${plan.title}」- 继续阅读第 ${completed + 1} 章`,
            action: () => navigate(`/plans/${plan.id}`),
            priority: 'high'
          });
        }
        
        const today = new Date().toDateString();
        const checkedInToday = myProgress.some(p => 
          p.plan_id === plan.id && 
          p.last_checkin && 
          new Date(p.last_checkin).toDateString() === today
        );
        if (!checkedInToday && total > 0) {
          todos.push({
            icon: '📌',
            text: `「${plan.title}」- 今日还未打卡`,
            action: () => navigate(`/plans/${plan.id}`),
            priority: 'high'
          });
        }
      });

      const recentNotes = myNotes.filter(n => {
        const days = (new Date() - new Date(n.created_at)) / (1000 * 60 * 60 * 24);
        return days < 7;
      });
      if (recentNotes.length < 2) {
        todos.push({
          icon: '✍️',
          text: '写一篇读书笔记，记录你的阅读感悟',
          action: () => navigate('/notes'),
          priority: 'normal'
        });
      }
    }

    if (isGuest) {
      todos.push({
        icon: '🎤',
        text: '准备你的分享资料，回复成员提问',
        action: () => navigate('/discussions'),
        priority: 'high'
      });
    }

    return todos.slice(0, 6);
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (isAdmin || isHost) {
      actions.push(
        { icon: '📚', label: '新建共读计划', action: () => setShowModal(true) },
        { icon: '📊', label: '查看数据报表', action: () => navigate('/admin') },
        { icon: '🎪', label: '创建活动', action: () => navigate('/activities?action=create') },
        { icon: '📢', label: '发起讨论', action: () => navigate('/discussions?action=create') }
      );
    }
    
    if (isMember || isGuest) {
      actions.push(
        { icon: '✍️', label: '写笔记', action: () => {
          if (plans.length > 0) navigate(`/plans/${plans[0].id}`);
        }},
        { icon: '💬', label: '参与讨论', action: () => navigate('/discussions') },
        { icon: '📝', label: '我的笔记', action: () => navigate('/notes') },
        { icon: '🎯', label: '活动中心', action: () => navigate('/activities') }
      );
    }

    if (isAdmin) {
      actions.push(
        { icon: '👥', label: '用户管理', action: () => navigate('/admin') },
        { icon: '📤', label: '数据导出', action: () => alert('数据导出功能') }
      );
    }

    return actions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await plansAPI.create(formData);
      setShowModal(false);
      loadData();
      setFormData({
        title: '',
        book_title: '',
        book_author: '',
        description: '',
        start_date: '',
        end_date: '',
        reading_goals: ''
      });
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { class: 'badge-success', text: '进行中' },
      completed: { class: 'badge-primary', text: '已完成' },
      paused: { class: 'badge-warning', text: '已暂停' },
      archived: { class: 'badge-gray', text: '已归档' }
    };
    return statusMap[status] || statusMap.active;
  };

  const getPlanDays = (plan) => {
    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);
    const now = new Date();
    const total = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    return { total, elapsed: Math.max(0, Math.min(elapsed, total)) };
  };

  const filteredPlans = plans.filter(p => {
    if (activeFilter === 'all') return true;
    return p.status === activeFilter;
  });

  const welcome = getRoleWelcome();
  const todos = getTodoList();
  const quickActions = getQuickActions();

  if (loading) {
    return <div className="text-center mt-8">加载中...</div>;
  }

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <div className="card" style={{ 
            background: isAdmin ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' :
                        isHost ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                        isGuest ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white', marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>{welcome.icon}</span>
              <div>
                <h1 style={{ color: 'white', margin: 0 }}>{welcome.title}</h1>
                <p style={{ opacity: 0.9, margin: '0.25rem 0 0 0' }}>
                  👋 欢迎回来，{user.name}！{welcome.subtitle}
                </p>
              </div>
            </div>

            <div className="quick-actions" style={{ marginTop: '1rem' }}>
              {quickActions.map((act, i) => (
                <button
                  key={i}
                  className="btn quick-action-btn"
                  style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={act.action}
                >
                  {act.icon} {act.label}
                </button>
              ))}
            </div>
          </div>

          {todos.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📋</span>
                <h2 style={{ margin: 0, fontSize: '1.125rem' }}>今日待办</h2>
                <span className="badge badge-warning">{todos.length} 项</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.5rem' }}>
                {todos.map((todo, i) => (
                  <div
                    key={i}
                    className="card"
                    style={{ 
                      cursor: 'pointer', 
                      padding: '0.75rem 1rem', 
                      margin: 0,
                      background: todo.priority === 'high' ? '#fffbeb' : 'white',
                      border: todo.priority === 'high' ? '1px solid #f59e0b' : '1px solid var(--gray-200)'
                    }}
                    onClick={todo.action}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{todo.icon}</span>
                      <span style={{ fontSize: '0.875rem', flex: 1 }}>{todo.text}</span>
                      <span style={{ color: 'var(--primary)' }}>→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isHost && overview && (
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-value">{overview.overview.total_plans}</div>
                <div className="stat-label">共读计划</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overview.overview.total_users}</div>
                <div className="stat-label">平台用户</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overview.overview.total_notes}</div>
                <div className="stat-label">笔记总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overview.overview.total_checkins}</div>
                <div className="stat-label">打卡次数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overview.overview.total_topics}</div>
                <div className="stat-label">讨论话题</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overview.overview.total_activities}</div>
                <div className="stat-label">活动总数</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📚</span>
              <h2 style={{ margin: 0 }}>{isHost ? '共读计划管理' : '我的共读计划'}</h2>
              <span className="badge badge-gray">{filteredPlans.length} 个</span>
            </div>
            {isHost && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                + 新建共读计划
              </button>
            )}
          </div>

          <div className="tabs" style={{ marginBottom: '1.5rem' }}>
            <div className={`tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>全部</div>
            <div className={`tab ${activeFilter === 'active' ? 'active' : ''}`} onClick={() => setActiveFilter('active')}>进行中</div>
            <div className={`tab ${activeFilter === 'completed' ? 'active' : ''}`} onClick={() => setActiveFilter('completed')}>已完成</div>
            <div className={`tab ${activeFilter === 'paused' ? 'active' : ''}`} onClick={() => setActiveFilter('paused')}>已暂停</div>
          </div>

          <div className="grid">
            {filteredPlans.map((plan) => {
              const status = getStatusBadge(plan.status);
              const days = getPlanDays(plan);
              const progressPercent = days.total > 0 ? Math.round((days.elapsed / days.total) * 100) : 0;
              const myPlanProgress = myProgress.filter(p => p.plan_id === plan.id);
              const myCompleted = myPlanProgress.filter(p => p.status === 'completed').length;
              
              return (
                <div
                  key={plan.id}
                  className="card"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  onClick={() => navigate(`/plans/${plan.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>{plan.title}</h3>
                    <span className={`badge ${status.class}`}>{status.text}</span>
                  </div>
                  
                  <p style={{ color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                    📖 《{plan.book_title}》 - {plan.book_author}
                  </p>
                  
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {plan.description}
                  </p>

                  {(isMember || isGuest) && (
                    <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--success)' }}>✓ 我的进度</span>
                        <span style={{ color: 'var(--success)' }}>{myCompleted}/{plan.chapter_count || 0} 章</span>
                      </div>
                      <div className="progress-bar" style={{ height: '6px' }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${plan.chapter_count > 0 ? (myCompleted / plan.chapter_count * 100) : 0}%`,
                            background: 'var(--success)'
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                      <span>周期进度</span>
                      <span>{days.elapsed}/{days.total} 天 ({progressPercent}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-gray">
                      👥 {plan.member_count} 人参与
                    </span>
                    <span className="badge badge-primary">
                      主理人: {plan.host_name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    <span>📅 {plan.start_date}</span>
                    <span>→ {plan.end_date}</span>
                  </div>

                  {isHost && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-sm btn-secondary w-full"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin?plan=${plan.id}`); }}
                      >
                        📊 报表
                      </button>
                      <button 
                        className="btn btn-sm btn-primary w-full"
                        onClick={(e) => { e.stopPropagation(); navigate(`/activities?plan=${plan.id}`); }}
                      >
                        🎯 活动
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredPlans.length === 0 && (
            <div className="card text-center" style={{ padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ marginBottom: '0.5rem' }}>暂无共读计划</h3>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                {isHost ? '点击右上角按钮创建第一个共读计划' : '等待主理人创建共读计划'}
              </p>
              {isHost && (
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  + 创建共读计划
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">📚 创建共读计划</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">计划名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：《原则》21天深度共读"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">书名 *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例如：原则"
                    value={formData.book_title}
                    onChange={(e) => setFormData({ ...formData, book_title: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">作者</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例如：瑞·达利欧"
                    value={formData.book_author}
                    onChange={(e) => setFormData({ ...formData, book_author: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">计划描述</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="介绍本次共读的背景、意义和期待..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">开始日期 *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">结束日期 *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">阅读目标</label>
                <textarea
                  className="form-input"
                  placeholder="例如：每周完成1-2章阅读，撰写3篇读书笔记，参与2次线上讨论..."
                  value={formData.reading_goals}
                  onChange={(e) => setFormData({ ...formData, reading_goals: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-success">提示</span>
                  创建后可在计划详情页继续添加章节、邀请成员和创建活动
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary w-full">
                  创建共读计划
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
