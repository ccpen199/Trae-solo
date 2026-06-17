import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useApp } from '../App';

interface DashboardData {
  todayGMV: number;
  todayOrders: number;
  totalGMV: number;
  totalOrders: number;
  totalUsers: number;
  todayNewUsers: number;
  totalProducts: number;
  totalSuppliers: number;
  todayFailures: number;
  todayCommission: number;
  totalCommission: number;
  monthCommission: number;
  pendingCommission: number;
  rechargeSuccessRate: number;
  cardPoolCount: number;
  cardUsed: number;
  cardExpired: number;
  cardEncrypted: number;
  cardTodayDecrypt: number;
  cardExpiringSoon: number;
  riskLogCount: number;
  blockedToday: number;
  ipBlacklistCount: number;
  regionLimitCount: number;
  diagnosticCount: number;
  statusBreakdown: Array<{ status: string; cnt: number }>;
  levelDistribution: Array<{ risk_level: string; cnt: number }>;
  supplierStats: Array<{
    id: string;
    name: string;
    code: string;
    status: number;
    settlement_ratio: number;
    totalOrders: number;
    totalAmount: number;
    failCount: number;
    failRate: number;
  }>;
  recentTrend: Array<{ date: string; gmv: number; orders: number }>;
}

interface OrderItem {
  id: string;
  order_no: string;
  product_name: string;
  recharge_account: string;
  final_amount: number;
  status: string;
  created_at: number;
  user_phone: string;
  user_name: string;
}

interface SupplierItem {
  id: string;
  name: string;
  code: string;
  status: number;
  totalOrders: number;
  totalAmount: number;
  failCount: number;
  failRate: number;
}

interface RiskLogItem {
  id: string;
  user_id: string;
  ip: string;
  region: string;
  action: string;
  risk_level: string;
  detail: string;
  blocked: number;
  created_at: number;
}

interface CardPoolData {
  total: number;
  used: number;
  available: number;
  expired: number;
  expiringSoon: number;
  encryptionMethod: string;
  keyVersion: string;
  cryptoStats: {
    totalEncrypted: number;
    todayDecrypt: number;
  };
}

interface LoadingState {
  dashboard: boolean;
  orders: boolean;
  suppliers: boolean;
  cardPool: boolean;
  riskLogs: boolean;
}

interface ErrorState {
  dashboard: string | null;
  orders: string | null;
  suppliers: string | null;
  cardPool: string | null;
  riskLogs: string | null;
}

const STATUS_MAP: Record<string, { text: string; cls: string; color: string }> = {
  pending: { text: '待支付', cls: 'tag-orange', color: '#f59e0b' },
  paid: { text: '待充值', cls: 'tag-blue', color: '#3b82f6' },
  recharging: { text: '充值中', cls: 'tag-blue', color: '#6366f1' },
  processing: { text: '处理中', cls: 'tag-blue', color: '#6366f1' },
  completed: { text: '已完成', cls: 'tag-green', color: '#10b981' },
  failed: { text: '已失败', cls: 'tag-red', color: '#ef4444' }
};

const RISK_LEVEL_MAP: Record<string, { text: string; cls: string; color: string }> = {
  critical: { text: '严重', cls: 'tag-red', color: '#ef4444' },
  high: { text: '高', cls: 'tag-orange', color: '#f59e0b' },
  medium: { text: '中', cls: 'tag-blue', color: '#3b82f6' },
  low: { text: '低', cls: 'tag-green', color: '#10b981' }
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SkeletonCard() {
  return (
    <div className="stat-card" style={{ opacity: 0.6 }}>
      <div className="label" style={{ background: '#e2e8f0', height: 14, width: 60, borderRadius: 4 }}></div>
      <div className="value" style={{ background: '#e2e8f0', height: 28, width: 100, borderRadius: 4, marginTop: 8 }}></div>
      <div className="icon" style={{ background: '#e2e8f0', width: 32, height: 32, borderRadius: 8 }}></div>
    </div>
  );
}

function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div style={{ height, background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 8 }}></div>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="empty" style={{ padding: '30px 20px' }}>
      <div className="empty-icon" style={{ color: '#ef4444' }}>⚠️</div>
      <div style={{ color: '#64748b', marginBottom: 12 }}>{message}</div>
      <button className="btn btn-primary btn-sm" onClick={onRetry}>重试</button>
    </div>
  );
}

