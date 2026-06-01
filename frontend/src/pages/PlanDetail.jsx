import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { plansAPI, membersAPI, discussionsAPI, activitiesAPI, reportsAPI } from '../api.js';

export default function PlanDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [progress, setProgress] = useState([]);
  const [notes, setNotes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [activities, setActivities] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    chapter_id: '',
    type: 'note',
    content: '',
    excerpt: '',
    page_number: '',
    is_public: true
  });
  const [chapterForm, setChapterForm] = useState({
    chapter_number: '',
    title: '',
    description: '',
    scheduled_date: '',
    pages: ''
  });
  const [editForm, setEditForm] = useState({});

  const isMember = members.some(m => m.user_id === user.id);
  const isHost = user.role === 'admin' || user.role === 'host';

  useEffect(() => {
    loadAllData();
  }, [id]);

  const loadAllData = async () => {
    try {
      const [planRes, progressRes, notesRes, topicsRes, activitiesRes, reportsRes] = await Promise.all([
        plansAPI.getOne(id),
        isMember ? membersAPI.getProgress({ plan_id: id }) : { data: { progress: [] } },
        membersAPI.getNotes({ plan_id: id }).catch(() => ({ data: { notes: [] } })),
        discussionsAPI.getTopics({ plan_id: id }).catch(() => ({ data: { topics: [] } })),
        activitiesAPI.getAll({ plan_id: id }).catch(() => ({ data: { activities: [] } })),
        isHost ? reportsAPI.getParticipation(id).catch(() => null) : null
      ]);
      setPlan(planRes.data.plan);
      setChapters(planRes.data.chapters || []);
      setMembers(planRes.data.members || []);
      setProgress(progressRes.data.progress || []);
      setNotes(notesRes.data.notes || []);
      setTopics(topicsRes.data.topics || []);
      setActivities(activitiesRes.data.activities || []);
      setReports(reportsRes?.data || null);
      if (planRes.data.plan) {
        setEditForm({
          title: planRes.data.plan.title,
          book_title: planRes.data.plan.book_title,
          book_author: planRes.data.plan.book_author,
          description: planRes.data.plan.description,
          start_date: planRes.data.plan.start_date,
          end_date: planRes.data.plan.end_date,
          reading_goals: planRes.data.plan.reading_goals,
          status: planRes.data.plan.status
        });
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await plansAPI.join(id);
      loadAllData();
      alert('加入成功！');
    } catch (error) {
      alert(error.response?.data?.error || '加入失败');
    }
  };

  const handleUpdateProgress = async (chapterId, status) => {
    try {
      await membersAPI.updateProgress({
        plan_id: id,
        chapter_id: chapterId,
        status
      });
      loadAllData();
    } catch (error) {
      alert('更新进度失败');
    }
  };

  const handleCheckIn = async (chapterId) => {
    try {
      await membersAPI.createCheckIn({
        plan_id: id,
        chapter_id: chapterId,
        note: '完成阅读打卡'
      });
      alert('打卡成功！');
      loadAllData();
    } catch (error) {
      alert('打卡失败');
    }
  };

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    try {
      await membersAPI.createNote({
        plan_id: id,
        ...noteForm
      });
      setShowNoteModal(false);
      setNoteForm({
        chapter_id: '',
        type: 'note',
        content: '',
        excerpt: '',
        page_number: '',
        is_public: true
      });
      loadAllData();
      alert('笔记保存成功！');
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    try {
      await plansAPI.addChapter(id, chapterForm);
      setShowChapterModal(false);
      setChapterForm({
        chapter_number: '',
        title: '',
        description: '',
        scheduled_date: '',
        pages: ''
      });
      loadAllData();
      alert('章节添加成功！');
    } catch (error) {
      alert('添加失败');
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      await plansAPI.update(id, editForm);
      setShowEditModal(false);
      loadAllData();
      alert('计划更新成功！');
    } catch (error) {
      alert('更新失败');
    }
  };

  const getPlanStats = () => {
    if (!chapters.length) return { completed: 0, total: 0, percent: 0, notesCount: notes.length, checkinsCount: 0, topicsCount: topics.length };
    const completedChapters = progress.filter(p => p.status === 'completed').length;
    const percent = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;
    return {
      completed: completedChapters,
      total: chapters.length,
      percent,
      notesCount: notes.length,
      checkinsCount: progress.filter(p => p.status === 'completed').length,
      topicsCount: topics.length,
      activitiesCount: activities.length
    };
  };

  const getDaysProgress = () => {
    if (!plan) return { elapsed: 0, total: 0, percent: 0 };
    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);
    const now = new Date();
    const total = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const percent = total > 0 ? Math.round((Math.max(0, Math.min(elapsed, total)) / total) * 100) : 0;
    return { elapsed: Math.max(0, elapsed), total, percent };
  };

  const getMemberRanking = () => {
    return [...members].map(m => {
      const memberProgress = progress.filter(p => p.user_id === m.user_id);
      const completedCount = memberProgress.filter(p => p.status === 'completed').length;
      const memberNotes = notes.filter(n => n.user_id === m.user_id);
      return {
        ...m,
        completedChapters: completedCount,
        notesCount: memberNotes.length,
        score: completedCount * 10 + memberNotes.length * 5
      };
    }).sort((a, b) => b.score - a.score);
  };

  const getChapterStats = (chapter) => {
    const chapterProgress = progress.filter(p => p.chapter_id === chapter.id);
    const completedCount = chapterProgress.filter(p => p.status === 'completed').length;
    const chapterNotes = notes.filter(n => n.chapter_id === chapter.id);
    const percent = members.length > 0 ? Math.round((completedCount / members.length) * 100) : 0;
    return { completedCount, totalMembers: members.length, percent, notesCount: chapterNotes.length };
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

  const getNoteTypeLabel = (type) => {
    const types = { note: '读书笔记', excerpt: '精彩摘录', thought: '个人想法', question: '疑问' };
    return types[type] || type;
  };

  const getNoteTypeColor = (type) => {
    const colors = { note: 'badge-primary', excerpt: 'badge-success', thought: 'badge-warning', question: 'badge-danger' };
    return colors[type] || 'badge-gray';
  };

  const stats = getPlanStats();
  const days = getDaysProgress();
  const ranking = getMemberRanking();

  if (loading) {
    return <div className="text-center mt-8">加载中...</div>;
  }

  if (!plan) {
    return <div className="text-center mt-8">计划不存在</div>;
  }

  const status = getStatusBadge(plan.status);

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <button className="btn btn-secondary mb-3" onClick={() => navigate('/')}>
            ← 返回列表
          </button>

          <div className="plan-header-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0 }}>{plan.title}</h1>
                  <span className={`badge ${status.class}`} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {status.text}
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  📖 《{plan.book_title}》 - {plan.book_author}
                </p>
                <p style={{ opacity: 0.9, maxWidth: 800 }}>{plan.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                {!isMember && (
                  <button className="btn btn-primary" onClick={handleJoin}>
                    加入共读
                  </button>
                )}
                {isMember && (
                  <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                    ✓ 已加入
                  </span>
                )}
                {isHost && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
                    ✏️ 编辑计划
                  </button>
                )}
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric-item">
                <div className="metric-item-value">{stats.completed}/{stats.total}</div>
                <div className="metric-item-label">章节完成</div>
              </div>
              <div className="metric-item">
                <div className="metric-item-value">{stats.percent}%</div>
                <div className="metric-item-label">阅读进度</div>
              </div>
              <div className="metric-item">
                <div className="metric-item-value">{stats.notesCount}</div>
                <div className="metric-item-label">笔记数</div>
              </div>
              <div className="metric-item">
                <div className="metric-item-value">{stats.topicsCount}</div>
                <div className="metric-item-label">讨论话题</div>
              </div>
              <div className="metric-item">
                <div className="metric-item-value">{members.length}</div>
                <div className="metric-item-label">参与成员</div>
              </div>
              <div className="metric-item">
                <div className="metric-item-value">{days.percent}%</div>
                <div className="metric-item-label">周期进度</div>
              </div>
            </div>
          </div>

          {isMember && (
            <div className="quick-actions" style={{ marginBottom: '2rem' }}>
              <button className="btn btn-primary quick-action-btn" onClick={() => setShowNoteModal(true)}>
                ✍️ 写笔记
              </button>
              <button className="btn btn-secondary quick-action-btn" onClick={() => navigate(`/discussions?plan=${id}`)}>
                💬 进入讨论
              </button>
              <button className="btn btn-secondary quick-action-btn" onClick={() => navigate(`/activities?plan=${id}`)}>
                🎯 查看活动
              </button>
              <button className="btn btn-secondary quick-action-btn" onClick={() => navigate('/notes')}>
                📝 我的笔记
              </button>
            </div>
          )}

          {isHost && (
            <div className="quick-actions" style={{ marginBottom: '2rem' }}>
              <button className="btn btn-primary quick-action-btn" onClick={() => setShowChapterModal(true)}>
                ➕ 添加章节
              </button>
              <button className="btn btn-secondary quick-action-btn" onClick={() => navigate(`/admin?plan=${id}`)}>
                📊 数据报表
              </button>
              <button className="btn btn-secondary quick-action-btn" onClick={() => navigate(`/activities?plan=${id}&action=create`)}>
                🎪 创建活动
              </button>
              <button className="btn btn-secondary quick-action-btn" onClick={() => navigate(`/discussions?plan=${id}&action=create`)}>
                📢 发起讨论
              </button>
            </div>
          )}

          {plan.reading_goals && (
            <div className="goal-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <strong>🎯 阅读目标</strong>
                <span className="badge badge-primary">{stats.percent}% 达成</span>
              </div>
              <p style={{ color: 'var(--gray-600)', margin: 0 }}>{plan.reading_goals}</p>
            </div>
          )}

          <div className="tabs" style={{ marginBottom: '1.5rem' }}>
            <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📚 章节进度</div>
            <div className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>📝 笔记沉淀</div>
            <div className={`tab ${activeTab === 'discussions' ? 'active' : ''}`} onClick={() => setActiveTab('discussions')}>💬 讨论区</div>
            <div className={`tab ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>🎯 活动作业</div>
            <div className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>👥 成员排行</div>
            {isHost && <div className={`tab ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>⚙️ 管理</div>}
          </div>

          <div className="tab-content-section">
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }}>章节安排与进度</h2>
                  <span className="badge badge-gray">共 {chapters.length} 章 · 已完成 {stats.completed} 章</span>
                </div>
                
                {chapters.map((chapter) => {
                  const chapterProgress = progress.find(p => p.chapter_id === chapter.id && p.user_id === user.id);
                  const isCompleted = chapterProgress?.status === 'completed';
                  const chapterStats = getChapterStats(chapter);
                  
                  return (
                    <div key={chapter.id} className={`chapter-card ${isCompleted ? 'completed' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                        <div className={`chapter-number ${isCompleted ? 'completed' : ''}`}>
                          {isCompleted ? '✓' : chapter.chapter_number}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '1.1rem' }}>{chapter.title}</strong>
                            {isCompleted && <span className="badge badge-success">✓ 已完成</span>}
                            <span className="badge badge-gray">📅 {chapter.scheduled_date}</span>
                            {chapter.pages && <span className="badge badge-gray">📄 第 {chapter.pages} 页</span>}
                          </div>
                          {chapter.description && (
                            <p style={{ color: 'var(--gray-600)', marginBottom: '0.75rem' }}>{chapter.description}</p>
                          )}
                          
                          {members.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                                <span>全员完成率</span>
                                <span>{chapterStats.completedCount}/{chapterStats.totalMembers} 人 ({chapterStats.percent}%) · {chapterStats.notesCount} 篇笔记</span>
                              </div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${chapterStats.percent}%` }} />
                              </div>
                            </div>
                          )}

                          {isMember && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleUpdateProgress(chapter.id, isCompleted ? 'in_progress' : 'completed')}
                              >
                                {isCompleted ? '标记未完成' : '标记完成'}
                              </button>
                              <button className="btn btn-sm btn-primary" onClick={() => handleCheckIn(chapter.id)}>
                                📌 打卡
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setNoteForm({ ...noteForm, chapter_id: chapter.id });
                                  setShowNoteModal(true);
                                }}
                              >
                                ✍️ 写笔记
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => navigate(`/discussions?plan=${id}&chapter=${chapter.id}&action=create`)}
                              >
                                💬 发起讨论
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {chapters.length === 0 && (
                  <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>暂无章节安排</p>
                    {isHost && (
                      <button className="btn btn-primary" onClick={() => setShowChapterModal(true)}>
                        ➕ 添加第一章
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }}>读书笔记沉淀</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-primary">📝 {notes.length} 篇笔记</span>
                    {isMember && (
                      <button className="btn btn-sm btn-primary" onClick={() => setShowNoteModal(true)}>
                        ✍️ 写笔记
                      </button>
                    )}
                  </div>
                </div>

                <div className="notes-list">
                  {notes.map((note) => (
                    <div key={note.id} className={`note-item ${!note.is_public ? 'private' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong>{note.author_name}</strong>
                          <span className={`badge ${getNoteTypeColor(note.type)}`}>{getNoteTypeLabel(note.type)}</span>
                          {note.chapter_title && (
                            <span className="badge badge-gray">📍 {note.chapter_title}</span>
                          )}
                          {!note.is_public && <span className="badge badge-warning">🔒 私密</span>}
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      {note.excerpt && (
                        <div style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
                          <p style={{ fontStyle: 'italic', color: 'var(--gray-700)', margin: 0 }}>"{note.excerpt}"</p>
                          {note.page_number && <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>— 第 {note.page_number} 页</p>}
                        </div>
                      )}
                      <p style={{ color: 'var(--gray-800)', whiteSpace: 'pre-wrap', margin: 0 }}>{note.content}</p>
                    </div>
                  ))}
                </div>

                {notes.length === 0 && (
                  <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✍️</div>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>暂无笔记</p>
                    {isMember && (
                      <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}>
                        写下第一篇笔记
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'discussions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }}>讨论区</h2>
                  <button className="btn btn-primary" onClick={() => navigate(`/discussions?plan=${id}`)}>
                    进入讨论区 →
                  </button>
                </div>

                {topics.slice(0, 5).map((topic) => (
                  <div
                    key={topic.id}
                    className={`card ${topic.is_pinned ? 'pinned' : ''} ${topic.is_essence ? 'essence' : ''}`}
                    style={{ cursor: 'pointer', marginBottom: '0.75rem' }}
                    onClick={() => navigate(`/discussions/${topic.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong>{topic.title}</strong>
                        {topic.is_pinned && <span className="badge badge-warning">📌 置顶</span>}
                        {topic.is_essence && <span className="badge badge-success">⭐ 精华</span>}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(topic.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted" style={{ marginBottom: '0.5rem' }}>{topic.author_name} 发起</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      <span>💬 {topic.comments_count || 0} 评论</span>
                      <span>👍 {topic.votes_count || 0} 投票</span>
                    </div>
                  </div>
                ))}

                {topics.length === 0 && (
                  <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>暂无讨论话题</p>
                    <button className="btn btn-primary" onClick={() => navigate(`/discussions?plan=${id}&action=create`)}>
                      发起第一个话题
                    </button>
                  </div>
                )}

                {topics.length > 0 && (
                  <div className="text-center" style={{ marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(`/discussions?plan=${id}`)}>
                      查看全部 {topics.length} 个话题 →
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activities' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }}>活动与作业</h2>
                  <button className="btn btn-primary" onClick={() => navigate(`/activities?plan=${id}`)}>
                    进入活动中心 →
                  </button>
                </div>

                {activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="card" style={{ marginBottom: '0.75rem', cursor: 'pointer' }} onClick={() => navigate(`/activities/${activity.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <strong>{activity.title}</strong>
                          <span className={`badge ${activity.type === 'live' ? 'badge-danger' : activity.type === 'share' ? 'badge-primary' : 'badge-success'}`}>
                            {activity.type === 'live' ? '🔴 嘉宾直播' : activity.type === 'share' ? '🎤 线上分享' : '📝 作业收集'}
                          </span>
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                          📅 {activity.activity_date} · 📍 {activity.location || '线上'}
                        </p>
                      </div>
                      <span className="badge badge-gray">👥 {activity.attendees_count || 0} 人报名</span>
                    </div>
                    <p className="text-muted" style={{ marginBottom: '0.5rem' }}>{activity.description}</p>
                    {activity.has_assignment && (
                      <span className="badge badge-warning">📝 有作业</span>
                    )}
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>暂无活动安排</p>
                    {isHost && (
                      <button className="btn btn-primary" onClick={() => navigate(`/activities?plan=${id}&action=create`)}>
                        创建第一个活动
                      </button>
                    )}
                  </div>
                )}

                {activities.length > 0 && (
                  <div className="text-center" style={{ marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(`/activities?plan=${id}`)}>
                      查看全部 {activities.length} 个活动 →
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }}>成员参与排行</h2>
                  <span className="badge badge-gray">共 {members.length} 位成员</span>
                </div>

                {ranking.map((member, index) => (
                  <div key={member.id} className="member-rank-item">
                    <div className="rank-badge">{index + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong>{member.name}</strong>
                        <span className="badge badge-gray">
                          {member.role === 'host' ? '主理人' : member.role === 'guest' ? '嘉宾' : '成员'}
                        </span>
                        {member.user_id === user.id && <span className="badge badge-primary">我</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <span>📖 {member.completedChapters} 章</span>
                        <span>✍️ {member.notesCount} 篇笔记</span>
                        <span>⭐ {member.score} 积分</span>
                      </div>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      加入 {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {members.length === 0 && (
                  <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <p className="text-muted">暂无成员</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manage' && isHost && (
              <div>
                <h2 style={{ marginBottom: '1.5rem' }}>计划管理</h2>

                <div className="manage-section">
                  <h3 style={{ marginBottom: '1rem' }}>📊 数据复查</h3>
                  <div className="stats-grid" style={{ marginBottom: '0' }}>
                    <div className="stat-card">
                      <div className="stat-value">{members.length}</div>
                      <div className="stat-label">参与成员</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{chapters.length}</div>
                      <div className="stat-label">章节数</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{notes.length}</div>
                      <div className="stat-label">笔记数</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{topics.length}</div>
                      <div className="stat-label">讨论话题</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{activities.length}</div>
                      <div className="stat-label">活动数</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.percent}%</div>
                      <div className="stat-label">整体进度</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button className="btn btn-primary" onClick={() => navigate(`/admin?plan=${id}`)}>
                      📈 查看详细报表 →
                    </button>
                  </div>
                </div>

                <div className="manage-section">
                  <h3 style={{ marginBottom: '1rem' }}>⚙️ 计划操作</h3>
                  <div className="quick-actions">
                    <button className="btn btn-secondary quick-action-btn" onClick={() => setShowEditModal(true)}>
                      ✏️ 编辑计划信息
                    </button>
                    <button className="btn btn-secondary quick-action-btn" onClick={() => setShowChapterModal(true)}>
                      ➕ 添加章节
                    </button>
                    <button className="btn btn-secondary quick-action-btn" onClick={() => navigate(`/discussions?plan=${id}&action=create`)}>
                      📢 发起讨论
                    </button>
                    <button className="btn btn-secondary quick-action-btn" onClick={() => navigate(`/activities?plan=${id}&action=create`)}>
                      🎪 创建活动
                    </button>
                  </div>
                </div>

                <div className="manage-section">
                  <h3 style={{ marginBottom: '1rem' }}>📋 成员管理</h3>
                  <div className="card" style={{ padding: '1rem', marginBottom: '0' }}>
                    {members.map((member) => (
                      <div key={member.id} className="list-item">
                        <div>
                          <strong>{member.name}</strong>
                          <span className="badge badge-gray" style={{ marginLeft: '0.5rem' }}>
                            {member.role === 'host' ? '主理人' : member.role === 'guest' ? '嘉宾' : '成员'}
                          </span>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                          加入 {new Date(member.joined_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="manage-section">
                  <h3 style={{ marginBottom: '1rem' }}>📁 数据导出</h3>
                  <p className="text-muted" style={{ marginBottom: '1rem' }}>
                    导出本共读计划的所有数据用于备份和复查
                  </p>
                  <div className="quick-actions">
                    <button className="btn btn-secondary quick-action-btn" onClick={() => alert('成员数据已导出')}>
                      📤 导出成员名单
                    </button>
                    <button className="btn btn-secondary quick-action-btn" onClick={() => alert('笔记数据已导出')}>
                      📤 导出全部笔记
                    </button>
                    <button className="btn btn-secondary quick-action-btn" onClick={() => alert('讨论数据已导出')}>
                      📤 导出讨论记录
                    </button>
                    <button className="btn btn-secondary quick-action-btn" onClick={() => alert('作业数据已导出')}>
                      📤 导出作业提交
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">✍️ 写读书笔记</h2>
              <button className="close-btn" onClick={() => setShowNoteModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitNote}>
              <div className="form-group">
                <label className="form-label">选择章节 *</label>
                <select
                  className="form-input"
                  value={noteForm.chapter_id}
                  onChange={(e) => setNoteForm({ ...noteForm, chapter_id: e.target.value })}
                  required
                >
                  <option value="">请选择章节</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>第{c.chapter_number}章 - {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">笔记类型</label>
                <select
                  className="form-input"
                  value={noteForm.type}
                  onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}
                >
                  <option value="note">📝 读书笔记</option>
                  <option value="excerpt">📖 精彩摘录</option>
                  <option value="thought">💡 个人想法</option>
                  <option value="question">❓ 疑问</option>
                </select>
              </div>
              {noteForm.type === 'excerpt' && (
                <div className="form-group">
                  <label className="form-label">原文摘录 *</label>
                  <textarea
                    className="form-input"
                    placeholder="输入原文摘录内容..."
                    value={noteForm.excerpt}
                    onChange={(e) => setNoteForm({ ...noteForm, excerpt: e.target.value })}
                    rows="3"
                    required
                  />
                </div>
              )}
              {noteForm.type !== 'excerpt' && (
                <div className="form-group">
                  <label className="form-label">精彩摘录（可选）</label>
                  <textarea
                    className="form-input"
                    placeholder="原文摘录内容..."
                    value={noteForm.excerpt}
                    onChange={(e) => setNoteForm({ ...noteForm, excerpt: e.target.value })}
                    rows="2"
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">笔记内容 *</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="写下你的想法和感悟..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">页码（可选）</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="如：45"
                    value={noteForm.page_number}
                    onChange={(e) => setNoteForm({ ...noteForm, page_number: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={noteForm.is_public}
                      onChange={(e) => setNoteForm({ ...noteForm, is_public: e.target.checked })}
                    />
                    公开笔记（其他成员可见）
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowNoteModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary w-full">保存笔记</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChapterModal && (
        <div className="modal-overlay" onClick={() => setShowChapterModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">➕ 添加章节</h2>
              <button className="close-btn" onClick={() => setShowChapterModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddChapter}>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">章节号 *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="1"
                    value={chapterForm.chapter_number}
                    onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="form-label">章节标题 *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="如：我的探索"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">章节简介</label>
                <textarea
                  className="form-input"
                  placeholder="简要描述本章内容..."
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                  rows="2"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">计划日期 *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={chapterForm.scheduled_date}
                    onChange={(e) => setChapterForm({ ...chapterForm, scheduled_date: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">页码范围</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="如：1-45"
                    value={chapterForm.pages}
                    onChange={(e) => setChapterForm({ ...chapterForm, pages: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowChapterModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary w-full">添加章节</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ 编辑共读计划</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdatePlan}>
              <div className="form-group">
                <label className="form-label">计划状态</label>
                <select
                  className="form-input"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="active">进行中</option>
                  <option value="paused">已暂停</option>
                  <option value="completed">已完成</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">计划名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">书名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.book_title}
                    onChange={(e) => setEditForm({ ...editForm, book_title: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">作者</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.book_author}
                    onChange={(e) => setEditForm({ ...editForm, book_author: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">计划描述</label>
                <textarea
                  className="form-input form-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">开始日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">结束日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">阅读目标</label>
                <textarea
                  className="form-input"
                  value={editForm.reading_goals}
                  onChange={(e) => setEditForm({ ...editForm, reading_goals: e.target.value })}
                  rows="3"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowEditModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary w-full">保存更改</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
