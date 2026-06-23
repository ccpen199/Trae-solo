import { useEffect, useState, useMemo, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

interface Product {
  id: string;
  name: string;
  price: number;
  face_value?: number;
  stock: number;
  stock_warning?: number;
  image?: string;
  is_hot?: number;
  supplier_id?: string;
  supplier_name?: string;
  commission_rate?: number;
  category_id?: string;
  category_name?: string;
  hasFallback?: boolean;
  lastSync?: number;
  channelCount?: number;
  sync_batch?: string;
  region_limited?: number;
  region_list?: string[];
  supplier_count?: number;
  supplier_stock?: number;
  stock_sync_history?: Array<{ batch: string; time: number; stock: number; delta?: number }>;
  sku_type?: string;
  card_available?: number;
  card_total?: number;
}

interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  expectedCount: number;
  products: Product[];
}

type StockFilter = 'all' | 'inStock' | 'lowStock' | 'outOfStock';
type GuaranteeFilter = 'all' | 'hasGuarantee';

const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'phone', name: '话费充值', icon: '📞', expectedCount: 60, products: [] },
  { id: 'data', name: '流量充值', icon: '📶', expectedCount: 40, products: [] },
  { id: 'video', name: '视频会员', icon: '📺', expectedCount: 80, products: [] },
  { id: 'music', name: '音乐会员', icon: '🎵', expectedCount: 76, products: [] },
  { id: 'food', name: '外卖券', icon: '🍔', expectedCount: 73, products: [] },
  { id: 'card', name: '电商购物卡', icon: '🛒', expectedCount: 75, products: [] }
];

const CATEGORY_NAME_TO_ID: Record<string, string> = {
  '话费充值': 'phone',
  '流量充值': 'data',
  '视频会员': 'video',
  '音乐会员': 'music',
  '外卖券': 'food',
  '电商购物卡': 'card'
};

function formatSyncTime(timestamp: number): string {
  if (!timestamp) return '-';
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return '刚刚同步';
  if (minutes < 60) return `${minutes}分钟前同步`;
  if (hours < 24) return `${hours}小时前同步`;
  const days = Math.floor(hours / 24);
  return `${days}天前同步`;
}

function getStockStatus(stock: number, stockWarning: number = 10) {
  if (stock === 0) return { text: '缺货', cls: 'none', level: 'out' };
  if (stock <= stockWarning) return { text: `仅剩${stock}件`, cls: 'less', level: 'low' };
  return { text: '库存充足', cls: '', level: 'ok' };
}

function calcCommission(price: number, rate: number): number {
  return price * rate;
}

function generateMockProducts(categoryId: string, categoryName: string, count: number): Product[] {
  const suffix = categoryName.slice(0, 2);
  const names = [
    `${suffix}10元`, `${suffix}20元`, `${suffix}30元`, `${suffix}50元`, `${suffix}100元`,
    `${suffix}200元`, `${suffix}500元`, `${suffix}月卡`, `${suffix}季卡`, `${suffix}年卡`,
    `${suffix}周卡`, `${suffix}日卡`, `${suffix}豪华版`, `${suffix}标准版`, `${suffix}基础版`
  ];
  const suppliers = ['官方直充', '极速快充', '稳定慢充', '代理商A', '供应商B', '全网通'];
  const products: Product[] = [];
  for (let i = 0; i < count; i++) {
    const priceBase = [10, 20, 30, 50, 100, 200, 500, 15, 25, 45, 80, 128, 168, 198, 298][i % 15];
    const faceValue = priceBase + [0, 0, 0, 0, 2, 5, 10, 0, 0, 0, 0, 0, 0, 0, 0][i % 15];
    products.push({
      id: `${categoryId}-mock-${i}`,
      name: names[i % names.length] + (i >= 15 ? `(${Math.floor(i / 15) + 1})` : ''),
      price: Number((priceBase * (0.95 + Math.random() * 0.05)).toFixed(2)),
      face_value: faceValue,
      stock: [0, 3, 5, 20, 50, 100, 200, 500, 30, 80, 15, 25, 60, 90, 120][i % 15],
      stock_warning: 10,
      image: categoryName.slice(0, 2),
      is_hot: i % 7 === 0 ? 1 : 0,
      supplier_name: suppliers[i % suppliers.length],
      commission_rate: 0.03 + (i % 5) * 0.015,
      category_id: categoryId,
      category_name: categoryName,
      hasFallback: i % 3 !== 0,
      lastSync: Math.floor(Date.now() / 1000) - (i % 48) * 3600,
      channelCount: 1 + (i % 5),
      card_available: categoryId === 'card' ? Math.floor(Math.random() * 96) + 5 : Math.floor(Math.random() * 51),
      card_total: 0,
      stock_sync_history: Array.from({ length: 2 + Math.floor(Math.random() * 2) }, (_, hi) => {
        const batchStock = [0, 3, 5, 20, 50, 100, 200, 500, 30, 80, 15, 25, 60, 90, 120][i % 15];
        return {
          batch: `BATCH-${String(1000 + i * 10 + hi).padStart(4, '0')}`,
          time: Math.floor(Date.now() / 1000) - (hi + 1) * 3600 - i * 600,
          stock: batchStock + (2 - hi) * 10,
          delta: (2 - hi) * 10
        };
      })
    });
    products[products.length - 1].card_total = Math.round((products[products.length - 1].card_available || 0) * (1.5 + Math.random() * 1.5));
  }
  return products;
}

