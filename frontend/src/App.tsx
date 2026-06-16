import { useEffect, useMemo, useState } from 'react';

type Brand = {
  id: number;
  code: string;
  name: string;
  base_price: number;
  per_kg_price: number;
  avg_delivery_hours: number;
  coverage_score: number;
  rating: number;
  api_status: string;
  estimated_price?: number;
};

type Order = {
  id: number;
  order_no: string;
  tracking_no: string;
  brand_name: string;
  courier_name?: string;
  sender_name: string;
  receiver_name: string;
  goods_name: string;
  status: string;
  total_amount: number;
  receiver_address: string;
};

type Overview = {
  summary: Record<string, number>;
  brandStats: Array<Brand & { order_count: number; revenue: number }>;
  recentOrders: Order[];
  alerts: Order[];
};

const apiBase = '/api';

const statusText: Record<string, string> = {
  created: '已创建',
  picked: '已揽收',
  in_transit: '运输中',
  arrived_branch: '到达网点',
  out_for_delivery: '派送中',
  delivered: '已送达',
  signed: '已签收',
  exception: '异常件',
  returned: '已退回'
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

export default function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prices, setPrices] = useState<Brand[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [brandKeyword, setBrandKeyword] = useState('');
  const [weight, setWeight] = useState(3);
  const [health, setHealth] = useState('checking');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [healthData, overviewData, brandData, orderData, priceData] = await Promise.all([
        getJson<{ status: string }>('/health'),
        getJson<Overview>('/dashboard/overview'),
        getJson<{ items: Brand[] }>(`/brands?keyword=${encodeURIComponent(brandKeyword)}`),
        getJson<{ items: Order[] }>(`/orders?keyword=${encodeURIComponent(keyword)}&status=${encodeURIComponent(status)}`),
        getJson<{ items: Brand[] }>(`/price/compare?weight=${weight}`)
      ]);
      setHealth(healthData.status);
      setOverview(overviewData);
      setBrands(brandData.items);
      setOrders(orderData.items);
      setPrices(priceData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '接口请求失败');
      setHealth('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summaryCards = useMemo(() => {
    const summary = overview?.summary || {};
    return [
      ['总运单', summary.total_orders || 0],
      ['活跃运单', summary.active_orders || 0],
      ['异常件', summary.exception_orders || 0],
      ['在线快递员', summary.online_couriers || 0],
      ['开放品牌', summary.active_brands || 0],
      ['待处理投诉', summary.pending_complaints || 0]
    ] as Array<[string, number]>;
  }, [overview]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Express Logistics Open Platform</p>
          <h1>快递全链路协同开放平台</h1>
        </div>
        <nav>
          <a href="#search">搜索筛选</a>
          <a href="#admin">管理后台</a>
          <a href="#openapi">开放接口</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <h2>订单、快递员、网点、价格与投诉统一运营</h2>
          <p>面向电商 ERP、品牌方和城市网点的本地演示系统，已接入 SQLite 示例数据和 Express API。</p>
          <div className="actions">
            <a className="primary" href="#search">进入搜索筛选</a>
            <a className="secondary" href="#admin">查看管理后台</a>
          </div>
        </div>
        <div className="status-panel">
          <span>后端健康状态</span>
          <strong className={health === 'ok' ? 'ok' : 'bad'}>{health}</strong>
          <small>{error || 'http://127.0.0.1:59219/api/health'}</small>
        </div>
      </section>

      <section className="metrics" id="admin">
        {summaryCards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value.toLocaleString()}</strong>
          </article>
        ))}
      </section>

      <section className="grid">
        <article className="panel large" id="search">
          <div className="panel-title">
            <div>
              <h3>搜索筛选中心</h3>
              <p>按运单、收寄件人、商品、状态筛选快递订单。</p>
            </div>
            <button onClick={load}>刷新</button>
          </div>
          <div className="filters">
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索运单号、收件人、商品" />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">全部状态</option>
              {Object.entries(statusText).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <button onClick={load}>查询结果</button>
          </div>
          <div className="table">
            {orders.slice(0, 12).map((order) => (
              <div className="row" key={order.id}>
                <div>
                  <strong>{order.tracking_no}</strong>
                  <span>{order.sender_name} - {order.receiver_name}</span>
                </div>
                <span>{order.brand_name}</span>
                <span>{statusText[order.status] || order.status}</span>
                <b>¥{Number(order.total_amount || 0).toFixed(2)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <h3>后台管理</h3>
              <p>运力、异常、投诉和品牌运营看板。</p>
            </div>
          </div>
          <div className="alert-list">
            {(overview?.alerts || []).slice(0, 6).map((item) => (
              <div key={item.id}>
                <strong>{item.tracking_no}</strong>
                <span>{item.brand_name} · {item.receiver_address}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panel-title">
            <div>
              <h3>发现分类与品牌筛选</h3>
              <p>按快递品牌、覆盖评分和开放状态分类。</p>
            </div>
          </div>
          <div className="filters">
            <input value={brandKeyword} onChange={(event) => setBrandKeyword(event.target.value)} placeholder="搜索顺丰、中通、EMS" />
            <button onClick={load}>筛选品牌</button>
          </div>
          <div className="cards">
            {brands.slice(0, 8).map((brand) => (
              <div className="brand" key={brand.id}>
                <strong>{brand.name}</strong>
                <span>{brand.code} · 覆盖 {brand.coverage_score}</span>
                <small>基础价 ¥{brand.base_price} · {brand.avg_delivery_hours}h</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel" id="openapi">
          <div className="panel-title">
            <div>
              <h3>价格比较 API</h3>
              <p>输入重量后对多品牌报价排序。</p>
            </div>
          </div>
          <div className="filters">
            <input type="number" min="1" value={weight} onChange={(event) => setWeight(Number(event.target.value || 1))} />
            <button onClick={load}>计算报价</button>
          </div>
          <div className="price-list">
            {prices.slice(0, 7).map((price) => (
              <div key={price.id}>
                <span>{price.name}</span>
                <strong>¥{Number(price.estimated_price || 0).toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
