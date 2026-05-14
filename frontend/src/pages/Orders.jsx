import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/orders').then(res => setOrders(res.data));
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
        <p style={{ color: '#999', marginBottom: '30px' }}>登录后可以查看您的订单</p>
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

  const styles = {
    container: {
      padding: '15px'
    },
    empty: {
      textAlign: 'center',
      padding: '60px 20px'
    },
    order: {
      background: '#fff',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px',
      paddingBottom: '10px',
      borderBottom: '1px solid #eee'
    },
    orderNo: {
      color: '#666',
      fontSize: '12px'
    },
    status: {
      color: '#ff4d4f',
      fontSize: '14px'
    },
    total: {
      textAlign: 'right',
      marginTop: '10px',
      paddingTop: '10px',
      borderTop: '1px solid #eee'
    },
    totalPrice: {
      color: '#ff4d4f',
      fontSize: '18px',
      fontWeight: 'bold'
    },
    date: {
      color: '#999',
      fontSize: '12px',
      marginTop: '5px'
    }
  };

  if (!orders.length) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>📋</div>
        <p style={{ color: '#999' }}>暂无订单</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {orders.map(order => (
        <div key={order.id} style={styles.order}>
          <div style={styles.orderHeader}>
            <span style={styles.orderNo}>订单号：{order.orderNo}</span>
            <span style={styles.status}>{order.status === 'pending' ? '待付款' : '已完成'}</span>
          </div>
          <div style={styles.total}>
            <span style={styles.totalPrice}>¥{order.totalAmount}</span>
          </div>
          <div style={styles.date}>{new Date(order.createTime).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

export default Orders;
