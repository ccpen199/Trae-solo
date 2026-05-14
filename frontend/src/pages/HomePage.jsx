import { useEffect, useState } from 'react';
import TabBar from '../components/TabBar';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    api.get('/products/categories').then(res => setCategories(res.data));
    loadProducts();
  }, []);

  const loadProducts = (categoryId = null) => {
    const params = categoryId ? { category_id: categoryId } : {};
    api.get('/products', { params }).then(res => setProducts(res.data));
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setShowAllCategories(false);
    if (cat.id) {
      loadProducts(cat.id);
    } else {
      loadProducts();
    }
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: '70px' }}>
      <div style={{
        background: '#fff',
        padding: '10px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div
          style={{
            flex: 1,
            background: '#f5f5f5',
            borderRadius: '20px',
            padding: '10px 15px',
            display: 'flex',
            alignItems: 'center',
            color: '#999',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/search')}
        >
          <span>🔍</span>
          <span style={{ marginLeft: '8px' }}>搜索商品</span>
        </div>
      </div>

      <div style={{
        background: '#fff',
        padding: '10px 0',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        display: showAllCategories ? 'grid' : 'flex',
        gridTemplateColumns: showAllCategories ? 'repeat(4, 1fr)' : undefined,
        gap: showAllCategories ? '10px' : '0',
        paddingBottom: showAllCategories ? '20px' : 0
      }}>
        {categories.map(cat => (
          <div
            key={cat.id}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px 15px',
              minWidth: showAllCategories ? 'auto' : '70px',
              cursor: 'pointer',
              color: activeCategory?.id === cat.id ? '#ff6b35' : '#333',
              borderBottom: !showAllCategories && activeCategory?.id === cat.id ? '2px solid #ff6b35' : '2px solid transparent'
            }}
            onClick={() => handleCategoryClick(cat)}
          >
            <span style={{ fontSize: '28px' }}>{cat.icon}</span>
            <span style={{ fontSize: '12px', marginTop: '5px' }}>{cat.name}</span>
          </div>
        ))}
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 15px',
            minWidth: '70px',
            cursor: 'pointer'
          }}
          onClick={() => setShowAllCategories(!showAllCategories)}
        >
          <span style={{ fontSize: '28px' }}>{showAllCategories ? '▲' : '▼'}</span>
          <span style={{ fontSize: '12px', marginTop: '5px' }}>{showAllCategories ? '收起' : '全部'}</span>
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <TabBar />
    </div>
  );
}

export default HomePage;
