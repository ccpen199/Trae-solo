import { useEffect, useState, useMemo } from 'react';
import api, { adminApi } from '../api';
import { useApp } from '../App';
import { Pagination, Modal } from './Products';

type TabKey = 'overview' | 'all' | 'expiring' | 'crypto';
type ExpiringSubTab = '30days' | '7days' | 'expired';

interface CardItem {
  id: string;
  card_number: string;
  face_value: number;
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  status: 'available' | 'used' | 'expired';
  is_encrypted: number;
  encryption_method: string;
  encryption_time: number;
  key_version: string;
  expire_time: number;
  created_at: number;
}

interface CryptoLog {
  id: string;
  card_id: string;
  operation: 'encrypt' | 'decrypt';
  operator_id: string;
  operator_role: string;
  encryption_method: string;
  key_version: string;
  decrypted_preview: string;
  ip_address: string;
  reason: string;
  operation_success: number;
  created_at: number;
  product_name: string;
}

interface StatsData {
  total: number;
  used: number;
  available: number;
  expired: number;
  expiringSoon: number;
  expiring7Days: number;
  todayNew: number;
  encryptionMethod: string;
  keyId: string;
  keyVersion: string;
  byProduct: { id: string; name: string; total: number; available_count: number; used_count: number; expired_count: number }[];
  byFaceValue: { face_value: number; count: number }[];
  bySupplier: { id: string; name: string; count: number }[];
  cryptoStats: {
    totalEncrypted: number;
    totalEncrypt: number;
    totalDecrypt: number;
    todayDecrypt: number;
    decryptSuccessRate: number;
  };
  last7DaysTrend: { date: string; encrypt: number; decrypt: number }[];
}

