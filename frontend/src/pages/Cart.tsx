import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi, userApi } from '@/services/api';
import { CartItem, UserAddress, Book } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

const Cart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
    is_default: false
  });

  const navigate = useNavigate();
  const { fetchCart, cartCount, cartSummary, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCartData();
  }, [isAuthenticated]);

  const fetchCartData = async () => {
    setLoading(true);
    try {
      const [cartResponse, addressResponse] = await Promise.all([
        cartApi.getCart(),
        userApi.getAddresses()
      ]);
      
      if (cartResponse.data.success && cartResponse.data.data) {
        setItems(cartResponse.data.data);
        fetchCart();
      }
      if (addressResponse.data.success && addressResponse.data.data) {
        setAddresses(addressResponse.data.data);
        const defaultAddr = addressResponse.data.data.find((a: UserAddress) => a.is_default);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    try {
      await cartApi.updateItem(itemId, { quantity });
      fetchCartData();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      fetchCartData();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.addAddress(newAddress);
      setShowAddressForm(false);
      setNewAddress({
        recipient: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail_address: '',
        is_default: false
      });
      fetchCartData();
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert('请选择收货地址');
      return;
    }
    if (items.length === 0) {
      alert('购物车为空');
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await cartApi.checkout({ address_id: selectedAddress });
      if (response.data.success) {
        alert('订单创建成功！');
        clearCart();
        navigate('/orders');
      } else {
        alert(response.data.message || '下单失败');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '下单失败，请重试');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const book = item.book as Book;
      const price = book?.discount_price || book?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title">购物车</h1>

      {items.length === 0 ? (
        <div className="card card-body">
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p className="empty-state-text">购物车是空的</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/books')}
            >
              去逛逛
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '300px' }}>
            <div className="card card-body">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                购物车商品 ({items.length})
              </h2>
              
              {items.map((item) => {
                const book = item.book as Book;
                if (!book) return null;
                const price = book.discount_price || book.price;
                
                return (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      padding: '1rem 0', 
                      borderBottom: '1px solid var(--border-color)' 
                    }}
                  >
                    <div 
                      style={{ 
                        width: '100px', 
                        height: '130px', 
                        background: 'linear-gradient(135deg, var(--bg-secondary), #e2e8f0)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      📖
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h3 
                        style={{ 
                          fontWeight: 'bold', 
                          cursor: 'pointer',
                          marginBottom: '0.5rem'
                        }}
                        onClick={() => navigate(`/books/${book.id}`)}
                      >
                        {book.title}
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {book.author} | {book.publisher}
                      </p>
                      <p style={{ color: 'var(--danger-color)', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                        ¥{price.toFixed(2)}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: '60px', textAlign: 'center' }}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                        />
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          style={{ marginLeft: '1rem', color: 'var(--danger-color)' }}
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>
                        ¥{(price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                收货地址
              </h2>
              
              {addresses.length > 0 ? (
                <>
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      style={{ 
                        padding: '0.75rem', 
                        border: selectedAddress === addr.id ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        background: selectedAddress === addr.id ? '#f0f9ff' : 'transparent'
                      }}
                      onClick={() => setSelectedAddress(addr.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong>{addr.recipient}</strong>
                        <span>{addr.phone}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {addr.province} {addr.city} {addr.district} {addr.detail_address}
                      </p>
                      {addr.is_default && (
                        <span style={{ 
                          background: 'var(--primary-color)', 
                          color: 'white', 
                          padding: '0.125rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          默认
                        </span>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                  暂无收货地址
                </p>
              )}

              {!showAddressForm ? (
                <button 
                  className="btn btn-outline w-full"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowAddressForm(true)}
                >
                  + 添加新地址
                </button>
              ) : (
                <form onSubmit={handleAddAddress} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">收货人 *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.recipient}
                      onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">手机号 *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">省</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.province}
                      onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">市</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">区</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.district}
                      onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">详细地址 *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.detail_address}
                      onChange={(e) => setNewAddress({ ...newAddress, detail_address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                      />
                      设为默认地址
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary w-full">
                      保存
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline w-full"
                      onClick={() => setShowAddressForm(false)}
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="card card-body">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                订单汇总
              </h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>商品数量</span>
                  <span>{cartCount} 件</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>商品总价</span>
                  <span>¥{calculateTotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>运费</span>
                  <span>¥0.00</span>
                </div>
              </div>
              
              <div style={{ 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>应付金额</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                    ¥{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                className="btn btn-primary w-full"
                style={{ fontSize: '1.125rem', padding: '0.875rem' }}
                onClick={handleCheckout}
                disabled={checkoutLoading || items.length === 0 || !selectedAddress}
              >
                {checkoutLoading ? '提交中...' : '提交订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
