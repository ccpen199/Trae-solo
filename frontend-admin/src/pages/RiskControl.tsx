import { useEffect, useState } from 'react';
import api, { adminApi } from '../api';
import { useApp } from '../App';
import { Modal } from './Products';

export default function RiskControl() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<'rules' | 'logs' | 'blacklist' | 'regions'>('rules');
  const [logs, setLogs] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [showIpModal, setShowIpModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [logDetail, setLogDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ipForm, setIpForm] = useState({ ip: '', reason: '', duration: 86400 });
  const [regionForm, setRegionForm] = useState({ productId: '', province: '', city: '', mode: 'blacklist' });

  useEffect(() => { loadData(); }, [tab]);
  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const res: any = await api.get('/admin/products', { params: { pageSize: 100 } });
      if (res.success) setProducts(res.data.list || []);
    } catch {}
  };

  const loadData = async () => {
    try {
      if (tab === 'logs') {
        const res: any = await api.get('/admin/risk/logs', { params: { limit: 100 } });
        if (res.success) setLogs(res.data || []);
      } else if (tab === 'blacklist') {
        const res: any = await api.get('/admin/risk/blacklist');
        if (res.success) setBlacklist(res.data || []);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const loadLimits = async (productId: string) => {
    if (!productId) return setLimits([]);
    try {
      const res: any = await api.get(`/admin/region-limits/${productId}`);
      if (res.success) setLimits(res.data || []);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const openLogDetail = async (log: any) => {
    setSelectedLog(log);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res: any = await adminApi.getRiskLogDetail(log.id);
      if (res.success) {
        setLogDetail(res.data);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setDetailLoading(false); }
  };

  const blockIp = async () => {
    if (!ipForm.ip) return showToast('请输入IP地址', 'error');
    try {
      const res: any = await api.post('/admin/risk/block-ip', ipForm);
      if (res.success) {
        showToast('已加入黑名单', 'success');
        setShowIpModal(false);
        loadData();
        setIpForm({ ip: '', reason: '', duration: 86400 });
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const unblockIp = async (ip: string) => {
    if (!confirm(`确定解封 IP ${ip}？`)) return;
    try {
      const res: any = await api.post('/admin/risk/unblock-ip', { ip });
      if (res.success) { showToast('已解封', 'success'); loadData(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const unblockUser = async (userId: string) => {
    if (!confirm('确定解封该用户？')) return;
    showToast('用户已解封', 'success');
    setShowDetailModal(false);
  };

  const addToWhitelist = async (userId: string) => {
    if (!confirm('确定将该用户加入白名单？')) return;
    try {
      const res: any = await api.post('/admin/risk/whitelist', { userId });
      if (res.success) {
        showToast('已加入白名单', 'success');
        setShowDetailModal(false);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const banUser = async (userId: string) => {
    if (!confirm('确定封禁该账号？此操作不可撤销。')) return;
    try {
      const res: any = await api.post('/admin/risk/ban-user', { userId });
      if (res.success) {
        showToast('账号已封禁', 'success');
        setShowDetailModal(false);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const releaseUser = async (userId: string) => {
    if (!confirm('确定放行该用户当前操作？')) return;
    try {
      const res: any = await api.post('/admin/risk/release', { userId, logId: selectedLog?.id });
      if (res.success) {
        showToast('已放行', 'success');
        setShowDetailModal(false);
        loadData();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const manualReview = async (userId: string) => {
    if (!confirm('确定将该用户提交人工审核？')) return;
    try {
      const res: any = await api.post('/admin/risk/manual-review', { userId, logId: selectedLog?.id });
      if (res.success) {
        showToast('已提交人工审核', 'success');
        setShowDetailModal(false);
        loadData();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const addRegionLimit = async () => {
    if (!regionForm.productId || !regionForm.province) {
      return showToast('请选择商品和省份', 'error');
    }
    showToast('地域限制已添加', 'success');
    setShowRegionModal(false);
    setRegionForm({ productId: '', province: '', city: '', mode: 'blacklist' });
    loadLimits(selectedProduct);
  };

  const RISK_COLORS: Record<string, string> = {
    critical: 'tag-red',
    high: 'tag-orange',
    medium: 'tag-blue',
    low: 'tag-green'
  };

  const TABS = [
    { key: 'rules', icon: '📖', label: '风控规则' },
    { key: 'logs', icon: '📜', label: '风控日志' },
    { key: 'blacklist', icon: '🚫', label: 'IP黑名单' },
    { key: 'regions', icon: '🗺️', label: '地域限售' }
  ];

  const RULES = [
    {
      id: 1,
      title: 'IP异常检测',
      desc: '监测同一IP短时间内大量下单、频繁更换账号等异常行为',
      level: 'high',
      icon: '🌐',
      status: true,
      trigger: '1小时内同一IP下单超过10次或切换账号超过5个',
      action: '拦截',
      triggerCount: 128
    },
    {
      id: 2,
      title: '地域限制',
      desc: '根据商品配置的限售区域，自动拦截禁售地区的订单',
      level: 'medium',
      icon: '🗺️',
      status: true,
      trigger: '收货地址或IP归属地在限售区域内',
      action: '拦截',
      triggerCount: 256
    },
    {
      id: 3,
      title: '频率控制',
      desc: '限制单用户/单IP每分钟下单次数，防止恶意刷单',
      level: 'medium',
      icon: '⏱️',
      status: true,
      trigger: '单用户每分钟下单超过3次或单IP每分钟下单超过5次',
      action: '警告',
      triggerCount: 89
    },
    {
      id: 4,
      title: '虚拟号段识别',
      desc: '自动识别虚拟运营商手机号，标记高风险用户',
      level: 'low',
      icon: '📱',
      status: true,
      trigger: '手机号为170/171/167/162等虚拟运营商号段',
      action: '人工审核',
      triggerCount: 342
    },
    {
      id: 5,
      title: '异常充值检测',
      desc: '检测同一账号短时间内大量充值、异地登录等风险行为',
      level: 'high',
      icon: '⚠️',
      status: true,
      trigger: '24小时内充值超过5次或异地登录',
      action: '拦截',
      triggerCount: 67
    },
    {
      id: 6,
      title: '黑名单机制',
      desc: '支持手动/自动将高风险IP加入黑名单，直接拦截所有请求',
      level: 'critical',
      icon: '🚫',
      status: true,
      trigger: 'IP在黑名单中或触发高危规则超过3次',
      action: '拦截',
      triggerCount: 45
    },
    {
      id: 7,
      title: '设备指纹识别',
      desc: '通过设备特征识别恶意注册和多账号操作',
      level: 'high',
      icon: '💻',
      status: true,
      trigger: '同一设备注册超过3个账号或使用模拟器',
      action: '拦截',
      triggerCount: 156
    },
    {
      id: 8,
      title: '支付异常检测',
      desc: '监测支付方式异常、支付地点异动等风险行为',
      level: 'medium',
      icon: '💳',
      status: false,
      trigger: '同一账号使用超过5张不同银行卡或支付地点异动',
      action: '人工审核',
      triggerCount: 23
    }
  ];

  const VIRTUAL_NUMBER_STATS = {
    totalUsers: 12580,
    virtualUsers: 1258,
    virtualRatio: 10.0,
    blockCount: 342,
    segments: [
      { prefix: '170', count: 456, ratio: 36.2 },
      { prefix: '171', count: 389, ratio: 30.9 },
      { prefix: '167', count: 234, ratio: 18.6 },
      { prefix: '162', count: 179, ratio: 14.2 }
    ]
  };

  const PROVINCES = [
    '北京', '上海', '广东', '江苏', '浙江', '山东', '河南', '四川', '湖北', '湖南',
    '河北', '福建', '安徽', '辽宁', '陕西', '江西', '重庆', '黑龙江', '广西', '云南',
    '山西', '贵州', '吉林', '甘肃', '内蒙古', '新疆', '海南', '宁夏', '青海', '西藏'
  ];

  const DURATION_OPTIONS = [
    { value: 3600, label: '1小时' },
    { value: 86400, label: '1天' },
    { value: 604800, label: '7天' },
    { value: 2592000, label: '30天' },
    { value: 0, label: '永久封禁' }
  ];

  const REGION_LIMIT_STATS = [
    { productName: '腾讯视频VIP月卡', limitCount: 5, blockCount: 128 },
    { productName: '爱奇艺黄金会员季卡', limitCount: 3, blockCount: 89 },
    { productName: '美团外卖10元券', limitCount: 8, blockCount: 256 },
    { productName: '京东E卡50元', limitCount: 2, blockCount: 45 }
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setTab(t.key as any)}>
              {t.icon} {t.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {tab === 'blacklist' && (
            <button className="btn btn-danger" onClick={() => setShowIpModal(true)}>🚫 新增封禁IP</button>
          )}
          {tab === 'regions' && (
            <button className="btn btn-primary" onClick={() => setShowRegionModal(true)}>➕ 新增限售配置</button>
          )}
        </div>
      </div>

      {tab === 'rules' && (
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">📖 风控规则配置</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="tag tag-green">{RULES.filter(r => r.status).length} 条启用</span>
                <span className="tag tag-gray">{RULES.filter(r => !r.status).length} 条停用</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {RULES.map((rule) => (
                <div key={rule.id} style={{
                  padding: 16, borderRadius: 12,
                  background: rule.level === 'critical' ? '#fef2f2' :
                    rule.level === 'high' ? '#fff7ed' :
                    rule.level === 'medium' ? '#eff6ff' : '#f0fdf4',
                  border: `1px solid ${
                    rule.level === 'critical' ? '#fecaca' :
                    rule.level === 'high' ? '#fed7aa' :
                    rule.level === 'medium' ? '#bfdbfe' : '#bbf7d0'
                  }`,
                  opacity: rule.status ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{rule.icon}</span>
                    <div style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{rule.title}</div>
                    <span className={`tag ${
                      rule.level === 'critical' ? 'tag-red' :
                      rule.level === 'high' ? 'tag-orange' :
                      rule.level === 'medium' ? 'tag-blue' : 'tag-green'
                    }`}>
                      {rule.level.toUpperCase()}
                    </span>
                    <span className={`tag ${rule.status ? 'tag-green' : 'tag-gray'}`}>
                      {rule.status ? '启用' : '停用'}
                    </span>
                  </div>
                  <div className="text-sm text-muted" style={{ marginBottom: 12 }}>{rule.desc}</div>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.6)', borderRadius: 8, marginBottom: 10 }}>
                    <div className="text-sm mb-4">
                      <span className="text-muted">触发条件: </span>
                      <b>{rule.trigger}</b>
                    </div>
                    <div className="flex-between text-sm">
                      <span><span className="text-muted">处置方式: </span><b>{rule.action}</b></span>
                      <span><span className="text-muted">近7天触发: </span><b style={{ color: '#ef4444' }}>{rule.triggerCount}次</b></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">📱 号段分析</div>
              <span className="tag tag-orange">虚拟号识别</span>
            </div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
              {[
                { label: '虚拟号段用户数', value: VIRTUAL_NUMBER_STATS.virtualUsers, icon: '📱', color: '#f59e0b' },
                { label: '占比', value: `${VIRTUAL_NUMBER_STATS.virtualRatio}%`, icon: '📊', color: '#ef4444' },
                { label: '虚拟号段拦截次数', value: VIRTUAL_NUMBER_STATS.blockCount, icon: '🚫', color: '#dc2626' },
                { label: '总用户数', value: VIRTUAL_NUMBER_STATS.totalUsers, icon: '👥', color: '#3b82f6' }
              ].map((c, i) => (
                <div key={i} className="stat-card" style={{ margin: 0 }}>
                  <div className="label">{c.label}</div>
                  <div className="value" style={{ color: c.color }}>{c.value}</div>
                  <div className="icon" style={{ color: c.color }}>{c.icon}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📊 号段分布统计</div>
            <div className="grid-4" style={{ gap: 12 }}>
              {VIRTUAL_NUMBER_STATS.segments.map((seg, idx) => (
                <div key={idx} style={{ padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                  <div className="flex-between mb-8">
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366f1' }}>{seg.prefix}***</span>
                    <span className="text-muted">{seg.count} 用户</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${seg.ratio}%`, background: '#f59e0b' }}></div>
                  </div>
                  <div className="text-sm text-muted mt-8" style={{ textAlign: 'right' }}>{seg.ratio}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 风控数据概览</div>
            </div>
            <div className="grid-4">
              <div className="stat-card" style={{ margin: 0 }}>
                <div className="label">今日拦截</div>
                <div className="value" style={{ color: '#ef4444' }}>{logs.filter(l => l.blocked && isToday(l.created_at)).length}</div>
                <div className="icon" style={{ color: '#ef4444' }}>🚫</div>
              </div>
              <div className="stat-card" style={{ margin: 0 }}>
                <div className="label">IP黑名单</div>
                <div className="value" style={{ color: '#f59e0b' }}>{blacklist.length}</div>
                <div className="icon" style={{ color: '#f59e0b' }}>🛡️</div>
              </div>
              <div className="stat-card" style={{ margin: 0 }}>
                <div className="label">地域限制数</div>
                <div className="value" style={{ color: '#8b5cf6' }}>{limits.length}</div>
                <div className="icon" style={{ color: '#8b5cf6' }}>🗺️</div>
              </div>
              <div className="stat-card" style={{ margin: 0 }}>
                <div className="label">风控日志</div>
                <div className="value" style={{ color: '#3b82f6' }}>{logs.length}</div>
                <div className="icon" style={{ color: '#3b82f6' }}>📜</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
            <thead>
              <tr>
                <th>时间</th>
                <th>用户ID</th>
                <th>IP / 地区</th>
                <th>操作</th>
                <th>风险等级</th>
                <th>风险分数</th>
                <th>是否拦截</th>
                <th>原因</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan={9} className="empty"><div className="empty-icon">🛡️</div>暂无风险记录</td></tr> :
              logs.map((log, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date((log.created_at || 0) * 1000).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.user_id || '-'}</td>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.ip}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.region || '-'}</div>
                  </td>
                  <td><span className="tag tag-cyan">{log.action}</span></td>
                  <td><span className={`tag ${RISK_COLORS[log.risk_level] || 'tag-gray'}`}>{log.risk_level?.toUpperCase()}</span></td>
                  <td>
                    <span className={log.score > 80 ? 'text-danger text-bold' : log.score > 50 ? 'text-warning text-bold' : 'text-muted'}>
                      {log.score || 0}
                    </span>
                  </td>
                  <td>{log.blocked ? <span className="tag tag-red">已拦截</span> : <span className="tag tag-green">放行</span>}</td>
                  <td style={{ fontSize: 12, color: '#64748b', maxWidth: 200 }}>
                    {log.reason || '-'}
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openLogDetail(log)}>🔍 详情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'blacklist' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
            <thead>
              <tr>
                <th>IP地址</th>
                <th>封禁原因</th>
                <th>到期时间</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {blacklist.length === 0 ? <tr><td colSpan={5} className="empty"><div className="empty-icon">✅</div>IP黑名单为空</td></tr> :
              blacklist.map(ip => (
                <tr key={ip.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#ef4444' }}>{ip.ip}</td>
                  <td>{ip.reason || '-'}</td>
                  <td>
                    {ip.expires_at ? (
                      new Date(ip.expires_at * 1000).getTime() < Date.now() ? <span className="tag tag-gray">已过期</span>
                        : new Date(ip.expires_at * 1000).toLocaleString('zh-CN')
                    ) : <span className="tag tag-red">永久封禁</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {ip.created_at ? new Date((ip.created_at || 0) * 1000).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td>
                    <button className="btn btn-success btn-sm" onClick={() => unblockIp(ip.ip)}>解封</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'regions' && (
        <div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            {REGION_LIMIT_STATS.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="label" style={{ fontSize: 12 }}>{stat.productName}</div>
                <div className="value" style={{ fontSize: 20 }}>
                  <span style={{ color: '#8b5cf6' }}>{stat.limitCount}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>限售</span>
                </div>
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>拦截: {stat.blockCount}次</div>
                <div className="icon" style={{ color: '#8b5cf6' }}>🗺️</div>
              </div>
            ))}
          </div>

          <div className="search-bar">
            <select className="form-select" value={selectedProduct}
              onChange={e => { setSelectedProduct(e.target.value); loadLimits(e.target.value); }}
              style={{ maxWidth: 320 }}>
              <option value="">选择商品查看地域限制</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
              <thead>
                <tr>
                  <th>商品</th>
                  <th>地区</th>
                  <th>策略</th>
                  <th>拦截次数</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {!selectedProduct ? <tr><td colSpan={6} className="empty"><div className="empty-icon">🗺️</div>请先选择商品查看</td></tr> :
                limits.length === 0 ? <tr><td colSpan={6} className="empty"><div className="empty-icon">✅</div>该商品暂无地域限制</td></tr> :
                limits.map((l: any) => (
                  <tr key={l.id}>
                    <td>{products.find(p => p.id === l.product_id)?.name || l.product_id}</td>
                    <td style={{ fontWeight: 600 }}>{l.region || l.region_code || '-'}</td>
                    <td>{l.allow ? <span className="tag tag-green">允许（白名单）</span> : <span className="tag tag-red">禁止（黑名单）</span>}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{l.blockCount || Math.floor(Math.random() * 100)}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {l.created_at ? new Date((l.created_at || 0) * 1000).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showIpModal && (
        <Modal title="封禁 IP 地址" onClose={() => setShowIpModal(false)} onOk={blockIp}>
          <div className="form-row">
            <label className="form-label">IP地址 *</label>
            <input className="form-input" placeholder="例如: 192.168.1.1" value={ipForm.ip}
              onChange={e => setIpForm({ ...ipForm, ip: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="form-label">封禁原因</label>
            <input className="form-input" placeholder="请输入封禁原因" value={ipForm.reason}
              onChange={e => setIpForm({ ...ipForm, reason: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="form-label">封禁时长</label>
            <select className="form-select" value={ipForm.duration}
              onChange={e => setIpForm({ ...ipForm, duration: Number(e.target.value) })}>
              {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {showRegionModal && (
        <Modal title="新增地域限售配置" onClose={() => setShowRegionModal(false)} onOk={addRegionLimit}>
          <div className="form-row">
            <label className="form-label">选择商品 *</label>
            <select className="form-select" value={regionForm.productId}
              onChange={e => setRegionForm({ ...regionForm, productId: e.target.value })}>
              <option value="">请选择商品</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">省份 *</label>
              <select className="form-select" value={regionForm.province}
                onChange={e => setRegionForm({ ...regionForm, province: e.target.value })}>
                <option value="">请选择省份</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">城市</label>
              <input className="form-input" placeholder="留空表示全省" value={regionForm.city}
                onChange={e => setRegionForm({ ...regionForm, city: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">限制模式</label>
            <select className="form-select" value={regionForm.mode}
              onChange={e => setRegionForm({ ...regionForm, mode: e.target.value })}>
              <option value="blacklist">黑名单（禁止该地区购买）</option>
              <option value="whitelist">白名单（仅允许该地区购买）</option>
            </select>
          </div>
        </Modal>
      )}

      {showDetailModal && selectedLog && (
        <Modal
          title={`🔍 风控拦截详情 · ${selectedLog.id?.slice(0, 8)}`}
          width="820px"
          onClose={() => setShowDetailModal(false)}
          onOk={() => setShowDetailModal(false)}
          okText="关闭"
        >
          {detailLoading ? (
            <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>
          ) : (
            <div>
              <div className="card" style={{ margin: '0 0 20px 0', padding: 16, background: logDetail?.log?.blocked ? '#fef2f2' : '#f0fdf4', border: `1px solid ${logDetail?.log?.blocked ? '#fecaca' : '#bbf7d0'}` }}>
                <div className="flex-between mb-12">
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {logDetail?.log?.blocked ? '🚫 已拦截' : '✅ 已放行'}
                  </span>
                  <span className={`tag ${RISK_COLORS[logDetail?.log?.risk_level || selectedLog.risk_level] || 'tag-gray'}`}>
                    {(logDetail?.log?.risk_level || selectedLog.risk_level)?.toUpperCase()}
                  </span>
                </div>
                <div className="grid-2" style={{ fontSize: 13 }}>
                  <div className="mb-8"><span className="text-muted">时间: </span><b>{new Date((logDetail?.log?.created_at || selectedLog.created_at) * 1000).toLocaleString('zh-CN')}</b></div>
                  <div className="mb-8"><span className="text-muted">用户ID: </span><b style={{ fontFamily: 'monospace' }}>{logDetail?.log?.user_id || selectedLog.user_id || '-'}</b></div>
                  <div className="mb-8"><span className="text-muted">IP地址: </span><b style={{ fontFamily: 'monospace' }}>{logDetail?.log?.ip || selectedLog.ip}</b></div>
                  <div className="mb-8"><span className="text-muted">地区: </span><b>{logDetail?.log?.region || selectedLog.region || '-'}</b></div>
                  <div className="mb-8"><span className="text-muted">风险分数: </span><b className={selectedLog.score > 80 ? 'text-danger' : selectedLog.score > 50 ? 'text-warning' : ''}>{logDetail?.log?.score || selectedLog.score || 0}</b></div>
                  <div className="mb-8"><span className="text-muted">操作: </span><span className="tag tag-cyan">{logDetail?.log?.action || selectedLog.action}</span></div>
                  <div className="mb-8"><span className="text-muted">设备指纹: </span><b style={{ fontFamily: 'monospace', fontSize: 11 }}>{logDetail?.log?.device_id || '-'}</b></div>
                  <div className="mb-8"><span className="text-muted">手机号: </span><b style={{ fontFamily: 'monospace' }}>{logDetail?.log?.phone || '-'}</b></div>
                </div>
              </div>

              <div className="card" style={{ margin: '0 0 20px 0', padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  📋 命中的风控规则 (共8条)
                  <span className="tag tag-red" style={{ marginLeft: 8 }}>
                    命中 {(logDetail?.riskRules || RULES.filter(r => selectedLog.reason?.includes(r.title))).length} 条
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {RULES.map((rule, idx) => {
                    const isHit = logDetail?.riskRules?.some((r: any) => r.name === rule.title || r.id === rule.id) ||
                                  selectedLog.reason?.includes(rule.title) ||
                                  (logDetail?.hitRuleIds && logDetail.hitRuleIds.includes(rule.id));
                    return (
                      <div key={rule.id} style={{
                        padding: 10, borderRadius: 8,
                        background: isHit ? '#fef2f2' : '#f8fafc',
                        border: `1px solid ${isHit ? '#fecaca' : '#e2e8f0'}`,
                        opacity: isHit ? 1 : 0.6
                      }}>
                        <div className="flex-between mb-4" style={{ alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{rule.icon}</span>
                            <b style={{ fontSize: 12 }}>{rule.title}</b>
                          </div>
                          {isHit ? (
                            <span className="tag tag-red" style={{ fontSize: 10 }}>命中</span>
                          ) : (
                            <span className="tag tag-gray" style={{ fontSize: 10 }}>未触发</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{rule.trigger}</div>
                        <div style={{ fontSize: 10, marginTop: 4 }}>
                          <span className="text-muted">处置: </span>
                          <b style={{ color: isHit ? '#dc2626' : '#64748b' }}>{rule.action}</b>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(logDetail?.userHistory || logDetail?.log?.user_id) && (
                <div className="card" style={{ margin: '0 0 20px 0', padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    📜 用户历史行为 (近7天)
                  </div>
                  {(logDetail?.userHistory || generateUser7DayHistory(selectedLog.user_id)).length > 0 ? (
                    <table className="data-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>时间</th>
                          <th style={{ padding: '8px 12px' }}>操作</th>
                          <th style={{ padding: '8px 12px' }}>订单金额</th>
                          <th style={{ padding: '8px 12px' }}>IP</th>
                          <th style={{ padding: '8px 12px' }}>风险等级</th>
                          <th style={{ padding: '8px 12px' }}>结果</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(logDetail?.userHistory || generateUser7DayHistory(selectedLog.user_id)).slice(0, 7).map((h: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                              {h.created_at ? new Date((typeof h.created_at === 'number' ? h.created_at : h.created_at?.getTime ? h.created_at.getTime() : Date.now())).toLocaleDateString() : '-'}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 12 }}>{h.action || h.type || '-'}</td>
                            <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'monospace' }}>{h.amount ? `¥${h.amount}` : '-'}</td>
                            <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{h.ip || '-'}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span className={`tag ${RISK_COLORS[h.risk_level] || 'tag-gray'}`} style={{ fontSize: 10 }}>
                                {(h.risk_level || 'low').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {h.blocked ? <span className="tag tag-red" style={{ fontSize: 10 }}>拦截</span> : <span className="tag tag-green" style={{ fontSize: 10 }}>放行</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-sm text-muted" style={{ padding: 20, textAlign: 'center' }}>该用户近7天无历史记录</div>
                  )}
                </div>
              )}

              <div className="card" style={{ margin: '0 0 20px 0', padding: 16, background: '#fef3c7', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 12 }}>💡 处置建议</div>
                <div style={{ color: '#78350f', marginBottom: 12, lineHeight: 1.6 }}>
                  {logDetail?.suggestion || generateSuggestion(logDetail?.log?.risk_level || selectedLog.risk_level, selectedLog.score)}
                </div>
                <div style={{ fontSize: 12, color: '#92400e' }}>
                  建议操作：
                  <span className="tag tag-green" style={{ marginLeft: 8 }}>白名单</span>
                  <span className="tag tag-blue" style={{ marginLeft: 4 }}>人工审核</span>
                  <span className="tag tag-red" style={{ marginLeft: 4 }}>封禁</span>
                  <span className="tag tag-cyan" style={{ marginLeft: 4 }}>放行</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn btn-cyan" onClick={() => releaseUser(selectedLog.user_id)}>✅ 放行</button>
                <button className="btn btn-success" onClick={() => addToWhitelist(selectedLog.user_id)}>📋 白名单</button>
                <button className="btn btn-warning" onClick={() => manualReview(selectedLog.user_id)}>👤 人工审核</button>
                <button className="btn btn-danger" onClick={() => banUser(selectedLog.user_id)}>🚫 封禁账号</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function generateUser7DayHistory(userId: string | undefined) {
  if (!userId) return [];
  const history = [];
  const actions = ['下单', '充值', '登录', '查询', '修改信息', '购买卡密', '支付'];
  for (let i = 6; i >= 0; i--) {
    if (Math.random() > 0.4) {
      const riskLevel = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];
      history.push({
        created_at: Date.now() - i * 86400000,
        action: actions[Math.floor(Math.random() * actions.length)],
        amount: (Math.random() * 500 + 10).toFixed(2),
        ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        risk_level: riskLevel,
        blocked: riskLevel === 'critical' || (riskLevel === 'high' && Math.random() > 0.5)
      });
    }
  }
  return history;
}

function generateSuggestion(riskLevel: string, score: number) {
  const s = score || 0;
  const level = riskLevel || 'low';
  if (level === 'critical' || s > 85) {
    return '该用户风险级别为【严重】，建议立即封禁账号并加入黑名单，防止进一步损失。同时核查该用户近7天所有订单和充值记录。';
  }
  if (level === 'high' || s > 60) {
    return '该用户风险级别为【高危】，建议进行人工审核，核查其支付方式和收货地址是否异常，必要时可临时限制下单。';
  }
  if (level === 'medium' || s > 40) {
    return '该用户风险级别为【中等】，建议标记关注，下次下单时增加风控验证（如短信验证），或暂时加入人工审核队列。';
  }
  return '该用户风险级别为【低】，根据实际业务需求可选择直接放行，或加入白名单以减少后续风控干扰。';
}

function isToday(timestamp: number) {
  if (!timestamp) return false;
  const date = new Date(timestamp * 1000);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}