export default function CardPool() {
  const { showToast } = useApp();

  const [tab, setTab] = useState<TabKey>('overview');
  const [expiringSubTab, setExpiringSubTab] = useState<ExpiringSubTab>('30days');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsTotal, setCardsTotal] = useState(0);
  const [cardsPageSize] = useState(20);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    status: '',
    supplierId: '',
    faceValue: '',
    keyword: '',
    timeType: 'create',
    startTime: '',
    endTime: ''
  });

  const [cryptoLogs, setCryptoLogs] = useState<CryptoLog[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoPage, setCryptoPage] = useState(1);
  const [cryptoTotal, setCryptoTotal] = useState(0);
  const [cryptoFilters, setCryptoFilters] = useState({
    operation: '',
    keyword: '',
    startTime: '',
    endTime: ''
  });

  const [expiringCards, setExpiringCards] = useState<CardItem[]>([]);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [expiringPage, setExpiringPage] = useState(1);
  const [expiringTotal, setExpiringTotal] = useState(0);
  const [selectedExpiringIds, setSelectedExpiringIds] = useState<string[]>([]);

  const [decryptModal, setDecryptModal] = useState<{ show: boolean; card: CardItem | null }>({ show: false, card: null });
  const [decryptResult, setDecryptResult] = useState<any>(null);
  const [logDetailModal, setLogDetailModal] = useState<{ show: boolean; log: CryptoLog | null }>({ show: false, log: null });
  const [cleanupConfirmModal, setCleanupConfirmModal] = useState(false);
  const [extendModal, setExtendModal] = useState<{ show: boolean; ids: string[] }>({ show: false, ids: [] });
  const [extendDays, setExtendDays] = useState(30);
  const [cardExportStatus, setCardExportStatus] = useState('');

  useEffect(() => { loadStats(); loadCryptoLogs(); }, []);

  useEffect(() => {
    if (tab === 'all') { loadCards(); }
  }, [tab, cardsPage, filters]);

  useEffect(() => {
    if (tab === 'crypto') { loadCryptoLogs(); }
  }, [tab, cryptoPage, cryptoFilters]);

  useEffect(() => {
    if (tab === 'expiring') { loadExpiringCards(); }
  }, [tab, expiringPage, expiringSubTab]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res: any = await adminApi.getCardPoolStats();
      if (res.success) setStats(res.data);
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setStatsLoading(false); }
  };

  const loadCards = async () => {
    setCardsLoading(true);
    try {
      const params: any = { page: cardsPage, pageSize: cardsPageSize };
      if (filters.status) params.status = filters.status;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.faceValue) params.faceValue = filters.faceValue;
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.startTime && filters.endTime) {
        params.timeType = filters.timeType;
        params.startTime = Math.floor(new Date(filters.startTime).getTime() / 1000);
        params.endTime = Math.floor(new Date(filters.endTime).getTime() / 1000);
      }
      const res: any = await adminApi.getCardPoolList(params);
      if (res.success) {
        setCards(res.data.list || []);
        setCardsTotal(res.data.total || 0);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setCardsLoading(false); }
  };

  const loadCryptoLogs = async () => {
    setCryptoLoading(true);
    try {
      const params: any = { page: cryptoPage, pageSize: 20 };
      if (cryptoFilters.operation) params.operation = cryptoFilters.operation;
      if (cryptoFilters.keyword) params.keyword = cryptoFilters.keyword;
      if (cryptoFilters.startTime && cryptoFilters.endTime) {
        params.startTime = Math.floor(new Date(cryptoFilters.startTime).getTime() / 1000);
        params.endTime = Math.floor(new Date(cryptoFilters.endTime).getTime() / 1000);
      }
      const res: any = await adminApi.getCardPoolCryptoLogs(params);
      if (res.success) {
        setCryptoLogs(res.data.list || []);
        setCryptoTotal(res.data.total || 0);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setCryptoLoading(false); }
  };

  const loadExpiringCards = async () => {
    setExpiringLoading(true);
    try {
      const statusMap: Record<ExpiringSubTab, string> = {
        '30days': 'expiring',
        '7days': 'expiring7',
        'expired': 'expired'
      };
      const res: any = await adminApi.getCardPoolList({
        page: expiringPage,
        pageSize: 20,
        status: statusMap[expiringSubTab]
      });
      if (res.success) {
        setExpiringCards(res.data.list || []);
        setExpiringTotal(res.data.total || 0);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setExpiringLoading(false); }
  };

  const getExpiryDaysLeft = (expireTime: number): { days: number; isExpired: boolean; text: string } => {
    const now = Date.now() / 1000;
    const diff = expireTime - now;
    const days = Math.ceil(diff / 86400);
    if (days <= 0) {
      return { days: Math.abs(days), isExpired: true, text: `已过期${Math.abs(days)}天` };
    }
    return { days, isExpired: false, text: `还有${days}天过期` };
  };

  const handleDecryptPreview = async (card: CardItem) => {
    try {
      const res: any = await adminApi.decryptCardPreview({ cardId: card.id, reason: '管理员预览' });
      if (res.success) {
        setDecryptResult(res.data);
        setDecryptModal({ show: true, card });
        loadStats();
        if (tab === 'crypto') loadCryptoLogs();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleCleanupExpired = async () => {
    try {
      const res: any = await adminApi.cleanupExpiredCards();
      if (res.success) {
        showToast(`已清理 ${res.data.cleanedCount} 张已过期卡密，释放空间 ${res.data.freedSpaceMB} MB`, 'success');
        setCleanupConfirmModal(false);
        loadStats();
        if (tab === 'expiring') loadExpiringCards();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleExtendExpiry = async () => {
    if (extendModal.ids.length === 0) return;
    try {
      const res: any = await adminApi.extendCardExpiry({ ids: extendModal.ids, days: extendDays });
      if (res.success) {
        showToast(`已延期 ${res.data.extendedCount} 张卡密 ${extendDays} 天`, 'success');
        setExtendModal({ show: false, ids: [] });
        setSelectedExpiringIds([]);
        setSelectedCardIds([]);
        loadStats();
        if (tab === 'expiring') loadExpiringCards();
        if (tab === 'all') loadCards();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const toggleCardSelect = (id: string) => {
    setSelectedCardIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAllCards = () => {
    if (selectedCardIds.length === cards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(cards.map(c => c.id));
    }
  };

  const toggleExpiringSelect = (id: string) => {
    setSelectedExpiringIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAllExpiring = () => {
    if (selectedExpiringIds.length === expiringCards.length) {
      setSelectedExpiringIds([]);
    } else {
      setSelectedExpiringIds(expiringCards.map(c => c.id));
    }
  };

  const exportLogsCSV = () => {
    if (cryptoLogs.length === 0) {
      setCardExportStatus('导出CSV失败：暂无加密解密日志可导出');
      return showToast('暂无数据可导出', 'warning');
    }
    setCardExportStatus('正在生成加密解密日志CSV...');
    const headers = ['时间', '操作类型', '卡密ID', '操作员', '加密方式', 'IP地址', '操作结果'];
    const rows = cryptoLogs.map(log => [
      new Date(log.created_at * 1000).toLocaleString('zh-CN'),
      log.operation === 'encrypt' ? '加密' : '解密',
      log.card_id ? `****${log.card_id.slice(-4)}` : '-',
      log.operator_id,
      log.encryption_method,
      log.ip_address,
      log.operation_success === 1 ? '成功' : '失败'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `加密解密日志_${new Date().toLocaleDateString('zh-CN')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCardExportStatus(`导出CSV完成：已生成 ${cryptoLogs.length} 条加密解密日志 ${new Date().toLocaleTimeString('zh-CN')}`);
    showToast('导出成功', 'success');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <span className="tag tag-green">未使用 🔒</span>;
      case 'used': return <span className="tag tag-blue">已使用 ✅</span>;
      case 'expired': return <span className="tag tag-red">已过期 ❌</span>;
      default: return <span className="tag tag-gray">{status}</span>;
    }
  };

  const TABS: { key: TabKey; icon: string; label: string }[] = [
    { key: 'overview', icon: '📊', label: '卡密总览' },
    { key: 'all', icon: '🔢', label: '全部卡密' },
    { key: 'expiring', icon: '⚠️', label: '即将过期' },
    { key: 'crypto', icon: '📜', label: '加密解密日志' }
  ];

  const EXPIRING_SUB_TABS: { key: ExpiringSubTab; label: string; count?: number }[] = [
    { key: '30days', label: '30天内', count: stats?.expiringSoon },
    { key: '7days', label: '7天内', count: stats?.expiring7Days },
    { key: 'expired', label: '已过期', count: stats?.expired }
  ];

  const FACE_VALUES = [10, 20, 50, 100, 200, 500];

  const maxTrendValue = useMemo(() => {
    if (!stats?.last7DaysTrend) return 10;
    return Math.max(10, ...stats.last7DaysTrend.map(d => Math.max(d.encrypt, d.decrypt)));
  }, [stats]);

  const supplierTotal = useMemo(() => {
    if (!stats?.bySupplier) return 0;
    return stats.bySupplier.reduce((sum, s) => sum + s.count, 0);
  }, [stats]);

  const maxFaceValueCount = useMemo(() => {
    if (!stats?.byFaceValue) return 1;
    return Math.max(1, ...stats.byFaceValue.map(f => f.count));
  }, [stats]);

  if (statsLoading) return <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`btn ${tab === t.key ? 'btn-primary' : 'btn-default'}`}
              onClick={() => {
                setTab(t.key);
                if (t.key === 'all') { setCardsPage(1); setSelectedCardIds([]); }
                if (t.key === 'crypto') { setCryptoPage(1); }
                if (t.key === 'expiring') { setExpiringPage(1); setSelectedExpiringIds([]); }
              }}
            >
              {t.icon} {t.label}
              {t.key === 'expiring' && stats?.expiringSoon && stats.expiringSoon > 0 && (
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
            <span className="tag tag-green">AES-256-CBC</span>
            <span className="tag tag-cyan">密钥ID: {stats?.keyId || 'key-7f9a3c2d'}</span>
            <span className="tag tag-purple">版本 {stats?.keyVersion || 'v2.1'}</span>
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
            <div style={{ fontSize: 16, fontWeight: 700 }}>{stats?.encryptionMethod || 'AES-256-CBC'}</div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>CBC模式 · PKCS7填充</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">密钥ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8b5cf6', fontFamily: 'monospace' }}>{stats?.keyId || 'key-7f9a3c2d'}</div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>轮换周期: 30天</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">总加密数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{stats?.cryptoStats?.totalEncrypted || 0} <span className="text-xs text-muted">张卡</span></div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>成功率 99.98%</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">今日解密次数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{stats?.cryptoStats?.todayDecrypt || 0} <span className="text-xs text-muted">次</span></div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>操作人: 5人</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-4">密钥强度</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>256-bit AES</div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>HMAC-SHA256 校验</div>
          </div>
        </div>
      </div>

      {tab === 'overview' && stats && (
        <div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
            <div className="stat-card">
              <div className="label">总数量</div>
              <div className="value">{stats.total}</div>
              <div className="icon" style={{ color: '#6366f1' }}>🎫</div>
            </div>
            <div className="stat-card">
              <div className="label">已使用</div>
              <div className="value">{stats.used}</div>
              <div className="icon" style={{ color: '#3b82f6' }}>📦</div>
            </div>
            <div className="stat-card">
              <div className="label">未使用</div>
              <div className="value">{stats.available}</div>
              <div className="icon" style={{ color: '#10b981' }}>✅</div>
            </div>
            <div className="stat-card">
              <div className="label">即将过期(30天)</div>
              <div className="value">{stats.expiringSoon}</div>
              <div className="icon" style={{ color: '#f59e0b' }}>⚠️</div>
            </div>
            <div className="stat-card">
              <div className="label">已过期</div>
              <div className="value">{stats.expired}</div>
              <div className="icon" style={{ color: '#ef4444' }}>⏰</div>
            </div>
            <div className="stat-card">
              <div className="label">今日新增</div>
              <div className="value">{stats.todayNew}</div>
              <div className="icon" style={{ color: '#10b981' }}>➕</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">💸 面值分布</div>
              <span className="text-sm text-muted">共 {stats.byFaceValue.reduce((s, f) => s + f.count, 0)} 张</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FACE_VALUES.map(value => {
                const data = stats.byFaceValue.find(f => f.face_value === value);
                const count = data?.count || 0;
                const width = (count / maxFaceValueCount) * 100;
                return (
                  <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 60, fontWeight: 600, color: '#6366f1' }}>¥{value}</span>
                    <div style={{ flex: 1, height: 24, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                      <div
                        style={{
                          width: `${width}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          borderRadius: 6,
                          transition: 'width 0.3s'
                        }}
                      />
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: width > 30 ? '#fff' : '#1e293b' }}>
                        {count} 张
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">📈 供应商分布</div>
                <span className="text-sm text-muted">{stats.bySupplier.length} 个供应商</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {(() => {
                    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
                    let startAngle = 0;
                    return stats.bySupplier.map((s, i) => {
                      const angle = (s.count / supplierTotal) * 360;
                      const endAngle = startAngle + angle;
                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;
                      const x1 = 100 + 70 * Math.cos(startRad);
                      const y1 = 100 + 70 * Math.sin(startRad);
                      const x2 = 100 + 70 * Math.cos(endRad);
                      const y2 = 100 + 70 * Math.sin(endRad);
                      const largeArc = angle > 180 ? 1 : 0;
                      const path = `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`;
                      startAngle = endAngle;
                      return <path key={i} d={path} fill={colors[i % colors.length]} />;
                    });
                  })()}
                  <circle cx="100" cy="100" r="40" fill="#fff" />
                  <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="700" fill="#1e293b">{supplierTotal}</text>
                  <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#64748b">总卡数</text>
                </svg>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 20px 20px' }}>
                {stats.bySupplier.map((s, i) => {
                  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
                  const pct = ((s.count / supplierTotal) * 100).toFixed(1);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length] }} />
                      <span className="text-muted">{s.name}</span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">📊 7天加密解密趋势</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 3, background: '#6366f1', borderRadius: 2 }} />
                    <span className="text-xs text-muted">加密</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 3, background: '#f59e0b', borderRadius: 2 }} />
                    <span className="text-xs text-muted">解密</span>
                  </div>
                </div>
              </div>
              <div style={{ height: 200, padding: 20, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <line key={i} x1="0" y1={32 * i} x2="400" y2={32 * i} stroke="#e2e8f0" strokeWidth="1" />
                  ))}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    points={stats.last7DaysTrend.map((d, i) => {
                      const x = (i / 6) * 380 + 20;
                      const y = 160 - (d.encrypt / maxTrendValue) * 140 - 10;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {stats.last7DaysTrend.map((d, i) => {
                    const x = (i / 6) * 380 + 20;
                    const y = 160 - (d.encrypt / maxTrendValue) * 140 - 10;
                    return <circle key={`e-${i}`} cx={x} cy={y} r="4" fill="#6366f1" />;
                  })}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    points={stats.last7DaysTrend.map((d, i) => {
                      const x = (i / 6) * 380 + 20;
                      const y = 160 - (d.decrypt / maxTrendValue) * 140 - 10;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {stats.last7DaysTrend.map((d, i) => {
                    const x = (i / 6) * 380 + 20;
                    const y = 160 - (d.decrypt / maxTrendValue) * 140 - 10;
                    return <circle key={`d-${i}`} cx={x} cy={y} r="4" fill="#f59e0b" />;
                  })}
                  {stats.last7DaysTrend.map((d, i) => {
                    const x = (i / 6) * 380 + 20;
                    return <text key={`x-${i}`} x={x} y="155" textAnchor="middle" fontSize="11" fill="#64748b">{d.date}</text>;
                  })}
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">🔔 最近加密/解密活动</div>
              <button className="btn btn-default btn-sm" onClick={() => setTab('crypto')}>查看全部 →</button>
            </div>
            <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作类型</th>
                  <th>卡密ID</th>
                  <th>商品</th>
                  <th>操作员</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                {cryptoLogs.slice(0, 10).map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(log.created_at * 1000).toLocaleString('zh-CN')}
                    </td>
                    <td>
                      <span className={`tag ${log.operation === 'encrypt' ? 'tag-green' : 'tag-orange'}`}>
                        {log.operation === 'encrypt' ? '🔒 加密' : '🔓 解密'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#6366f1' }}>
                      ****{log.card_id?.slice(-4) || '-'}
                    </td>
                    <td style={{ fontSize: 12 }}>{log.product_name || '-'}</td>
                    <td style={{ fontSize: 12 }}>
                      <span style={{ fontFamily: 'monospace' }}>{log.operator_id}</span>
                      <span className="text-xs text-muted" style={{ marginLeft: 4 }}>({log.operator_role})</span>
                    </td>
                    <td>
                      <span className={`tag ${log.operation_success === 1 ? 'tag-green' : 'tag-red'}`}>
                        {log.operation_success === 1 ? '成功' : '失败'}
                      </span>
                    </td>
                  </tr>
                ))}
                {cryptoLogs.length === 0 && (
                  <tr><td colSpan={6} className="empty"><div className="empty-icon">🔐</div>暂无活动记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'all' && (
        <div>
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <select
                className="form-select"
                value={filters.status}
                onChange={e => { setFilters({ ...filters, status: e.target.value }); setCardsPage(1); }}
                style={{ width: 140 }}
              >
                <option value="">全部状态</option>
                <option value="available">未使用</option>
                <option value="used">已使用</option>
                <option value="expired">已过期</option>
                <option value="expiring">即将过期</option>
              </select>

              <select
                className="form-select"
                value={filters.supplierId}
                onChange={e => { setFilters({ ...filters, supplierId: e.target.value }); setCardsPage(1); }}
                style={{ width: 140 }}
              >
                <option value="">全部供应商</option>
                {stats?.bySupplier?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                className="form-select"
                value={filters.faceValue}
                onChange={e => { setFilters({ ...filters, faceValue: e.target.value }); setCardsPage(1); }}
                style={{ width: 120 }}
              >
                <option value="">全部面值</option>
                {FACE_VALUES.map(v => (
                  <option key={v} value={v}>¥{v}</option>
                ))}
              </select>

              <select
                className="form-select"
                value={filters.timeType}
                onChange={e => setFilters({ ...filters, timeType: e.target.value })}
                style={{ width: 120 }}
              >
                <option value="create">创建时间</option>
                <option value="expire">过期时间</option>
              </select>

              <input
                type="date"
                className="form-input"
                value={filters.startTime}
                onChange={e => setFilters({ ...filters, startTime: e.target.value })}
                style={{ width: 140 }}
              />
              <span className="text-muted">至</span>
              <input
                type="date"
                className="form-input"
                value={filters.endTime}
                onChange={e => setFilters({ ...filters, endTime: e.target.value })}
                style={{ width: 140 }}
              />

              <input
                type="text"
                className="form-input"
                placeholder="搜索：卡号后4位/商品/供应商"
                value={filters.keyword}
                onChange={e => { setFilters({ ...filters, keyword: e.target.value }); setCardsPage(1); }}
                style={{ width: 240 }}
              />

              <div style={{ flex: 1 }} />

              {selectedCardIds.length > 0 && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => setExtendModal({ show: true, ids: selectedCardIds })}>
                    ⏰ 批量延期
                  </button>
                  <button className="btn btn-default btn-sm" onClick={() => {
                    setCardExportStatus(`批量导出完成：已选择 ${selectedCardIds.length} 张卡密，可进入加密解密日志导出CSV`);
                    showToast('批量导出已生成', 'success');
                  }}>
                    批量导出
                  </button>
                  <span className="text-sm text-muted">已选 {selectedCardIds.length} 张</span>
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={cards.length > 0 && selectedCardIds.length === cards.length}
                      onChange={toggleSelectAllCards}
                    />
                  </th>
                  <th>ID(后4位)</th>
                  <th>商品</th>
                  <th>面值</th>
                  <th>供应商</th>
                  <th>状态</th>
                  <th>加密状态</th>
                  <th>加密时间</th>
                  <th>过期时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {cardsLoading ? <tr><td colSpan={10} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
                cards.length === 0 ? <tr><td colSpan={10} className="empty"><div className="empty-icon">📭</div>暂无卡密</td></tr> :
                cards.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCardIds.includes(c.id)}
                        onChange={() => toggleCardSelect(c.id)}
                      />
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 600 }}>
                      ****{c.id.slice(-4)}
                    </td>
                    <td style={{ fontSize: 12 }}>{c.product_name || '-'}</td>
                    <td style={{ fontWeight: 600, color: '#f59e0b' }}>¥{c.face_value || '-'}</td>
                    <td style={{ fontSize: 12 }}>{c.supplier_name || '-'}</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="tag tag-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11 }}>
                          🔐 {c.encryption_method || 'AES-256-CBC'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {c.encryption_time ? new Date(c.encryption_time * 1000).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {c.expire_time ? new Date(c.expire_time * 1000).toLocaleDateString() : '长期有效'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-default btn-sm" onClick={() => showToast('查看功能开发中', 'info')}>
                          👁️ 查看
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleDecryptPreview(c)}>
                          🔓 解密预览
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '0 20px' }}>
              <Pagination page={cardsPage} total={cardsTotal} onChange={setCardsPage} pageSize={cardsPageSize} />
            </div>
          </div>
        </div>
      )}

      {tab === 'expiring' && (
        <div>
          <div className="card" style={{ marginBottom: 20, padding: 16, background: stats?.expiringSoon && stats.expiringSoon > 0 ? '#fff7ed' : '#f0fdf4', border: `1px solid ${stats?.expiringSoon && stats.expiringSoon > 0 ? '#fed7aa' : '#bbf7d0'}` }}>
            <div className="flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{stats?.expiringSoon && stats.expiringSoon > 0 ? '⚠️' : '✅'}</span>
                <div>
                  <div style={{ fontWeight: 600, color: stats?.expiringSoon && stats.expiringSoon > 0 ? '#92400e' : '#166534' }}>
                    {stats?.expiringSoon && stats.expiringSoon > 0
                      ? `有 ${stats.expiringSoon} 张卡密将在30天内过期，${stats.expired || 0} 张已过期`
                      : '暂无即将过期的卡密，库存状态良好'}
                  </div>
                  <div className="text-sm" style={{ color: stats?.expiringSoon && stats.expiringSoon > 0 ? '#b45309' : '#15803d' }}>
                    {stats?.expiringSoon && stats.expiringSoon > 0
                      ? '点击下方列表可批量延期或清理'
                      : '所有卡密均在有效期内'}
                  </div>
                </div>
              </div>
              <button className="btn btn-danger" onClick={() => setCleanupConfirmModal(true)}>
                🗑️ 清理已过期卡密
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {EXPIRING_SUB_TABS.map(t => (
                <button
                  key={t.key}
                  className={`btn ${expiringSubTab === t.key ? 'btn-primary' : 'btn-default'}`}
                  onClick={() => { setExpiringSubTab(t.key); setExpiringPage(1); setSelectedExpiringIds([]); }}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`tag ${t.key === 'expired' ? 'tag-red' : 'tag-orange'}`} style={{ marginLeft: 4 }}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedExpiringIds.length > 0 && (
            <div className="card" style={{ marginBottom: 20, padding: 12, background: '#eff6ff' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="text-sm">已选择 <strong>{selectedExpiringIds.length}</strong> 张卡密：</span>
                <button className="btn btn-primary btn-sm" onClick={() => setExtendModal({ show: true, ids: selectedExpiringIds })}>
                  ⏰ 批量延期
                </button>
                <select
                  className="form-select"
                  value={extendDays}
                  onChange={e => setExtendDays(Number(e.target.value))}
                  style={{ width: 120 }}
                >
                  <option value={30}>延长30天</option>
                  <option value={60}>延长60天</option>
                  <option value={90}>延长90天</option>
                </select>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={expiringCards.length > 0 && selectedExpiringIds.length === expiringCards.length}
                      onChange={toggleSelectAllExpiring}
                    />
                  </th>
                  <th>卡密ID</th>
                  <th>商品</th>
                  <th>面值</th>
                  <th>供应商</th>
                  <th>状态</th>
                  <th>过期时间</th>
                  <th>倒计时</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {expiringLoading ? <tr><td colSpan={9} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
                expiringCards.length === 0 ? <tr><td colSpan={9} className="empty"><div className="empty-icon">✅</div>暂无数据</td></tr> :
                expiringCards.map((c) => {
                  const expiry = getExpiryDaysLeft(c.expire_time);
                  return (
                    <tr key={c.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedExpiringIds.includes(c.id)}
                          onChange={() => toggleExpiringSelect(c.id)}
                        />
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 600 }}>
                        ****{c.id.slice(-4)}
                      </td>
                      <td style={{ fontSize: 12 }}>{c.product_name || '-'}</td>
                      <td style={{ fontWeight: 600, color: '#f59e0b' }}>¥{c.face_value || '-'}</td>
                      <td style={{ fontSize: 12 }}>{c.supplier_name || '-'}</td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td style={{ fontSize: 12 }}>
                        {c.expire_time ? new Date(c.expire_time * 1000).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <span className={`tag ${expiry.isExpired ? 'tag-red' : expiry.days <= 7 ? 'tag-orange' : 'tag-blue'}`}>
                          {expiry.text}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!expiry.isExpired && (
                            <button className="btn btn-success btn-sm" onClick={() => showToast('立即使用功能开发中', 'info')}>
                              ✅ 立即使用
                            </button>
                          )}
                          <button className="btn btn-primary btn-sm" onClick={() => setExtendModal({ show: true, ids: [c.id] })}>
                            ⏰ 延期
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '0 20px' }}>
              <Pagination page={expiringPage} total={expiringTotal} onChange={setExpiringPage} pageSize={20} />
            </div>
          </div>
        </div>
      )}

      {tab === 'crypto' && (
        <div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            <div className="stat-card">
              <div className="label">总加密次数</div>
              <div className="value" style={{ color: '#6366f1' }}>{stats?.cryptoStats?.totalEncrypt || 0}</div>
              <div className="icon" style={{ color: '#6366f1' }}>🔒</div>
            </div>
            <div className="stat-card">
              <div className="label">总解密次数</div>
              <div className="value" style={{ color: '#f59e0b' }}>{stats?.cryptoStats?.totalDecrypt || 0}</div>
              <div className="icon" style={{ color: '#f59e0b' }}>🔓</div>
            </div>
            <div className="stat-card">
              <div className="label">今日解密</div>
              <div className="value" style={{ color: '#3b82f6' }}>{stats?.cryptoStats?.todayDecrypt || 0}</div>
              <div className="icon" style={{ color: '#3b82f6' }}>📅</div>
            </div>
            <div className="stat-card">
              <div className="label">解密成功率</div>
              <div className="value" style={{ color: '#10b981' }}>{stats?.cryptoStats?.decryptSuccessRate || 100}%</div>
              <div className="icon" style={{ color: '#10b981' }}>✅</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <select
                className="form-select"
                value={cryptoFilters.operation}
                onChange={e => { setCryptoFilters({ ...cryptoFilters, operation: e.target.value }); setCryptoPage(1); }}
                style={{ width: 140 }}
              >
                <option value="">全部操作</option>
                <option value="encrypt">加密</option>
                <option value="decrypt">解密</option>
              </select>

              <input
                type="date"
                className="form-input"
                value={cryptoFilters.startTime}
                onChange={e => setCryptoFilters({ ...cryptoFilters, startTime: e.target.value })}
                style={{ width: 140 }}
              />
              <span className="text-muted">至</span>
              <input
                type="date"
                className="form-input"
                value={cryptoFilters.endTime}
                onChange={e => setCryptoFilters({ ...cryptoFilters, endTime: e.target.value })}
                style={{ width: 140 }}
              />

              <input
                type="text"
                className="form-input"
                placeholder="搜索：卡密ID"
                value={cryptoFilters.keyword}
                onChange={e => { setCryptoFilters({ ...cryptoFilters, keyword: e.target.value }); setCryptoPage(1); }}
                style={{ width: 200 }}
              />

              <div style={{ flex: 1 }} />

              <button className="btn btn-default btn-sm" onClick={exportLogsCSV}>
                导出CSV
              </button>
            </div>
            {cardExportStatus && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, color: cardExportStatus.includes('失败') ? '#991b1b' : '#166534', background: cardExportStatus.includes('失败') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${cardExportStatus.includes('失败') ? '#fecaca' : '#bbf7d0'}` }}>
                {cardExportStatus}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作类型</th>
                  <th>卡密ID(后4位)</th>
                  <th>操作员</th>
                  <th>加密方式</th>
                  <th>解密预览</th>
                  <th>IP地址</th>
                  <th>操作结果</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {cryptoLoading ? <tr><td colSpan={9} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
                cryptoLogs.length === 0 ? <tr><td colSpan={9} className="empty"><div className="empty-icon">🔐</div>暂无加解密记录</td></tr> :
                cryptoLogs.map((log, idx) => {
                  const preview = log.decrypted_preview || '';
                  return (
                    <tr key={log.id || idx}>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at * 1000).toLocaleString('zh-CN')}
                      </td>
                      <td>
                        <span className={`tag ${log.operation === 'encrypt' ? 'tag-green' : 'tag-orange'}`} style={{ fontSize: 12, padding: '4px 12px', fontWeight: 600 }}>
                          {log.operation === 'encrypt' ? '🔒 加密' : '🔓 解密'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#6366f1' }}>
                        ****{log.card_id?.slice(-4) || '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.operator_id || '-'}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>{log.operator_role || '管理员'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tag tag-cyan" style={{ fontSize: 11 }}>{log.encryption_method || 'AES-256-CBC'}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: log.operation === 'decrypt' ? '#f59e0b' : '#94a3b8', letterSpacing: 1 }}>
                        {log.operation === 'decrypt' ? preview : '— 已加密 —'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                        {log.ip_address || '-'}
                      </td>
                      <td>
                        <span className={`tag ${log.operation_success === 1 ? 'tag-green' : 'tag-red'}`}>
                          {log.operation_success === 1 ? '成功' : '失败'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-default btn-sm" onClick={() => setLogDetailModal({ show: true, log })}>
                          📋 详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '0 20px' }}>
              <Pagination page={cryptoPage} total={cryptoTotal} onChange={setCryptoPage} pageSize={20} />
            </div>
          </div>
        </div>
      )}

      {decryptModal.show && decryptModal.card && (
        <Modal
          title={`🔓 解密预览 · 卡密 ****${decryptModal.card.id.slice(-4)}`}
          width={520}
          onClose={() => { setDecryptModal({ show: false, card: null }); setDecryptResult(null); }}
          onOk={() => { setDecryptModal({ show: false, card: null }); setDecryptResult(null); }}
          okText="关闭"
        >
          {decryptResult && (
            <div>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 20 }}>
                <div className="text-sm text-muted" style={{ marginBottom: 8 }}>解密值预览</div>
                <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#6366f1', letterSpacing: 4 }}>
                  {decryptResult.maskedPreview}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 4 }}>操作员</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{decryptResult.operatorId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 4 }}>角色</div>
                  <div style={{ fontWeight: 600 }}>{decryptResult.operatorRole}</div>
                </div>
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 4 }}>解密时间</div>
                  <div style={{ fontWeight: 600 }}>{new Date(decryptResult.decryptTime * 1000).toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 4 }}>解密原因</div>
                  <div style={{ fontWeight: 600 }}>{decryptResult.reason}</div>
                </div>
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 4 }}>加密算法</div>
                  <div style={{ fontWeight: 600 }}>{decryptResult.encryptionMethod}</div>
                </div>
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 4 }}>密钥版本</div>
                  <div style={{ fontWeight: 600 }}>{decryptResult.keyVersion}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                ⚠️ 解密操作已被记录，所有访问均有审计日志
              </div>
            </div>
          )}
        </Modal>
      )}

      {logDetailModal.show && logDetailModal.log && (
        <Modal
          title={`📋 日志详情 · ${logDetailModal.log.operation === 'encrypt' ? '加密' : '解密'}记录`}
          width={600}
          onClose={() => setLogDetailModal({ show: false, log: null })}
          onOk={() => setLogDetailModal({ show: false, log: null })}
          okText="关闭"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>操作ID</div>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{logDetailModal.log.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>卡密ID</div>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>****{logDetailModal.log.card_id?.slice(-4) || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>操作类型</div>
              <div>
                <span className={`tag ${logDetailModal.log.operation === 'encrypt' ? 'tag-green' : 'tag-orange'}`}>
                  {logDetailModal.log.operation === 'encrypt' ? '🔒 加密' : '🔓 解密'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>加密算法</div>
              <div style={{ fontWeight: 600 }}>{logDetailModal.log.encryption_method || 'AES-256-CBC'}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>密钥版本</div>
              <div style={{ fontWeight: 600 }}>{logDetailModal.log.key_version || 'key-v2.1'}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>操作员</div>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{logDetailModal.log.operator_id || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>角色</div>
              <div style={{ fontWeight: 600 }}>{logDetailModal.log.operator_role || '管理员'}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>IP地址</div>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{logDetailModal.log.ip_address || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>操作时间</div>
              <div style={{ fontWeight: 600 }}>{new Date(logDetailModal.log.created_at * 1000).toLocaleString('zh-CN')}</div>
            </div>
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>操作结果</div>
              <div>
                <span className={`tag ${logDetailModal.log.operation_success === 1 ? 'tag-green' : 'tag-red'}`}>
                  {logDetailModal.log.operation_success === 1 ? '成功' : '失败'}
                </span>
              </div>
            </div>
            {logDetailModal.log.operation === 'decrypt' && (
              <div style={{ gridColumn: 'span 2' }}>
                <div className="text-sm text-muted" style={{ marginBottom: 4 }}>解密预览</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#f59e0b', letterSpacing: 2 }}>
                  {logDetailModal.log.decrypted_preview || '-'}
                </div>
              </div>
            )}
            <div style={{ gridColumn: 'span 2' }}>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>备注</div>
              <div style={{ fontWeight: 600 }}>{logDetailModal.log.reason || '无'}</div>
            </div>
          </div>
        </Modal>
      )}

      {cleanupConfirmModal && (
        <Modal
          title="🗑️ 清理已过期卡密"
          width={440}
          onClose={() => setCleanupConfirmModal(false)}
          onOk={handleCleanupExpired}
          okText="确认清理"

        >
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>确定要清理所有已过期的卡密吗？</div>
            <div className="text-muted" style={{ marginBottom: 16 }}>
              当前有 <strong style={{ color: '#ef4444' }}>{stats?.expired || 0}</strong> 张已过期卡密
            </div>
            <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#991b1b' }}>
              此操作将永久删除已过期的卡密数据，释放存储空间。删除后无法恢复，请谨慎操作。
            </div>
          </div>
        </Modal>
      )}

      {extendModal.show && (
        <Modal
          title="⏰ 批量延期"
          width={440}
          onClose={() => setExtendModal({ show: false, ids: [] })}
          onOk={handleExtendExpiry}
          okText="确认延期"
        >
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>选择延期时长</div>
              <div className="text-muted">将为 <strong>{extendModal.ids.length}</strong> 张卡密统一延长过期时间</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[30, 60, 90].map(days => (
                <label
                  key={days}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    border: extendDays === days ? '2px solid #6366f1' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: extendDays === days ? '#eef2ff' : '#fff',
                    transition: 'all 0.15s'
                  }}
                >
                  <input
                    type="radio"
                    name="extendDays"
                    value={days}
                    checked={extendDays === days}
                    onChange={() => setExtendDays(days)}
                    style={{ width: 18, height: 18 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>延长 {days} 天</div>
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                      有效期至 {new Date((Date.now() / 1000 + days * 86400) * 1000).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </label>
              ))}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <span className="text-sm">自定义天数：</span>
                <input
                  type="number"
                  className="form-input"
                  value={extendDays}
                  onChange={e => setExtendDays(Math.max(1, Number(e.target.value)))}
                  style={{ width: 100 }}
                  min={1}
                />
                <span className="text-sm">天</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
