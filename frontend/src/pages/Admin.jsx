import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { reportsAPI, plansAPI } from '../api.js';

export default function Admin({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('participation');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [plans, setPlans] = useState([]);
  const [overview, setOverview] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [chapterProgress, setChapterProgress] = useState(null);
  const [hotTopics, setHotTopics] = useState(null);
  const [absenceAlerts, setAbsenceAlerts] = useState(null);
  const [loading, setLoading] = useState(false);

  const isHost = user.role === 'admin' || user.role === 'host';

  useEffect(() => {
    if (!isHost) return;
    loadPlans();
  }, [isHost]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planId = params.get('plan');
    const tab = params.get('tab');
    
    if (tab && ['overview', 'participation', 'progress', 'topics', 'absence'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (planId && plans.length > 0) {
      const planExists = plans.some(p => p.id.toString() === planId);
      if (planExists) {
        setSelectedPlan(planId);
      }
    }
  }, [location.search, plans]);

  useEffect(() => {
    if (selectedPlan && activeTab !== 'overview') {
      loadReportData();
    } else if (activeTab === 'overview') {
      loadOverview();
    }
  }, [selectedPlan, activeTab]);

  const loadPlans = async () => {
    try {
      const response = await plansAPI.getAll();
      const planList = response.data.plans || [];
      setPlans(planList);
      
      const params = new URLSearchParams(location.search);
      const planId = params.get('plan');
      
      if (planId && planList.some(p => p.id.toString() === planId)) {
        setSelectedPlan(planId);
      } else if (planList.length > 0) {
        setSelectedPlan(planList[0].id.toString());
      }
    } catch (error) {
      console.error('加载计划失败:', error);
    }
  };

  const loadOverview = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getOverview();
      setOverview(response.data);
    } catch (error) {
      console.error('加载概览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    if (!selectedPlan) return;
    
    setLoading(true);
    try {
      const [participationRes, chapterRes, topicsRes, absenceRes] = await Promise.all([
        reportsAPI.getParticipation(selectedPlan),
        reportsAPI.getChapterProgress(selectedPlan),
        reportsAPI.getHotTopics(selectedPlan),
        reportsAPI.getAbsenceAlerts(selectedPlan)
      ]);
      setParticipation(participationRes.data);
      setChapterProgress(chapterRes.data);
      setHotTopics(topicsRes.data);
      setAbsenceAlerts(absenceRes.data);
    } catch (error) {
      console.error('加载报表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handlePlanChange = (planId) => {
    setSelectedPlan(planId);
    const params = new URLSearchParams(location.search);
    params.set('plan', planId);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const getCurrentPlan = () => {
    return plans.find(p => p.id.toString() === selectedPlan);
  };

  if (!isHost) {
    return <Navigate to="/" />;
  }

  const currentPlan = getCurrentPlan();

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0 }}>报表中心</h1>
              {currentPlan && activeTab !== 'overview' && (
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
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                计划列表
              </button>
            </div>
          </div>

          {activeTab !== 'overview' && plans.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>选择共读计划:</label>
                <select
                  className="form-input"
                  style={{ maxWidth: '400px', flex: 1, minWidth: 200 }}
                  value={selectedPlan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : '已暂停'})</option>
                  ))}
                </select>
                {currentPlan && (
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span className="badge badge-gray">👥 {currentPlan.member_count} 人</span>
                    <span className="badge badge-gray">📅 {currentPlan.start_date} ~ {currentPlan.end_date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="tabs">
            <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>📊 系统概览</div>
            <div className={`tab ${activeTab === 'participation' ? 'active' : ''}`} onClick={() => handleTabChange('participation')}>👥 成员参与</div>
            <div className={`tab ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => handleTabChange('progress')}>📚 章节进度</div>
            <div className={`tab ${activeTab === 'topics' ? 'active' : ''}`} onClick={() => handleTabChange('topics')}>💬 热门话题</div>
            <div className={`tab ${activeTab === 'absence' ? 'active' : ''}`} onClick={() => handleTabChange('absence')}>⚠️ 缺席提醒</div>
          </div>

          {loading && <div className="text-center mt-8">加载中...</div>}

          {!loading && activeTab === 'overview' && overview && (
            <div className="tab-content-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{overview.overview.total_plans}</div>
                  <div className="stat-label">共读计划</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{overview.overview.total_users}</div>
                  <div className="stat-label">用户总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{overview.overview.total_notes}</div>
                  <div className="stat-label">笔记总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{overview.overview.total_topics}</div>
                  <div className="stat-label">讨论话题</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{overview.overview.total_activities}</div>
                  <div className="stat-label">活动总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{overview.overview.total_checkins}</div>
                  <div className="stat-label">打卡次数</div>
                </div>
              </div>

              <div className="card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>最近动态</h3>
                  <span className="badge badge-gray">{overview.recent_activity?.length || 0} 条新动态</span>
                </div>
                {overview.recent_activity?.map((activity, index) => (
                  <div key={index} className="list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">
                        {activity.type === 'checkin' ? '✅ 打卡' : activity.type === 'note' ? '📝 笔记' : '💬 话题'}
                      </span>
                      <span>
                        用户 <strong>{activity.user_name || activity.user_id}</strong>
                        {activity.type === 'checkin' ? ' 完成了阅读打卡' : activity.type === 'note' ? ' 发表了读书笔记' : ' 发起了讨论话题'}
                      </span>
                      {activity.chapter_title && (
                        <span className="badge badge-gray">📍 {activity.chapter_title}</span>
                      )}
                    </div>
                    <span className="text-muted">{new Date(activity.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {(!overview.recent_activity || overview.recent_activity.length === 0) && (
                  <p className="text-muted text-center" style={{ padding: '2rem' }}>暂无最近动态</p>
                )}
              </div>

              {overview.absent_members?.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>⚠️ 需要关注</h3>
                    <button className="btn btn-sm btn-primary" onClick={() => handleTabChange('absence')}>
                      查看全部缺席提醒 →
                    </button>
                  </div>
                  {overview.absent_members.slice(0, 5).map((member) => (
                    <div key={member.id} className="list-item">
                      <div>
                        <strong>{member.name}</strong>
                        <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>
                          落后 {member.missed_chapters} 章
                        </span>
                      </div>
                      <span className="text-muted">
                        上次打卡: {member.last_checkin ? new Date(member.last_checkin).toLocaleDateString() : '无记录'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'participation' && participation && (
            <div className="tab-content-section">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>成员参与排行</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-gray">共 {participation.member_stats?.length || 0} 位成员</span>
                    <span className="badge badge-success">平均完成 {Math.round(participation.member_stats?.reduce((a, b) => a + b.completed_chapters, 0) / (participation.member_stats?.length || 1))}/{participation.total_chapters || 0} 章</span>
                  </div>
                </div>
                {participation.member_stats?.map((member, index) => (
                  <div key={member.id} className="list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem', fontWeight: 'bold', flexShrink: 0,
                        background: index < 3 ? 'var(--warning)' : 'var(--gray-200)',
                        color: index < 3 ? 'white' : 'var(--gray-600)'
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong>{member.name}</strong>
                          <span className="badge badge-gray">
                            {member.role === 'host' ? '主理人' : member.role === 'guest' ? '嘉宾' : '成员'}
                          </span>
                          {member.completed_chapters === participation.total_chapters && participation.total_chapters > 0 && (
                            <span className="badge badge-success">🎉 全勤</span>
                          )}
                        </div>
                        <div style={{ marginTop: '0.25rem', width: 200 }}>
                          <div className="progress-bar" style={{ height: '6px' }}>
                            <div
                              className="progress-fill"
                              style={{ width: `${participation.total_chapters > 0 ? (member.completed_chapters / participation.total_chapters * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">📖 {member.completed_chapters}/{participation.total_chapters} 章</span>
                      <span className="badge badge-success">📝 {member.note_count} 笔记</span>
                      <span className="badge badge-secondary">✅ {member.checkin_count} 打卡</span>
                      <span className="badge badge-warning">💬 {member.topic_count + member.comment_count} 讨论</span>
                    </div>
                  </div>
                ))}
                {(!participation.member_stats || participation.member_stats.length === 0) && (
                  <p className="text-muted text-center" style={{ padding: '2rem' }}>暂无成员参与数据</p>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === 'progress' && chapterProgress && (
            <div className="tab-content-section">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>章节完成进度</h3>
                  <span className="badge badge-gray">共 {chapterProgress.chapter_stats?.length || 0} 章</span>
                </div>
                {chapterProgress.chapter_stats?.map((chapter) => {
                  const percent = chapter.total_members > 0 ? Math.round((chapter.completed_count / chapter.total_members) * 100) : 0;
                  return (
                    <div key={chapter.id} className="list-item">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-primary">第{chapter.chapter_number}章</span>
                            <strong>{chapter.title}</strong>
                            {percent >= 80 && <span className="badge badge-success">🔥 热门</span>}
                            {percent === 0 && <span className="badge badge-warning">⚠️ 待推进</span>}
                          </div>
                          <span className="text-muted">
                            {chapter.completed_count}/{chapter.total_members} 人完成 ({percent}%)
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                          <span>📝 {chapter.note_count} 笔记</span>
                          <span>✅ {chapter.checkin_count} 打卡</span>
                          <span>📅 {chapter.scheduled_date || '未安排'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!chapterProgress.chapter_stats || chapterProgress.chapter_stats.length === 0) && (
                  <p className="text-muted text-center" style={{ padding: '2rem' }}>暂无章节进度数据</p>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === 'topics' && hotTopics && (
            <div className="tab-content-section">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>热门话题 TOP 10</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/discussions?plan=${selectedPlan}`)}>
                    进入讨论区 →
                  </button>
                </div>
                {hotTopics.hot_topics?.map((topic, index) => (
                  <div
                    key={topic.id}
                    className={`list-item ${topic.is_pinned ? 'pinned' : ''} ${topic.is_essence ? 'essence' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/discussions/${topic.id}`)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-warning">#{index + 1}</span>
                        <strong>{topic.title}</strong>
                        {topic.is_pinned && <span className="badge badge-warning">📌 置顶</span>}
                        {topic.is_essence && <span className="badge badge-success">⭐ 精华</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="text-muted">by {topic.author_name}</span>
                        {topic.chapter_title && <span className="badge badge-gray">📍 {topic.chapter_title}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">💬 {topic.comment_count}</span>
                      <span className="badge badge-success">👍 {topic.vote_count}</span>
                      <span className="badge badge-gray">👁 {topic.view_count}</span>
                    </div>
                  </div>
                ))}
                {(!hotTopics.hot_topics || hotTopics.hot_topics.length === 0) && (
                  <div className="text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>暂无热门话题</p>
                    <button className="btn btn-primary" onClick={() => navigate(`/discussions?plan=${selectedPlan}&action=create`)}>
                      发起第一个话题
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === 'absence' && absenceAlerts && (
            <div className="tab-content-section">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>缺席提醒</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-danger">{absenceAlerts.absent_members?.length || 0} 人落后</span>
                    <span className="badge badge-gray">{absenceAlerts.total_members || 0} 人总成员</span>
                  </div>
                </div>
                
                {absenceAlerts.absent_members?.length > 0 && (
                  <div className="manage-section" style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>📋 运营建议</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--gray-600)' }}>
                      <li>建议对连续缺席超过2周的成员进行一对一提醒</li>
                      <li>可以组织小型线上分享会，邀请活跃成员带动氛围</li>
                      <li>考虑适当调整阅读节奏，确保大多数成员能跟上进度</li>
                      <li>精华笔记和优秀作业可以在群内公开表扬，激发参与热情</li>
                    </ul>
                  </div>
                )}

                {absenceAlerts.absent_members?.map((member) => (
                  <div key={member.id} className="list-item" style={{ borderLeft: '4px solid var(--danger)', background: '#fef2f2' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <strong>{member.name}</strong>
                        <span className="badge badge-danger">
                          落后 {member.missed_chapters} 章
                        </span>
                        <span className="badge badge-gray">
                          {member.role === 'host' ? '主理人' : member.role === 'guest' ? '嘉宾' : '成员'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                        <span className="text-muted">📧 {member.email}</span>
                        <span className="text-muted">
                          完成进度: {member.completed_chapters || 0}/{absenceAlerts.total_chapters || 0} 章
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', width: 200 }}>
                        <div className="progress-bar" style={{ height: '6px' }}>
                          <div
                            className="progress-fill"
                            style={{ 
                              width: `${absenceAlerts.total_chapters > 0 ? ((member.completed_chapters || 0) / absenceAlerts.total_chapters * 100) : 0}%`,
                              background: 'var(--danger)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                      <p className="text-muted" style={{ margin: 0 }}>
                        上次打卡: {member.last_checkin ? new Date(member.last_checkin).toLocaleDateString() : '无记录'}
                      </p>
                      <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>
                        上次笔记: {member.last_note ? new Date(member.last_note).toLocaleDateString() : '无记录'}
                      </p>
                    </div>
                  </div>
                ))}
                {(!absenceAlerts.absent_members || absenceAlerts.absent_members.length === 0) && (
                  <div className="text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                    <h3>太棒了！</h3>
                    <p className="text-muted">所有成员都跟上进度了，继续保持！</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
