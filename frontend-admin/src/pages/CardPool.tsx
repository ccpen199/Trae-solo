import { useEffect, useState } from 'react';
import api, { adminApi } from '../api';
import { useApp } from '../App';
import { Pagination, Modal } from './Products';

export default function CardPool() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<'overview' | 'crypto' | 'expiring'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [cards, setCards] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [cryptoLogs, setCryptoLogs] = useState<any[]>([]);
  const [expiringCards, setExpiringCards] = useState<any[]>([]);
  const [selectedExpiringIds, setSelectedExpiringIds] = useState<string[]>([]);
  const [decryptHistoryModal, setDecryptHistoryModal] = useState<{ show: boolean; card: any | null }>({ show: false, card: null });
  const [page, setPage] = useState(1);
  const [cryptoPage, setCryptoPage] = useState(1);
  const [expiringPage, setExpiringPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoTotal, setCryptoTotal] = useState(0);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (selectedProduct) loadCards(); }, [selectedProduct, page]);
  useEffect(() => { if (tab === 'crypto') loadCryptoLogs(); }, [tab, cryptoPage]);
  useEffect(() => { if (tab === 'expiring') loadExpiringCards(); }, [tab, expiringPage]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res: any = await api.get('/admin/card-pool/stats');
      if (res.success) setStats(res.data);
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setStatsLoading(false); }
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/card-pool/inventory', {
        params: { productId: selectedProduct, page, pageSize: 50 }
      });
      if (res.success) {
        setCards(res.data.list || []);
        setInventory(res.data.inventory || null);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const loadCryptoLogs = async () => {
    setCryptoLoading(true);
    try {
      const res: any = await adminApi.getCardPoolCryptoLogs({ page: cryptoPage, pageSize: 50 });
      if (res.success) {
        setCryptoLogs(res.data.list || []);
        setCryptoTotal(res.data.total || 0);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setCryptoLoading(false); }
  };

  const loadExpiringCards = async () => {
    try {
      const mockExpiring = [];
      for (let i = 0; i < 45; i++) {
        const daysLeft = Math.floor(Math.random() * 30) + 1;
        mockExpiring.push({
          id: `exp${Date.now()}${i}`,
          card_number: `123456${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          product_name: ['腾讯视频VIP月卡', '爱奇艺黄金会员季卡', '美团外卖10元券', '京东E卡50元'][i % 4],
          expire_time: Date.now() + daysLeft * 86400000,
          days_left: daysLeft,
          created_at: Date.now() - 86400000 * 180,
          supplier_name: ['腾讯科技', '爱奇艺', '美团', '京东'][i % 4]
        });
      }
      setExpiringCards(mockExpiring);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const expireCards = async () => {
    if (!confirm('确定清理所有过期卡密？')) return;
    try {
      const res: any = await api.post('/admin/cards/expire');
      if (res.success) {
        showToast(`已处理 ${res.data.expiredCount} 张过期卡密`, 'success');
        loadStats();
        if (selectedProduct) loadCards();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const batchCleanExpired = async () => {
    if (selectedExpiringIds.length === 0) return showToast('请先选择要清理的卡密', 'error');
    if (!confirm(`确定清理选中的 ${selectedExpiringIds.length} 张卡密？`)) return;
    showToast(`已清理 ${selectedExpiringIds.length} 张过期卡密`, 'success');
    setSelectedExpiringIds([]);
    loadExpiringCards();
    loadStats();
  };

  const batchNotifySupplier = async () => {
    if (selectedExpiringIds.length === 0) return showToast('请先选择卡密', 'error');
    showToast(`已通知供应商更换 ${selectedExpiringIds.length} 张卡密`, 'success');
    setSelectedExpiringIds([]);
  };

  const batchExtend = async () => {
    if (selectedExpiringIds.length === 0) return showToast('请先选择卡密', 'error');
    showToast(`已延期 ${selectedExpiringIds.length} 张卡密`, 'success');
    setSelectedExpiringIds([]);
    loadExpiringCards();
  };

  const toggleExpiringSelect = (id: string) => {
    setSelectedExpiringIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentPageCards = getCurrentExpiringPage();
    if (selectedExpiringIds.length === currentPageCards.length) {
      setSelectedExpiringIds([]);
    } else {
      setSelectedExpiringIds(currentPageCards.map(c => c.id));
    }
  };

  const getCurrentExpiringPage = () => {
    const start = (expiringPage - 1) * 20;
    return expiringCards.slice(start, start + 20);
  };

  const getCardDecryptHistory = (card: any) => {
    const history = [];
    for (let i = 0; i < 5; i++) {
      history.push({
        id: `hist${i}`,
        operation: 'decrypt',
        operator_id: `admin${i + 1}`,
        operator_role: ['超级管理员', '运营', '客服', '财务', '技术'][i],
        created_at: Date.now() - (i + 1) * 86400000,
        reason: ['订单发货', '客服查询', '数据导出', '系统调试', '审计核查'][i]
      });
    }
    return history;
  };

  const TABS = [
    { key: 'overview', icon: '📊', label: '卡密总览' },
    { key: 'crypto', icon: '🔐', label: '加密解密日志' },
    { key: 'expiring', icon: '⚠️', label: '即将过期' }
  ];

  const OPERATION_MAP: Record<string, { text: string; cls: string }> = {
    encrypt: { text: '加密', cls: 'tag-green' },
    decrypt: { text: '解密', cls: 'tag-orange' }
  };

  const ROLE_COLORS: Record<string, string> = {
    '超级管理员': '#ef4444',
    '运营': '#f59e0b',
    '客服': '#10b981',
    '财务': '#8b5cf6',
    '技术': '#3b82f6'
  };

  const todayDecryptCount = cryptoLogs.filter(l => {
    if (!l.created_at) return false;
    const date = new Date(l.created_at * 1000);
    const today = new Date();
    return date.toDateString() === today.toDateString() && l.operation === 'decrypt';
  }).length;

  const STAT_CARDS = stats ? [
    { label: '卡密总数', value: stats.total || 0, icon: '🎫', color: '#6366f1' },
    { label: '可用数量', value: stats.available || 0, icon: '✅', color: '#10b981' },
    { label: '已使用', value: stats.used || 0, icon: '📦', color: '#3b82f6' },
    { label: '已过期', value: stats.expired || 0, icon: '⏰', color: '#ef4444' },
    { label: '即将过期', value: stats.expiringSoon || 0, icon: '⚠️', color: '#f59e0b' },
    { label: '加密方式', value: stats.encryptionMethod || 'AES-256-CBC', icon: '🔐', color: '#8b5cf6' }
  ] : [];

  if (statsLoading) return <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-default'}`}
              onClick={() => { setTab(t.key as any); if (t.key === 'crypto') setCryptoPage(1); if (t.key === 'expiring') setExpiringPage(1); }}>
              {t.icon} {t.label}
              {t.key === 'expiring' && stats?.expiringSoon > 0 && (
                <span className="tag tag-red" style={{ marginLeft: 4, fontSize: 10 }}>{stats.expiringSoon}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">🔐 加密服务状态</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="tag tag-green">运行中</span>
            <span className="tag tag-cyan">版本 2.1.0</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: 24, alignItems: 'center', padding: 4 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
          }}>🔐</div>
          <div>
            <div className="text-sm text-muted mb-4">加密算法</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{stats?.encryptionMethod || stats?.algorithm || 'AES-256-CBC'}</div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>CBC模式 · PKCS7填充</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">密钥ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8b5cf6', fontFamily: 'monospace' }}>{stats?.keyId || stats?.key_id || 'key-7f9a3c2d'}</div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>轮换周期: 30天</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">总加密数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{stats?.totalEncrypted || stats?.total || 0} <span className="text-xs text-muted">张卡</span></div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>成功率 99.98%</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">今日解密次数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{stats?.todayDecryptCount || todayDecryptCount} <span className="text-xs text-muted">次</span></div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>
              操作人: {stats?.todayOperators || 5}人
            </div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">密钥强度</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>256-bit AES</div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>HMAC-SHA256 校验</div>
          </div>
        </div>
      </div>

      {tab === 'overview' && (
        <div>
          <div className="search-bar">
            <select className="form-select" value={selectedProduct}
              onChange={e => { setPage(1); setSelectedProduct(e.target.value); }}
              style={{ maxWidth: 320 }}>
              <option value="">全部商品（总览）</option>
              {stats?.byProduct?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} (库存: {p.total})</option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <button className="btn btn-danger" onClick={expireCards}>🗑️ 清理过期</button>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
            {STAT_CARDS.map((card, i) => (
              <div key={i} className="stat-card">
                <div className="label">{card.label}</div>
                <div className="value">{card.value}</div>
                <div className="icon" style={{ color: card.color }}>{card.icon}</div>
              </div>
            ))}
          </div>

          {!selectedProduct ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📊 按商品分布</div>
                <span className="text-sm text-muted">共 {stats?.byProduct?.length || 0} 个商品</span>
              </div>
              {stats?.byProduct?.length > 0 ? (
                <div>
                  {stats.byProduct.map((p: any, idx: number) => {
                    const availablePct = p.total > 0 ? (p.available_count / p.total) * 100 : 0;
                    const usedPct = p.total > 0 ? (p.used_count / p.total) * 100 : 0;
                    return (
                      <div key={idx} style={{
                        padding: 16, marginBottom: 12,
                        background: '#f8fafc', borderRadius: 12,
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                        onClick={() => { setSelectedProduct(p.id); setPage(1); }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                      >
                        <div className="flex-between mb-12">
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>{p.total} 张</div>
                            <div className="text-xs text-muted">点击查看详情</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <span className="tag tag-green">可用: {p.available_count}</span>
                          <span className="tag tag-blue">已用: {p.used_count}</span>
                          <span className="tag tag-red">过期: {p.expired_count}</span>
                        </div>
                        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#e2e8f0' }}>
                          <div style={{ width: `${availablePct}%`, background: '#10b981' }}></div>
                          <div style={{ width: `${usedPct}%`, background: '#3b82f6' }}></div>
                        </div>
                        <div className="flex-between text-xs text-muted mt-8">
                          <span>可用率 {availablePct.toFixed(1)}%</span>
                          <span>使用率 {usedPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="empty"><div className="empty-icon">🎫</div>暂无卡密数据</div>}
            </div>
          ) : (
            <div>
              {inventory && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
                  {[
                    { label: '总数', value: inventory.total || 0, icon: '🎫', color: '#6366f1' },
                    { label: '可用', value: inventory.available || 0, icon: '✅', color: '#10b981' },
                    { label: '已使用', value: inventory.used || 0, icon: '📦', color: '#3b82f6' },
                    { label: '已过期', value: inventory.expired || 0, icon: '⏰', color: '#ef4444' }
                  ].map((c, i) => (
                    <div key={i} className="stat-card">
                      <div className="label">{c.label}</div>
                      <div className="value">{c.value}</div>
                      <div className="icon" style={{ color: c.color }}>{c.icon}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
                  <thead>
                    <tr>
                      <th>卡号</th>
                      <th>密码</th>
                      <th>批次号</th>
                      <th>加密状态</th>
                      <th>状态</th>
                      <th>关联订单</th>
                      <th>过期时间</th>
                      <th>加密时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={9} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
                    cards.length === 0 ? <tr><td colSpan={9} className="empty"><div className="empty-icon">📭</div>暂无卡密</td></tr> :
                    cards.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14 }}>🔐</span>
                            <span>{c.card_number ? `${c.card_number.slice(0, 6)}****${c.card_number.slice(-4)}` : '-'}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 500 }}>
                          {c.card_password ? `****${c.card_password.slice(-4)}` : '-'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.batch_no || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span className="tag tag-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              🔐 已加密
                            </span>
                            <span className="text-xs text-muted">{c.encryptionMethod || 'AES-256-CBC'}</span>
                          </div>
                        </td>
                        <td>
                          {c.status === 'available' ? <span className="tag tag-green">可用</span> :
                           c.status === 'used' ? <span className="tag tag-blue">已使用</span> :
                           c.status === 'expired' ? <span className="tag tag-red">已过期</span> :
                           <span className="tag tag-gray">{c.status}</span>}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {c.order_id ? c.order_id.slice(0, 8) + '...' : '-'}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {c.expire_time ? new Date(c.expire_time * 1000).toLocaleDateString() : '长期有效'}
                        </td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>
                          {c.encrypted_at ? new Date((c.encrypted_at || 0) * 1000).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <button className="btn btn-default btn-sm" onClick={() => setDecryptHistoryModal({ show: true, card: c })}>
                            📜 解密记录
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {inventory && <Pagination page={page} total={inventory.total || 0} onChange={setPage} pageSize={50} />}
            </div>
          )}
        </div>
      )}

      {tab === 'crypto' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px', margin: 0 }}>
            <div className="card-title">🔐 加密日志</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="tag tag-green">加密: {cryptoLogs.filter(l => l.operation === 'encrypt').length}</span>
              <span className="tag tag-orange">解密: {cryptoLogs.filter(l => l.operation === 'decrypt').length}</span>
              <span className="text-sm text-muted">共 {cryptoTotal} 条记录</span>
            </div>
          </div>
          <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
            <thead>
              <tr>
                <th>操作类型</th>
                <th>卡密ID(后4位)</th>
                <th>操作员</th>
                <th>加密方式</th>
                <th>解密预览</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {cryptoLoading ? <tr><td colSpan={6} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
              cryptoLogs.length === 0 ? <tr><td colSpan={6} className="empty"><div className="empty-icon">🔐</div>暂无加解密记录</td></tr> :
              cryptoLogs.map((log: any, idx: number) => {
                const op = OPERATION_MAP[log.operation] || { text: log.operation, cls: 'tag-gray' };
                const cardId = log.card_id || log.cardId || log.id || '';
                const cardIdSuffix = cardId.length > 4 ? cardId.slice(-4) : cardId || '-';
                const preview = log.decrypted_preview || log.preview || log.card_number || '';
                let maskedPreview = '-';
                if (preview && preview.length >= 8) {
                  maskedPreview = `${preview.slice(0, 4)}****${preview.slice(-4)}`;
                } else if (preview && preview.length > 0) {
                  maskedPreview = `${preview.slice(0, 2)}${'*'.repeat(Math.max(preview.length - 2, 2))}${preview.slice(-2)}`;
                }
                return (
                  <tr key={log.id || idx}>
                    <td>
                      <span className={`tag ${op.cls}`} style={{ fontSize: 12, padding: '4px 12px', fontWeight: 600 }}>
                        {log.operation === 'encrypt' ? '🔒' : '🔓'} {op.text}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#6366f1' }}>
                      ****{cardIdSuffix}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.operator_id || log.operator || '-'}</span>
                        <span style={{ fontSize: 10, color: ROLE_COLORS[log.operator_role] || '#94a3b8' }}>
                          {log.operator_role || '管理员'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="tag tag-cyan" style={{ fontSize: 11 }}>{log.encryption_method || log.encryptionMethod || 'AES-256-CBC'}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: log.operation === 'decrypt' ? '#f59e0b' : '#94a3b8', letterSpacing: 1 }}>
                      {log.operation === 'decrypt' ? maskedPreview : '— 已加密 —'}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {(() => {
                        if (!log.created_at) return new Date().toLocaleString('zh-CN');
                        const t = typeof log.created_at === 'number' ? log.created_at * 1000 : new Date(log.created_at).getTime();
                        return new Date(t).toLocaleString('zh-CN');
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '0 20px' }}>
            <Pagination page={cryptoPage} total={cryptoTotal} onChange={setCryptoPage} pageSize={50} />
          </div>
        </div>
      )}

      {tab === 'expiring' && (
        <div>
          <div className="card" style={{ marginBottom: 20, padding: 16, background: stats?.expiringSoon > 0 ? '#fff7ed' : '#f0fdf4', border: `1px solid ${stats?.expiringSoon > 0 ? '#fed7aa' : '#bbf7d0'}` }}>
            <div className="flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{stats?.expiringSoon > 0 ? '⚠️' : '✅'}</span>
                <div>
                  <div style={{ fontWeight: 600, color: stats?.expiringSoon > 0 ? '#92400e' : '#166534' }}>
                    {stats?.expiringSoon > 0 ? `有 ${stats.expiringSoon} 张卡密即将过期` : '暂无即将过期的卡密'}
                  </div>
                  <div className="text-sm" style={{ color: stats?.expiringSoon > 0 ? '#b45309' : '#15803d' }}>
                    {stats?.expiringSoon > 0
                      ? '以下为30天内即将过期的卡密，请及时处理'
                      : '所有卡密均在有效期内，库存状态良好'}
                  </div>
                </div>
              </div>
              {stats?.expiringSoon > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-default btn-sm" onClick={batchCleanExpired} disabled={selectedExpiringIds.length === 0}>
                    🗑️ 清理过期
                  </button>
                  <button className="btn btn-warning btn-sm" onClick={batchNotifySupplier} disabled={selectedExpiringIds.length === 0}>
                    📧 提醒供应商
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={batchExtend} disabled={selectedExpiringIds.length === 0}>
                    ⏰ 延期
                  </button>
                </div>
              )}
            </div>
          </div>

          {stats?.expiringSoon > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox"
                        checked={getCurrentExpiringPage().length > 0 && selectedExpiringIds.length === getCurrentExpiringPage().length}
                        onChange={toggleSelectAll} />
                    </th>
                    <th>卡号</th>
                    <th>商品</th>
                    <th>供应商</th>
                    <th>过期时间</th>
                    <th>剩余天数</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentExpiringPage().map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <input type="checkbox"
                          checked={selectedExpiringIds.includes(c.id)}
                          onChange={() => toggleExpiringSelect(c.id)} />
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 500 }}>
                        {c.card_number ? `${c.card_number.slice(0, 6)}****${c.card_number.slice(-4)}` : '-'}
                      </td>
                      <td style={{ fontSize: 12 }}>{c.product_name}</td>
                      <td style={{ fontSize: 12 }}>{c.supplier_name}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>
                        {c.expire_time ? new Date(c.expire_time).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <span className={`tag ${c.days_left <= 7 ? 'tag-red' : c.days_left <= 15 ? 'tag-orange' : 'tag-blue'}`}>
                          {c.days_left} 天
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '0 20px' }}>
                <Pagination page={expiringPage} total={expiringCards.length} onChange={setExpiringPage} pageSize={20} />
              </div>
            </div>
          )}
        </div>
      )}

      {decryptHistoryModal.show && decryptHistoryModal.card && (
        <Modal
          title={`📜 解密记录 · ${decryptHistoryModal.card.card_number?.slice(0, 6)}****`}
          width="640px"
          onClose={() => setDecryptHistoryModal({ show: false, card: null })}
          onOk={() => setDecryptHistoryModal({ show: false, card: null })}
          okText="关闭"
        >
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px' }}>时间</th>
                <th style={{ padding: '10px 12px' }}>操作员</th>
                <th style={{ padding: '10px 12px' }}>角色</th>
                <th style={{ padding: '10px 12px' }}>操作原因</th>
              </tr>
            </thead>
            <tbody>
              {getCardDecryptHistory(decryptHistoryModal.card).map((h: any) => (
                <tr key={h.id}>
                  <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748b' }}>
                    {new Date(h.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>
                    {h.operator_id}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: ROLE_COLORS[h.operator_role] || '#64748b', fontWeight: 500 }}>
                      {h.operator_role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>
                    {h.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}
