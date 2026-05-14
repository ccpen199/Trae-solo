import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data));
  }, [id]);

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await api.post('/cart', { product_id: product.id, quantity });
    alert('已添加到购物车');
  };

  const buyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await api.post('/cart', { product_id: product.id, quantity });
    navigate('/cart');
  };

  if (!product) return null;

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: '70px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <span style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '16px' }}>商品详情</span>
        <span style={{ fontSize: '24px' }}>🛒</span>
      </div>

      <img src={product.image} alt={product.name} style={{ width: '100%', aspectRatio: '1' }} />

      <div style={{ background: '#fff', padding: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
          <span style={{ color: '#ff6b35', fontSize: '24px', fontWeight: 'bold' }}>¥{product.price}</span>
          {product.original_price > product.price && (
            <span style={{ color: '#999', textDecoration: 'line-through' }}>¥{product.original_price}</span>
          )}
        </div>
        <h1 style={{ fontSize: '18px', marginBottom: '10px' }}>{product.name}</h1>
        <p style={{ color: '#666', lineHeight: '1.6' }}>{product.description}</p>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        gap: '10px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #eee', borderRadius: '4px' }}>
          <button
            style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer' }}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >-</button>
          <span style={{ padding: '0 12px' }}>{quantity}</span>
          <button
            style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer' }}
            onClick={() => setQuantity(quantity + 1)}
          >+</button>
        </div>
        <button
          style={{
            flex: 1,
            padding: '12px',
            background: '#ff6b35',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onClick={addToCart}
        >
          加入购物车
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            background: '#b4282d',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onClick={buyNow}
        >
          立即购买
        </button>
      </div>
    </div>
  );
}

export default ProductDetailPage;
