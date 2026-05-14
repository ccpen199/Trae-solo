import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    axios.get(`/api/products/${id}`).then(res => setProduct(res.data));
  }, [id]);

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await axios.post('/api/cart', { productId: id });
    alert('已加入购物车');
  };

  const buyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await axios.post('/api/cart', { productId: id });
    navigate('/cart');
  };

  if (!product) return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>;

  const styles = {
    img: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'cover',
      background: '#f0f0f0'
    },
    info: {
      padding: '15px',
      background: '#fff'
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    priceRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '10px',
      marginBottom: '10px'
    },
    price: {
      color: '#ff4d4f',
      fontSize: '24px',
      fontWeight: 'bold'
    },
    originalPrice: {
      color: '#999',
      fontSize: '14px',
      textDecoration: 'line-through'
    },
    tags: {
      display: 'flex',
      gap: '8px',
      marginBottom: '15px'
    },
    tag: {
      padding: '4px 8px',
      background: '#fff1f0',
      color: '#ff4d4f',
      borderRadius: '4px',
      fontSize: '12px'
    },
    detail: {
      padding: '15px',
      background: '#fff',
      marginTop: '10px'
    },
    detailTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    bottomBar: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      padding: '0 15px',
      borderTop: '1px solid #eee',
      zIndex: 100
    },
    cartBtn: {
      flex: 1,
      height: '44px',
      background: '#ffd666',
      border: 'none',
      borderRadius: '22px',
      fontSize: '16px',
      color: '#333',
      marginRight: '10px'
    },
    buyBtn: {
      flex: 1,
      height: '44px',
      background: '#ff4d4f',
      border: 'none',
      borderRadius: '22px',
      fontSize: '16px',
      color: '#fff'
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <img src={product.image} style={styles.img} alt={product.title} />
      <div style={styles.info}>
        <h1 style={styles.title}>{product.title}</h1>
        <div style={styles.priceRow}>
          <span style={styles.price}>¥{product.price}</span>
          <span style={styles.originalPrice}>¥{product.originalPrice}</span>
        </div>
        <div style={styles.tags}>
          <span style={styles.tag}>正品保证</span>
          {product.freight === 0 && <span style={styles.tag}>包邮</span>}
          <span style={styles.tag}>7天无理由</span>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {product.freight > 0 ? `运费 ¥${product.freight}` : '运费：包邮'} | 已售 {product.sales || 0}
        </p>
      </div>
      <div style={styles.detail}>
        <h3 style={styles.detailTitle}>商品详情</h3>
        <p style={{ color: '#666', lineHeight: 1.8 }}>{product.description}</p>
      </div>
      <div style={styles.bottomBar}>
        <button onClick={addToCart} style={styles.cartBtn}>加入购物车</button>
        <button onClick={buyNow} style={styles.buyBtn}>立即购买</button>
      </div>
    </div>
  );
};

export default ProductDetail;
