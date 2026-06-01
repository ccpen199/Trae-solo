import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [exclusiveProducts, setExclusiveProducts] = useState([]);
  const [themes, setThemes] = useState([]);
  const [guides, setGuides] = useState([]);
  const [recommendProducts, setRecommendProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        bannersRes,
        categoriesRes,
        productsRes,
        themesRes,
        guidesRes,
        recommendRes
      ] = await Promise.all([
        fetch('/api/banners').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/themes').then(r => r.json()),
        fetch('/api/guides').then(r => r.json()),
        fetch('/api/products/recommend').then(r => r.json())
      ]);

      if (bannersRes.success) setBanners(bannersRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (productsRes.success) {
        setNewProducts(productsRes.data.list.filter(p => p.is_new));
        setExclusiveProducts(productsRes.data.list.filter(p => p.is_exclusive));
      }
      if (themesRes.success) setThemes(themesRes.data);
      if (guidesRes.success) setGuides(guidesRes.data.list || []);
      if (recommendRes.success) setRecommendProducts(recommendRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      {banners.length > 0 && (
        <div className="banner">
          <img src={banners[0].image} alt={banners[0].title} />
        </div>
      )}

      <div className="categories">
        {categories.map(cat => (
          <div key={cat.id} className="category-item" onClick={() => navigate(`/product/1`)}>
            <div className="category-icon">{cat.icon}</div>
            <div className="category-name">{cat.name}</div>
          </div>
        ))}
      </div>

      {newProducts.length > 0 && (
        <section>
          <h2 className="section-title">🆕 新品推荐</h2>
          <div className="product-grid">
            {newProducts.map(product => (
              <ProductCard key={product.id} product={product} onClick={() => navigate(`/product/${product.id}`)} />
            ))}
          </div>
        </section>
      )}

      {exclusiveProducts.length > 0 && (
        <section>
          <h2 className="section-title">⭐ 独家特惠</h2>
          <div className="product-grid">
            {exclusiveProducts.map(product => (
              <ProductCard key={product.id} product={product} onClick={() => navigate(`/product/${product.id}`)} />
            ))}
          </div>
        </section>
      )}

      {themes.length > 0 && (
        <section>
          <h2 className="section-title">🎯 主题推荐</h2>
          <div className="themes">
            {themes.map(theme => (
              <div key={theme.id} className="theme-card" onClick={() => navigate('/product/1')}>
                <div className="theme-overlay">
                  <div className="theme-title">{theme.title}</div>
                  <div className="theme-desc">{theme.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section>
          <h2 className="section-title">📝 旅游攻略</h2>
          <div className="guides">
            {guides.map(guide => (
              <div key={guide.id} className="guide-card">
                <div></div>
                <div className="guide-info">
                  <h4 className="guide-title">{guide.title}</h4>
                  <p className="guide-summary">{guide.summary}</p>
                  <div className="guide-meta">
                    <span>{guide.author}</span>
                    <span>{guide.views} 阅读 · {guide.likes} 点赞</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendProducts.length > 0 && (
        <section>
          <h2 className="section-title">🔥 猜你喜欢</h2>
          <div className="product-grid">
            {recommendProducts.map(product => (
              <ProductCard key={product.id} product={product} onClick={() => navigate(`/product/${product.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductCard({ product, onClick }) {
  return (
    <div className="product-card" onClick={onClick}>
      <img className="product-image" src={product.images} alt={product.title} />
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-subtitle">{product.subtitle}</p>
        {product.tags && product.tags.length > 0 && (
          <div className="product-tags">
            {product.tags.map((tag, i) => (
              <span key={i} className="product-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="product-price">
          <span className="current-price">¥{product.price}</span>
          {product.original_price > product.price && (
            <span className="original-price">¥{product.original_price}</span>
          )}
        </div>
        <div className="product-sales">已售 {product.sales} 份</div>
      </div>
    </div>
  );
}
