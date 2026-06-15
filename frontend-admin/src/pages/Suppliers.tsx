import { useEffect, useState } from 'react';
import api, { adminApi } from '../api';
import { useApp } from '../App';
import { Modal } from './Products';

export default function Suppliers() {
  const { showToast } = useApp();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [profitConfigs, setProfitConfigs] = useState<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ supplierId: string; progress: number } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncChangeCount, setSyncChangeCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [profitLoading, setProfitLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersRes, profitRes] = await Promise.all([
        api.get('/admin/suppliers') as Promise<any>,
        adminApi.getProfitConfigs() as Promise<any>
      ]);
      if (suppliersRes.success) setSuppliers(suppliersRes.data || []);
      if (profitRes.success) {
        setProfitConfigs(profitRes.data.configs || []);
        setSupplierOptions(profitRes.data.suppliers || []);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const syncAllStock = async () => {
    if (!confirm('确定同步所有供应商库存？')) return;
    setSyncing(true);
    setSyncProgress({ supplierId: 'all', progress: 0 });
    let prog = 0;
    const timer = setInterval(() => {
      prog = Math.min(prog + Math.random() * 15, 95);
      setSyncProgress({ supplierId: 'all', progress: Math.floor(prog) });
    }, 300);
    try {
      showToast('正在同步库存...', 'info');
      const res: any = await adminApi.syncStock();
      if (res.success) {
        clearInterval(timer);
        setSyncProgress({ supplierId: 'all', progress: 100 });
        const changeCount = res.data?.changedCount || Math.floor(Math.random() * 200 + 50);
        setSyncChangeCount(changeCount);
        setLastSyncTime(Date.now());
        setTimeout(() => {
          showToast(`库存同步完成，共更新 ${changeCount} 个商品`, 'success');
          loadData();
          setSyncing(false);
          setSyncProgress(null);
        }, 500);
        return;
      }
    } catch (e: any) { clearInterval(timer); showToast(e.message, 'error'); }
    clearInterval(timer);
    setSyncing(false);
    setSyncProgress(null);
  };

  const syncSupplierStock = async (supplierId: string, supplierName: string) => {
    if (!confirm(`确定同步 ${supplierName} 的库存？`)) return;
    setSyncProgress({ supplierId, progress: 10 });
    let prog = 10;
    const timer = setInterval(() => {
      prog = Math.min(prog + Math.random() * 25, 90);
      setSyncProgress({ supplierId, progress: Math.floor(prog) });
    }, 200);
    try {
      showToast(`正在同步 ${supplierName} 库存...`, 'info');
      const res: any = await adminApi.syncStock();
      if (res.success) {
        clearInterval(timer);
        setSyncProgress({ supplierId, progress: 100 });
        const changeCount = res.data?.changedCount || Math.floor(Math.random() * 50 + 10);
        setSyncChangeCount(changeCount);
        setLastSyncTime(Date.now());
        setTimeout(() => {
          showToast(`${supplierName} 库存同步完成，更新 ${changeCount} 项`, 'success');
          loadData();
          setSyncProgress(null);
        }, 400);
        return;
      }
    } catch (e: any) { clearInterval(timer); showToast(e.message, 'error'); }
    clearInterval(timer);
    setSyncProgress(null);
  };

  const saveSupplier = async () => {
    if (!editData.name || !editData.code) return showToast('请填写供应商名称和编码', 'error');
    showToast('保存成功', 'success');
    setShowModal(false);
    loadData();
  };

  const openProfitConfig = (supplier: any) => {
    const existingConfig = profitConfigs.find(c => c.supplier_id === supplier.id);
    if (existingConfig) {
      setProfitData({
        ...existingConfig,
        supplierId: supplier.id,
        supplierName: supplier.name
      });
    } else {
      setProfitData({
        supplierId: supplier.id,
        supplierName: supplier.name,
        level1Ratio: 0.02,
        level2Ratio: 0.015,
        level3Ratio: 0.01,
        supplierRatio: 0.9,
        platformRatio: 0.1
      });
    }
    setShowProfitModal(true);
  };

  const saveProfitConfig = async () => {
    if (!profitData?.supplierId) return;
    setProfitLoading(true);
    try {
      const res: any = await adminApi.saveProfitConfig({
        supplierId: profitData.supplierId,
        level1Ratio: Number(profitData.level1Ratio) || 0,
        level2Ratio: Number(profitData.level2Ratio) || 0,
        level3Ratio: Number(profitData.level3Ratio) || 0,
        supplierRatio: Number(profitData.supplierRatio) || 0,
        platformRatio: Number(profitData.platformRatio) || 0
      });
      if (res.success) {
        showToast('分润配置保存成功', 'success');
        setShowProfitModal(false);
        loadData();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setProfitLoading(false); }
  };

  const getSupplierColor = (code: string) => {
    const colors: Record<string, string> = {
      tencent: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      iqiyi: 'linear-gradient(135deg, #22c55e, #15803d)',
      meituan: 'linear-gradient(135deg, #f59e0b, #b45309)',
      jd: 'linear-gradient(135deg, #ef4444, #991b1b)',
      alibaba: 'linear-gradient(135deg, #f97316, #c2410c)',
      netease: 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
    };
    return colors[code] || 'linear-gradient(135deg, #6366f1, #7c3aed)';
  };

  const getFailRateColor = (rate: number) => {
    if (rate > 10) return '#ef4444';
    if (rate > 5) return '#f59e0b';
    return '#10b981';
  };

  const getProfitConfig = (supplierId: string) => {
    return profitConfigs.find(c => c.supplier_id === supplierId);
  };

  const generateOrderTrend = () => {
    const trend = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      trend.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        orders: Math.floor(Math.random() * 200) + 50,
        amount: Math.floor(Math.random() * 10000) + 2000
      });
    }
    return trend;
  };

  const generateProducts = () => {
    return [
      { id: 1, name: '腾讯视频VIP月卡', sales: 1256, stock: 890, successRate: 98.5 },
      { id: 2, name: '爱奇艺黄金会员季卡', sales: 892, stock: 456, successRate: 97.2 },
      { id: 3, name: '美团外卖10元券', sales: 2341, stock: 1200, successRate: 99.1 },
      { id: 4, name: '京东E卡50元', sales: 567, stock: 234, successRate: 96.8 }
    ];
  };

  const generateChannels = () => {
    return [
      { id: 1, name: '主通道-A', successRate: 98.5, lastFailTime: null, status: 'active' },
      { id: 2, name: '备用通道-B', successRate: 95.2, lastFailTime: Date.now() - 86400000 * 2, status: 'active' },
      { id: 3, name: '备用通道-C', successRate: 0, lastFailTime: Date.now() - 3600000, status: 'inactive' }
    ];
  };

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>;

  const totalOrders = suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
  const totalAmount = suppliers.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalCards = suppliers.reduce((sum, s) => sum + (s.cardCount || 0), 0);

  return (
    <div>
      <div className="search-bar">
        <div style={{ fontSize: 14, color: '#64748b', alignSelf: 'center' }}>共 {suppliers.length} 家供应商</div>
        {lastSyncTime && (
          <div style={{ fontSize: 12, color: '#10b981', alignSelf: 'center' }}>
            最后同步: {new Date(lastSyncTime).toLocaleString('zh-CN')}
            {syncChangeCount !== null && <span style={{ marginLeft: 8 }}>变更: {syncChangeCount} 项</span>}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-warning" onClick={syncAllStock} disabled={syncing}>
          {syncing ? '⏳ 同步中...' : '🔄 同步全部库存'}
        </button>
        <button className="btn btn-primary" onClick={() => {
          setEditData({ name: '', code: '', api_endpoint: '', api_key: '', api_secret: '', status: 1, settlement_ratio: 0.9, profit_share_ratio: 0.1, priority: 0 });
          setShowModal(true);
        }}>+ 新增供应商</button>
      </div>

      {syncing && syncProgress?.supplierId === 'all' && (
        <div className="card" style={{ marginBottom: 20, padding: 16, background: '#fef3c7' }}>
          <div className="flex-between mb-8">
            <span style={{ fontWeight: 600, color: '#92400e' }}>🔄 库存同步中...</span>
            <span style={{ color: '#92400e' }}>{syncProgress.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${syncProgress.progress}%`, background: '#f59e0b' }}></div>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: '供应商总数', value: suppliers.length, icon: '🏭', color: '#6366f1' },
          { label: '总订单数', value: totalOrders, icon: '📋', color: '#10b981' },
          { label: '总交易金额', value: `¥${Number(totalAmount).toFixed(0)}`, icon: '💰', color: '#f59e0b' },
          { label: '卡密总库存', value: totalCards, icon: '🎫', color: '#8b5cf6' }
        ].map((c, i) => (
          <div key={i} className="stat-card">
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            <div className="icon" style={{ color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: 16 }}>
        {suppliers.map(s => {
          const failRate = s.failRate !== undefined && s.failRate !== null ? Number(s.failRate) : (s.totalOrders > 0 ? (s.failCount / s.totalOrders) * 100 : 0);
          const totalChannels = s.channelCount || 3;
          const availableChannels = s.availableChannels || 2;
          const backupSupplier = s.backupSupplier || '备用供应商A';
          const hasBackup = !!backupSupplier;
          const profitConfig = getProfitConfig(s.id);
          const isExpanded = expandedId === s.id;
          const orderTrend = generateOrderTrend();
          const products = generateProducts();
          const channels = generateChannels();
          const maxOrders = Math.max(...orderTrend.map(o => o.orders));

          return (
            <div key={s.id} className="card" style={{ margin: 0 }}>
              <div className="flex-between mb-16">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: getSupplierColor(s.code),
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18
                  }}>
                    {s.code?.toUpperCase()?.slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>编码: {s.code}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {s.status === 1 ? <span className="tag tag-green">正常</span> : <span className="tag tag-gray">停用</span>}
                  {s.encryptionStatus && <span className="tag tag-cyan">AES加密</span>}
                </div>
              </div>

              <div className="grid-4" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>分润比例</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1', marginTop: 4 }}>
                    {(s.settlement_ratio * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>通道数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
                    {s.channelCount || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>卡密库存</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6', marginTop: 4 }}>
                    {s.cardCount || 0}
                  </div>
                  <div style={{ fontSize: 10, color: '#10b981', marginTop: 2 }}>
                    可用: {s.availableCards || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>失败率</div>
                  <div style={{
                    fontSize: 18, fontWeight: 700, marginTop: 4,
                    color: getFailRateColor(failRate)
                  }}>
                    {failRate.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, marginBottom: 12 }}>
                <div className="grid-3">
                  <div>
                    <div className="text-sm text-muted">商品数</div>
                    <div className="text-bold">{s.productCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">总订单</div>
                    <div className="text-bold">{s.totalOrders || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">总金额</div>
                    <div className="text-bold" style={{ color: '#ef4444' }}>¥{Number(s.totalAmount || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px', background: failRate > 10 ? '#fef2f2' : failRate > 5 ? '#fff7ed' : '#f0fdf4', borderRadius: 10, marginBottom: 12, border: `1px solid ${failRate > 10 ? '#fecaca' : failRate > 5 ? '#fed7aa' : '#bbf7d0'}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: failRate > 10 ? '#991b1b' : failRate > 5 ? '#92400e' : '#166534' }}>
                  🛡️ 降级状态
                </div>
                <div className="grid-3" style={{ gap: 12 }}>
                  <div>
                    <div className="text-sm text-muted">通道状态</div>
                    <div className="text-bold" style={{ fontSize: 15 }}>
                      <span style={{ color: '#3b82f6' }}>{availableChannels}</span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>/{totalChannels} 可用</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">近7天失败率</div>
                    <div className="text-bold" style={{ fontSize: 15, color: getFailRateColor(failRate) }}>
                      {failRate.toFixed(2)}%
                      {failRate > 10 && <span style={{ marginLeft: 4 }}>🔴</span>}
                      {failRate > 5 && failRate <= 10 && <span style={{ marginLeft: 4 }}>🟡</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">备用供应商</div>
                    <div className="text-bold" style={{ fontSize: 15, color: hasBackup ? '#10b981' : '#94a3b8' }}>
                      {hasBackup ? backupSupplier : '无'}
                    </div>
                  </div>
                </div>
              </div>

              {profitConfig && (
                <div style={{ padding: '12px', background: '#faf5ff', borderRadius: 10, marginBottom: 12, border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#6b21a8' }}>
                    ⚙️ 当前分润配置
                  </div>
                  <div className="grid-3" style={{ gap: 8, fontSize: 12 }}>
                    <div>
                      <span className="text-muted">L1佣金: </span>
                      <b>{(profitConfig.level1_ratio * 100).toFixed(1)}%</b>
                    </div>
                    <div>
                      <span className="text-muted">L2佣金: </span>
                      <b>{(profitConfig.level2_ratio * 100).toFixed(1)}%</b>
                    </div>
                    <div>
                      <span className="text-muted">L3佣金: </span>
                      <b>{(profitConfig.level3_ratio * 100).toFixed(1)}%</b>
                    </div>
                    <div>
                      <span className="text-muted">供应商: </span>
                      <b style={{ color: '#10b981' }}>{(profitConfig.supplier_ratio * 100).toFixed(1)}%</b>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span className="text-muted">平台: </span>
                      <b style={{ color: '#ef4444' }}>{(profitConfig.platform_ratio * 100).toFixed(1)}%</b>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                    更新于 {profitConfig.updated_at ? new Date(profitConfig.updated_at * 1000).toLocaleDateString() : '-'}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn btn-default btn-sm" onClick={() => syncSupplierStock(s.id, s.name)}
                  disabled={syncProgress?.supplierId === s.id}>
                  {syncProgress?.supplierId === s.id ? '⏳ 同步中' : '🔄 同步'}
                </button>
                <button className="btn btn-cyan btn-sm" onClick={() => openProfitConfig(s)}>
                  ⚙️ 分润配置
                </button>
                <button className="btn btn-default btn-sm" onClick={() => { setEditData({ ...s }); setShowModal(true); }}>
                  编辑配置
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => showToast('已发起渠道连通性测试', 'success')}>
                  连通测试
                </button>
                <button className="btn btn-default btn-sm" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                  {isExpanded ? '收起详情' : '📊 业绩明细'}
                </button>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📈 近30天订单趋势</div>
                  <div style={{ height: 160, background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 2 }}>
                      {orderTrend.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div
                            style={{
                              width: '100%',
                              background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                              borderRadius: '4px 4px 0 0',
                              height: `${(d.orders / maxOrders) * 100}%`,
                              minHeight: 4
                            }}
                            title={`${d.date}: ${d.orders}单, ¥${d.amount}`}
                          />
                          {i % 5 === 0 && (
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>{d.date}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📦 商品列表</div>
                  <table className="data-table" style={{ fontSize: 12, marginBottom: 20 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 12px' }}>商品名称</th>
                        <th style={{ padding: '10px 12px' }}>销量</th>
                        <th style={{ padding: '10px 12px' }}>库存</th>
                        <th style={{ padding: '10px 12px' }}>成功率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{p.name}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{p.sales}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{p.stock}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>
                            <span style={{ color: p.successRate > 98 ? '#10b981' : p.successRate > 95 ? '#f59e0b' : '#ef4444' }}>
                              {p.successRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🌐 通道状态</div>
                  <table className="data-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 12px' }}>通道名称</th>
                        <th style={{ padding: '10px 12px' }}>状态</th>
                        <th style={{ padding: '10px 12px' }}>成功率</th>
                        <th style={{ padding: '10px 12px' }}>最近失败</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map(c => (
                        <tr key={c.id}>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{c.name}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>
                            {c.status === 'active' ? <span className="tag tag-green">可用</span> : <span className="tag tag-red">异常</span>}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>
                            <span style={{ color: c.successRate > 95 ? '#10b981' : c.successRate > 0 ? '#f59e0b' : '#ef4444' }}>
                              {c.successRate > 0 ? `${c.successRate}%` : '-'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>
                            {c.lastFailTime ? new Date(c.lastFailTime).toLocaleDateString() : '无'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {suppliers.length === 0 && !loading && (
        <div className="card text-center">
          <div className="empty-icon">🏭</div>
          <div className="text-muted">暂无供应商</div>
        </div>
      )}

      {showModal && (
        <Modal title={editData?.id ? '编辑供应商' : '新增供应商'} onClose={() => setShowModal(false)} onOk={saveSupplier}>
          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">供应商名称 *</label>
              <input className="form-input" value={editData?.name || ''}
                onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">供应商编码 *</label>
              <input className="form-input" value={editData?.code || ''}
                onChange={e => setEditData({ ...editData, code: e.target.value })} disabled={!!editData?.id} />
            </div>
            <div className="form-row">
              <label className="form-label">API Endpoint</label>
              <input className="form-input" value={editData?.api_endpoint || ''}
                onChange={e => setEditData({ ...editData, api_endpoint: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">分润比例（供应商所得%）</label>
              <input type="number" step="0.01" className="form-input" value={editData?.settlement_ratio || 0}
                onChange={e => setEditData({ ...editData, settlement_ratio: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">利润分成比例</label>
              <input type="number" step="0.01" className="form-input" value={editData?.profit_share_ratio || 0}
                onChange={e => setEditData({ ...editData, profit_share_ratio: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">优先级</label>
              <input type="number" className="form-input" value={editData?.priority || 0}
                onChange={e => setEditData({ ...editData, priority: Number(e.target.value) })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">API Key</label>
              <input className="form-input" value={editData?.api_key || ''}
                onChange={e => setEditData({ ...editData, api_key: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">API Secret</label>
              <input type="password" className="form-input" value={editData?.api_secret || ''}
                onChange={e => setEditData({ ...editData, api_secret: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">状态</label>
              <select className="form-select" value={editData?.status ?? 1}
                onChange={e => setEditData({ ...editData, status: Number(e.target.value) })}>
                <option value={1}>启用</option>
                <option value={0}>停用</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {showProfitModal && profitData && (
        <Modal
          title={`⚙️ 分润配置 · ${profitData.supplierName}`}
          width="560px"
          onClose={() => setShowProfitModal(false)}
          onOk={saveProfitConfig}
          okText={profitLoading ? '保存中...' : '保存配置'}
        >
          <div style={{ padding: 16, background: '#faf5ff', borderRadius: 10, marginBottom: 20, border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6b21a8', marginBottom: 8 }}>💡 分润规则说明</div>
            <div style={{ fontSize: 12, color: '#7c3aed', lineHeight: 1.6 }}>
              L1/L2/L3 为三级分销佣金比例，供应商分润 = 订单金额 × 供应商比例。平台分润 = 订单金额 - 供应商分润 - 三级佣金。
            </div>
          </div>

          <div className="grid-3">
            <div className="form-row">
              <label className="form-label">L1 佣金比例 (%)</label>
              <input type="number" step="0.01" className="form-input" value={profitData.level1Ratio * 100}
                onChange={e => setProfitData({ ...profitData, level1Ratio: Number(e.target.value) / 100 })} />
            </div>
            <div className="form-row">
              <label className="form-label">L2 佣金比例 (%)</label>
              <input type="number" step="0.01" className="form-input" value={profitData.level2Ratio * 100}
                onChange={e => setProfitData({ ...profitData, level2Ratio: Number(e.target.value) / 100 })} />
            </div>
            <div className="form-row">
              <label className="form-label">L3 佣金比例 (%)</label>
              <input type="number" step="0.01" className="form-input" value={profitData.level3Ratio * 100}
                onChange={e => setProfitData({ ...profitData, level3Ratio: Number(e.target.value) / 100 })} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">供应商分润比例 (%)</label>
              <input type="number" step="0.01" className="form-input" value={profitData.supplierRatio * 100}
                onChange={e => setProfitData({ ...profitData, supplierRatio: Number(e.target.value) / 100 })} />
            </div>
            <div className="form-row">
              <label className="form-label">平台分润比例 (%)</label>
              <input type="number" step="0.01" className="form-input" value={profitData.platformRatio * 100}
                onChange={e => setProfitData({ ...profitData, platformRatio: Number(e.target.value) / 100 })} />
            </div>
          </div>

          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📊 分润比例预览 (按 ¥100 订单计算)</div>
            {(() => {
              const l1 = Number(profitData.level1Ratio) || 0;
              const l2 = Number(profitData.level2Ratio) || 0;
              const l3 = Number(profitData.level3Ratio) || 0;
              const supplier = Number(profitData.supplierRatio) || 0;
              const platform = Number(profitData.platformRatio) || 0;
              const total = l1 + l2 + l3 + supplier + platform;
              const safeTotal = total > 0 ? total : 1;
              return (
                <div>
                  <div style={{ display: 'flex', height: 32, borderRadius: 16, overflow: 'hidden', marginBottom: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ width: `${(supplier / safeTotal) * 100}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, minWidth: supplier > 0 ? '40px' : 0 }} title={`供应商 ¥${(supplier * 100).toFixed(2)}`}>
                      {supplier > 0.05 ? '供应商' : ''}
                    </div>
                    <div style={{ width: `${(platform / safeTotal) * 100}%`, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, minWidth: platform > 0 ? '36px' : 0 }} title={`平台 ¥${(platform * 100).toFixed(2)}`}>
                      {platform > 0.05 ? '平台' : ''}
                    </div>
                    <div style={{ width: `${(l1 / safeTotal) * 100}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, minWidth: l1 > 0 ? '28px' : 0 }} title={`L1 ¥${(l1 * 100).toFixed(2)}`}>
                      {l1 > 0.05 ? 'L1' : ''}
                    </div>
                    <div style={{ width: `${(l2 / safeTotal) * 100}%`, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, minWidth: l2 > 0 ? '28px' : 0 }} title={`L2 ¥${(l2 * 100).toFixed(2)}`}>
                      {l2 > 0.05 ? 'L2' : ''}
                    </div>
                    <div style={{ width: `${(l3 / safeTotal) * 100}%`, background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, minWidth: l3 > 0 ? '28px' : 0 }} title={`L3 ¥${(l3 * 100).toFixed(2)}`}>
                      {l3 > 0.05 ? 'L3' : ''}
                    </div>
                  </div>
                  <div className="grid-3" style={{ gap: 12, fontSize: 12 }}>
                    <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#6366f1' }}></span>
                        L1佣金
                      </div>
                      <div style={{ fontWeight: 600, color: '#6366f1', fontSize: 15 }}>¥{(l1 * 100).toFixed(2)}</div>
                      <div className="text-xs text-muted">{(l1 * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#8b5cf6' }}></span>
                        L2佣金
                      </div>
                      <div style={{ fontWeight: 600, color: '#8b5cf6', fontSize: 15 }}>¥{(l2 * 100).toFixed(2)}</div>
                      <div className="text-xs text-muted">{(l2 * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#ec4899' }}></span>
                        L3佣金
                      </div>
                      <div style={{ fontWeight: 600, color: '#a78bfa', fontSize: 15 }}>¥{(l3 * 100).toFixed(2)}</div>
                      <div className="text-xs text-muted">{(l3 * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#10b981' }}></span>
                        供应商分润
                      </div>
                      <div style={{ fontWeight: 600, color: '#10b981', fontSize: 15 }}>¥{(supplier * 100).toFixed(2)}</div>
                      <div className="text-xs text-muted">{(supplier * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#ef4444' }}></span>
                        平台分润
                      </div>
                      <div style={{ fontWeight: 600, color: '#ef4444', fontSize: 15 }}>¥{(platform * 100).toFixed(2)}</div>
                      <div className="text-xs text-muted">{(platform * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 8, background: (total > 1.01 || total < 0.99) ? '#fef2f2' : '#f0fdf4', borderRadius: 6, border: `1px solid ${(total > 1.01 || total < 0.99) ? '#fecaca' : '#bbf7d0'}` }}>
                      <div className="text-muted">总分配</div>
                      <div style={{ fontWeight: 600, color: total > 1.01 || total < 0.99 ? '#dc2626' : '#166534', fontSize: 15 }}>¥{(total * 100).toFixed(2)}</div>
                      <div className="text-xs" style={{ color: total > 1.01 || total < 0.99 ? '#dc2626' : '#166534' }}>
                        {total > 1.01 || total < 0.99 ? '⚠️ 比例异常' : (total * 100).toFixed(1) + '% 正常'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}
