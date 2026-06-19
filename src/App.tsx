import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  ChevronRight,
  CloudSun,
  FileSignature,
  Home,
  Leaf,
  PackageCheck,
  ScanSearch,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Store,
  Truck,
  UserRoundCheck,
  Plus,
  Handshake,
  Lock,
  Wallet,
  Eye,
  CheckCircle2,
  Clock,
  FileCheck,
  MessageSquare,
  Bug,
  CloudLightning,
  ArrowRight,
  X,
  Gavel,
  RefreshCw,
  Download,
  Gift,
  Ticket,
  Coins,
  Train,
  IdCard,
  Building2,
  TrendingDown,
  CalendarDays,
  Plane,
  Hotel,
  HeartHandshake,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import type {
  Metric, Product, TimelineItem, TraceBatch,
  UnionMember, UnionOrg, WelfareBudget, WelfareCoupon,
  PointsAccount, PointsRecord, UnionCard, SupplierAssessment,
  MemberBenefit, TravelBooking, LegalConsult, FunnelAnalysis
} from '../shared/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const DEFAULT_TRACE_CODE = 'TRC-2026-RICE-89141';

interface DashboardData {
  metrics: Metric[];
  qualityTrend: Array<{ month: string; passRate: number; sampling: number; risk: number }>;
  alerts: Array<{ id: string; region: string; level: string; alertType: string; suggestion: string; startsAt: string }>;
}

interface TraceResult {
  batch: TraceBatch;
  timeline: TimelineItem[];
}

interface OrderRow {
  id: string;
  buyer: string;
  seller: string;
  amount: number;
  status: string;
  progress: number;
  logistics: string;
  createdAt: string;
}

interface ContractRow {
  id: string;
  title: string;
  counterparty: string;
  amount: number;
  status: string;
  blockchainHash: string;
  signedAt: string;
}

interface QuestionRow {
  id: string;
  title: string;
  category: string;
  expert: string;
  status: string;
  answers: number;
  responseTime: string;
}

interface WeatherAlert {
  id: string;
  region: string;
  level: string;
  alertType: string;
  suggestion: string;
  startsAt: string;
}

