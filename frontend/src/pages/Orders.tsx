import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '@/services/api';
import { Order, OrderStatus, PaginatedResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [pagination, setPagination] = useState<PaginatedResponse<Order>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, filter, pagination.page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize
      };
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await orderApi.getOrders(params);
      if (response.data.success && response.data.data) {
        setPagination(response.data.data);
        setOrders(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('确定要取消订单吗？')) return;
    
    try {
      const response = await orderApi.cancelOrder(orderId);
      if (response.data.success) {
        alert('订单已取消');
        fetchOrders();
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

  return (
    <div className="container section">
      <h1 className="section-title">我的订单</h1>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            className={filter === s ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => {
              setFilter(s);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            {s === 'all' ? '全部' : statusMap[s]?.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card card-body">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">暂无订单</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/books')}
            >
              去购物
            </button>
          </div>
        </div>
      ) : (
        <>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ marginBottom: '1rem' }}>
              <div 
                className="card-body"
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <span style={{ marginRight: '1rem' }}>
                    <strong>订单号：</strong>{order.order_no}
                  </span>
                  <span style={{ marginRight: '1rem' }}>
                    {new Date(order.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                <span style={{ 
                  color: statusMap[order.status]?.color,
                  fontWeight: 'bold'
                }}>
                  {statusMap[order.status]?.label}
                </span>
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
                        padding: '0.75rem 0',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '60px', 
                          height: '80px', 
                          background: 'linear-gradient(135deg, var(--bg-secondary), #e2e8f0)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/books/${item.book_id}`)}
                      >
                        📖
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 
                          style={{ fontWeight: '500', cursor: 'pointer', marginBottom: '0.25rem' }}
                          onClick={() => navigate(`/books/${item.book_id}`)}
                        >
                          {book.title}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          {book.author}
                        </p>
                        <p>
                          ¥{item.price.toFixed(2)} × {item.quantity}
                          <span style={{ float: 'right' }}>
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div 
                className="card-body"
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <span style={{ marginRight: '1rem' }}>
                    <strong>共 {order.items?.length || 0} 件商品</strong>
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    总价：
                  </span>
                  <span style={{ color: 'var(--danger-color)', fontSize: '1.125rem', fontWeight: 'bold' }}>
                    ¥{order.total_amount.toFixed(2)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    订单详情
                  </button>
                  {order.status === 'pending' && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      取消订单
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {pagination.totalPages > 1 && (
            <div className="pagination mt-8">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                上一页
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p, index, arr) => (
                  <button
                    key={p}
                    className={p === pagination.page ? 'active' : ''}
                    onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                  >
                    {p}
                  </button>
                ))}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Orders;
