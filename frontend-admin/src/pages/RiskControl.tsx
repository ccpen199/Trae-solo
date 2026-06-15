import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';
import { Modal } from './Products';

export default function RiskControl() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<'logs' | 'blacklist' | 'regions'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showIpModal, setShowIpModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [ipForm, setIpForm] = useState({ ip: '', reason: '', duration: 86400 });
  const [regionForm, setRegionForm] = useState({ productId: '', regionCode: '', allow: 0 });

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    try {
      if (tab === 'logs') {
        const res: any = await api.get('/admin/risk/logs', { params: { limit: 100 } });
        if (res.success) setLogs(res.data || []);
      } else if (tab === 'blacklist') {
        const res: any = await api.get('/admin/risk/blacklist');
        if (res.success) setBlacklist(res.data || []);
      }
      if (tab === 'regions') {
        const prodRes: any = await api.get('/products', { params: { pageSize: 100 } });
        if (prodRes.success) setProducts(prodRes.data.list || []);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const loadLimits = async (productId: string) => {
    if (!productId) return setLimits([]);
    try {
      const res: any = await api.get(`/admin/region-limits/${productId}`);
      if (res.success) setLimits(res.data || []);
    } catch {}
  };

  const blockIp = async () => {
    if (!ipForm.ip) return showToast('请输入IP地址', 'error');
    try {
      const res: any = await api.post('/admin/risk/block-ip', ipForm);
      if (res.success) { showToast('已加入黑名单', 'success'); setShowIpModal(false); loadData(); setIpForm({ ip: '', reason: '', duration: 86400 }); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const unblockIp = async (ip: string) => {
    if (!confirm(`确定解封 IP ${ip}？`)) return;
    try {
      const res: any = await api.post('/admin/risk/unblock-ip', { ip });
      if (res.success) { showToast('已解封', 'success'); loadData(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const addRegionLimit = async () => {
    if (!regionForm.productId || !regionForm.regionCode) return showToast('请填写完整', 'error');
    try {
      const res: any = await api.post('/admin/region-limits', regionForm);
      if (res.success) { showToast('已添加地域限制', 'success'); setShowRegionModal(false); loadLimits(regionForm.productId); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const RISK_COLORS: Record<string, string> = {
    critical: 'tag-red',
    high: 'tag-orange',
    medium: 'tag-blue',
    low: 'tag-green'
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'logs', icon: '📜', label: '风险日志' },
            { key: 'blacklist', icon: '🚫', label: 'IP黑名单' },
            { key: 'regions', icon: '🗺️', label: '地域限售' }
          ].map(t => (
            <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setTab(t.key as any)}>
              {t.icon} {t.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {tab === 'logs' && (
            <button className="btn btn-warning" onClick={() => showToast('正在导出报告...', 'info')}>📊 导出风险报告</button>
          )}
          {tab === 'blacklist' && (
            <button className="btn btn-danger" onClick={() => setShowIpModal(true)}>🚫 新增封禁IP</button>
          )}
          {tab === 'regions' && (
            <button className="btn btn-primary" onClick={() => setShowRegionModal(true)}>➕ 新增地域限制</button>
          )}
        </div>
      </div>

      {tab === 'logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
            <thead>
              <tr>
                <th>时间</th>
                <th>IP / 地区</th>
                <th>操作</th>
                <th>风险等级</th>
                <th>是否拦截</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan={6} className="empty"><div className="empty-icon">🛡️</div>暂无风险记录</td></tr> :
              logs.map((log, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date((log.created_at || 0) * 1000).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.ip}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.region}</div>
                  </td>
                  <td><span className="tag tag-cyan">{log.action}</span></td>
                  <td><span className={`tag ${RISK_COLORS[log.risk_level] || 'tag-gray'}`}>{log.risk_level?.toUpperCase()}</span></td>
                  <td>{log.blocked ? <span className="tag tag-red">已拦截</span> : <span className="tag tag-green">放行</span>}</td>
                  <td style={{ fontSize: 12, color: '#64748b', maxWidth: 300 }}>
                    {log.detail || '-'}
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
                    {ip.expire_time ? (
                      ip.expire_time * 1000 < Date.now() ? <span className="tag tag-gray">已过期</span>
                        : new Date(ip.expire_time * 1000).toLocaleString('zh-CN')
                    ) : <span className="tag tag-red">永久封禁</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date((ip.created_at || 0) * 1000).toLocaleString('zh-CN')}</td>
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
          <div className="search-bar">
            <select className="form-select" value={regionForm.productId || ''}
              onChange={e => { loadLimits(e.target.value); setRegionForm({ ...regionForm, productId: e.target.value }); }}>
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
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {limits.length === 0 ? <tr><td colSpan={4} className="empty"><div className="empty-icon">🗺️</div>请先选择商品查看</td></tr> :
                limits.map(l => (
                  <tr key={l.id}>
                    <td>{products.find(p => p.id === l.product_id)?.name || l.product_id}</td>
                    <td style={{ fontWeight: 600 }}>{l.region_code}</td>
                    <td>{l.allow ? <span className="tag tag-green">允许</span> : <span className="tag tag-red">禁止</span>}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{new Date((l.created_at || 0) * 1000).toLocaleDateString()}</td>
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
            <label className="form-label">封禁时长（秒，0为永久）</label>
            <input type="number" className="form-input" value={ipForm.duration}
              onChange={e => setIpForm({ ...ipForm, duration: Number(e.target.value) })} />
          </div>
        </Modal>
      )}

      {showRegionModal && (
        <Modal title="设置地域限售" onClose={() => setShowRegionModal(false)} onOk={addRegionLimit}>
          <div className="form-row">
            <label className="form-label">选择商品 *</label>
            <select className="form-select" value={regionForm.productId}
              onChange={e => setRegionForm({ ...regionForm, productId: e.target.value })}>
              <option value="">请选择</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">地区代码 *（省份/自治区，如：北京、上海、广东）</label>
            <input className="form-input" placeholder="如: 北京 或 全国" value={regionForm.regionCode}
              onChange={e => setRegionForm({ ...regionForm, regionCode: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="form-label">策略</label>
            <select className="form-select" value={regionForm.allow}
              onChange={e => setRegionForm({ ...regionForm, allow: Number(e.target.value) })}>
              <option value={0}>禁止销售（黑名单）</option>
              <option value={1}>允许销售（白名单）</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}