export default function Dashboard() {
  const { showToast } = useApp();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [riskLogs, setRiskLogs] = useState<RiskLogItem[]>([]);
  const [cardPool, setCardPool] = useState<CardPoolData | null>(null);
  const [lastRefreshMessage, setLastRefreshMessage] = useState('');

  const [loading, setLoading] = useState<LoadingState>({
    dashboard: true,
    orders: true,
    suppliers: true,
    cardPool: true,
    riskLogs: true
  });

  const [errors, setErrors] = useState<ErrorState>({
    dashboard: null,
    orders: null,
    suppliers: null,
    cardPool: null,
    riskLogs: null
  });

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true }));
      setErrors(prev => ({ ...prev, dashboard: null }));
      const res: any = await api.get('/admin/dashboard');
      if (res.success) {
        const raw = res.data || {};
        const mapped: DashboardData = {
          todayGMV: raw.todayGMV ?? raw.todayGmv ?? raw.today_gmv ?? 0,
          todayOrders: raw.todayOrders ?? raw.today_orders ?? 0,
          totalGMV: raw.totalGMV ?? raw.totalGmv ?? raw.total_gmv ?? 0,
          totalOrders: raw.totalOrders ?? raw.total_orders ?? 0,
          totalUsers: raw.totalUsers ?? raw.total_users ?? 0,
          todayNewUsers: raw.todayNewUsers ?? raw.today_new_users ?? 0,
          totalProducts: raw.totalProducts ?? raw.total_products ?? 0,
          totalSuppliers: raw.totalSuppliers ?? raw.total_suppliers ?? 0,
          todayFailures: raw.todayFailures ?? raw.today_failures ?? 0,
          todayCommission: raw.todayCommission ?? raw.today_commission ?? 0,
          totalCommission: raw.totalCommission ?? raw.total_commission ?? 0,
          monthCommission: raw.monthCommission ?? raw.month_commission ?? 0,
          pendingCommission: raw.pendingCommission ?? raw.pending_commission ?? 0,
          rechargeSuccessRate: raw.rechargeSuccessRate ?? raw.recharge_success_rate ?? 0,
          cardPoolCount: raw.cardPoolCount ?? raw.card_pool_count ?? raw.cardCount ?? 0,
          cardUsed: raw.cardUsed ?? raw.card_used ?? 0,
          cardExpired: raw.cardExpired ?? raw.card_expired ?? 0,
          cardEncrypted: raw.cardEncrypted ?? raw.card_encrypted ?? 0,
          cardTodayDecrypt: raw.cardTodayDecrypt ?? raw.card_today_decrypt ?? 0,
          cardExpiringSoon: raw.cardExpiringSoon ?? raw.card_expiring_soon ?? 0,
          riskLogCount: raw.riskLogCount ?? raw.risk_log_count ?? 0,
          blockedToday: raw.blockedToday ?? raw.blocked_today ?? 0,
          ipBlacklistCount: raw.ipBlacklistCount ?? raw.ip_blacklist_count ?? 0,
          regionLimitCount: raw.regionLimitCount ?? raw.region_limit_count ?? 0,
          diagnosticCount: raw.diagnosticCount ?? 0,
          statusBreakdown: raw.statusBreakdown ?? raw.status_breakdown ?? [],
          levelDistribution: raw.levelDistribution ?? raw.level_distribution ?? [],
          supplierStats: raw.supplierStats ?? raw.supplier_stats ?? [],
          recentTrend: raw.recentTrend ?? raw.recent_trend ?? []
        };
        setDashboardData(mapped);
      } else {
        throw new Error(res.message || '加载失败');
      }
    } catch (e: any) {
      setErrors(prev => ({ ...prev, dashboard: e.message || '加载失败' }));
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [showToast]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      setErrors(prev => ({ ...prev, orders: null }));
      const res: any = await api.get('/admin/orders?page=1&pageSize=10');
      if (res.success) {
        setOrders(res.data?.list || []);
      } else {
        throw new Error(res.message || '加载失败');
      }
    } catch (e: any) {
      setErrors(prev => ({ ...prev, orders: e.message || '加载失败' }));
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  }, [showToast]);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, suppliers: true }));
      setErrors(prev => ({ ...prev, suppliers: null }));
      const res: any = await api.get('/admin/suppliers');
      if (res.success) {
        const list = (res.data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          status: s.status,
          totalOrders: s.totalOrders || 0,
          totalAmount: s.totalAmount || 0,
          failCount: s.failCount || 0,
          failRate: s.failRate || 0
        }));
        setSuppliers(list);
      } else {
        throw new Error(res.message || '加载失败');
      }
    } catch (e: any) {
      setErrors(prev => ({ ...prev, suppliers: e.message || '加载失败' }));
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, suppliers: false }));
    }
  }, [showToast]);

  const loadCardPool = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, cardPool: true }));
      setErrors(prev => ({ ...prev, cardPool: null }));
      const res: any = await api.get('/admin/card-pool/stats');
      if (res.success) {
        setCardPool(res.data);
      } else {
        throw new Error(res.message || '加载失败');
      }
    } catch (e: any) {
      setErrors(prev => ({ ...prev, cardPool: e.message || '加载失败' }));
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, cardPool: false }));
    }
  }, [showToast]);

  const loadRiskLogs = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, riskLogs: true }));
      setErrors(prev => ({ ...prev, riskLogs: null }));
      const res: any = await api.get('/admin/risk/logs?limit=10');
      if (res.success) {
        setRiskLogs(res.data || []);
      } else {
        throw new Error(res.message || '加载失败');
      }
    } catch (e: any) {
      setErrors(prev => ({ ...prev, riskLogs: e.message || '加载失败' }));
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, riskLogs: false }));
    }
  }, [showToast]);

  const loadAll = useCallback(async (manual = false) => {
    if (manual) setLastRefreshMessage('正在刷新运营数据...');
    await Promise.all([
      loadDashboard(),
      loadOrders(),
      loadSuppliers(),
      loadCardPool(),
      loadRiskLogs()
    ]);
    if (manual) {
      setLastRefreshMessage(`刷新完成：运营概览、订单、供应商、卡密和风控数据已更新 ${new Date().toLocaleTimeString('zh-CN')}`);
    }
  }, [loadDashboard, loadOrders, loadSuppliers, loadCardPool, loadRiskLogs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const getStatusBreakdown = useCallback(() => {
    if (dashboardData?.statusBreakdown?.length) {
      return dashboardData.statusBreakdown;
    }
    if (orders.length > 0) {
      const map = new Map<string, number>();
      orders.forEach(o => {
        map.set(o.status, (map.get(o.status) || 0) + 1);
      });
      return Array.from(map.entries()).map(([status, cnt]) => ({ status, cnt }));
    }
    return [];
  }, [dashboardData, orders]);

  const getLevelDistribution = useCallback(() => {
    if (dashboardData?.levelDistribution?.length) {
      return dashboardData.levelDistribution;
    }
    if (riskLogs.length > 0) {
      const map = new Map<string, number>();
      riskLogs.forEach(r => {
        map.set(r.risk_level, (map.get(r.risk_level) || 0) + 1);
      });
      return Array.from(map.entries()).map(([risk_level, cnt]) => ({ risk_level, cnt }));
    }
    return [];
  }, [dashboardData, riskLogs]);

  const getSupplierTop5 = useCallback(() => {
    let list: SupplierItem[] = [];
    if (dashboardData?.supplierStats?.length) {
      list = dashboardData.supplierStats;
    } else if (suppliers.length > 0) {
      list = suppliers;
    }
    return list
      .filter(s => s.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }, [dashboardData, suppliers]);

  const getRecentTrend = useCallback(() => {
    if (dashboardData?.recentTrend?.length) {
      return dashboardData.recentTrend;
    }
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trend.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        gmv: 0,
        orders: 0
      });
    }
    return trend;
  }, [dashboardData]);

  const statCards = [
    { label: '今日GMV', value: `¥${Number(dashboardData?.todayGMV ?? 0).toFixed(2)}`, icon: '💰', color: '#10b981', trend: null },
    { label: '今日订单', value: dashboardData?.todayOrders ?? 0, icon: '📋', color: '#6366f1', trend: null },
    { label: '累计GMV', value: `¥${Number(dashboardData?.totalGMV ?? 0).toFixed(0)}`, icon: '📈', color: '#8b5cf6', trend: null },
    { label: '总用户', value: dashboardData?.totalUsers ?? 0, icon: '👥', color: '#06b6d4', trend: null },
    { label: '今日新增', value: dashboardData?.todayNewUsers ?? 0, icon: '➕', color: '#14b8a6', trend: null }
  ];

  const statCards2 = [
    { label: '总商品', value: dashboardData?.totalProducts ?? 0, icon: '📦', color: '#f59e0b' },
    { label: '总供应商', value: dashboardData?.totalSuppliers ?? 0, icon: '🏭', color: '#8b5cf6' },
    { label: '成功率', value: `${Number(dashboardData?.rechargeSuccessRate ?? 0).toFixed(1)}%`, icon: '✅', color: '#10b981' },
    { label: '今日佣金', value: `¥${Number(dashboardData?.todayCommission ?? 0).toFixed(2)}`, icon: '💎', color: '#f59e0b' },
    { label: '总佣金', value: `¥${Number(dashboardData?.totalCommission ?? 0).toFixed(2)}`, icon: '🎁', color: '#8b5cf6' }
  ];

  const statCards3 = [
    { label: '卡密总数', value: dashboardData?.cardPoolCount ?? cardPool?.total ?? 0, icon: '🎫', color: '#6366f1' },
    { label: '已使用', value: dashboardData?.cardUsed ?? cardPool?.used ?? 0, icon: '📝', color: '#ec4899' },
    { label: '已加密', value: dashboardData?.cardEncrypted ?? cardPool?.cryptoStats?.totalEncrypted ?? 0, icon: '🔐', color: '#10b981' },
    { label: '风控日志', value: dashboardData?.riskLogCount ?? 0, icon: '🛡️', color: '#ef4444' },
    { label: '今日拦截', value: dashboardData?.blockedToday ?? 0, icon: '🚫', color: '#f59e0b' }
  ];

  const statusBreakdown = getStatusBreakdown();
  const statusTotal = statusBreakdown.reduce((sum, item) => sum + item.cnt, 0) || 1;

  const levelDistribution = getLevelDistribution();
  const riskTotal = levelDistribution.reduce((sum, item) => sum + item.cnt, 0) || 1;

  const supplierTop5 = getSupplierTop5();
  const maxSupplierAmount = Math.max(...supplierTop5.map(s => s.totalAmount), 1);

  const recentTrend = getRecentTrend();
  const maxGmv = Math.max(...recentTrend.map(t => t.gmv), 1);

  const getConicGradient = (data: Array<{ key: string; cnt: number }>, colorMap: Record<string, { color: string }>) => {
    if (data.length === 0) return '#e2e8f0';
    const total = data.reduce((sum, item) => sum + item.cnt, 0) || 1;
    let cumulative = 0;
    const stops: string[] = [];
    data.forEach(item => {
      const s = colorMap[item.key] || { color: '#94a3b8' };
      const pct = (item.cnt / total) * 100;
      stops.push(`${s.color} ${cumulative}%`);
      cumulative += pct;
      stops.push(`${s.color} ${cumulative}%`);
    });
    return `conic-gradient(${stops.join(', ')})`;
  };

  const getStatusConicGradient = () => {
    const data = statusBreakdown.map(s => ({ key: s.status, cnt: s.cnt }));
    return getConicGradient(data, STATUS_MAP);
  };

  const getRiskConicGradient = () => {
    const data = levelDistribution.map(l => ({ key: l.risk_level, cnt: l.cnt }));
    return getConicGradient(data, RISK_LEVEL_MAP);
  };

  const getRiskDetail = (detail: string) => {
    try {
      const obj = JSON.parse(detail);
      return obj.reason || '风险检测';
    } catch {
      return detail || '风险检测';
    }
  };

  const allLoading = loading.dashboard && loading.orders && loading.suppliers && loading.cardPool && loading.riskLogs;

  if (allLoading) {
    return (
      <div>
        <div className="stats-grid">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="stats-grid" style={{ marginTop: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="stats-grid" style={{ marginTop: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div className="card"><SkeletonChart height={300} /></div>
          <div className="card"><SkeletonChart height={300} /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>📊 运营概览</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>实时监控平台运营数据</div>
        </div>
        <button className="btn btn-default btn-sm" onClick={() => loadAll(true)}>刷新数据</button>
      </div>
      {lastRefreshMessage && (
        <div className="card" style={{ marginBottom: 16, padding: '10px 14px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          {lastRefreshMessage}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {loading.dashboard ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />) :
          errors.dashboard ? <div style={{ gridColumn: '1 / -1' }}><ErrorRetry message={errors.dashboard} onRetry={loadDashboard} /></div> :
            statCards.map((card, i) => (
              <div key={i} className="stat-card">
                <div className="label">{card.label}</div>
                <div className="value">{card.value}</div>
                {card.trend && (
                  <div className={`trend ${card.trend.startsWith('+') ? 'up' : 'down'}`}>
                    {card.trend.startsWith('+') ? '↑' : '↓'} {card.trend.replace(/[+-]/, '')} 较昨日
                  </div>
                )}
                <div className="icon" style={{ color: card.color }}>{card.icon}</div>
              </div>
            ))}
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {loading.dashboard ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />) :
          errors.dashboard ? null :
            statCards2.map((card, i) => (
              <div key={i} className="stat-card">
                <div className="label">{card.label}</div>
                <div className="value">{card.value}</div>
                <div className="icon" style={{ color: card.color }}>{card.icon}</div>
              </div>
            ))}
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {loading.dashboard && loading.cardPool ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />) :
          errors.dashboard && errors.cardPool ? null :
            statCards3.map((card, i) => (
              <div key={i} className="stat-card">
                <div className="label">{card.label}</div>
                <div className="value">{card.value}</div>
                <div className="icon" style={{ color: card.color }}>{card.icon}</div>
              </div>
            ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">📈 近7天GMV趋势</div>
          <span className="text-sm text-muted">单位：元</span>
        </div>
        {loading.dashboard ? <SkeletonChart height={180} /> :
          errors.dashboard ? <ErrorRetry message={errors.dashboard} onRetry={loadDashboard} /> :
            <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '20px 10px' }}>
              {recentTrend.map((item, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>¥{item.gmv.toFixed(0)}</div>
                  <div style={{
                    width: '70%',
                    height: `${(item.gmv / maxGmv) * 120}px`,
                    background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
                    borderRadius: '6px 6px 0 0',
                    minHeight: item.gmv > 0 ? 4 : 0,
                    transition: 'height 0.5s ease'
                  }}></div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.date}</div>
                  <div style={{ fontSize: 10, color: '#cbd5e1' }}>{item.orders}单</div>
                </div>
              ))}
            </div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 订单状态分布</div>
            <span className="tag tag-blue">总计: {statusTotal}</span>
          </div>
          {loading.dashboard && loading.orders ? <SkeletonChart height={280} /> :
            errors.dashboard && errors.orders ? <ErrorRetry message={errors.dashboard || errors.orders || ''} onRetry={() => { loadDashboard(); loadOrders(); }} /> :
              statusBreakdown.length > 0 ? (
                <div style={{ position: 'relative', padding: '10px 0' }}>
                  <div style={{
                    width: 180, height: 180, borderRadius: '50%',
                    margin: '10px auto 20px',
                    position: 'relative',
                    background: getStatusConicGradient()
                  }}>
                    <div style={{
                      position: 'absolute', inset: 35, borderRadius: '50%',
                      background: 'white',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>总计订单</div>
                      <div style={{ fontSize: 28, fontWeight: 700 }}>{statusTotal}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px' }}>
                    {statusBreakdown.map((item, idx) => {
                      const s = STATUS_MAP[item.status] || { text: item.status, cls: 'tag-gray', color: '#94a3b8' };
                      const pct = (item.cnt / statusTotal) * 100;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }}></span>
                            <span className="text-sm">{s.text}</span>
                          </div>
                          <span className="text-sm text-bold">{item.cnt} ({pct.toFixed(0)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">📊</div>暂无数据</div>}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🛡️ 风险等级分布</div>
          </div>
          {loading.dashboard && loading.riskLogs ? <SkeletonChart height={280} /> :
            errors.dashboard && errors.riskLogs ? <ErrorRetry message={errors.dashboard || errors.riskLogs || ''} onRetry={() => { loadDashboard(); loadRiskLogs(); }} /> :
              levelDistribution.length > 0 ? (
                <div style={{ position: 'relative', padding: '10px 0' }}>
                  <div style={{
                    width: 180, height: 180, borderRadius: '50%',
                    margin: '10px auto 20px',
                    position: 'relative',
                    background: getRiskConicGradient()
                  }}>
                    <div style={{
                      position: 'absolute', inset: 35, borderRadius: '50%',
                      background: 'white',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>总计风险</div>
                      <div style={{ fontSize: 28, fontWeight: 700 }}>{riskTotal}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px' }}>
                    {levelDistribution.map((item, idx) => {
                      const s = RISK_LEVEL_MAP[item.risk_level] || { text: item.risk_level, cls: 'tag-gray', color: '#94a3b8' };
                      const pct = (item.cnt / riskTotal) * 100;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }}></span>
                            <span className="text-sm">{s.text}</span>
                          </div>
                          <span className="text-sm text-bold">{item.cnt} ({pct.toFixed(0)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">🛡️</div>暂无风控数据</div>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">🏭 供应商业绩TOP5</div>
          <span className="text-sm text-muted">按GMV排序</span>
        </div>
        {loading.dashboard && loading.suppliers ? <SkeletonChart height={220} /> :
          errors.dashboard && errors.suppliers ? <ErrorRetry message={errors.dashboard || errors.suppliers || ''} onRetry={() => { loadDashboard(); loadSuppliers(); }} /> :
            supplierTop5.length > 0 ? (
              <div style={{ padding: '10px 0' }}>
                {supplierTop5.map((s, idx) => {
                  const successRate = s.totalOrders > 0 ? Math.round((s.totalOrders - s.failCount) / s.totalOrders * 100) : 0;
                  return (
                    <div key={s.id} style={{ marginBottom: 16 }}>
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <span className="text-sm text-bold">{idx + 1}. {s.name}</span>
                        <span style={{ fontSize: 12 }}>
                          <span style={{ color: '#ef4444', fontWeight: 600, marginRight: 12 }}>¥{s.totalAmount.toFixed(2)}</span>
                          <span className="text-muted">{s.totalOrders}单</span>
                          <span className={`tag ${successRate >= 95 ? 'tag-green' : successRate >= 80 ? 'tag-orange' : 'tag-red'}`} style={{ marginLeft: 8 }}>{successRate}%</span>
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: `${(s.totalAmount / maxSupplierAmount) * 100}%`,
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#8b5cf6' : idx === 2 ? '#6366f1' : '#10b981'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">🏭</div>暂无业绩数据</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 最近订单</div>
            <span className="text-sm text-muted">最近10条</span>
          </div>
          {loading.orders ? <SkeletonChart height={280} /> :
            errors.orders ? <ErrorRetry message={errors.orders} onRetry={loadOrders} /> :
              orders.length > 0 ? (
                <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
                  <thead>
                    <tr>
                      <th>订单号</th>
                      <th>商品</th>
                      <th>手机号</th>
                      <th>金额</th>
                      <th>状态</th>
                      <th>时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((o) => {
                      const s = STATUS_MAP[o.status] || { text: o.status, cls: 'tag-gray', color: '#94a3b8' };
                      return (
                        <tr key={o.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.order_no}</td>
                          <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{o.recharge_account || o.user_phone || '-'}</td>
                          <td style={{ color: '#ef4444', fontWeight: 600 }}>¥{o.final_amount.toFixed(2)}</td>
                          <td><span className={`tag ${s.cls}`}>{s.text}</span></td>
                          <td style={{ fontSize: 12, color: '#64748b' }}>{formatTime(o.created_at)}</td>
                          <td><button className="btn btn-link btn-sm">详情</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">📋</div>暂无订单数据</div>}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🚫 最近风控拦截</div>
            <span className="text-sm text-muted">最近10条</span>
          </div>
          {loading.riskLogs ? <SkeletonChart height={280} /> :
            errors.riskLogs ? <ErrorRetry message={errors.riskLogs} onRetry={loadRiskLogs} /> :
              riskLogs.length > 0 ? (
                <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>IP</th>
                      <th>风险等级</th>
                      <th>命中规则</th>
                      <th>拦截</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskLogs.slice(0, 10).map((r) => {
                      const s = RISK_LEVEL_MAP[r.risk_level] || { text: r.risk_level, cls: 'tag-gray', color: '#94a3b8' };
                      return (
                        <tr key={r.id}>
                          <td style={{ fontSize: 12, color: '#64748b' }}>{formatTime(r.created_at)}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.ip}</td>
                          <td><span className={`tag ${s.cls}`}>{s.text}</span></td>
                          <td style={{ fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getRiskDetail(r.detail)}</td>
                          <td><span className={`tag ${r.blocked ? 'tag-red' : 'tag-gray'}`}>{r.blocked ? '已拦截' : '已放行'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">✅</div>最近无风控记录</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">🎫 卡密池加密概览</div>
          <span className="tag tag-green">{cardPool?.encryptionMethod || 'AES-256-CBC'}</span>
        </div>
        {loading.cardPool ? <SkeletonChart height={160} /> :
          errors.cardPool ? <ErrorRetry message={errors.cardPool} onRetry={loadCardPool} /> :
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', padding: 16, background: '#f0fdf4', borderRadius: 10 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{dashboardData?.cardPoolCount ?? cardPool?.total ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>总卡密数</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, background: '#dbeafe', borderRadius: 10 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{dashboardData?.cardEncrypted ?? cardPool?.cryptoStats?.totalEncrypted ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>已加密</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, background: '#fef3c7', borderRadius: 10 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>{dashboardData?.cardTodayDecrypt ?? cardPool?.cryptoStats?.todayDecrypt ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>今日解密</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, background: '#fef2f2', borderRadius: 10 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{dashboardData?.cardExpiringSoon ?? cardPool?.expiringSoon ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>即将过期</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, background: '#f1f5f9', borderRadius: 10 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#64748b' }}>{dashboardData?.cardExpired ?? cardPool?.expired ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>已过期</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                <div>
                  <span style={{ fontSize: 13, color: '#64748b' }}>加密算法：</span>
                  <span className="tag tag-green" style={{ marginRight: 12 }}>AES-256-CBC</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>密钥版本：</span>
                  <span className="tag tag-blue">{cardPool?.keyVersion || 'key-v2.1'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  加密率：{(dashboardData?.cardPoolCount ?? cardPool?.total ?? 0) > 0 ? Math.round(((dashboardData?.cardEncrypted ?? cardPool?.cryptoStats?.totalEncrypted ?? 0) / (dashboardData?.cardPoolCount ?? cardPool?.total ?? 0)) * 100) : 0}%
                </div>
              </div>
            </div>}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
