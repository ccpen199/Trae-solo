import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import request from '../utils/request';
import Loading from '../components/Loading';
import useStore from '../store/useStore';

const Mall = () => {
  const { isAuthenticated, user } = useStore(state => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user
  }));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await request.get('/mall/products');
      setProducts(res.data?.list || getMockProducts());
    } catch (error) {
      setProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  const getMockProducts = () => {
    const products = [];
    const names = [
      'BILIBILIGOODS 幻星集II 2233 马克杯',
      '2233 娘 手办 限定版',
      'B站会员年卡 大会员',
      '机械键盘 二次元定制款',
      'BILIBILIGOODS 小电视毛绒公仔',
      '2233 娘 主题雨伞',
      'B站限定鼠标垫 大号',
      '动漫主题T恤 纯棉短袖',
      '哔哩哔哩 充电宝 10000mAh',
      '小电视 亚克力立牌',
      '2233 娘 徽章套装',
      'BILIBILIGOODS 帆布袋'
    ];
    for (let i = 0; i < 12; i++) {
      products.push({
        id: i + 1,
        name: names[i],
        cover: `https://picsum.photos/300/300?random=${i + 200}`,
        price: (Math.random() * 200 + 9.9).toFixed(2),
        originalPrice: (Math.random() * 300 + 50).toFixed(2),
        stock: Math.floor(Math.random() * 1000),
        type: i < 4 ? 'virtual' : 'physical',
        category: ['周边', '数码', '服饰', '家居'][i % 4]
      });
    }
    return products;
  };

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const handleBuyVip = async (type) => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    try {
      await request.post(`/mall/buy-vip/${type}`);
      alert('购买成功！');
    } catch (error) {
      alert('购买成功！（模拟）');
    }
  };

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>🛒 会员购</h1>
        
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>🎬 大会员专享</h2>
              <p style={{ opacity: 0.9 }}>高清画质 · 付费影片免费看 · 专属挂件</p>
              {isAuthenticated && user?.vip_type > 0 && (
                <p style={{ marginTop: '8px', fontWeight: 500 }}>您已是大会员 🎉</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleBuyVip('vip_month')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'white',
                  color: '#764ba2',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                月卡 ¥25
              </button>
              <button
                onClick={() => handleBuyVip('vip_year')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ffd700',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                年卡 ¥233
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['all', 'virtual', '周边', '数码', '服饰'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'var(--primary-color)' : 'white',
                color: activeTab === tab ? 'white' : 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {tab === 'all' ? '全部' : tab === 'virtual' ? '虚拟商品' : tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {products.map(product => (
            <Link
              key={product.id}
              to={`/mall/product/${product.id}`}
              className="card"
              style={{ overflow: 'hidden', transition: 'transform 0.2s ease' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                <img
                  src={product.cover}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '12px' }}>
                <h3 className="text-ellipsis-2" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', minHeight: '40px' }}>
                  {product.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: '#ff4d4f' }}>
                    ¥{formatPrice(product.price)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ¥{formatPrice(product.originalPrice)}
                  </span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  库存: {product.stock}
                  {product.type === 'virtual' && <span style={{ marginLeft: '8px', color: 'var(--primary-color)' }}>虚拟商品</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Mall;
