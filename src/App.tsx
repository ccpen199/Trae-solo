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
} from 'lucide-react';
import type { Metric, Product, TimelineItem, TraceBatch } from '../shared/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const DEFAULT_TRACE_CODE = 'TRC-2026-RICE-89138';

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

const CACHE_TTL = 300_000;

function readCache<T>(path: string): T | null {
  try {
    const raw = sessionStorage.getItem(`agcache:${path}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return data as T;
    return data as T;
  } catch {
    return null;
  }
}

function writeCache(path: string, data: unknown) {
  try {
    sessionStorage.setItem(`agcache:${path}`, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

function useCachedApi<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(() => {
    const cached = readCache<T>(path);
    return cached ?? fallback;
  });
  const [loading, setLoading] = useState(() => readCache<T>(path) === null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = readCache<T>(path);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
    }

    let active = true;
    setLoading(true);
    apiGet<T>(path)
      .then((payload) => {
        if (active) {
          setData(payload);
          setError('');
          writeCache(path, payload);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          if (cached !== null) {
            setData(cached);
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
  updateOrder: (id: string, patch: Partial<OrderRow>) => void;
  updateContract: (id: string, patch: Partial<ContractRow>) => void;
  setMatchResults: (results: MatchResult[]) => void;
}

const AppContext = React.createContext<AppState | null>(null);

function useAppState() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

function loadLocal<T>(key: string): T[] {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocal(key: string, data: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

function App() {
  const [orders, setOrders] = useState<OrderRow[]>(() => loadLocal('ag_orders'));
  const [contracts, setContracts] = useState<ContractRow[]>(() => loadLocal('ag_contracts'));
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  useEffect(() => { saveLocal('ag_orders', orders); }, [orders]);
  useEffect(() => { saveLocal('ag_contracts', contracts); }, [contracts]);

  const addOrder = useCallback((order: Omit<OrderRow, 'id' | 'createdAt'>): OrderRow => {
    const newOrder: OrderRow = {
      ...order,
      id: `od-${Date.now()}`,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setOrders((prev) => {
      const next = [newOrder, ...prev];
      saveLocal('ag_orders', next);
      return next;
    });
    return newOrder;
  }, []);

  const addContract = useCallback((contract: Omit<ContractRow, 'id' | 'signedAt'>): ContractRow => {
    const newContract: ContractRow = {
      ...contract,
      id: `ct-${Date.now()}`,
      signedAt: new Date().toLocaleDateString('zh-CN'),
    };
    setContracts((prev) => {
      const next = [newContract, ...prev];
      saveLocal('ag_contracts', next);
      return next;
    });
    return newContract;
  }, []);

  const updateOrder = useCallback((id: string, patch: Partial<OrderRow>) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, ...patch } : o));
      saveLocal('ag_orders', next);
      return next;
    });
  }, []);

  const updateContract = useCallback((id: string, patch: Partial<ContractRow>) => {
    setContracts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      saveLocal('ag_contracts', next);
      return next;
    });
  }, []);

  const appState: AppState = {
    orders,
    contracts,
    matchResults,
    addOrder,
    addContract,
    updateOrder,
    updateContract,
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
    { to: '/shop', label: '店铺', icon: Store },
    { to: '/orders', label: '订单', icon: PackageCheck },
    { to: '/contracts', label: '合同', icon: FileSignature },
    { to: '/agtech/qa', label: '农技', icon: Sprout },
    { to: '/regulatory', label: '监管', icon: ShieldCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <Leaf size={24} />
        </div>
        <div>
          <strong>农品链</strong>
          <span>可信溯源交易平台</span>
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
        <p className="eyebrow">生产 · 加工 · 物流 · 销售</p>
        <h1>农产品全链条可信溯源与交易协同平台</h1>
      </div>
      <div className="topbar-actions">
        <NavLink to="/trace" className="icon-button" title="溯源查询">
          <Search size={18} />
        </NavLink>
        <NavLink to="/profile" className="profile-chip">
          <UserRoundCheck size={18} />
          <span>监管专员</span>
        </NavLink>
      </div>
    </header>
  );
}

function Dashboard() {
  const { data, loading, error } = useCachedApi<DashboardData>('/api/dashboard', {
    metrics: [],
    qualityTrend: [],
    alerts: [],
  });
  const { data: productsData } = useCachedApi<{ products: Product[] }>('/api/products', { products: [] });
  const navigate = useNavigate();
  const [traceCode, setTraceCode] = useState(DEFAULT_TRACE_CODE);
  const hasTrendData = data.qualityTrend.length > 0;
  const latestTrend = hasTrendData ? data.qualityTrend[data.qualityTrend.length - 1] : null;

  return (
    <section className="page-space">
      <div className="dashboard-grid">
        <section className="command-panel">
          <div className="panel-copy">
            <p className="eyebrow">今日监管概览</p>
            <h2>区域质量、链上批次与订单协同集中监控</h2>
            <p>已接入生产档案、检测报告、冷链温湿度和电子合同数据，当前批次可从扫码查询直达链上存证。</p>
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
          <div className="media-strip" aria-label="农产品流通场景">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
              alt="农田"
            />
            <img
              src="https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=1200&q=80"
              alt="农产品分拣"
            />
          </div>
        </section>

        <section className="quality-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">质量趋势</p>
              <h3>{latestTrend ? `${latestTrend.passRate}%` : '--'}</h3>
            </div>
            <BarChart3 size={24} />
          </div>
          <div className="trend-chart">
            {hasTrendData ? (
              data.qualityTrend.map((item) => (
                <div key={item.month} className="trend-item">
                  <span style={{ height: `${Math.max(16, (item.passRate - 96) * 28)}px` }} />
                  <small>{item.month}</small>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <BarChart3 size={32} />
                <p>暂无质量趋势数据</p>
              </div>
            )}
          </div>
          <div className="risk-row">
            <span>抽检样本 {latestTrend?.sampling ?? '--'}</span>
            <strong>风险事件 {latestTrend?.risk ?? '--'}</strong>
          </div>
        </section>
      </div>

      {loading && <StatusLine loading={loading} error={error} />}
      {error && <StatusLine loading={false} error={error} />}

      <div className="metrics-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="content-grid two">
        <section className="section-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">气象与农事</p>
              <h2>主动预警</h2>
            </div>
            <CloudSun size={22} />
          </div>
          <div className="stack-list">
            {data.alerts.length > 0 ? (
              data.alerts.map((alert) => (
                <article className="alert-row" key={alert.id}>
                  <div className={`alert-level ${alert.level}`}>{alert.level}</div>
                  <div>
                    <strong>{alert.region} · {alert.alertType}</strong>
                    <p>{alert.suggestion}</p>
                    <span>{alert.startsAt}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <CloudSun size={32} />
                <p>暂无预警信息</p>
              </div>
            )}
          </div>
          <NavLink to="/agtech/weather" className="view-all-link">
            查看全部预警 <ArrowRight size={16} />
          </NavLink>
        </section>

        <section className="section-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">交易市场</p>
              <h2>热销农品</h2>
            </div>
            <Store size={22} />
          </div>
          <div className="product-mini-list">
            {productsData.products.length > 0 ? (
              productsData.products.slice(0, 4).map((product) => (
                <article key={product.id} className="mini-product">
                  <img src={product.imageUrl} alt={product.name} />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.origin} · {product.specification}</span>
                  </div>
                  <b>{currency(product.price)}</b>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <Store size={32} />
                <p>暂无商品数据</p>
              </div>
            )}
          </div>
          <NavLink to="/market/b2b" className="view-all-link">
            进入交易市场 <ArrowRight size={16} />
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

function TracePage() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || DEFAULT_TRACE_CODE;
  const [code, setCode] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(initialCode);
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

  const fullChainStages = ['种植建档', '农事操作', '质量检测', '加工包装', '冷链物流', '到货入库', '入市销售', '监管复查'];
  const completedStages = [...new Set(data.timeline.map((t) => t.stage))];

  return (
    <section className="page-space">
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

      {data.batch.productName && (
        <div className="trace-layout">
          <section className="section-panel trace-summary">
            <div className="batch-badge">{data.batch.qualityResult}</div>
            <h2>{data.batch.productName}</h2>
            <p>{data.batch.producer}</p>
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
            <div className="chain-progress">
              <p className="eyebrow">全链路进度 · {completedStages.length}/{fullChainStages.length} 环节</p>
              <div className="chain-bar">
                {fullChainStages.map((stage, i) => {
                  const reached = completedStages.includes(stage);
                  const labelMap: Record<string, string> = {
                    '种植建档': '种植',
                    '农事操作': '农事',
                    '质量检测': '检测',
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
            <div className="hash-box">
              <span>链上哈希</span>
              <code>{data.batch.blockchainHash}</code>
            </div>
          </section>

          <section className="section-panel">
            <div className="section-title">
              <div>
                <p className="eyebrow">Full Chain</p>
                <h2>全链路时间线 · {data.timeline.length} 条记录</h2>
              </div>
              <div className="title-actions">
                <button className="action-btn outline small" onClick={refresh}>
                  <RefreshCw size={14} />
                  刷新
                </button>
                <Truck size={23} />
              </div>
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
        </div>
      )}
    </section>
  );
}

function MarketPage({ channel }: { channel: 'b2b' | 'b2c' }) {
  const { data, loading, error } = useApi<{ products: Product[] }>(`/api/products?channel=${channel}`, { products: [] });
  const { addOrder, addContract, matchResults, setMatchResults } = useAppState();
  const navigate = useNavigate();
  const shopModal = useModal();
  const orderModal = useModal();
  const matchModal = useModal();
  const successModal = useModal();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [paymentMode, setPaymentMode] = useState<'escrow' | 'deposit'>('escrow');
  const [supplyTab, setSupplyTab] = useState<'products' | 'supply' | 'demand'>('products');
  const [selectedDemand, setSelectedDemand] = useState<typeof demandItems[0] | null>(null);
  const [lastOrderId, setLastOrderId] = useState('');
  const [lastContractId, setLastContractId] = useState('');

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

  function handleOrder(product: Product) {
    setSelectedProduct(product);
    setOrderQty(product.moq);
    setPaymentMode('escrow');
    orderModal.openModal();
  }

  function handleMatchDemand(demand: typeof demandItems[0]) {
    setSelectedDemand(demand);
    const keyword = demand.name.replace(/采购|长期求购|紧急采购|求购/g, '');
    const matched = data.products
      .map((p) => {
        let score = 50;
        if (p.category === demand.category) score += 30;
        if (p.origin.includes(demand.region) || demand.region === '全国' || demand.region === '东北' && p.origin.includes('黑龙江')) score += 15;
        if (p.name.includes(keyword) || keyword.includes(p.category)) score += 10;
        if (p.specification === demand.spec) score += 5;
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          region: p.origin,
          spec: p.specification,
          price: currency(p.channel === 'b2b' ? p.wholesalePrice : p.price),
          seller: p.seller,
          matchScore: Math.min(score, 99),
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
    const amount = orderQty * unitPrice;
    const orderStatus = paymentMode === 'escrow' ? '担保支付中' : '保证金已冻结';
    const progress = paymentMode === 'escrow' ? 30 : 20;

    const newOrder = addOrder({
      buyer: '当前采购商',
      seller: selectedProduct.seller,
      amount,
      status: orderStatus,
      progress,
      logistics: '待安排发货',
    });

    const newContract = addContract({
      title: `${selectedProduct.name} 采购合同`,
      counterparty: selectedProduct.seller,
      amount,
      status: '待乙方签署',
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

      {channel === 'b2b' && (
        <div className="tab-bar">
          <button className={`tab-btn ${supplyTab === 'products' ? 'active' : ''}`} onClick={() => setSupplyTab('products')}>商品市场</button>
          <button className={`tab-btn ${supplyTab === 'supply' ? 'active' : ''}`} onClick={() => setSupplyTab('supply')}>供应大厅</button>
          <button className={`tab-btn ${supplyTab === 'demand' ? 'active' : ''}`} onClick={() => setSupplyTab('demand')}>采购需求</button>
        </div>
      )}

      {channel === 'b2c' && (
        <div className="tab-bar">
          <button className={`tab-btn active`}>精选好物</button>
        </div>
      )}

      <StatusLine loading={loading} error={error} />

      {(supplyTab === 'products' || channel === 'b2c') && (
        <div className="product-grid">
          {data.products.map((product) => (
            <MarketProductCard key={product.id} product={product} onOrder={handleOrder} />
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
                    .map((p) => {
                      let score = 50;
                      if (p.category === item.category) score += 30;
                      if (p.origin.includes(item.region)) score += 15;
                      if (p.specification === item.spec) score += 5;
                      return {
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        region: p.origin,
                        spec: p.specification,
                        price: currency(p.channel === 'b2b' ? p.wholesalePrice : p.price),
                        seller: p.seller,
                        matchScore: Math.min(score, 99),
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
              {matchResults.length > 0 ? (
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
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  <Handshake size={32} />
                  <p>正在匹配中，请稍候重试...</p>
                </div>
              )}
            </div>
            <button className="action-btn outline full" onClick={(e) => { e.stopPropagation(); matchModal.closeModal(); }}>
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
  const { orders: localOrders, updateOrder } = useAppState();
  const allOrders = [...localOrders, ...apiData.orders];

  function handleAction(order: OrderRow) {
    switch (order.status) {
      case '担保支付中':
        updateOrder(order.id, { status: '待签收', progress: 60, logistics: '已发货运输中' });
        break;
      case '保证金已冻结':
        updateOrder(order.id, { status: '合同签署中', progress: 30, logistics: '待安排发货' });
        break;
      case '合同签署中':
        updateOrder(order.id, { status: '担保支付中', progress: 40, logistics: '待安排发货' });
        break;
      case '待签收':
        updateOrder(order.id, { status: '已验收', progress: 90, logistics: '已签收入库' });
        break;
      case '已验收':
        updateOrder(order.id, { status: '已结算', progress: 100, logistics: '交易完成' });
        break;
      default:
        refresh();
    }
  }

  const statusActions: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    '担保支付中': { label: '确认放款', icon: <Wallet size={14} />, color: 'green' },
    '待签收': { label: '确认签收', icon: <CheckCircle2 size={14} />, color: 'blue' },
    '已验收': { label: '确认结算', icon: <CheckCircle2 size={14} />, color: 'green' },
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
                  <button className={`action-btn ${action.color} small`} onClick={() => handleAction(order)}>
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
  const { contracts: localContracts, updateContract } = useAppState();
  const allContracts = [...localContracts, ...apiData.contracts];

  function handleAction(contract: ContractRow) {
    switch (contract.status) {
      case '待乙方签署':
        updateContract(contract.id, { status: '双方已签署' });
        break;
      case '保证金待缴纳':
        updateContract(contract.id, { status: '平台见证中' });
        break;
      case '平台见证中':
        updateContract(contract.id, { status: '双方已签署' });
        break;
      default:
        refresh();
    }
  }

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
          <button className="action-btn green" onClick={refresh}>
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
                  <button className={`action-btn ${action.color} small`} onClick={() => handleAction(contract)}>
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
