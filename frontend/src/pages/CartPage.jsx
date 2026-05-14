import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../components/TabBar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCart();
  }, [user]);

  const loadCart = () => {
    api.get('/cart').then(res => {
      setCartItems(res.data);
      setSelectedItems(new Set(res.data.map(item => item.id)));
    });
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await api.delete(`/cart/${itemId}`);
    } else {
      await api.put(`/cart/${itemId}`, { quantity: newQuantity });
    }
    loadCart();
  };

  const removeItem = async (itemId) => {
    await api.delete(`/cart/${itemId}`);
    loadCart();
  };

  const toggleSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const checkout = async () => {
    const items = cartItems.filter(item => selectedItems.has(item.id));
    if (items.length === 0) return;

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await api.post('/orders', {
      items: items.map(item => ({ product_id: item.product_id, quantity: item.quantity, price: item.price })),
      address: '默认地址',
      total_amount: total
    });
    navigate('/orders');
  };

  const selectedTotal = cartItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: '130px' }}>
      <div style={{ background: '#fff', padding: '15px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>购物车</h1>
      </div>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <span style={{ fontSize: '64px' }}>🛒</span>
          <p style={{ color: '#999', marginTop: '20px' }}>购物车是空的</p>
        </div>
      ) : (
        cartItems.map(item => (
          <div key={item.id} style={{ background: '#fff', padding: '15px', marginBottom: '10px', display: 'flex', gap: '10px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: `2px solid ${selectedItems.has(item.id) ? '#ff6b35' : '#ddd'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedItems.has(item.id) ? '#ff6b35' : 'none',
                color: '#fff',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: '20px'
              }}
              onClick={() => toggleSelect(item.id)}
            >
              {selectedItems.has(item.id) && '✓'}
            </div>
            <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '4px' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>{item.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>¥{item.price}</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #eee', borderRadius: '4px' }}>
                  <button
                    style={{ padding: '4px 10px', border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >-</button>
                  <span style={{ padding: '0 10px' }}>{item.quantity}</span>
                  <button
                    style={{ padding: '4px 10px', border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {cartItems.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: 0,
          right: 0,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '10px 15px',
          gap: '10px'
        }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
            onClick={toggleSelectAll}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: `2px solid ${selectedItems.size === cartItems.length ? '#ff6b35' : '#ddd'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedItems.size === cartItems.length ? '#ff6b35' : 'none',
                color: '#fff'
              }}
            >
              {selectedItems.size === cartItems.length && '✓'}
            </div>
            <span>全选</span>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            合计: <span style={{ color: '#ff6b35', fontSize: '18px', fontWeight: 'bold' }}>¥{selectedTotal.toFixed(2)}</span>
          </div>
          <button
            style={{
              padding: '10px 30px',
              background: '#ff6b35',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
            onClick={checkout}
          >
            结算({selectedItems.size})
          </button>
        </div>
      )}

      <TabBar />
    </div>
  );
}

export default CartPage;
