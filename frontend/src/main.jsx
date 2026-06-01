import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53470/api').replace(/\/$/, '');

const PAGE = {
  DASHBOARD: 'dashboard',
  PROFILE_DETAIL: 'profile_detail',
  MATCHING: 'matching',
  MATCHMAKER: 'matchmaker',
  SAFETY: 'safety',
  REPORTS: 'reports'
};

const ROLES = {
  MATCHMAKER: '红娘',
  REVIEWER: '审核员',
  CS: '客服',
  ADMIN: '管理员'
};

const ROLE_NAV = {
  '红娘': [
    { id: PAGE.DASHBOARD, label: '工作台', icon: '📊' },
    { id: PAGE.MATCHING, label: '匹配中心', icon: '💘' },
    { id: PAGE.MATCHMAKER, label: '红娘工作台', icon: '👩‍💼' }
  ],
  '审核员': [
    { id: PAGE.DASHBOARD, label: '工作台', icon: '📊' },
    { id: PAGE.PROFILE_DETAIL, label: '资料审核', icon: '📋' },
    { id: PAGE.SAFETY, label: '安全风控', icon: '🛡️' }
  ],
  '客服': [
    { id: PAGE.DASHBOARD, label: '工作台', icon: '📊' },
    { id: PAGE.SAFETY, label: '投诉处理', icon: '📨' },
    { id: PAGE.SAFETY, label: '安全风控', icon: '🛡️' }
  ],
  '管理员': [
    { id: PAGE.DASHBOARD, label: '工作台', icon: '📊' },
    { id: PAGE.MATCHING, label: '匹配中心', icon: '💘' },
    { id: PAGE.MATCHMAKER, label: '红娘工作台', icon: '👩‍💼' },
    { id: PAGE.SAFETY, label: '安全风控', icon: '🛡️' },
    { id: PAGE.REPORTS, label: '数据报表', icon: '📈' }
  ]
};

const ROLE_TODOS = {
  '红娘': [
    { text: '3位客户等待推荐匹配', type: 'match' },
    { text: '2场线下活动待确认', type: 'event' },
    { text: '5条推荐反馈待跟进', type: 'followup' }
  ],
  '审核员': [
    { text: '8份资料待审核', type: 'review' },
    { text: '3张照片审核中', type: 'photo' },
    { text: '2个举报待核实', type: 'report' }
  ],
  '客服': [
    { text: '6条投诉待处理', type: 'complaint' },
    { text: '3条敏感词待确认', type: 'sensitive' },
    { text: '2位用户申诉中', type: 'appeal' }
  ],
  '管理员': [
    { text: '查看平台整体数据', type: 'stats' },
    { text: '3个高风险用户待处理', type: 'risk' },
    { text: '2位红娘绩效待评估', type: 'perf' }
  ]
};

