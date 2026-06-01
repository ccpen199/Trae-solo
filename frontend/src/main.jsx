import { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './styles.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const apiRoot = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53468').replace(/\/$/, '');

const statusLabels = { lost: '寻回中', sighting: '发现线索', found: '已安置' };
const credibilityLabels = { high: '高', medium: '中', low: '低' };
const taskTypeLabels = { poster: '张贴寻宠', patrol: '巡查寻访', shelter: '临时安置', mobilize: '转发动员' };
const taskStatusLabels = { open: '待认领', in_progress: '进行中', completed: '已完成' };
const closureTypeLabels = { found: '成功寻回', false_report: '误报', withdrawn: '撤销', expired: '超期' };
const verificationLabels = { pending: '待处理', confirmed: '已确认', dismissed: '已驳回' };

function formatDistance(meters) {
  if (meters == null) return '未知距离';
  if (meters < 1000) return `${meters} 米`;
  return `${(meters / 1000).toFixed(1)} 公里`;
}

async function apiFetch(path, options) {
  const response = await fetch(`${apiRoot}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `接口返回 ${response.status}`);
  }
  return data;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [selectedReportId, setSelectedReportId] = useState(null);

  async function loadDashboard() {
    try {
      const data = await apiFetch('/api/dashboard');
      setDashboard(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function goToVerify(reportId) {
    setSelectedReportId(reportId);
    setActiveTab('verify');
  }

  const tabs = [
    ['dashboard', '业务概览'],
    ['register', '丢失登记'],
    ['clues', '线索看板'],
    ['verify', '核验流程'],
    ['tasks', '志愿任务'],
    ['cases', '结案复查'],
    ['admin', '运营视图']
  ];

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">社区协作寻宠</p>
          <h1>城市宠物寻回协作系统</h1>
          <p className="lede">集中登记走失、发现和安置信息，帮助志愿者快速核对线索与分配巡查任务。</p>
        </div>
        <div className="service-card">
          <span>后端服务</span>
          <strong>{apiRoot}</strong>
          <small className={error ? 'error' : 'ok'}>{error ? '接口异常' : '实时连接中'}</small>
        </div>
      </section>

      {error && <div className="alert">{error}</div>}

      <nav className="tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && <DashboardView dashboard={dashboard} onRefresh={loadDashboard} onGoToVerify={goToVerify} />}
      {activeTab === 'register' && <RegisterForm onRefresh={loadDashboard} onGoToVerify={goToVerify} />}
      {activeTab === 'clues' && <CluesView dashboard={dashboard} onRefresh={loadDashboard} onGoToVerify={goToVerify} />}
      {activeTab === 'verify' && <VerifyView dashboard={dashboard} selectedReportId={selectedReportId} onSelectReport={setSelectedReportId} onRefresh={loadDashboard} />}
      {activeTab === 'tasks' && <TasksView dashboard={dashboard} onRefresh={loadDashboard} />}
      {activeTab === 'cases' && <CasesView dashboard={dashboard} onRefresh={loadDashboard} />}
      {activeTab === 'admin' && <AdminView dashboard={dashboard} />}
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DashboardView({ dashboard, onRefresh, onGoToVerify }) {
  const stats = dashboard?.stats || {};
  const reportChains = dashboard?.report_chains || [];
  const clueReviewLinks = dashboard?.clue_review_links || [];
  const [selectedChain, setSelectedChain] = useState(null);

  return (
    <div className="dashboard">
      <section className="metrics">
        <Metric label="全部登记" value={stats.reports?.total || 0} />
        <Metric label="寻回中" value={stats.reports?.lost || 0} />
        <Metric label="目击线索" value={stats.clues || 0} />
        <Metric label="已安置" value={stats.reports?.found || 0} />
        <Metric label="志愿任务" value={stats.tasks?.total || 0} />
        <Metric label="已结案" value={stats.cases?.total || 0} />
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>业务链路追踪</h2>
            <button className="btn-small" onClick={onRefresh}>刷新</button>
          </div>
          <p className="muted small">点击查看单条寻宠事件的完整流程：发布 → 线索 → 核验 → 任务 → 结案</p>
          <div className="chain-list">
            {reportChains.slice(0, 6).map((chain) => (
              <article
                className={`chain-card clickable ${selectedChain?.report.id === chain.report.id ? 'selected' : ''}`}
                key={chain.report.id}
                onClick={() => setSelectedChain(selectedChain?.report.id === chain.report.id ? null : chain)}
              >
                <div className="chain-header">
                  <div>
                    <h3>{chain.report.pet_name} · {chain.report.species}</h3>
                    <p className="muted small">{chain.report.area} · {chain.report.lost_time}</p>
                  </div>
                  <div className="chain-status">
                    <span className={`status-${chain.report.status}`}>{statusLabels[chain.report.status]}</span>
                    {chain.has_case && <span className="badge confirmed">已结案</span>}
                  </div>
                </div>
                <div className="chain-progress">
                  <div className="step done">
                    <span className="step-icon">📝</span>
                    <span className="step-label">登记</span>
                  </div>
                  <div className={`step ${chain.clue_count > 0 ? 'done' : ''}`}>
                    <span className="step-icon">🔍</span>
                    <span className="step-label">线索 ({chain.clue_count})</span>
                  </div>
                  <div className={`step ${chain.verification_count > 0 ? 'done' : ''}`}>
                    <span className="step-icon">✓</span>
                    <span className="step-label">核验 ({chain.verification_count})</span>
                  </div>
                  <div className={`step ${chain.task_count > 0 ? 'done' : ''}`}>
                    <span className="step-icon">🤝</span>
                    <span className="step-label">任务 ({chain.task_count})</span>
                  </div>
                  <div className={`step ${chain.has_case ? 'done' : ''}`}>
                    <span className="step-icon">📋</span>
                    <span className="step-label">结案</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {selectedChain && (
            <div className="chain-detail">
              <div className="panel-head">
                <h3>完整业务链路 - {selectedChain.report.pet_name}</h3>
                <button className="btn-small" onClick={() => onGoToVerify(selectedChain.report.id)}>
                  进入核验 →
                </button>
              </div>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-date">{selectedChain.report.created_at}</span>
                  <div className="timeline-content">
                    <strong>📝 丢失登记</strong>
                    <p>{selectedChain.report.pet_name} ({selectedChain.report.species}) 在 {selectedChain.report.lost_location} 丢失</p>
                    {selectedChain.report.features && <p className="muted small">特征: {selectedChain.report.features}</p>}
                  </div>
                </div>
                {selectedChain.clues.map(clue => (
                  <div className="timeline-item" key={clue.id}>
                    <span className="timeline-date">{clue.created_at}</span>
                    <div className="timeline-content">
                      <strong>🔍 目击线索</strong>
                      <p>{clue.sighting_location} - {formatDistance(clue.distance_meters)}</p>
                      <p className="muted small">发现者: {clue.submitter_name} | 可信度: {credibilityLabels[clue.credibility]}</p>
                    </div>
                  </div>
                ))}
                {selectedChain.verifications.map(v => (
                  <div className="timeline-item" key={v.id}>
                    <span className="timeline-date">{v.updated_at}</span>
                    <div className="timeline-content">
                      <strong>✓ 核验记录</strong>
                      <p>状态: <span className={`status-${v.owner_action}`}>{verificationLabels[v.owner_action]}</span></p>
                      {Boolean(v.contact_made) && <p className="muted small">已联系发现者</p>}
                      {Boolean(v.meeting_arranged) && <p className="muted small">已安排见面: {v.meeting_location} @ {v.meeting_time}</p>}
                      {v.result && <p className="muted small">{v.result}</p>}
                    </div>
                  </div>
                ))}
                {selectedChain.tasks.map(task => (
                  <div className="timeline-item" key={task.id}>
                    <span className="timeline-date">{task.created_at}</span>
                    <div className="timeline-content">
                      <strong>🤝 志愿任务</strong>
                      <p>{taskTypeLabels[task.task_type]}: {task.title}</p>
                      <p className="muted small">状态: {taskStatusLabels[task.status]} | {task.volunteer_count || 0}/{task.max_volunteers || 0} 人</p>
                    </div>
                  </div>
                ))}
                {selectedChain.case && (
                  <div className="timeline-item">
                    <span className="timeline-date">{selectedChain.case.closed_at}</span>
                    <div className="timeline-content case-closed">
                      <strong>📋 结案处理</strong>
                      <p>类型: <span className={`status-${selectedChain.case.closure_type}`}>{closureTypeLabels[selectedChain.case.closure_type]}</span></p>
                      {selectedChain.case.summary && <p>{selectedChain.case.summary}</p>}
                      {Boolean(selectedChain.case.reward_settled) && <p className="muted small">悬赏已结清: {selectedChain.case.reward_note}</p>}
                      {selectedChain.case.experience && <p className="muted small">经验: {selectedChain.case.experience}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>线索-复查关联</h2></div>
          <p className="muted small">提交人、可信度、距离与审核记录的关联展示</p>
          <div className="review-list">
            {clueReviewLinks.map(link => (
              <article className="review-card" key={link.id}>
                <div className="review-header">
                  <strong>{link.sighting_location}</strong>
                  <div className="clue-badges">
                    <span className={`badge credibility-${link.credibility}`}>{credibilityLabels[link.credibility]}</span>
                    <span className="badge distance">{formatDistance(link.distance_meters)}</span>
                    {link.verification_id ? (
                      <span className={`badge ${link.owner_action}`}>{verificationLabels[link.owner_action]}</span>
                    ) : (
                      <span className="badge pending">待核验</span>
                    )}
                  </div>
                </div>
                <p className="muted small">
                  寻找: {link.pet_name} | 发现者: {link.submitter_name} | 提交: {link.created_at}
                </p>
                {link.verification_id && (
                  <div className="review-info">
                    <p className="muted small">
                      {link.contact_made ? '✓ 已联系' : '✗ 未联系'} · 
                      {link.meeting_arranged ? ' ✓ 已安排见面' : ' ✗ 未安排见面'}
                    </p>
                    <p className="muted small">更新: {link.updated_at}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>运营沉淀数据</h2></div>
        <div className="grid-2">
          <div>
            <h4>高发区域 TOP（带结案分类）</h4>
            {(stats.high_risk_areas || []).length === 0 ? <p className="muted">暂无数据</p> : (
              <div className="area-list">
                {stats.high_risk_areas.map((area, index) => (
                  <div className="area-item" key={index}>
                    <div className="area-header">
                      <strong>{area.lost_location}</strong>
                      <span className="badge">共 {area.total} 起</span>
                    </div>
                    <div className="area-stats">
                      {area.found_count > 0 && <span className="badge confirmed">✓ 找回 {area.found_count}</span>}
                      {area.false_count > 0 && <span className="badge dismissed">✗ 误报 {area.false_count}</span>}
                      {area.withdrawn_count > 0 && <span className="badge">撤销 {area.withdrawn_count}</span>}
                      {area.expired_count > 0 && <span className="badge">超期 {area.expired_count}</span>}
                      {area.reward_count > 0 && <span className="badge distance">悬赏 {area.reward_count}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4>最近寻回经验（带结案类型）</h4>
            {(stats.recent_experience || []).length === 0 ? <p className="muted">暂无数据</p> : (
              <div className="experience-list">
                {stats.recent_experience.map((item, index) => (
                  <div className="experience-item" key={index}>
                    <div className="experience-header">
                      <span className={`badge ${item.closure_type}`}>{closureTypeLabels[item.closure_type]}</span>
                      <strong>{item.pet_name}</strong>
                      <span className="muted small">{item.area}</span>
                    </div>
                    <p>{item.experience}</p>
                    {Boolean(item.reward_settled) && (
                      <p className="muted small reward-note">💰 悬赏处理: {item.reward_note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function RegisterForm({ onRefresh, onGoToVerify }) {
  const [form, setForm] = useState({
    pet_name: '',
    species: '猫',
    breed: '',
    color: '',
    features: '',
    chip_number: '',
    photo_urls: '',
    lost_location: '',
    lost_lat: 31.2304,
    lost_lng: 121.4737,
    lost_time: new Date().toISOString().slice(0, 16),
    area: '',
    reward: '',
    contact_name: '',
    contact_phone: '',
    contact_public_scope: 'phone',
    description: ''
  });
  const [created, setCreated] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const data = await apiFetch('/api/reports?limit=5');
        if (data.ok) setRecentReports(data.reports);
      } catch (e) {}
    }
    loadRecent();
  }, [created]);

  async function submitReport(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify(form) });
      setCreated(data.report);
      setForm((current) => ({
        ...current,
        pet_name: '',
        breed: '',
        color: '',
        features: '',
        chip_number: '',
        photo_urls: '',
        lost_location: '',
        area: '',
        reward: '',
        contact_name: '',
        contact_phone: '',
        description: ''
      }));
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid-2">
      <section className="panel">
        <div className="panel-head">
          <h2>丢失宠物登记</h2>
          <p className="muted">登记后可在线提交线索、核验发现者信息并安排志愿任务。</p>
        </div>
        {created && (
          <div className="success-banner">
            <div className="success-icon">✓</div>
            <div>
              <strong>登记成功: {created.pet_name}</strong>
              <p className="muted small">已创建寻回档案，编号 #{created.id}</p>
              <div className="success-actions">
                <button className="btn-primary" onClick={() => onGoToVerify(created.id)}>开始核验线索</button>
                <button className="btn-secondary" onClick={() => setCreated(null)}>继续登记</button>
              </div>
            </div>
          </div>
        )}
        <form className="form-grid" onSubmit={submitReport}>
          <Field label="宠物名称 *"><input required value={form.pet_name} onChange={(event) => update('pet_name', event.target.value)} /></Field>
          <Field label="宠物类型 *">
            <select value={form.species} onChange={(event) => update('species', event.target.value)}>
              <option>猫</option><option>狗</option><option>其他</option>
            </select>
          </Field>
          <Field label="品种"><input value={form.breed} onChange={(event) => update('breed', event.target.value)} /></Field>
          <Field label="毛色"><input value={form.color} onChange={(event) => update('color', event.target.value)} /></Field>
          <Field label="显著特征" wide><textarea placeholder="例如：戴蓝色项圈，左耳有缺口等" value={form.features} onChange={(event) => update('features', event.target.value)} /></Field>
          <Field label="芯片编号"><input placeholder="如有芯片编号" value={form.chip_number} onChange={(event) => update('chip_number', event.target.value)} /></Field>
          <Field label="照片链接 (多个用逗号分隔)"><input placeholder="宠物照片URL" value={form.photo_urls} onChange={(event) => update('photo_urls', event.target.value)} /></Field>
          <Field label="丢失地点 *" wide><input required placeholder="详细地址，如：浦东新区 世纪公园3号门" value={form.lost_location} onChange={(event) => update('lost_location', event.target.value)} /></Field>
          <Field label="丢失时间"><input type="datetime-local" value={form.lost_time} onChange={(event) => update('lost_time', event.target.value)} /></Field>
          <Field label="所在区域 *"><input required placeholder="如：浦东新区" value={form.area} onChange={(event) => update('area', event.target.value)} /></Field>
          <Field label="悬赏金额"><input placeholder="如：500元" value={form.reward} onChange={(event) => update('reward', event.target.value)} /></Field>
          <Field label="联系人姓名 *"><input required value={form.contact_name} onChange={(event) => update('contact_name', event.target.value)} /></Field>
          <Field label="联系电话 *"><input required value={form.contact_phone} onChange={(event) => update('contact_phone', event.target.value)} /></Field>
          <Field label="公开范围">
            <select value={form.contact_public_scope} onChange={(event) => update('contact_public_scope', event.target.value)}>
              <option value="phone">仅电话</option>
              <option value="all">全部公开</option>
              <option value="none">不公开</option>
            </select>
          </Field>
          <Field label="详细描述" wide><textarea placeholder="宠物性格、习惯等补充信息" value={form.description} onChange={(event) => update('description', event.target.value)} /></Field>
          <div className="form-group full-width"><button type="submit" disabled={submitting}>{submitting ? '提交中...' : '提交登记'}</button></div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>最近登记记录</h2>
          <p className="muted">已登记的宠物列表，可快速进入核验</p>
        </div>
        <div className="report-list">
          {recentReports.length === 0 && <p className="muted">暂无登记记录</p>}
          {recentReports.map((report) => (
            <article className={`report clickable ${created?.id === report.id ? 'highlight' : ''}`} key={report.id} onClick={() => report.status === 'lost' && onGoToVerify(report.id)}>
              <div>
                <h3>{report.pet_name} · {report.species}</h3>
                <p>{report.features || report.description}</p>
                {report.photo_urls && <div className="photo-preview"><img src={report.photo_urls.split(',')[0]} alt={report.pet_name} /></div>}
              </div>
              <div className="report-meta">
                <span className={`status-${report.status}`}>{statusLabels[report.status] || report.status}</span>
                <span>{report.area}</span>
                {report.chip_number && <span>芯片: {report.chip_number}</span>}
                {report.reward && <span>悬赏: {report.reward}</span>}
                {report.status === 'lost' && <button className="btn-small" onClick={(e) => { e.stopPropagation(); onGoToVerify(report.id); }}>去核验</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, wide, children }) {
  return (
    <div className={`form-group ${wide ? 'full-width' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function CluesView({ dashboard, onRefresh, onGoToVerify }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);

  const reports = dashboard?.reports || [];
  const [cluesWithDistance, setCluesWithDistance] = useState([]);
  const [selectedReport, setSelectedReport] = useState('all');
  const [credibility, setCredibility] = useState('all');
  const [distance, setDistance] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [showForm, setShowForm] = useState(false);
  const [selectedClue, setSelectedClue] = useState(null);
  const [form, setForm] = useState({
    report_id: '',
    sighting_location: '',
    sighting_lat: 31.2304,
    sighting_lng: 121.4737,
    photo_url: '',
    sighting_time: new Date().toISOString().slice(0, 16),
    credibility: 'medium',
    description: '',
    submitter_name: '',
    submitter_phone: ''
  });

  useEffect(() => {
    async function loadClues() {
      try {
        const params = new URLSearchParams({ with_distance: '1' });
        if (selectedReport !== 'all') params.append('report_id', selectedReport);
        if (credibility !== 'all') params.append('credibility', credibility);
        if (distance) params.append('max_distance', distance);
        const data = await apiFetch(`/api/clues?${params.toString()}`);
        setCluesWithDistance(data.clues || []);
      } catch (e) {
        setCluesWithDistance([]);
      }
    }
    loadClues();
  }, [selectedReport, credibility, distance, dashboard?.clues]);

  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([31.2304, 121.4737], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18
      }).addTo(mapRef.current);
    }

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const lostReports = reports.filter(r => r.status === 'lost');
    lostReports.forEach(report => {
      if (report.lost_lat && report.lost_lng) {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:#dc3545;color:white;padding:4px 10px;border-radius:4px;font-weight:bold;font-size:12px;">🐾 ${report.pet_name}</div>`,
          iconSize: [100, 28]
        });
        const marker = L.marker([report.lost_lat, report.lost_lng], { icon }).addTo(mapRef.current);
        marker.bindPopup(`<strong>丢失地点: ${report.pet_name}</strong><br/>${report.lost_location}<br/>${report.lost_time}`);
        markersRef.current.push(marker);
      }
    });

    cluesWithDistance.forEach(clue => {
      if (clue.sighting_lat && clue.sighting_lng) {
        const color = clue.credibility === 'high' ? '#28a745' : clue.credibility === 'medium' ? '#ffc107' : '#6c757d';
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${color};color:white;padding:4px 10px;border-radius:4px;font-weight:bold;font-size:12px;">📍 ${formatDistance(clue.distance_meters)}</div>`,
          iconSize: [120, 28]
        });
        const marker = L.marker([clue.sighting_lat, clue.sighting_lng], { icon }).addTo(mapRef.current);
        const report = reports.find(r => r.id === clue.report_id);
        marker.bindPopup(`
          <strong>${clue.sighting_location}</strong><br/>
          可信度: ${credibilityLabels[clue.credibility]}<br/>
          距离丢失点: ${formatDistance(clue.distance_meters)}<br/>
          宠物: ${report?.pet_name || '未知'}<br/>
          发现者: ${clue.submitter_name}<br/>
          ${clue.description}
        `);
        marker.on('click', () => setSelectedClue(clue));
        markersRef.current.push(marker);
      }
    });

    const allPoints = [
      ...lostReports.filter(r => r.lost_lat && r.lost_lng).map(r => [r.lost_lat, r.lost_lng]),
      ...cluesWithDistance.filter(c => c.sighting_lat && c.sighting_lng).map(c => [c.sighting_lat, c.sighting_lng])
    ];
    if (allPoints.length > 0) {
      mapRef.current.fitBounds(allPoints, { padding: [50, 50] });
    }
  }, [viewMode, cluesWithDistance, reports]);

  async function submitClue(event) {
    event.preventDefault();
    try {
      await apiFetch('/api/clues', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm((current) => ({ ...current, report_id: '', sighting_location: '', photo_url: '', description: '', submitter_name: '', submitter_phone: '' }));
      await onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  const currentReport = selectedReport !== 'all' ? reports.find(r => r.id === Number(selectedReport)) : null;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>线索看板</h2>
          <p className="muted">地图化展示目击地点，按距离和可信度优先核验</p>
        </div>
        <div className="view-toggle">
          <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>地图视图</button>
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>列表视图</button>
        </div>
      </div>

      <div className="filter-row">
        <select value={selectedReport} onChange={(event) => { setSelectedReport(event.target.value); setSelectedClue(null); }}>
          <option value="all">全部宠物</option>
          {reports.filter((report) => report.status === 'lost').map((report) => <option key={report.id} value={report.id}>{report.pet_name}</option>)}
        </select>
        <select value={credibility} onChange={(event) => setCredibility(event.target.value)}>
          <option value="all">全部可信度</option>
          <option value="high">高可信度</option>
          <option value="medium">中可信度</option>
          <option value="low">低可信度</option>
        </select>
        <select value={distance} onChange={(event) => setDistance(event.target.value)}>
          <option value="">全部距离</option>
          <option value="500">500米内</option>
          <option value="1000">1公里内</option>
          <option value="3000">3公里内</option>
          <option value="5000">5公里内</option>
        </select>
        <button className="btn-primary" onClick={() => setShowForm((value) => !value)}>提交线索</button>
      </div>

      {currentReport && (
        <div className="report-banner">
          <div>
            <strong>当前查看: {currentReport.pet_name}</strong>
            <span className="muted"> · 丢失于 {currentReport.lost_location}</span>
          </div>
          <button className="btn-primary" onClick={() => onGoToVerify(currentReport.id)}>进入核验流程 →</button>
        </div>
      )}

      {showForm && (
        <form className="form-inline" onSubmit={submitClue}>
          <h4>提交新线索</h4>
          <select required value={form.report_id} onChange={(event) => setForm({ ...form, report_id: event.target.value })}>
            <option value="">选择宠物</option>
            {reports.filter((report) => report.status === 'lost').map((report) => <option key={report.id} value={report.id}>{report.pet_name}</option>)}
          </select>
          <input required placeholder="目击地点" value={form.sighting_location} onChange={(event) => setForm({ ...form, sighting_location: event.target.value })} />
          <input placeholder="照片链接" value={form.photo_url} onChange={(event) => setForm({ ...form, photo_url: event.target.value })} />
          <input type="datetime-local" value={form.sighting_time} onChange={(event) => setForm({ ...form, sighting_time: event.target.value })} />
          <select value={form.credibility} onChange={(event) => setForm({ ...form, credibility: event.target.value })}>
            <option value="high">高可信度</option>
            <option value="medium">中可信度</option>
            <option value="low">低可信度</option>
          </select>
          <input placeholder="线索描述" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input required placeholder="发现者姓名" value={form.submitter_name} onChange={(event) => setForm({ ...form, submitter_name: event.target.value })} />
          <input placeholder="联系电话" value={form.submitter_phone} onChange={(event) => setForm({ ...form, submitter_phone: event.target.value })} />
          <button type="submit">提交</button>
          <button type="button" onClick={() => setShowForm(false)}>取消</button>
        </form>
      )}

      {viewMode === 'map' && (
        <div>
          <div ref={mapContainerRef} className="map-container"></div>
          {selectedClue && (
            <div className="clue-detail">
              <div className="panel-head">
                <h3>线索详情</h3>
                <button className="btn-small" onClick={() => setSelectedClue(null)}>关闭</button>
              </div>
              <ClueDetail clue={selectedClue} report={reports.find(r => r.id === selectedClue.report_id)} onGoToVerify={onGoToVerify} />
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="clue-list">
          {cluesWithDistance.map((clue) => {
            const report = reports.find((item) => item.id === clue.report_id);
            return (
              <article className={`clue-card clickable ${selectedClue?.id === clue.id ? 'selected' : ''}`} key={clue.id} onClick={() => setSelectedClue(clue)}>
                <div className="clue-header">
                  <strong>{clue.sighting_location}</strong>
                  <div className="clue-badges">
                    <span className={`badge credibility-${clue.credibility}`}>{credibilityLabels[clue.credibility] || clue.credibility}</span>
                    <span className="badge distance">{formatDistance(clue.distance_meters)}</span>
                  </div>
                </div>
                {clue.photo_url && <div className="photo-preview"><img src={clue.photo_url} alt="线索照片" /></div>}
                <p>{clue.description}</p>
                <div className="clue-meta">
                  <span>🐾 寻找: {report?.pet_name || '未知'}</span>
                  <span>📅 {clue.sighting_time}</span>
                  <span>👤 {clue.submitter_name}</span>
                  {report?.status === 'lost' && (
                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); onGoToVerify(report.id); }}>去核验</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedClue && viewMode === 'list' && (
        <div className="clue-detail">
          <div className="panel-head">
            <h3>线索详情</h3>
            <button className="btn-small" onClick={() => setSelectedClue(null)}>关闭</button>
          </div>
          <ClueDetail clue={selectedClue} report={reports.find(r => r.id === selectedClue.report_id)} onGoToVerify={onGoToVerify} />
        </div>
      )}
    </section>
  );
}

function ClueDetail({ clue, report, onGoToVerify }) {
  if (!clue) return null;
  return (
    <div className="clue-detail-body">
      <div className="grid-2">
        <div>
          <p><strong>目击地点:</strong> {clue.sighting_location}</p>
          <p><strong>目击时间:</strong> {clue.sighting_time}</p>
          <p><strong>可信度:</strong> <span className={`badge credibility-${clue.credibility}`}>{credibilityLabels[clue.credibility]}</span></p>
          <p><strong>距离丢失点:</strong> {formatDistance(clue.distance_meters)}</p>
          <p><strong>线索描述:</strong> {clue.description}</p>
          <p><strong>提交人:</strong> {clue.submitter_name} {clue.submitter_phone}</p>
          <p><strong>关联宠物:</strong> {report?.pet_name || '未知'} ({report?.species})</p>
          {report?.features && <p><strong>宠物特征:</strong> {report.features}</p>}
        </div>
        <div>
          {clue.photo_url ? (
            <div className="photo-container"><img src={clue.photo_url} alt="线索照片" /></div>
          ) : (
            <div className="photo-placeholder">无线索照片</div>
          )}
          {report?.photo_urls && (
            <div>
              <p className="muted" style={{ marginTop: '12px' }}>宠物照片:</p>
              <div className="photo-container"><img src={report.photo_urls.split(',')[0]} alt={report.pet_name} /></div>
            </div>
          )}
        </div>
      </div>
      {report?.status === 'lost' && (
        <div className="action-bar">
          <button className="btn-primary" onClick={() => onGoToVerify(report.id)}>进入核验流程 →</button>
        </div>
      )}
    </div>
  );
}

function VerifyView({ dashboard, selectedReportId, onSelectReport, onRefresh }) {
  const reports = dashboard?.reports || [];
  const clues = dashboard?.clues || [];
  const verifications = dashboard?.verifications || [];
  const [fullReportData, setFullReportData] = useState(null);
  const [selectedClue, setSelectedClue] = useState(null);
  const [meetingForm, setMeetingForm] = useState({ meeting_time: '', meeting_location: '' });
  const [blockedSubmitters, setBlockedSubmitters] = useState(new Set());
  const [fromClueBoard, setFromClueBoard] = useState(false);

  useEffect(() => {
    if (selectedReportId) {
      setFromClueBoard(true);
      async function loadFull() {
        try {
          const data = await apiFetch(`/api/reports/${selectedReportId}/full`);
          if (data.ok) setFullReportData(data);
        } catch (e) {}
      }
      loadFull();
    } else {
      setFullReportData(null);
      setFromClueBoard(false);
    }
    setSelectedClue(null);
  }, [selectedReportId]);

  const selectedReport = selectedReportId || reports.find((report) => report.status === 'lost')?.id || null;
  const reportClues = fullReportData?.clues || clues.filter((clue) => clue.report_id === Number(selectedReport));
  const currentReport = reports.find(r => r.id === Number(selectedReport));

  async function handleVerification(clue, action) {
    const existing = (fullReportData?.verifications || verifications).find((item) => item.clue_id === clue.id);
    try {
      if (existing) {
        await apiFetch(`/api/verifications/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ owner_action: action }) });
      } else {
        await apiFetch('/api/verifications', { method: 'POST', body: JSON.stringify({ clue_id: clue.id, report_id: clue.report_id, owner_action: action }) });
      }
      if (action === 'dismissed') {
        if (clue?.submitter_name) {
          setBlockedSubmitters(prev => new Set([...prev, clue.submitter_name]));
        }
      }
      await onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateVerification(verificationId, updates) {
    try {
      await apiFetch(`/api/verifications/${verificationId}`, { method: 'PATCH', body: JSON.stringify(updates) });
      await onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function arrangeMeeting(verificationId) {
    if (!meetingForm.meeting_time || !meetingForm.meeting_location) {
      alert('请填写见面时间和地点');
      return;
    }
    await updateVerification(verificationId, {
      meeting_arranged: 1,
      meeting_time: meetingForm.meeting_time,
      meeting_location: meetingForm.meeting_location,
      result: `已安排见面：${meetingForm.meeting_location} ${meetingForm.meeting_time}`
    });
    setMeetingForm({ meeting_time: '', meeting_location: '' });
  }

  const filteredClues = reportClues.filter(clue => !blockedSubmitters.has(clue.submitter_name));

  return (
    <div>
      {fromClueBoard && currentReport && (
        <div className="flow-banner">
          <div>
            <span className="flow-indicator">线索看板 → 核验流程</span>
            <strong> 正在核验: {currentReport.pet_name} ({currentReport.species})</strong>
            <span className="muted"> · 丢失于 {currentReport.lost_location}</span>
          </div>
          <button className="btn-small" onClick={() => { onSelectReport(null); }}>切换宠物</button>
        </div>
      )}

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>选择待核验宠物</h2>
            <p className="muted">选择宠物后查看相关线索并核验</p>
          </div>
          <div className="report-list">
            {reports.filter((report) => report.status === 'lost').map((report) => (
              <article
                className={`report clickable ${Number(selectedReport) === report.id ? 'selected' : ''}`}
                key={report.id}
                onClick={() => onSelectReport(report.id)}
              >
                <div>
                  <h3>{report.pet_name} · {report.species}</h3>
                  <p>{report.features || report.description}</p>
                  {report.photo_urls && <div className="photo-preview"><img src={report.photo_urls.split(',')[0]} alt={report.pet_name} /></div>}
                </div>
                <div className="report-meta">
                  <span>{report.area}</span>
                  <span>{report.lost_time}</span>
                  <span className="hint">点击选择</span>
                </div>
              </article>
            ))}
          </div>

          {currentReport && (
            <div className="pet-info-card">
              <h4>宠物信息</h4>
              <p><strong>名称:</strong> {currentReport.pet_name}</p>
              <p><strong>类型:</strong> {currentReport.species} {currentReport.breed}</p>
              <p><strong>特征:</strong> {currentReport.features || '无'}</p>
              <p><strong>芯片:</strong> {currentReport.chip_number || '无'}</p>
              <p><strong>丢失地点:</strong> {currentReport.lost_location}</p>
              <p><strong>丢失时间:</strong> {currentReport.lost_time}</p>
              <p><strong>悬赏:</strong> {currentReport.reward || '无'}</p>
              <p><strong>联系人:</strong> {currentReport.contact_name} {currentReport.contact_public_scope !== 'none' ? currentReport.contact_phone : '(隐私保护)'}</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>线索核验流程</h2>
            <p className="muted">确认线索 → 联系发现者 → 安排见面 → 状态更新</p>
          </div>

          {!selectedReport ? (
            <div className="empty-state">
              <div className="empty-icon">🐾</div>
              <h3>请先选择宠物</h3>
              <p className="muted">从左侧列表选择一只待寻回的宠物，开始核验相关线索</p>
            </div>
          ) : filteredClues.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>暂无线索</h3>
              <p className="muted">该宠物还没有收到任何目击线索，请到线索看板提交新线索</p>
            </div>
          ) : (
            <div className="verify-list">
              <div className="flow-steps">
                <div className="flow-step active"><span>1</span> 确认线索</div>
                <div className="flow-step"><span>2</span> 联系发现者</div>
                <div className="flow-step"><span>3</span> 安排见面</div>
                <div className="flow-step"><span>4</span> 完成结案</div>
              </div>

              {filteredClues.map((clue) => {
                const v = (fullReportData?.verifications || verifications).find((ver) => ver.clue_id === clue.id);
                const isBlocked = blockedSubmitters.has(clue.submitter_name);
                return (
                  <div className={`verify-item ${selectedClue?.id === clue.id ? 'selected' : ''} ${isBlocked ? 'blocked' : ''}`} key={clue.id} onClick={() => setSelectedClue(clue)}>
                    <div className="verify-header">
                      <strong>{clue.sighting_location}</strong>
                      <div className="clue-badges">
                        <span className={`badge credibility-${clue.credibility}`}>
                          {credibilityLabels[clue.credibility]}
                        </span>
                        <span className="badge distance">{formatDistance(clue.distance_meters)}</span>
                        {v && (
                          <span className={`badge ${v.owner_action}`}>
                            {verificationLabels[v.owner_action]}
                          </span>
                        )}
                      </div>
                    </div>

                    {clue.photo_url && <div className="photo-preview"><img src={clue.photo_url} alt="线索照片" /></div>}
                    <p>{clue.description}</p>
                    <div className="clue-meta">
                      <span>发现者: {clue.submitter_name} {clue.submitter_phone}</span>
                      <span>时间: {clue.sighting_time}</span>
                    </div>

                    {selectedClue?.id === clue.id && (
                      <div className="verify-expanded" onClick={(e) => e.stopPropagation()}>
                        <div className="grid-2">
                          <div>
                            <h4>核验记录</h4>
                            {v ? (
                              <div className="verification-history">
                                <p><strong>当前状态:</strong> <span className={`status-${v.owner_action}`}>{verificationLabels[v.owner_action]}</span></p>
                                <p><strong>已联系发现者:</strong> {v.contact_made ? '✓ 是' : '✗ 否'}</p>
                                <p><strong>已安排见面:</strong> {v.meeting_arranged ? '✓ 是' : '✗ 否'}</p>
                                {Boolean(v.meeting_arranged) && (
                                  <>
                                    <p><strong>见面时间:</strong> {v.meeting_time}</p>
                                    <p><strong>见面地点:</strong> {v.meeting_location}</p>
                                  </>
                                )}
                                {v.result && <p><strong>备注:</strong> {v.result}</p>}
                                <p className="muted small">更新于: {v.updated_at}</p>
                              </div>
                            ) : (
                              <p className="muted">尚未处理此线索</p>
                            )}
                          </div>
                          <div>
                            <h4>操作</h4>
                            {!v ? (
                              <div className="verify-buttons">
                                <button className="btn-success" onClick={() => handleVerification(clue, 'confirmed')}>✓ 确认线索</button>
                                <button className="btn-danger" onClick={() => handleVerification(clue, 'dismissed')}>✗ 驳回线索</button>
                              </div>
                            ) : (
                              <div className="verify-actions">
                                <label className="checkbox-label">
                                  <input type="checkbox" checked={v.contact_made}
                                    onChange={(e) => updateVerification(v.id, { contact_made: e.target.checked ? 1 : 0 })} />
                                  已联系发现者
                                </label>
                                {Boolean(v.contact_made) && !Boolean(v.meeting_arranged) && (
                                  <div className="meeting-form">
                                    <h5>安排见面</h5>
                                    <input type="datetime-local" value={meetingForm.meeting_time}
                                      onChange={(e) => setMeetingForm({ ...meetingForm, meeting_time: e.target.value })} />
                                    <input placeholder="见面地点" value={meetingForm.meeting_location}
                                      onChange={(e) => setMeetingForm({ ...meetingForm, meeting_location: e.target.value })} />
                                    <button className="btn-primary" onClick={() => arrangeMeeting(v.id)}>确认安排</button>
                                  </div>
                                )}
                                {Boolean(v.meeting_arranged) && (
                                  <label className="checkbox-label">
                                    <input type="checkbox" checked={v.meeting_arranged} disabled />
                                    见面已安排: {v.meeting_location} {v.meeting_time}
                                  </label>
                                )}
                                <div className="verify-buttons">
                                  <button className="btn-success" onClick={() => handleVerification(clue, 'confirmed')}>标记已确认</button>
                                  <button className="btn-danger" onClick={() => handleVerification(clue, 'dismissed')}>标记已驳回</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="review-history">
                          <h4>复查记录</h4>
                          {v ? (
                            <div className="timeline">
                              <div className="timeline-item">
                                <span className="timeline-date">{v.created_at}</span>
                                <div className="timeline-content">
                                  <strong>创建核验记录</strong>
                                  <p>初始状态: {verificationLabels[v.owner_action]}</p>
                                </div>
                              </div>
                              {Boolean(v.contact_made) && (
                                <div className="timeline-item">
                                  <span className="timeline-date">{v.updated_at}</span>
                                  <div className="timeline-content">
                                    <strong>已联系发现者</strong>
                                    <p>{clue.submitter_name} {clue.submitter_phone}</p>
                                  </div>
                                </div>
                              )}
                              {Boolean(v.meeting_arranged) && (
                                <div className="timeline-item">
                                  <span className="timeline-date">{v.updated_at}</span>
                                  <div className="timeline-content">
                                    <strong>已安排见面</strong>
                                    <p>{v.meeting_location} @ {v.meeting_time}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="muted">暂无复查记录</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TasksView({ dashboard, onRefresh }) {
  const tasks = dashboard?.tasks || [];
  const reports = dashboard?.reports || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ report_id: '', task_type: 'poster', title: '', area: '', description: '', priority: 'medium', max_volunteers: 5 });

  async function submitTask(event) {
    event.preventDefault();
    try {
      await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify({ ...form, report_id: form.report_id || 0 }) });
      setShowForm(false);
      setForm({ report_id: '', task_type: 'poster', title: '', area: '', description: '', priority: 'medium', max_volunteers: 5 });
      await onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function patchTask(task, updates) {
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      await onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>志愿任务</h2>
        <button className="btn-primary" onClick={() => setShowForm((value) => !value)}>发布任务</button>
      </div>
      {showForm && (
        <form className="form-inline" onSubmit={submitTask}>
          <select value={form.report_id} onChange={(event) => setForm({ ...form, report_id: event.target.value })}>
            <option value="">不关联宠物</option>
            {reports.map((report) => <option key={report.id} value={report.id}>{report.pet_name}</option>)}
          </select>
          <select value={form.task_type} onChange={(event) => setForm({ ...form, task_type: event.target.value })}>
            {Object.entries(taskTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <input required placeholder="任务标题" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <input placeholder="区域" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} />
          <input placeholder="任务说明" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <button type="submit">发布</button>
        </form>
      )}
      <div className="task-grid">
        {tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="task-head">
              <span>{taskTypeLabels[task.task_type] || task.task_type}</span>
              <span className={`status-${task.status}`}>{taskStatusLabels[task.status] || task.status}</span>
            </div>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <div className="progress-bar"><span style={{ width: `${Math.min(100, ((task.volunteer_count || 0) / (task.max_volunteers || 1)) * 100)}%` }} /></div>
            <div className="task-meta">{task.area} · {task.volunteer_count || 0}/{task.max_volunteers || 0} 人</div>
            <div className="task-actions">
              <button className="btn-small" onClick={() => patchTask(task, { volunteer_count: Math.min((task.volunteer_count || 0) + 1, task.max_volunteers || 10) })}>认领</button>
              <button className="btn-small" onClick={() => patchTask(task, { status: 'completed', completed_at: new Date().toISOString() })}>完成</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CasesView({ dashboard, onRefresh }) {
  const reports = dashboard?.reports || [];
  const cases = dashboard?.cases || [];
  const [form, setForm] = useState({ report_id: '', closure_type: 'found', summary: '', reward_settled: false, reward_note: '', experience: '' });

  async function submitCase(event) {
    event.preventDefault();
    try {
      await apiFetch('/api/cases', { method: 'POST', body: JSON.stringify(form) });
      setForm({ report_id: '', closure_type: 'found', summary: '', reward_settled: false, reward_note: '', experience: '' });
      await onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="grid-2">
      <section className="panel">
        <div className="panel-head"><h2>结案登记</h2></div>
        <form className="form-grid" onSubmit={submitCase}>
          <Field label="关联宠物 *" wide>
            <select required value={form.report_id} onChange={(event) => setForm({ ...form, report_id: event.target.value })}>
              <option value="">选择宠物</option>
              {reports.map((report) => <option key={report.id} value={report.id}>{report.pet_name} · {report.area}</option>)}
            </select>
          </Field>
          <Field label="结案类型">
            <select value={form.closure_type} onChange={(event) => setForm({ ...form, closure_type: event.target.value })}>
              {Object.entries(closureTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </Field>
          <Field label="悬赏结清">
            <select value={form.reward_settled ? '1' : '0'} onChange={(event) => setForm({ ...form, reward_settled: event.target.value === '1' })}>
              <option value="0">未涉及</option>
              <option value="1">已结清</option>
            </select>
          </Field>
          <Field label="结案摘要" wide><textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Field>
          <Field label="经验沉淀" wide><textarea value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} /></Field>
          <div className="form-group full-width"><button type="submit">提交结案</button></div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-head"><h2>结案记录</h2></div>
        <div className="case-list">
          {cases.map((item) => {
            const report = reports.find((reportItem) => reportItem.id === item.report_id);
            return (
              <article className="case-card" key={item.id}>
                <h3>{report?.pet_name || `#${item.report_id}`} · {closureTypeLabels[item.closure_type] || item.closure_type}</h3>
                <p>{item.summary}</p>
                <p className="muted">{item.experience}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AdminView({ dashboard }) {
  const stats = dashboard?.stats || {};
  const reports = dashboard?.reports || [];
  const tasks = dashboard?.tasks || [];
  const clues = dashboard?.clues || [];
  const recoveryRate = stats.reports?.total ? Math.round(((stats.reports.found || 0) / stats.reports.total) * 100) : 0;
  const taskCompletionRate = stats.tasks?.total ? Math.round(((stats.tasks.completed || 0) / stats.tasks.total) * 100) : 0;

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>运营视图</h2>
        <p className="muted">平台运营数据概览</p>
      </div>
      <section className="metrics">
        <Metric label="登记总数" value={stats.reports?.total || 0} />
        <Metric label="寻回率" value={`${recoveryRate}%`} />
        <Metric label="线索总数" value={stats.clues || 0} />
        <Metric label="任务完成率" value={`${taskCompletionRate}%`} />
      </section>
      <div className="grid-2">
        <div>
          <h4>最近登记</h4>
          <ul>{reports.slice(0, 5).map((report) => <li key={report.id}>{report.pet_name} · {report.area}</li>)}</ul>
        </div>
        <div>
          <h4>最近线索</h4>
          <ul>{clues.slice(0, 5).map((clue) => <li key={clue.id}>{clue.sighting_location} · {clue.submitter_name}</li>)}</ul>
        </div>
        <div>
          <h4>最近任务</h4>
          <ul>{tasks.slice(0, 5).map((task) => <li key={task.id}>{task.title} · {taskStatusLabels[task.status] || task.status}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
