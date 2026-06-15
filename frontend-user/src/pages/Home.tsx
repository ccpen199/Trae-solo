import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { productApi } from '../api/modules';
import { useToast, useUser } from '../App';
import Header from '../components/Header';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useUser();
  const [categories, setCategories] = useState<any[]>([]);
  const [hotProducts, setHotProducts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, hotRes, promoRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getHotProducts(),
        productApi.getPromotions()
      ]);
      if (catRes.success) setCategories((catRes.data as any[]) || []);
      if (hotRes.success) setHotProducts((hotRes.data as any[]) || []);
      if (promoRes.success) setPromotions((promoRes.data as any[]) || []);
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
      <Header title="虚拟商品中心" showBack={false} />

      <div className="banner">
        <h2>🎉 新用户首单立减20元</h2>
        <p>200+商品极速充值 · 安全保障 · 佣金实时到账</p>
      </div>

      {promotions.length > 0 && (
        <div style={{ margin: '0 16px 12px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {promotions.map(p => (
            <div key={p.id} style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 10,
              background: p.type === 'full_reduction' ? 'linear-gradient(135deg, #ff9a9e, #fecfef)' :
                p.type === 'percentage' ? 'linear-gradient(135deg, #a8edea, #fed6e3)' : 'linear-gradient(135deg, #ffecd2, #fcb69f)',
              fontSize: 12, color: '#333', fontWeight: 600, whiteSpace: 'nowrap'
            }}>
              🔥 {p.name}
            </div>
          ))}
        </div>
      )}

      <div className="category-grid">
        {categories.slice(0, 8).map(cat => (
          <Link key={cat.id} to={`/category?cat=${cat.id}`} className="category-item">
            <div className="icon">{cat.icon}</div>
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>

      <div className="section-title">
        <h3>🔥 热门推荐</h3>
        <span className="more" onClick={() => navigate('/category')}>查看全部 ›</span>
      </div>

      {!loading && hotProducts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <div>暂无热门商品</div>
        </div>
      ) : (
        hotProducts.map(p => {
          const stock = getStockStatus(p.stock);
          return (
            <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
              <div className="thumb">{p.image || p.name.slice(0, 6)}</div>
              <div className="info">
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {p.is_hot === 1 && <span className="hot-tag">HOT</span>}
                    <span className="tag tag-blue">{p.category_name || '官方直充'}</span>
                  </div>
                  <div className="name">{p.name}</div>
                </div>
                <div className="flex-between">
                  <div>
                    <span className="price"><small>¥</small>{p.price}</span>
                    {p.face_value && p.face_value > p.price && <span className="original">¥{p.face_value}</span>}
                  </div>
                  <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>立即充值</button>
                </div>
                <div className="meta mt-8">
                  <span className={`stock ${stock.cls}`}>{stock.text}</span>
                  {p.commission_rate > 0 && <span className="text-red text-sm">赚 ¥{(p.price * p.commission_rate * 0.6).toFixed(2)}</span>}
                </div>
              </div>
            </div>
          );
        })
      )}

      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: '#bbb', fontSize: 12 }}>— 已显示全部推荐商品 —</p>
      </div>
    </div>
  );
}