function App() {
  const [currentPage, setCurrentPage] = useState(PAGE.DASHBOARD);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [apiStatus, setApiStatus] = useState({ ok: true, message: '' });
  const [activeMatchmakerId, setActiveMatchmakerId] = useState(1);
  const [currentRole, setCurrentRole] = useState(ROLES.MATCHMAKER);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(`${apiBase}/dashboard`);
        if (!response.ok) throw new Error(`接口返回 ${response.status}`);
        const data = await response.json();
        setDashboard(data);
        setApiStatus({ ok: true, message: '服务连接正常' });
      } catch (err) {
        setApiStatus({ ok: false, message: err.message });
      }
    }
    loadDashboard();
  }, []);

  const navItems = useMemo(() => {
    return ROLE_NAV[currentRole] || ROLE_NAV[ROLES.MATCHMAKER];
  }, [currentRole]);

  const todos = useMemo(() => {
    return ROLE_TODOS[currentRole] || [];
  }, [currentRole]);

  function navigateTo(page, profileId = null) {
    setCurrentPage(page);
    setSelectedProfileId(profileId);
  }

  return (
    <div className="app-wrapper">
      <nav className="sidebar">
        <div className="brand">
          <h1>❤️ 良缘</h1>
          <p>严肃婚恋平台</p>
          <div className="role-selector">
            <select value={currentRole} onChange={e => setCurrentRole(e.target.value)}>
              {Object.values(ROLES).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <ul className="nav-menu">
          {navItems.map((item, idx) => (
            <li key={`${item.id}-${idx}`}>
              <button
                className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        {todos.length > 0 && (
          <div className="todo-panel">
            <h4>待办事项</h4>
            {todos.map((t, i) => (
              <div key={i} className={`todo-item todo-${t.type}`}>
                <span className="todo-dot"></span>
                <small>{t.text}</small>
              </div>
            ))}
          </div>
        )}
        <div className={`api-status ${apiStatus.ok ? 'ok' : 'error'}`}>
          <span className="status-dot"></span>
          <small>{apiStatus.message}</small>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === PAGE.DASHBOARD && (
          <DashboardPage
            dashboard={dashboard}
            onViewProfile={(id) => navigateTo(PAGE.PROFILE_DETAIL, id)}
            onNavigate={navigateTo}
            currentRole={currentRole}
          />
        )}
        {currentPage === PAGE.PROFILE_DETAIL && (
          <ProfileDetailPage
            profileId={selectedProfileId}
            onBack={() => navigateTo(PAGE.DASHBOARD)}
          />
        )}
        {currentPage === PAGE.MATCHING && (
          <MatchingPage onViewProfile={(id) => navigateTo(PAGE.PROFILE_DETAIL, id)} />
        )}
        {currentPage === PAGE.MATCHMAKER && (
          <MatchmakerPage
            matchmakerId={activeMatchmakerId}
            setMatchmakerId={setActiveMatchmakerId}
            onViewProfile={(id) => navigateTo(PAGE.PROFILE_DETAIL, id)}
          />
        )}
        {currentPage === PAGE.SAFETY && (
          <SafetyPage />
        )}
        {currentPage === PAGE.REPORTS && (
          <ReportsPage />
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, trend, onClick }) {
  return (
    <div className={`stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {trend && <small className={`stat-trend ${trend > 0 ? 'up' : 'down'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </small>}
    </div>
  );
}

function VerificationBadge({ type, verified }) {
  const labels = {
    real_name: '实名',
    photo: '头像',
    work: '工作',
    education: '学历'
  };
  return (
    <span className={`verification-badge ${verified ? 'verified' : 'unverified'}`}>
      {verified ? '✓' : '○'} {labels[type]}
    </span>
  );
}

function PrivacyBadge({ scope }) {
  const labels = { public: '公开', friends: '仅匹配可见', matchmaker: '仅红娘可见' };
  return <span className={`privacy-badge privacy-${scope || 'public'}`}>{labels[scope] || '公开'}</span>;
}

function StatusBadge({ status }) {
  const labels = {
    pending: '待确认',
    matched: '已互选',
    dating: '交往中',
    rejected: '已拒绝',
    success: '成功',
    completed: '已完成',
    scheduled: '已安排',
    active: '生效中',
    inactive: '已解除',
    resolved: '已处理',
    reviewed: '已查看',
    overdue: '已逾期'
  };
  return <span className={`status-badge status-${status}`}>{labels[status] || status}</span>;
}

function DashboardPage({ dashboard, onViewProfile, onNavigate, currentRole }) {
  const [city, setCity] = useState('全部');
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterMarital, setFilterMarital] = useState('全部');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [filterEducation, setFilterEducation] = useState('不限');
  const [filterOccupation, setFilterOccupation] = useState('');
  const [filterHobbies, setFilterHobbies] = useState('');
  const [filterChildView, setFilterChildView] = useState('不限');
  const [excludeBlacklist, setExcludeBlacklist] = useState(false);

  const cities = useMemo(() => {
    const values = new Set((dashboard?.profiles || []).map(p => p.city));
    return ['全部', ...values];
  }, [dashboard]);

  const maritalStatuses = ['全部', '未婚', '离异', '丧偶'];
  const educationOptions = ['不限', '本科以上', '硕士以上', '博士'];
  const childViewOptions = ['不限', '想要孩子', '不想要孩子', '无所谓'];

  const filteredProfiles = useMemo(() => {
    if (!dashboard?.profiles) return [];
    return dashboard.profiles.filter(p => {
      if (city !== '全部' && p.city !== city) return false;
      if (filterVerified && !(p.real_name_verified && p.photo_verified)) return false;
      if (filterMarital !== '全部' && p.marital_status !== filterMarital) return false;
      if (minAge && p.age < parseInt(minAge)) return false;
      if (maxAge && p.age > parseInt(maxAge)) return false;
      if (filterEducation !== '不限') {
        const levels = { '本科以上': ['本科', '硕士', '博士'], '硕士以上': ['硕士', '博士'], '博士': ['博士'] };
        if (levels[filterEducation] && !levels[filterEducation].includes(p.education)) return false;
      }
      if (filterOccupation && !(p.occupation || '').includes(filterOccupation)) return false;
      if (filterHobbies) {
        const hobbies = filterHobbies.split(',').map(h => h.trim()).filter(Boolean);
        const profileHobbies = (p.hobbies || '').split(',').map(h => h.trim());
        if (!hobbies.some(h => profileHobbies.includes(h))) return false;
      }
      if (filterChildView !== '不限') {
        const vals = p.values_assessment || p.values || {};
        if ((vals.child_view || '') !== filterChildView) return false;
      }
      if (excludeBlacklist && p.status === 'blocked') return false;
      return true;
    });
  }, [dashboard, city, filterVerified, filterMarital, minAge, maxAge, filterEducation, filterOccupation, filterHobbies, filterChildView, excludeBlacklist]);

  if (!dashboard) {
    return <div className="loading">加载中...</div>;
  }

  const roleLabel = { '红娘': '红娘工作台', '审核员': '审核工作台', '客服': '客服工作台', '管理员': '管理总览' };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{roleLabel[currentRole] || '工作台'}</h2>
          <p>把候选人资料、匹配评分、活动名额和沟通进展放在同一工作台中，便于快速跟进。</p>
        </div>
      </div>

      <div className="stats-grid">
        <Stat label="认证用户" value={dashboard.stats.verifiedProfiles} trend={12} />
        <Stat label="平均匹配分" value={`${dashboard.stats.averageCompatibility}%`} trend={5} />
        <Stat label="活动场次" value={dashboard.stats.upcomingEvents} />
        <Stat label="活跃沟通" value={dashboard.stats.activeChats} trend={-3} />
        <Stat label="匹配成功率" value={`${dashboard.stats.matchSuccessRate}%`} trend={8} />
        <Stat label="约见率" value={`${dashboard.stats.appointmentRate}%`} trend={15} />
        <Stat label="付费会员" value={dashboard.stats.totalVip} />
        <Stat label="待处理举报" value={dashboard.stats.pendingReports} onClick={() => onNavigate(PAGE.SAFETY)} />
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>推荐候选人</h3>
              <p>按条件筛选后查看匹配度和核心标签</p>
            </div>
          </div>

          <div className="filter-bar">
            <select value={city} onChange={e => setCity(e.target.value)}>
              {cities.map(name => <option key={name}>{name}</option>)}
            </select>
            <select value={filterMarital} onChange={e => setFilterMarital(e.target.value)}>
              {maritalStatuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="number" placeholder="最小年龄" value={minAge} onChange={e => setMinAge(e.target.value)} style={{width: '90px'}} />
            <input type="number" placeholder="最大年龄" value={maxAge} onChange={e => setMaxAge(e.target.value)} style={{width: '90px'}} />
            <select value={filterEducation} onChange={e => setFilterEducation(e.target.value)}>
              {educationOptions.map(e => <option key={e}>{e}</option>)}
            </select>
            <input placeholder="职业" value={filterOccupation} onChange={e => setFilterOccupation(e.target.value)} style={{width: '100px'}} />
            <input placeholder="兴趣(逗号分隔)" value={filterHobbies} onChange={e => setFilterHobbies(e.target.value)} style={{width: '130px'}} />
            <select value={filterChildView} onChange={e => setFilterChildView(e.target.value)}>
              {childViewOptions.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="checkbox-label">
              <input type="checkbox" checked={excludeBlacklist} onChange={e => setExcludeBlacklist(e.target.checked)} />
              排除黑名单
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={filterVerified} onChange={e => setFilterVerified(e.target.checked)} />
              仅实名认证
            </label>
          </div>

          <div className="profile-list">
            {filteredProfiles.length === 0 ? (
              <div className="empty-state">没有符合筛选条件的候选人</div>
            ) : (
              filteredProfiles.map(profile => {
                const pref = profile.preference || {};
                const vals = profile.values_assessment || profile.values || {};
                const reasons = [];
                if (profile.compatibility >= 80) reasons.push('高匹配分');
                if (profile.city) reasons.push('同城');
                if (profile.education) reasons.push('同学历');
                if (vals.child_view) reasons.push('婚育观一致');
                return (
                  <article
                    className="profile-card enhanced"
                    key={profile.id}
                    onClick={() => onViewProfile(profile.id)}
                  >
                    <div className="profile-card-left">
                      {profile.photo_url ? (
                        <img src={profile.photo_url} alt={profile.name} className="profile-photo" />
                      ) : (
                        <div className="avatar-large">{(profile.name || '?').slice(0, 1)}</div>
                      )}
                      <PrivacyBadge scope={profile.privacy_scope} />
                    </div>
                    <div className="profile-info">
                      <div className="profile-header">
                        <h4>{profile.name}</h4>
                        <span className="match-score">{profile.compatibility}%</span>
                        {profile.is_vip && <span className="vip-badge">VIP {profile.vip_level}</span>}
                      </div>
                      <p className="profile-meta">
                        {profile.age}岁 · {profile.city} · {profile.occupation || '-'} · {profile.education || '-'} · {profile.marital_status || '-'}
                      </p>
                      <div className="verification-row">
                        <VerificationBadge type="real_name" verified={profile.real_name_verified} />
                        <VerificationBadge type="photo" verified={profile.photo_verified} />
                        <VerificationBadge type="work" verified={profile.work_verified} />
                        <VerificationBadge type="education" verified={profile.education_verified} />
                      </div>
                      {(pref.age_min || pref.city || pref.education) && (
                        <div className="preference-summary">
                          <small className="pref-label">择偶：</small>
                          <small>{pref.age_min || '?'}-{pref.age_max || '?'}岁</small>
                          <small>{pref.city || '不限'}</small>
                          <small>{pref.education || '不限'}</small>
                        </div>
                      )}
                      {(vals.family_view || vals.marriage_view || vals.child_view) && (
                        <div className="values-tags">
                          {vals.family_view && <span className="value-tag">🏠 {vals.family_view}</span>}
                          {vals.marriage_view && <span className="value-tag">💍 {vals.marriage_view}</span>}
                          {vals.child_view && <span className="value-tag">👶 {vals.child_view}</span>}
                        </div>
                      )}
                      {reasons.length > 0 && (
                        <div className="match-reasons">
                          <span className="match-reason-label">推荐：</span>
                          {reasons.map(r => (
                            <span key={r} className="reason-tag">{r}</span>
                          ))}
                        </div>
                      )}
                      {profile.hobbies && (
                        <div className="tags">
                          {(profile.hobbies || '').split(',').map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="profile-actions">
                        <button className="btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onViewProfile(profile.id); }}>查看详情</button>
                        <button className="btn-primary btn-sm" onClick={e => e.stopPropagation()}>发起匹配</button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="side-stack">
          <div className="panel">
            <h3>线下活动</h3>
            <div className="event-list">
              {(dashboard.events || []).map(event => (
                <article className="event-card" key={event.id}>
                  <div className="event-header">
                    <strong>{event.title}</strong>
                    <span className="event-fee">¥{event.fee}</span>
                  </div>
                  <div className="event-meta">
                    <span>📍 {event.city}</span>
                    <span>📅 {event.starts_at}</span>
                  </div>
                  <div className="event-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${((event.registered || 0) / (event.seats || 1)) * 100}%`}}></div>
                    </div>
                    <small>{event.registered}/{event.seats} 已报名</small>
                  </div>
                  {event.description && <p className="event-desc">{event.description}</p>}
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>沟通跟进</h3>
            <div className="chat-list">
              {(dashboard.conversations || []).map(chat => (
                <article className="chat-card" key={chat.id}>
                  <div className="chat-header">
                    {chat.photo_url ? (
                      <img src={chat.photo_url} alt="" className="chat-avatar" />
                    ) : (
                      <div className="avatar-small">{(chat.name || '?').slice(0, 1)}</div>
                    )}
                    <div>
                      <strong>{chat.name}</strong>
                      {chat.real_name_verified && <span className="verified-icon">✓</span>}
                      <span className="chat-city">{chat.city}</span>
                    </div>
                    {chat.has_sensitive_words && <span className="alert-badge">⚠️</span>}
                  </div>
                  <p className="chat-preview">{chat.last_message}</p>
                  <small className="chat-time">{chat.last_message_at || chat.updated_at}</small>
                  <div className="chat-stats">
                    <span>💬 {chat.message_count || 0} 条消息</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileDetailPage({ profileId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('basic');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiBase}/profiles/${profileId}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileId]);

  if (loading) return <div className="loading">加载中...</div>;
  if (!profile?.profile) return <div className="loading">未找到资料</div>;

  const p = profile.profile;
  const photos = profile.photos || [];

  function verifStatus(field, label) {
    const verified = p[field];
    const timeField = field.replace('_verified', '_verified_at');
    const time = p[timeField] || profile[timeField];
    if (verified) return { label, status: '✓ 已通过', cls: 'ok', time };
    if (time) return { label, status: '⏳ 审核中', cls: 'reviewing', time };
    return { label, status: '○ 待认证', cls: 'pending', time: null };
  }

  const verifications = [
    verifStatus('real_name_verified', '实名认证'),
    verifStatus('photo_verified', '头像认证'),
    verifStatus('work_verified', '工作认证'),
    verifStatus('education_verified', '学历认证')
  ];

  const privacyLabels = { public: '公开', friends: '仅匹配可见', matchmaker: '仅红娘可见' };
  const privacyDescs = { public: '所有用户可见', friends: '仅互相匹配的用户可见', matchmaker: '仅红娘和客服可见' };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← 返回列表</button>
        <div>
          <h2>{p.name} · {p.age}岁</h2>
          <p>{p.city} · {p.occupation}</p>
        </div>
      </div>

      <div className="profile-detail">
        <div className="profile-sidebar">
          <div className="photo-gallery">
            <img src={p.photo_url} alt={p.name} className="main-photo" />
            <div className="photo-thumbs">
              {photos.map((photo, idx) => (
                <div key={idx} className={`thumb-wrapper ${photo.status === 'approved' ? 'approved' : 'pending'}`}>
                  <img src={photo.photo_url} alt="" className={`thumb ${photo.is_primary ? 'primary' : ''}`} />
                  <span className="thumb-status">{photo.status === 'approved' ? '✓' : '⏳'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="verification-panel enhanced">
            <h4>认证审核状态</h4>
            <div className="verification-list">
              {verifications.map((v, i) => (
                <div key={i} className={`verification-item ${v.cls}`}>
                  <span>{v.label}</span>
                  <div className="verif-detail">
                    <span className="verif-status">{v.status}</span>
                    {v.time && <small className="verif-time">{v.time}</small>}
                  </div>
                </div>
              ))}
            </div>
            <div className={`privacy-item privacy-${p.privacy_scope || 'public'}`}>
              <div>
                <span className="privacy-label">隐私可见范围</span>
                <small className="privacy-desc">{privacyDescs[p.privacy_scope || 'public']}</small>
              </div>
              <span className="privacy-value">{privacyLabels[p.privacy_scope || 'public']}</span>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="photo-audit-panel">
              <h4>照片审核结论</h4>
              {photos.map((photo, idx) => (
                <div key={idx} className="photo-audit-item">
                  <img src={photo.photo_url} alt="" className="photo-audit-thumb" />
                  <div>
                    <span className={`photo-audit-status ${photo.status}`}>
                      {photo.status === 'approved' ? '已通过' : photo.status === 'pending' ? '待审核' : '已拒绝'}
                    </span>
                    {photo.audit_note && <small className="photo-audit-note">{photo.audit_note}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="risk-panel">
            <h4>风险评估</h4>
            <div className="risk-score">
              <div className={`risk-indicator ${(p.risk_score || 0) > 60 ? 'high' : (p.risk_score || 0) > 30 ? 'medium' : 'low'}`}>
                {p.risk_score || 0} 分
              </div>
              <small>{(p.risk_score || 0) > 60 ? '高风险' : (p.risk_score || 0) > 30 ? '中风险' : '低风险'}</small>
            </div>
            {p.status !== 'active' && <div className="status-badge status-blocked">账号已封禁</div>}
          </div>
        </div>

        <div className="profile-content">
          <div className="tabs">
            <button className={tab === 'basic' ? 'active' : ''} onClick={() => setTab('basic')}>基础资料</button>
            <button className={tab === 'preference' ? 'active' : ''} onClick={() => setTab('preference')}>择偶条件</button>
            <button className={tab === 'values' ? 'active' : ''} onClick={() => setTab('values')}>价值观</button>
            <button className={tab === 'match' ? 'active' : ''} onClick={() => setTab('match')}>匹配记录</button>
            <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>活动记录</button>
            <button className={tab === 'blacklist' ? 'active' : ''} onClick={() => setTab('blacklist')}>黑名单</button>
          </div>

          <div className="tab-content">
            {tab === 'basic' && (
              <div className="info-grid">
                <InfoItem label="姓名" value={p.name} />
                <InfoItem label="性别" value={p.gender === '女' ? '女' : '男'} />
                <InfoItem label="年龄" value={`${p.age} 岁`} />
                <InfoItem label="城市" value={p.city} />
                <InfoItem label="手机" value={p.phone} />
                <InfoItem label="职业" value={p.occupation} />
                <InfoItem label="学历" value={p.education} />
                <InfoItem label="婚育状况" value={`${p.marital_status || '未知'} · ${p.children || '无'}`} />
                <InfoItem label="身高" value={p.height ? `${p.height} cm` : '-'} />
                <InfoItem label="体重" value={p.weight ? `${p.weight} kg` : '-'} />
                <InfoItem label="收入" value={p.income_range || '-'} />
                <InfoItem label="住房" value={p.housing || '-'} />
                <InfoItem label="车辆" value={p.car || '-'} />
                <InfoItem label="星座" value={p.zodiac || '-'} />
                <InfoItem label="性格" value={p.personality || '-'} />
                <InfoItem label="会员等级" value={p.is_vip ? `VIP ${p.vip_level}` : '普通会员'} />
                <div className="full-width">
                  <label>兴趣爱好</label>
                  <div className="tags">
                    {(p.hobbies || '').split(',').filter(Boolean).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
                <div className="full-width">
                  <label>个人简介</label>
                  <p>{p.about_me || '暂无介绍'}</p>
                </div>
              </div>
            )}

            {tab === 'preference' && profile.preference && (
              <div className="info-grid">
                <InfoItem label="期望年龄" value={`${profile.preference.age_min || '-'} - ${profile.preference.age_max || '-'} 岁`} />
                <InfoItem label="期望身高" value={`${profile.preference.height_min || '-'} - ${profile.preference.height_max || '-'} cm`} />
                <InfoItem label="期望城市" value={profile.preference.city || '不限'} />
                <InfoItem label="期望学历" value={profile.preference.education || '不限'} />
                <InfoItem label="期望婚史" value={profile.preference.marital_status || '不限'} />
                <InfoItem label="期望收入" value={profile.preference.income_range || '不限'} />
                <div className="full-width">
                  <label>必备条件</label>
                  <p>{profile.preference.must_have || '无'}</p>
                </div>
                <div className="full-width">
                  <label>不能接受</label>
                  <p>{profile.preference.must_not_have || '无'}</p>
                </div>
              </div>
            )}

            {tab === 'values' && profile.values && (
              <div className="values-assessment">
                <div className="values-score">
                  <strong>价值观匹配分：{profile.values.score || 0} 分</strong>
                </div>
                <div className="values-grid">
                  <ValueItem label="家庭观" value={profile.values.family_view} />
                  <ValueItem label="婚姻观" value={profile.values.marriage_view} />
                  <ValueItem label="生育观" value={profile.values.child_view} />
                  <ValueItem label="事业观" value={profile.values.career_view} />
                  <ValueItem label="金钱观" value={profile.values.money_view} />
                  <ValueItem label="生活方式" value={profile.values.life_style} />
                </div>
                <div className="full-width">
                  <label>底线原则</label>
                  <p>{profile.values.deal_breakers || '无'}</p>
                </div>
              </div>
            )}

            {tab === 'match' && (
              <div className="match-history">
                {(profile.matches || []).length === 0 ? (
                  <div className="empty-state">暂无匹配记录</div>
                ) : (
                  (profile.matches || []).map(m => (
                    <div key={m.id} className="match-record">
                      <div className="match-score-badge">{m.match_score}%</div>
                      <div className="match-info">
                        <strong>与 {m.other_name} 匹配</strong>
                        <p>匹配原因：{m.match_reasons}</p>
                        <div className="match-status-bar">
                          <StatusBadge status={m.status} />
                          {m.a_liked && <span className="like-badge">A 已喜欢</span>}
                          {m.b_liked && <span className="like-badge">B 已喜欢</span>}
                        </div>
                      </div>
                      <small>{m.created_at}</small>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'activity' && (
              <div className="event-registrations">
                <h4>报名的活动</h4>
                {(profile.event_registrations || []).length === 0 ? (
                  <div className="empty-state">暂无活动报名记录</div>
                ) : (
                  (profile.event_registrations || []).map(r => (
                    <div key={r.id} className="registration-record">
                      <div>
                        <strong>{r.title}</strong>
                        <p>{r.city} · {r.starts_at}</p>
                      </div>
                      <div className="reg-status">
                        <span className={`payment-status ${r.payment_status}`}>{r.payment_status === 'completed' ? '已付款' : '待支付'}</span>
                        <small>¥{r.amount}</small>
                      </div>
                    </div>
                  ))
                )}
                <h4>支付记录</h4>
                {(profile.payments || []).length === 0 ? (
                  <div className="empty-state">暂无支付记录</div>
                ) : (
                  (profile.payments || []).map(py => (
                    <div key={py.id} className="payment-record">
                      <div>
                        <strong>{py.payment_type === 'vip_member' ? 'VIP会员' : py.payment_type}</strong>
                        <small>{py.created_at}</small>
                      </div>
                      <div className="payment-info">
                        <span className={`payment-status ${py.status}`}>{py.status === 'success' ? '支付成功' : '处理中'}</span>
                        <strong>¥{py.amount}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'blacklist' && (
              <div className="blacklist-section">
                <h4>黑名单（{profile.blacklist?.length || 0} 人）</h4>
                {(profile.blacklist || []).length === 0 ? (
                  <div className="empty-state">黑名单为空</div>
                ) : (
                  (profile.blacklist || []).map(b => (
                    <div key={b.id} className="blacklist-item">
                      <span>{b.blocked_name}</span>
                      <small>{b.reason}</small>
                      <small>{b.created_at}</small>
                    </div>
                  ))
                )}
                <h4>被谁拉黑（{profile.blocked_by?.length || 0} 人）</h4>
                {(profile.blocked_by || []).length === 0 ? (
                  <div className="empty-state">未被任何人拉黑</div>
                ) : (
                  (profile.blocked_by || []).map(b => (
                    <div key={b.id} className="blacklist-item">
                      <span>{b.blocker_name}</span>
                      <small>{b.reason}</small>
                      <small>{b.created_at}</small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <label>{label}</label>
      <span>{value || '-'}</span>
    </div>
  );
}

function ValueItem({ label, value }) {
  return (
    <div className="value-item">
      <label>{label}</label>
      <p>{value || '-'}</p>
    </div>
  );
}

function MatchingPage({ onViewProfile }) {
  const [filters, setFilters] = useState({
    profile_id: 1,
    age_min: '',
    age_max: '',
    city: '',
    education: '',
    marital_status: '',
    verified_only: false,
    hobbies: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function generateMatches() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/matching/generate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(filters)
      });
      const data = await res.json();
      setResults(data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>智能匹配中心</h2>
          <p>基于年龄、地域、学历、价值观、兴趣爱好等多维度精准匹配</p>
        </div>
      </div>

      <div className="matching-layout">
        <div className="panel filter-panel">
          <h3>匹配条件</h3>
          <div className="form-grid">
            <div className="form-item">
              <label>为用户ID匹配</label>
              <input type="number" value={filters.profile_id} onChange={e => setFilters({...filters, profile_id: parseInt(e.target.value)})} />
            </div>
            <div className="form-item">
              <label>最小年龄</label>
              <input type="number" value={filters.age_min} onChange={e => setFilters({...filters, age_min: e.target.value})} />
            </div>
            <div className="form-item">
              <label>最大年龄</label>
              <input type="number" value={filters.age_max} onChange={e => setFilters({...filters, age_max: e.target.value})} />
            </div>
            <div className="form-item">
              <label>城市</label>
              <input value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} placeholder="如：上海" />
            </div>
            <div className="form-item">
              <label>学历</label>
              <select value={filters.education} onChange={e => setFilters({...filters, education: e.target.value})}>
                <option value="">不限</option>
                <option>本科以上</option>
                <option>硕士以上</option>
                <option>博士</option>
              </select>
            </div>
            <div className="form-item">
              <label>婚史</label>
              <select value={filters.marital_status} onChange={e => setFilters({...filters, marital_status: e.target.value})}>
                <option value="">不限</option>
                <option>未婚</option>
                <option>离异</option>
              </select>
            </div>
            <div className="form-item checkbox-item">
              <label>
                <input type="checkbox" checked={filters.verified_only} onChange={e => setFilters({...filters, verified_only: e.target.checked})} />
                仅已实名认证
              </label>
            </div>
            <div className="form-item full-width">
              <label>兴趣爱好（逗号分隔）</label>
              <input value={filters.hobbies} onChange={e => setFilters({...filters, hobbies: e.target.value})} placeholder="如：阅读,徒步,摄影" />
            </div>
            <button className="btn-primary full-width" onClick={generateMatches}>
              {loading ? '匹配中...' : '🔍 生成匹配结果'}
            </button>
          </div>
        </div>

        <div className="panel results-panel">
          <h3>匹配结果（{results.length} 人）</h3>
          <div className="matching-results">
            {results.length === 0 ? (
              <div className="empty-state">
                {loading ? '正在计算最佳匹配...' : '点击左侧按钮生成匹配结果'}
              </div>
            ) : (
              results.map((m, idx) => (
                <div key={m.profile.id} className="match-result-card">
                  <div className="match-rank">#{idx + 1}</div>
                  {m.profile.photo_url ? (
                    <img src={m.profile.photo_url} alt="" className="match-result-photo" />
                  ) : (
                    <div className="avatar">{(m.profile.name || '?').slice(0,1)}</div>
                  )}
                  <div className="match-result-info">
                    <div className="match-result-header">
                      <h4>{m.profile.name}</h4>
                      <div className="match-score-large">{m.score}分</div>
                    </div>
                    <p>{m.profile.age}岁 · {m.profile.city} · {m.profile.occupation} · {m.profile.education}</p>
                    <div className="match-reasons">
                      <span className="match-reason-label">匹配原因：</span>
                      {(m.reasons || []).map(r => (
                        <span key={r} className="reason-tag">{r}</span>
                      ))}
                    </div>
                    <div className="match-actions">
                      <button className="btn-secondary" onClick={() => onViewProfile(m.profile.id)}>查看详情</button>
                      <button className="btn-primary">发起匹配</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchmakerPage({ matchmakerId, setMatchmakerId, onViewProfile }) {
  const [tab, setTab] = useState('clients');
  const [data, setData] = useState({ clients: [], recommendations: [], appointments: [], followups: [] });
  const [matchmakers, setMatchmakers] = useState([]);
  const [showCreateRec, setShowCreateRec] = useState(false);

  function loadData() {
    async function load() {
      try {
        const [mmRes, clientsRes, recRes, aptRes, fuRes] = await Promise.all([
          fetch(`${apiBase}/matchmaker/matchmakers`),
          fetch(`${apiBase}/matchmaker/${matchmakerId}/clients`),
          fetch(`${apiBase}/matchmaker/${matchmakerId}/recommendations`),
          fetch(`${apiBase}/matchmaker/${matchmakerId}/appointments`),
          fetch(`${apiBase}/matchmaker/${matchmakerId}/followups`)
        ]);
        const [mm, clients, rec, apt, fu] = await Promise.all([
          mmRes.json(), clientsRes.json(), recRes.json(), aptRes.json(), fuRes.json()
        ]);
        setMatchmakers(mm.matchmakers || []);
        setData({
          clients: clients.clients || [],
          recommendations: rec.recommendations || [],
          appointments: apt.appointments || [],
          followups: fu.followups || []
        });
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }

  useEffect(() => {
    loadData();
  }, [matchmakerId]);

  const currentMM = matchmakers.find(m => m.id === matchmakerId);

  async function createRecommendation(e) {
    e.preventDefault();
    const form = e.target;
    const body = {
      matchmaker_id: matchmakerId,
      profile_a_id: parseInt(form.a_id.value),
      profile_b_id: parseInt(form.b_id.value),
      recommendation_reason: form.reason.value,
      recommendation_note: form.note.value
    };
    try {
      await fetch(`${apiBase}/matchmaker/${matchmakerId}/recommendations`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
      setShowCreateRec(false);
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  }

  async function updateFeedback(recId, side) {
    const text = prompt(`请输入${side === 'a' ? 'A方' : 'B方'}反馈内容`);
    if (!text) return;
    const rating = prompt('评分(1-5)', '3');
    try {
      await fetch(`${apiBase}/matchmaker/recommendations/${recId}/feedback`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ side, feedback: text, rating: parseInt(rating) || 3 })
      });
      loadData();
    } catch (err) {
      alert('更新失败');
    }
  }

  async function updateRecStatus(recId, status) {
    try {
      await fetch(`${apiBase}/matchmaker/recommendations/${recId}/status`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ status })
      });
      loadData();
    } catch (err) {
      alert('更新失败');
    }
  }

  async function confirmAttendance(aptId, side, field) {
    try {
      await fetch(`${apiBase}/matchmaker/appointments/${aptId}/attend`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ side, field })
      });
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  }

  async function fillAppointmentResult(aptId) {
    const result = prompt('请输入约见结果');
    if (!result) return;
    const plan = prompt('后续跟进计划');
    try {
      await fetch(`${apiBase}/matchmaker/appointments/${aptId}/result`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ result, follow_up_plan: plan || '' })
      });
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  }

  async function markFollowupDone(fuId) {
    const result = prompt('请输入跟进结果');
    if (!result) return;
    try {
      await fetch(`${apiBase}/matchmaker/followups/${fuId}/complete`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ result })
      });
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  }

  async function createNextFollowup(parentFuId) {
    const content = prompt('请输入下次跟进内容');
    if (!content) return;
    const date = prompt('跟进日期(YYYY-MM-DD)');
    try {
      await fetch(`${apiBase}/matchmaker/followups`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          matchmaker_id: matchmakerId,
          parent_followup_id: parentFuId,
          follow_up_content: content,
          follow_up_date: date || '',
          follow_up_type: 'client_call'
        })
      });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  }

  async function scheduleAppointment(recId) {
    const date = prompt('约见日期(YYYY-MM-DD)');
    if (!date) return;
    const time = prompt('约见时间', '14:00');
    const loc = prompt('约见地点');
    try {
      await fetch(`${apiBase}/matchmaker/appointments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          matchmaker_id: matchmakerId,
          recommendation_id: recId,
          appointment_date: date,
          appointment_time: time || '14:00',
          location: loc || ''
        })
      });
      loadData();
    } catch (err) {
      alert('安排失败');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>红娘工作台</h2>
          <p>管理客户、推荐记录、约见安排和跟进计划</p>
        </div>
        <div className="header-actions">
          <select value={matchmakerId} onChange={e => setMatchmakerId(parseInt(e.target.value))}>
            {matchmakers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.active_clients || 0} 个客户)</option>
            ))}
          </select>
          {currentMM && (
            <div className="matchmaker-info">
              <small>专长：{currentMM.specialty}</small>
              <small>从业 {currentMM.experience_years} 年</small>
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid small">
        <Stat label="活跃客户" value={data.clients.length} />
        <Stat label="推荐记录" value={data.recommendations.length} />
        <Stat label="约见安排" value={data.appointments.length} />
        <Stat label="待跟进" value={data.followups.filter(f => f.status === 'pending').length} />
      </div>

      <div className="tabs">
        <button className={tab === 'clients' ? 'active' : ''} onClick={() => setTab('clients')}>客户列表</button>
        <button className={tab === 'recommendations' ? 'active' : ''} onClick={() => setTab('recommendations')}>推荐记录</button>
        <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>约见安排</button>
        <button className={tab === 'followups' ? 'active' : ''} onClick={() => setTab('followups')}>跟进计划</button>
      </div>

      <div className="panel">
        {tab === 'clients' && (
          <div className="client-list">
            <div className="panel-actions">
              <button className="btn-primary btn-sm" onClick={() => setShowCreateRec(true)}>创建推荐</button>
            </div>
            {data.clients.length === 0 ? (
              <div className="empty-state">暂无客户</div>
            ) : (
              data.clients.map(c => (
                <div key={c.id} className="client-card">
                  {c.photo_url ? (
                    <img src={c.photo_url} alt="" className="client-photo" />
                  ) : (
                    <div className="avatar-large" style={{width: '60px', height: '60px', fontSize: '22px'}}>{(c.name || '?').slice(0, 1)}</div>
                  )}
                  <div className="client-info">
                    <div className="client-header">
                      <h4>{c.name}</h4>
                      <span className="client-age">{c.age}岁</span>
                      <span className="client-city">{c.city}</span>
                      {c.is_vip && <span className="vip-badge">VIP{c.vip_level}</span>}
                    </div>
                    <p>{c.occupation} · {c.education}</p>
                    <div className="client-stats">
                      <span>💘 {c.match_count || 0} 次匹配</span>
                      {c.last_follow_up && <span>📅 上次跟进：{c.last_follow_up}</span>}
                    </div>
                    <div className="client-actions">
                      <button className="btn-secondary btn-sm" onClick={() => onViewProfile(c.profile_id)}>查看资料</button>
                      <button className="btn-primary btn-sm" onClick={() => setShowCreateRec(true)}>创建推荐</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'recommendations' && (
          <div className="recommendation-list">
            <div className="panel-actions">
              <button className="btn-primary btn-sm" onClick={() => setShowCreateRec(true)}>创建推荐</button>
            </div>
            {showCreateRec && (
              <form className="create-form" onSubmit={createRecommendation}>
                <h4>创建新推荐</h4>
                <div className="form-grid">
                  <div className="form-item">
                    <label>A方用户ID</label>
                    <input name="a_id" type="number" required />
                  </div>
                  <div className="form-item">
                    <label>B方用户ID</label>
                    <input name="b_id" type="number" required />
                  </div>
                  <div className="form-item full-width">
                    <label>推荐理由</label>
                    <textarea name="reason" rows={3} required />
                  </div>
                  <div className="form-item full-width">
                    <label>备注</label>
                    <input name="note" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">提交</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateRec(false)}>取消</button>
                </div>
              </form>
            )}
            {data.recommendations.length === 0 ? (
              <div className="empty-state">暂无推荐记录</div>
            ) : (
              data.recommendations.map(r => {
                const aVals = r.a_values_assessment || r.a_values || {};
                const bVals = r.b_values_assessment || r.b_values || {};
                return (
                  <div key={r.id} className="recommendation-card enhanced">
                    <div className="recommendation-match">
                      {r.a_photo ? (
                        <img src={r.a_photo} alt="" className="mini-avatar" />
                      ) : (
                        <div className="avatar-small">{(r.a_name || '?').slice(0, 1)}</div>
                      )}
                      <span className="vs">VS</span>
                      {r.b_photo ? (
                        <img src={r.b_photo} alt="" className="mini-avatar" />
                      ) : (
                        <div className="avatar-small">{(r.b_name || '?').slice(0, 1)}</div>
                      )}
                      <div className="match-mini-score">{r.match_score}%</div>
                    </div>
                    <div className="recommendation-info">
                      <div className="rec-header">
                        <h4>{r.a_name} ↔ {r.b_name}</h4>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="rec-reason"><strong>推荐理由：</strong>{r.recommendation_reason}</p>
                      {r.recommendation_note && <p className="rec-note">📝 备注：{r.recommendation_note}</p>}
                      <div className="feedback-section">
                        {r.a_feedback && (
                          <div className="feedback-item">
                            <span className="feedback-label">A方反馈：</span>
                            <span>{r.a_feedback}</span>
                            {r.a_rating && <span className="rating-stars">{'★'.repeat(r.a_rating)}{'☆'.repeat(5 - r.a_rating)}</span>}
                          </div>
                        )}
                        {r.b_feedback && (
                          <div className="feedback-item">
                            <span className="feedback-label">B方反馈：</span>
                            <span>{r.b_feedback}</span>
                            {r.b_rating && <span className="rating-stars">{'★'.repeat(r.b_rating)}{'☆'.repeat(5 - r.b_rating)}</span>}
                          </div>
                        )}
                      </div>
                      {(aVals.family_view || bVals.family_view || aVals.marriage_view || bVals.marriage_view || aVals.child_view || bVals.child_view) && (
                        <div className="values-compatibility">
                          <span className="comp-label">价值观兼容：</span>
                          {aVals.family_view && bVals.family_view && (
                            <span className={`comp-item ${aVals.family_view === bVals.family_view ? 'match' : 'diff'}`}>
                              🏠家庭观{aVals.family_view === bVals.family_view ? '一致' : '不同'}
                            </span>
                          )}
                          {aVals.marriage_view && bVals.marriage_view && (
                            <span className={`comp-item ${aVals.marriage_view === bVals.marriage_view ? 'match' : 'diff'}`}>
                              💍婚姻观{aVals.marriage_view === bVals.marriage_view ? '一致' : '不同'}
                            </span>
                          )}
                          {aVals.child_view && bVals.child_view && (
                            <span className={`comp-item ${aVals.child_view === bVals.child_view ? 'match' : 'diff'}`}>
                              👶生育观{aVals.child_view === bVals.child_view ? '一致' : '不同'}
                            </span>
                          )}
                        </div>
                      )}
                      <small>{r.created_at}</small>
                      <div className="rec-actions">
                        <button className="btn-secondary btn-sm" onClick={() => updateFeedback(r.id, 'a')}>A方反馈</button>
                        <button className="btn-secondary btn-sm" onClick={() => updateFeedback(r.id, 'b')}>B方反馈</button>
                        <button className="btn-primary btn-sm" onClick={() => scheduleAppointment(r.id)}>安排约见</button>
                        <select className="status-select" value={r.status} onChange={e => updateRecStatus(r.id, e.target.value)}>
                          <option value="pending">待确认</option>
                          <option value="matched">已互选</option>
                          <option value="dating">交往中</option>
                          <option value="rejected">已拒绝</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="appointment-list">
            {data.appointments.length === 0 ? (
              <div className="empty-state">暂无约见安排</div>
            ) : (
              data.appointments.map(a => (
                <div key={a.id} className="appointment-card enhanced">
                  <div className="appointment-date">
                    <div className="date-day">{(a.appointment_date || '').slice(5)}</div>
                    <div className="date-time">{a.appointment_time}</div>
                  </div>
                  <div className="appointment-info">
                    <div className="apt-header">
                      <h4>{a.a_name} & {a.b_name}</h4>
                      <StatusBadge status={a.status} />
                    </div>
                    <p>📍 {a.location}</p>
                    <div className="apt-confirmation">
                      <span className={a.a_confirmed ? 'confirmed' : 'pending'}>A确认: {a.a_confirmed ? '✓ 已确认' : '○ 待确认'}</span>
                      <span className={a.b_confirmed ? 'confirmed' : 'pending'}>B确认: {a.b_confirmed ? '✓ 已确认' : '○ 待确认'}</span>
                      <span className={a.a_attended ? 'attended' : ''}>A出席: {a.a_attended ? '是' : '否'}</span>
                      <span className={a.b_attended ? 'attended' : ''}>B出席: {a.b_attended ? '是' : '否'}</span>
                    </div>
                    {a.result && <p className="apt-result">结果：{a.result}</p>}
                    {a.follow_up_plan && <p className="apt-followup">📋 跟进：{a.follow_up_plan}</p>}
                    <div className="apt-actions">
                      {!a.a_attended && (
                        <button className="btn-secondary btn-sm" onClick={() => confirmAttendance(a.id, 'a', 'attended')}>A确认出席</button>
                      )}
                      {!a.b_attended && (
                        <button className="btn-secondary btn-sm" onClick={() => confirmAttendance(a.id, 'b', 'attended')}>B确认出席</button>
                      )}
                      {!a.a_confirmed && (
                        <button className="btn-secondary btn-sm" onClick={() => confirmAttendance(a.id, 'a', 'confirmed')}>A确认</button>
                      )}
                      {!a.b_confirmed && (
                        <button className="btn-secondary btn-sm" onClick={() => confirmAttendance(a.id, 'b', 'confirmed')}>B确认</button>
                      )}
                      <button className="btn-primary btn-sm" onClick={() => fillAppointmentResult(a.id)}>填写结果</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'followups' && (
          <div className="followup-list">
            {data.followups.length === 0 ? (
              <div className="empty-state">暂无跟进计划</div>
            ) : (
              data.followups.map(f => (
                <div key={f.id} className="followup-card enhanced">
                  <div className="followup-header">
                    <span className={`followup-type type-${f.follow_up_type}`}>
                      {f.follow_up_type === 'appointment_followup' ? '约见回访' :
                       f.follow_up_type === 'appointment_reminder' ? '约见提醒' :
                       f.follow_up_type === 'client_call' ? '客户回访' : '其他'}
                    </span>
                    <StatusBadge status={f.status} />
                  </div>
                  <p className="followup-content">{f.follow_up_content}</p>
                  <div className="followup-meta">
                    {f.profile_name && <span>👤 {f.profile_name}</span>}
                    {f.a_name && <span>💘 {f.a_name} & {f.b_name} ({f.match_score}%)</span>}
                    <span>📅 {f.follow_up_date}</span>
                    {f.next_follow_up_date && <span>⏭️ 下次：{f.next_follow_up_date}</span>}
                  </div>
                  {f.result && <p className="followup-result">✅ 结果：{f.result}</p>}
                  <div className="followup-actions">
                    {f.status === 'pending' && (
                      <button className="btn-success btn-sm" onClick={() => markFollowupDone(f.id)}>标记完成</button>
                    )}
                    {f.status === 'pending' && (
                      <button className="btn-secondary btn-sm" onClick={() => {
                        const result = prompt('请输入跟进结果');
                        if (result) {
                          fetch(`${apiBase}/matchmaker/followups/${f.id}/complete`, {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ result })
                          }).then(() => loadData());
                        }
                      }}>填写结果</button>
                    )}
                    <button className="btn-primary btn-sm" onClick={() => createNextFollowup(f.id)}>创建下次跟进</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SafetyPage() {
  const [tab, setTab] = useState('reports');
  const [data, setData] = useState({ reports: [], blocks: [], fraudRisks: [], swLogs: [] });

  function loadData() {
    async function load() {
      try {
        const [r, b, fr, sw] = await Promise.all([
          fetch(`${apiBase}/safety/reports`),
          fetch(`${apiBase}/safety/blocks`),
          fetch(`${apiBase}/safety/fraud-risks`),
          fetch(`${apiBase}/safety/sensitive-word-logs`)
        ]);
        const [reports, blocks, fraudRisks, swLogs] = await Promise.all([
          r.json(), b.json(), fr.json(), sw.json()
        ]);
        setData({
          reports: reports.reports || [],
          blocks: blocks.blocks || [],
          fraudRisks: fraudRisks.risks || [],
          swLogs: swLogs.logs || []
        });
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleReport(id, status, result) {
    try {
      await fetch(`${apiBase}/safety/reports/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ status, handled_by: 4, handling_result: result })
      });
      alert('处理成功');
      loadData();
    } catch (err) {
      alert('处理失败');
    }
  }

  async function unblock(blockId) {
    try {
      await fetch(`${apiBase}/safety/blocks/${blockId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ status: 'inactive' })
      });
      alert('已解除拉黑');
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  }

  async function confirmFraudRisk(riskId) {
    try {
      await fetch(`${apiBase}/safety/fraud-risks/${riskId}/confirm`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ confirmed: true })
      });
      alert('已确认风险并自动拉黑');
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  }

  async function dismissFraudRisk(riskId) {
    try {
      await fetch(`${apiBase}/safety/fraud-risks/${riskId}/dismiss`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ confirmed: false })
      });
      alert('已标记为无风险');
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  }

  async function markSwHandled(logId) {
    try {
      await fetch(`${apiBase}/safety/sensitive-word-logs/${logId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ handled: true, handling_result: '已处理' })
      });
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  }

  function highlightSensitiveWords(content, words) {
    if (!content || !words) return content;
    const wordList = (words || '').split(',').map(w => w.trim()).filter(Boolean);
    let result = content;
    wordList.forEach(w => {
      result = result.replace(new RegExp(w, 'g'), `<mark class="sensitive-highlight">${w}</mark>`);
    });
    return result;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>安全风控中心</h2>
          <p>举报处理、拉黑管理、诈骗风险监控、敏感词检测</p>
        </div>
      </div>

      <div className="stats-grid small">
        <Stat label="待处理举报" value={data.reports.filter(r => r.status === 'pending').length} />
        <Stat label="已封禁账号" value={data.blocks.filter(b => b.status === 'active').length} />
        <Stat label="待处理诈骗风险" value={data.fraudRisks.filter(f => f.status === 'pending').length} />
        <Stat label="敏感词检测" value={data.swLogs.length} />
      </div>

      <div className="tabs">
        <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>
          举报处理 <span className="tab-badge">{data.reports.filter(r => r.status === 'pending').length}</span>
        </button>
        <button className={tab === 'blocks' ? 'active' : ''} onClick={() => setTab('blocks')}>拉黑管理</button>
        <button className={tab === 'fraud' ? 'active' : ''} onClick={() => setTab('fraud')}>
          诈骗风险 <span className="tab-badge">{data.fraudRisks.filter(f => f.status === 'pending').length}</span>
        </button>
        <button className={tab === 'sensitive' ? 'active' : ''} onClick={() => setTab('sensitive')}>敏感词记录</button>
      </div>

      <div className="panel">
        {tab === 'reports' && (
          <div className="safety-list">
            {data.reports.length === 0 ? (
              <div className="empty-state">暂无举报</div>
            ) : (
              data.reports.map(r => (
                <div key={r.id} className={`safety-card enhanced ${r.status === 'pending' ? 'highlight' : ''}`}>
                  <div className="reporter-info">
                    {r.reporter_photo ? (
                      <img src={r.reporter_photo} alt="" className="mini-avatar" />
                    ) : (
                      <div className="avatar-small">{(r.reporter_name || '?').slice(0, 1)}</div>
                    )}
                    <div>
                      <strong>{r.reporter_name}</strong>
                      <small>举报</small>
                    </div>
                    <span className="arrow">→</span>
                    {r.reported_photo ? (
                      <img src={r.reported_photo} alt="" className="mini-avatar" />
                    ) : (
                      <div className="avatar-small">{(r.reported_name || '?').slice(0, 1)}</div>
                    )}
                    <div>
                      <strong>{r.reported_name}</strong>
                      <span className={`risk-score-badge ${(r.reported_risk_score || 0) > 50 ? 'high' : ''}`}>
                        风险分 {r.reported_risk_score || 0}
                      </span>
                    </div>
                  </div>
                  <div className="report-content">
                    <div className="report-type">{r.report_type}</div>
                    <p>{r.report_content}</p>
                    {r.evidence && <p className="evidence">📎 证据：{r.evidence}</p>}
                    {r.handled_by && r.handling_result && (
                      <div className="handling-detail">
                        <span>处理人：{r.handler_name || '系统'}</span>
                        <span>处理时间：{r.handled_at || r.updated_at || ''}</span>
                        <p>处理结果：{r.handling_result}</p>
                      </div>
                    )}
                    {!r.handled_by && <small>{r.created_at} · 待处理</small>}
                  </div>
                  {r.status === 'pending' && (
                    <div className="safety-actions">
                      <button className="btn-success" onClick={() => handleReport(r.id, 'resolved', '已处理，拉黑用户')}>处理并拉黑</button>
                      <button className="btn-secondary" onClick={() => handleReport(r.id, 'reviewed', '标记为已查看')}>标记已查</button>
                      <button className="btn-danger" onClick={() => handleReport(r.id, 'rejected', '举报不成立，已驳回')}>驳回举报</button>
                    </div>
                  )}
                  {r.status !== 'pending' && (
                    <div className={`status-badge status-${r.status}`}>
                      {r.status === 'resolved' ? '已处理' : r.status === 'reviewed' ? '已查看' : '已驳回'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'blocks' && (
          <div className="safety-list">
            {data.blocks.length === 0 ? (
              <div className="empty-state">暂无拉黑记录</div>
            ) : (
              data.blocks.map(b => (
                <div key={b.id} className="safety-card enhanced">
                  {b.profile_photo ? (
                    <img src={b.profile_photo} alt="" className="mini-avatar" />
                  ) : (
                    <div className="avatar-small">{(b.profile_name || '?').slice(0, 1)}</div>
                  )}
                  <div className="block-info">
                    <div className="block-header">
                      <h4>{b.profile_name}</h4>
                      <span className={`risk-score-badge ${(b.risk_score || 0) > 50 ? 'high' : ''}`}>风险分 {b.risk_score || 0}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p>原因：{b.reason}</p>
                    <div className="block-meta">
                      <span>时长：{b.duration || (b.is_permanent ? '永久' : '无')}</span>
                      <span>操作人：{b.handler_name || '系统'}</span>
                      <span>{b.created_at}</span>
                    </div>
                  </div>
                  {b.status === 'active' && (
                    <button className="btn-secondary" onClick={() => unblock(b.id)}>解除拉黑</button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'fraud' && (
          <div className="safety-list">
            {data.fraudRisks.length === 0 ? (
              <div className="empty-state">暂无诈骗风险预警</div>
            ) : (
              data.fraudRisks.map(f => (
                <div key={f.id} className={`safety-card enhanced ${f.status === 'pending' ? 'highlight' : ''}`}>
                  {f.profile_photo ? (
                    <img src={f.profile_photo} alt="" className="mini-avatar" />
                  ) : (
                    <div className="avatar-small">{(f.profile_name || '?').slice(0, 1)}</div>
                  )}
                  <div className="fraud-info">
                    <div className="fraud-header">
                      <h4>{f.profile_name}</h4>
                      <span className={`risk-level risk-${f.risk_level}`}>
                        {f.risk_level === 'high' ? '🔴 高风险' : f.risk_level === 'medium' ? '🟡 中风险' : '🟢 低风险'}
                      </span>
                      <span className="fraud-score">{f.risk_score}分</span>
                    </div>
                    <p className="fraud-type">类型：{f.risk_type}</p>
                    <p>证据：{f.risk_evidence}</p>
                    <div className="fraud-meta">
                      <span>{(f.profile || {}).age || '-'}岁 · {(f.profile || {}).city || '-'} · {(f.profile || {}).occupation || '-'}</span>
                      <span>实名: {f.real_name_verified ? '✓' : '✗'}</span>
                      <span>头像: {f.photo_verified ? '✓' : '✗'}</span>
                      <span>当前风险分: {f.current_risk_score || f.risk_score}</span>
                    </div>
                  </div>
                  {f.status === 'pending' && (
                    <div className="safety-actions">
                      <button className="btn-success" onClick={() => confirmFraudRisk(f.id)}>确认风险（自动拉黑）</button>
                      <button className="btn-secondary" onClick={() => dismissFraudRisk(f.id)}>标记无风险</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'sensitive' && (
          <div className="safety-list">
            {data.swLogs.length === 0 ? (
              <div className="empty-state">暂无敏感词记录</div>
            ) : (
              data.swLogs.map(s => (
                <div key={s.id} className="safety-card enhanced">
                  {s.profile_photo ? (
                    <img src={s.profile_photo} alt="" className="mini-avatar" />
                  ) : (
                    <div className="avatar-small">{(s.profile_name || '?').slice(0, 1)}</div>
                  )}
                  <div className="sw-info">
                    <div className="sw-header">
                      <h4>{s.profile_name}</h4>
                      <span className="sw-words">敏感词：{s.sensitive_words}</span>
                    </div>
                    <p
                      className="sw-content"
                      dangerouslySetInnerHTML={{ __html: highlightSensitiveWords(s.content, s.sensitive_words) }}
                    />
                    <div className="sw-meta">
                      <span>{s.created_at}</span>
                      <span>处理人：{s.handler_name || '未处理'}</span>
                    </div>
                    {s.handling_result && <p className="sw-handling">处理结果：{s.handling_result}</p>}
                    {!s.handling_result && (
                      <div className="sw-actions">
                        <button className="btn-secondary btn-sm" onClick={() => alert('查看上下文功能开发中')}>查看上下文</button>
                        <button className="btn-primary btn-sm" onClick={() => markSwHandled(s.id)}>标记已处理</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsPage() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilter, setAuditFilter] = useState('');
  const [expandedAudit, setExpandedAudit] = useState(null);
  const [trendPeriod, setTrendPeriod] = useState('daily');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiBase}/reports/dashboard`);
        const data = await res.json();
        setData(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadComplaints() {
      try {
        const res = await fetch(`${apiBase}/reports/complaints`);
        const cdata = await res.json();
        setComplaints(cdata.complaints || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadComplaints();
  }, []);

  useEffect(() => {
    async function loadAudit() {
      try {
        const res = await fetch(`${apiBase}/reports/audit-logs${auditFilter ? `?target_type=${auditFilter}` : ''}`);
        const adata = await res.json();
        setAuditLogs(adata.logs || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadAudit();
  }, [auditFilter]);

  async function handleComplaint(id, status) {
    await fetch(`${apiBase}/reports/complaints/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ status, handled_by: 4, handling_result: '已妥善处理' })
    });
    alert('处理成功');
    const res = await fetch(`${apiBase}/reports/complaints`);
    const cdata = await res.json();
    setComplaints(cdata.complaints || []);
  }

  function exportCSV(rows, filename) {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const val = row[h] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data) return <div className="loading">加载中...</div>;

  const trendData = (data.trends || []).filter(t => trendPeriod === 'daily' || t.period === trendPeriod);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>数据报表中心</h2>
          <p>匹配成功率、约见率、付费会员、投诉、红娘服务效果</p>
        </div>
      </div>

      <div className="stats-grid">
        <Stat label="总用户数" value={data.stats.total_profiles} />
        <Stat label="实名认证" value={`${data.stats.verified_users} (${Math.round(data.stats.verified_users / (data.stats.total_profiles || 1) * 100)}%)`} />
        <Stat label="平均匹配分" value={`${data.stats.avg_match_score}%`} />
        <Stat label="总匹配数" value={data.stats.total_matches} />
        <Stat label="匹配成功率" value={`${data.stats.match_success_rate}%`} trend={12} />
        <Stat label="活动场次" value={data.stats.total_events} />
        <Stat label="活跃沟通" value={data.stats.active_conversations} />
        <Stat label="今日消息" value={data.stats.today_messages} />
        <Stat label="约见率" value={`${data.stats.appointment_rate}%`} trend={8} />
        <Stat label="付费会员" value={data.stats.paid_members} />
        <Stat label="累计营收" value={`¥${(data.stats.total_revenue || 0).toLocaleString()}`} />
        <Stat label="待处理投诉" value={data.stats.pending_complaints} />
      </div>

      <div className="tabs">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>红娘绩效</button>
        <button className={tab === 'complaints' ? 'active' : ''} onClick={() => setTab('complaints')}>投诉处理</button>
        <button className={tab === 'audit' ? 'active' : ''} onClick={() => setTab('audit')}>审计日志</button>
        <button className={tab === 'trends' ? 'active' : ''} onClick={() => setTab('trends')}>趋势分析</button>
      </div>

      <div className="panel">
        {tab === 'overview' && (
          <div>
            <div className="panel-head">
              <h3>红娘服务效果排名</h3>
              <button className="btn-secondary btn-sm" onClick={() => exportCSV(
                (data.matchmaker_performance || []).map((mm, i) => ({
                  排名: i + 1,
                  姓名: mm.name,
                  专长: mm.specialty,
                  从业年限: mm.experience_years,
                  活跃客户: mm.active_clients,
                  成功匹配: mm.success_count,
                  完成约见: mm.completed_appointments,
                  成功率: mm.success_rate,
                  推荐转化率: mm.conversion_rate || '',
                  约见出席率: mm.attendance_rate || '',
                  客户满意度: mm.satisfaction_rate || ''
                })),
                'matchmaker_performance.csv'
              )}>导出CSV</button>
            </div>
            <div className="matchmaker-ranking">
              {(data.matchmaker_performance || []).map((mm, idx) => (
                <div key={mm.id} className="mm-rank-card">
                  <div className="rank-number">#{idx + 1}</div>
                  <div className="mm-info">
                    <h4>{mm.name}</h4>
                    <p>{mm.specialty} · 从业 {mm.experience_years} 年</p>
                    <div className="mm-stats">
                      <span>👥 {mm.active_clients} 个活跃客户</span>
                      <span>💘 {mm.success_count} 次成功匹配</span>
                      <span>📅 {mm.completed_appointments} 次完成约见</span>
                      <span className="success-rate">{mm.success_rate}% 成功率</span>
                    </div>
                    <div className="mm-detail-stats">
                      {mm.conversion_rate != null && <span>推荐转化率：{mm.conversion_rate}%</span>}
                      {mm.attendance_rate != null && <span>约见出席率：{mm.attendance_rate}%</span>}
                      {mm.satisfaction_rate != null && <span>客户满意度：{mm.satisfaction_rate}%</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'complaints' && (
          <div className="complaints-list">
            {complaints.length === 0 ? (
              <div className="empty-state">暂无投诉</div>
            ) : (
              complaints.map(c => (
                <div key={c.id} className="complaint-card">
                  <div className="complaint-header">
                    <div className="complaint-type">{c.complaint_type}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="complaint-users">
                    {c.reporter_photo ? (
                      <img src={c.reporter_photo} alt="" className="mini-avatar" />
                    ) : (
                      <div className="avatar-small">{(c.reporter_name || '?').slice(0, 1)}</div>
                    )}
                    <span>{c.reporter_name}</span>
                    {c.target_name && (
                      <>
                        <span className="arrow">→</span>
                        {c.target_photo ? (
                          <img src={c.target_photo} alt="" className="mini-avatar" />
                        ) : (
                          <div className="avatar-small">{(c.target_name || '?').slice(0, 1)}</div>
                        )}
                        <span>{c.target_name}</span>
                      </>
                    )}
                  </div>
                  <p className="complaint-content">{c.complaint_content}</p>
                  <div className="complaint-meta">
                    <span>{c.created_at}</span>
                    {c.handler_name && <span>处理人：{c.handler_name}</span>}
                  </div>
                  {c.handling_result && <p className="handling-result">处理结果：{c.handling_result}</p>}
                  {c.status === 'pending' && (
                    <div className="safety-actions">
                      <button className="btn-success" onClick={() => handleComplaint(c.id, 'resolved')}>已解决</button>
                      <button className="btn-secondary" onClick={() => handleComplaint(c.id, 'reviewed')}>处理中</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div>
            <div className="panel-head">
              <div className="filter-bar">
                <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)}>
                  <option value="">全部操作</option>
                  <option value="profile">资料变更</option>
                  <option value="match">匹配操作</option>
                  <option value="report">举报处理</option>
                  <option value="complaint">投诉处理</option>
                  <option value="safety_block">拉黑操作</option>
                  <option value="appointment">约见操作</option>
                </select>
              </div>
              <button className="btn-secondary btn-sm" onClick={() => exportCSV(
                auditLogs.map(log => ({
                  时间: log.created_at,
                  操作类型: log.action,
                  目标: `${log.target_type}:${log.target_id || '-'}`,
                  操作人: log.operator_name || '系统',
                  变更摘要: (log.new_value || '').slice(0, 100)
                })),
                'audit_logs.csv'
              )}>导出CSV</button>
            </div>
            <div className="audit-list">
              {auditLogs.length === 0 ? (
                <div className="empty-state">暂无审计记录</div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id}>
                    <div
                      className="audit-record clickable"
                      onClick={() => setExpandedAudit(expandedAudit === log.id ? null : log.id)}
                    >
                      <span className="audit-time">{log.created_at}</span>
                      <span className="audit-action">{log.action}</span>
                      <span className="audit-target">{log.target_type}:{log.target_id || '-'}</span>
                      <span className="audit-operator">{log.operator_name || '系统'}</span>
                      <span className="audit-new">{(log.new_value || '').slice(0, 50)}</span>
                      <span className="audit-expand">{expandedAudit === log.id ? '▲' : '▼'}</span>
                    </div>
                    {expandedAudit === log.id && (
                      <div className="audit-detail">
                        <div className="audit-detail-row">
                          <span className="audit-detail-label">旧值：</span>
                          <span className="audit-old-value">{log.old_value || '无'}</span>
                        </div>
                        <div className="audit-detail-row">
                          <span className="audit-detail-label">新值：</span>
                          <span className="audit-new-value">{log.new_value || '无'}</span>
                        </div>
                        {log.change_summary && (
                          <div className="audit-detail-row">
                            <span className="audit-detail-label">变更摘要：</span>
                            <span>{log.change_summary}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'trends' && (
          <div className="trends-panel">
            <div className="trend-controls">
              <button className={`btn-sm ${trendPeriod === 'daily' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTrendPeriod('daily')}>按日</button>
              <button className={`btn-sm ${trendPeriod === 'weekly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTrendPeriod('weekly')}>按周</button>
            </div>
            <div className="trend-sections">
              <div className="trend-section">
                <h4>匹配成功率趋势</h4>
                <div className="trend-table">
                  <div className="trend-header-row">
                    <span>日期</span>
                    <span>成功率</span>
                    <span>变化</span>
                  </div>
                  {trendData.map((t, i) => (
                    <div key={i} className="trend-row">
                      <span>{t.date || t.period}</span>
                      <span>{t.match_success_rate || 0}%</span>
                      <span className={t.match_success_rate_change > 0 ? 'trend-up' : t.match_success_rate_change < 0 ? 'trend-down' : ''}>
                        {t.match_success_rate_change > 0 ? '+' : ''}{t.match_success_rate_change || 0}%
                      </span>
                    </div>
                  ))}
                  {trendData.length === 0 && <div className="empty-state">暂无趋势数据</div>}
                </div>
              </div>
              <div className="trend-section">
                <h4>约见率趋势</h4>
                <div className="trend-table">
                  <div className="trend-header-row">
                    <span>日期</span>
                    <span>约见率</span>
                    <span>变化</span>
                  </div>
                  {trendData.map((t, i) => (
                    <div key={i} className="trend-row">
                      <span>{t.date || t.period}</span>
                      <span>{t.appointment_rate || 0}%</span>
                      <span className={t.appointment_rate_change > 0 ? 'trend-up' : t.appointment_rate_change < 0 ? 'trend-down' : ''}>
                        {t.appointment_rate_change > 0 ? '+' : ''}{t.appointment_rate_change || 0}%
                      </span>
                    </div>
                  ))}
                  {trendData.length === 0 && <div className="empty-state">暂无趋势数据</div>}
                </div>
              </div>
              <div className="trend-section">
                <h4>付费会员趋势</h4>
                <div className="trend-table">
                  <div className="trend-header-row">
                    <span>日期</span>
                    <span>会员数</span>
                    <span>变化</span>
                  </div>
                  {trendData.map((t, i) => (
                    <div key={i} className="trend-row">
                      <span>{t.date || t.period}</span>
                      <span>{t.paid_members || 0}</span>
                      <span className={t.paid_members_change > 0 ? 'trend-up' : t.paid_members_change < 0 ? 'trend-down' : ''}>
                        {t.paid_members_change > 0 ? '+' : ''}{t.paid_members_change || 0}
                      </span>
                    </div>
                  ))}
                  {trendData.length === 0 && <div className="empty-state">暂无趋势数据</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);