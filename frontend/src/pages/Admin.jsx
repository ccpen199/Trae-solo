import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminAPI, liveAPI } from '../api/index.js';
import useAuthStore from '../store/authStore.js';

const TABS = [
  { key: 'dashboard', label: '📊 数据看板' },
  { key: 'reviews', label: '📝 内容审核' },
  { key: 'copyright', label: '🔒 版权校验' },
  { key: 'live', label: '📺 直播管理' },
  { key: 'edits', label: '✏️ 影人编辑' },
  { key: 'users', label: '👥 用户管理' },
  { key: 'logs', label: '📋 审核日志' }
];

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'dashboard';
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');

  const [activeTab, setActiveTab] = useState(urlTab);

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>权限不足</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            您没有权限访问管理后台
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">登录管理员账号</Link>
            <Link to="/" className="btn btn-secondary">返回首页</Link>
          </div>
        </div>
      </div>
    );
  }
  const [stats, setStats] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [videoSources, setVideoSources] = useState([]);
  const [streams, setStreams] = useState([]);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [reviewPage, setReviewPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [sourcePage, setSourcePage] = useState(1);

  const setError = (key, msg) => setErrors(prev => ({ ...prev, [key]: msg }));
  const setLoadingKey = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  const loadStats = useCallback(async () => {
    setLoadingKey('dashboard', true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data?.data || res.data || {});
    } catch (err) {
      setError('dashboard', '加载统计数据失败');
    } finally {
      setLoadingKey('dashboard', false);
    }
  }, []);

  const loadPendingReviews = useCallback(async (page = 1) => {
    setLoadingKey('reviews', true);
    try {
      const res = await adminAPI.getPendingReviews({ page, limit: 10 });
      setPendingReviews(res.data?.data || []);
    } catch (err) {
      setError('reviews', '加载待审影评失败');
    } finally {
      setLoadingKey('reviews', false);
    }
  }, []);

  const loadVideoSources = useCallback(async (page = 1) => {
    setLoadingKey('copyright', true);
    try {
      const res = await adminAPI.getVideoSources({ page, limit: 10 });
      setVideoSources(res.data?.data || []);
    } catch (err) {
      setError('copyright', '加载片源数据失败');
    } finally {
      setLoadingKey('copyright', false);
    }
  }, []);

  const loadStreams = useCallback(async () => {
    setLoadingKey('live', true);
    try {
      const res = await liveAPI.getStreams({ limit: 20 });
      setStreams(res.data?.data || []);
    } catch (err) {
      setError('live', '加载直播数据失败');
    } finally {
      setLoadingKey('live', false);
    }
  }, []);

  const loadPendingEdits = useCallback(async () => {
    setLoadingKey('edits', true);
    try {
      const res = await adminAPI.getPendingEdits();
      setPendingEdits(res.data?.data || []);
    } catch (err) {
      setError('edits', '加载编辑建议失败');
    } finally {
      setLoadingKey('edits', false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    setLoadingKey('users', true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 10 });
      setUsers(res.data?.data || []);
    } catch (err) {
      setError('users', '加载用户数据失败');
    } finally {
      setLoadingKey('users', false);
    }
  }, []);

  const loadLogs = useCallback(async (page = 1) => {
    setLoadingKey('logs', true);
    try {
      const res = await adminAPI.getModerationLogs({ page, limit: 20 });
      setLogs(res.data?.data || []);
    } catch (err) {
      setError('logs', '加载审核日志失败');
    } finally {
      setLoadingKey('logs', false);
    }
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'dashboard': loadStats(); break;
      case 'reviews': loadPendingReviews(reviewPage); break;
      case 'copyright': loadVideoSources(sourcePage); break;
      case 'live': loadStreams(); break;
      case 'edits': loadPendingEdits(); break;
      case 'users': loadUsers(userPage); break;
      case 'logs': loadLogs(logPage); break;
      default: break;
    }
  }, [activeTab, reviewPage, userPage, logPage, sourcePage, loadStats, loadPendingReviews, loadVideoSources, loadStreams, loadPendingEdits, loadUsers, loadLogs]);

  const handleModerateReview = async (id, action) => {
    try {
      await adminAPI.moderateReview(id, { action });
      loadPendingReviews(reviewPage);
    } catch (err) {
      setError('reviews', '审核操作失败');
    }
  };

  const handleVerifySource = async (id, status) => {
    try {
      await adminAPI.verifyVideoSource(id, { status });
      loadVideoSources(sourcePage);
    } catch (err) {
      setError('copyright', '校验操作失败');
    }
  };

  const handleStreamAction = async (id, action) => {
    try {
      if (action === 'start') await liveAPI.startStream(id);
      else if (action === 'end') await liveAPI.endStream(id);
      else if (action === 'verify') await liveAPI.verifyCopyright(id, { verified: true });
      loadStreams();
    } catch (err) {
      setError('live', '直播操作失败');
    }
  };

  const handleModerateEdit = async (id, action) => {
    try {
      await adminAPI.moderateEdit(id, { action });
      loadPendingEdits();
    } catch (err) {
      setError('edits', '审核编辑建议失败');
    }
  };

  const handleUpdateUser = async (id, data) => {
    try {
      await adminAPI.updateUser(id, data);
      loadUsers(userPage);
    } catch (err) {
      setError('users', '更新用户失败');
    }
  };

  const renderDashboard = () => {
    if (loading.dashboard) return <div className="loading">加载中...</div>;
    if (errors.dashboard) return <div className="error">{errors.dashboard}</div>;
    const s = stats || {};
    const metrics = [
      { label: '🎬 电影总数', value: s.total_movies ?? s.movies ?? 0 },
      { label: '📺 剧集总数', value: s.total_tv_shows ?? s.tv_shows ?? 0 },
      { label: '🎭 影人总数', value: s.total_people ?? s.people ?? 0 },
      { label: '📝 影评总数', value: s.total_reviews ?? s.reviews ?? 0 },
      { label: '👥 用户总数', value: s.total_users ?? s.users ?? 0 },
      { label: '⏳ 待审内容', value: s.pending_moderation ?? s.pending ?? 0 }
    ];
    return (
      <div className="grid grid-3" style={{ gap: '20px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            padding: '28px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--primary)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReviews = () => {
    if (loading.reviews) return <div className="loading">加载中...</div>;
    if (errors.reviews) return <div className="error">{errors.reviews}</div>;
    if (pendingReviews.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h3>暂无待审影评</h3>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span className="badge badge-rating" style={{ fontSize: '14px', padding: '6px 14px' }}>
            ⏳ {pendingReviews.length} 条待审
          </span>
        </div>
        {pendingReviews.map(r => (
          <div key={r.id} style={{
            padding: '24px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px' }}>{r.title || '无标题'}</h4>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span>👤 {r.username || r.user_id || '匿名'}</span>
                  <span>📅 {r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN') : 'N/A'}</span>
                  <span>⭐ {r.rating ?? 'N/A'}/10</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-primary" onClick={() => handleModerateReview(r.id, 'approve')}>
                  ✅ 通过
                </button>
                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleModerateReview(r.id, 'reject')}>
                  ❌ 拒绝
                </button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              {r.content || r.text || '无内容'}
            </p>
          </div>
        ))}
        <div className="pagination">
          <button className="page-btn" disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)}>上一页</button>
          <button className="page-btn active">{reviewPage}</button>
          <button className="page-btn" onClick={() => setReviewPage(p => p + 1)}>下一页</button>
        </div>
      </div>
    );
  };

  const renderCopyright = () => {
    if (loading.copyright) return <div className="loading">加载中...</div>;
    if (errors.copyright) return <div className="error">{errors.copyright}</div>;
    if (videoSources.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>暂无片源数据</h3>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {videoSources.map(vs => (
          <div key={vs.id} style={{
            padding: '20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid var(--border)'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{vs.title || vs.name || `片源 #${vs.id}`}</span>
                {vs.verified ? (
                  <span className="badge badge-positive">✓ 已验证</span>
                ) : (
                  <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, backgroundColor: 'rgba(232,124,3,0.2)', color: 'var(--warning)' }}>
                    ⚠️ 待校验
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                <span>类型: {vs.content_type || 'N/A'}</span>
                <span>状态: {vs.status || 'N/A'}</span>
                <span>来源: {vs.source_url || vs.url || 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!vs.verified && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => handleVerifySource(vs.id, 'verified')}>
                    通过校验
                  </button>
                  <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleVerifySource(vs.id, 'rejected')}>
                    标记侵权
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        <div className="pagination">
          <button className="page-btn" disabled={sourcePage <= 1} onClick={() => setSourcePage(p => p - 1)}>上一页</button>
          <button className="page-btn active">{sourcePage}</button>
          <button className="page-btn" onClick={() => setSourcePage(p => p + 1)}>下一页</button>
        </div>
      </div>
    );
  };

  const renderLive = () => {
    if (loading.live) return <div className="loading">加载中...</div>;
    if (errors.live) return <div className="error">{errors.live}</div>;
    if (streams.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📺</div>
          <h3>暂无直播场次</h3>
        </div>
      );
    }
    const statusMap = {
      live: { label: '🔴 直播中', cls: 'badge-error' },
      upcoming: { label: '📅 待开播', cls: 'badge-rating' },
      ended: { label: '✅ 已结束', cls: 'badge-positive' }
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {streams.map(st => {
          const stInfo = statusMap[st.status] || { label: st.status, cls: 'badge-neutral' };
          return (
            <div key={st.id} style={{
              padding: '20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>{st.title}</span>
                  <span className={`badge ${stInfo.cls}`}>{stInfo.label}</span>
                  {st.is_copyright_verified && <span className="badge badge-positive">✓ 版权已验</span>}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span>🎤 {st.host_username || st.host_id || 'N/A'}</span>
                  <span>👥 {st.viewer_count ?? 0} 观看</span>
                  {st.start_time && <span>📅 {new Date(st.start_time).toLocaleString('zh-CN')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {st.status === 'upcoming' && (
                  <button className="btn btn-sm btn-primary" onClick={() => handleStreamAction(st.id, 'start')}>开播</button>
                )}
                {st.status === 'live' && (
                  <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleStreamAction(st.id, 'end')}>结束</button>
                )}
                {!st.is_copyright_verified && st.status !== 'ended' && (
                  <button className="btn btn-sm btn-outline" onClick={() => handleStreamAction(st.id, 'verify')}>版权校验</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEdits = () => {
    if (loading.edits) return <div className="loading">加载中...</div>;
    if (errors.edits) return <div className="error">{errors.edits}</div>;
    if (pendingEdits.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">✏️</div>
          <h3>暂无待审编辑建议</h3>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span className="badge badge-rating" style={{ fontSize: '14px', padding: '6px 14px' }}>
            ⏳ {pendingEdits.length} 条待审
          </span>
        </div>
        {pendingEdits.map(e => (
          <div key={e.id} style={{
            padding: '24px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px' }}>影人: {e.person_name || e.person_id || `#${e.person_id}`}</h4>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span>👤 提交者: {e.username || e.user_id || '匿名'}</span>
                  <span>📅 {e.created_at ? new Date(e.created_at).toLocaleDateString('zh-CN') : 'N/A'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-primary" onClick={() => handleModerateEdit(e.id, 'approve')}>✅ 通过</button>
                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleModerateEdit(e.id, 'reject')}>❌ 拒绝</button>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              {e.changes && typeof e.changes === 'object' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(e.changes).map(([field, val]) => (
                    <div key={field} style={{ display: 'flex', gap: '12px' }}>
                      <span className="tag" style={{ minWidth: '80px' }}>{field}</span>
                      <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span>{e.description || e.content || e.reason || '无变更描述'}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderUsers = () => {
    if (loading.users) return <div className="loading">加载中...</div>;
    if (errors.users) return <div className="error">{errors.users}</div>;
    if (users.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>暂无用户数据</h3>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {users.map(u => (
          <div key={u.id} style={{
            padding: '20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: 'var(--bg-hover)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>👤</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{u.username || u.email || `用户 #${u.id}`}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span>角色: <span className="tag">{u.role || 'user'}</span></span>
                  <span>状态: <span className={`badge ${u.status === 'active' ? 'badge-positive' : 'badge-negative'}`}>{u.status === 'active' ? '✓ 活跃' : u.status === 'banned' ? '🚫 封禁' : u.status || 'N/A'}</span></span>
                  <span>📅 {u.created_at ? new Date(u.created_at).toLocaleDateString('zh-CN') : 'N/A'}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={u.role || 'user'}
                onChange={e => handleUpdateUser(u.id, { role: e.target.value })}
                style={{ fontSize: '13px', padding: '6px 10px' }}
              >
                <option value="user">用户</option>
                <option value="moderator">审核员</option>
                <option value="admin">管理员</option>
              </select>
              {u.status === 'active' ? (
                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleUpdateUser(u.id, { status: 'banned' })}>封禁</button>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => handleUpdateUser(u.id, { status: 'active' })}>解封</button>
              )}
            </div>
          </div>
        ))}
        <div className="pagination">
          <button className="page-btn" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>上一页</button>
          <button className="page-btn active">{userPage}</button>
          <button className="page-btn" onClick={() => setUserPage(p => p + 1)}>下一页</button>
        </div>
      </div>
    );
  };

  const renderLogs = () => {
    if (loading.logs) return <div className="loading">加载中...</div>;
    if (errors.logs) return <div className="error">{errors.logs}</div>;
    if (logs.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>暂无审核日志</h3>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {logs.map(l => {
          const actionStyle = l.action === 'approve'
            ? { backgroundColor: 'rgba(70,211,105,0.2)', color: 'var(--success)' }
            : l.action === 'reject'
              ? { backgroundColor: 'rgba(229,9,20,0.2)', color: 'var(--error)' }
              : { backgroundColor: 'rgba(107,114,128,0.2)', color: 'var(--text-secondary)' };
          return (
            <div key={l.id} style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, ...actionStyle }}>
                  {l.action === 'approve' ? '✅ 通过' : l.action === 'reject' ? '❌ 拒绝' : l.action || 'N/A'}
                </span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {l.target_type || l.type || 'N/A'} #{l.target_id || l.target || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    操作人: {l.moderator_username || l.moderator_id || '系统'} · {l.reason || l.note || ''}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {l.created_at ? new Date(l.created_at).toLocaleString('zh-CN') : 'N/A'}
              </div>
            </div>
          );
        })}
        <div className="pagination">
          <button className="page-btn" disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)}>上一页</button>
          <button className="page-btn active">{logPage}</button>
          <button className="page-btn" onClick={() => setLogPage(p => p + 1)}>下一页</button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'reviews': return renderReviews();
      case 'copyright': return renderCopyright();
      case 'live': return renderLive();
      case 'edits': return renderEdits();
      case 'users': return renderUsers();
      case 'logs': return renderLogs();
      default: return null;
    }
  };

  return (
    <div className="container section">
      <style>{`
        .badge-error { background-color: rgba(229,9,20,0.2); color: var(--error); }
        .badge-warning { background-color: rgba(232,124,3,0.2); color: var(--warning); }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>🛠️ 管理后台</h1>
      </div>
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{renderTabContent()}</div>
    </div>
  );
};

export default Admin;
