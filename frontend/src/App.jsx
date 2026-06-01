import React, { useState, useEffect, Component, createContext, useContext, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 14,
            fontWeight: 500,
            background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6',
            color: '#fff',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fee2e2', color: '#991b1b', borderRadius: 8, margin: 20 }}>
          <h3>渲染错误</h3>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function SafeRoute({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

const API = '/api';

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>配置管理平台</h2>
      <NavLink to="/">概览</NavLink>
      <NavLink to="/configs">配置项</NavLink>
      <NavLink to="/rules">下发规则</NavLink>
      <NavLink to="/preview">规则预览</NavLink>
      <NavLink to="/pulls">拉取记录</NavLink>
      <NavLink to="/changes">变更流程</NavLink>
      <NavLink to="/effect">效果看板</NavLink>
      <NavLink to="/logs">系统日志</NavLink>
    </div>
  );
}

function PageHeader({ title, actions }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      <div className="btn-group">{actions}</div>
    </div>
  );
}

function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState({ items: 0, rules: 0, pulls: 0, changes: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch(`${API}/config-items`),
      apiFetch(`${API}/delivery-rules`),
      apiFetch(`${API}/client-pulls?limit=1`),
      apiFetch(`${API}/change-sets`)
    ]).then(([items, rules, pulls, changes]) => {
      setStats({ items: items.length, rules: rules.length, pulls: pulls.length, changes: changes.length });
    }).catch(err => {
      showToast(`统计加载失败: ${err.message}`, 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [showToast]);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div>
      <PageHeader title="概览" actions={
        <button className="btn btn-secondary btn-sm" onClick={loadStats} disabled={loading}>
          {loading ? '刷新中...' : '刷新数据'}
        </button>
      } />
      <div className="stat-grid">
        <div className="stat-card"><div className="label">配置项总数</div><div className="value">{stats.items}</div></div>
        <div className="stat-card"><div className="label">生效规则数</div><div className="value">{stats.rules}</div></div>
        <div className="stat-card"><div className="label">累计拉取</div><div className="value">{stats.pulls}</div></div>
        <div className="stat-card"><div className="label">变更单</div><div className="value">{stats.changes}</div></div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 10 }}>快速指引</h3>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
          1. 在「配置项」中定义开关、文案、导航、接口地址、实验参数和限流阈值。<br/>
          2. 在「下发规则」中按环境、用户组、版本、渠道、租户和时间窗定向下发。<br/>
          3. 在「规则预览」中输入上下文，查看配置命中结果。<br/>
          4. 在「变更流程」中管理草稿、审批、灰度、全量、暂停和回滚。<br/>
          5. 在「效果看板」中对比配置生效前后的指标变化。
        </p>
      </div>
    </div>
  );
}

const TYPE_LABELS = {
  switch: { label: '开关', cls: 'tag-switch' },
  text: { label: '文案', cls: 'tag-text' },
  navigation: { label: '导航', cls: 'tag-navigation' },
  api_url: { label: '接口地址', cls: 'tag-api_url' },
  experiment: { label: '实验参数', cls: 'tag-experiment' },
  rate_limit: { label: '限流阈值', cls: 'tag-rate_limit' }
};

