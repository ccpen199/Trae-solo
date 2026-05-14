import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/cart').then(res => setItems(res.data));
  }, [user]);

  if (!user) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '80px 20px',
        background: '#fff',
        minHeight: '80vh'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ marginBottom: '10px', color: '#333' }}>请先登录</h2>
        <p style={{ color: '#999', marginBottom: '30px' }}>登录后可以使用购物车功能</p>
        <button 
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 40px',
            background: '#ff4d4f',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          立即登录
        </button>
      </div>
    );
  }

  const removeItem = async (id) => {
    await axios.delete(`/api/cart/${id}`);
    setItems(items.filter(i => i.id !== id));
  };

  const checkout = async () => {
    await axios.post('/api/orders');
    alert('下单成功');
    navigate('/orders');
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const styles = {
    container: {
      padding: '15px'
    },
    empty: {
      textAlign: 'center',
      padding: '60px 20px'
    },
    item: {
      background: '#fff',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
      display: 'flex',
      gap: '10px'
    },
    img: {
      width: '80px',
      height: '80px',
      borderRadius: '8px',
      objectFit: 'cover',
      background: '#f0f0f0'
    },
    info: {
      flex: 1
    },
    title: {
      fontSize: '14px',
      marginBottom: '8px'
    },
    price: {
      color: '#ff4d4f',
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    deleteBtn: {
      background: 'none',
      border: 'none',
      color: '#999',
      fontSize: '14px'
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
    total: {
      flex: 1
    },
    totalLabel: {
      color: '#666',
      fontSize: '14px'
    },
    totalPrice: {
      color: '#ff4d4f',
      fontSize: '20px',
      fontWeight: 'bold'
    },
    checkoutBtn: {
      padding: '12px 30px',
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      borderRadius: '20px',
      fontSize: '16px'
    }
  };

  if (!items.length) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛒</div>
        <p style={{ color: '#999' }}>购物车是空的</p>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, paddingBottom: '80px' }}>
      {items.map(item => (
        <div key={item.id} style={styles.item}>
          <img src={item.image} style={styles.img} alt={item.title} />
          <div style={styles.info}>
            <div style={styles.title}>{item.title}</div>
            <div style={styles.price}>¥{item.price}</div>
            <div style={styles.actions}>
              <span style={{ color: '#666' }}>x{item.quantity}</span>
              <button onClick={() => removeItem(item.id)} style={styles.deleteBtn}>删除</button>
            </div>
          </div>
        </div>
      ))}
      <div style={styles.bottomBar}>
        <div style={styles.total}>
          <span style={styles.totalLabel}>合计：</span>
          <span style={styles.totalPrice}>¥{total.toFixed(2)}</span>
        </div>
        <button onClick={checkout} style={styles.checkoutBtn}>结算</button>
      </div>
    </div>
  );
};

export default Cart;