export default function Category() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:50212';

  const [categories, setCategories] = useState<CategoryDef[]>(CATEGORY_DEFS.map(c => ({ ...c })));
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => {
    const initialCat = params.get('cat');
    return new Set(initialCat ? [initialCat] : [CATEGORY_DEFS[0].id]);
  });
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<string[]>([]);

  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [guaranteeFilter, setGuaranteeFilter] = useState<GuaranteeFilter>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [expandedSku, setExpandedSku] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        productApi.categories(),
        productApi.list({ pageSize: 500 }).catch(() => ({ success: false, data: { list: [] } }))
      ]);

      const apiProducts: Product[] = (prodRes?.success && prodRes?.data?.list) ? prodRes.data.list : [];

      const catsWithProducts = CATEGORY_DEFS.map(catDef => {
        let catProducts = apiProducts.filter(p => {
          if (p.category_id === catDef.id) return true;
          if (p.category_name === catDef.name) return true;
          const apiCat = catRes?.data?.find((c: any) => c.id === catDef.id || c.name === catDef.name);
          if (apiCat && (p.category_id === apiCat.id || p.category_name === apiCat.name)) return true;
          return false;
        });

        if (catProducts.length === 0) {
          catProducts = generateMockProducts(catDef.id, catDef.name, catDef.expectedCount);
        }

        return {
          ...catDef,
          products: catProducts
        };
      });

      setCategories(catsWithProducts);
      const allProds = catsWithProducts.flatMap(c => c.products);
      setAllProducts(allProds);

      const suppliers = Array.from(new Set(allProds.map(p => p.supplier_name).filter(Boolean) as string[]));
      setAllSuppliers(suppliers);

    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
      const catsWithProducts = CATEGORY_DEFS.map(catDef => ({
        ...catDef,
        products: generateMockProducts(catDef.id, catDef.name, catDef.expectedCount)
      }));
      setCategories(catsWithProducts);
      const allProds = catsWithProducts.flatMap(c => c.products);
      setAllProducts(allProds);
      const suppliers = Array.from(new Set(allProds.map(p => p.supplier_name).filter(Boolean) as string[]));
      setAllSuppliers(suppliers);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCats(new Set(CATEGORY_DEFS.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCats(new Set());
  };

  const filteredProductsByCat = useMemo(() => {
    const result: Record<string, Product[]> = {};
    const kw = keyword.toLowerCase().trim();
    const minP = priceRange.min ? Number(priceRange.min) : 0;
    const maxP = priceRange.max ? Number(priceRange.max) : Infinity;

    categories.forEach(cat => {
      result[cat.id] = cat.products.filter(p => {
        if (kw) {
          const matchName = p.name.toLowerCase().includes(kw);
          const matchCat = cat.name.toLowerCase().includes(kw);
          if (!matchName && !matchCat) return false;
        }
        if (p.price < minP || p.price > maxP) return false;
        if (stockFilter !== 'all') {
          const status = getStockStatus(p.stock, p.stock_warning).level;
          if (stockFilter === 'inStock' && status !== 'ok') return false;
          if (stockFilter === 'lowStock' && status !== 'low') return false;
          if (stockFilter === 'outOfStock' && status !== 'out') return false;
        }
        if (guaranteeFilter === 'hasGuarantee' && !p.hasFallback) return false;
        if (selectedSupplier !== 'all' && p.supplier_name !== selectedSupplier) return false;
        return true;
      });
    });
    return result;
  }, [categories, keyword, priceRange, stockFilter, guaranteeFilter, selectedSupplier]);

  const renderProductCard = (p: Product) => {
    const stock = getStockStatus(p.stock, p.stock_warning);
    const commission = calcCommission(p.price, p.commission_rate || 0);
    const hasRegionLimit = p.region_limited === 1;
    return (
      <div
        key={p.id}
        className="product-card"
        onClick={() => navigate(`/product/${p.id}`)}
        style={{ margin: 0 }}
      >
        <div className="thumb" style={{ position: 'relative' }}>
          {p.image || p.name.slice(0, 6)}
          {p.is_hot === 1 && (
            <span
              className="hot-tag"
              style={{ position: 'absolute', top: 8, left: 8 }}
            >
              HOT
            </span>
          )}
          {hasRegionLimit && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(250, 173, 20, 0.9)',
              color: 'white', fontSize: 10, fontWeight: 600
            }}>
              📍 限售
            </span>
          )}
        </div>
        <div className="info">
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="tag tag-gray">{p.supplier_name || '官方供应商'}</span>
              {(p.supplier_count || 0) > 1 && (
                <span className="tag tag-blue" style={{ fontSize: 10 }}>
                  {p.supplier_count}供应商
                </span>
              )}
              {p.hasFallback && (
                <span
                  className="tag"
                  style={{
                    background: 'linear-gradient(135deg, #e6fffb, #b5f5ec)',
                    color: '#13c2c2',
                    border: '1px solid #87e8de',
                    cursor: 'help',
                    fontSize: 10,
                    fontWeight: 500
                  }}
                  title="主通道故障时自动切换至备用通道"
                >
                  🛡️ 降级保障
                </span>
              )}
              {p.channelCount && p.channelCount > 1 && (
                <span className="tag tag-purple" style={{ fontSize: 10 }}>
                  {p.channelCount}通道
                </span>
              )}
            </div>
            <div className="name" style={{ fontSize: 13 }}>{p.name}</div>
            {p.sku_type && (
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                SKU类型: {p.sku_type}
              </div>
            )}
          </div>
          <div className="meta mt-8" style={{ flexWrap: 'wrap', gap: '6px 12px' }}>
            <span className={`stock ${stock.cls}`}>{stock.text}</span>
            {p.lastSync && (
              <span className="text-sm text-gray">{formatSyncTime(p.lastSync)}</span>
            )}
            {p.sync_batch && (
              <span style={{
                fontSize: 10, padding: '1px 5px',
                background: '#f6ffed', color: '#389e0d',
                borderRadius: 3, border: '1px solid #b7eb8f'
              }}>
                批次: {p.sync_batch}
              </span>
            )}
          </div>
          {hasRegionLimit && p.region_list && p.region_list.length > 0 && (
            <div style={{ fontSize: 10, color: '#d48806', marginTop: 4 }}>
              可售区域: {p.region_list.slice(0, 3).join('、')}{p.region_list.length > 3 ? '...' : ''}
            </div>
          )}
          <div className="bottom mt-8">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="price"><small>¥</small>{p.price.toFixed(2)}</span>
                {p.face_value && p.face_value > p.price && (
                  <span className="original" style={{ fontSize: 11 }}>¥{p.face_value}</span>
                )}
              </div>
              {commission > 0 && (
                <div className="text-sm text-green" style={{ marginTop: 2, fontWeight: 500, fontSize: 11 }}>
                  赚 ¥{commission.toFixed(2)}
                </div>
              )}
            </div>
            <button
              className="btn-primary"
              style={{ padding: '5px 12px', fontSize: 12 }}
              disabled={p.stock === 0}
            >
              {p.stock === 0 ? '缺货' : '购买'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderListMode = (products: Product[]) => {
    const cardAvail = (p: Product) => p.card_available ?? 0;
    const cardTotal = (p: Product) => p.card_total ?? 0;
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>SKU编号</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>商品名</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>面值</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>售价</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>供应商</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>库存</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>区域限售</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>卡密可用</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>同步批次</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => {
              const isExpanded = expandedSku === p.id;
              const ratio = cardTotal(p) > 0 ? cardAvail(p) / cardTotal(p) : 0;
              return (
                <Fragment key={p.id}>
                  <tr
                    onClick={() => setExpandedSku(isExpanded ? null : p.id)}
                    style={{
                      background: idx % 2 === 0 ? 'white' : '#fafafa',
                      cursor: 'pointer',
                      borderBottom: isExpanded ? 'none' : '1px solid #f5f5f5'
                    }}
                  >
                    <td style={{ padding: '6px 8px', color: '#999', fontSize: 10 }}>{p.id}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 500, color: '#333' }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#666' }}>{p.face_value ? `¥${p.face_value}` : '-'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#667eea' }}>¥{p.price.toFixed(2)}</td>
                    <td style={{ padding: '6px 8px', color: '#666' }}>{p.supplier_name || '-'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <span style={{ color: p.stock === 0 ? '#ff4d4f' : p.stock <= 10 ? '#fa8c16' : '#52c41a', fontWeight: 500 }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      {p.region_limited === 1 ? (
                        <span style={{ fontSize: 10, padding: '1px 5px', background: '#fff7e6', color: '#d48806', borderRadius: 3 }}>限售</span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <span style={{ color: cardAvail(p) > 0 ? '#52c41a' : '#999', fontWeight: 500 }}>
                        {cardAvail(p)}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', color: '#999', fontSize: 10 }}>
                      {p.sync_batch || (p.stock_sync_history?.[0]?.batch) || '-'}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} style={{ padding: '10px 12px', background: '#f9f9ff', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#667eea', marginBottom: 6 }}>供应商库存流水</div>
                            {p.stock_sync_history && p.stock_sync_history.length > 0 ? (
                              <div style={{ fontSize: 10, color: '#666' }}>
                                {p.stock_sync_history.map((h, hi) => (
                                  <div key={hi} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed #f0f0f0' }}>
                                    <span>{h.batch}</span>
                                    <span style={{ color: '#999' }}>{new Date(h.time * 1000).toLocaleString()}</span>
                                    <span>库存{h.stock}</span>
                                    <span style={{ color: h.delta >= 0 ? '#52c41a' : '#ff4d4f' }}>{h.delta >= 0 ? '+' : ''}{h.delta}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 10, color: '#ccc' }}>暂无流水</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#fa8c16', marginBottom: 6 }}>可售区域</div>
                            {p.region_list && p.region_list.length > 0 ? (
                              <div style={{ fontSize: 10, color: '#666', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {p.region_list.map((r, ri) => (
                                  <span key={ri} style={{ padding: '2px 6px', background: '#fff7e6', borderRadius: 3, color: '#d48806' }}>{r}</span>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 10, color: '#ccc' }}>全国可售</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#52c41a', marginBottom: 6 }}>卡密使用率</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f0f0f0', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, ratio * 100)}%`, height: '100%', borderRadius: 4, background: ratio > 0.5 ? '#52c41a' : ratio > 0.2 ? '#fa8c16' : '#ff4d4f', transition: 'width 0.3s' }} />
                              </div>
                              <span style={{ fontSize: 10, color: '#666', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {cardAvail(p)}/{cardTotal(p)} ({(ratio * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const filteredCount = Object.values(filteredProductsByCat).reduce((s, arr) => s + arr.length, 0);
  const totalCount = allProducts.length;

  return (
    <div>
      <Header
        title="商品分类"
        showBack={false}
        right={<a href={adminUrl} target="_blank" rel="noopener noreferrer" className="admin-entry">后台</a>}
      />

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          margin: '12px 0',
          padding: '14px 16px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #667eea15, #764ba215)',
          border: '1px solid #667eea30'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
              📊 商品池总览
            </div>
            <div style={{ fontSize: 11, color: '#667eea', fontWeight: 500 }}>
              共 {categories.length} 个分类
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#667eea' }}>{totalCount}</div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>SKU总数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                {allProducts.filter(p => p.stock > 0).length}
              </div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>在售商品</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fa8c16' }}>
                {allProducts.filter(p => p.region_limited === 1).length}
              </div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>区域限售</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#722ed1' }}>
                {allProducts.filter(p => (p.supplier_count || 0) > 1).length}
              </div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>多供应商</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#13c2c2' }}>
                {allProducts.filter(p => (p.card_available ?? 0) > 0).length}
              </div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>卡密可用</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #667eea20' }}>
            <div style={{ fontSize: 11, color: '#666' }}>
              {allSuppliers.length} 家供应商 · {allProducts.filter(p => p.hasFallback).length} 款有降级保障
            </div>
            <div style={{ fontSize: 10, color: '#999' }}>
              筛选后: {filteredCount} 款
            </div>
          </div>
        </div>

        <div className="search-box" style={{ margin: 0 }}>
          <span>🔍</span>
          <input
            placeholder="搜索商品名称、分类..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              style={{ fontSize: 14, color: '#999', background: 'transparent', padding: '0 8px' }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          <button onClick={() => setViewMode('card')} style={{ padding: '5px 12px', borderRadius: 6, background: viewMode === 'card' ? '#667eea' : '#f5f5f5', color: viewMode === 'card' ? 'white' : '#666', fontSize: 11, border: 'none', cursor: 'pointer', fontWeight: 600 }}>▢ 卡片</button>
          <button onClick={() => setViewMode('list')} style={{ padding: '5px 12px', borderRadius: 6, background: viewMode === 'list' ? '#667eea' : '#f5f5f5', color: viewMode === 'list' ? 'white' : '#666', fontSize: 11, border: 'none', cursor: 'pointer', fontWeight: 600 }}>☰ 明细</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={expandAll}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                background: '#f0f5ff',
                color: '#667eea',
                fontSize: 12,
                fontWeight: 500,
                border: '1px solid #d6e4ff',
                cursor: 'pointer'
              }}
            >
              展开全部
            </button>
            <button
              onClick={collapseAll}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                background: '#f5f5f5',
                color: '#666',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              收起全部
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '6px 12px',
              borderRadius: 16,
              background: showFilters ? '#fff7e6' : '#f5f5f5',
              color: showFilters ? '#fa8c16' : '#666',
              fontSize: 12,
              fontWeight: 500,
              border: showFilters ? '1px solid #ffd591' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            筛选 {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {showFilters && (
          <div style={{
            marginTop: 10,
            padding: 14,
            background: '#fafafa',
            borderRadius: 12,
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>价格区间（元）</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    placeholder="最低"
                    value={priceRange.min}
                    onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #e8e8e8',
                      borderRadius: 8,
                      fontSize: 13,
                      background: 'white'
                    }}
                  />
                  <span style={{ color: '#999' }}>~</span>
                  <input
                    type="number"
                    placeholder="最高"
                    value={priceRange.max}
                    onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #e8e8e8',
                      borderRadius: 8,
                      fontSize: 13,
                      background: 'white'
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>库存状态</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { v: 'all' as StockFilter, label: '全部' },
                    { v: 'inStock' as StockFilter, label: '充足' },
                    { v: 'lowStock' as StockFilter, label: '紧张' },
                    { v: 'outOfStock' as StockFilter, label: '缺货' }
                  ].map(s => (
                    <button
                      key={s.v}
                      onClick={() => setStockFilter(s.v)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: 11,
                        background: stockFilter === s.v ? '#667eea' : 'white',
                        color: stockFilter === s.v ? 'white' : '#666',
                        border: `1px solid ${stockFilter === s.v ? '#667eea' : '#e8e8e8'}`,
                        fontWeight: stockFilter === s.v ? 600 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>降级保障</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setGuaranteeFilter('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    background: guaranteeFilter === 'all' ? '#667eea' : 'white',
                    color: guaranteeFilter === 'all' ? 'white' : '#666',
                    border: `1px solid ${guaranteeFilter === 'all' ? '#667eea' : '#e8e8e8'}`,
                    fontWeight: guaranteeFilter === 'all' ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  全部
                </button>
                <button
                  onClick={() => setGuaranteeFilter('hasGuarantee')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    background: guaranteeFilter === 'hasGuarantee' ? '#13c2c2' : 'white',
                    color: guaranteeFilter === 'hasGuarantee' ? 'white' : '#666',
                    border: `1px solid ${guaranteeFilter === 'hasGuarantee' ? '#13c2c2' : '#e8e8e8'}`,
                    fontWeight: guaranteeFilter === 'hasGuarantee' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  🛡️ 有降级保障
                </button>
              </div>
            </div>

            {allSuppliers.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>供应商筛选</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedSupplier('all')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      background: selectedSupplier === 'all' ? '#667eea' : 'white',
                      color: selectedSupplier === 'all' ? 'white' : '#666',
                      border: `1px solid ${selectedSupplier === 'all' ? '#667eea' : '#e8e8e8'}`,
                      fontWeight: selectedSupplier === 'all' ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    全部供应商
                  </button>
                  {allSuppliers.slice(0, 10).map(sup => (
                    <button
                      key={sup}
                      onClick={() => setSelectedSupplier(sup)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: 11,
                        background: selectedSupplier === sup ? '#722ed1' : 'white',
                        color: selectedSupplier === sup ? 'white' : '#666',
                        border: `1px solid ${selectedSupplier === sup ? '#722ed1' : '#e8e8e8'}`,
                        fontWeight: selectedSupplier === sup ? 600 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {sup}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                onClick={() => {
                  setPriceRange({ min: '', max: '' });
                  setStockFilter('all');
                  setGuaranteeFilter('all');
                  setSelectedSupplier('all');
                  setKeyword('');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#f5f5f5',
                  color: '#666',
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                重置筛选
              </button>
            </div>
          </div>
        )}

        <div style={{
          fontSize: 11,
          color: '#999',
          marginTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            共 <strong style={{ color: '#667eea' }}>{totalCount}</strong> 款商品
            {(keyword || stockFilter !== 'all' || guaranteeFilter !== 'all' || selectedSupplier !== 'all' || priceRange.min || priceRange.max) && (
              <>，筛选出 <strong style={{ color: '#52c41a' }}>{filteredCount}</strong> 款</>
            )}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="icon">⏳</div>加载中...
        </div>
      ) : filteredCount === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <div>未找到符合条件的商品</div>
          <div style={{ fontSize: 12, marginTop: 8, color: '#999' }}>
            请尝试调整筛选条件
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {categories.map(cat => {
            const products = filteredProductsByCat[cat.id] || [];
            if (products.length === 0 && (keyword || stockFilter !== 'all' || guaranteeFilter !== 'all' || selectedSupplier !== 'all' || priceRange.min || priceRange.max)) {
              return null;
            }
            const isExpanded = expandedCats.has(cat.id);
            return (
              <div
                key={cat.id}
                style={{
                  background: 'white',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #f0f0f0'
                }}
              >
                <div
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                    borderBottom: isExpanded ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18
                    }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        {products.length} / {cat.expectedCount} 款
                        <span style={{ marginLeft: 6 }}>
                          {products.length >= cat.expectedCount * 0.9 ? '✅ 完整' : products.length > 0 ? '⚠️ 部分' : '❌ 空'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 48,
                      height: 6,
                      borderRadius: 3,
                      background: '#f0f0f0',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(100, (products.length / Math.max(cat.expectedCount, 1)) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea, #52c41a)',
                        borderRadius: 3,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <span style={{
                      fontSize: 16,
                      color: '#999',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      display: 'inline-block'
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: 12 }}>
                    {products.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 20px', color: '#999', fontSize: 13 }}>
                        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.3 }}>{cat.icon}</div>
                        该分类暂无商品
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          前往管理后台添加商品 →
                        </div>
                      </div>
                    ) : viewMode === 'list' ? (
                      renderListMode(products)
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 10
                      }}>
                        {products.map(p => renderProductCard(p))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '20px 20px 30px', textAlign: 'center', fontSize: 11, color: '#bbb' }}>
        —— 6大分类 · 完整SKU清单 ——
        <div style={{ marginTop: 8 }}>
          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#667eea', textDecoration: 'underline' }}
          >
            前往管理后台管理商品 →
          </a>
        </div>
      </div>
    </div>
  );
}