function ConfigItems() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ key: '', name: '', type: 'switch', value_type: 'string', default_value: '', description: '', page_scope: '' });
  const [errors, setErrors] = useState({});

  const load = useCallback(() => {
    apiFetch(`${API}/config-items`)
      .then(setItems)
      .catch(err => showToast(`加载配置失败: ${err.message}`, 'error'));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e = {};
    if (!form.key.trim()) e.key = 'Key 不能为空';
    else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(form.key.trim())) e.key = 'Key 必须以字母开头，只允许字母/数字/下划线';
    if (!form.name.trim()) e.name = '名称不能为空';
    if (!form.type) e.type = '类型不能为空';
    if (form.type === 'switch' && form.value_type === 'boolean' && form.default_value !== '' && !['true', 'false'].includes(form.default_value)) e.default_value = '开关类型默认值必须为 true 或 false';
    if (form.type === 'rate_limit' && form.value_type === 'number' && form.default_value !== '' && isNaN(Number(form.default_value))) e.default_value = '限流阈值必须是数字';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      showToast('请检查表单填写', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const url = editing ? `${API}/config-items/${editing.id}` : `${API}/config-items`;
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      showToast(editing ? '配置已更新' : '配置已创建', 'success');
      setShowForm(false);
      setEditing(null);
      setForm({ key: '', name: '', type: 'switch', value_type: 'string', default_value: '', description: '', page_scope: '' });
      setErrors({});
      load();
    } catch (err) {
      showToast(`保存失败: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const del = async (id) => {
    if (!confirm('确认删除该配置项？相关下发规则将一并删除')) return;
    try {
      await apiFetch(`${API}/config-items/${id}`, { method: 'DELETE' });
      showToast('配置已删除', 'success');
      load();
    } catch (err) {
      showToast(`删除失败: ${err.message}`, 'error');
    }
  };

  const edit = (it) => {
    setEditing(it);
    setForm({ ...it });
    setErrors({});
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader title="配置项" actions={
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ key: '', name: '', type: 'switch', value_type: 'string', default_value: '', description: '', page_scope: '' }); setShowForm(true); }}>新建配置</button>
      } />
      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>{editing ? '编辑配置' : '新建配置'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Key <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="如: home_banner_switch" style={{ borderColor: errors.key ? '#ef4444' : undefined }} />
              {errors.key && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.key}</div>}
            </div>
            <div className="form-group">
              <label>名称 <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如: 首页Banner开关" style={{ borderColor: errors.name ? '#ef4444' : undefined }} />
              {errors.name && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
            </div>
            <div className="form-group">
              <label>类型 <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ borderColor: errors.type ? '#ef4444' : undefined }}>
                {Object.keys(TYPE_LABELS).map(k => <option key={k} value={k}>{TYPE_LABELS[k].label}</option>)}
              </select>
              {errors.type && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.type}</div>}
            </div>
            <div className="form-group">
              <label>值类型</label>
              <select value={form.value_type} onChange={e => setForm({ ...form, value_type: e.target.value })}>
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="json">json</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>默认值</label>
              <input value={form.default_value} onChange={e => setForm({ ...form, default_value: e.target.value })} placeholder={form.type === 'switch' ? 'true / false' : form.type === 'rate_limit' ? '如: 100' : '配置的默认值'} style={{ borderColor: errors.default_value ? '#ef4444' : undefined }} />
              {errors.default_value && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.default_value}</div>}
            </div>
            <div className="form-group"><label>适用页面</label><input value={form.page_scope} onChange={e => setForm({ ...form, page_scope: e.target.value })} placeholder="如: home / global / detail" /></div>
            <div className="form-group" style={{ flex: 1 }}><label>描述</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={save} disabled={submitting}>{submitting ? '保存中...' : '保存'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); setErrors({}); }} disabled={submitting}>取消</button>
          </div>
        </div>
      )}
      <div className="card">
        {items.length === 0 ? <div className="empty">暂无配置项</div> : (
          <table>
            <thead><tr><th>Key</th><th>名称</th><th>类型</th><th>默认值</th><th>页面</th><th>创建时间</th><th>操作</th></tr></thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td><code>{it.key}</code></td>
                  <td>{it.name}</td>
                  <td><span className={`tag ${TYPE_LABELS[it.type]?.cls}`}>{TYPE_LABELS[it.type]?.label}</span></td>
                  <td>{it.default_value}</td>
                  <td>{it.page_scope}</td>
                  <td>{it.created_at}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => edit(it)}>编辑</button>
                    <button className="btn btn-sm btn-danger" onClick={() => del(it.id)} style={{ marginLeft: 6 }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DeliveryRules() {
  const { showToast } = useToast();
  const [rules, setRules] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ config_item_id: '', environment: 'production', user_group: '', version_range: '', channel: '', tenant: '', time_window_start: '', time_window_end: '', value: '', priority: 0, enabled: 1 });
  const [errors, setErrors] = useState({});

  const load = useCallback(() => {
    Promise.all([
      apiFetch(`${API}/delivery-rules`),
      apiFetch(`${API}/config-items`)
    ]).then(([rulesData, configsData]) => {
      setRules(rulesData);
      setConfigs(configsData);
    }).catch(err => showToast(`加载失败: ${err.message}`, 'error'));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e = {};
    if (!form.config_item_id) e.config_item_id = '请选择配置项';
    if (!form.value && form.value !== 0 && form.value !== false) e.value = '请填写下发值';
    if (form.time_window_start && !form.time_window_end) e.time_window_end = '请选择时间窗止';
    if (form.time_window_end && !form.time_window_start) e.time_window_start = '请选择时间窗起';
    if (form.time_window_start && form.time_window_end && new Date(form.time_window_start) >= new Date(form.time_window_end)) e.time_window_end = '时间窗止必须大于时间窗起';
    if (form.version_range) {
      const ranges = form.version_range.split(',').map(s => s.trim());
      for (const r of ranges) {
        if (r.includes('-')) {
          const [lo, hi] = r.split('-').map(s => s.trim());
          if (!lo || !hi) { e.version_range = '版本范围格式错误，如: 1.0-2.0, 3.0'; break; }
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      showToast('请检查表单填写', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const url = editing ? `${API}/delivery-rules/${editing.id}` : `${API}/delivery-rules`;
      const payload = { ...form, config_item_id: parseInt(form.config_item_id, 10) };
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      showToast(editing ? '规则已更新' : '规则已创建', 'success');
      setShowForm(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err) {
      showToast(`保存失败: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ config_item_id: '', environment: 'production', user_group: '', version_range: '', channel: '', tenant: '', time_window_start: '', time_window_end: '', value: '', priority: 0, enabled: 1 });
    setErrors({});
  };

  const del = async (id) => {
    if (!confirm('确认删除该规则？')) return;
    try {
      await apiFetch(`${API}/delivery-rules/${id}`, { method: 'DELETE' });
      showToast('规则已删除', 'success');
      load();
    } catch (err) {
      showToast(`删除失败: ${err.message}`, 'error');
    }
  };

  const edit = (r) => {
    setEditing(r);
    setForm({
      config_item_id: String(r.config_item_id),
      environment: r.environment || 'production',
      user_group: r.user_group || '',
      version_range: r.version_range || '',
      channel: r.channel || '',
      tenant: r.tenant || '',
      time_window_start: r.time_window_start ? r.time_window_start.slice(0, 16) : '',
      time_window_end: r.time_window_end ? r.time_window_end.slice(0, 16) : '',
      value: r.value || '',
      priority: r.priority ?? 0,
      enabled: r.enabled ?? 1
    });
    setErrors({});
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader title="下发规则" actions={
        <button className="btn btn-primary" onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}>新建规则</button>
      } />
      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>{editing ? '编辑规则' : '新建规则'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>配置项 <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.config_item_id} onChange={e => setForm({ ...form, config_item_id: e.target.value })} style={{ borderColor: errors.config_item_id ? '#ef4444' : undefined }}>
                <option value="">-- 请选择 --</option>
                {configs.map(c => <option key={c.id} value={c.id}>{c.key} ({c.name})</option>)}
              </select>
              {errors.config_item_id && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.config_item_id}</div>}
            </div>
            <div className="form-group">
              <label>下发值 <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} style={{ borderColor: errors.value ? '#ef4444' : undefined }} placeholder="如: false / 测试文案 / https://api.xxx.com" />
              {errors.value && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.value}</div>}
            </div>
            <div className="form-group">
              <label>优先级</label>
              <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} placeholder="数值越大优先级越高" />
            </div>
            <div className="form-group">
              <label>状态</label>
              <select value={form.enabled} onChange={e => setForm({ ...form, enabled: parseInt(e.target.value) })}>
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>环境</label>
              <select value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}>
                <option value="production">生产</option>
                <option value="staging">预发</option>
                <option value="testing">测试</option>
                <option value="development">开发</option>
              </select>
            </div>
            <div className="form-group"><label>用户组</label><input value={form.user_group} onChange={e => setForm({ ...form, user_group: e.target.value })} placeholder="如: vip, beta" /></div>
            <div className="form-group">
              <label>版本范围</label>
              <input value={form.version_range} onChange={e => setForm({ ...form, version_range: e.target.value })} placeholder="如: 1.0-2.0, 3.0" style={{ borderColor: errors.version_range ? '#ef4444' : undefined }} />
              {errors.version_range && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.version_range}</div>}
            </div>
            <div className="form-group"><label>渠道</label><input value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} placeholder="如: ios, android, web" /></div>
            <div className="form-group"><label>租户</label><input value={form.tenant} onChange={e => setForm({ ...form, tenant: e.target.value })} placeholder="多租户标识" /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>时间窗起</label>
              <input type="datetime-local" value={form.time_window_start} onChange={e => setForm({ ...form, time_window_start: e.target.value })} style={{ borderColor: errors.time_window_start ? '#ef4444' : undefined }} />
              {errors.time_window_start && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.time_window_start}</div>}
            </div>
            <div className="form-group">
              <label>时间窗止</label>
              <input type="datetime-local" value={form.time_window_end} onChange={e => setForm({ ...form, time_window_end: e.target.value })} style={{ borderColor: errors.time_window_end ? '#ef4444' : undefined }} />
              {errors.time_window_end && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.time_window_end}</div>}
            </div>
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={save} disabled={submitting}>{submitting ? '保存中...' : '保存'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); setErrors({}); }} disabled={submitting}>取消</button>
          </div>
        </div>
      )}
      <div className="card">
        {rules.length === 0 ? <div className="empty">暂无法则</div> : (
          <table>
            <thead><tr><th>配置项</th><th>下发值</th><th>环境</th><th>用户组</th><th>版本</th><th>渠道</th><th>租户</th><th>优先级</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td>{r.config_key} ({r.config_name})</td>
                  <td>{r.value}</td>
                  <td>{r.environment}</td>
                  <td>{r.user_group || '-'}</td>
                  <td>{r.version_range || '-'}</td>
                  <td>{r.channel || '-'}</td>
                  <td>{r.tenant || '-'}</td>
                  <td>{r.priority}</td>
                  <td>{r.enabled ? '启用' : '禁用'}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => edit(r)}>编辑</button>
                    <button className="btn btn-sm btn-danger" onClick={() => del(r.id)} style={{ marginLeft: 6 }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PreviewPage() {
  const { showToast } = useToast();
  const [ctx, setCtx] = useState({ environment: 'production', user_group: '', version: '', channel: '', tenant: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const doPreview = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API}/delivery-preview`, { method: 'POST', body: JSON.stringify(ctx) });
      setResult(data);
      const hitCount = data.results.filter(r => r.hit).length;
      showToast(`预览完成，命中 ${hitCount} 条规则`, 'success');
    } catch (err) {
      showToast(`预览失败: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="规则预览" />
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>输入客户端上下文</h3>
        <div className="form-row">
          <div className="form-group"><label>环境</label>
            <select value={ctx.environment} onChange={e => setCtx({ ...ctx, environment: e.target.value })}>
              <option value="production">生产</option>
              <option value="staging">预发</option>
              <option value="testing">测试</option>
            </select>
          </div>
          <div className="form-group"><label>用户组</label><input value={ctx.user_group} onChange={e => setCtx({ ...ctx, user_group: e.target.value })} placeholder="如: vip" /></div>
          <div className="form-group"><label>版本</label><input value={ctx.version} onChange={e => setCtx({ ...ctx, version: e.target.value })} placeholder="如: 1.5.0" /></div>
          <div className="form-group"><label>渠道</label><input value={ctx.channel} onChange={e => setCtx({ ...ctx, channel: e.target.value })} placeholder="如: ios" /></div>
          <div className="form-group"><label>租户</label><input value={ctx.tenant} onChange={e => setCtx({ ...ctx, tenant: e.target.value })} placeholder="多租户标识" /></div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={doPreview} disabled={loading}>
              {loading ? '预览中...' : '预览命中'}
            </button>
          </div>
        </div>
      </div>
      {result && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>命中结果</h3>
          {result.results.map((r, i) => (
            <div className="preview-result" key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><code>{r.config_key}</code> ({r.config_name})</span>
                <span className={r.hit ? 'hit' : 'miss'}>{r.hit ? '✓ 命中规则' : '使用默认值'}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                类型: {TYPE_LABELS[r.type]?.label} | 值: <strong>{r.matched_value}</strong>
                {r.hit && ` | 规则ID: ${r.matched_rule_id}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientPulls() {
  const [pulls, setPulls] = useState([]);
  useEffect(() => { fetch(`${API}/client-pulls?limit=100`).then(r => r.json()).then(setPulls); }, []);

  const simulatePull = () => {
    fetch(`${API}/client-pull`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ environment: 'production', client_id: 'demo-client' }) })
      .then(() => fetch(`${API}/client-pulls?limit=100`).then(r => r.json()).then(setPulls));
  };

  return (
    <div>
      <PageHeader title="拉取记录" actions={<button className="btn btn-primary" onClick={simulatePull}>模拟拉取</button>} />
      <div className="card">
        {pulls.length === 0 ? <div className="empty">暂无拉取记录</div> : (
          <table>
            <thead><tr><th>时间</th><th>客户端ID</th><th>配置Key</th><th>命中值</th><th>缓存版本</th><th>环境</th><th>状态</th></tr></thead>
            <tbody>
              {pulls.map(p => (
                <tr key={p.id}>
                  <td>{p.request_time}</td>
                  <td>{p.client_id}</td>
                  <td><code>{p.config_key}</code></td>
                  <td>{p.matched_value}</td>
                  <td>{p.cache_version}</td>
                  <td>{p.environment || '-'}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS = {
  draft: '草稿', preview: '预览', approved: '已审批', canary: '灰度中', full: '全量', paused: '已暂停', rolled_back: '已回滚'
};

function ChangeSets() {
  const [list, setList] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([{ config_item_id: '', old_value: '', new_value: '' }]);

  const load = () => Promise.all([
    fetch(`${API}/change-sets`).then(r => r.json()).then(setList),
    fetch(`${API}/config-items`).then(r => r.json()).then(setConfigs)
  ]);
  useEffect(load, []);

  const create = () => {
    fetch(`${API}/change-sets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, items }) })
      .then(() => { setShowForm(false); setTitle(''); setItems([{ config_item_id: '', old_value: '', new_value: '' }]); load(); });
  };

  const transition = (id, status) => {
    fetch(`${API}/change-sets/${id}/transition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, approver: 'admin' }) })
      .then(load);
  };

  const navigate = useNavigate();

  const viewDetail = (id) => { navigate(`/changes/${id}`); };

  const addItem = () => setItems([...items, { config_item_id: '', old_value: '', new_value: '' }]);
  const updateItem = (idx, field, val) => {
    const next = [...items]; next[idx][field] = val;
    if (field === 'config_item_id' && val) {
      const cfg = configs.find(c => c.id === parseInt(val));
      if (cfg) next[idx].old_value = cfg.default_value;
    }
    setItems(next);
  };

  return (
    <div>
      <PageHeader title="变更流程" actions={
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>新建变更单</button>
      } />
      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>新建变更单</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}><label>变更标题</label><input value={title} onChange={e => setTitle(e.target.value)} /></div>
          </div>
          <h4 style={{ margin: '14px 0 8px' }}>变更项</h4>
          {items.map((it, idx) => (
            <div className="form-row" key={idx}>
              <div className="form-group"><label>配置项</label>
                <select value={it.config_item_id} onChange={e => updateItem(idx, 'config_item_id', e.target.value)}>
                  <option value="">--</option>
                  {configs.map(c => <option key={c.id} value={c.id}>{c.key}</option>)}
                </select>
              </div>
              <div className="form-group"><label>旧值</label><input value={it.old_value} onChange={e => updateItem(idx, 'old_value', e.target.value)} /></div>
              <div className="form-group"><label>新值</label><input value={it.new_value} onChange={e => updateItem(idx, 'new_value', e.target.value)} /></div>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 8 }}>+ 添加变更项</button>
          <div className="btn-group" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={create}>创建草稿</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
          </div>
        </div>
      )}
      <div className="card">
        {list.length === 0 ? <div className="empty">暂无变更单</div> : (
          <table>
            <thead><tr><th>ID</th><th>标题</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
            <tbody>
              {list.map(cs => (
                <tr key={cs.id}>
                  <td>{cs.id}</td>
                  <td>{cs.title}</td>
                  <td><span className={`tag tag-${cs.status}`}>{STATUS_LABELS[cs.status]}</span></td>
                  <td>{cs.created_at}</td>
                  <td className="btn-group">
                    <button className="btn btn-sm btn-secondary" onClick={() => viewDetail(cs.id)}>查看</button>
                    {cs.status === 'draft' && <button className="btn btn-sm btn-primary" onClick={() => transition(cs.id, 'preview')}>预览</button>}
                    {cs.status === 'preview' && <button className="btn btn-sm btn-primary" onClick={() => transition(cs.id, 'approved')}>审批</button>}
                    {cs.status === 'approved' && <button className="btn btn-sm btn-primary" onClick={() => transition(cs.id, 'canary')}>灰度</button>}
                    {cs.status === 'canary' && <button className="btn btn-sm btn-primary" onClick={() => transition(cs.id, 'full')}>全量</button>}
                    {(cs.status === 'canary' || cs.status === 'full') && <button className="btn btn-sm btn-secondary" onClick={() => transition(cs.id, 'paused')}>暂停</button>}
                    {(cs.status === 'canary' || cs.status === 'full' || cs.status === 'paused') && <button className="btn btn-sm btn-danger" onClick={() => transition(cs.id, 'rolled_back')}>回滚</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ChangeSetDetail() {
  const { id } = useParams();
  const [cs, setCs] = useState(null);
  useEffect(() => { fetch(`${API}/change-sets/${id}`).then(r => r.json()).then(setCs); }, [id]);
  if (!cs) return <div className="empty">加载中...</div>;

  return (
    <div>
      <PageHeader title={`变更单 #${cs.id}`} />
      <div className="card">
        <p><strong>标题:</strong> {cs.title}</p>
        <p><strong>状态:</strong> <span className={`tag tag-${cs.status}`}>{STATUS_LABELS[cs.status]}</span></p>
        <p><strong>创建时间:</strong> {cs.created_at}</p>
        {cs.diff_snapshot && <p><strong>差异快照:</strong> {cs.diff_snapshot}</p>}
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>变更项</h3>
        {cs.items && cs.items.length > 0 ? (
          <table>
            <thead><tr><th>配置Key</th><th>旧值</th><th>新值</th></tr></thead>
            <tbody>
              {cs.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.config_key} ({it.config_name})</td>
                  <td style={{ color: '#ef4444' }}>{it.old_value}</td>
                  <td style={{ color: '#10b981' }}>{it.new_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">无变更项</div>}
      </div>
    </div>
  );
}

function EffectDashboard() {
  const [summary, setSummary] = useState([]);
  useEffect(() => { fetch(`${API}/effect-summary`).then(r => r.json()).then(setSummary); }, []);

  const seedMetrics = () => {
    fetch(`${API}/config-items`).then(r => r.json()).then(configs => {
      const metrics = ['error_rate', 'click_through', 'conversion', 'user_feedback'];
      const ops = [];
      for (const c of configs) {
        for (const m of metrics) {
          const baseline = m === 'error_rate' ? 5 : m === 'click_through' ? 30 : m === 'conversion' ? 10 : 80;
          const current = m === 'error_rate' ? 4.2 : m === 'click_through' ? 38 : m === 'conversion' ? 13.5 : 85;
          ops.push(
            fetch(`${API}/effect-metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config_item_id: c.id, page_scope: c.page_scope, metric_name: m, metric_value: baseline, period: 'daily', baseline: 1 }) }),
            fetch(`${API}/effect-metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config_item_id: c.id, page_scope: c.page_scope, metric_name: m, metric_value: current, period: 'daily', baseline: 0 }) })
          );
        }
      }
      Promise.all(ops).then(() => fetch(`${API}/effect-summary`).then(r => r.json()).then(setSummary));
    });
  };

  return (
    <div>
      <PageHeader title="效果看板" actions={<button className="btn btn-primary" onClick={seedMetrics}>生成示例数据</button>} />
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>指标对比（基线 vs 当前）</h3>
        {summary.length === 0 ? <div className="empty">暂无指标数据</div> : (
          <table>
            <thead><tr><th>配置项</th><th>页面</th><th>指标</th><th>基线</th><th>当前</th><th>变化</th></tr></thead>
            <tbody>
              {summary.map((s, i) => {
                const delta = ((s.current_avg - s.baseline_avg) / s.baseline_avg * 100).toFixed(1);
                const isRate = s.metric_name === 'error_rate';
                const positive = isRate ? delta < 0 : delta > 0;
                return (
                  <tr key={i}>
                    <td>{s.config_key}</td>
                    <td>{s.page_scope}</td>
                    <td>{s.metric_name}</td>
                    <td>{s.baseline_avg?.toFixed(2)}</td>
                    <td>{s.current_avg?.toFixed(2)}</td>
                    <td style={{ color: positive ? '#10b981' : '#ef4444' }}>
                      {delta > 0 ? '+' : ''}{delta}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { fetch(`${API}/logs?limit=100`).then(r => r.json()).then(setLogs); }, []);
  return (
    <div>
      <PageHeader title="系统日志" />
      <div className="card">
        {logs.length === 0 ? <div className="empty">暂无日志</div> : (
          <table>
            <thead><tr><th>时间</th><th>级别</th><th>类别</th><th>消息</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>{l.created_at}</td>
                  <td><span className={`tag tag-${l.level === 'error' ? 'paused' : 'draft'}`}>{l.level}</span></td>
                  <td>{l.category}</td>
                  <td>{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const { showToast } = useToast();

  useEffect(() => {
    apiFetch(`${API}/config-items`).then(list => {
      if (list.length === 0) {
        apiFetch(`${API}/seed`, { method: 'POST' })
          .then(() => showToast('初始化配置数据完成', 'success'))
          .catch(err => console.warn('seed failed:', err));
      }
    }).catch(err => console.warn('config check failed:', err));
  }, [showToast]);

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <Routes>
          <Route path="/" element={<SafeRoute><Dashboard /></SafeRoute>} />
          <Route path="/configs" element={<SafeRoute><ConfigItems /></SafeRoute>} />
          <Route path="/rules" element={<SafeRoute><DeliveryRules /></SafeRoute>} />
          <Route path="/preview" element={<SafeRoute><PreviewPage /></SafeRoute>} />
          <Route path="/pulls" element={<SafeRoute><ClientPulls /></SafeRoute>} />
          <Route path="/changes" element={<SafeRoute><ChangeSets /></SafeRoute>} />
          <Route path="/changes/:id" element={<SafeRoute><ChangeSetDetail /></SafeRoute>} />
          <Route path="/effect" element={<SafeRoute><EffectDashboard /></SafeRoute>} />
          <Route path="/logs" element={<SafeRoute><SystemLogs /></SafeRoute>} />
        </Routes>
      </div>
    </div>
  );
}