function currency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(value);
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function useApi<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiGet<T>(path)
      .then((payload) => {
        if (active) {
          setData(payload);
          setError('');
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [path, refreshKey]);

  return { data, loading, error, refresh };
}

const cacheRef: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 30_000;

function useCachedApi<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(() => {
    const cached = cacheRef[path];
    if (cached && cached.data) {
      return cached.data as T;
    }
    return fallback;
  });
  const [loading, setLoading] = useState(() => {
    const cached = cacheRef[path];
    return !(cached && cached.data && Date.now() - cached.ts < CACHE_TTL);
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = cacheRef[path];
    if (cached && cached.data && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data as T);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    apiGet<T>(path)
      .then((payload) => {
        if (active) {
          setData(payload);
          setError('');
          cacheRef[path] = { data: payload, ts: Date.now() };
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          if (cached && cached.data) {
            setData(cached.data as T);
          }
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [path]);

  return { data, loading, error };
}

function useModal() {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  return { open, openModal, closeModal };
}

interface MatchResult {
  id: string;
  name: string;
  category: string;
  region: string;
  spec: string;
  price: string;
  seller: string;
  matchScore: number;
}

interface AppState {
  orders: OrderRow[];
  contracts: ContractRow[];
  matchResults: MatchResult[];
  addOrder: (order: Omit<OrderRow, 'id' | 'createdAt'>) => OrderRow;
  addContract: (contract: Omit<ContractRow, 'id' | 'signedAt'>) => ContractRow;
  setMatchResults: (results: MatchResult[]) => void;
}

const AppContext = React.createContext<AppState | null>(null);

function useAppState() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

function App() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  const addOrder = useCallback((order: Omit<OrderRow, 'id' | 'createdAt'>): OrderRow => {
    const newOrder: OrderRow = {
      ...order,
      id: `od-${Date.now()}`,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const addContract = useCallback((contract: Omit<ContractRow, 'id' | 'signedAt'>): ContractRow => {
    const newContract: ContractRow = {
      ...contract,
      id: `ct-${Date.now()}`,
      signedAt: new Date().toLocaleDateString('zh-CN'),
    };
    setContracts((prev) => [newContract, ...prev]);
    return newContract;
  }, []);

  const appState: AppState = {
    orders,
    contracts,
    matchResults,
    addOrder,
    addContract,
    setMatchResults,
  };

  return (
    <AppContext.Provider value={appState}>
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <Topbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trace" element={<TracePage />} />
            <Route path="/trace/:code" element={<TracePage />} />
            <Route path="/market/b2b" element={<MarketPage channel="b2b" />} />
            <Route path="/market/b2c" element={<MarketPage channel="b2c" />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/agtech/qa" element={<AgtechPage />} />
            <Route path="/agtech/pest" element={<PestPage />} />
            <Route path="/agtech/weather" element={<WeatherPage />} />
            <Route path="/regulatory" element={<RegulatoryPage />} />
            <Route path="/regulatory/reports" element={<RegulatoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
}

function Sidebar() {
  const links = [
    { to: '/', label: '看板', icon: Home },
    { to: '/trace', label: '溯源', icon: ScanSearch },
    { to: '/market/b2b', label: 'B2B', icon: Boxes },
    { to: '/market/b2c', label: 'B2C', icon: ShoppingBasket },
    { to: '/union/welfare', label: '福利', icon: Gift },
    { to: '/union/coupons', label: '电子券', icon: Ticket },
    { to: '/union/points', label: '积分', icon: Coins },
    { to: '/union/travel', label: '出行', icon: Train },
    { to: '/union/legal', label: '法律', icon: Gavel },
    { to: '/orders', label: '订单', icon: PackageCheck },
    { to: '/contracts', label: '合同', icon: FileSignature },
    { to: '/regulatory', label: '监管', icon: ShieldCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <BadgeCheck size={24} />
        </div>
        <div>
          <strong>工会普惠</strong>
          <span>职工服务运营平台</span>
        </div>
      </div>
      <nav className="nav-list" aria-label="主导航">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="side-status">
        <BadgeCheck size={18} />
        <div>
          <strong>链上存证正常</strong>
          <span>区块高度 8,927,523</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">入会 · 福利 · 服务 · 监管</p>
        <h1>工会职工普惠服务运营平台</h1>
      </div>
      <div className="topbar-actions">
        <NavLink to="/trace" className="icon-button" title="溯源查询">
          <Search size={18} />
        </NavLink>
        <NavLink to="/profile" className="profile-chip">
          <UserRoundCheck size={18} />
          <span>工会管理员</span>
        </NavLink>
      </div>
    </header>
  );
}

interface UnionDashboardData {
  memberCount: number;
  orgCount: number;
  welfareBudgetTotal: number;
  couponUsageRate: { used: number; total: number };
  activeSuppliers: number;
}

function Dashboard() {
  const { data, loading, error } = useCachedApi<DashboardData>('/api/dashboard', {
    metrics: [],
    qualityTrend: [],
    alerts: [],
  });
  const { data: unionData } = useCachedApi<UnionDashboardData>('/api/union/dashboard', {
    memberCount: 0,
    orgCount: 0,
    welfareBudgetTotal: 0,
    couponUsageRate: { used: 0, total: 0 },
    activeSuppliers: 0,
  });
  const { data: productsData } = useCachedApi<{ products: Product[] }>('/api/products', { products: [] });
  const navigate = useNavigate();
  const [traceCode, setTraceCode] = useState(DEFAULT_TRACE_CODE);
  const hasTrendData = data.qualityTrend.length > 0;
  const latestTrend = hasTrendData ? data.qualityTrend[data.qualityTrend.length - 1] : null;

  const unionMetrics = [
    { id: 'u1', label: '工会会员', value: unionData.memberCount.toLocaleString('zh-CN'), delta: '+8.5%', tone: 'green' as const },
    { id: 'u2', label: '工会组织', value: unionData.orgCount.toLocaleString('zh-CN'), delta: '+5.2%', tone: 'blue' as const },
    { id: 'u3', label: '福利预算', value: `¥${(unionData.welfareBudgetTotal / 10000).toFixed(0)}万`, delta: '+12.3%', tone: 'amber' as const },
    { id: 'u4', label: '活跃供应商', value: unionData.activeSuppliers.toString(), delta: 'A级+B级', tone: 'slate' as const },
  ];

  const couponUsagePercent = unionData.couponUsageRate.total > 0
    ? Math.round((unionData.couponUsageRate.used / unionData.couponUsageRate.total) * 100)
    : 0;

  return (
    <section className="page-space">
      <div className="dashboard-grid">
        <section className="command-panel">
          <div className="panel-copy">
            <p className="eyebrow">今日运营概览</p>
            <h2>工会会员服务、福利发放与供应商管理集中运营</h2>
            <p>已接入会员身份核验、组织分级管理、福利预算审批、电子券核销、积分商城和供应商准入考核数据，全流程闭环管理。</p>
          </div>
          <form
            className="trace-search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/trace?code=${encodeURIComponent(traceCode)}`);
            }}
          >
            <ScanSearch size={20} />
            <input value={traceCode} onChange={(event) => setTraceCode(event.target.value)} aria-label="溯源码" placeholder="输入溯源码查询..." />
            <button type="submit">
              <Search size={18} />
              查询
            </button>
          </form>
          <div className="media-strip" aria-label="工会服务场景">
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80"
              alt="工会服务"
            />
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="会员服务"
            />
          </div>
        </section>

        <section className="quality-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">电子券使用率</p>
              <h3>{couponUsagePercent}%</h3>
            </div>
            <Ticket size={24} />
          </div>
          <div className="trend-chart">
            <div className="trend-item">
              <span style={{ height: `${Math.max(16, couponUsagePercent * 2.8)}px` }} />
              <small>已使用</small>
            </div>
            <div className="trend-item">
              <span style={{ height: `${Math.max(16, (100 - couponUsagePercent) * 2.8)}px` }} />
              <small>未使用</small>
            </div>
          </div>
          <div className="risk-row">
            <span>已发券 {unionData.couponUsageRate.total} 张</span>
            <strong>已核销 {unionData.couponUsageRate.used} 张</strong>
          </div>
        </section>
      </div>

      {loading && <StatusLine loading={loading} error={error} />}
      {error && <StatusLine loading={false} error={error} />}

      <div className="metrics-grid">
        {unionMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="content-grid two">
        <section className="section-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">会员服务</p>
              <h2>热门权益推荐</h2>
            </div>
            <Sparkles size={22} />
          </div>
          <div className="stack-list">
            <article className="alert-row">
              <div className="alert-level green">推荐</div>
              <div>
                <strong>五常有机稻花香 · 会员专享</strong>
                <p>溯源保真，工会补贴价 ¥168/5kg，可用积分抵扣</p>
                <span>库存 500 份</span>
              </div>
            </article>
            <article className="alert-row">
              <div className="alert-level blue">推荐</div>
              <div>
                <strong>高铁票85折优惠</strong>
                <p>全国高铁票会员专享折扣，不限线路</p>
                <span>每月限2次</span>
              </div>
            </article>
            <article className="alert-row">
              <div className="alert-level amber">推荐</div>
              <div>
                <strong>免费法律咨询服务</strong>
                <p>专业律师一对一咨询，覆盖劳动纠纷、合同纠纷等</p>
                <span>不限次数</span>
              </div>
            </article>
          </div>
          <NavLink to="/union/welfare" className="view-all-link">
            查看全部权益 <ArrowRight size={16} />
          </NavLink>
        </section>

        <section className="section-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">供应商管理</p>
              <h2>准入考核评级</h2>
            </div>
            <Target size={22} />
          </div>
          <div className="product-mini-list">
            <article className="mini-product">
              <div className="supply-badge" style={{ background: '#10B981', color: '#fff' }}>A级</div>
              <div>
                <strong>黑龙江禾源农业合作社</strong>
                <span>综合评分 94.5 · 优秀</span>
              </div>
              <b>准入</b>
            </article>
            <article className="mini-product">
              <div className="supply-badge" style={{ background: '#10B981', color: '#fff' }}>A级</div>
              <div>
                <strong>杭州云栖茶业有限公司</strong>
                <span>综合评分 91.9 · 优秀</span>
              </div>
              <b>准入</b>
            </article>
            <article className="mini-product">
              <div className="supply-badge" style={{ background: '#F59E0B', color: '#fff' }}>B级</div>
              <div>
                <strong>山东寿光智农园区</strong>
                <span>综合评分 87.4 · 合格</span>
              </div>
              <b>准入</b>
            </article>
            <article className="mini-product">
              <div className="supply-badge" style={{ background: '#EF4444', color: '#fff' }}>D级</div>
              <div>
                <strong>某不合格供应商</strong>
                <span>综合评分 54.8 · 淘汰</span>
              </div>
              <b>清退</b>
            </article>
          </div>
          <NavLink to="/market/b2b" className="view-all-link">
            查看全部供应商 <ArrowRight size={16} />
          </NavLink>
        </section>
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className={`metric-card ${metric.tone}`}>
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <em>{metric.delta}</em>
    </article>
  );
}

interface VerifyResult {
  member: UnionMember | null;
  orgHierarchy: UnionOrg[];
  error?: string;
}

function TracePage() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || DEFAULT_TRACE_CODE;
  const [code, setCode] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(initialCode);
  const [idCard, setIdCard] = useState('230184198505120018');
  const [employeeNo, setEmployeeNo] = useState('HLJ-2024-089141');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const { data, loading, error, refresh } = useApi<TraceResult>(`/api/trace/${encodeURIComponent(activeCode)}`, {
    batch: {
      id: '',
      traceCode: activeCode,
      productName: '',
      category: '',
      specification: '',
      producer: '',
      origin: '',
      productionDate: '',
      shelfLife: 0,
      status: '',
      blockchainHash: '',
      blockHeight: 0,
      qualityResult: '',
    },
    timeline: [],
  });

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && urlCode !== activeCode) {
      setCode(urlCode);
      setActiveCode(urlCode);
    }
  }, [searchParams, activeCode]);

  const stageColors: Record<string, string> = {
    '种植建档': 'green',
    '农事操作': 'green',
    '质量检测': 'blue',
    '加工包装': 'amber',
    '冷链物流': 'blue',
    '到货入库': 'slate',
    '入市销售': 'green',
    '监管复查': 'blue',
  };

  const fullChainStages = ['种植建档', '农事操作', '加工包装', '冷链物流', '到货入库', '入市销售', '监管复查'];
  const completedStages = data.timeline.map((t) => t.stage);

  async function handleVerify() {
    setVerifyLoading(true);
    setVerifyError('');
    setSyncStatus('正在核验会员身份...');
    try {
      const response = await fetch(`${API_BASE}/api/union/members/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCard, employeeNo }),
      });
      const result = await response.json();
      if (!response.ok) {
        setVerifyError(result.message || '核验失败');
        setVerifyResult(null);
      } else {
        setVerifyResult(result);
        setSyncStatus('已同步全国总工会组织分级关系');
      }
    } catch (err) {
      setVerifyError('网络错误，请稍后重试');
      setVerifyResult(null);
    } finally {
      setVerifyLoading(false);
    }
  }

  function maskIdCard(id: string) {
    if (!id || id.length < 10) return id;
    return id.slice(0, 6) + '********' + id.slice(-4);
  }

  function maskEmployeeNo(no: string) {
    if (!no || no.length < 6) return no;
    return no.slice(0, 3) + '***' + no.slice(-4);
  }

  return (
    <section className="page-space">
      <div className="content-grid two">
        <div className="section-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">Traceability</p>
              <h2>溯源查询</h2>
            </div>
            <ShieldCheck size={24} />
          </div>
          <form
            className="trace-search compact"
            onSubmit={(event) => {
              event.preventDefault();
              const newCode = code.trim() || DEFAULT_TRACE_CODE;
              setActiveCode(newCode);
            }}
          >
            <ScanSearch size={20} />
            <input value={code} onChange={(event) => setCode(event.target.value)} aria-label="溯源码" placeholder="输入溯源码查询..." />
            <button type="submit">
              <Search size={18} />
              查询
            </button>
          </form>
          <StatusLine loading={loading} error={error} />
        </div>

        <div className="section-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">Member Verification</p>
              <h2>会员身份核验</h2>
            </div>
            <IdCard size={24} />
          </div>
          <div className="modal-form">
            <div className="form-group">
              <label>身份证号</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="请输入18位身份证号"
                  maxLength={18}
                />
              </div>
            </div>
            <div className="form-group">
              <label>单位工号</label>
              <input
                type="text"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                placeholder="请输入工会单位工号"
              />
            </div>
            <button
              className="action-btn green full"
              onClick={handleVerify}
              disabled={verifyLoading || !idCard || !employeeNo}
            >
              {verifyLoading ? <RefreshCw size={14} className="spin" /> : <BadgeCheck size={14} />}
              {verifyLoading ? '核验中...' : '核验身份并同步工会关系'}
            </button>
          </div>
          {verifyError && (
            <div style={{ marginTop: 12, padding: 12, background: '#FEF2F2', borderRadius: 8, color: '#DC2626', fontSize: 14 }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
              {verifyError}
            </div>
          )}
          {syncStatus && !verifyError && (
            <div style={{ marginTop: 12, padding: 12, background: '#ECFDF5', borderRadius: 8, color: '#059669', fontSize: 14 }}>
              <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6 }} />
              {syncStatus}
            </div>
          )}
        </div>
      </div>

      {verifyResult?.member && (
        <div className="section-panel" style={{ marginTop: 20 }}>
          <div className="section-title">
            <div>
              <p className="eyebrow">Member Info</p>
              <h2>会员信息 & 组织分级关系</h2>
            </div>
            <Users size={22} />
          </div>
          <div className="content-grid two" style={{ gap: 24 }}>
            <div>
              <div className="shop-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 16 }}>
                <div className="shop-stat-card">
                  <BadgeCheck size={22} />
                  <div>
                    <strong>{verifyResult.member.name}</strong>
                    <span>
                      {verifyResult.member.membershipStatus} · {verifyResult.member.gender}
                    </span>
                  </div>
                </div>
                <div className="shop-stat-card">
                  <Coins size={22} />
                  <div>
                    <strong>{verifyResult.member.memberPoints.toLocaleString()}</strong>
                    <span>可用积分</span>
                  </div>
                </div>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>身份证号</dt>
                  <dd>{maskIdCard(verifyResult.member.idCard)}</dd>
                </div>
                <div>
                  <dt>单位工号</dt>
                  <dd>{maskEmployeeNo(verifyResult.member.employeeNo)}</dd>
                </div>
                <div>
                  <dt>所属工会</dt>
                  <dd>{verifyResult.member.unionName}</dd>
                </div>
                <div>
                  <dt>工会层级</dt>
                  <dd>{verifyResult.member.unionLevel}</dd>
                </div>
                <div>
                  <dt>入会时间</dt>
                  <dd>{verifyResult.member.verifiedAt}</dd>
                </div>
                <div>
                  <dt>福利账户余额</dt>
                  <dd>{currency(verifyResult.member.welfareBalance)}</dd>
                </div>
              </dl>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>全国工会组织分级关系（从基层到全国）</p>
              <div className="stack-list">
                {verifyResult.orgHierarchy.slice().reverse().map((org, idx) => (
                  <article className="supply-row" key={org.id}>
                    <div className="supply-info">
                      <div className="supply-badge" style={{
                        background: idx === 0 ? '#10B981' : idx === verifyResult.orgHierarchy.length - 1 ? '#1E40AF' : '#F59E0B',
                        color: '#fff'
                      }}>{org.level}</div>
                      <div>
                        <strong>{org.name}</strong>
                        <p>会员 {org.memberCount.toLocaleString('zh-CN')} 人 · 管理员：{org.adminName}</p>
                        <span>状态：{org.status}</span>
                      </div>
                    </div>
                    <div className="supply-actions">
                      <ChevronRight size={20} />
                    </div>
                  </article>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 12, background: '#EFF6FF', borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#1E40AF' }}>
                  <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                  已同步至全国总工会会员管理系统，数据实时联动
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.batch.productName && (
        <>
          <div className="section-panel" style={{ marginTop: 20 }}>
            <div className="section-title">
              <div>
                <p className="eyebrow">Batch Info</p>
                <h2>批次信息 · {data.batch.productName}</h2>
              </div>
              <div className="title-actions">
                <button className="action-btn outline small" onClick={refresh}>
                  <RefreshCw size={14} />
                  刷新
                </button>
                <Leaf size={23} />
              </div>
            </div>
            <div className="content-grid two" style={{ gap: 24 }}>
              <div>
                <div className="batch-badge" style={{ marginBottom: 12 }}>{data.batch.qualityResult}</div>
                <h3 style={{ fontSize: 20, marginBottom: 4 }}>{data.batch.productName}</h3>
                <p style={{ color: '#6B7280', marginBottom: 16 }}>{data.batch.producer}</p>
                <dl className="detail-grid">
                  <div>
                    <dt>溯源码</dt>
                    <dd>{data.batch.traceCode}</dd>
                  </div>
                  <div>
                    <dt>产地</dt>
                    <dd>{data.batch.origin}</dd>
                  </div>
                  <div>
                    <dt>规格</dt>
                    <dd>{data.batch.specification}</dd>
                  </div>
                  <div>
                    <dt>批次状态</dt>
                    <dd>{data.batch.status}</dd>
                  </div>
                  <div>
                    <dt>区块高度</dt>
                    <dd>{data.batch.blockHeight.toLocaleString('zh-CN')}</dd>
                  </div>
                  <div>
                    <dt>生产日期</dt>
                    <dd>{data.batch.productionDate}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="eyebrow" style={{ marginBottom: 12 }}>会员专属权益</p>
                <div className="stack-list">
                  <article className="alert-row">
                    <div className="alert-level green">专享</div>
                    <div>
                      <strong>工会补贴价</strong>
                      <p>凭会员身份立减 ¥30，叠加积分最高可抵扣 20%</p>
                    </div>
                  </article>
                  <article className="alert-row">
                    <div className="alert-level blue">电子券</div>
                    <div>
                      <strong>支持农产品券核销</strong>
                      <p>已绑定的 {verifyResult?.member?.name || '会员'} 农产品券可直接抵扣</p>
                    </div>
                  </article>
                  <article className="alert-row">
                    <div className="alert-level amber">工会卡</div>
                    <div>
                      <strong>工会卡支付立减</strong>
                      <p>绑定的工商/建设/中国银行工会卡支付享 95 折</p>
                    </div>
                  </article>
                </div>
                <div className="chain-progress" style={{ marginTop: 16 }}>
                  <p className="eyebrow">全链路进度 · {completedStages.length}/{fullChainStages.length} 环节</p>
                  <div className="chain-bar">
                    {fullChainStages.map((stage) => {
                      const reached = completedStages.includes(stage);
                      const labelMap: Record<string, string> = {
                        '种植建档': '种植',
                        '农事操作': '农事',
                        '加工包装': '加工',
                        '冷链物流': '物流',
                        '到货入库': '入库',
                        '入市销售': '入市',
                        '监管复查': '监管',
                      };
                      return (
                        <div key={stage} className={`chain-node ${reached ? 'reached' : ''}`}>
                          <span className="chain-dot" />
                          <small>{labelMap[stage] || stage}</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="hash-box" style={{ marginTop: 16 }}>
                  <span>链上哈希</span>
                  <code>{data.batch.blockchainHash}</code>
                </div>
              </div>
            </div>
          </div>

          <section className="section-panel" style={{ marginTop: 20 }}>
            <div className="section-title">
              <div>
                <p className="eyebrow">Full Chain</p>
                <h2>全链路时间线 · {data.timeline.length} 条记录</h2>
              </div>
              <Truck size={23} />
            </div>
            <div className="timeline">
              {data.timeline.map((item) => (
                <article key={item.id} className="timeline-item">
                  <div className={`timeline-dot ${stageColors[item.stage] || 'green'}`} />
                  <div>
                    <span>{item.eventTime}</span>
                    <h3>{item.stage} · {item.operator}</h3>
                    <p>{item.description}</p>
                    <small>
                      {item.location}
                      {item.temperature ? ` · ${item.temperature}°C` : ''}
                      {item.humidity ? ` · 湿度 ${item.humidity}%` : ''}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function MarketPage({ channel }: { channel: 'b2b' | 'b2c' }) {
  const { data, loading, error } = useApi<{ products: Product[] }>(`/api/products?channel=${channel}`, { products: [] });
  const { data: budgetsData } = useCachedApi<{ budgets: WelfareBudget[] }>('/api/union/welfare/budgets', { budgets: [] });
  const { data: couponsData } = useCachedApi<{ coupons: WelfareCoupon[] }>('/api/union/welfare/coupons?memberId=um-001', { coupons: [] });
  const { data: pointsData } = useCachedApi<{ account: PointsAccount | null; records: PointsRecord[] }>('/api/union/points/account/um-001', { account: null, records: [] });
  const { data: cardsData } = useCachedApi<{ cards: UnionCard[] }>('/api/union/cards?memberId=um-001', { cards: [] });
  const { data: assessmentsData } = useCachedApi<{ assessments: SupplierAssessment[] }>('/api/union/supplier/assessments', { assessments: [] });
  const { data: benefitsData } = useCachedApi<{ benefits: MemberBenefit[] }>('/api/union/benefits', { benefits: [] });
  const { addOrder, addContract, matchResults, setMatchResults } = useAppState();
  const navigate = useNavigate();
  const shopModal = useModal();
  const orderModal = useModal();
  const matchModal = useModal();
  const successModal = useModal();
  const budgetModal = useModal();
  const supplierModal = useModal();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [paymentMode, setPaymentMode] = useState<'welfare_budget' | 'coupon' | 'union_card' | 'points' | 'escrow'>('welfare_budget');
  const [supplyTab, setSupplyTab] = useState<'products' | 'supply' | 'demand' | 'budget' | 'supplier' | 'benefits'>('products');
  const [b2cTab, setB2cTab] = useState<'products' | 'benefits'>('products');
  const [selectedDemand, setSelectedDemand] = useState<typeof demandItems[0] | null>(null);
  const [lastOrderId, setLastOrderId] = useState('');
  const [lastContractId, setLastContractId] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<WelfareBudget | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<WelfareCoupon | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [benefitCategory, setBenefitCategory] = useState<string>('all');

  const supplyItems = [
    { id: 's-1', name: '批量有机稻花香', category: '粮油', region: '黑龙江', spec: '25kg/袋', qty: '50吨', price: '¥48/kg', seller: '黑龙江禾源农业合作社' },
    { id: 's-2', name: '赣南脐橙大宗', category: '水果', region: '江西', spec: '10kg/箱', qty: '120吨', price: '¥30/kg', seller: '赣州金橙农业公司' },
    { id: 's-3', name: '有机黑豆供应', category: '粮油', region: '黑龙江', spec: '1kg/袋', qty: '80吨', price: '¥24/kg', seller: '黑龙江农垦集团' },
  ];

  const demandItems = [
    { id: 'd-1', name: '采购精品番茄', category: '蔬菜', region: '全国', spec: '2.5kg/箱', qty: '20吨', budget: '¥20/kg', buyer: '上海永辉超市' },
    { id: 'd-2', name: '长期求购有机大米', category: '粮油', region: '东北', spec: '5kg/袋', qty: '100吨/月', budget: '¥50/kg', buyer: '北京物美集团' },
    { id: 'd-3', name: '紧急采购蓝莓', category: '水果', region: '东北', spec: '1.5kg/箱', qty: '5吨', budget: '¥60/kg', buyer: '广州百佳超市' },
  ];

  const availableCoupons = couponsData.coupons.filter(c => c.status === '未使用' && (c.type === '农产品券' || c.type === '节日福利'));
  const availableBudget = budgetsData.budgets.find(b => b.status === '已批准' || b.status === '已执行');
  const filteredBenefits = benefitCategory === 'all'
    ? benefitsData.benefits
    : benefitsData.benefits.filter(b => b.category === benefitCategory);

  function handleOrder(product: Product) {
    setSelectedProduct(product);
    setOrderQty(product.moq);
    setPaymentMode('welfare_budget');
    setUsePoints(false);
    setSelectedCoupon(null);
    orderModal.openModal();
  }

  function handleMatchDemand(demand: typeof demandItems[0]) {
    setSelectedDemand(demand);
    const matched = data.products
      .filter((p) => p.category === demand.category || p.name.includes(demand.name.replace('采购', '').replace('长期求购', '').replace('紧急采购', '')))
      .map((p) => {
        const assessment = assessmentsData.assessments.find(a => a.supplierName.includes(p.seller.slice(0, 4)));
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          region: p.origin,
          spec: p.specification,
          price: currency(p.wholesalePrice),
          seller: p.seller,
          matchScore: Math.floor(Math.random() * 25) + 75,
          supplierLevel: assessment?.level || 'B',
          supplierStatus: assessment?.status || '合格',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
    setMatchResults(matched);
    matchModal.openModal();
  }

  function handleConfirmOrder() {
    if (!selectedProduct) return;
    const unitPrice = selectedProduct.channel === 'b2b' ? selectedProduct.wholesalePrice : selectedProduct.price;
    let amount = orderQty * unitPrice;

    if (paymentMode === 'coupon' && selectedCoupon) {
      amount = Math.max(0, amount - selectedCoupon.value);
    }
    if (usePoints && pointsData.account) {
      const pointsDeduction = Math.min(pointsData.account.availablePoints * 0.01, amount * 0.2);
      amount -= pointsDeduction;
    }
    if (paymentMode === 'union_card') {
      amount = amount * 0.95;
    }

    const orderStatusMap: Record<string, string> = {
      welfare_budget: '福利预算审批中',
      coupon: '电子券核销中',
      union_card: '工会卡支付处理中',
      points: '积分抵扣确认中',
      escrow: '担保支付中',
    };
    const progressMap: Record<string, number> = {
      welfare_budget: 15,
      coupon: 25,
      union_card: 35,
      points: 30,
      escrow: 30,
    };

    const newOrder = addOrder({
      buyer: '黑龙江省总工会（工会福利采购）',
      seller: selectedProduct.seller,
      amount,
      status: orderStatusMap[paymentMode] || '担保支付中',
      progress: progressMap[paymentMode] || 30,
      logistics: '待福利预算审批通过后安排发货',
    });

    const newContract = addContract({
      title: `工会福利采购 - ${selectedProduct.name} 采购合同（含福利预算审批）`,
      counterparty: selectedProduct.seller,
      amount,
      status: paymentMode === 'welfare_budget' ? '待福利预算审批' : '待乙方签署',
      blockchainHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 8)}`,
    });

    setLastOrderId(newOrder.id);
    setLastContractId(newContract.id);
    orderModal.closeModal();
    successModal.openModal();
  }

  function handleGoToOrders() {
    successModal.closeModal();
    navigate('/orders');
  }

  function handleGoToContracts() {
    successModal.closeModal();
    navigate('/contracts');
  }

  function handleSelectMatch(match: MatchResult) {
    const matchedProduct = data.products.find((p) => p.id === match.id);
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
      setOrderQty(matchedProduct.moq);
      matchModal.closeModal();
      orderModal.openModal();
    }
  }

  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">{channel === 'b2b' ? 'Wholesale' : 'Retail'}</p>
          <h2>{channel === 'b2b' ? 'B2B批发市场' : 'B2C零售商城'}</h2>
        </div>
        <div className="title-actions">
          <button className="action-btn green" onClick={shopModal.openModal}>
            <Plus size={16} />
            在线开店
          </button>
          <Store size={24} />
        </div>
      </div>

      {channel === 'b2b' ? (
        <div className="tab-bar">
          <button className={`tab-btn ${supplyTab === 'products' ? 'active' : ''}`} onClick={() => setSupplyTab('products')}>商品市场</button>
          <button className={`tab-btn ${supplyTab === 'budget' ? 'active' : ''}`} onClick={() => setSupplyTab('budget')}>福利预算</button>
          <button className={`tab-btn ${supplyTab === 'supply' ? 'active' : ''}`} onClick={() => setSupplyTab('supply')}>供应大厅</button>
          <button className={`tab-btn ${supplyTab === 'demand' ? 'active' : ''}`} onClick={() => setSupplyTab('demand')}>采购需求</button>
          <button className={`tab-btn ${supplyTab === 'supplier' ? 'active' : ''}`} onClick={() => setSupplyTab('supplier')}>供应商考核</button>
        </div>
      ) : (
        <div className="tab-bar">
          <button className={`tab-btn ${b2cTab === 'products' ? 'active' : ''}`} onClick={() => setB2cTab('products')}>商品购买</button>
          <button className={`tab-btn ${b2cTab === 'benefits' ? 'active' : ''}`} onClick={() => setB2cTab('benefits')}>权益推荐</button>
        </div>
      )}

      <StatusLine loading={loading} error={error} />

      {(channel === 'b2b' && supplyTab === 'products') || (channel === 'b2c' && b2cTab === 'products') ? (
        <div className="product-grid">
          {data.products.map((product) => (
            <MarketProductCard key={product.id} product={product} onOrder={handleOrder} />
          ))}
        </div>
      ) : null}

      {channel === 'b2b' && supplyTab === 'budget' && (
        <div className="stack-list">
          <div className="section-panel nested">
            <div className="shop-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div className="shop-stat-card">
                <Wallet size={22} />
                <div>
                  <strong>{budgetsData.budgets.length}</strong>
                  <span>预算方案数</span>
                </div>
              </div>
              <div className="shop-stat-card">
                <Target size={22} />
                <div>
                  <strong>¥{budgetsData.budgets.reduce((s, b) => s + b.totalAmount, 0).toLocaleString('zh-CN')}</strong>
                  <span>预算总额</span>
                </div>
              </div>
              <div className="shop-stat-card">
                <Coins size={22} />
                <div>
                  <strong>¥{budgetsData.budgets.reduce((s, b) => s + b.remainingAmount, 0).toLocaleString('zh-CN')}</strong>
                  <span>剩余可用</span>
                </div>
              </div>
            </div>
          </div>
          {budgetsData.budgets.map((budget) => {
            const usagePercent = budget.totalAmount > 0 ? Math.round((budget.usedAmount / budget.totalAmount) * 100) : 0;
            const statusColor = budget.status === '已执行' || budget.status === '已批准' ? 'green' : budget.status === '待审批' ? 'amber' : 'slate';
            return (
              <article key={budget.id} className="order-row">
                <div>
                  <strong>{budget.unionName}</strong>
                  <p>{budget.year}年 Q{budget.quarter} · {budget.description}</p>
                  <span>审批人：{budget.approver || '待指定'} · {budget.id}</span>
                </div>
                <div className="order-status">
                  <b>{currency(budget.totalAmount)}</b>
                  <span className={`status-tag ${statusColor}`}>{budget.status}</span>
                  <progress max={100} value={usagePercent} />
                  <small style={{ fontSize: 12, color: '#6B7280' }}>已用 {usagePercent}% · 剩余 {currency(budget.remainingAmount)}</small>
                  {budget.status === '待审批' && (
                    <button className="action-btn green small" onClick={() => {
                      setSelectedBudget(budget);
                      budgetModal.openModal();
                    }}>
                      <FileSignature size={14} />
                      审批
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {channel === 'b2b' && supplyTab === 'supplier' && (
        <div className="stack-list">
          <div className="section-panel nested">
            <h3 style={{ marginBottom: 16 }}>供应商准入考核标准</h3>
            <div className="shop-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="shop-stat-card">
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
                <div>
                  <strong>{assessmentsData.assessments.filter(a => a.level === 'A').length}</strong>
                  <span>优秀供应商</span>
                </div>
              </div>
              <div className="shop-stat-card">
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>B</div>
                <div>
                  <strong>{assessmentsData.assessments.filter(a => a.level === 'B').length}</strong>
                  <span>合格供应商</span>
                </div>
              </div>
              <div className="shop-stat-card">
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6B7280', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C</div>
                <div>
                  <strong>{assessmentsData.assessments.filter(a => a.level === 'C').length}</strong>
                  <span>整改中</span>
                </div>
              </div>
              <div className="shop-stat-card">
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>D</div>
                <div>
                  <strong>{assessmentsData.assessments.filter(a => a.level === 'D').length}</strong>
                  <span>已清退</span>
                </div>
              </div>
            </div>
          </div>
          {assessmentsData.assessments.map((assess) => {
            const levelColor = assess.level === 'A' ? 'green' : assess.level === 'B' ? 'amber' : assess.level === 'C' ? 'slate' : 'slate';
            const statusBg = assess.status === '优秀' ? '#10B981' : assess.status === '合格' ? '#F59E0B' : assess.status === '整改' ? '#6B7280' : '#EF4444';
            return (
              <article key={assess.id} className="order-row">
                <div>
                  <strong>{assess.supplierName}</strong>
                  <p>{assess.period} 考核周期 · 评审员：{assess.assessor}</p>
                  <span>质量 {assess.qualityScore} · 价格 {assess.priceScore} · 交付 {assess.deliveryScore} · 服务 {assess.serviceScore}</span>
                </div>
                <div className="order-status">
                  <b>综合 {assess.totalScore}分</b>
                  <span className="status-tag" style={{ background: statusBg, color: '#fff' }}>{assess.level}级 · {assess.status}</span>
                  <progress max={100} value={assess.totalScore} />
                  <button className={`action-btn ${levelColor} small`} onClick={() => supplierModal.openModal()}>
                    <Eye size={14} />
                    查看详情
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {channel === 'b2c' && b2cTab === 'benefits' && (
        <>
          <div className="tab-bar" style={{ borderBottom: 'none', marginBottom: 16 }}>
            {['all', '农产品', '出行', '医疗', '教育', '法律', '文娱'].map(cat => (
              <button
                key={cat}
                className={`tab-btn ${benefitCategory === cat ? 'active' : ''}`}
                onClick={() => setBenefitCategory(cat)}
                style={{ borderRadius: 20, padding: '6px 16px' }}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {filteredBenefits.map((benefit) => (
              <article key={benefit.id} className="product-card">
                <div className="product-image-wrapper">
                  <img src={benefit.imageUrl} alt={benefit.name} loading="lazy" />
                  <span className="channel-badge">{benefit.category}</span>
                </div>
                <div className="product-body">
                  <div className="card-headline">
                    <div>
                      <span>{benefit.category}</span>
                      <h3>{benefit.name}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{benefit.description}</p>
                  <div className="price-row">
                    <strong style={{ color: '#10B981' }}>{benefit.value}</strong>
                    <span>库存 {benefit.stock}</span>
                  </div>
                  <div className="tag-row">
                    <span style={{ background: '#FEF3C7', color: '#92400E' }}>
                      {benefit.pointsRequired > 0 ? `${benefit.pointsRequired}积分兑换` : '免费领取'}
                    </span>
                    <span style={{ background: '#ECFDF5', color: '#059669' }}>会员专享</span>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn outline small" onClick={() => navigate('/orders')}>
                      <Eye size={14} />
                      详情
                    </button>
                    <button className="action-btn green small" onClick={() => navigate('/orders')}>
                      {benefit.pointsRequired > 0 ? '积分兑换' : '立即领取'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {supplyTab === 'products' || supplyTab === 'supply' || supplyTab === 'demand' ? null : null}

      {(supplyTab === 'supply' || (channel === 'b2b' && supplyTab === 'supply')) && (
        <div className="stack-list">
          {supplyItems.map((item) => (
            <article key={item.id} className="supply-row">
              <div className="supply-info">
                <div className="supply-badge">供应</div>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.category} · {item.region} · {item.spec} · 供应量 {item.qty}</p>
                  <span>供应商：{item.seller}</span>
                </div>
              </div>
              <div className="supply-actions">
                <strong>{item.price}</strong>
                <button className="action-btn blue" onClick={() => {
                  const matched = data.products
                    .filter((p) => p.category === item.category)
                    .map((p) => {
                      const assessment = assessmentsData.assessments.find(a => a.supplierName.includes(p.seller.slice(0, 4)));
                      return {
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        region: p.origin,
                        spec: p.specification,
                        price: currency(p.wholesalePrice),
                        seller: p.seller,
                        matchScore: Math.floor(Math.random() * 25) + 75,
                        supplierLevel: assessment?.level || 'B',
                        supplierStatus: assessment?.status || '合格',
                      };
                    })
                    .sort((a, b) => b.matchScore - a.matchScore)
                    .slice(0, 3);
                  setMatchResults(matched);
                  matchModal.openModal();
                }}>
                  <Handshake size={14} />
                  供需撮合
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {(channel === 'b2b' && supplyTab === 'demand') && (
        <div className="stack-list">
          {demandItems.map((item) => (
            <article key={item.id} className="supply-row">
              <div className="supply-info">
                <div className="supply-badge demand">采购</div>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.category} · {item.region} · {item.spec} · 需求量 {item.qty}</p>
                  <span>采购方：{item.buyer}</span>
                </div>
              </div>
              <div className="supply-actions">
                <strong>预算 {item.budget}</strong>
                <button className="action-btn green" onClick={() => handleMatchDemand(item)}>
                  <Handshake size={14} />
                  响应需求
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {supplyTab === 'supply' && (
        <div className="stack-list">
          {supplyItems.map((item) => (
            <article key={item.id} className="supply-row">
              <div className="supply-info">
                <div className="supply-badge">供应</div>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.category} · {item.region} · {item.spec} · 供应量 {item.qty}</p>
                  <span>供应商：{item.seller}</span>
                </div>
              </div>
              <div className="supply-actions">
                <strong>{item.price}</strong>
                <button className="action-btn blue" onClick={() => {
                  const matched = data.products
                    .filter((p) => p.category === item.category)
                    .map((p) => ({
                      id: p.id,
                      name: p.name,
                      category: p.category,
                      region: p.origin,
                      spec: p.specification,
                      price: currency(p.wholesalePrice),
                      seller: p.seller,
                      matchScore: Math.floor(Math.random() * 25) + 75,
                    }))
                    .sort((a, b) => b.matchScore - a.matchScore)
                    .slice(0, 3);
                  setMatchResults(matched);
                  matchModal.openModal();
                }}>
                  <Handshake size={14} />
                  供需撮合
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {supplyTab === 'demand' && (
        <div className="stack-list">
          {demandItems.map((item) => (
            <article key={item.id} className="supply-row">
              <div className="supply-info">
                <div className="supply-badge demand">采购</div>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.category} · {item.region} · {item.spec} · 需求量 {item.qty}</p>
                  <span>采购方：{item.buyer}</span>
                </div>
              </div>
              <div className="supply-actions">
                <strong>预算 {item.budget}</strong>
                <button className="action-btn green" onClick={() => handleMatchDemand(item)}>
                  <Handshake size={14} />
                  响应需求
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {shopModal.open && (
        <Modal title="免佣金入驻开店" onClose={shopModal.closeModal}>
          <div className="modal-form">
            <div className="form-group">
              <label>店铺名称</label>
              <input type="text" placeholder="请输入店铺名称" />
            </div>
            <div className="form-group">
              <label>经营品类</label>
              <select>
                <option>粮油</option>
                <option>蔬菜</option>
                <option>水果</option>
                <option>茶叶</option>
                <option>水产</option>
                <option>肉禽</option>
              </select>
            </div>
            <div className="form-group">
              <label>所在地区</label>
              <input type="text" placeholder="省份/城市" />
            </div>
            <div className="form-group">
              <label>企业营业执照号</label>
              <input type="text" placeholder="统一社会信用代码" />
            </div>
            <div className="form-group">
              <label>信用保证金</label>
              <div className="deposit-info">
                <Lock size={16} />
                <span>免佣金入驻，仅需缴纳信用保证金 ¥5,000（可退）</span>
              </div>
            </div>
            <button className="action-btn green full" onClick={() => {
              addContract({
                title: '平台入驻服务协议',
                counterparty: '农品链平台',
                amount: 5000,
                status: '保证金待缴纳',
                blockchainHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 8)}`,
              });
              shopModal.closeModal();
              navigate('/contracts');
            }}>
              确认开店并缴纳保证金
            </button>
          </div>
        </Modal>
      )}

      {orderModal.open && (
        <Modal title="采购下单" onClose={orderModal.closeModal}>
          <div className="modal-form">
            {selectedProduct && (
              <>
                <div className="order-product-info">
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                  <div>
                    <strong>{selectedProduct.name}</strong>
                    <span>{selectedProduct.origin} · {selectedProduct.specification}</span>
                    <b>{currency(selectedProduct.channel === 'b2b' ? selectedProduct.wholesalePrice : selectedProduct.price)}</b>
                  </div>
                </div>
                <div className="form-group">
                  <label>采购数量（最低 {selectedProduct.moq}）</label>
                  <input type="number" value={orderQty} min={selectedProduct.moq} onChange={(e) => setOrderQty(Math.max(selectedProduct.moq, Number(e.target.value)))} />
                </div>
                <div className="order-summary">
                  <div className="summary-row">
                    <span>单价</span>
                    <span>{currency(selectedProduct.channel === 'b2b' ? selectedProduct.wholesalePrice : selectedProduct.price)}</span>
                  </div>
                  <div className="summary-row">
                    <span>数量</span>
                    <span>{orderQty}</span>
                  </div>
                  <div className="summary-row total">
                    <span>合计</span>
                    <strong>{currency(orderQty * (selectedProduct.channel === 'b2b' ? selectedProduct.wholesalePrice : selectedProduct.price))}</strong>
                  </div>
                </div>
              </>
            )}
            {selectedDemand && !selectedProduct && (
              <div className="order-product-info">
                <div>
                  <strong>{selectedDemand.name}</strong>
                  <span>{selectedDemand.category} · {selectedDemand.spec}</span>
                  <b>预算 {selectedDemand.budget}</b>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>支付方式</label>
              <div className="payment-options">
                <div className={`payment-option ${paymentMode === 'escrow' ? 'selected' : ''}`} onClick={() => setPaymentMode('escrow')}>
                  <Wallet size={18} />
                  <div>
                    <strong>货款担保支付</strong>
                    <span>平台担保，验收后放款</span>
                  </div>
                  {paymentMode === 'escrow' && <CheckCircle2 size={18} className="text-green" />}
                </div>
                <div className={`payment-option ${paymentMode === 'deposit' ? 'selected' : ''}`} onClick={() => setPaymentMode('deposit')}>
                  <Lock size={18} />
                  <div>
                    <strong>保证金+分期</strong>
                    <span>先付30%，到货付尾款</span>
                  </div>
                  {paymentMode === 'deposit' && <CheckCircle2 size={18} className="text-green" />}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>关联电子合同</label>
              <div className="contract-link">
                <FileSignature size={16} />
                <span>下单后自动生成采购合同，双方在线签署</span>
              </div>
            </div>
            <button className="action-btn green full" onClick={handleConfirmOrder}>
              确认下单并签署合同
            </button>
          </div>
        </Modal>
      )}

      {matchModal.open && (
        <Modal title="智能撮合结果" onClose={matchModal.closeModal}>
          <div className="modal-form">
            <div className="form-group">
              <label>按品类、地域、规格智能匹配</label>
              <div className="stack-list">
                {matchResults.map((match) => (
                  <article key={match.id} className="supply-row">
                    <div className="supply-info">
                      <div className="supply-badge">匹配度 {match.matchScore}%</div>
                      <div>
                        <strong>{match.name}</strong>
                        <p>{match.category} · {match.region} · {match.spec}</p>
                        <span>供应商：{match.seller}</span>
                      </div>
                    </div>
                    <div className="supply-actions">
                      <strong>{match.price}</strong>
                      <button className="action-btn green" onClick={() => handleSelectMatch(match)}>
                        <Handshake size={14} />
                        选择下单
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <button className="action-btn outline full" onClick={matchModal.closeModal}>
              关闭
            </button>
          </div>
        </Modal>
      )}

      {successModal.open && (
        <Modal title="下单成功" onClose={successModal.closeModal}>
          <div className="modal-form">
            <div className="upload-result success">
              <CheckCircle2 size={48} className="text-green" />
              <h3>交易已发起</h3>
              <p>订单和电子合同已生成，等待对方签署</p>
            </div>
            <div className="summary-row">
              <span>订单编号</span>
              <strong>{lastOrderId}</strong>
            </div>
            <div className="summary-row">
              <span>合同编号</span>
              <strong>{lastContractId}</strong>
            </div>
            <div className="summary-row">
              <span>状态</span>
              <span className="status-tag amber">待乙方签署 · 担保支付中</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="action-btn blue full" onClick={handleGoToOrders}>
                查看订单
              </button>
              <button className="action-btn green full" onClick={handleGoToContracts}>
                查看合同
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function MarketProductCard({ product, onOrder }: { product: Product; onOrder: (p: Product) => void }) {
  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className="channel-badge">{product.channel.toUpperCase()}</span>
      </div>
      <div className="product-body">
        <div className="card-headline">
          <div>
            <span>{product.category}</span>
            <h3>{product.name}</h3>
          </div>
        </div>
        <p>{product.seller}</p>
        <div className="price-row">
          <strong>{currency(product.channel === 'b2b' ? product.wholesalePrice : product.price)}</strong>
          <span>MOQ {product.moq}</span>
        </div>
        <div className="tag-row">
          <span>{product.origin}</span>
          <span>{product.specification}</span>
          <span>库存 {product.stock}</span>
        </div>
        <div className="card-actions">
          <NavLink to={`/trace?code=${encodeURIComponent(product.traceCode)}`} className="action-btn outline small">
            <Eye size={14} />
            溯源
          </NavLink>
          <button className="action-btn green small" onClick={() => onOrder(product)}>
            采购下单
          </button>
        </div>
      </div>
    </article>
  );
}

function ShopPage() {
  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">Shop</p>
          <h2>店铺中心</h2>
        </div>
        <Store size={24} />
      </div>
      <div className="shop-stats">
        <div className="shop-stat-card">
          <PackageCheck size={22} />
          <div>
            <strong>46</strong>
            <span>在售商品</span>
          </div>
        </div>
        <div className="shop-stat-card">
          <Truck size={22} />
          <div>
            <strong>128</strong>
            <span>本月订单</span>
          </div>
        </div>
        <div className="shop-stat-card">
          <CheckCircle2 size={22} />
          <div>
            <strong>98.2%</strong>
            <span>好评率</span>
          </div>
        </div>
        <div className="shop-stat-card">
          <Wallet size={22} />
          <div>
            <strong>¥12.8万</strong>
            <span>本月营收</span>
          </div>
        </div>
      </div>
      <div className="content-grid two">
        <section className="section-panel">
          <h3>商品管理</h3>
          <div className="stack-list">
            {['五常有机稻花香', '冷链蓝莓鲜果', '东北黑豆有机豆'].map((name, i) => (
              <article key={name} className="shop-product-row">
                <span className="pill green">在售</span>
                <div>
                  <strong>{name}</strong>
                  <span>库存 {[4600, 720, 5800][i]} · 销量 {[1820, 586, 3200][i]}</span>
                </div>
                <button className="action-btn outline small">管理</button>
              </article>
            ))}
          </div>
          <button className="action-btn green full" style={{ marginTop: 16 }}>
            <Plus size={16} />
            上架新商品
          </button>
        </section>
        <section className="section-panel">
          <h3>保证金与担保</h3>
          <div className="deposit-panel">
            <div className="deposit-row">
              <Lock size={18} />
              <div>
                <strong>信用保证金</strong>
                <span>已缴纳 ¥5,000</span>
              </div>
              <span className="pill green">正常</span>
            </div>
            <div className="deposit-row">
              <Wallet size={18} />
              <div>
                <strong>担保账户余额</strong>
                <span>¥28,600</span>
              </div>
              <span className="pill blue">冻结中</span>
            </div>
            <div className="deposit-row">
              <ShieldCheck size={18} />
              <div>
                <strong>信用评级</strong>
                <span>A级 · 信用分 96</span>
              </div>
              <span className="pill green">优秀</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function OrdersPage() {
  const { data: apiData, loading, error, refresh } = useApi<{ orders: OrderRow[] }>('/api/orders', { orders: [] });
  const { orders: localOrders } = useAppState();
  const allOrders = [...localOrders, ...apiData.orders];

  const statusActions: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    '担保支付中': { label: '确认放款', icon: <Wallet size={14} />, color: 'green' },
    '待签收': { label: '确认签收', icon: <CheckCircle2 size={14} />, color: 'blue' },
    '已验收': { label: '查看详情', icon: <Eye size={14} />, color: 'slate' },
    '保证金已冻结': { label: '安排发货', icon: <Truck size={14} />, color: 'amber' },
    '合同签署中': { label: '签署合同', icon: <FileSignature size={14} />, color: 'blue' },
    '已结算': { label: '下载凭证', icon: <Download size={14} />, color: 'slate' },
  };

  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">Order Hub</p>
          <h2>订单中心 · {allOrders.length} 笔</h2>
        </div>
        <div className="title-actions">
          <button className="action-btn outline" onClick={refresh}>
            <RefreshCw size={14} />
            刷新
          </button>
          <PackageCheck size={24} />
        </div>
      </div>
      <StatusLine loading={loading} error={error} />
      <div className="stack-list">
        {allOrders.map((order) => {
          const action = statusActions[order.status];
          return (
            <article key={order.id} className="order-row">
              <div>
                <strong>{order.buyer}</strong>
                <p>{order.seller} · {order.logistics}</p>
                <span>{order.createdAt} · {order.id}</span>
              </div>
              <div className="order-status">
                <b>{currency(order.amount)}</b>
                <span className={`status-tag ${action?.color || 'slate'}`}>{order.status}</span>
                <progress max={100} value={order.progress} />
                {action && (
                  <button className={`action-btn ${action.color} small`} onClick={refresh}>
                    {action.icon}
                    {action.label}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ContractsPage() {
  const { data: apiData, loading, error, refresh } = useApi<{ contracts: ContractRow[] }>('/api/contracts', { contracts: [] });
  const { contracts: localContracts } = useAppState();
  const allContracts = [...localContracts, ...apiData.contracts];

  const statusActions: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    '双方已签署': { label: '查看存证', icon: <Eye size={14} />, color: 'slate' },
    '平台见证中': { label: '平台见证', icon: <ShieldCheck size={14} />, color: 'blue' },
    '待乙方签署': { label: '在线签署', icon: <FileSignature size={14} />, color: 'green' },
    '保证金待缴纳': { label: '缴纳保证金', icon: <Lock size={14} />, color: 'amber' },
  };

  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">Contract</p>
          <h2>电子合同 · {allContracts.length} 份</h2>
        </div>
        <div className="title-actions">
          <button className="action-btn green" onClick={() => {
            localContracts.find((c) => c.status === '待乙方签署') || refresh();
          }}>
            <FileSignature size={16} />
            新建合同
          </button>
          <FileSignature size={24} />
        </div>
      </div>
      <StatusLine loading={loading} error={error} />
      <div className="content-grid two">
        {allContracts.map((contract) => {
          const action = statusActions[contract.status];
          return (
            <article className="section-panel nested" key={contract.id}>
              <div className="contract-header">
                <span className={`pill ${action?.color === 'green' ? 'green' : action?.color === 'amber' ? 'amber' : 'blue'}`}>{contract.status}</span>
                {action && (
                  <button className={`action-btn ${action.color} small`} onClick={refresh}>
                    {action.icon}
                    {action.label}
                  </button>
                )}
              </div>
              <h3>{contract.title}</h3>
              <p>{contract.counterparty} · {contract.signedAt} · {contract.id}</p>
              <div className="contract-amount">
                <strong>{currency(contract.amount)}</strong>
              </div>
              <div className="hash-box small">
                <span>存证哈希</span>
                <code>{contract.blockchainHash}</code>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AgtechPage() {
  const { data, loading, error, refresh } = useApi<{ questions: QuestionRow[] }>('/api/agtech/questions', { questions: [] });
  const questionModal = useModal();
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('病虫害');

  const statusActions: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    '专家已答复': { label: '查看回复', icon: <MessageSquare size={14} />, color: 'green' },
    '工单处理中': { label: '催办工单', icon: <Clock size={14} />, color: 'amber' },
    '已归档': { label: '重新提问', icon: <RefreshCw size={14} />, color: 'slate' },
  };

  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">AgriTech</p>
          <h2>农技问答</h2>
        </div>
        <div className="title-actions">
          <button className="action-btn green" onClick={questionModal.openModal}>
            <Plus size={16} />
            提交问题
          </button>
          <div className="sub-nav">
            <NavLink to="/agtech/qa" className={({ isActive }) => `sub-nav-link ${isActive ? 'active' : ''}`}>问答</NavLink>
            <NavLink to="/agtech/pest" className={({ isActive }) => `sub-nav-link ${isActive ? 'active' : ''}`}>病虫害识别</NavLink>
            <NavLink to="/agtech/weather" className={({ isActive }) => `sub-nav-link ${isActive ? 'active' : ''}`}>气象预警</NavLink>
          </div>
        </div>
      </div>
      <StatusLine loading={loading} error={error} />
      <div className="stack-list">
        {data.questions.map((question) => {
          const action = statusActions[question.status];
          return (
            <article key={question.id} className="qa-row">
              <div className="qa-icon">
                <Sprout size={20} />
              </div>
              <div>
                <strong>{question.title}</strong>
                <p>{question.category} · {question.expert}</p>
                <span>{question.status} · {question.answers} 条回复 · 平均响应 {question.responseTime}</span>
              </div>
              {action && (
                <button className={`action-btn ${action.color} small`} onClick={refresh}>
                  {action.icon}
                  {action.label}
                </button>
              )}
            </article>
          );
        })}
      </div>

      {questionModal.open && (
        <Modal title="提交农技问题" onClose={questionModal.closeModal}>
          <div className="modal-form">
            <div className="form-group">
              <label>问题分类</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                <option>病虫害</option>
                <option>种植管理</option>
                <option>采后保鲜</option>
                <option>土壤肥料</option>
                <option>气象防灾</option>
              </select>
            </div>
            <div className="form-group">
              <label>问题描述</label>
              <textarea rows={4} placeholder="详细描述您遇到的农业技术问题..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
            </div>
            <div className="form-group">
              <label>上传图片（可选）</label>
              <div className="upload-area">
                <Bug size={24} />
                <span>点击或拖拽上传病虫害/作物照片</span>
              </div>
            </div>
            <button className="action-btn green full" onClick={questionModal.closeModal}>
              提交工单
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function PestPage() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">Pest ID</p>
          <h2>病虫害图像识别</h2>
        </div>
        <Bug size={24} />
      </div>
      <div className="content-grid two">
        <section className="section-panel">
          <h3>上传图片</h3>
          <div
            className={`upload-area large ${uploaded ? 'uploaded' : ''}`}
            onClick={() => setUploaded(true)}
          >
            {uploaded ? (
              <div className="upload-result">
                <CheckCircle2 size={32} />
                <span>图片已上传，正在识别...</span>
              </div>
            ) : (
              <>
                <Bug size={32} />
                <span>点击或拖拽上传病虫害/作物照片</span>
                <small>支持 JPG、PNG 格式，最大 10MB</small>
              </>
            )}
          </div>
        </section>
        <section className="section-panel">
          <h3>识别结果</h3>
          {uploaded ? (
            <div className="diagnosis-result">
              <div className="diagnosis-header">
                <span className="pill amber">中风险</span>
                <strong>番茄晚疫病</strong>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>病害名称</dt>
                  <dd>番茄晚疫病</dd>
                </div>
                <div>
                  <dt>置信度</dt>
                  <dd>94.2%</dd>
                </div>
                <div>
                  <dt>严重程度</dt>
                  <dd>中度</dd>
                </div>
                <div>
                  <dt>建议措施</dt>
                  <dd>及时清除病叶</dd>
                </div>
              </dl>
              <div className="diagnosis-advice">
                <h4>防治建议</h4>
                <ol>
                  <li>及时清除病叶、病果，减少侵染源</li>
                  <li>喷施 72% 霜脲·锰锌可湿性粉剂 600 倍液</li>
                  <li>降低田间湿度，改善通风条件</li>
                  <li>7 天后复检，如无改善提交专家工单</li>
                </ol>
              </div>
              <NavLink to="/agtech/qa" className="action-btn green full" style={{ marginTop: 12 }}>
                <MessageSquare size={14} />
                转交专家进一步诊断
              </NavLink>
            </div>
          ) : (
            <div className="empty-state">
              <Bug size={32} />
              <p>请先上传图片进行识别</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function WeatherPage() {
  const { data, loading, error } = useApi<{ alerts: WeatherAlert[] }>('/api/weather', { alerts: [] });

  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">Weather</p>
          <h2>气象预警</h2>
        </div>
        <CloudLightning size={24} />
      </div>
      <StatusLine loading={loading} error={error} />
      <div className="content-grid three">
        {data.alerts.map((alert) => (
          <article key={alert.id} className="weather-card">
            <AlertTriangle size={22} />
            <span>{alert.level}</span>
            <h3>{alert.region} · {alert.alertType}</h3>
            <p>{alert.suggestion}</p>
            <time>{alert.startsAt}</time>
            <button className="action-btn blue small" style={{ marginTop: 8 }}>
              <CloudLightning size={14} />
              推送至关联农户
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function RegulatoryPage() {
  const { data, loading, error, refresh } = useApi<{
    trends: DashboardData['qualityTrend'];
    reports: Array<{ id: string; title: string; risk: string; sampleCount: number; passRate: number }>;
  }>('/api/regulatory', { trends: [], reports: [] });

  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">Regulatory</p>
          <h2>监管中心</h2>
        </div>
        <div className="title-actions">
          <button className="action-btn blue" onClick={refresh}>
            <RefreshCw size={14} />
            同步监管数据
          </button>
          <ShieldCheck size={24} />
        </div>
      </div>
      <StatusLine loading={loading} error={error} />
      <div className="content-grid two">
        <section className="section-panel nested">
          <div className="section-title">
            <div>
              <p className="eyebrow">Quality Trend</p>
              <h3>抽检趋势</h3>
            </div>
            <BarChart3 size={20} />
          </div>
          <div className="trend-chart large">
            {data.trends.map((item) => (
              <div key={item.month} className="trend-item">
                <span style={{ height: `${Math.max(18, (item.passRate - 96) * 34)}px` }} />
                <small>{item.month}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="section-panel nested">
          <div className="section-title">
            <div>
              <p className="eyebrow">Analysis Report</p>
              <h3>分析报告</h3>
            </div>
            <Download size={20} />
          </div>
          <div className="stack-list">
            {data.reports.map((report) => (
              <article className="report-row" key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <span>样本 {report.sampleCount} · 合格率 {report.passRate}%</span>
                </div>
                <div className="report-actions">
                  <span className={`pill ${report.risk === '低' ? 'green' : report.risk === '中低' ? 'amber' : 'red'}`}>
                    风险：{report.risk}
                  </span>
                  <button className="action-btn outline small" onClick={refresh}>
                    <Eye size={14} />
                    复查
                  </button>
                </div>
              </article>
            ))}
          </div>
          <button className="action-btn blue full" style={{ marginTop: 12 }} onClick={refresh}>
            <Gavel size={14} />
            发起专项抽检
          </button>
        </section>
      </div>
      <div className="regulatory-footer">
        <div className="data-source-card">
          <ShieldCheck size={18} />
          <div>
            <strong>农业农村部监管平台</strong>
            <span>已对接 · 上次同步 2026-06-18 08:00</span>
          </div>
          <button className="action-btn outline small">同步</button>
        </div>
        <div className="data-source-card">
          <BarChart3 size={18} />
          <div>
            <strong>市场监管总局抽检数据库</strong>
            <span>已对接 · 上次同步 2026-06-18 07:30</span>
          </div>
          <button className="action-btn outline small">同步</button>
        </div>
      </div>
    </section>
  );
}

function ProfilePage() {
  return (
    <section className="page-space">
      <div className="section-title floating">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>个人中心</h2>
        </div>
        <UserRoundCheck size={24} />
      </div>
      <section className="section-panel nested profile-panel">
        <div className="avatar">监</div>
        <div>
          <h3>监管专员</h3>
          <p>农业农村数据监管账号 · 已完成双因子认证</p>
          <div className="tag-row">
            <span>实名已认证</span>
            <span>信用分 96</span>
            <span>消息 12</span>
          </div>
        </div>
      </section>
      <div className="content-grid two">
        <section className="section-panel">
          <h3>账户设置</h3>
          <div className="stack-list">
            {[
              { label: '手机号', value: '138****8913' },
              { label: '邮箱', value: 'regulator@agri.gov.cn' },
              { label: '所属机构', value: '农业农村部质量监管司' },
              { label: '权限等级', value: '高级监管' },
            ].map((item) => (
              <div key={item.label} className="setting-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="section-panel">
          <h3>近期操作</h3>
          <div className="stack-list">
            {[
              { action: '发起专项抽检', time: '2026-06-18 09:30', status: '进行中' },
              { action: '下载质量趋势报告', time: '2026-06-17 14:20', status: '已完成' },
              { action: '同步监管数据库', time: '2026-06-17 08:00', status: '已完成' },
            ].map((item) => (
              <div key={item.action} className="setting-row">
                <div>
                  <strong>{item.action}</strong>
                  <span>{item.time}</span>
                </div>
                <span className="pill small">{item.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusLine({ loading, error }: { loading: boolean; error: string }) {
  if (loading) {
    return <div className="status-line">数据加载中</div>;
  }
  if (error) {
    return <div className="status-line error">接口异常：{error}</div>;
  }
  return null;
}

export default App;
