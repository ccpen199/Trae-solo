import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrderDetail();
  }, [isAuthenticated, id]);

  const fetchOrderDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await orderApi.getOrder(Number(id));
      if (response.data.success && response.data.data) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm('确定要取消订单吗？')) return;
    
    try {
      const response = await orderApi.cancelOrder(order.id);
      if (response.data.success) {
        alert('订单已取消');
        fetchOrderDetail();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '取消失败');
    }
  };

  const statusMap: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: '待付款', color: '#f59e0b' },
    paid: { label: '已付款', color: '#3b82f6' },
    shipped: { label: '已发货', color: '#8b5cf6' },
    completed: { label: '已完成', color: '#10b981' },
    cancelled: { label: '已取消', color: '#ef4444' }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">订单不存在</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/orders')}
          >
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => navigate('/orders')}
        >
          ← 返回订单列表
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h1 className="section-title" style={{ marginBottom: 0, fontSize: '1.25rem' }}>
              订单详情
            </h1>
            <span style={{ 
              fontSize: '1.25rem',
              color: statusMap[order.status]?.color,
              fontWeight: 'bold'
            }}>
              {statusMap[order.status]?.label}
            </span>
          </div>
        </div>
        
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>订单号</p>
              <p style={{ fontWeight: 'bold' }}>{order.order_no}</p>
            </div>
            <div>
              <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>下单时间</p>
              <p>{new Date(order.created_at).toLocaleString('zh-CN')}</p>
            </div>
            {order.paid_at && (
              <div>
                <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>付款时间</p>
                <p>{new Date(order.paid_at).toLocaleString('zh-CN')}</p>
              </div>
            )}
            <div>
              <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>订单金额</p>
              <p style={{ color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                ¥{order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {order.address && (
        <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            收货地址
          </h2>
          <div style={{ 
            background: '#f8fafc', 
            padding: '1rem', 
            borderRadius: '8px' 
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{order.address.recipient}</strong> 
              <span style={{ marginLeft: '1rem', color: '#64748b' }}>
                {order.address.phone}
              </span>
            </p>
            <p style={{ color: '#475569' }}>
              {order.address.province} {order.address.city} {order.address.district} {order.address.detail_address}
            </p>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            商品信息 ({order.items?.length || 0} 件)
          </h2>
        </div>
        
        <div className="card-body">
          {order.items?.map((item) => {
            const book = item.book as any;
            if (!book) return null;
            
            return (
              <div 
                key={item.id}
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1rem 0',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div 
                  style={{ 
                    width: '80px', 
                    height: '100px', 
                    background: 'linear-gradient(135deg, var(--bg-secondary), #e2e8f0)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/books/${item.book_id}`)}
                >
                  📖
                </div>
                <div style={{ flex: 1 }}>
                  <h3 
                    style={{ fontWeight: 'bold', cursor: 'pointer', marginBottom: '0.5rem' }}
                    onClick={() => navigate(`/books/${item.book_id}`)}
                  >
                    {book.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    {book.author} | {book.publisher}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
                        ¥{item.price.toFixed(2)}
                      </span>
                      <span style={{ margin: '0 0.5rem' }}>×</span>
                      <span>{item.quantity}</span>
                    </div>
                    <span style={{ color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '1.125rem' }}>
                      ¥{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card card-body">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>商品总价：</span>
              <span>¥{order.total_amount.toFixed(2)}</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>运费：</span>
              <span>¥0.00</span>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              <span>应付金额：</span>
              <span style={{ color: 'var(--danger-color)', fontSize: '1.5rem' }}>
                ¥{order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {order.status === 'pending' && (
              <button 
                className="btn btn-danger"
                onClick={handleCancelOrder}
              >
                取消订单
              </button>
            )}
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/books')}
            >
              继续购物
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
