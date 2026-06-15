import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

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
  if (stock === 0) return { text: '缺货', cls: 'none' };
  if (stock <= stockWarning) return { text: `仅剩${stock}件`, cls: 'less' };
  return { text: '库存充足', cls: '' };
}

function calcCommission(price: number, rate: number): number {
  return price * rate;
}

export default function Category() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string>(params.get('cat') || '');
  const [products, setProducts] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('hot');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [promotions, setPromotions] = useState<any[]>([]);
  const initialLoad = useRef(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!initialLoad.current && activeCat) {
      setPage(1);
      setProducts([]);
      loadProducts(1, true);
    }
  }, [activeCat, sort, keyword]);

  const loadInitialData = async () => {
    try {
      const [catRes, promoRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getPromotions()
      ]);
      if (catRes.success) {
        const cats = catRes.data || [];
        setCategories(cats);
        if (!activeCat && cats.length > 0) {
          setActiveCat(cats[0].id);
        }
      }
      if (promoRes.success) {
        setPromotions(promoRes.data || []);
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    }
  };

  const loadProducts = async (p: number, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res: any = await productApi.getProducts({
        categoryId: activeCat || undefined,
        keyword: keyword || undefined,
        sort,
        page: p,
        pageSize: 20
      });
      if (res.success) {
        const list = reset ? res.data.list : [...products, ...res.data.list];
        setProducts(list);
        setHasMore(res.data.hasMore);
        initialLoad.current = false;
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage);
  };

  const hasStackablePromo = (product: any) => {
    if (product.applicablePromotions?.length > 0) {
      return product.applicablePromotions.some((pr: any) => pr.stackable);
    }
    return promotions.some(pr => pr.rules?.stackable);
  };

  return (
    <div>
      <Header title="全部商品" showBack={false} />
      <div className="search-box">
        <span>🔍</span>
        <input
          placeholder="搜索商品名称..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
        {[{ id: '', name: '全部' }, ...categories].map(cat => (
          <button
            key={cat.id || 'all'}
            onClick={() => setActiveCat(cat.id)}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13,
              background: activeCat === cat.id ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
              color: activeCat === cat.id ? 'white' : '#333', flexShrink: 0,
              border: activeCat === cat.id ? 'none' : '1px solid #eee',
              fontWeight: activeCat === cat.id ? 600 : 500
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {[
          { v: 'hot', label: '热销' },
          { v: 'newest', label: '最新' },
          { v: 'price_asc', label: '价格↑' },
          { v: 'price_desc', label: '价格↓' }
        ].map(s => (
          <button
            key={s.v}
            onClick={() => setSort(s.v)}
            style={{
              padding: '6px 12px', borderRadius: 16, fontSize: 12,
              background: sort === s.v ? '#667eea22' : '#f0f0f0',
              color: sort === s.v ? '#667eea' : '#666',
              fontWeight: sort === s.v ? 600 : 400
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {products.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="icon">🛒</div>
          <div>暂无商品</div>
        </div>
      ) : (
        <>
          {products.map(p => {
            const stock = getStockStatus(p.stock, p.stock_warning);
            const channelCount = p.channelCount || p.channels?.length || 0;
            const commission = calcCommission(p.price, p.commission_rate || 0);
            const stackable = hasStackablePromo(p);
            return (
              <div
                key={p.id}
                className="product-card"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="thumb">{p.image || p.name.slice(0, 6)}</div>
                <div className="info">
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {p.is_hot === 1 && <span className="hot-tag">HOT</span>}
                      <span className="tag tag-gray">{p.supplier_name || '官方供应商'}</span>
                      {stackable && <span className="tag tag-orange">可叠加</span>}
                    </div>
                    <div className="name">{p.name}</div>
                  </div>
                  <div className="meta mt-8" style={{ flexWrap: 'wrap', gap: '6px 12px' }}>
                    <span className={`stock ${stock.cls}`}>{stock.text}</span>
                    <span className="text-sm text-gray">通道 {channelCount}个</span>
                    <span className="text-sm text-gray">{formatSyncTime(p.lastSync)}</span>
                  </div>
                  <div className="bottom mt-8">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span className="price"><small>¥</small>{p.price}</span>
                        {p.face_value && p.face_value > p.price && (
                          <span className="original">¥{p.face_value}</span>
                        )}
                      </div>
                      {commission > 0 && (
                        <div className="text-sm text-green" style={{ marginTop: 2, fontWeight: 500 }}>
                          赚 ¥{commission.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 16px', fontSize: 13 }}
                      disabled={p.stock === 0}
                    >
                      {p.stock === 0 ? '缺货' : '立即购买'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ padding: 20, textAlign: 'center' }}>
            {loading ? (
              <span className="text-gray">加载中...</span>
            ) : hasMore ? (
              <button onClick={loadMore} className="text-blue">加载更多</button>
            ) : (
              <span className="text-gray">—— 到底了 ——</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
