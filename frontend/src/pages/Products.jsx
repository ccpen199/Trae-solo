import React, { useState, useEffect } from 'react';
import { api } from '../api';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: '全部' },
    { key: 'eyewear', label: '眼镜' },
    { key: 'clothing', label: '服饰' },
    { key: 'accessories', label: '配饰' }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>商品库</h2>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              className={`tab ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.category === 'eyewear' && '👓'}
                {product.category === 'clothing' && '👕'}
                {product.category === 'accessories' && '🎩'}
                {!['eyewear', 'clothing', 'accessories'].includes(product.category) && '📦'}
              </div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-category">
                  {getCategoryLabel(product.category)} · {product.sku}
                </div>
                <div className="product-price">¥{product.price}</div>
                <div className="product-stock">
                  库存: {product.stock} 件
                </div>
                {product.model_3d_url && (
                  <div style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
                    ✨ 支持3D模型试穿
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          暂无商品数据
        </div>
      )}
    </div>
  );
}

function getCategoryLabel(category) {
  const labels = {
    eyewear: '眼镜',
    clothing: '服饰',
    accessories: '配饰'
  };
  return labels[category] || category;
}

export default Products;
