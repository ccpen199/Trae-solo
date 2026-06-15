import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

export default function Category() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string>(params.get('cat') || '');
  const [products, setProducts] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('sort');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    productApi.getCategories().then((res: any) => {
      if (res.success) {
        const cats = res.data || [];
        setCategories(cats);
        if (!activeCat && cats.length > 0) setActiveCat(cats[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (activeCat) {
      setPage(1);
      setProducts([]);
      loadProducts(1, true);
    }
  }, [activeCat, sort, keyword]);

  const loadProducts = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const res: any = await productApi.getProducts({
        categoryId: activeCat,
        keyword: keyword || undefined,
        sort,
        page: p,
        pageSize: 20
      });
      if (res.success) {
        const list = reset ? res.data.list : [...products, ...res.data.list];
        setProducts(list);
        setHasMore(res.data.hasMore);
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: '缺货', cls: 'none' };
    if (stock < 10) return { text: `仅剩${stock}件`, cls: 'less' };
    return { text: '库存充足', cls: '' };
  };

  return (
    <div>
      <Header title="全部商品" showBack={false} />
      <div className="search-box">
        <span>🔍</span>
        <input placeholder="搜索商品名称..." value={keyword}
          onChange={e => setKeyword(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
        {[{ id: '', name: '全部' }, ...categories].map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
            padding: '8px 16px', borderRadius: 20, fontSize: 13,
            background: activeCat === cat.id ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
            color: activeCat === cat.id ? 'white' : '#333', flexShrink: 0,
            border: activeCat === cat.id ? 'none' : '1px solid #eee',
            fontWeight: activeCat === cat.id ? 600 : 500
          }}>{cat.name}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {[
          { v: 'sort', label: '综合' },
          { v: 'hot', label: '热销' },
          { v: 'newest', label: '最新' },
          { v: 'price_asc', label: '价格↑' },
          { v: 'price_desc', label: '价格↓' }
        ].map(s => (
          <button key={s.v} onClick={() => setSort(s.v)} style={{
            padding: '6px 12px', borderRadius: 16, fontSize: 12,
            background: sort === s.v ? '#667eea22' : '#f0f0f0',
            color: sort === s.v ? '#667eea' : '#666',
            fontWeight: sort === s.v ? 600 : 400
          }}>{s.label}</button>
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
            const stock = getStockStatus(p.stock);
            return (
              <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
                <div className="thumb">{p.image || p.name.slice(0, 6)}</div>
                <div className="info">
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {p.is_hot === 1 && <span className="hot-tag">HOT</span>}
                      <span className="tag tag-gray">{p.sku_type === 'card' ? '卡密' : '直充'}</span>
                    </div>
                    <div className="name">{p.name}</div>
                  </div>
                  <div className="flex-between">
                    <div>
                      <span className="price"><small>¥</small>{p.price}</span>
                      {p.face_value && p.face_value > p.price && <span className="original">¥{p.face_value}</span>}
                    </div>
                    <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}
                      disabled={p.stock === 0}>
                      {p.stock === 0 ? '缺货' : '立即购买'}
                    </button>
                  </div>
                  <div className="meta mt-8">
                    <span className={`stock ${stock.cls}`}>{stock.text}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ padding: 20, textAlign: 'center' }}>
            {loading ? <span className="text-gray">加载中...</span> :
              hasMore ? <button onClick={() => { setPage(p => p + 1); loadProducts(page + 1); }} className="text-blue">加载更多</button> :
                <span className="text-gray">—— 到底了 ——</span>}
          </div>
        </>
      )}
    </div>
  );
}
